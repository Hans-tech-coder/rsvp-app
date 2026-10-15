"use client";

import React, { useRef } from 'react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { RevealImage } from '@/components/ui/RevealImage';
import { ScrollContainerProvider, ScrollReveal, SCROLL_MOTION } from '@/components/ui/ScrollMotion';
import { formatPerson, groupHasPeople, isPairEmpty, type PeopleGroup, type Person } from '@/lib/genericContent';

interface EntourageScreenProps {
  onContinue: () => void;
}

// Each name column reveals on its own; the right-hand one waits one stagger
// step, so side-by-side columns stagger softly and stacked ones (phone)
// reveal as they scroll in.
const SECOND_COLUMN_DELAY = SCROLL_MOTION.revealStagger;

const SPONSOR_NAME_CLASS = "font-elegant text-xl md:text-2xl lg:text-3xl text-ink/85 hover:text-accent-light hover:drop-shadow-[0_0_12px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default";
const FEATURED_NAME_CLASS = "font-elegant text-2xl md:text-3xl lg:text-4xl text-ink font-medium tracking-widest group-hover:text-accent-light group-hover:drop-shadow-[0_0_12px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] transition-all duration-500 whitespace-nowrap";
const GROUP_TITLE_CLASS = "font-heading text-[10px] md:text-xs uppercase tracking-[0.3em] text-accent/80 text-center flex items-center justify-center gap-4 w-full";
const DIVIDER_CLASS = "absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-accent/20 to-transparent -translate-x-1/2 hidden md:block";

/**
 * Pairs groups get a full-width row; the other groups fill two columns side
 * by side on desktop, in their order (a lone last one is centered).
 */
function toRows(groups: PeopleGroup[]): PeopleGroup[][] {
  const rows: PeopleGroup[][] = [];
  for (const group of groups) {
    const last = rows[rows.length - 1];
    if (group.layout !== 'pairs' && last?.length === 1 && last[0].layout !== 'pairs') last.push(group);
    else rows.push([group]);
  }
  return rows;
}

/** Optional photo above the name, optional role under it. */
function PersonExtras({ person, children }: { person: Person; children: React.ReactNode }) {
  return (
    <>
      {person.photo && (
        <RevealImage
          src={person.photo}
          alt={formatPerson(person)}
          className="w-full h-full object-cover"
          wrapperClassName="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full overflow-hidden border border-accent/30"
        />
      )}
      {children}
      {person.role && <p className="font-elegant italic text-sm md:text-base text-accent-light/70 tracking-wide mt-1">{person.role}</p>}
    </>
  );
}

/** One column: a titled list of names (featured = the large names, e.g. parents and honor attendants). */
function GroupColumn({ group, delay }: { group: PeopleGroup; delay?: number }) {
  const people = group.people.filter((person) => formatPerson(person));
  if (group.layout === 'featured') {
    return (
      <ScrollReveal delay={delay} className="flex flex-col items-center justify-start group cursor-default">
        <h3 className={`${GROUP_TITLE_CLASS} mb-8`}><span className="px-2">{group.title}</span></h3>
        <div className="text-center px-4 w-full space-y-6 md:space-y-8">
          {people.map((person, index) => (
            <div key={index}>
              <PersonExtras person={person}><h4 className={FEATURED_NAME_CLASS}>{formatPerson(person)}</h4></PersonExtras>
            </div>
          ))}
        </div>
      </ScrollReveal>
    );
  }
  return (
    <ScrollReveal delay={delay} className="flex flex-col items-center">
      <h3 className={`${GROUP_TITLE_CLASS} mb-10`}><span className="px-2">{group.title}</span></h3>
      <ul className="text-center space-y-6 md:space-y-8 w-full px-4">
        {people.map((person, index) => (
          <li key={index}>
            <PersonExtras person={person}><p className={SPONSOR_NAME_CLASS}>{formatPerson(person)}</p></PersonExtras>
          </li>
        ))}
      </ul>
    </ScrollReveal>
  );
}

