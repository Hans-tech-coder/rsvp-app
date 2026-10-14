"use client";

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants, useReducedMotion } from 'motion/react';
import { WeddingCursor } from '@/components/effects/WeddingCursor';
import { FallingPetals } from '@/components/effects/FallingPetals';
import weddingContent from '@/data/wedding-content.json';

// Rendered by src/app/not-found.tsx for every unknown URL. It sits outside
// WeddingContentProvider, so it reads the JSON defaults (kept in step with
// Firestore by `npm run sync-content`) instead of fetching every override.
const { global: site, welcomeScreen } = weddingContent;

const DAY_MS = 1000 * 60 * 60 * 24;

// Days left is read on the client only: the 404 page is prerendered, so a
// server value would freeze at build time. The server snapshot is null.
const noSubscribe = () => () => {};
const getDaysLeft = () =>
  Math.max(0, Math.ceil((new Date(site.targetDate).getTime() - Date.now()) / DAY_MS));
const getServerDaysLeft = () => null;

export function NotFoundScreen() {
  const reduceMotion = useReducedMotion();
  const daysLeft = useSyncExternalStore(noSubscribe, getDaysLeft, getServerDaysLeft);

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
    <main className="relative h-dvh w-full overflow-hidden bg-wedding-dark text-wedding-cream">
      {/* Same burgundy backdrop as the inner guest screens (Our Story, Details, …) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>
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
          <motion.div variants={itemVariants}>
            {/* Original logo, embossed: a light edge above-left and a dark
                edge below-right lift it off the page (.t-emboss in globals.css) */}
            <Link
              href="/"
              aria-label={`${site.coupleNameFormat}, back to the celebration`}
              className="block rounded-full transition-opacity duration-300 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wedding-gold"
            >
              <Image src={site.logo} alt="" width={128} height={128} className="t-emboss h-24 w-24 sm:h-32 sm:w-32" priority />
            </Link>
          </motion.div>

          <div className="flex flex-1 flex-col items-center justify-center py-10">
            {/* The couple's photo shows through the numerals. It is screen-blended
                over gold numerals so the photo's dark sky still reads as gold
                (background-blend-mode is ignored with background-clip: text). */}
            <motion.div
              variants={numeralVariants}
              aria-hidden="true"
              className="relative isolate font-cinzel font-bold leading-[0.85] tracking-[-0.03em] text-[clamp(7.5rem,38vw,15rem)] select-none"
            >
              <span className="block text-wedding-golddark">404</span>
              <span
                className="absolute inset-0 block bg-cover bg-center bg-clip-text text-transparent mix-blend-screen"
                style={{ backgroundImage: `url(${welcomeScreen.backgroundImage})` }}
              >
                404
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 max-w-[18ch] text-balance font-cinzel text-[1.75rem] leading-[1.15] tracking-[0.02em] sm:max-w-none sm:text-4xl md:text-5xl"
            >
              <span className="sr-only">Error 404. </span>Lost on the way to the aisle?
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-[34ch] text-balance font-cormorant text-xl italic leading-snug text-wedding-cream/90 sm:text-2xl"
            >
              This page doesn&apos;t exist or has moved. The celebration is just this way.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center">
              <Link
                href="/"
                className="px-8 py-4 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-goldlight hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-cream text-[13px] tracking-[0.25em] font-medium uppercase transition-all duration-500 rounded-sm shadow-lg active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wedding-gold"
              >
                Back to the celebration
              </Link>
              <p className="mt-5 text-[15px] text-wedding-cream/85">
                You&apos;ll pick up right where you left off.
              </p>
            </motion.div>
          </div>

          <motion.p
            variants={itemVariants}
            className="max-w-[36ch] font-cormorant text-lg leading-snug text-wedding-cream/90 sm:text-xl"
            aria-live="polite"
          >
            {daysLeft === null ? (
              <span className="invisible">{site.venueShort}</span>
            ) : daysLeft > 0 ? (
              <>
                <span className="font-cinzel text-wedding-goldlight">{daysLeft}</span>{' '}
                {daysLeft === 1 ? 'day' : 'days'} until {site.coupleNameFormat} say &ldquo;I do&rdquo; in {site.venueShort}
              </>
            ) : (
              <>Thank you for celebrating {site.coupleNameFormat} with us</>
            )}
          </motion.p>
        </div>
      </motion.div>

      <WeddingCursor />
    </main>
  );
}
