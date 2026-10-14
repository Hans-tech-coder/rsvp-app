"use client";

import React, { useRef } from 'react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { ScrollContainerProvider, ScrollReveal, SCROLL_MOTION } from '@/components/ui/ScrollMotion';
import { formatSponsor, isPairEmpty } from '@/lib/principalSponsors';

interface EntourageScreenProps {
  onContinue: () => void;
}

// Each name column reveals on its own; the right-hand one waits one stagger
// step, so side-by-side columns stagger softly and stacked ones (phone)
// reveal as they scroll in.
const SECOND_COLUMN_DELAY = SCROLL_MOTION.revealStagger;

const SPONSOR_NAME_CLASS = "font-cormorant text-xl md:text-2xl lg:text-3xl text-wedding-cream/85 hover:text-wedding-goldlight hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default";

export function EntourageScreen({ onContinue }: EntourageScreenProps) {
  const { content } = useWeddingContent();
  const text = useSiteText();
  const scrollRef = useRef<HTMLElement>(null);

  return (
    <section ref={scrollRef} className="py-16 md:py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <ScrollContainerProvider containerRef={scrollRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <TextsReveal className="text-center mb-16 md:mb-20 flex flex-col items-center">
          <span className="text-sm font-cormorant italic text-wedding-goldlight/80 tracking-widest block mb-4">{content.entourage.subtitle}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-cinzel text-wedding-cream font-light tracking-widest drop-shadow-md text-center">{content.entourage.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
        </TextsReveal>

        {/* Parents */}
        <div className="mb-20 md:mb-32 relative max-w-6xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/20 to-transparent -translate-x-1/2 hidden md:block"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-0 w-full px-4 md:px-0">
            {/* Parents of the Bride */}
            <ScrollReveal className="flex flex-col items-center justify-start group cursor-default">
              <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-4 w-full">
                <span className="px-2">{text.entourage.parentsOfBride}</span>
              </h3>
              <div className="text-center px-4 w-full space-y-6 md:space-y-8">
                {content.entourage.parents.bride.map((name, index) => (
                  <h4 key={`bride-parent-${index}`} className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-wedding-cream font-medium tracking-widest group-hover:text-wedding-goldlight group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-500 whitespace-nowrap">{name}</h4>
                ))}
              </div>
            </ScrollReveal>

            {/* Parents of the Groom */}
            <ScrollReveal delay={SECOND_COLUMN_DELAY} className="flex flex-col items-center justify-start group cursor-default">
              <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-4 w-full">
                <span className="px-2">{text.entourage.parentsOfGroom}</span>
              </h3>
              <div className="text-center px-4 w-full space-y-6 md:space-y-8">
                {content.entourage.parents.groom.map((name, index) => (
                  <h4 key={`groom-parent-${index}`} className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-wedding-cream font-medium tracking-widest group-hover:text-wedding-goldlight group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-500 whitespace-nowrap">{name}</h4>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Principal Sponsors */}
        <div className="mb-24 md:mb-32">
          <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-12 flex items-center justify-center gap-4">
            <span className="w-16 md:w-32 h-[1px] bg-gradient-to-r from-transparent to-wedding-gold/30"></span> 
            {text.entourage.principalSponsors}
            <span className="w-16 md:w-32 h-[1px] bg-gradient-to-l from-transparent to-wedding-gold/30"></span>
          </h3>
          {/* One row per pair, ninang left and ninong right, so a pair always
              faces each other on desktop. Phones get one column: a couple
              shares a line, two solo sponsors get a line each. */}
          <div className="max-w-5xl mx-auto px-4 md:px-0 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/20 to-transparent -translate-x-1/2 hidden md:block"></div>

            <ul className="text-center space-y-6 md:space-y-8">
              {content.entourage.principalSponsors.filter(pair => !isPairEmpty(pair)).map((pair, index) => {
                const ninang = formatSponsor(pair.ninang);
                const ninong = formatSponsor(pair.ninong);
                const isCouple = pair.couple && !!ninang && !!ninong;
                return (
                  <li key={index}>
                    <ScrollReveal>
                      {isCouple && (
                        <p className={`md:hidden leading-snug ${SPONSOR_NAME_CLASS}`}>
                          <span className="whitespace-nowrap">{ninong}</span>{' '}
                          {/* Wraps before the "&" so a long couple reads as one unit */}
                          <span className="whitespace-nowrap"><span className="italic text-wedding-gold/70">&amp;</span> {ninang}</span>
                        </p>
                      )}
                      <div className={`${isCouple ? 'hidden md:grid' : 'grid'} grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-16`}>
                        <p className={`${ninang ? '' : 'hidden md:block'} ${SPONSOR_NAME_CLASS}`}>{ninang}</p>
                        <p className={`${ninong ? '' : 'hidden md:block'} ${SPONSOR_NAME_CLASS}`}>{ninong}</p>
                      </div>
                    </ScrollReveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Honor Attendants */}
        <div className="mb-16 md:mb-24 relative max-w-6xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/20 to-transparent -translate-x-1/2 hidden md:block"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-0 w-full px-4 md:px-0">
            {/* Maid of Honor Column */}
            <ScrollReveal className="flex flex-col items-center justify-start group cursor-default">
              <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-4 w-full">
                <span className="px-2">{text.entourage.maidOfHonor}</span>
              </h3>
              <div className="text-center px-4 w-full">
                <h4 className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-wedding-cream font-medium tracking-widest group-hover:text-wedding-goldlight group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-500 whitespace-nowrap">{content.entourage.honorAttendants.maidOfHonor}</h4>
              </div>
            </ScrollReveal>

            {/* Best Man Column */}
            <ScrollReveal delay={SECOND_COLUMN_DELAY} className="flex flex-col items-center justify-start group cursor-default">
              <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-4 w-full">
                <span className="px-2">{text.entourage.bestMan}</span>
              </h3>
              <div className="text-center px-4 w-full">
                <h4 className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-wedding-cream font-medium tracking-widest group-hover:text-wedding-goldlight group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-500 whitespace-nowrap">{content.entourage.honorAttendants.bestMan}</h4>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Bridesmaids and Groomsmen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-0 max-w-5xl mx-auto mb-16 px-4 md:px-0 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/20 to-transparent -translate-x-1/2 hidden md:block"></div>
          
          <ScrollReveal className="flex flex-col items-center">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-10 flex items-center justify-center gap-4 w-full">
              <span className="px-2">{text.entourage.bridesmaids}</span>
            </h3>
            <ul className="text-center space-y-6 md:space-y-8 w-full px-4">
              {content.entourage.bridesmaids.map((name, index) => (
                <li key={index} className="font-cormorant text-xl md:text-2xl lg:text-3xl text-wedding-cream/85 hover:text-wedding-goldlight hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default">{name}</li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={SECOND_COLUMN_DELAY} className="flex flex-col items-center">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-10 flex items-center justify-center gap-4 w-full">
              <span className="px-2">{text.entourage.groomsmen}</span>
            </h3>
            <ul className="text-center space-y-6 md:space-y-8 w-full px-4">
              {content.entourage.groomsmen.map((name, index) => (
                <li key={index} className="font-cormorant text-xl md:text-2xl lg:text-3xl text-wedding-cream/85 hover:text-wedding-goldlight hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default">{name}</li>
              ))}
            </ul>
          </ScrollReveal>
        </div>

        {/* Flower Girls and Ring Bearers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-0 max-w-5xl mx-auto mb-16 px-4 md:px-0 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/20 to-transparent -translate-x-1/2 hidden md:block"></div>
          
          <ScrollReveal className="flex flex-col items-center">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-10 flex items-center justify-center gap-4 w-full">
              <span className="px-2">{text.entourage.flowerGirls}</span>
            </h3>
            <ul className="text-center space-y-6 md:space-y-8 w-full px-4">
              {content.entourage.flowerGirls.map((name, index) => (
                <li key={index} className="font-cormorant text-xl md:text-2xl lg:text-3xl text-wedding-cream/85 hover:text-wedding-goldlight hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default">{name}</li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={SECOND_COLUMN_DELAY} className="flex flex-col items-center">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-10 flex items-center justify-center gap-4 w-full">
              <span className="px-2">{text.entourage.ringBearer}</span>
            </h3>
            <ul className="text-center space-y-6 md:space-y-8 w-full px-4">
              {content.entourage.ringBearers.map((name, index) => (
                <li key={index} className="font-cormorant text-xl md:text-2xl lg:text-3xl text-wedding-cream/85 hover:text-wedding-goldlight hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default">{name}</li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>

      <ScrollReveal delay={0.2} className="w-full flex justify-center pb-12 pt-8 relative z-20">
        <button onClick={onContinue} aria-label={text.common.continue} className="group flex flex-col items-center justify-center space-y-3 cursor-pointer focus:outline-none transition-transform hover:-translate-y-1 active:scale-95 mt-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-wedding-cream/70 font-medium group-hover:text-wedding-gold transition-colors duration-300">{text.common.continue}</span>
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
