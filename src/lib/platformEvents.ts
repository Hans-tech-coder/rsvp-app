import { FieldPath, FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { DEFAULT_EVENT_ID, paths } from '@/lib/eventPaths';
import { getEventAccess, type AdminSession } from '@/lib/requireAdmin';
import { formatEventDate } from '@/lib/siteContentServer';
import { mergeGlobal } from '@/lib/weddingContent';
import { EVENT_ROLES, hasRole, type AccessRole } from '@/lib/permissions';

// Server-only. The platform's events (F11) for the events list (/admin) and
// the sidebar switcher, and the copies behind Duplicate and Change link.
// An event is the doc `events/{eventId}`: `slug` (= the ID, = the URL),
// `name`, `type`, `status` ('active' | 'archived'), `createdAt`, `createdBy`,
// for a copy `duplicatedFrom`, and `siteName` (the site's `coupleNameFormat`,
// written on each globalSettings publish so the switcher need not read it).

export type EventStatus = 'active' | 'archived';

/** One event in the sidebar switcher. */
export type EventChoice = { id: string; name: string; archived: boolean };

/** One row of the events list. */
export type EventSummary = EventChoice & {
  type: string;
  role: AccessRole;
  isDefault: boolean;
  /** The event date the guest site shows, e.g. "December 20, 2026". */
  date: string;
  createdAt: string | null;
  /** Null when the counts could not be read. */
  rsvp: { invites: number; responded: number; attending: number; notAttending: number } | null;
};

type EventDoc = { id: string; data: FirebaseFirestore.DocumentData; role: AccessRole };

/** The events the account may open: every event for an owner, else its memberships. */
async function readMyEvents(admin: AdminSession): Promise<EventDoc[]> {
  const db = getAdminDb();
  if (admin.isOwner) {
    const snap = await db.collection(paths.events()).get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data(), role: 'owner' }));
  }
  if (admin.eventIds.length === 0) return [];
  const docs = await db.getAll(...admin.eventIds.map((id) => db.doc(paths.event(id))));
  const events = await Promise.all(
    docs.map(async (doc) => {
      const access = doc.exists ? await getEventAccess(doc.id) : null;
      return access ? { id: doc.id, data: doc.data() ?? {}, role: access.role } : null;
    }),
  );
  return events.filter((e): e is EventDoc => e !== null);
}

/** The name an event is listed by: its own, else the names on its site, else its ID. */
function eventName(data: FirebaseFirestore.DocumentData, globalDoc: FirebaseFirestore.DocumentData | undefined, id: string) {
  const own = typeof data.name === 'string' ? data.name.trim() : '';
  const site = hasSiteName(data) ? data.siteName.trim()
    : typeof globalDoc?.coupleNameFormat === 'string' ? globalDoc.coupleNameFormat.trim() : '';
  return own || site || id;
}

/** The event doc holds its site's name (set on a globalSettings publish; older docs lack it). */
const hasSiteName = (data: FirebaseFirestore.DocumentData) => typeof data.siteName === 'string';

/** Whether eventName needs the event's globalSettings doc. */
const needsGlobal = (data: FirebaseFirestore.DocumentData) =>
  !(typeof data.name === 'string' && data.name.trim()) && !hasSiteName(data);

const byName = (a: EventChoice, b: EventChoice) =>
  Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name);

async function readGlobals(db: Firestore, events: EventDoc[]) {
  if (events.length === 0) return [];
  const docs = await db.getAll(...events.map((e) => db.doc(paths.content(e.id, 'globalSettings'))));
  return docs.map((doc) => doc.data());
}

/** Owners, and organizers of at least one event, may create events (New event, Duplicate). */
export async function canCreateEvents(admin: AdminSession): Promise<boolean> {
  if (admin.isOwner) return true;
  const roles = await Promise.all(admin.eventIds.map((id) => getEventAccess(id)));
  return roles.some((access) => access !== null && hasRole(access.role, 'organizer'));
}

/**
 * For the sidebar switcher (every admin page). Reads the event docs, and
 * globalSettings only for old docs with neither a name nor a site name.
 */
export async function listEventChoices(admin: AdminSession): Promise<EventChoice[]> {
  const events = await readMyEvents(admin);
  const missing = events.filter((e) => needsGlobal(e.data));
  const globals = new Map((await readGlobals(getAdminDb(), missing)).map((doc, i) => [missing[i].id, doc]));
  return events
    .map((e) => ({ id: e.id, name: eventName(e.data, globals.get(e.id), e.id), archived: e.data.status === 'archived' }))
    .sort(byName);
}

