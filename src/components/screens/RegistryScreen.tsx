"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { CuratedRegistryScreen } from './CuratedRegistryScreen';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';
import { fillText } from '@/lib/siteText';
import { RevealImage } from '@/components/ui/RevealImage';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { ScrollContainerProvider, ScrollReveal, SCROLL_MOTION } from '@/components/ui/ScrollMotion';

interface RegistryScreenProps {
  onContinue: () => void;
}

export function RegistryScreen({ onContinue }: RegistryScreenProps) {
  const { content } = useWeddingContent();
  const text = useSiteText();
  const [showCuratedRegistry, setShowCuratedRegistry] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const scrollRef = useRef<HTMLElement>(null);

  return (
    <section ref={scrollRef} className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <ScrollContainerProvider containerRef={scrollRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface via-primary-deep to-surface pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <TextsReveal className="text-center mb-16 flex flex-col items-center">
          <span className="text-sm font-cormorant italic text-accent-light/80 tracking-widest block mb-4">{content.registry?.header?.subtitle}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-cinzel text-ink font-light tracking-widest drop-shadow-md">{content.registry?.header?.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mt-6"></div>
          <p className="text-base font-cormorant italic text-accent-light/70 mt-3 max-w-md mx-auto">
            {content.registry?.header?.description}
          </p>
        </TextsReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <ScrollReveal>
          <div className="h-full bg-surface/60 p-8 rounded-xl border border-accent/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              <h3 className="text-xl font-cinzel text-ink font-light mb-3">{content.registry?.bankTransfer?.title}</h3>
              <p className="text-sm font-cormorant text-ink mb-6 leading-relaxed">
                {content.registry?.bankTransfer?.description}
              </p>
              
              <div className={`grid gap-3 mt-auto ${(content.registry?.bankTransfer?.banks || []).length >= 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {(content.registry?.bankTransfer?.banks || []).map((bank: any) => (
                  <button
                    key={bank.name}
                    onClick={() => setSelectedBank(bank.name)}
                    className="w-full text-center py-3 bg-surface/40 border border-accent/20 text-ink hover:bg-accent/10 hover:border-accent hover:text-accent-light text-xs tracking-[0.1em] font-medium transition-all duration-300 rounded-sm"
                  >
                    {bank.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          </ScrollReveal>

          {/* Card 2 */}
          <ScrollReveal delay={SCROLL_MOTION.revealStagger}>
          <div className="h-full bg-surface/60 p-8 rounded-xl border border-accent/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              <h3 className="text-xl font-cinzel text-ink font-light mb-3">{content.registry?.curatedRegistry?.title}</h3>
              <p className="text-sm font-cormorant text-ink mb-6 leading-relaxed">
                {content.registry?.curatedRegistry?.description1}
              </p>
              <p className="text-xs text-ink/60 leading-relaxed mb-8">
                {content.registry?.curatedRegistry?.description2}
              </p>
            </div>
            <button onClick={() => setShowCuratedRegistry(true)} className="w-full text-center py-3 bg-primary border border-accent/30 text-accent hover:bg-primary/80 hover:border-accent hover:text-accent-light text-xs tracking-[0.2em] font-medium uppercase transition-all duration-300 rounded-sm">
              {text.registry.visitRegistry}
            </button>
          </div>
          </ScrollReveal>
        </div>
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

      <CuratedRegistryScreen 
        isOpen={showCuratedRegistry} 
        onClose={() => setShowCuratedRegistry(false)} 
      />

      <AnimatePresence>
        {selectedBank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedBank(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-accent/30 rounded-xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedBank(null)}
                className="absolute top-4 right-4 text-ink/50 hover:text-accent transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-cinzel text-accent-light mb-2">{selectedBank}</h3>
                <p className="text-sm font-cormorant text-ink/80">{text.registry.scanQr}</p>
              </div>

              <div className="bg-white p-4 rounded-lg aspect-square flex items-center justify-center mb-6">
                {content.registry?.bankTransfer?.banks?.find((b: any) => b.name === selectedBank)?.qrImage ? (
                  <RevealImage 
                    src={content.registry?.bankTransfer?.banks?.find((b: any) => b.name === selectedBank)?.qrImage} 
                    alt={`${selectedBank} QR Code`} 
                    className="w-full h-full object-contain"
                    wrapperClassName="w-full h-full flex items-center justify-center"
                  />
                ) : (
                  <div className="w-full h-full border-4 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"></path></svg>
                    <span className="text-xs font-inter uppercase tracking-wider text-center px-4">{fillText(text.registry.qrMissing, { bank: selectedBank })}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs font-inter text-ink/60 uppercase tracking-widest">{text.registry.thankYou}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </ScrollContainerProvider>
    </section>
  );
}
