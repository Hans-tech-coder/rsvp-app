'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import weddingContentDefault from '@/data/wedding-content.json';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

type WeddingContent = typeof weddingContentDefault;

interface WeddingContentContextType {
  content: WeddingContent;
  loading: boolean;
}

const WeddingContentContext = createContext<WeddingContentContextType>({
  content: weddingContentDefault,
  loading: true,
});

export const useWeddingContent = () => useContext(WeddingContentContext);

export function WeddingContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<WeddingContent>(weddingContentDefault);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch all the overrides
        // For now, we only have welcomeScreen, but we can extend this to others.
        const welcomeDoc = await getDoc(doc(db, 'websiteContent', 'welcomeScreen'));
        
        let newContent = { ...weddingContentDefault };
        
        if (welcomeDoc.exists()) {
          newContent.welcomeScreen = {
            ...newContent.welcomeScreen,
            ...welcomeDoc.data()
          };
        }
        
        setContent(newContent);
      } catch (error) {
        console.error("Error fetching website content overrides:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <WeddingContentContext.Provider value={{ content, loading }}>
      {children}
    </WeddingContentContext.Provider>
  );
}
