import { cache } from 'react';
import type { DocumentData } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { DEFAULT_SITE_TEXT, mergeSiteText, type SiteText } from '@/lib/siteText';
import { isValidEventId, paths } from '@/lib/eventPaths';
import {
  CONTENT_DOC_IDS, mergeGlobal, mergeWeddingContent,
  type ContentDocId, type SiteGlobal, type WeddingContent,
} from '@/lib/weddingContent';

// Server-only. Guest-site content is read here with the admin SDK when a page
// is (re)generated, never from the browser. The pages are cached (ISR); an
// admin save calls revalidateGuestSite(eventId) so the next visit rebuilds
// them. Memoized per request (generateMetadata and the page share one read).

export type { SiteGlobal };

/**
 * Everything the event's guest page shows, or null when the event does not
 * exist. Throws when Firestore can't be read, so a cached page stays up rather
 * than being replaced by the defaults.
 */
export const getEventContent = cache(async (eventId: string): Promise<{ content: WeddingContent; siteText: SiteText } | null> => {
  if (!isValidEventId(eventId)) return null;

  const db = getAdminDb();
  // The event first, so a made-up URL costs one read, not fourteen.
  if (!(await db.doc(paths.event(eventId)).get()).exists) return null;

  const ids = [...CONTENT_DOC_IDS, 'siteText'] as const;
  const docs = await db.getAll(...ids.map((id) => db.doc(paths.content(eventId, id))));

  // Client components only take plain objects (no Firestore Timestamps).
  const data = Object.fromEntries(ids.map((id, i) => [id, JSON.parse(JSON.stringify(docs[i].data() ?? null)) ?? undefined]));

  return {
    content: mergeWeddingContent(data as Record<ContentDocId, DocumentData | undefined>),
    siteText: mergeSiteText(DEFAULT_SITE_TEXT, data.siteText),
  };
});

/**
 * Only the site text and global settings, for the 404 page. Falls back to the
 * defaults when Firestore can't be read (the 404 is built at deploy time too).
 */
export const getSiteContent = cache(async (eventId: string): Promise<{ global: SiteGlobal; siteText: SiteText }> => {
  let global = mergeGlobal(undefined);
  let siteText = DEFAULT_SITE_TEXT;

  try {
    const db = getAdminDb();
    const [globalDoc, siteTextDoc] = await Promise.all([
      db.doc(paths.content(eventId, 'globalSettings')).get(),
      db.doc(paths.content(eventId, 'siteText')).get(),
    ]);
    global = mergeGlobal(globalDoc.data());
    siteText = mergeSiteText(DEFAULT_SITE_TEXT, siteTextDoc.data());
  } catch (error) {
    console.error('Site content: using defaults, Firestore read failed:', error);
  }

  return { global, siteText };
});

/** "December 20, 2026 15:00:00" -> "December 20, 2026"; the raw text if it can't be parsed. */
export function formatEventDate(targetDate: string): string {
  const date = new Date(targetDate);
  return Number.isNaN(date.getTime())
    ? targetDate
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
