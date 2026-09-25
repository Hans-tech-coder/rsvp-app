'use server';

import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

const NOT_ADMIN = 'This Google account is not an admin.';
const MAX_SIGN_IN_AGE_SECONDS = 5 * 60;

export async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken, true);

    // Google sign-in only, with a verified email and a fresh sign-in
    // (Firebase recommends a recent auth_time before minting a session cookie).
    if (decoded.firebase.sign_in_provider !== 'google.com' || decoded.email_verified !== true || !decoded.email) {
      return { success: false, error: NOT_ADMIN };
    }
    if (Date.now() / 1000 - decoded.auth_time > MAX_SIGN_IN_AGE_SECONDS) {
      return { success: false, error: 'Sign-in expired. Please sign in again.' };
    }

    // An `adminAllowlist/{email}` entry is a pending grant: it creates
    // `admins/{uid}` on first sign-in (or sets the role on an existing doc,
    // e.g. after `add-admin.js --super`), then is deleted.
    const uid = decoded.uid;
    const email = decoded.email.toLowerCase();
    const db = getAdminDb();
    const adminRef = db.collection('admins').doc(uid);
    const allowRef = db.collection('adminAllowlist').doc(email);

    const isAdmin = await db.runTransaction(async (tx) => {
      const [admin, allow] = await Promise.all([tx.get(adminRef), tx.get(allowRef)]);
      if (!allow.exists) return admin.exists;

      tx.set(
        adminRef,
        {
          email,
          role: allow.get('role') === 'super' ? 'super' : 'admin',
          addedBy: allow.get('addedBy') ?? 'script',
          ...(admin.exists ? {} : { addedAt: FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
      tx.delete(allowRef);
      return true;
    });
    if (!isAdmin) return { success: false, error: NOT_ADMIN };

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
