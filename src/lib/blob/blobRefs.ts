// Pure helpers for the Blob storage of events (F13): which uploaded files a
// piece of saved data points at, which files belong to an event, which are no
// longer used. No SDK here, so the tests can run them; the I/O is in
// eventStorage.ts (server only).

/** Each event's uploads go under `events/<eventId>/` (since F13). */
export const eventFolder = (eventId: string) => `events/${eventId}/`;

/**
 * Folders this app has uploaded to. The clean-up only ever deletes files under
 * these: `events/` (F13 on) and the paths used before uploads were per event.
 */
export const APP_FOLDERS = ['events/', 'images/', 'gallery/', 'website/', 'music/'];

/** Upload cap per event, counted over its own folders (a soft cap: checked before each upload). */
export const EVENT_STORAGE_CAP_BYTES = 200 * 1024 * 1024;

/**
 * A file must be unused for this long before the clean-up deletes it. Covers
 * an editor that has uploaded a photo but not saved the draft yet.
 */
export const UNUSED_GRACE_MS = 24 * 60 * 60 * 1000;

const BLOB_URL = /https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>()?#\\]+/gi;

/** The Blob pathnames (`images/welcome-bg-abc.webp`) of every Blob URL inside `value` (any JSON-like data). */
export function blobPathsIn(value: unknown, into: Set<string> = new Set()): Set<string> {
  const visit = (v: unknown) => {
    if (typeof v === 'string') {
      for (const match of v.matchAll(BLOB_URL)) {
        const path = new URL(match[0]).pathname.slice(1);
        try {
          into.add(decodeURIComponent(path));
        } catch {
          into.add(path);
        }
      }
    } else if (Array.isArray(v)) {
      v.forEach(visit);
    } else if (v && typeof v === 'object') {
      Object.values(v).forEach(visit);
    }
  };
  visit(value);
  return into;
}

export type StoredBlob = { pathname: string; url: string; size: number; uploadedAt: Date };

/**
 * Files no saved data points at, older than the grace period, under the app's
 * folders. `used` must hold the references of **every** event (a duplicated
 * event shares its source's files) and of the default content.
 */
export function pickUnused(blobs: StoredBlob[], used: Set<string>, now: number): StoredBlob[] {
  return blobs.filter((b) =>
    APP_FOLDERS.some((folder) => b.pathname.startsWith(folder))
    && !used.has(b.pathname)
    && now - b.uploadedAt.getTime() > UNUSED_GRACE_MS);
}

/** Bytes as "12.3 MB" for the admin. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
