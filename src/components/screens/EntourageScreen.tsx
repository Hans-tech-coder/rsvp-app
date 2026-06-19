"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';

interface EntourageScreenProps {
  onContinue: () => void;
}

export function EntourageScreen({ onContinue }: EntourageScreenProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-6xl mx-auto relative z-10 w-full"
      >
        <motion.div variants={itemVariants} className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">With love and gratitude</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">Wedding Entourage</h2>
          <div className="w-16 h-[1px] bg-wedding-gold/30 mx-auto mt-4"></div>
        </motion.div>

        {/* Principal Sponsors */}
        <motion.div variants={itemVariants} className="mb-16">
          <h3 className="font-cinzel text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-3">
            <span className="w-8 h-[1px] bg-wedding-gold/30"></span> Principal Sponsors <span className="w-8 h-[1px] bg-wedding-gold/30"></span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((num) => (
              <motion.div whileHover={{ y: -5 }} key={num} className="p-8 bg-wedding-dark/40 backdrop-blur-sm border border-wedding-gold/20 rounded-xl shadow-sm hover:shadow-md hover:border-wedding-gold/40 transition-all duration-500 ease-out text-center flex flex-col justify-center items-center group">
                <span className="text-[9px] uppercase tracking-[0.25em] text-wedding-gold/70 font-medium mb-2 block">Principal Sponsor</span>
                <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/40 mb-4 group-hover:bg-wedding-gold transition-colors duration-500"></div>
                <h4 className="font-cormorant text-xl md:text-2xl text-wedding-cream font-medium tracking-wide">Sponsor Name {num}</h4>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Honor Attendants */}
        <motion.div variants={itemVariants} className="mb-16">
          <h3 className="font-cinzel text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-3">
            <span className="w-8 h-[1px] bg-wedding-gold/30"></span> Honor Attendants <span className="w-8 h-[1px] bg-wedding-gold/30"></span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-6">
            <motion.div whileHover={{ y: -5 }} className="p-8 bg-wedding-dark/40 backdrop-blur-sm border border-wedding-gold/20 rounded-xl shadow-sm hover:shadow-md hover:border-wedding-gold/40 transition-all duration-500 ease-out text-center flex flex-col justify-center items-center group">
              <span className="text-[9px] uppercase tracking-[0.25em] text-wedding-gold/70 font-semibold mb-2 block">Maid of Honor</span>
              <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/40 mb-4 group-hover:bg-wedding-gold transition-colors duration-500"></div>
              <h4 className="font-cormorant text-xl md:text-2xl text-wedding-cream font-medium tracking-wide">Jane Doe</h4>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="p-8 bg-wedding-dark/40 backdrop-blur-sm border border-wedding-gold/20 rounded-xl shadow-sm hover:shadow-md hover:border-wedding-gold/40 transition-all duration-500 ease-out text-center flex flex-col justify-center items-center group">
              <span className="text-[9px] uppercase tracking-[0.25em] text-wedding-gold/70 font-semibold mb-2 block">Best Man</span>
              <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/40 mb-4 group-hover:bg-wedding-gold transition-colors duration-500"></div>
              <h4 className="font-cormorant text-xl md:text-2xl text-wedding-cream font-medium tracking-wide">John Smith</h4>
            </motion.div>
          </div>
        </motion.div>

        {/* Bridesmaids and Groomsmen */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 max-w-4xl mx-auto mb-8">
          <div className="flex flex-col">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-wedding-gold/80 text-center mb-4 md:mb-8 flex items-center justify-center gap-1 md:gap-3">
              <span className="hidden md:block w-8 h-[1px] bg-wedding-gold/30"></span> Bridesmaids <span className="hidden md:block w-8 h-[1px] bg-wedding-gold/30"></span>
            </h3>
            <div className="flex-1 p-6 md:p-10 bg-wedding-dark/40 backdrop-blur-sm border border-wedding-gold/20 rounded-xl shadow-sm hover:shadow-md hover:border-wedding-gold/40 transition-all duration-500 ease-out text-center">
              <ul className="font-cormorant text-lg md:text-2xl text-wedding-cream font-medium tracking-wide space-y-3 md:space-y-4">
                <li>Anna Cruz</li>
                <li>Maria Santos</li>
                <li>Liza Garcia</li>
                <li>Kim Reyes</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-wedding-gold/80 text-center mb-4 md:mb-8 flex items-center justify-center gap-1 md:gap-3">
              <span className="hidden md:block w-8 h-[1px] bg-wedding-gold/30"></span> Groomsmen <span className="hidden md:block w-8 h-[1px] bg-wedding-gold/30"></span>
            </h3>
            <div className="flex-1 p-6 md:p-10 bg-wedding-dark/40 backdrop-blur-sm border border-wedding-gold/20 rounded-xl shadow-sm hover:shadow-md hover:border-wedding-gold/40 transition-all duration-500 ease-out text-center">
              <ul className="font-cormorant text-lg md:text-2xl text-wedding-cream font-medium tracking-wide space-y-3 md:space-y-4">
                <li>Mark Dela Cruz</li>
                <li>Paulo Rivera</li>
                <li>Jason Lim</li>
                <li>Carlo Mendoza</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="w-full flex justify-center pb-8 md:pb-24 pt-8 relative z-20"
      >
        <button onClick={onContinue} className="group flex flex-col items-center justify-center space-y-3 cursor-pointer focus:outline-none animate-bounce mt-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-wedding-cream/70 font-medium group-hover:text-wedding-gold transition-colors duration-300">Continue</span>
          <div className="w-10 h-10 rounded-full border border-wedding-cream/30 flex items-center justify-center transition-all duration-300 group-hover:bg-wedding-gold/10 group-hover:border-wedding-gold">
            <svg className="w-4 h-4 text-wedding-cream/70 transition-transform duration-300 group-hover:translate-y-1 group-hover:text-wedding-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
        </button>
      </motion.div>

      <EmbeddedFooter />
    </section>
  );
}
