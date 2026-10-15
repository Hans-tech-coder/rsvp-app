'use server';

import { revalidatePath } from 'next/cache';
import type { DocumentReference, DocumentSnapshot, Firestore, Transaction } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireEventRole } from '@/lib/requireAdmin';
import { logActivity } from '@/lib/auditLog';
import { canEditDesign, canEditDoc, keepsScreenOrder } from '@/lib/permissions';
import { DEFAULT_EVENT_ID, isValidEventId, paths } from '@/lib/eventPaths';
import {
  addVersion, isEditableDocId, isSameDraft, nextDraftData, seedVersions, toPlain, versionInfo,
  type DocData, type DraftDoc, type StoredVersion, type VersionInfo,
} from '@/lib/contentDrafts';

// Draft / publish / versions for the content editors (F9). Editors no longer
// write `content/*` from the browser: they save a draft here, and Publish
// copies it to the live doc. Shapes and paths: src/lib/contentDrafts.ts.
// Every member of the event may read; saving, publishing and discarding
// follow the role's locks (src/lib/permissions.ts).

type Fail = { success: false; error: string };

export type DraftState = {
  /** The doc the editor shows: the draft, else the live doc, else null (defaults). */
  data: DocData | null;
  hasDraft: boolean;
  /** The draft's `updatedAt` (null = no draft); sent back on save to spot edits made elsewhere. */
  updatedAt: number | null;
  versions: VersionInfo[];
};

export type SaveDraftResult =
  | { success: true; updatedAt: number; versions: VersionInfo[] }
  | { success: false; conflict: { updatedAt: number | null; updatedBy: string | null } }
  | Fail;

function check(eventId: string, docId: string) {
  if (!isValidEventId(eventId)) throw new Error('Invalid event');
  if (!isEditableDocId(docId)) throw new Error('Invalid content doc');
}

/** A member who may change this doc; throws otherwise. */
async function requireDocEdit(eventId: string, docId: string) {
  const access = await requireEventRole(eventId);
  check(eventId, docId);
  if (!canEditDoc(access, docId)) throw new Error('Your role cannot change this part of the site.');
  return access;
}

function refs(db: Firestore, eventId: string, docId: string) {
  return {
    live: db.doc(paths.content(eventId, docId)),
    draft: db.doc(paths.draft(eventId, docId)),
    versions: db.doc(paths.contentVersions(eventId, docId)),
    backup: db.doc(paths.content(eventId, `${docId}_backup`)),
  };
}

const dataOf = (snap: DocumentSnapshot) => (snap.exists ? toPlain(snap.data() as DocData) : null);
const draftOf = (snap: DocumentSnapshot) => (snap.exists ? toPlain(snap.data() as DraftDoc) : null);

/** The stored versions, or (before the first publish) the live doc and the old `_backup`. */
async function readVersions(get: (ref: DocumentReference) => Promise<DocumentSnapshot>, r: ReturnType<typeof refs>, live: DocData | null) {
  const snap = await get(r.versions);
  if (snap.exists) return { items: (snap.get('items') ?? []) as StoredVersion[], stored: true };
  return { items: seedVersions(live, dataOf(await get(r.backup))), stored: false };
}

/**
 * Rebuilds the event's cached guest page (content, title, link preview) on its
 * next visit. The 404 page shows the default event, so publishing that event
 * refreshes the whole site.
 */
function refreshGuestSite(eventId: string) {
  if (eventId === DEFAULT_EVENT_ID) revalidatePath('/', 'layout');
  else revalidatePath(`/${eventId}`);
}

export async function loadDraft(eventId: string, docId: string): Promise<({ success: true } & DraftState) | Fail> {
  try {
    await requireEventRole(eventId);
    check(eventId, docId);
    const db = getAdminDb();
    const r = refs(db, eventId, docId);
    const [liveSnap, draftSnap] = await db.getAll(r.live, r.draft);
    const live = dataOf(liveSnap);
    const draft = draftOf(draftSnap);
    const { items } = await readVersions((ref) => ref.get(), r, live);
    return {
      success: true,
      data: draft?.data ?? live,
      hasDraft: !!draft,
      updatedAt: draft?.updatedAt ?? null,
      versions: versionInfo(items, live),
    };
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Failed to load' };
  }
}

