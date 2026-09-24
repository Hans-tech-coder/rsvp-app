"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { InkRevealCanvas } from '@/components/ui/InkRevealCanvas';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { ScrollReveal } from '@/components/ui/ScrollMotion';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

interface RsvpCtaScreenProps {
  onContinue: () => void;
}

export function RsvpCtaScreen({ onContinue }: RsvpCtaScreenProps) {
  const { content } = useWeddingContent();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Wait for a brief moment to ensure canvas is mounted and painted
    // before we reveal the background image beneath it.
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="fixed inset-0 w-full h-full overflow-hidden flex flex-col justify-center items-center bg-wedding-dark text-wedding-cream z-50">
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
          <span className="text-sm font-cormorant italic tracking-widest text-wedding-goldlight/80 block mb-2">{content.rsvpCta.subtitle}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-cinzel text-wedding-cream font-light tracking-widest drop-shadow-md mb-6">{content.rsvpCta.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mb-6 mt-4"></div>
          <p className="text-lg font-cormorant italic text-wedding-goldlight/90 mb-10 leading-relaxed max-w-2xl mx-auto">
            {content.rsvpCta.description}
          </p>
        </TextsReveal>
        {/* Follows the heading lines in (TextsReveal starts ~150 ms after mount). */}
        <ScrollReveal delay={0.6}>
        <button 
          onClick={onContinue} 
          className="px-8 py-4 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.25em] font-medium uppercase transition-all duration-500 rounded-sm shadow-lg"
        >
          {content.rsvpCta.buttonText}
        </button>
        </ScrollReveal>
      </div>
    </section>
  );
}
