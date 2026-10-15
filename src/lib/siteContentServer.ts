import { cache } from 'react';
import { getAdminDb } from '@/lib/firebase/admin';
import { DEFAULT_SITE_TEXT, mergeSiteText, type SiteText } from '@/lib/siteText';
import { isValidEventId, paths } from '@/lib/eventPaths';
import { DEFAULT_THEME, mergeTheme, type Theme } from '@/lib/theme';
import { DEFAULT_MUSIC, mergeMusic, type Music } from '@/lib/music';
import { EDITABLE_DOC_IDS } from '@/lib/contentDrafts';
import { buildEventSite, type EventSiteData, type SiteDocs } from '@/lib/eventSite';
import { mergeGlobal, type SiteGlobal } from '@/lib/weddingContent';

// Server-only. Guest-site content is read here with the admin SDK when a page
// is (re)generated, never from the browser. The pages are cached (ISR); an
// admin Publish (publishDraft) revalidates them so the next visit rebuilds
// them. Memoized per request (generateMetadata and the page share one read).
// The docs are merged into the site by buildEventSite (src/lib/eventSite.ts).

export type { SiteGlobal };

/** The event's raw content docs (drafts over live when `withDrafts`), or null when the event does not exist. */
async function readEventDocs(eventId: string, withDrafts: boolean): Promise<SiteDocs | null> {
  if (!isValidEventId(eventId)) return null;

  const db = getAdminDb();
  // The event first, so a made-up URL costs one read, not fifteen.
  if (!(await db.doc(paths.event(eventId)).get()).exists) return null;

  const ids = EDITABLE_DOC_IDS;
  const docs = await db.getAll(...ids.map((id) => db.doc(paths.content(eventId, id))));
  // Preview: a doc's draft (the whole doc as it will be published) replaces the live one.
  const drafts = withDrafts ? await db.getAll(...ids.map((id) => db.doc(paths.draft(eventId, id)))) : [];

  // Client components only take plain objects (no Firestore Timestamps).
  return Object.fromEntries(ids.map((id, i) => {
    const doc = drafts[i]?.exists ? drafts[i].get('data') : docs[i].data();
    return [id, JSON.parse(JSON.stringify(doc ?? null)) ?? undefined];
  }));
}

/**
 * Everything the event's guest page shows, or null when the event does not
 * exist. Throws when Firestore can't be read, so a cached page stays up rather
 * than being replaced by the defaults.
 */
export const getEventContent = cache(async (eventId: string): Promise<EventSiteData | null> => {
  const docs = await readEventDocs(eventId, false);
  return docs && buildEventSite(docs);
});

/**
 * The raw docs with every unpublished draft applied, for the admin preview
 * (`/<eventId>?preview=…`). The preview builds the site from them in the
 * browser, so the visual builder can change it live. Never cached.
 */
export const getEventDraftDocs = cache((eventId: string) => readEventDocs(eventId, true));

/**
 * Only the site text, global settings, theme and music, for the 404 page. Falls back to the
 * defaults when Firestore can't be read (the 404 is built at deploy time too).
 */
export const getSiteContent = cache(async (eventId: string): Promise<{ global: SiteGlobal; siteText: SiteText; theme: Theme; music: Music }> => {
  let global = mergeGlobal(undefined);
  let siteText = DEFAULT_SITE_TEXT;
  let theme = DEFAULT_THEME;
  let music = DEFAULT_MUSIC;

  try {
    const db = getAdminDb();
    const [globalDoc, siteTextDoc, themeDoc, musicDoc] = await Promise.all([
      db.doc(paths.content(eventId, 'globalSettings')).get(),
      db.doc(paths.content(eventId, 'siteText')).get(),
      db.doc(paths.content(eventId, 'theme')).get(),
      db.doc(paths.content(eventId, 'music')).get(),
    ]);
    global = mergeGlobal(globalDoc.data());
    siteText = mergeSiteText(DEFAULT_SITE_TEXT, siteTextDoc.data());
    theme = mergeTheme(themeDoc.data());
    music = mergeMusic(musicDoc.data());
  } catch (error) {
    console.error('Site content: using defaults, Firestore read failed:', error);
  }

  return { global, siteText, theme, music };
});

/** "December 20, 2026 15:00:00" -> "December 20, 2026"; the raw text if it can't be parsed. */
export function formatEventDate(targetDate: string): string {
  const date = new Date(targetDate);
  return Number.isNaN(date.getTime())
    ? targetDate
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
