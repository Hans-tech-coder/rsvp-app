'use client';

import { createContext, useContext, useState } from 'react';
import type { ContentDefaults } from '@/lib/contentMerge';

// The built-in defaults (src/data/wedding-content.json) for the editors'
// fallbacks, sent by the server layouts of /admin/content and /admin/builder
// (layout.tsx in each) instead of imported: an import would ship the first
// couple's content in a public /_next/static chunk. Null without a session.
const ContentDefaultsContext = createContext<ContentDefaults | null>(null);

export function ContentDefaultsProvider({ value, children }: { value: ContentDefaults | null; children: React.ReactNode }) {
  // The first copy for the life of the page: a refresh sends an equal new one,
  // which would re-run the editors' loads (the defaults are in their deps).
  const [defaults] = useState(value);
  return <ContentDefaultsContext.Provider value={defaults}>{children}</ContentDefaultsContext.Provider>;
}

/** The default content and site text. Only inside the content page or the builder. */
export function useContentDefaults(): ContentDefaults {
  const defaults = useContext(ContentDefaultsContext);
  if (!defaults) throw new Error('useContentDefaults: no ContentDefaultsProvider (admin content / builder layout)');
  return defaults;
}
