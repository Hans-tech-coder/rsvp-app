'use server';

import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { isValidEventId, paths } from '@/lib/eventPaths';
import { isEventRole, type EventRole } from '@/lib/permissions';

const NOT_ADMIN = 'This Google account has no event to manage.';
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
    // e.g. after `add-admin.js --super`) and adds the person to each event in
    // its `events` map (`events/{eventId}/members/{uid}`), then is deleted.
    // An account gets a session only if it is a platform owner or a member of
    // at least one event.
    const uid = decoded.uid;
    const email = decoded.email.toLowerCase();
    const db = getAdminDb();
    const adminRef = db.doc(paths.admin(uid));
    const allowRef = db.doc(paths.adminAllowlistEntry(email));

    const hasAccess = await db.runTransaction(async (tx) => {
      const [admin, allow] = await Promise.all([tx.get(adminRef), tx.get(allowRef)]);
      const eventIds: string[] = Array.isArray(admin.get('eventIds')) ? admin.get('eventIds') : [];
      const wasOwner = admin.get('role') === 'super';
      const invited = Object.entries((allow.get('events') ?? {}) as Record<string, unknown>)
        .filter((entry): entry is [string, EventRole] => isValidEventId(entry[0]) && isEventRole(entry[1]));
      // An entry that grants nothing (no owner role, no event) is left for scripts/migrate-members-f10.js.
      if (!allow.exists || (allow.get('role') !== 'super' && invited.length === 0)) {
        return admin.exists && (wasOwner || eventIds.length > 0);
      }

      // Never downgrades an owner.
      const role = wasOwner || allow.get('role') === 'super' ? 'super' : 'admin';
      const memberRefs = invited.map(([eventId]) => db.doc(paths.member(eventId, uid)));
      const members = memberRefs.length ? await tx.getAll(...memberRefs) : [];

      tx.set(
        adminRef,
        {
          email,
          role,
          addedBy: allow.get('addedBy') ?? 'script',
          ...(admin.exists ? {} : { addedAt: FieldValue.serverTimestamp() }),
          ...(invited.length ? { eventIds: FieldValue.arrayUnion(...invited.map(([eventId]) => eventId)) } : {}),
        },
        { merge: true },
      );
      invited.forEach(([, memberRole], i) => {
        // An existing membership keeps its role; the invite only adds.
        if (!members[i].exists) {
          tx.set(memberRefs[i], { email, role: memberRole, addedAt: FieldValue.serverTimestamp(), addedBy: allow.get('addedBy') ?? 'script' });
        }
      });
      tx.delete(allowRef);
      return role === 'super' || eventIds.length > 0 || invited.length > 0;
    });
    if (!hasAccess) return { success: false, error: NOT_ADMIN };

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
