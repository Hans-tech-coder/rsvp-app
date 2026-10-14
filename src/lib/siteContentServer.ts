import { cache } from 'react';
import { getAdminDb } from '@/lib/firebase/admin';
import weddingContent from '@/data/wedding-content.json';
import { DEFAULT_SITE_TEXT, mergeSiteText, type SiteText } from '@/lib/siteText';
import { DEFAULT_EVENT_ID, paths } from '@/lib/eventPaths';

// Server-only. The content the root layout and the 404 page need before the
// browser loads anything: the site text and the global settings used in
// metadata. Read with the admin SDK when a page is (re)generated; an admin
// save calls revalidateGuestSite() so the static pages pick up the change.
// Memoized per request (generateMetadata and the layout share one read).

export type SiteGlobal = typeof weddingContent.global;

export const getSiteContent = cache(async (eventId: string = DEFAULT_EVENT_ID): Promise<{ global: SiteGlobal; siteText: SiteText }> => {
  const global = { ...weddingContent.global };
  let siteText = DEFAULT_SITE_TEXT;

  try {
    const db = getAdminDb();
    const [globalDoc, siteTextDoc] = await Promise.all([
      db.doc(paths.content(eventId, 'globalSettings')).get(),
      db.doc(paths.content(eventId, 'siteText')).get(),
    ]);

    const g = globalDoc.data();
    if (g) {
      // Same rule as the browser provider: an empty value keeps the default.
      for (const key of Object.keys(global) as (keyof SiteGlobal)[]) {
        if (typeof g[key] === 'string' && g[key].trim() !== '') global[key] = g[key];
      }
    }
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
