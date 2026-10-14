import weddingContentDefault from '@/data/wedding-content.json';
import type { DocumentData } from 'firebase/firestore';
import { normalizePrincipalSponsors } from '@/lib/principalSponsors';

// How the guest site's content is built: the JSON defaults with each event's
// Firestore `content/{doc}` overrides on top. Pure, so the server reads the
// docs (src/lib/siteContentServer.ts) and this merges them.

export type WeddingContent = typeof weddingContentDefault;
export type SiteGlobal = WeddingContent['global'];

type DocData = DocumentData | undefined;

/** The `content/{doc}` IDs the guest site reads (`siteText` is read separately). */
export const CONTENT_DOC_IDS = [
  'welcomeScreen', 'globalSettings', 'entranceScreen', 'ourStory', 'entourage', 'details',
  'dressCode', 'gallery', 'faq', 'registry', 'rsvpCta', 'rsvpForm',
] as const;

export type ContentDocId = (typeof CONTENT_DOC_IDS)[number];

/** Global settings over the defaults; an empty or non-text value keeps the default. */
export function mergeGlobal(g: DocData): SiteGlobal {
  const global = { ...weddingContentDefault.global };
  if (g) {
    for (const key of Object.keys(global) as (keyof SiteGlobal)[]) {
      if (typeof g[key] === 'string' && g[key].trim() !== '') global[key] = g[key];
    }
  }
  return global;
}

export function mergeWeddingContent(docs: Partial<Record<ContentDocId, DocData>>): WeddingContent {
  const newContent = { ...weddingContentDefault };
  const {
    welcomeScreen: welcomeData, globalSettings: globalData, entranceScreen: entranceData,
    ourStory: ourStoryData, entourage: entourageData, details: detailsData,
    dressCode: dressCodeData, gallery: galleryData, faq: faqData,
    registry: registryData, rsvpCta: rsvpCtaData, rsvpForm: rsvpFormData,
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
      ceremony: {
        ...newContent.details.ceremony,
        ...(detailsData.ceremony || {})
      },
      reception: {
        ...newContent.details.reception,
        ...(detailsData.reception || {})
      },
      orderOfEventsImage: detailsData.orderOfEventsImage ?? newContent.details.orderOfEventsImage
    };
  }

  newContent.global = mergeGlobal(globalData);
  if (globalData) {
    // The venue fields are edited in Global Settings, shown on Event Details.
    newContent.details = {
      ...newContent.details,
      ceremony: {
        ...newContent.details.ceremony,
        time: globalData.ceremonyTime || newContent.details.ceremony.time,
        location: globalData.ceremonyLocation || newContent.details.ceremony.location,
        address: globalData.ceremonyAddress || newContent.details.ceremony.address,
      },
      reception: {
        ...newContent.details.reception,
        time: globalData.receptionTime || newContent.details.reception.time,
        location: globalData.receptionLocation || newContent.details.reception.location,
        address: globalData.receptionAddress || newContent.details.reception.address,
      }
    };
  }

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
      principalSponsors: normalizePrincipalSponsors(entourageData.principalSponsors) ?? newContent.entourage.principalSponsors,
      honorAttendants: entourageData.honorAttendants ?? newContent.entourage.honorAttendants,
      bridesmaids: entourageData.bridesmaids ?? newContent.entourage.bridesmaids,
      groomsmen: entourageData.groomsmen ?? newContent.entourage.groomsmen,
      parents: entourageData.parents ?? newContent.entourage.parents,
      flowerGirls: entourageData.flowerGirls ?? newContent.entourage.flowerGirls,
      ringBearers: entourageData.ringBearers ?? newContent.entourage.ringBearers
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
      ladiesGuideline: dressCodeData.ladiesGuideline ?? newContent.dressCode.ladiesGuideline,
      gentlemenGuideline: dressCodeData.gentlemenGuideline ?? newContent.dressCode.gentlemenGuideline,
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
