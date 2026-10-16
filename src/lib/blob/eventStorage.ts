import { del, list } from '@vercel/blob';
import { getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';
import defaultContent from '@/data/wedding-content.json';
import { EVENT_STORAGE_CAP_BYTES, blobPathsIn, eventFolder, pickUnused, type StoredBlob } from './blobRefs';

// Server only. Vercel Blob usage per event and the clean-up of files nothing
// uses any more (replaced or removed photos, songs, deleted events) (F13).
//
// Usage = the files in the event's folders: `events/<id>/` and, after a change
// of link, `events/<formerId>/` (`formerIds` on the event doc). Files from
// before F13 (`images/…`, `gallery/…`) are in no event's folder: they count
// toward no cap, and the clean-up still deletes them once nothing uses them.

async function listBlobs(prefix?: string): Promise<StoredBlob[]> {
  const blobs: StoredBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs.map(({ pathname, url, size, uploadedAt }) => ({ pathname, url, size, uploadedAt })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

/** The event's own Blob folders: its ID, then the IDs it had before a change of link. */
async function eventFolders(eventId: string): Promise<string[]> {
  const event = await getAdminDb().doc(paths.event(eventId)).get();
  const former = event.get('formerIds');
  const ids = [eventId, ...(Array.isArray(former) ? former.filter((id): id is string => typeof id === 'string') : [])];
  return [...new Set(ids)].map(eventFolder);
}

export type EventStorage = { usedBytes: number; files: number; capBytes: number };

export async function getEventStorage(eventId: string): Promise<EventStorage> {
  const folders = await eventFolders(eventId);
  const blobs = (await Promise.all(folders.map((folder) => listBlobs(folder)))).flat();
  return {
    usedBytes: blobs.reduce((sum, b) => sum + b.size, 0),
    files: blobs.length,
    capBytes: EVENT_STORAGE_CAP_BYTES,
  };
}

// Every collection of an event that may hold a Blob URL. Versions and drafts
// count: History can restore a version, so its photos stay until it drops out.
const EVENT_COLLECTIONS = [
  (id: string) => `${paths.event(id)}/content`,
  (id: string) => `${paths.event(id)}/drafts`,
  (id: string) => `${paths.event(id)}/contentVersions`,
  (id: string) => `${paths.event(id)}/settings`,
  paths.registryGifts,
];

/** Pathnames of every Blob file any event, the pre-F3 root copies or the default content point at. */
async function readUsedPaths(): Promise<Set<string>> {
  const db = getAdminDb();
  const used = blobPathsIn(defaultContent);
  const events = await db.collection(paths.events()).get();
  const collections = [
    paths.legacyContent(),
    paths.legacyRegistryGifts(),
    ...events.docs.flatMap((event) => EVENT_COLLECTIONS.map((path) => path(event.id))),
  ];
  // One failed read throws, so a partial list never deletes a file in use.
  const snaps = await Promise.all(collections.map((path) => db.collection(path).get()));
  for (const snap of snaps) for (const doc of snap.docs) blobPathsIn(doc.data(), used);
  return used;
}

export type UnusedFiles = { files: number; bytes: number; sample: string[] };

/** Every file in the store no saved data uses (see pickUnused). */
export async function findUnusedFiles(): Promise<StoredBlob[]> {
  const [blobs, used] = await Promise.all([listBlobs(), readUsedPaths()]);
  return pickUnused(blobs, used, Date.now());
}

/** Unused files across the whole store; deletes them when `apply` is true. */
export async function cleanUpUnusedFiles(apply: boolean): Promise<UnusedFiles> {
  const unused = await findUnusedFiles();
  if (apply) {
    for (let i = 0; i < unused.length; i += 100) {
      await del(unused.slice(i, i + 100).map((b) => b.url));
    }
  }
  return {
    files: unused.length,
    bytes: unused.reduce((sum, b) => sum + b.size, 0),
    sample: unused.slice(0, 10).map((b) => b.pathname),
  };
}
