"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

interface EntourageScreenProps {
  onContinue: () => void;
}

export function EntourageScreen({ onContinue }: EntourageScreenProps) {
  const { content } = useWeddingContent();
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section className="py-16 md:py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-6xl mx-auto relative z-10 w-full"
      >
        <motion.div variants={itemVariants} className="text-center mb-16 md:mb-20">
          <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-3">{content.entourage.subtitle}</span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-cinzel font-light text-wedding-goldlight tracking-widest">{content.entourage.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
        </motion.div>

        {/* Principal Sponsors */}
        <motion.div variants={itemVariants} className="mb-24 md:mb-32">
          <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-12 flex items-center justify-center gap-4">
            <span className="w-16 md:w-32 h-[1px] bg-gradient-to-r from-transparent to-wedding-gold/30"></span> 
            Principal Sponsors 
            <span className="w-16 md:w-32 h-[1px] bg-gradient-to-l from-transparent to-wedding-gold/30"></span>
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-8 md:gap-y-10 max-w-6xl mx-auto px-4 md:px-0">
            {content.entourage.principalSponsors.map((sponsor, index) => (
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                key={index} 
                className="text-center flex items-center justify-center gap-2 md:gap-3 group cursor-default"
              >
                <div className="w-1 h-1 rotate-45 bg-wedding-gold/40 group-hover:bg-wedding-gold transition-colors duration-500 hidden sm:block"></div>
                <h4 className="font-cormorant text-base sm:text-lg md:text-xl lg:text-2xl text-wedding-cream/90 font-medium tracking-wide md:tracking-widest group-hover:text-wedding-goldlight group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-500 ease-out">{sponsor}</h4>
                <div className="w-1 h-1 rotate-45 bg-wedding-gold/40 group-hover:bg-wedding-gold transition-colors duration-500 hidden sm:block"></div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Honor Attendants */}
        <motion.div variants={itemVariants} className="mb-16 md:mb-24 relative max-w-6xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/20 to-transparent -translate-x-1/2 hidden md:block"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-0 w-full px-4 md:px-0">
            {/* Maid of Honor Column */}
            <div className="flex flex-col items-center justify-start group cursor-default">
              <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-4 w-full">
                <span className="px-2">Maid of Honor</span>
              </h3>
              <div className="text-center px-4 w-full">
                <h4 className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-wedding-cream font-medium tracking-widest group-hover:text-wedding-goldlight group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-500 whitespace-nowrap">{content.entourage.honorAttendants.maidOfHonor}</h4>
              </div>
            </div>

            {/* Best Man Column */}
            <div className="flex flex-col items-center justify-start group cursor-default">
              <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-8 flex items-center justify-center gap-4 w-full">
                <span className="px-2">Best Man</span>
              </h3>
              <div className="text-center px-4 w-full">
                <h4 className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-wedding-cream font-medium tracking-widest group-hover:text-wedding-goldlight group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-500 whitespace-nowrap">{content.entourage.honorAttendants.bestMan}</h4>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bridesmaids and Groomsmen */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-0 max-w-5xl mx-auto mb-16 px-4 md:px-0 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/20 to-transparent -translate-x-1/2 hidden md:block"></div>
          
          <div className="flex flex-col items-center">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-10 flex items-center justify-center gap-4 w-full">
              <span className="px-2">Bridesmaids</span>
            </h3>
            <ul className="text-center space-y-6 md:space-y-8 w-full px-4">
              {content.entourage.bridesmaids.map((name, index) => (
                <li key={index} className="font-cormorant text-xl md:text-2xl lg:text-3xl text-wedding-cream/85 hover:text-wedding-goldlight hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default">{name}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] text-wedding-gold/80 text-center mb-10 flex items-center justify-center gap-4 w-full">
              <span className="px-2">Groomsmen</span>
            </h3>
            <ul className="text-center space-y-6 md:space-y-8 w-full px-4">
              {content.entourage.groomsmen.map((name, index) => (
                <li key={index} className="font-cormorant text-xl md:text-2xl lg:text-3xl text-wedding-cream/85 hover:text-wedding-goldlight hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105 transition-all duration-500 tracking-wider cursor-default">{name}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="w-full flex justify-center pb-12 pt-8 relative z-20"
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
