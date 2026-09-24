import { upload } from '@vercel/blob/client';
import { auth } from '@/lib/firebase/client';

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
 * Compress an image and upload it to Vercel Blob. Returns the public URL.
 * `name` is the path without extension, e.g. 'images/welcome-bg'; Blob adds a
 * random suffix so repeated uploads never overwrite each other.
 */
export async function uploadImage(file: File, name: string, opts: CompressOptions = {}): Promise<string> {
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('Not signed in. Please log in again.');
  const idToken = await auth.currentUser.getIdToken();

  const body = await compressImage(file, opts);
  const contentType = body.type || file.type;
  const ext = body === file
    ? file.name.split('.').pop()?.toLowerCase() || 'bin'
    : EXTENSIONS[opts.type ?? 'image/webp'];

  const blob = await upload(`${name}.${ext}`, body, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    contentType,
    clientPayload: idToken,
  });
  return blob.url;
}
