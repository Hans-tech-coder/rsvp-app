"use client";

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants, useReducedMotion } from 'motion/react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ThemeStyle } from '@/components/ThemeStyle';
import { WeddingCursor } from '@/components/effects/WeddingCursor';
import { FallingPetals } from '@/components/effects/FallingPetals';
import { SiteTextProvider } from '@/contexts/SiteTextContext';
import type { Music } from '@/lib/music';
import { fillNodes, fillText, type SiteText } from '@/lib/siteText';
import { DEFAULT_THEME, type Theme } from '@/lib/theme';
import type { SiteGlobal } from '@/lib/weddingContent';

// Rendered by src/app/not-found.tsx for every unknown URL. It sits outside
// WeddingContentProvider: global settings, wording, colors and music are the
// default event's (from /api/not-found), the photo the JSON defaults' welcome
// photo (kept in step with Firestore by `npm run sync-content`). Nothing here
// imports the JSON, not even lazily: this file is in every page's JavaScript
// and any chunk it loads is a public file.

type NotFoundContent = { global: SiteGlobal; siteText: SiteText; theme: Theme; music: Music; backgroundImage: string };
type NotFoundText = SiteText['notFound'];

// If /api/not-found fails twice: generic wording in the default theme, with no
// event's name, logo, photo, countdown or music.
const FALLBACK_TEXT: NotFoundText = {
  pageTitle: 'Page not found',
  heading: 'Page not found',
  description: "This page doesn't exist or has moved.",
  button: 'Back to the home page',
  resumeNote: '',
  daysLeftOne: '',
  daysLeftMany: '',
  after: '',
};
const RETRY_MS = 1000;

const fetchContent = (): Promise<NotFoundContent> =>
  fetch('/api/not-found').then((res) => (res.ok ? (res.json() as Promise<NotFoundContent>) : Promise.reject(res.status)));

/**
 * The whole 404 page. Next puts the root not-found UI into every page's
 * payload, so the default event's content is fetched here when the 404 shows,
 * not passed in, or every event's page would carry it. Until it arrives only
 * the backdrop shows; if the fetch fails, it is tried once more, then the
 * generic FALLBACK_TEXT page shows.
 */
export function NotFoundPage() {
  const [content, setContent] = useState<NotFoundContent | 'fallback' | null>(null);

  useEffect(() => {
    let active = true;
    fetchContent()
      .catch(() => new Promise((resolve) => setTimeout(resolve, RETRY_MS)).then(fetchContent))
      .then(
        (loaded) => { if (active) setContent(loaded); },
        () => { if (active) setContent('fallback'); },
      );
    return () => { active = false; };
  }, []);

  if (content === 'fallback') {
    return (
      <>
        <ThemeStyle theme={DEFAULT_THEME} />
        <NotFoundScreen text={FALLBACK_TEXT} />
      </>
    );
  }

  if (!content) {
    return (
      <main className="relative h-dvh w-full overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-primary-deep to-surface"></div>
      </main>
    );
  }

  return (
    <SiteTextProvider value={content.siteText}>
      <ThemeStyle theme={content.theme} />
      <NotFoundScreen text={content.siteText.notFound} site={content.global} backgroundImage={content.backgroundImage} />
      <AudioPlayer music={content.music} />
    </SiteTextProvider>
  );
}

const DAY_MS = 1000 * 60 * 60 * 24;

// Days left is read on the client only: the 404 page is prerendered, so a
// server value would freeze at build time. The server snapshot is null.
const noSubscribe = () => () => {};
const daysUntil = (targetDate: string) =>
  Math.max(0, Math.ceil((new Date(targetDate).getTime() - Date.now()) / DAY_MS));
const getServerDaysLeft = () => null;

