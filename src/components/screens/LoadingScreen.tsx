"use client";

import React, { useEffect } from 'react';
import { motion, usePresence, useReducedMotion } from 'motion/react';
import { useSiteText } from '@/contexts/SiteTextContext';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { hostInitials } from '@/lib/genericContent';

// Rendered inside <AnimatePresence>. The exit is a CSS opacity fade on the motion
// tokens, so the first screen mounts underneath and the two crossfade.
export function LoadingScreen() {
  const [isPresent, safeToRemove] = usePresence();
  const reduceMotion = useReducedMotion();
  const text = useSiteText();
  // Initials of the event's names; the content comes with the page.
  const initials = hostInitials(useWeddingContent().content.global.hosts);

  useEffect(() => {
    if (!isPresent && reduceMotion) safeToRemove();
  }, [isPresent, reduceMotion, safeToRemove]);

  return (
    <div
      aria-hidden={!isPresent}
      onTransitionEnd={(e) => {
        if (!isPresent && e.target === e.currentTarget) safeToRemove();
      }}
      style={{
        transitionProperty: 'opacity',
        transitionDuration: reduceMotion ? '0ms' : 'var(--duration-very-slow)',
        transitionTimingFunction: 'var(--ease-in-out)',
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface overflow-hidden ${isPresent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-primary-deep/30 to-surface/90 pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Luxury Loading Animation */}
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-accent/20 border-t-accent/80"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-accent-light/10 border-b-accent-light/60"
          />
          <motion.div 
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-accent text-2xl font-heading tracking-widest"
          >
            {initials.map((initial, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-accent-light text-lg mx-1">&</span>}
                {initial}
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        <motion.h2 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-ink/80 font-heading text-lg tracking-[0.3em] uppercase mb-3"
        >
          {text.loading.title}
        </motion.h2>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100px" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"
        />
        
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="mt-4 text-ink/40 text-[10px] tracking-[0.4em] uppercase"
        >
          {text.loading.subtitle}
        </motion.p>
      </motion.div>
    </div>
  );
}
