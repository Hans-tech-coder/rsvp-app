import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { AdminRole } from '@/types';

export type AdminSession = { uid: string; role: AdminRole };

// Server-only. Verifies the `session` cookie (signature, expiry, revocation)
// and that `admins/{uid}` exists. Returns the admin's UID and role, or null.
// A doc with no `role` (created before roles existed) counts as 'admin'.
// Memoized per request so a page and the actions it calls verify once.
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;

  try {
    const { uid } = await getAdminAuth().verifySessionCookie(session, true);
    const admin = await getAdminDb().collection('admins').doc(uid).get();
    if (!admin.exists) return null;
    return { uid, role: admin.get('role') === 'super' ? 'super' : 'admin' };
  } catch {
    return null;
  }
});

export async function getAdminUid(): Promise<string | null> {
  return (await getAdmin())?.uid ?? null;
}

// For server actions: throws, so each action's existing catch returns
// `{ success: false, error: 'Unauthorized' }`.
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) throw new Error('Unauthorized');
  return admin;
}

// For server actions only super admins may call (managing admins).
export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (admin.role !== 'super') throw new Error('Unauthorized');
  return admin;
}

// For admin server pages. Sends a bad or non-admin session through
// /api/logout, which clears the cookie first; redirecting straight to
// /admin/login would loop, because src/proxy.ts bounces any request that
// still carries a `session` cookie from the login page to the dashboard.
export async function requireAdminPage(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect('/api/logout');
  return admin;
}
