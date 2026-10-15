"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { InkRevealCanvas } from '@/components/ui/InkRevealCanvas';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { ScrollReveal } from '@/components/ui/ScrollMotion';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useFieldMarker } from '@/contexts/EditMarkersContext';

interface RsvpCtaScreenProps {
  onContinue: () => void;
}

export function RsvpCtaScreen({ onContinue }: RsvpCtaScreenProps) {
  const { content } = useWeddingContent();
  const field = useFieldMarker();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Wait for a brief moment to ensure canvas is mounted and painted
    // before we reveal the background image beneath it.
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="fixed inset-0 w-full h-full overflow-hidden flex flex-col justify-center items-center bg-surface text-ink z-50">
      <motion.div 
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: isReady ? 1 : 0 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: `url('${content.rsvpCta.backgroundImage}')` }}
      />
      
      <InkRevealCanvas />

      <div className="relative z-20 max-w-3xl mx-auto text-center px-4">
        <TextsReveal className="flex flex-col items-center">
          <span {...field('subtitle')} className="text-sm font-elegant italic tracking-widest text-accent-light/80 block mb-2">{content.rsvpCta.subtitle}</span>
          <h2 {...field('title')} className="text-4xl md:text-6xl lg:text-7xl font-heading text-ink font-light tracking-widest drop-shadow-md mb-6">{content.rsvpCta.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mb-6 mt-4"></div>
          <p {...field('description')} className="text-lg font-elegant italic text-accent-light/90 mb-10 leading-relaxed max-w-2xl mx-auto">
            {content.rsvpCta.description}
          </p>
        </TextsReveal>
        {/* Follows the heading lines in (TextsReveal starts ~150 ms after mount). */}
        <ScrollReveal delay={0.6}>
        <button 
          onClick={onContinue} 
          className="px-8 py-4 bg-primary border border-accent/30 text-accent hover:bg-primary/80 hover:border-accent hover:text-accent-light text-xs tracking-[0.25em] font-medium uppercase transition-all duration-500 rounded-sm shadow-lg"
        >
          {content.rsvpCta.buttonText}
        </button>
        </ScrollReveal>
      </div>
    </section>
  );
}
