import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

// Server-only. Verifies the `session` cookie (signature, expiry, revocation)
// and that `admins/{uid}` exists. Returns the admin's UID, or null.
// Memoized per request so a page and the actions it calls verify once.
export const getAdminUid = cache(async (): Promise<string | null> => {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;

  try {
    const { uid } = await getAdminAuth().verifySessionCookie(session, true);
    const admin = await getAdminDb().collection('admins').doc(uid).get();
    return admin.exists ? uid : null;
  } catch {
    return null;
  }
});

// For server actions: throws, so each action's existing catch returns
// `{ success: false, error: 'Unauthorized' }`.
export async function requireAdmin(): Promise<string> {
  const uid = await getAdminUid();
  if (!uid) throw new Error('Unauthorized');
  return uid;
}

// For admin server pages. Sends a bad or non-admin session through
// /api/logout, which clears the cookie first; redirecting straight to
// /admin/login would loop, because src/proxy.ts bounces any request that
// still carries a `session` cookie from the login page to the dashboard.
export async function requireAdminPage(): Promise<string> {
  const uid = await getAdminUid();
  if (!uid) redirect('/api/logout');
  return uid;
}
