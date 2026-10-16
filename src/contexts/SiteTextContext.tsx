'use client';

import React, { createContext, useContext } from 'react';
import type { SiteText } from '@/lib/siteText';

// Site text is read on the server (src/lib/siteContentServer.ts) and handed in
// by the event page (src/app/[event]/EventSite.tsx) and the 404 page
// (NotFoundPage), so the loading screen and the music hint show the edited
// wording on first paint. No default value: the JSON defaults would put the
// first couple's content into every guest page's JavaScript.
const SiteTextContext = createContext<SiteText | null>(null);

export const useSiteText = () => {
  const value = useContext(SiteTextContext);
  if (!value) throw new Error('useSiteText() needs a <SiteTextProvider> above it');
  return value;
};

export function SiteTextProvider({ value, children }: { value: SiteText; children: React.ReactNode }) {
  return <SiteTextContext.Provider value={value}>{children}</SiteTextContext.Provider>;
}
