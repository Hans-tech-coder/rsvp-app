// Every Firestore path in the app is built here; no other file names a
// collection. Plain strings, so the browser SDK (`doc(db, path)`) and the admin
// SDK (`db.doc(path)` / `db.collection(path)`) both use them.
//
// Event data lives under `events/{eventId}`:
//   content/{doc}        screen text and images, live (+ old `<doc>_backup`)
//   drafts/{doc}         unpublished edits of a content doc (F9)
//   contentVersions/{doc} last published versions of a content doc (F9)
//   guests/{inviteCode}  invite codes and RSVPs (codes are unique per event)
//   registryGifts/{id}
//   giftSelections/{id}
//   settings/{doc}       e.g. `inviteTemplate`, `permissions`, `editLock`
//   members/{uid}        the event's team: role `organizer` | `client` (F10)
//   auditLog/{id}        who changed what, when (F10)
// Accounts stay global: `admins/{uid}` (sign-in; `role: 'super'` = platform
// owner) and `adminAllowlist/{email}` (pending invites).

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
  draft: (eventId: string, docId: string) => `${event(eventId)}/drafts/${segment(docId)}`,
  contentVersions: (eventId: string, docId: string) => `${event(eventId)}/contentVersions/${segment(docId)}`,
  guests: (eventId: string) => `${event(eventId)}/guests`,
  guest: (eventId: string, inviteCode: string) => `${event(eventId)}/guests/${segment(inviteCode)}`,
  registryGifts: (eventId: string) => `${event(eventId)}/registryGifts`,
  registryGift: (eventId: string, giftId: string) => `${event(eventId)}/registryGifts/${segment(giftId)}`,
  giftSelections: (eventId: string) => `${event(eventId)}/giftSelections`,
  giftSelection: (eventId: string, selectionId: string) => `${event(eventId)}/giftSelections/${segment(selectionId)}`,
  setting: (eventId: string, docId: string) => `${event(eventId)}/settings/${segment(docId)}`,
  members: (eventId: string) => `${event(eventId)}/members`,
  member: (eventId: string, uid: string) => `${event(eventId)}/members/${segment(uid)}`,
  auditLog: (eventId: string) => `${event(eventId)}/auditLog`,
  admins: () => 'admins',
  admin: (uid: string) => `admins/${segment(uid)}`,
  adminAllowlist: () => 'adminAllowlist',
  adminAllowlistEntry: (email: string) => `adminAllowlist/${segment(email)}`,
};