/**
 * Saves the editor's doc as the draft (never live). `merge` editors send only
 * their fields; they are merged over the draft (else the live doc) so the
 * draft is always the whole doc. Refused with `conflict` when the draft
 * changed since `expectedUpdatedAt`, unless `force`.
 */
export async function saveDraft(
  eventId: string,
  docId: string,
  data: DocData,
  options: { merge: boolean; expectedUpdatedAt: number | null; force?: boolean },
): Promise<SaveDraftResult> {
  try {
    const admin = await requireDocEdit(eventId, docId);
    const db = getAdminDb();
    const r = refs(db, eventId, docId);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('Invalid content');
    const plain = toPlain(data);

    return await db.runTransaction(async (tx: Transaction): Promise<SaveDraftResult> => {
      const [liveSnap, draftSnap] = await tx.getAll(r.live, r.draft);
      const draft = draftOf(draftSnap);
      if (!options.force && !isSameDraft(draft, options.expectedUpdatedAt)) {
        return { success: false, conflict: { updatedAt: draft?.updatedAt ?? null, updatedBy: draft?.updatedBy ?? null } };
      }
      const live = dataOf(liveSnap);
      const { items } = await readVersions((ref) => tx.get(ref), r, live);
      // Strictly increasing, so two quick saves never share an updatedAt.
      const updatedAt = Math.max(Date.now(), (draft?.updatedAt ?? 0) + 1);
      const nextData = nextDraftData(plain, options.merge, draft, live);
      // Without design rights a member may show, hide and rename sections, not reorder them.
      if (docId === 'screens' && !canEditDesign(admin) && !keepsScreenOrder(nextData, draft?.data ?? live)) {
        throw new Error('Your role cannot change the order of the sections.');
      }
      const next: DraftDoc = { data: nextData, updatedAt, updatedBy: admin.email };
      tx.set(r.draft, next);
      return { success: true, updatedAt, versions: versionInfo(items, live) };
    });
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Failed to save the draft' };
  }
}

/** Copies the draft over the live doc, records the version, deletes the draft and refreshes the guest site. */
export async function publishDraft(eventId: string, docId: string): Promise<({ success: true; versions: VersionInfo[] }) | Fail> {
  try {
    const admin = await requireDocEdit(eventId, docId);
    const db = getAdminDb();
    const r = refs(db, eventId, docId);

    const versions = await db.runTransaction(async (tx) => {
      const [liveSnap, draftSnap] = await tx.getAll(r.live, r.draft);
      const draft = draftOf(draftSnap);
      if (!draft) throw new Error('Nothing to publish');
      const { items } = await readVersions((ref) => tx.get(ref), r, dataOf(liveSnap));
      const next = addVersion(items, {
        id: String(draft.updatedAt),
        publishedAt: Date.now(),
        publishedBy: admin.email,
        data: draft.data,
      });
      tx.set(r.live, draft.data);
      tx.set(r.versions, { items: next });
      tx.delete(r.draft);
      return versionInfo(next, draft.data);
    });

    refreshGuestSite(eventId);
    await logActivity(eventId, admin, 'Published', docId);
    return { success: true, versions };
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Failed to publish' };
  }
}

/** Drops the draft; the editor goes back to the live doc. */
export async function discardDraft(eventId: string, docId: string): Promise<({ success: true } & DraftState) | Fail> {
  try {
    const admin = await requireDocEdit(eventId, docId);
    await getAdminDb().doc(paths.draft(eventId, docId)).delete();
    await logActivity(eventId, admin, 'Discarded the draft', docId);
    return await loadDraft(eventId, docId);
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Failed to discard the draft' };
  }
}

/** One version's doc, for Restore (the editor loads it into the form). */
export async function getVersion(eventId: string, docId: string, versionId: string): Promise<({ success: true; data: DocData }) | Fail> {
  try {
    await requireEventRole(eventId);
    check(eventId, docId);
    const db = getAdminDb();
    const r = refs(db, eventId, docId);
    const { items } = await readVersions((ref) => ref.get(), r, dataOf(await r.live.get()));
    const version = items.find((v) => v.id === versionId);
    if (!version) throw new Error('Version not found');
    return { success: true, data: toPlain(version.data) };
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Failed to load the version' };
  }
}