/** An event's RSVP counts (4 count queries, one read each per 1000 guests); null when they could not be read. */
export async function countRsvps(db: Firestore, eventId: string): Promise<EventSummary['rsvp']> {
  try {
    const guests = db.collection(paths.guests(eventId));
    const count = async (query: FirebaseFirestore.Query) => (await query.count().get()).data().count;
    const [invites, responded, attending, notAttending] = await Promise.all([
      count(guests),
      count(guests.where('codeStatus', '==', 'used')),
      count(guests.where('willAttend', '==', 'Yes')),
      count(guests.where('willAttend', '==', 'No')),
    ]);
    return { invites, responded, attending, notAttending };
  } catch (error) {
    console.error(`RSVP counts failed (${eventId}):`, error);
    return null;
  }
}

/** For the events list: each event with its date and RSVP counts (count queries, one read per 1000 guests). */
export async function listEventSummaries(admin: AdminSession): Promise<EventSummary[]> {
  const db = getAdminDb();
  const events = await readMyEvents(admin);
  const globals = await readGlobals(db, events);
  const summaries = await Promise.all(
    events.map(async (e, i): Promise<EventSummary> => ({
      id: e.id,
      name: eventName(e.data, globals[i], e.id),
      archived: e.data.status === 'archived',
      type: typeof e.data.type === 'string' ? e.data.type : 'wedding',
      role: e.role,
      isDefault: e.id === DEFAULT_EVENT_ID,
      date: formatEventDate(mergeGlobal(globals[i]).targetDate),
      createdAt: e.data.createdAt instanceof Timestamp ? e.data.createdAt.toDate().toISOString() : null,
      rsvp: await countRsvps(db, e.id),
    })),
  );
  return summaries.sort(byName);
}

/** Subcollections a duplicate starts with: the site itself, not its guests, gifts, drafts, team or log. */
const DUPLICATED = { content: null, settings: ['inviteTemplate', 'permissions'] } as const;

/**
 * Copies an event's subcollections into another event ID. `all` copies every
 * subcollection (Change link); otherwise only what a duplicate starts with.
 * Creates only, so it never overwrites an existing doc. Returns the number of docs copied.
 */
export async function copyEventData(from: string, to: string, all: boolean): Promise<number> {
  const db = getAdminDb();
  const source = db.doc(paths.event(from));
  const target = db.doc(paths.event(to));
  const collections = all
    ? (await source.listCollections()).map((c) => c.id)
    : Object.keys(DUPLICATED);

  const writer = db.bulkWriter();
  const failures: unknown[] = [];
  let copied = 0;
  for (const name of collections) {
    const only: readonly string[] | null = all ? null : DUPLICATED[name as keyof typeof DUPLICATED];
    const snap = await source.collection(name).get();
    for (const doc of snap.docs) {
      if (only && !only.includes(doc.id)) continue;
      writer.create(target.collection(name).doc(doc.id), doc.data()).catch((error) => failures.push(error));
      copied += 1;
    }
  }
  await writer.close();
  if (failures.length > 0) throw failures[0];
  return copied;
}

/**
 * Moves the event's members and pending invites from one event ID to another
 * (Change link), or drops them (`to` null, Delete), so every account's
 * `eventIds` and every `adminAllowlist` entry stays in step with `members`.
 * An account or invite left with no event is kept (it can no longer sign in
 * to anything); deleting accounts is the Team page's job.
 */
export async function moveEventAccounts(from: string, to: string | null) {
  const db = getAdminDb();
  const [members, invites] = await Promise.all([
    db.collection(paths.members(from)).get(),
    db.collection(paths.adminAllowlist()).where(new FieldPath('events', from), 'in', [...EVENT_ROLES]).get(),
  ]);
  const accounts = members.empty ? [] : await db.getAll(...members.docs.map((m) => db.doc(paths.admin(m.id))));

  const batch = db.batch();
  for (const account of accounts) {
    if (!account.exists) continue;
    const ids: unknown = account.get('eventIds');
    const kept = Array.isArray(ids) ? ids.filter((id) => id !== from && id !== to) : [];
    batch.update(account.ref, { eventIds: to ? [...kept, to] : kept });
  }
  for (const invite of invites.docs) {
    const role = invite.get(new FieldPath('events', from));
    if (to) batch.update(invite.ref, new FieldPath('events', from), FieldValue.delete(), new FieldPath('events', to), role);
    else batch.update(invite.ref, new FieldPath('events', from), FieldValue.delete());
  }
  await batch.commit();
}
