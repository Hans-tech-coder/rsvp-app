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
        const welcomeDoc = await getDoc(doc(db, 'websiteContent', 'welcomeScreen'));
        const globalDoc = await getDoc(doc(db, 'websiteContent', 'globalSettings'));
        const entranceDoc = await getDoc(doc(db, 'websiteContent', 'entranceScreen'));
        const ourStoryDoc = await getDoc(doc(db, 'websiteContent', 'ourStory'));
        
        let newContent = { ...weddingContentDefault };
        
        if (welcomeDoc.exists()) {
          newContent.welcomeScreen = {
            ...newContent.welcomeScreen,
            ...welcomeDoc.data()
          };
        }

        if (entranceDoc.exists()) {
          newContent.entranceScreen = {
            ...newContent.entranceScreen,
            ...entranceDoc.data()
          };
        }

        if (globalDoc.exists()) {
          const globalData = globalDoc.data();
          
          // Map to newContent.global
          newContent.global = {
            ...newContent.global,
            logo: globalData.logo || newContent.global.logo,
            brideName: globalData.brideName || newContent.global.brideName,
            groomName: globalData.groomName || newContent.global.groomName,
            dateFull: globalData.dateFull || newContent.global.dateFull,
            venueShort: globalData.venueShort || newContent.global.venueShort,
            targetDate: globalData.targetDate || newContent.global.targetDate,
          };

          // Map to newContent.details
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

        if (ourStoryDoc.exists()) {
          const ourStoryData = ourStoryDoc.data();
          newContent.ourStory = {
            ...newContent.ourStory,
            subtitle: ourStoryData.subtitle ?? newContent.ourStory.subtitle,
            title: ourStoryData.title ?? newContent.ourStory.title,
            description: ourStoryData.description ?? newContent.ourStory.description,
            items: ourStoryData.items ?? newContent.ourStory.items
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
