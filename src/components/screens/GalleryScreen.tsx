"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { DraggableSlider } from '@/components/ui/DraggableSlider';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { RevealImage } from '@/components/ui/RevealImage';
import { ViewOverlay } from '@/components/ui/ViewOverlay';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { CircularImageGallery, loadGsap } from '@/components/ui/circular-image-gallery';
import { ScrollContainerProvider, ScrollReveal } from '@/components/ui/ScrollMotion';

interface GalleryScreenProps {
  onContinue: () => void;
  onLightboxChange?: (isOpen: boolean) => void;
}

export function GalleryScreen({ onContinue, onLightboxChange }: GalleryScreenProps) {
  const { content } = useWeddingContent();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(true);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch GSAP while the guest browses, so the first photo tap opens at once.
  React.useEffect(() => {
    loadGsap().catch(() => {});
  }, []);

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
      setDirection(-1);
      setLightboxIndex((prev) => (prev === 0 ? imagesArray.length - 1 : prev! - 1));
    }
  };

  const handleNext = (e?: React.MouseEvent | Event) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setDirection(1);
      setLightboxIndex((prev) => (prev === imagesArray.length - 1 ? 0 : prev! + 1));
    }
  };

  const scrollRef = useRef<HTMLElement>(null);

  const lightboxVariants = {
    enter: ({ direction, isMobile }: { direction: number; isMobile: boolean }) => ({
      rotateX: isMobile ? (direction > 0 ? 90 : -90) : 0,
      rotateY: !isMobile ? (direction > 0 ? 90 : -90) : 0,
      z: -300,
      opacity: 0,
      scale: 0.85,
      filter: "blur(10px)",
    }),
    center: {
      zIndex: 1,
      rotateX: 0,
      rotateY: 0,
      z: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        rotateX: { type: "spring", stiffness: 100, damping: 20 },
        rotateY: { type: "spring", stiffness: 100, damping: 20 },
        z: { type: "spring", stiffness: 100, damping: 20 },
        opacity: { duration: 0.8, ease: [0.64, 0.04, 0.35, 1] },
        scale: { duration: 0.8, ease: [0.64, 0.04, 0.35, 1] },
        filter: { duration: 0.8, ease: [0.64, 0.04, 0.35, 1] }
      }
    },
    exit: ({ direction, isMobile }: { direction: number; isMobile: boolean }) => ({
      zIndex: 0,
      rotateX: isMobile ? (direction < 0 ? 90 : -90) : 0,
      rotateY: !isMobile ? (direction < 0 ? 90 : -90) : 0,
      z: -300,
      opacity: 0,
      scale: 0.85,
      filter: "blur(10px)",
      transition: {
        rotateX: { type: "spring", stiffness: 100, damping: 20 },
        rotateY: { type: "spring", stiffness: 100, damping: 20 },
        z: { type: "spring", stiffness: 100, damping: 20 },
        opacity: { duration: 0.8, ease: [0.64, 0.04, 0.35, 1] },
        scale: { duration: 0.8, ease: [0.64, 0.04, 0.35, 1] },
        filter: { duration: 0.8, ease: [0.64, 0.04, 0.35, 1] }
      }
    })
  };



  return (
    <section ref={scrollRef} className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <ScrollContainerProvider containerRef={scrollRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <div className="max-w-7xl mx-auto text-center w-full relative z-10">
        <TextsReveal className="mb-16 flex flex-col items-center">
          <span className="text-sm font-cormorant italic text-wedding-goldlight/80 tracking-widest block mb-4">{content.galleryHeader?.subtitle || "Our Memories"}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-cinzel text-wedding-cream font-light tracking-widest drop-shadow-md">{content.galleryHeader?.title || "The Gallery"}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
        </TextsReveal>

        <ScrollReveal className="mt-8">
        <div className="relative w-full max-w-full" style={{
          mask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)'
        }}>
          <div className="slider-wrapper w-full py-2 relative">
            <DraggableSlider speed={0.4}>
              {topRowImages.map((src: string, index: number) => (
                <div key={`top-${index}`} className="w-[180px] sm:w-[220px] md:w-[280px] aspect-[4/5] t-view-card relative overflow-hidden rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-wedding-gold/10 cursor-pointer flex-shrink-0" onClick={() => setLightboxIndex(index)}>
                  <RevealImage src={src} alt={`Engagement ${index + 1}`} className="w-full h-full object-cover pointer-events-none" wrapperClassName="t-view-media w-full h-full" sizes="(min-width: 768px) 280px, (min-width: 640px) 220px, 180px" />
                  <ViewOverlay />
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
                  className="w-[180px] sm:w-[220px] md:w-[280px] aspect-[4/5] t-view-card rounded-md overflow-hidden relative cursor-pointer shadow-md border border-wedding-gold/10 flex-shrink-0"
                  onClick={() => { setDirection(0); setLightboxIndex(originalIndex); }}
                >
                  <RevealImage src={src} alt={`Memory ${originalIndex + 1}`} className="w-full h-full object-cover pointer-events-none" wrapperClassName="t-view-media w-full h-full" sizes="(min-width: 768px) 280px, (min-width: 640px) 220px, 180px" />
                  <ViewOverlay />
                </div>
              )})}
            </DraggableSlider>
          </div>
        </div>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={0.2} className="w-full flex justify-center pb-8 md:pb-24 pt-8 relative z-20">
        <button onClick={onContinue} aria-label="Continue" className="group flex flex-col items-center justify-center space-y-3 cursor-pointer focus:outline-none transition-transform hover:-translate-y-1 active:scale-95 mt-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-wedding-cream/70 font-medium group-hover:text-wedding-gold transition-colors duration-300">Continue</span>
          <div className="w-10 h-10 rounded-full border border-wedding-cream/30 flex items-center justify-center transition-all duration-300 group-hover:bg-wedding-gold/10 group-hover:border-wedding-gold">
            <svg className="w-4 h-4 text-wedding-cream/70 transition-transform duration-300 group-hover:text-wedding-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
        </button>
      </ScrollReveal>

      <EmbeddedFooter />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <CircularImageGallery 
              images={imagesArray.map((src: string) => ({ url: src }))}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </ScrollContainerProvider>
    </section>
  );
}
