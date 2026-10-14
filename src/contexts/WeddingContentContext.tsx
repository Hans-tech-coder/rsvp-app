'use client';

import React, { createContext, useContext } from 'react';
import { DEFAULT_EVENT_ID } from '@/lib/eventPaths';
import { DEFAULT_CONTENT, type WeddingContent } from '@/lib/weddingContent';

// The event's content is read and merged on the server (getEventContent in
// src/lib/siteContentServer.ts) and handed in by src/app/[event]/page.tsx, so
// the guest site never reads Firestore content from the browser.

interface WeddingContentContextType {
  /** The event whose content this is; guest server actions take it too. */
  eventId: string;
  content: WeddingContent;
}

const WeddingContentContext = createContext<WeddingContentContextType>({
  eventId: DEFAULT_EVENT_ID,
  content: DEFAULT_CONTENT,
});

export const useWeddingContent = () => useContext(WeddingContentContext);

export function WeddingContentProvider({ eventId, content, children }: { eventId: string; content: WeddingContent; children: React.ReactNode }) {
  return (
    <WeddingContentContext.Provider value={{ eventId, content }}>
      {children}
    </WeddingContentContext.Provider>
  );
}
