// Who may do what in an event (F10). Pure: the server checks it in every
// admin action (src/lib/requireAdmin.ts, src/app/actions/*), and the admin UI
// reads the same rules to hide what a role may not change.
//
//   owner      platform owner (`admins/{uid}.role == 'super'`): every event, no membership needed
//   organizer  member of the event: everything in it, including the team
//   client     member of the event: text, photos, guests, invites, gifts,
//              RSVPs and showing / hiding sections. The design (section
//              order, colors & fonts, music) only when the event allows it
//              (`settings/permissions.clientDesign`, set by an organizer).

import { mergeScreens } from './screens';

export const EVENT_ROLES = ['organizer', 'client'] as const;
export type EventRole = (typeof EVENT_ROLES)[number];
export type AccessRole = 'owner' | EventRole;

export const ROLE_NAMES: Record<AccessRole, string> = {
  owner: 'Owner',
  organizer: 'Organizer',
  client: 'Client',
};

/** The signed-in user's access to one event. */
export type EventAccess = { role: AccessRole; clientDesign: boolean };

export function isEventRole(value: unknown): value is EventRole {
  return typeof value === 'string' && (EVENT_ROLES as readonly string[]).includes(value);
}

const RANK: Record<AccessRole, number> = { client: 0, organizer: 1, owner: 2 };

/** True when `role` is `min` or above (owner > organizer > client). */
export function hasRole(role: AccessRole, min: AccessRole): boolean {
  return RANK[role] >= RANK[min];
}

/** Content docs that are design, not wording: locked for clients unless allowed. */
export const DESIGN_DOC_IDS: readonly string[] = ['theme', 'music'];

/** Section order, colors & fonts and music. */
export function canEditDesign(access: EventAccess): boolean {
  return access.role !== 'client' || access.clientDesign;
}

/** May save, publish or discard this content doc (`screens` order is checked by `keepsScreenOrder`). */
export function canEditDoc(access: EventAccess, docId: string): boolean {
  return !DESIGN_DOC_IDS.includes(docId) || canEditDesign(access);
}

/** Add, remove and change members; event settings such as `clientDesign`. */
export function canManageTeam(access: EventAccess): boolean {
  return hasRole(access.role, 'organizer');
}

/**
 * For a `screens` doc saved by someone who may not change the order: true
 * when `next` lists the screens in the same order as `current` (showing,
 * hiding and renaming are fine).
 */
export function keepsScreenOrder(next: unknown, current: unknown): boolean {
  const order = (doc: unknown) => mergeScreens(doc).map((s) => s.type).join();
  return order(next) === order(current);
}
