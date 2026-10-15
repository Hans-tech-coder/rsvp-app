import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { isValidEventId, paths } from '@/lib/eventPaths';
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
