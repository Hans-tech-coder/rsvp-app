"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';

export function EmbeddedFooter() {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="w-[calc(100%+2rem)] -mx-4 -mb-24 py-8 text-center border-t border-wedding-cream/20 mt-16 shrink-0 relative z-20 flex flex-col justify-center"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="text-xl font-cinzel tracking-[0.4em] text-wedding-cream/80 mb-4">H & C</div>
        <p className="text-xs font-cormorant italic text-wedding-cream/80 mb-4">&quot;Together is a beautiful place to be&quot;</p>
        <div className="flex items-center justify-center space-x-3 mb-6">
          <span className="w-8 h-[1px] bg-wedding-cream/20"></span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-wedding-cream/70 font-medium">20.12.2026</span>
          <span className="w-8 h-[1px] bg-wedding-cream/20"></span>
        </div>
        <p className="text-[9px] uppercase tracking-widest text-wedding-cream/60">Designed with modern elegance & love.</p>
      </div>
    </motion.div>
  );
}
