"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { ScrollContainerProvider, ScrollReveal } from '@/components/ui/ScrollMotion';

// Light stagger: each question reveals on its own as it enters, and the ones
// visible together are offset by this gap (capped so later ones never lag).
const FAQ_STAGGER = 0.06;
const FAQ_STAGGER_MAX = 0.24;

interface FaqScreenProps {
  onContinue: () => void;
}

export function FaqScreen({ onContinue }: FaqScreenProps) {
  const { content } = useWeddingContent();
  const text = useSiteText();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLElement>(null);

  const faqs = content.faq;

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={scrollRef} className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <ScrollContainerProvider containerRef={scrollRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface via-primary-deep to-surface pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <TextsReveal className="text-center mb-16 flex flex-col items-center">
          <span className="text-sm font-cormorant italic text-accent-light/80 tracking-widest block mb-4">{content.faqHeader?.subtitle}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-cinzel text-ink font-light tracking-widest drop-shadow-md">{content.faqHeader?.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mt-6 mb-10"></div>
          <p className="text-base font-cormorant italic text-accent-light/70 mt-3 max-w-md mx-auto">{content.faqHeader?.description}</p>
        </TextsReveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <ScrollReveal
              key={index}
              delay={Math.min(index * FAQ_STAGGER, FAQ_STAGGER_MAX)}
              className="bg-surface/40 border border-accent/20 rounded-lg overflow-hidden transition-all duration-300 hover:border-accent/40"
            >
              <button 
                onClick={() => toggleFaq(index)} 
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none group"
              >
                <span className="font-cinzel text-sm md:text-base tracking-wider text-ink font-medium group-hover:text-accent transition-colors">{faq.q}</span>
                <span className={`text-accent font-light text-2xl transition-transform duration-300 ${openIndex === index ? 'rotate-45' : ''}`}>+</span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-accent/20"></div>
                    <p className="p-6 text-sm md:text-base font-cormorant text-ink leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollReveal>
          ))}
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
      </ScrollContainerProvider>
    </section>
  );
}
