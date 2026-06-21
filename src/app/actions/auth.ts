'use server';

import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  try {
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      path: '/',
    });
    return { success: true };
  } catch (error: any) {
    console.error('Session cookie error:', error);
    return { success: false, error: error.message || 'Unauthorized' };
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return { success: true };
}
