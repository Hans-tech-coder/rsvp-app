"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';
import { RevealImage } from '@/components/ui/RevealImage';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { ScrollContainerProvider, ScrollReveal, SCROLL_MOTION } from '@/components/ui/ScrollMotion';

interface DetailsScreenProps {
  onContinue: () => void;
}

export function DetailsScreen({ onContinue }: DetailsScreenProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const { content } = useWeddingContent();
  const text = useSiteText();

  const scrollRef = useRef<HTMLElement>(null);
  const venues = content.details.venues;

  const openMap = (url: string) => {
    setMapUrl(url);
  };

  const closeMap = () => {
    setMapUrl(null);
  };

  const addToCalendar = (title: string, desc: string, loc: string, start: string) => {
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start.replace(/[-:]/g, "")}Z/${start.replace(/[-:]/g, "")}Z&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc)}`;
    window.open(url, '_blank');
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImage = (url: string, filename: string) => {
    if (!url) return;
    setIsDownloading(true);
    
    // Create an invisible iframe or direct window location to trigger the proxy download
    // This avoids CORS completely and utilizes the browser's native download mechanism
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = filename; // This is a hint, but the proxy's Content-Disposition forces it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Slight delay to allow the download to start before removing the loading state
    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  };

  return (
    <section ref={scrollRef} className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <ScrollContainerProvider containerRef={scrollRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface via-primary-deep to-surface pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <TextsReveal className="text-center mb-16 relative z-10 flex flex-col items-center">
          <span className="text-sm font-elegant italic text-accent-light/80 tracking-widest block mb-4">{content.details.header?.subtitle}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading text-ink font-light tracking-widest drop-shadow-md">
            {content.details.header?.title}
          </h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mt-6"></div>
          <p className="text-base font-elegant italic text-accent-light/70 mt-3 max-w-lg mx-auto">{content.details.header?.description}</p>
        </TextsReveal>

        {/* Two cards per row on desktop; one venue, or the last of an odd number, is centered */}
        <div className={`grid grid-cols-1 ${venues.length > 1 ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-8`}>
          {venues.map((venue, index) => {
            const centered = venues.length > 1 && venues.length % 2 === 1 && index === venues.length - 1;
            const buttons = [venue.mapLink, venue.calendarStart].filter(Boolean).length;
            return (
          <ScrollReveal key={venue.id} delay={index % 2 ? SCROLL_MOTION.revealStagger : 0} className={centered ? 'md:col-span-2 md:w-[calc(50%-1rem)] md:mx-auto' : undefined}>
          <motion.div whileHover={{ y: -5 }} className="h-full bg-surface/60 p-8 md:p-12 rounded-xl shadow-lg border border-accent/20 hover:shadow-xl hover:border-accent/40 transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                {venue.subtitle ? <span className="text-[10px] uppercase tracking-[0.3em] bg-accent/10 border border-accent/30 text-accent-light px-3 py-1 font-semibold rounded-full">{venue.subtitle}</span> : <span />}
                <span className="text-sm font-heading text-accent-light/70">{venue.time}</span>
              </div>
              <h3 className="text-3xl font-heading text-ink font-light tracking-wide mb-4">{venue.title}</h3>
              <div className="w-16 h-[1px] bg-gradient-to-r from-accent/50 to-transparent mb-6"></div>
              <p className="text-sm font-elegant text-ink mb-6 leading-relaxed">
                {venue.description}
              </p>
              <div className="space-y-3 text-sm text-ink mb-8 font-elegant tracking-wide">
                {venue.location && (
                <div className="flex items-start">
                  <span className="text-accent mr-3 mt-[2px]">✦</span>
                  <p className="flex-1"><strong>{text.details.location}</strong>&nbsp;{venue.location}</p>
                </div>
                )}
                {venue.address && (
                <div className="flex items-start">
                  <span className="text-accent mr-3 mt-[2px]">✦</span>
                  <p className="flex-1"><strong>{text.details.address}</strong>&nbsp;{venue.address}</p>
                </div>
                )}
              </div>
            </div>
            {buttons > 0 && (
            <div className={`grid grid-cols-1 ${buttons === 2 ? 'sm:grid-cols-2' : ''} gap-4 mt-6 pt-6 border-t border-accent/20`}>
              {venue.mapLink && (
              <button onClick={() => openMap(venue.mapLink)} className="text-center py-3 bg-transparent border border-accent/40 text-accent hover:bg-accent/10 hover:border-accent hover:text-accent-light text-xs tracking-[0.15em] font-medium uppercase transition-all duration-300 rounded-sm">
                {text.details.viewLocation}
              </button>
              )}
              {venue.calendarStart && (
              <button onClick={() => addToCalendar(venue.calendarDesc || venue.title, venue.calendarDesc, venue.calendarLoc, venue.calendarStart)} className="text-center py-3 bg-primary border border-accent/30 text-accent hover:bg-primary/80 hover:border-accent hover:text-accent-light text-xs tracking-[0.15em] font-medium uppercase transition-all duration-300 rounded-sm">
                {text.details.addToCalendar}
              </button>
              )}
            </div>
            )}
          </motion.div>
          </ScrollReveal>
            );
          })}
        </div>

        {/* Order of Events Section */}
        {content.details.orderOfEventsImage && (
          <ScrollReveal className="mt-24 w-full flex flex-col items-center">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mb-16"></div>
            
            <div className="relative w-fit max-w-full md:max-w-3xl mx-auto rounded-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-accent/10 group mb-10">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"></div>
              <RevealImage 
                src={content.details.orderOfEventsImage} 
                alt="Order of Events" 
                className="block max-w-full h-auto max-h-[85vh] transition-transform duration-1000 ease-out group-hover:scale-[1.02]" 
                wrapperClassName="w-full h-full"
              />
            </div>
            
            <button 
              onClick={() => handleDownloadImage(content.details.orderOfEventsImage, 'Order_of_Events.jpg')}
              disabled={isDownloading}
              className={`group relative overflow-hidden inline-flex items-center justify-center gap-3 px-10 py-4 bg-transparent border border-accent/30 text-accent hover:text-surface hover:border-accent text-xs tracking-[0.2em] font-medium uppercase transition-all duration-500 rounded-sm ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-accent to-accent-light transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out"></div>
              {isDownloading ? (
                <svg className="w-4 h-4 relative z-10 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              ) : (
                <svg className="w-4 h-4 relative z-10 group-hover:-translate-y-0.5 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              )}
              <span className="relative z-10">{isDownloading ? text.details.downloading : text.details.saveCopy}</span>
            </button>
          </ScrollReveal>
        )}
      </div>

      <ScrollReveal delay={0.2} className="w-full flex justify-center pb-8 md:pb-24 pt-8 relative z-20">
        <button onClick={onContinue} aria-label={text.common.continue} className="group flex flex-col items-center justify-center space-y-3 cursor-pointer focus:outline-none transition-transform hover:-translate-y-1 active:scale-95 mt-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-ink/70 font-medium group-hover:text-accent transition-colors duration-300">{text.common.continue}</span>
          <div className="w-10 h-10 rounded-full border border-ink/30 flex items-center justify-center transition-all duration-300 group-hover:bg-accent/10 group-hover:border-accent">
            <svg className="w-4 h-4 text-ink/70 transition-transform duration-300 group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
        </button>
      </ScrollReveal>

      <EmbeddedFooter />

      {/* Map Modal */}
      <AnimatePresence>
        {mapUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-primary-light/30 w-full max-w-4xl h-[80vh] rounded-xl overflow-hidden relative flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-4 border-b border-accent/20 bg-surface">
                <h3 className="font-heading tracking-widest text-accent-light">{text.details.mapTitle}</h3>
                <button onClick={closeMap} className="text-ink/70 hover:text-accent transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="flex-1 w-full h-full relative">
                <iframe src={mapUrl} className="absolute inset-0 w-full h-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </ScrollContainerProvider>
    </section>
  );
}
