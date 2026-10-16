// Relative imports: vitest has no '@/' alias (see genericContent.test.ts)
import type { DocumentData } from 'firebase/firestore';
import {
  guidelinesFromLegacy, hostsFromLegacy, peopleGroupsFromLegacy, readGuidelines, readHosts,
  readPeopleGroups, readVenues, venuesFromLegacy,
  type Guideline, type PeopleGroup, type Venue,
} from './genericContent';
import type { SiteText } from './siteText';

// How the guest site's content is built: the defaults with each event's
// Firestore `content/{doc}` overrides on top. Pure, and the defaults are an
// argument: the defaults themselves (src/data/wedding-content.json, the first
// couple's content) are imported only by ./weddingContent, which is server
// only, so no browser chunk carries them. The draft preview and the admin
// editors get them from the server as props (CONTENT_DEFAULTS).

type ContentJson = typeof import('../data/wedding-content.json');

/** The JSON's shape, with the generic lists typed (src/lib/genericContent.ts). */
export type WeddingContent = Omit<ContentJson, 'entourage' | 'details' | 'dressCode' | 'faqs'> & {
  entourage: Omit<ContentJson['entourage'], 'groups'> & { groups: PeopleGroup[] };
  details: Omit<ContentJson['details'], 'venues'> & { venues: Venue[] };
  dressCode: Omit<ContentJson['dressCode'], 'guidelines'> & { guidelines: Guideline[] };
};
export type SiteGlobal = WeddingContent['global'];

/** What content and site text fall back to where an event has saved nothing. */
export type ContentDefaults = { content: WeddingContent; siteText: SiteText };

type DocData = DocumentData | undefined;

/** The `content/{doc}` IDs the guest site reads (`siteText` is read separately). */
export const CONTENT_DOC_IDS = [
  'welcomeScreen', 'globalSettings', 'entranceScreen', 'ourStory', 'entourage', 'details',
  'dressCode', 'gallery', 'faq', 'registry', 'rsvpCta', 'rsvpForm',
] as const;

export type ContentDocId = (typeof CONTENT_DOC_IDS)[number];

/** Global settings over the defaults; an empty or non-text value keeps the default. */
export function mergeGlobalSettings(defaults: SiteGlobal, g: DocData): SiteGlobal {
  const global = { ...defaults };
  if (g) {
    for (const key of Object.keys(global) as (keyof SiteGlobal)[]) {
      if (typeof global[key] === 'string' && typeof g[key] === 'string' && g[key].trim() !== '') {
        (global as Record<string, unknown>)[key] = g[key];
      }
    }
  }
  // Content saved before Oct 2026 has groomName / brideName instead of hosts
  global.hosts = readHosts(g?.hosts) ?? hostsFromLegacy(g) ?? defaults.hosts;
  return global;
}

/**
 * `siteText` is only used for the group / guideline titles of content still in
 * the old shape (they were site text then).
 */
export function mergeContent(defaults: WeddingContent, docs: Partial<Record<ContentDocId | 'siteText', DocData>>): WeddingContent {
  const newContent = { ...defaults };
  const {
    welcomeScreen: welcomeData, globalSettings: globalData, entranceScreen: entranceData,
    ourStory: ourStoryData, entourage: entourageData, details: detailsData,
    dressCode: dressCodeData, gallery: galleryData, faq: faqData,
    registry: registryData, rsvpCta: rsvpCtaData, rsvpForm: rsvpFormData,
    siteText: siteTextData,
  } = docs;

  if (welcomeData) {
    newContent.welcomeScreen = {
      ...newContent.welcomeScreen,
      ...welcomeData
    };
  }

  if (entranceData) {
    newContent.entranceScreen = {
      ...newContent.entranceScreen,
      ...entranceData
    };
  }

  if (detailsData) {
    newContent.details = {
      ...newContent.details,
      header: {
        ...newContent.details.header,
        ...(detailsData.header || {})
      },
      // Old shape: ceremony + reception, with time/location/address from globalSettings
      venues: readVenues(detailsData.venues) ?? venuesFromLegacy(detailsData, globalData) ?? newContent.details.venues,
      orderOfEventsImage: detailsData.orderOfEventsImage ?? newContent.details.orderOfEventsImage
    };
  }

  newContent.global = mergeGlobalSettings(defaults.global, globalData);

  if (ourStoryData) {
    newContent.ourStory = {
      ...newContent.ourStory,
      subtitle: ourStoryData.subtitle ?? newContent.ourStory.subtitle,
      title: ourStoryData.title ?? newContent.ourStory.title,
      description: ourStoryData.description ?? newContent.ourStory.description,
      items: ourStoryData.items ?? newContent.ourStory.items
    };
  }

  if (entourageData) {
    newContent.entourage = {
      ...newContent.entourage,
      subtitle: entourageData.subtitle ?? newContent.entourage.subtitle,
      title: entourageData.title ?? newContent.entourage.title,
      groups: readPeopleGroups(entourageData.groups)
        ?? peopleGroupsFromLegacy(entourageData, siteTextData?.entourage)
        ?? newContent.entourage.groups,
    };
  }

  if (dressCodeData) {
    newContent.dressCode = {
      ...newContent.dressCode,
      header: {
        ...newContent.dressCode.header,
        ...(dressCodeData.header || {})
      },
      title: dressCodeData.title ?? newContent.dressCode.title,
      description: dressCodeData.description ?? newContent.dressCode.description,
      colors: dressCodeData.colors ?? newContent.dressCode.colors,
      guidelines: readGuidelines(dressCodeData.guidelines)
        ?? guidelinesFromLegacy(dressCodeData, siteTextData?.dressCode)
        ?? newContent.dressCode.guidelines,
      inspirationImages: dressCodeData.inspirationImages ?? newContent.dressCode.inspirationImages
    };
  }

  if (galleryData) {
    if (galleryData.images && Array.isArray(galleryData.images)) {
      newContent.gallery = galleryData.images as unknown as WeddingContent['gallery'];
    }
    if (galleryData.header) {
      newContent.galleryHeader = {
        ...newContent.galleryHeader,
        ...galleryData.header
      };
    }
  }

  if (faqData) {
    if (faqData.items && Array.isArray(faqData.items)) {
      newContent.faq = faqData.items;
    }
    if (faqData.header) {
      newContent.faqHeader = {
        ...newContent.faqHeader,
        ...faqData.header
      };
    }
  }

  if (registryData) {
    newContent.registry = {
      ...newContent.registry,
      ...registryData
    };
  }

  if (rsvpCtaData) {
    newContent.rsvpCta = {
      ...newContent.rsvpCta,
      ...rsvpCtaData
    };
  }

  if (rsvpFormData) {
    newContent.rsvpForm = {
      ...newContent.rsvpForm,
      ...rsvpFormData
    };
  }

  return newContent;
}
