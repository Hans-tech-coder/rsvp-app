'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { DEFAULT_EVENT_ID, isFreeEventId, isValidEventId, paths } from '@/lib/eventPaths';
import { ADMIN_EVENT_COOKIE, ADMIN_EVENT_COOKIE_OPTIONS, getAdmin, requireEventRole, type AdminSession } from '@/lib/requireAdmin';
import { canCreateEvents, copyEventData, moveEventAccounts } from '@/lib/platformEvents';
import { logActivity } from '@/lib/auditLog';
import { buildTemplateDocs, checkNewEventDetails } from '@/lib/templates';
import { TEMPLATES } from '@/lib/templates/catalog';

// The platform's events (F11), for the events list (src/app/admin/page.tsx).
// Who may do what:
//   create          owners, and organizers of any event (they join the new event as its organizer);
//                   the event starts from a template (src/lib/templates) filled with the wizard's answers
//   duplicate       organizers of the event copied (copies its site: content + invite message + client design switch)
//   change link     organizers of the event (moves everything to the new ID; the old URL stops working)
//   archive/restore organizers of the event (an archived event's guest page is a 404)
//   delete          owners only
// The default event (`/` redirects to it) cannot be renamed, archived or deleted.

type Fail = { success: false; error: string };

const MAX_NAME = 80;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

const alreadyExists = (error: unknown) => (error as { code?: unknown } | null)?.code === 6;

function checkName(raw: string): string | Fail {
  const name = String(raw ?? '').trim();
  if (!name) return { success: false, error: 'Give the event a name.' };
  if (name.length > MAX_NAME) return { success: false, error: `Keep the name under ${MAX_NAME} characters.` };
  return name;
}

function checkNewId(raw: string): string | Fail {
  const eventId = String(raw ?? '').trim();
  if (!isValidEventId(eventId)) {
    return { success: false, error: 'Use lowercase letters, numbers and hyphens for the link (no hyphen at the start or end).' };
  }
  if (!isFreeEventId(eventId)) return { success: false, error: 'That link is used by the site itself. Pick another.' };
  return eventId;
}

/** Owners, and organizers of at least one event. */
async function requireCreator(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin || !(await canCreateEvents(admin))) throw new Error('Unauthorized');
  return admin;
}

/**
 * Writes the new `events/{eventId}` doc (and `content`, its live content
 * docs), failing when the ID is taken. A creator who is not an owner becomes
 * the event's organizer.
 */
async function claimEvent(me: AdminSession, eventId: string, fields: Record<string, unknown>, content: Record<string, DocumentData> = {}) {
  const db = getAdminDb();
  const batch = db.batch();
  batch.create(db.doc(paths.event(eventId)), {
    slug: eventId,
    status: 'active',
    ...fields,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: me.uid,
  });
  for (const [docId, data] of Object.entries(content)) {
    batch.create(db.doc(paths.content(eventId, docId)), data);
  }
  if (!me.isOwner) {
    batch.create(db.doc(paths.member(eventId, me.uid)), {
      email: me.email,
      role: 'organizer',
      addedAt: FieldValue.serverTimestamp(),
      addedBy: me.uid,
    });
    batch.update(db.doc(paths.admin(me.uid)), { eventIds: FieldValue.arrayUnion(eventId) });
  }
  await batch.commit();
}

/** Undoes claimEvent after a failed copy. */
async function dropEvent(me: AdminSession, eventId: string) {
  const db = getAdminDb();
  await db.recursiveDelete(db.doc(paths.event(eventId)));
  if (!me.isOwner) await db.doc(paths.admin(me.uid)).update({ eventIds: FieldValue.arrayRemove(eventId) });
}

/** A cached guest page (or a cached 404) of this URL is rebuilt on its next visit. */
function refreshGuestPage(eventId: string) {
  revalidatePath(`/${eventId}`);
}

/**
 * A new event from a template (the New Event wizard, src/app/admin/new): the
 * template's content with the names, date, venue and palette filled in,
 * written as the live site. `details`: `NewEventDetails` in src/lib/templates.
 */
