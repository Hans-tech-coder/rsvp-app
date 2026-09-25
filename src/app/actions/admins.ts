'use server';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getAdmin, requireSuperAdmin } from '@/lib/requireAdmin';
import type { AdminRole } from '@/types';

// Admin management for the sidebar's "Manage Admins" modal. Every action
// except getMyAdminRole() is super-admin only. The UI never creates or
// removes a super admin; that stays in scripts/add-admin.js.

const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

export type ActiveAdmin = { uid: string; email: string; role: AdminRole; addedAt: string | null };
export type PendingAdmin = { email: string; role: AdminRole; addedAt: string | null };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function errorCode(error: unknown) {
  return (error as { code?: unknown } | null)?.code;
}

function toIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

// Used by the sidebar to decide whether to show "Manage Admins".
export async function getMyAdminRole(): Promise<AdminRole | null> {
  return (await getAdmin())?.role ?? null;
}

export async function listAdmins() {
  try {
    const me = await requireSuperAdmin();
    const db = getAdminDb();
    const [adminsSnap, allowSnap] = await Promise.all([
      db.collection('admins').get(),
      db.collection('adminAllowlist').get(),
    ]);

    const admins: ActiveAdmin[] = adminsSnap.docs
      .map((doc) => ({
        uid: doc.id,
        email: doc.get('email') ?? '',
        role: (doc.get('role') === 'super' ? 'super' : 'admin') as AdminRole,
        addedAt: toIso(doc.get('addedAt')),
      }))
      .sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role === 'super' ? -1 : 1));

    const pending: PendingAdmin[] = allowSnap.docs
      .map((doc) => ({
        email: doc.id,
        role: (doc.get('role') === 'super' ? 'super' : 'admin') as AdminRole,
        addedAt: toIso(doc.get('addedAt')),
      }))
      .sort((a, b) => a.email.localeCompare(b.email));

    return { success: true, myUid: me.uid, admins, pending };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to load admins') };
  }
}

export async function addAdmin(rawEmail: string) {
  try {
    const me = await requireSuperAdmin();
    const email = String(rawEmail ?? '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return { success: false, error: 'Enter a valid email address.' };
    }

    const db = getAdminDb();
    const existing = await db.collection('admins').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return { success: false, error: 'That email is already an admin.' };
    }

    // create() fails if an entry exists, so a pending super is never
    // overwritten (downgraded) from the UI.
    try {
      await db.collection('adminAllowlist').doc(email).create({
        role: 'admin',
        addedAt: FieldValue.serverTimestamp(),
        addedBy: me.uid,
      });
    } catch (error) {
      if (errorCode(error) === 6) return { success: false, error: 'That email is already pending.' };
      throw error;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to add admin') };
  }
}

export async function cancelPendingAdmin(rawEmail: string) {
  try {
    await requireSuperAdmin();
    const email = String(rawEmail ?? '').trim().toLowerCase();
    const ref = getAdminDb().collection('adminAllowlist').doc(email);
    const entry = await ref.get();
    if (!entry.exists) return { success: false, error: 'That pending admin no longer exists.' };
    if (entry.get('role') === 'super') {
      return { success: false, error: 'A pending super admin can only be changed with the add-admin script.' };
    }
    await ref.delete();
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to cancel') };
  }
}

export async function removeAdmin(uid: string) {
  try {
    const me = await requireSuperAdmin();
    if (!uid || uid === me.uid) return { success: false, error: 'You cannot remove yourself.' };

    const ref = getAdminDb().collection('admins').doc(uid);
    const target = await ref.get();
    if (!target.exists) return { success: false, error: 'That admin no longer exists.' };
    if (target.get('role') === 'super') {
      return { success: false, error: 'A super admin can only be removed with the Firebase console.' };
    }

    await ref.delete();
    // Revoking makes verifySessionCookie(…, true) reject their session on the
    // next request, instead of leaving it valid for up to 5 days.
    try {
      await getAdminAuth().revokeRefreshTokens(uid);
    } catch (error) {
      if (errorCode(error) !== 'auth/user-not-found') throw error;
    }
    console.log(`Admin ${uid} removed by ${me.uid}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to remove admin') };
  }
}
