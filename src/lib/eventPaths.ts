// Every Firestore path in the app is built here; no other file names a
// collection. Plain strings, so the browser SDK (`doc(db, path)`) and the admin
// SDK (`db.doc(path)` / `db.collection(path)`) both use them.
//
// Event data lives under `events/{eventId}`:
//   content/{doc}        screen text and images (+ `<doc>_backup`)
//   guests/{inviteCode}  invite codes and RSVPs (codes are unique per event)
//   registryGifts/{id}
//   giftSelections/{id}
//   settings/{doc}       e.g. `inviteTemplate`
// Admin accounts stay global (`admins`, `adminAllowlist`) until per-event roles.

const EVENT_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

/** Lowercase letters, digits and inner hyphens, at most 64 characters. */
export function isValidEventId(eventId: unknown): eventId is string {
  return typeof eventId === 'string' && EVENT_ID.test(eventId);
}

/**
 * The event `/` redirects to, and the one the admin edits until the event
 * switcher (F11). The event ID is also its URL: `site.com/<eventId>`.
 * Override with NEXT_PUBLIC_DEFAULT_EVENT_ID (read at build time).
 */
export const DEFAULT_EVENT_ID = isValidEventId(process.env.NEXT_PUBLIC_DEFAULT_EVENT_ID)
  ? process.env.NEXT_PUBLIC_DEFAULT_EVENT_ID
  : 'hans-and-czay';

// A slash in an ID would point the path at another document.
function segment(id: string): string {
  if (typeof id !== 'string' || id === '' || id.includes('/')) throw new Error('Invalid document ID');
  return id;
}

function event(eventId: string): string {
  if (!isValidEventId(eventId)) throw new Error('Invalid event');
  return `events/${eventId}`;
}

export const paths = {
  event,
  content: (eventId: string, docId: string) => `${event(eventId)}/content/${segment(docId)}`,
  guests: (eventId: string) => `${event(eventId)}/guests`,
  guest: (eventId: string, inviteCode: string) => `${event(eventId)}/guests/${segment(inviteCode)}`,
  registryGifts: (eventId: string) => `${event(eventId)}/registryGifts`,
  registryGift: (eventId: string, giftId: string) => `${event(eventId)}/registryGifts/${segment(giftId)}`,
  giftSelections: (eventId: string) => `${event(eventId)}/giftSelections`,
  giftSelection: (eventId: string, selectionId: string) => `${event(eventId)}/giftSelections/${segment(selectionId)}`,
  setting: (eventId: string, docId: string) => `${event(eventId)}/settings/${segment(docId)}`,
  admins: () => 'admins',
  admin: (uid: string) => `admins/${segment(uid)}`,
  adminAllowlist: () => 'adminAllowlist',
  adminAllowlistEntry: (email: string) => `adminAllowlist/${segment(email)}`,
};
