// Guards for the /api/download image proxy (src/app/api/download/route.ts).
// Kept out of route.ts so they can be unit-tested (src/lib/downloadProxy.test.ts).

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';
const FIREBASE_STORAGE_HOST = 'firebasestorage.googleapis.com';

/**
 * Returns the parsed URL if the proxy may fetch it, otherwise null.
 * Allowed: https Vercel Blob public URLs, and legacy Firebase Storage URLs
 * for this project's bucket only.
 */
export function isAllowedImageUrl(
  raw: string,
  bucket: string | undefined = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) {
    return null;
  }

  if (url.hostname.endsWith(BLOB_HOST_SUFFIX)) {
    return url;
  }

  if (
    url.hostname === FIREBASE_STORAGE_HOST &&
    bucket &&
    url.pathname.startsWith(`/v0/b/${bucket}/`)
  ) {
    return url;
  }

  return null;
}

/** Keeps only [A-Za-z0-9._-], caps at 100 chars, falls back to download.jpg. */
export function sanitizeFilename(name: string | null): string {
  const clean = (name ?? '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 100);
  return clean || 'download.jpg';
}
