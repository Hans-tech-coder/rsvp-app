"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../lib/firebase/client';
import defaultContent from '../data/wedding-content.json';

// Type definitions matching the wedding-content.json structure
export type WeddingContent = typeof defaultContent;

interface ContentContextType {
  content: WeddingContent;
  loading: boolean;
}

const WeddingContentContext = createContext<ContentContextType>({
  content: defaultContent,
  loading: true,
});

export function WeddingContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<WeddingContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveContent() {
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'websiteContent', 'live');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const liveData = docSnap.data();
          
          // Basic deep merge function to preserve structure
          const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
            const result = { ...target };
            for (const key of Object.keys(source)) {
              if (source[key] instanceof Object && !Array.isArray(source[key])) {
                result[key] = deepMerge(
                  (target[key] as Record<string, unknown>) || {}, 
                  source[key] as Record<string, unknown>
                );
              } else {
                result[key] = source[key];
              }
            }
            return result;
          };
          
          const mergedContent = deepMerge(
            defaultContent as unknown as Record<string, unknown>, 
            liveData as Record<string, unknown>
          ) as unknown as WeddingContent;
          
          setContent(mergedContent);
        }
      } catch (error) {
        console.error('Error fetching live content:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveContent();
  }, []);

  return (
    <WeddingContentContext.Provider value={{ content, loading }}>
      {children}
    </WeddingContentContext.Provider>
  );
}

export function useWeddingContent() {
  return useContext(WeddingContentContext);
}
