import { upload } from '@vercel/blob/client';
import { auth } from '@/lib/firebase/client';
import { MUSIC_MAX_BYTES, MUSIC_UPLOAD_PREFIX } from '@/lib/music';

/**
 * Upload a music file to Vercel Blob as is (no re-encoding) and return its
 * public URL. Checked here for a friendly message; the size and type are
 * enforced again by the upload token (src/app/api/upload/route.ts).
 */
export async function uploadAudio(file: File): Promise<string> {
  if (!file.type.startsWith('audio/')) throw new Error('That file is not an audio file. Use an MP3 or M4A.');
  if (file.size > MUSIC_MAX_BYTES) {
    throw new Error(`The file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MUSIC_MAX_BYTES / 1024 / 1024} MB; use a shorter or lower-quality MP3.`);
  }

  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('Not signed in. Please log in again.');
  const idToken = await auth.currentUser.getIdToken();

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const blob = await upload(`${MUSIC_UPLOAD_PREFIX}background.${ext}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    contentType: file.type,
    clientPayload: idToken,
  });
  return blob.url;
}
