"use client";

import React, { createContext, useContext, useRef, type RefObject } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react';

/**
 * Scroll motion primitives for guest screens.
 *
 * Screens do not scroll the page: each one owns its scroll container
 * (see docs/guest-site.md → Layout rules). A screen shares that element
 * through <ScrollContainerProvider> so reveals and parallax measure against it.
 *
 * Values mirror the scroll tokens in globals.css (--duration-scroll-reveal,
 * --distance-scroll-reveal, --stagger-scroll-reveal, --distance-parallax).
 */
export const SCROLL_MOTION = {
  revealDuration: 0.8,
  revealDistance: 16,
  revealStagger: 0.12,
  parallaxDistance: 24,
  ease: [0.22, 1, 0.36, 1] as const, // --ease-smooth-out
};

const ScrollContainerContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function ScrollContainerProvider({
  containerRef,
  children,
}: {
  containerRef: RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  return <ScrollContainerContext.Provider value={containerRef}>{children}</ScrollContainerContext.Provider>;
}

/** The current screen's scroll element, or null (falls back to the viewport). */
export function useScrollContainer() {
  return useContext(ScrollContainerContext);
}

const revealVariants: Variants = {
  hidden: { opacity: 0, y: SCROLL_MOTION.revealDistance },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: SCROLL_MOTION.revealDuration, ease: SCROLL_MOTION.ease },
  },
};

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds before the reveal starts. */
  delay?: number;
  /**
   * Stagger direct <ScrollRevealItem> children instead of revealing this
   * element as one block. `true` uses the default gap; a number sets it in seconds.
   */
  stagger?: boolean | number;
};

/** Fades and rises once when it enters the screen's scroll view. Static under reduced motion. */
export function ScrollReveal({ children, className, delay = 0, stagger }: ScrollRevealProps) {
  const root = useScrollContainer();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  const variants: Variants = stagger
    ? {
        hidden: {},
        show: {
          transition: {
            delayChildren: delay,
            staggerChildren: typeof stagger === 'number' ? stagger : SCROLL_MOTION.revealStagger,
          },
        },
      }
    : {
        hidden: { opacity: 0, y: SCROLL_MOTION.revealDistance },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: SCROLL_MOTION.revealDuration, ease: SCROLL_MOTION.ease, delay },
        },
      };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2, root: root ?? undefined }}
    >
      {children}
    </motion.div>
  );
}

/** One staggered child of <ScrollReveal stagger>. */
export function ScrollRevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={revealVariants}>
      {children}
    </motion.div>
  );
}

type ParallaxProps = {
  children: React.ReactNode;
  /**
   * Classes for the moving layer. Make it taller than its clipping parent by
   * at least `distance` on each side (e.g. `absolute inset-x-0 -inset-y-6`),
   * and give the parent `overflow-hidden`, so no edge shows while it moves.
   */
  className?: string;
  /** Max offset in px each way (luxury range 24–40). */
  distance?: number;
};

/**
 * Drifts its content on `y` as it passes through the screen's scroll view.
 * Images and decorative layers only — never text or controls. At most one per
 * viewport. Static under reduced motion.
 */
export function Parallax({ children, className, distance = SCROLL_MOTION.parallaxDistance }: ParallaxProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <ParallaxLayer className={className} distance={distance}>
      {children}
    </ParallaxLayer>
  );
}

function ParallaxLayer({ children, className, distance }: Required<Omit<ParallaxProps, 'className'>> & { className?: string }) {
  const container = useScrollContainer();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: container ?? undefined,
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
