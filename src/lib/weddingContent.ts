// Relative imports: vitest has no '@/' alias (see genericContent.test.ts)
import weddingContentDefault from '../data/wedding-content.json';
import type { DocumentData } from 'firebase/firestore';
import { mergeContent, mergeGlobalSettings, type ContentDefaults, type ContentDocId, type SiteGlobal, type WeddingContent } from './contentMerge';
import type { SiteText } from './siteText';

// The built-in defaults: src/data/wedding-content.json, the first couple's
// content. Server only (server pages, actions, routes): a client module that
// imports this file ships the whole JSON in a public /_next/static chunk.
// Client code gets the defaults as props (CONTENT_DEFAULTS, passed by the
// preview page and the admin content / builder layouts) and merges with
// ./contentMerge.

export { CONTENT_DOC_IDS, type ContentDefaults, type ContentDocId, type SiteGlobal, type WeddingContent } from './contentMerge';

type ContentJson = typeof weddingContentDefault;

// The JSON's `faqs` key is a leftover of sync-content.js (the FAQ screen reads
// `faq` + `faqHeader`). Left out, or every event's page would carry the first
// couple's FAQ text in its payload.
const json: Partial<ContentJson> = { ...weddingContentDefault };
delete json.faqs;

/** `wedding-content.json` typed as content (without `faqs`). */
export const DEFAULT_CONTENT = json as WeddingContent;

/** The JSON's site text: every event's wording until it is edited (src/lib/siteText.ts). */
export const DEFAULT_SITE_TEXT: SiteText = weddingContentDefault.siteText;

/** Both, for client code that merges (draft preview, admin editors). */
export const CONTENT_DEFAULTS: ContentDefaults = { content: DEFAULT_CONTENT, siteText: DEFAULT_SITE_TEXT };

type DocData = DocumentData | undefined;

/** Global settings over the JSON defaults (src/lib/contentMerge.ts). */
export function mergeGlobal(g: DocData): SiteGlobal {
  return mergeGlobalSettings(DEFAULT_CONTENT.global, g);
}

/** Content docs over the JSON defaults (src/lib/contentMerge.ts). */
export function mergeWeddingContent(docs: Partial<Record<ContentDocId | 'siteText', DocData>>): WeddingContent {
  return mergeContent(DEFAULT_CONTENT, docs);
}
