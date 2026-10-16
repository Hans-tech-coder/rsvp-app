'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';
import { getAdmin, getEventAccess, requireEventRole } from '@/lib/requireAdmin';
import { logActivity } from '@/lib/auditLog';
import { checkEmailSettings } from '@/lib/email/emailSettings';
import { formatBytes } from '@/lib/blob/blobRefs';
import { cleanUpUnusedFiles, getEventStorage, type UnusedFiles } from '@/lib/blob/eventStorage';

// Event settings (F13), for the Settings page (src/app/admin/settings/) and
// the upload helpers: the event's email sender name and reply-to, its storage,
// and the clean-up of unused Blob files (platform owners).

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function saveEmailSettings(eventId: string, input: { senderName: string; replyTo: string }) {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    const settings = checkEmailSettings(input);
    if ('error' in settings) return { success: false, error: settings.error };
    await getAdminDb().doc(paths.setting(eventId, 'email')).set(settings);
    await logActivity(eventId, me, 'Changed the email settings');
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to save the email settings') };
  }
}

/**
 * Why /api/upload refused a token (it can only answer "Unauthorized"), in
 * words for the editor; null when nothing explains it (try again).
 */
export async function getUploadProblem(eventId: string): Promise<string | null> {
  try {
    if (!(await getEventAccess(eventId))) return 'Your sign-in has expired or you no longer have access to this event. Sign in again.';
    const { usedBytes, capBytes } = await getEventStorage(eventId);
    if (usedBytes >= capBytes) {
      return `This event has used its ${formatBytes(capBytes)} of storage. Photos you replaced are deleted a day later; remove unused photos or ask the platform owner for more space.`;
    }
    return null;
  } catch {
    return null;
  }
}

type CleanUpResult = { success: true; unused: UnusedFiles } | { success: false; error: string };

/** Platform owners: count (or, with `apply`, delete) the files no event uses. */
export async function cleanUpStorage(apply: boolean): Promise<CleanUpResult> {
  try {
    const admin = await getAdmin();
    if (!admin?.isOwner) throw new Error('Unauthorized');
    const unused = await cleanUpUnusedFiles(apply === true);
    if (apply) console.info(`Blob clean-up by ${admin.email}: ${unused.files} files, ${unused.bytes} bytes deleted`);
    return { success: true, unused };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to check the storage') };
  }
}
