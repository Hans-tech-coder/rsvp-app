'use client';

import React, { createContext, useContext } from 'react';
import { DEFAULT_SITE_TEXT, type SiteText } from '@/lib/siteText';

// Site text is read on the server (src/lib/siteContentServer.ts) and handed to
// the whole app by the root layout, so even the loading screen, the music hint
// and the 404 page show the edited wording on first paint.
const SiteTextContext = createContext<SiteText>(DEFAULT_SITE_TEXT);

export const useSiteText = () => useContext(SiteTextContext);

export function SiteTextProvider({ value, children }: { value: SiteText; children: React.ReactNode }) {
  return <SiteTextContext.Provider value={value}>{children}</SiteTextContext.Provider>;
}
