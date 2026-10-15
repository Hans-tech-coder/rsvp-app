import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { DEFAULT_EVENT_ID, isValidEventId, paths } from '@/lib/eventPaths';
import { hasRole, isEventRole, type AccessRole, type EventAccess } from '@/lib/permissions';

/** A signed-in account. `isOwner` = platform owner (`role: 'super'`), who may open every event. */
export type AdminSession = { uid: string; email: string | null; isOwner: boolean; eventIds: string[] };

/** An account's access to one event (roles and rules: src/lib/permissions.ts). */
export type EventSession = AdminSession & EventAccess;

// Server-only. Verifies the `session` cookie (signature, expiry, revocation)
// and that the account `admins/{uid}` exists. Says nothing about an event:
// use getEventAccess / requireEventRole for that.
// Memoized per request so a page and the actions it calls verify once.
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;

  try {
    const { uid, email } = await getAdminAuth().verifySessionCookie(session, true);
    const admin = await getAdminDb().doc(paths.admin(uid)).get();
    if (!admin.exists) return null;
    const eventIds = admin.get('eventIds');
    return {
      uid,
      email: email ?? null,
      isOwner: admin.get('role') === 'super',
      eventIds: Array.isArray(eventIds) ? eventIds.filter(isValidEventId) : [],
    };
  } catch {
    return null;
  }
});

/**
 * The signed-in account's role in an event: `owner` for a platform owner,
 * else its `events/{eventId}/members/{uid}` role, else null (no access).
 * Also reads whether the event lets clients change the design.
 */
export const getEventAccess = cache(async (eventId: string): Promise<EventSession | null> => {
  if (!isValidEventId(eventId)) return null;
  const admin = await getAdmin();
  if (!admin) return null;

  const db = getAdminDb();
  const [member, permissions] = await db.getAll(
    db.doc(paths.member(eventId, admin.uid)),
    db.doc(paths.setting(eventId, 'permissions')),
  );
  const memberRole = member.exists ? member.get('role') : null;
  const role: AccessRole | null = admin.isOwner ? 'owner' : isEventRole(memberRole) ? memberRole : null;
  if (!role) return null;
  return { ...admin, role, clientDesign: permissions.get('clientDesign') === true };
});

// For server actions: throws, so each action's existing catch returns
// `{ success: false, error: 'Unauthorized' }`.
export async function requireEventRole(eventId: string, min: AccessRole = 'client'): Promise<EventSession> {
  const access = await getEventAccess(eventId);
  if (!access || !hasRole(access.role, min)) throw new Error('Unauthorized');
  return access;
}

// For admin server pages. Sends a bad session, or an account with no access
// to the event, through /api/logout, which clears the cookie first;
// redirecting straight to /admin/login would loop, because src/proxy.ts
// bounces any request that still carries a `session` cookie from the login
// page to the dashboard. A member below `min` goes to the dashboard instead.
export async function requireEventPage(eventId: string, min: AccessRole = 'client'): Promise<EventSession> {
  const access = await getEventAccess(eventId);
  if (!access) redirect('/api/logout');
  if (!hasRole(access.role, min)) redirect('/admin/dashboard');
  return access;
}

/** The event the admin pages show (set by /admin/open/<eventId>, the event switcher). */
export const ADMIN_EVENT_COOKIE = 'adminEvent';

export const ADMIN_EVENT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
} as const;

/** The event exists and the signed-in account has a role in it. */
export async function canOpenEvent(eventId: unknown): Promise<boolean> {
  if (!isValidEventId(eventId)) return false;
  const access = await getEventAccess(eventId);
  if (!access) return false;
  // An owner's role does not prove the event exists; a member's doc is deleted with its event.
  return access.role !== 'owner' || (await getAdminDb().doc(paths.event(eventId)).get()).exists;
}

/**
 * The event the signed-in account is working on: the one picked in the
 * switcher (`adminEvent` cookie) while the account still has access to it,
 * else the default event, else the account's first event. Null when there is
 * no session or no event to open.
 */
export const getCurrentEventId = cache(async (): Promise<string | null> => {
  const admin = await getAdmin();
  if (!admin) return null;

  const picked = (await cookies()).get(ADMIN_EVENT_COOKIE)?.value;
  for (const eventId of new Set([picked, DEFAULT_EVENT_ID, ...admin.eventIds])) {
    if (isValidEventId(eventId) && (await canOpenEvent(eventId))) return eventId;
  }
  if (!admin.isOwner) return null;
  const first = await getAdminDb().collection(paths.events()).limit(1).get();
  return first.empty ? null : first.docs[0].id;
});

/**
 * requireEventPage for the current event, plus its ID. An account with no
 * event to open goes to the events list (/admin), where an owner can make one.
 */
export async function requireCurrentEventPage(min: AccessRole = 'client'): Promise<EventSession & { eventId: string }> {
  const eventId = await getCurrentEventId();
  if (!eventId) redirect((await getAdmin()) ? '/admin' : '/api/logout');
  return { ...(await requireEventPage(eventId, min)), eventId };
}
