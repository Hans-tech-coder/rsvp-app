// Drafts and published versions of the event's content docs (F9). Pure helpers
// shared by the server actions (src/app/actions/content.ts) and their tests.
//
//   events/{eventId}/content/{doc}          live: what guests see
//   events/{eventId}/drafts/{doc}           { data, updatedAt, updatedBy }: the
//                                           whole doc as it will be published
//   events/{eventId}/contentVersions/{doc}  { items: StoredVersion[] }, newest
//                                           first, the last MAX_VERSIONS publishes
//
// Editors save to the draft; Publish copies the draft over the live doc and
// deletes the draft (no draft = nothing unpublished).

import { CONTENT_DOC_IDS } from './weddingContent';

export type DocData = Record<string, unknown>;

/** Every content doc an editor saves. */
export const EDITABLE_DOC_IDS = [...CONTENT_DOC_IDS, 'siteText', 'theme', 'music', 'screens'] as const;
export type EditableDocId = (typeof EDITABLE_DOC_IDS)[number];

export function isEditableDocId(id: unknown): id is EditableDocId {
  return typeof id === 'string' && (EDITABLE_DOC_IDS as readonly string[]).includes(id);
}

export const MAX_VERSIONS = 10;
/** Firestore's doc limit is 1 MiB; older versions are dropped to stay under this. */
const MAX_VERSIONS_BYTES = 900_000;

export type StoredVersion = {
  id: string;
  /** ms since epoch; null for a version kept from before drafts existed. */
  publishedAt: number | null;
  publishedBy: string | null;
  /** Shown instead of a date for the kept-from-before entries. */
  label?: string;
  data: DocData;
};

/** What the editor's History list gets (no doc data). */
export type VersionInfo = Omit<StoredVersion, 'data'> & { live: boolean };

export type DraftDoc = { data: DocData; updatedAt: number; updatedBy: string | null };

function isPlainObject(value: unknown): value is DocData {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * The doc `set(base, patch, { merge: true })` would leave in Firestore: maps
 * are merged key by key, every other value (arrays included) is replaced.
 * Editors that used to save with `merge` still do, so the draft stays the
 * whole doc.
 */
export function mergeDoc(base: DocData, patch: DocData): DocData {
  const out: DocData = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? mergeDoc(out[key] as DocData, value) : value;
  }
  return out;
}

/** Plain JSON only: Firestore Timestamps and the like become strings / plain objects. */
export function toPlain<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/** JSON with sorted keys, so two docs compare equal whatever their key order. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * True when a save may overwrite the draft: the draft is still the one the
 * editor loaded (same `updatedAt`, or still none). Otherwise it was saved or
 * published from another tab or by another admin since.
 */
export function isSameDraft(current: { updatedAt: number } | null, expectedUpdatedAt: number | null): boolean {
  return (current?.updatedAt ?? null) === expectedUpdatedAt;
}

/** The draft after a save: the editor's doc, merged over the draft (else live) for `merge` editors. */
export function nextDraftData(data: DocData, merge: boolean, draft: DraftDoc | null, live: DocData | null): DocData {
  return merge ? mergeDoc(draft?.data ?? live ?? {}, data) : data;
}

/**
 * The version list before any publish: the live doc and the editor's old
 * `<doc>_backup`, so Restore still reaches what the single backup kept.
 */
export function seedVersions(live: DocData | null, backup: DocData | null): StoredVersion[] {
  const items: StoredVersion[] = [];
  if (live) items.push({ id: 'before-drafts', publishedAt: null, publishedBy: null, label: 'Before drafts', data: live });
  if (backup) items.push({ id: 'old-backup', publishedAt: null, publishedBy: null, label: 'Older backup', data: backup });
  return items;
}

/** Adds a publish on top, keeps the newest MAX_VERSIONS that fit in one doc. */
export function addVersion(items: StoredVersion[], version: StoredVersion): StoredVersion[] {
  const next = [version, ...items.filter((v) => v.id !== version.id)].slice(0, MAX_VERSIONS);
  while (next.length > 1 && JSON.stringify(next).length > MAX_VERSIONS_BYTES) next.pop();
  return next;
}

export function versionInfo(items: StoredVersion[], live: DocData | null): VersionInfo[] {
  const liveJson = live ? stableStringify(live) : null;
  return items.map(({ data, ...info }, i) => ({ ...info, live: i === 0 && liveJson !== null && stableStringify(data) === liveJson }));
}
