"use client";

import React from 'react';
import { motion , Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

interface OurStoryScreenProps {
  onContinue: () => void;
}

export function OurStoryScreen({ onContinue }: OurStoryScreenProps) {
  const { content } = useWeddingContent();
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
    }
  };


  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-5xl mx-auto relative z-10 w-full"
      >
        <motion.div variants={itemVariants} className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">Our Journey</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">The Chapters of Us</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
          <p className="text-base font-cormorant italic text-wedding-goldlight/70 mt-3 max-w-md mx-auto">Every love story is beautiful, but ours is our favorite editorial masterpiece.</p>
        </motion.div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-wedding-gold/30 to-transparent transform md:-translate-x-1/2"></div>
          
          {content.ourStory.map((item, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className={`relative mb-16 md:mb-24 w-full md:w-1/2 pl-8 ${index % 2 === 0 ? 'md:pl-0 md:pr-16 md:mr-auto' : 'md:pl-16 md:ml-auto'}`}
            >
              <div className={`absolute -left-4 ${index % 2 === 0 ? 'md:left-auto md:-right-4' : 'md:-left-4'} top-0 w-8 h-8 rounded-full bg-wedding-dark border border-wedding-gold/40 flex items-center justify-center z-10`}>
                <div className="w-2.5 h-2.5 rounded-full bg-wedding-gold"></div>
              </div>
              <div className="bg-wedding-dark/40 p-6 md:p-8 rounded-lg shadow-sm border border-wedding-gold/10 hover:shadow-lg hover:border-wedding-gold/30 transition-all duration-500">
                <span className="text-xs uppercase tracking-widest text-wedding-gold/70 font-semibold block mb-1">{item.date}</span>
                <h3 className="text-2xl font-cinzel text-wedding-cream font-light mb-3">{item.title}</h3>
                <img src={item.image} alt={item.title} className="w-full h-48 object-cover rounded-md mb-4 brightness-[0.95] hover:brightness-110 transition-all duration-500" />
                <p className="text-sm font-cormorant text-wedding-cream leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
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