export async function createEvent(details: unknown, rawId: string): Promise<{ success: true; eventId: string } | Fail> {
  try {
    const me = await requireCreator();
    const checked = checkNewEventDetails(details);
    if (typeof checked === 'string') return { success: false, error: checked };
    const eventId = checkNewId(rawId);
    if (typeof eventId !== 'string') return eventId;
    const { name, type } = checked;

    try {
      await claimEvent(me, eventId, { name, type }, buildTemplateDocs(checked));
    } catch (error) {
      if (alreadyExists(error)) return { success: false, error: 'That link is taken. Pick another.' };
      throw error;
    }
    refreshGuestPage(eventId);
    await logActivity(eventId, me, 'Created the event', `${name}, from the ${TEMPLATES[type].name} template`);
    return { success: true, eventId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to create the event') };
  }
}

/** A new event with a copy of another event's site. Its guests, gifts, drafts, team and log stay behind. */
export async function duplicateEvent(sourceId: string, rawName: string, rawId: string): Promise<{ success: true; eventId: string } | Fail> {
  try {
    await requireEventRole(sourceId, 'organizer');
    const me = await requireCreator();
    const name = checkName(rawName);
    if (typeof name !== 'string') return name;
    const eventId = checkNewId(rawId);
    if (typeof eventId !== 'string') return eventId;

    const db = getAdminDb();
    const source = await db.doc(paths.event(sourceId)).get();
    if (!source.exists) return { success: false, error: 'That event no longer exists.' };

    try {
      await claimEvent(me, eventId, { name, type: source.get('type') ?? 'wedding', duplicatedFrom: sourceId });
    } catch (error) {
      if (alreadyExists(error)) return { success: false, error: 'That link is taken. Pick another.' };
      throw error;
    }
    try {
      await copyEventData(sourceId, eventId, false);
    } catch (error) {
      await dropEvent(me, eventId);
      throw error;
    }
    refreshGuestPage(eventId);
    await logActivity(eventId, me, 'Created the event', `${name}, a copy of ${sourceId}`);
    return { success: true, eventId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to duplicate the event') };
  }
}

/**
 * Changes an event's link (its ID): copies every doc to the new ID, moves the
 * team's accounts and invites, then deletes the old ID. The old URL becomes a
 * 404, so do it before invitations go out. An RSVP sent during the move may be lost.
 */
export async function renameEvent(eventId: string, rawNewId: string): Promise<{ success: true; eventId: string } | Fail> {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    if (eventId === DEFAULT_EVENT_ID) return { success: false, error: 'The main event’s link cannot change: the site’s home page opens it.' };
    const newId = checkNewId(rawNewId);
    if (typeof newId !== 'string') return newId;
    if (newId === eventId) return { success: false, error: 'That is already the link.' };

    const db = getAdminDb();
    const oldRef = db.doc(paths.event(eventId));
    const event = await oldRef.get();
    if (!event.exists) return { success: false, error: 'That event no longer exists.' };

    try {
      await db.doc(paths.event(newId)).create({ ...event.data(), slug: newId, renamedFrom: eventId });
    } catch (error) {
      if (alreadyExists(error)) return { success: false, error: 'That link is taken. Pick another.' };
      throw error;
    }
    try {
      await copyEventData(eventId, newId, true);
    } catch (error) {
      await db.recursiveDelete(db.doc(paths.event(newId)));
      throw error;
    }
    await moveEventAccounts(eventId, newId);
    await db.recursiveDelete(oldRef);

    const cookieStore = await cookies();
    if (cookieStore.get(ADMIN_EVENT_COOKIE)?.value === eventId) {
      cookieStore.set(ADMIN_EVENT_COOKIE, newId, ADMIN_EVENT_COOKIE_OPTIONS);
    }
    refreshGuestPage(eventId);
    refreshGuestPage(newId);
    await logActivity(newId, me, 'Changed the link', `/${eventId} to /${newId}`);
    return { success: true, eventId: newId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to change the link') };
  }
}

/** Archived: the guest page is a 404 and the event moves to the bottom of the list. Restoring brings it back. */
export async function setEventArchived(eventId: string, archived: boolean): Promise<{ success: true } | Fail> {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    if (archived && eventId === DEFAULT_EVENT_ID) return { success: false, error: 'The main event cannot be archived: the site’s home page opens it.' };
    await getAdminDb().doc(paths.event(eventId)).update({ status: archived ? 'archived' : 'active' });
    refreshGuestPage(eventId);
    await logActivity(eventId, me, archived ? 'Archived the event' : 'Restored the event');
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to save') };
  }
}

/**
 * Deletes the event and everything in it (content, drafts, guests, RSVPs,
 * gifts, team, log). Owners only; `confirmId` must repeat the event's link.
 * Uploaded images stay in Blob storage (F13).
 */
export async function deleteEvent(eventId: string, confirmId: string): Promise<{ success: true } | Fail> {
  try {
    await requireEventRole(eventId, 'owner');
    if (eventId === DEFAULT_EVENT_ID) return { success: false, error: 'The main event cannot be deleted: the site’s home page opens it.' };
    if (String(confirmId ?? '').trim() !== eventId) return { success: false, error: 'Type the event’s link exactly to delete it.' };

    const db = getAdminDb();
    await moveEventAccounts(eventId, null);
    await db.recursiveDelete(db.doc(paths.event(eventId)));

    const cookieStore = await cookies();
    if (cookieStore.get(ADMIN_EVENT_COOKIE)?.value === eventId) cookieStore.delete(ADMIN_EVENT_COOKIE);
    refreshGuestPage(eventId);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to delete the event') };
  }
}
