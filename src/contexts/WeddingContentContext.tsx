'use client';

import React, { createContext, useContext } from 'react';
import type { WeddingContent } from '@/lib/weddingContent';

// The event's content is read and merged on the server (getEventContent in
// src/lib/siteContentServer.ts) and handed in by src/app/[event]/page.tsx, so
// the guest site never reads Firestore content from the browser. No default
// value: the JSON defaults would put the first couple's content into every
// guest page's JavaScript.

interface WeddingContentContextType {
  /** The event whose content this is; guest server actions take it too. */
  eventId: string;
  content: WeddingContent;
}

const WeddingContentContext = createContext<WeddingContentContextType | null>(null);

export const useWeddingContent = () => {
  const value = useContext(WeddingContentContext);
  if (!value) throw new Error('useWeddingContent() needs a <WeddingContentProvider> above it');
  return value;
};

export function WeddingContentProvider({ eventId, content, children }: { eventId: string; content: WeddingContent; children: React.ReactNode }) {
  return (
    <WeddingContentContext.Provider value={{ eventId, content }}>
      {children}
    </WeddingContentContext.Provider>
  );
}
