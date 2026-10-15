import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';

// Server-only. The event's activity log (`events/{eventId}/auditLog`): who
// changed what, when. Written after an admin action succeeds; shown on the
// Team page. Draft saves (and the 10 s autosave) are not logged: the draft
// itself keeps `updatedBy`, and the log records the Publish.

export type ActivityEntry = { id: string; at: string | null; email: string | null; action: string; target: string | null };

/** Never fails the action it records: a write error is only logged. */
export async function logActivity(eventId: string, actor: { uid: string; email: string | null }, action: string, target?: string) {
  try {
    await getAdminDb().collection(paths.auditLog(eventId)).add({
      at: FieldValue.serverTimestamp(),
      uid: actor.uid,
      email: actor.email,
      action,
      target: target ?? null,
    });
  } catch (error) {
    console.error(`Audit log write failed (${eventId}: ${action}):`, error);
  }
}

/** The newest entries first. */
export async function readActivity(eventId: string, limit = 50): Promise<ActivityEntry[]> {
  const snap = await getAdminDb().collection(paths.auditLog(eventId)).orderBy('at', 'desc').limit(limit).get();
  return snap.docs.map((doc) => {
    const at = doc.get('at');
    return {
      id: doc.id,
      at: at instanceof Timestamp ? at.toDate().toISOString() : null,
      email: doc.get('email') ?? null,
      action: String(doc.get('action') ?? ''),
      target: doc.get('target') ?? null,
    };
  });
}
