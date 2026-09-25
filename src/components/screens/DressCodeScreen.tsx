"use client";

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { DraggableSlider } from '@/components/ui/DraggableSlider';
import { RevealImage } from '@/components/ui/RevealImage';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { ScrollContainerProvider, ScrollReveal, ScrollRevealItem } from '@/components/ui/ScrollMotion';

interface DressCodeScreenProps {
  onContinue: () => void;
}

export function DressCodeScreen({ onContinue }: DressCodeScreenProps) {
  const { content } = useWeddingContent();
  const scrollRef = useRef<HTMLElement>(null);

  const colors = content.dressCode.colors;

  return (
    <section ref={scrollRef} className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <ScrollContainerProvider containerRef={scrollRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center w-full relative z-10">
        <TextsReveal className="mb-16 flex flex-col items-center">
          <span className="text-sm font-cormorant italic text-wedding-goldlight/80 tracking-widest block mb-4">{content.dressCode.header?.subtitle || "The Style Guideline"}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-cinzel text-wedding-cream font-light tracking-widest drop-shadow-md">{content.dressCode.header?.title || "La Palette de l'Amour"}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
        </TextsReveal>

        <ScrollReveal className="bg-wedding-dark/60 p-8 md:p-12 rounded-xl border border-wedding-gold/20 shadow-md">
          <p className="text-sm uppercase tracking-[0.2em] text-wedding-gold font-semibold mb-3">Dress Code: {content.dressCode.title}</p>
          <p className="text-base font-cormorant italic text-wedding-goldlight max-w-2xl mx-auto leading-relaxed mb-10">
            {content.dressCode.description}
          </p>

          {/* Suggested Color Swatches */}
          <ScrollReveal stagger delay={0.2} className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
            {colors.map((color, index) => (
              <ScrollRevealItem key={index} className={index === 4 ? 'col-span-2 sm:col-span-1' : undefined}>
              <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full border border-wedding-burgundy/20 shadow-inner mb-2 flex items-center justify-center mx-auto"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="w-14 h-14 rounded-full border border-dashed border-white/40"></div>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-wedding-cream/80 text-center">{color.name}</span>
              </motion.div>
              </ScrollRevealItem>
            ))}
          </ScrollReveal>

          {/* Attire Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-t border-wedding-gold/20 pt-8 mb-10">
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-wedding-gold font-bold mb-3">For Ladies</h4>
              <p className="text-sm font-cormorant text-wedding-cream leading-relaxed">
                {content.dressCode.ladiesGuideline}
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-wedding-gold font-bold mb-3">For Gentlemen</h4>
              <p className="text-sm font-cormorant text-wedding-cream leading-relaxed">
                {content.dressCode.gentlemenGuideline}
              </p>
            </div>
          </div>

          {/* Outfit Inspiration Slider */}
          <div className="border-t border-wedding-gold/20 pt-8 mt-4">
            <h4 className="text-xs uppercase tracking-[0.25em] text-wedding-gold/80 font-bold mb-6 text-center">Outfit Inspiration</h4>
            
            <div className="relative w-full max-w-full" style={{
              mask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
              WebkitMask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)'
            }}>
              <div className="outfit-slider-wrapper w-full py-4">
                <DraggableSlider speed={0.5}>
                  {content.dressCode.inspirationImages.map((img, index) => (
                    <div key={index} className="w-[140px] sm:w-[180px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden relative group shadow-sm border border-wedding-gold/20 flex-shrink-0">
                      <RevealImage src={img.url} alt={`${img.type} Inspiration ${index + 1}`} className="w-full h-full object-cover transform duration-500 group-hover:scale-105 pointer-events-none" wrapperClassName="w-full h-full" />
                      <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2.5 px-2 text-center pointer-events-none">
                        <span className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-wedding-cream drop-shadow-sm">{img.type}</span>
                      </div>
                    </div>
                  ))}
                </DraggableSlider>
              </div>
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
      </ScrollContainerProvider>
    </section>
  );
}
