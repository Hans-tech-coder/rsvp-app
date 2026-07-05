"use client";

import React, { useState } from 'react';
import { motion, Variants, AnimatePresence, PanInfo } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { DraggableSlider } from '@/components/ui/DraggableSlider';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

interface GalleryScreenProps {
  onContinue: () => void;
  onLightboxChange?: (isOpen: boolean) => void;
}

export function GalleryScreen({ onContinue, onLightboxChange }: GalleryScreenProps) {
  const { content } = useWeddingContent();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Call the callback when lightbox state changes
  React.useEffect(() => {
    if (onLightboxChange) {
      onLightboxChange(lightboxIndex !== null);
    }
  }, [lightboxIndex, onLightboxChange]);
  // Normalize gallery data to ensure it's an array
  const galleryData = content.gallery || {};
  const imagesArray = Array.isArray(galleryData) 
    ? galleryData 
    : ((galleryData as any).images || Object.values(galleryData).filter(val => typeof val === 'string'));

  const midIndex = Math.ceil(imagesArray.length / 2);
  const topRowImages = imagesArray.slice(0, midIndex);
  const bottomRowImages = imagesArray.slice(midIndex);

  const handlePrev = (e?: React.MouseEvent | Event) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev === 0 ? imagesArray.length - 1 : prev! - 1));
    }
  };

  const handleNext = (e?: React.MouseEvent | Event) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev === imagesArray.length - 1 ? 0 : prev! + 1));
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };



  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-7xl mx-auto text-center w-full relative z-10"
      >
        <motion.div variants={itemVariants} className="mb-16">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">{content.galleryHeader?.subtitle || "Our Memories"}</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">{content.galleryHeader?.title || "The Gallery"}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
        </motion.div>

        <div className="relative w-full max-w-full mt-8" style={{
          mask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)'
        }}>
          <div className="slider-wrapper w-full py-2 relative">
            <DraggableSlider speed={0.4}>
              {topRowImages.map((src: string, index: number) => (
                <div 
                  key={`top-${index}`}
                  className="w-[180px] sm:w-[220px] md:w-[280px] aspect-[4/5] rounded-md overflow-hidden relative group cursor-pointer shadow-md flex-shrink-0"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img src={src} alt={`Engagement ${index + 1}`} className="w-full h-full object-cover transform duration-700 group-hover:scale-110 group-hover:brightness-75 pointer-events-none" />
                  <div className="absolute inset-0 bg-wedding-deepburgundy/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center pointer-events-none">
                    <span className="text-wedding-goldlight text-[10px] uppercase tracking-[0.3em] border border-wedding-gold/50 px-4 py-2 bg-wedding-dark/30 backdrop-blur-sm pointer-events-none">View</span>
                  </div>
                </div>
              ))}
            </DraggableSlider>
          </div>
          
          {/* Bottom Row Slider (Reverse) */}
          <div className="slider-wrapper w-full py-2 relative mt-4">
            <DraggableSlider speed={0.5} reverse={true}>
              {bottomRowImages.map((src: string, index: number) => {
                const originalIndex = midIndex + index;
                return (
                <div 
                  key={`bottom-${index}`}
                  className="w-[180px] sm:w-[220px] md:w-[280px] aspect-[4/5] rounded-md overflow-hidden relative group cursor-pointer shadow-md flex-shrink-0"
                  onClick={() => setLightboxIndex(originalIndex)}
                >
                  <img src={src} alt={`Memory ${originalIndex + 1}`} className="w-full h-full object-cover transform duration-700 group-hover:scale-110 group-hover:brightness-75 pointer-events-none" />
                  <div className="absolute inset-0 bg-wedding-deepburgundy/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center pointer-events-none">
                    <span className="text-wedding-goldlight text-[10px] uppercase tracking-[0.3em] border border-wedding-gold/50 px-4 py-2 bg-wedding-dark/30 backdrop-blur-sm pointer-events-none">View</span>
                  </div>
                </div>
              )})}
            </DraggableSlider>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="w-full flex justify-center pb-8 md:pb-24 pt-8 relative z-20"
      >
        <button onClick={onContinue} className="group flex flex-col items-center justify-center space-y-3 cursor-pointer focus:outline-none animate-bounce mt-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-wedding-cream/70 font-medium group-hover:text-wedding-gold transition-colors duration-300">Continue</span>
          <div className="w-10 h-10 rounded-full border border-wedding-cream/30 flex items-center justify-center transition-all duration-300 group-hover:bg-wedding-gold/10 group-hover:border-wedding-gold">
            <svg className="w-4 h-4 text-wedding-cream/70 transition-transform duration-300 group-hover:translate-y-1 group-hover:text-wedding-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
        </button>
      </motion.div>

      <EmbeddedFooter />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 touch-none"
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div 
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.8}
              onDragEnd={(e: any, info: PanInfo) => {
                const swipeThreshold = 50;
                const velocityY = info.velocity.y;
                if (info.offset.y < -swipeThreshold || velocityY < -500) {
                  handleNext();
                } else if (info.offset.y > swipeThreshold || velocityY > 500) {
                  handlePrev();
                }
              }}
            >
              <img 
                src={imagesArray[lightboxIndex]} 
                alt={`Gallery view ${lightboxIndex + 1}`} 
                draggable={false}
                className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl pointer-events-auto select-none" 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            </motion.div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              className="fixed top-4 right-4 md:top-6 md:right-6 text-wedding-cream/70 hover:text-wedding-cream transition-colors z-[110] bg-black/50 hover:bg-black/70 p-3 rounded-full backdrop-blur-sm"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <button 
              onClick={handlePrev}
              className="hidden md:block fixed left-2 md:left-8 top-1/2 -translate-y-1/2 text-wedding-cream/70 hover:text-wedding-cream transition-colors z-[110] bg-black/50 hover:bg-black/70 p-3 rounded-full backdrop-blur-sm"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>

            <button 
              onClick={handleNext}
              className="hidden md:block fixed right-2 md:right-8 top-1/2 -translate-y-1/2 text-wedding-cream/70 hover:text-wedding-cream transition-colors z-[110] bg-black/50 hover:bg-black/70 p-3 rounded-full backdrop-blur-sm"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center justify-center md:hidden pointer-events-none animate-bounce text-wedding-cream/70">
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium drop-shadow-md">Swipe</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
