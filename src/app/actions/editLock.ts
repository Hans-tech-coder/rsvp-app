'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';
import { requireEventRole } from '@/lib/requireAdmin';
import { logActivity } from '@/lib/auditLog';

// The visual builder's edit lock (F10): one builder tab per event at a time.
// The tab holding it sends a heartbeat (holdEditLock every EDIT_LOCK_HEARTBEAT_MS);
// a lock with no heartbeat for EDIT_LOCK_STALE_MS is free again (a closed tab
// or a lost connection). Anyone else sees "X is editing this event" and may
// take over; the old holder learns it on its next heartbeat. Stored in
// `events/{eventId}/settings/editLock` { holder, uid, email, at } (server only).
// The lock is about two people in the builder; drafts keep their own
// conflict check (saveDraft) for everything else.

const EDIT_LOCK_STALE_MS = 90_000;
const HOLDER = /^[A-Za-z0-9-]{8,64}$/;

export type EditLockState =
  | { success: true; held: true }
  | { success: true; held: false; by: string | null; sameUser: boolean }
  | { success: false; error: string };

/** Claims or renews the lock for this tab (`holder`). `takeOver` claims it from whoever has it. */
export async function holdEditLock(eventId: string, holder: string, takeOver = false): Promise<EditLockState> {
  try {
    const me = await requireEventRole(eventId);
    if (typeof holder !== 'string' || !HOLDER.test(holder)) throw new Error('Invalid editor');
    const db = getAdminDb();
    const ref = db.doc(paths.setting(eventId, 'editLock'));

    const result = await db.runTransaction(async (tx) => {
      const lock = (await tx.get(ref)).data();
      const now = Date.now();
      const heldByOther = !!lock && lock.holder !== holder && now - Number(lock.at ?? 0) < EDIT_LOCK_STALE_MS;
      if (heldByOther && !takeOver) {
        return { held: false as const, by: (lock.email as string | null) ?? null, sameUser: lock.uid === me.uid };
      }
      tx.set(ref, { holder, uid: me.uid, email: me.email, at: now });
      return { held: true as const, tookOverFrom: heldByOther ? ((lock.email as string | null) ?? null) : undefined };
    });

    if (!result.held) return { success: true, ...result };
    if (result.tookOverFrom !== undefined) await logActivity(eventId, me, 'Took over the builder', result.tookOverFrom ?? undefined);
    return { success: true, held: true };
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Failed to check who is editing' };
  }
}

/** Frees the lock when this tab still holds it (closing the builder). */
export async function releaseEditLock(eventId: string, holder: string) {
  try {
    await requireEventRole(eventId);
    const db = getAdminDb();
    const ref = db.doc(paths.setting(eventId, 'editLock'));
    await db.runTransaction(async (tx) => {
      if ((await tx.get(ref)).get('holder') === holder) tx.delete(ref);
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Failed to release the lock' };
  }
}
