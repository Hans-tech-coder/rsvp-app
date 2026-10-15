import type { DocumentData } from 'firebase/firestore';
import { DEFAULT_SITE_TEXT, mergeSiteText, type SiteText } from './siteText';
import { mergeTheme, type Theme } from './theme';
import { mergeMusic, type Music } from './music';
import { mergeScreens, type ScreenConfig } from './screens';
import { mergeWeddingContent, type ContentDocId, type WeddingContent } from './weddingContent';
import type { EditableDocId } from './contentDrafts';

// Everything one event's guest site shows, built from its raw content docs.
// Pure: the server builds it for the live page (siteContentServer.ts) and the
// draft preview builds it again in the browser as the builder sends edits.

export type EventSiteData = { content: WeddingContent; siteText: SiteText; theme: Theme; music: Music; screens: ScreenConfig[] };

/** Each content doc as stored (plain JSON), missing ones undefined. */
export type SiteDocs = Partial<Record<EditableDocId, DocumentData | undefined>>;

export function buildEventSite(docs: SiteDocs): EventSiteData {
  return {
    content: mergeWeddingContent(docs as Record<ContentDocId, DocumentData | undefined>),
    siteText: mergeSiteText(DEFAULT_SITE_TEXT, docs.siteText),
    theme: mergeTheme(docs.theme),
    music: mergeMusic(docs.music),
    screens: mergeScreens(docs.screens),
  };
}
