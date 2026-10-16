import type { DocumentData } from 'firebase/firestore';
import { mergeSiteText, type SiteText } from './siteText';
import { mergeTheme, type Theme } from './theme';
import { mergeMusic, type Music } from './music';
import { mergeScreens, type ScreenConfig } from './screens';
import { mergeContent, type ContentDefaults, type ContentDocId, type WeddingContent } from './contentMerge';
import type { EditableDocId } from './contentDrafts';

// Everything one event's guest site shows, built from its raw content docs.
// Pure: the server builds it for the live page (siteContentServer.ts) and the
// draft preview builds it again in the browser as the builder sends edits.
// The defaults come from the caller (CONTENT_DEFAULTS in ./weddingContent,
// server only; the preview gets them as a prop), so this file and its
// imports carry none of the first couple's content.

export type EventSiteData = { content: WeddingContent; siteText: SiteText; theme: Theme; music: Music; screens: ScreenConfig[] };

/** Each content doc as stored (plain JSON), missing ones undefined. */
export type SiteDocs = Partial<Record<EditableDocId, DocumentData | undefined>>;

export function buildEventSite(docs: SiteDocs, defaults: ContentDefaults): EventSiteData {
  return {
    content: mergeContent(defaults.content, docs as Record<ContentDocId, DocumentData | undefined>),
    siteText: mergeSiteText(defaults.siteText, docs.siteText),
    theme: mergeTheme(docs.theme),
    music: mergeMusic(docs.music),
    screens: mergeScreens(docs.screens),
  };
}
