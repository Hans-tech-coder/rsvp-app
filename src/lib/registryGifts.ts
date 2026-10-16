import { unstable_cache } from 'next/cache';
import { getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';
import type { RegistryGift } from '@/types';

// Server-only. The guest registry list, cached so each guest who opens the
// registry does not read every gift doc. Every action that changes a gift or
// its claims calls updateTag(registryGiftsTag(eventId)), so the next read is
// fresh; the hourly expiry covers edits made outside the app (the console).
// Claiming still reads the gift inside a transaction, so a stale list can
// never let a gift be over-claimed.

export type RegistryGiftItem = RegistryGift & { id: string };

/** The cache tag for one event's registry list. */
export const registryGiftsTag = (eventId: string) => `registry-gifts:${eventId}`;

async function readGifts(eventId: string): Promise<RegistryGiftItem[]> {
  const snapshot = await getAdminDb().collection(paths.registryGifts(eventId)).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
  }) as RegistryGiftItem[];
}

/** An event's gifts: from the cache, else one read per gift. */
export function readRegistryGifts(eventId: string): Promise<RegistryGiftItem[]> {
  return unstable_cache(() => readGifts(eventId), ['registry-gifts', eventId], {
    tags: [registryGiftsTag(eventId)],
    revalidate: 3600,
  })();
}