function PairsGroup({ group }: { group: PeopleGroup }) {
  return (
    <div className="mb-24 md:mb-32">
      <h3 className="font-heading text-[10px] md:text-xs uppercase tracking-[0.3em] text-accent/80 text-center mb-12 flex items-center justify-center gap-4">
        <span className="w-16 md:w-32 h-[1px] bg-gradient-to-r from-transparent to-accent/30"></span>
        {group.title}
        <span className="w-16 md:w-32 h-[1px] bg-gradient-to-l from-transparent to-accent/30"></span>
      </h3>
      {/* One row per pair, left and right, so a pair always faces each other
          on desktop. Phones get one column: a pair that is together shares a
          line (right & left, as in "Mr. B & Mrs. A"), two solo names get a
          line each. */}
      <div className="max-w-5xl mx-auto px-4 md:px-0 relative">
        <div className={DIVIDER_CLASS}></div>

        <ul className="text-center space-y-6 md:space-y-8">
          {group.pairs.filter(pair => !isPairEmpty(pair)).map((pair, index) => {
            const left = formatPerson(pair.left);
            const right = formatPerson(pair.right);
            const isTogether = pair.together && !!left && !!right;
            return (
              <li key={index}>
                <ScrollReveal>
                  {isTogether && (
                    <p className={`md:hidden leading-snug ${SPONSOR_NAME_CLASS}`}>
                      <span className="whitespace-nowrap">{right}</span>{' '}
                      {/* Wraps before the "&" so a long couple reads as one unit */}
                      <span className="whitespace-nowrap"><span className="italic text-accent/70">&amp;</span> {left}</span>
                    </p>
                  )}
                  <div className={`${isTogether ? 'hidden md:grid' : 'grid'} grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-16`}>
                    <p className={`${left ? '' : 'hidden md:block'} ${SPONSOR_NAME_CLASS}`}>{left}</p>
                    <p className={`${right ? '' : 'hidden md:block'} ${SPONSOR_NAME_CLASS}`}>{right}</p>
                  </div>
                </ScrollReveal>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function EntourageScreen({ onContinue }: EntourageScreenProps) {
  const { content } = useWeddingContent();
  const text = useSiteText();
  const scrollRef = useRef<HTMLElement>(null);
  const rows = toRows(content.entourage.groups.filter(groupHasPeople));

  return (
    <section ref={scrollRef} className="py-16 md:py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <ScrollContainerProvider containerRef={scrollRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface via-primary-deep to-surface pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <TextsReveal className="text-center mb-16 md:mb-20 flex flex-col items-center">
          <span className="text-sm font-elegant italic text-accent-light/80 tracking-widest block mb-4">{content.entourage.subtitle}</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading text-ink font-light tracking-widest drop-shadow-md text-center">{content.entourage.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mt-6"></div>
        </TextsReveal>

        {rows.map((row) => {
          if (row[0].layout === 'pairs') return <PairsGroup key={row[0].id} group={row[0]} />;
          const featured = row.some((group) => group.layout === 'featured');
          return (
            <div key={row[0].id} className={`${featured ? 'mb-20 md:mb-28 max-w-6xl' : 'mb-16 max-w-5xl'} mx-auto relative`}>
              {row.length === 2 && <div className={DIVIDER_CLASS}></div>}
              <div className={`grid grid-cols-1 ${row.length === 2 ? 'md:grid-cols-2' : ''} gap-16 md:gap-0 w-full px-4 md:px-0`}>
                {row.map((group, i) => <GroupColumn key={group.id} group={group} delay={i ? SECOND_COLUMN_DELAY : undefined} />)}
              </div>
            </div>
          );
        })}
      </div>

      <ScrollReveal delay={0.2} className="w-full flex justify-center pb-12 pt-8 relative z-20">
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
