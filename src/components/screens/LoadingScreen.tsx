"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.5, ease: [0.64, 0, 0.78, 0] } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-wedding-dark overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-wedding-dark/80 via-wedding-deepburgundy/30 to-wedding-dark/90 pointer-events-none"></div>

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
            className="absolute inset-0 rounded-full border border-wedding-gold/20 border-t-wedding-gold/80"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-wedding-goldlight/10 border-b-wedding-goldlight/60"
          />
          <motion.div 
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-wedding-gold text-2xl font-cinzel tracking-widest"
          >
            H<span className="text-wedding-goldlight text-lg mx-1">&</span>C
          </motion.div>
        </div>

        <motion.h2 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-wedding-cream/80 font-cinzel text-lg tracking-[0.3em] uppercase mb-3"
        >
          Curating Elegance
        </motion.h2>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100px" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent"
        />
        
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="mt-4 text-wedding-cream/40 text-[10px] tracking-[0.4em] uppercase"
        >
          Please wait
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
