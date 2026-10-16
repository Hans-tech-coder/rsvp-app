import { upload } from '@vercel/blob/client';
import { auth } from '@/lib/firebase/client';
import { getUploadProblem } from '@/app/actions/settings';
import { eventFolder } from './blobRefs';

type CompressOptions = {
  /** Longest side in pixels after resizing. */
  maxDimension?: number;
  /** Output format. Use 'image/png' for QR codes, 'image/jpeg' for OG images. */
  type?: 'image/webp' | 'image/jpeg' | 'image/png';
  quality?: number;
};

const EXTENSIONS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' } as const;

// Files already this small and within maxDimension are uploaded untouched.
const SMALL_ENOUGH_BYTES = 400 * 1024;

/**
 * Resize and re-encode an image in the browser so guests download ~200-400 KB
 * instead of multi-MB phone photos (Blob data transfer is capped on Hobby).
 * Returns the original file when it cannot be decoded (e.g. HEIC outside
 * Safari), is an SVG/GIF, or when re-encoding would not make it smaller.
 */
async function compressImage(file: File, opts: CompressOptions): Promise<Blob> {
  const { maxDimension = 2000, type = 'image/webp', quality = 0.82 } = opts;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= SMALL_ENOUGH_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
  if (!blob || (scale === 1 && blob.size >= file.size)) return file;
  return blob;
}

/**
 * Upload a file into the event's Blob folder (`events/<eventId>/<pathname>`)
 * with a token from /api/upload. Returns the public URL. When the token is
 * refused, asks the server why (storage full, signed out) for the message.
 */
export async function uploadToEvent(eventId: string, pathname: string, body: Blob, contentType: string): Promise<string> {
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('Not signed in. Please log in again.');
  const idToken = await auth.currentUser.getIdToken();

  try {
    const blob = await upload(eventFolder(eventId) + pathname, body, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      contentType,
      clientPayload: JSON.stringify({ idToken, eventId }),
    });
    return blob.url;
  } catch (error) {
    if (error instanceof Error && error.message.includes('client token')) {
      throw new Error((await getUploadProblem(eventId)) ?? 'The upload was refused. Please try again.');
    }
    throw error;
  }
}

/**
 * Compress an image and upload it to the event's Blob folder. Returns the
 * public URL. `name` is the path without extension, e.g. 'images/welcome-bg';
 * Blob adds a random suffix so repeated uploads never overwrite each other.
 */
export async function uploadImage(eventId: string, file: File, name: string, opts: CompressOptions = {}): Promise<string> {
  const body = await compressImage(file, opts);
  const contentType = body.type || file.type;
  const ext = body === file
    ? file.name.split('.').pop()?.toLowerCase() || 'bin'
    : EXTENSIONS[opts.type ?? 'image/webp'];

  return uploadToEvent(eventId, `${name}.${ext}`, body, contentType);
}