// Without `site` (the fallback) the logo and the countdown line are left out;
// without `backgroundImage` the numerals are plain gold.
export function NotFoundScreen({ text, site, backgroundImage }: { text: NotFoundText; site?: SiteGlobal; backgroundImage?: string }) {
  const reduceMotion = useReducedMotion();
  const daysLeft = useSyncExternalStore(noSubscribe, () => (site ? daysUntil(site.targetDate) : null), getServerDaysLeft);
  const values = { couple: site?.coupleNameFormat ?? '', venue: site?.venueShort ?? '' };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.09, delayChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.3 : 1, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const numeralVariants: Variants = {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 1.06 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduceMotion ? 0.3 : 1.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-surface text-ink">
      {/* Same burgundy backdrop as the inner guest screens (Our Story, Details, …) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-surface via-primary-deep to-surface pointer-events-none"></div>
      {/* Behind the text, so the petals never cover what guests read */}
      <div className="absolute inset-0 z-[5]">
        <FallingPetals />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar"
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center px-6 pt-8 pb-28 text-center sm:pb-16">
          {site ? (
            <motion.div variants={itemVariants}>
              {/* Original logo, embossed: a light edge above-left and a dark
                  edge below-right lift it off the page (.t-emboss in globals.css) */}
              <Link
                href="/"
                aria-label={`${site.coupleNameFormat}, ${text.button}`}
                className="block rounded-full transition-opacity duration-300 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <Image src={site.logo} alt="" width={128} height={128} className="t-emboss h-24 w-24 sm:h-32 sm:w-32" priority />
              </Link>
            </motion.div>
          ) : (
            <div className="h-24 sm:h-32" />
          )}

          <div className="flex flex-1 flex-col items-center justify-center py-10">
            {/* The couple's photo shows through the numerals. It is screen-blended
                over gold numerals so the photo's dark sky still reads as gold
                (background-blend-mode is ignored with background-clip: text). */}
            <motion.div
              variants={numeralVariants}
              aria-hidden="true"
              className="relative isolate font-heading font-bold leading-[0.85] tracking-[-0.03em] text-[clamp(7.5rem,38vw,15rem)] select-none"
            >
              <span className={`block ${backgroundImage ? 'text-accent-dark' : 'text-accent'}`}>404</span>
              {backgroundImage && (
                <span
                  className="absolute inset-0 block bg-cover bg-center bg-clip-text text-transparent mix-blend-screen"
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                  404
                </span>
              )}
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 max-w-[18ch] text-balance font-heading text-[1.75rem] leading-[1.15] tracking-[0.02em] sm:max-w-none sm:text-4xl md:text-5xl"
            >
              <span className="sr-only">Error 404. </span>{text.heading}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-[34ch] text-balance font-elegant text-xl italic leading-snug text-ink/90 sm:text-2xl"
            >
              {text.description}
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center">
              <Link
                href="/"
                className="px-8 py-4 bg-primary border border-accent/30 text-accent-light hover:bg-primary/80 hover:border-accent hover:text-ink text-[13px] tracking-[0.25em] font-medium uppercase transition-all duration-500 rounded-sm shadow-lg active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {text.button}
              </Link>
              {text.resumeNote && (
                <p className="mt-5 text-[15px] text-ink/85">
                  {text.resumeNote}
                </p>
              )}
            </motion.div>
          </div>

          {site && (
            <motion.p
              variants={itemVariants}
              className="max-w-[36ch] font-elegant text-lg leading-snug text-ink/90 sm:text-xl"
              aria-live="polite"
            >
              {daysLeft === null ? (
                <span className="invisible">{site.venueShort}</span>
              ) : daysLeft > 0 ? (
                fillNodes(daysLeft === 1 ? text.daysLeftOne : text.daysLeftMany, {
                  ...values,
                  days: <span className="font-heading text-accent-light">{daysLeft}</span>,
                })
              ) : (
                fillText(text.after, values)
              )}
            </motion.p>
          )}
        </div>
      </motion.div>

      <WeddingCursor />
    </main>
  );
}
