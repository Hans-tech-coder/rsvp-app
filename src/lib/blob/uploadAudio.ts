import { MUSIC_MAX_BYTES, MUSIC_UPLOAD_PREFIX } from '@/lib/music';
import { uploadToEvent } from './uploadImage';

/**
 * Upload a music file to the event's Blob folder as is (no re-encoding) and return its
 * public URL. Checked here for a friendly message; the size and type are
 * enforced again by the upload token (src/app/api/upload/route.ts).
 */
export async function uploadAudio(eventId: string, file: File): Promise<string> {
  if (!file.type.startsWith('audio/')) throw new Error('That file is not an audio file. Use an MP3 or M4A.');
  if (file.size > MUSIC_MAX_BYTES) {
    throw new Error(`The file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MUSIC_MAX_BYTES / 1024 / 1024} MB; use a shorter or lower-quality MP3.`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  return uploadToEvent(eventId, `${MUSIC_UPLOAD_PREFIX}background.${ext}`, file, file.type);
}
