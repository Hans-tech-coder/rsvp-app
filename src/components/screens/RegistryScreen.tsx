"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { CuratedRegistryScreen } from './CuratedRegistryScreen';

interface RegistryScreenProps {
  onContinue: () => void;
}

export function RegistryScreen({ onContinue }: RegistryScreenProps) {
  const [showCuratedRegistry, setShowCuratedRegistry] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('IBAN Details Copied!');
  };

  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-4xl mx-auto w-full relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">Wishing Well</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">Registry & Contributions</h2>
          <div className="w-16 h-[1px] bg-wedding-gold/30 mx-auto mt-4"></div>
          <p className="text-base font-cormorant italic text-wedding-cream/70 mt-3 max-w-md mx-auto">
            Your presence is our ultimate gift, but should you wish to honor us, we have provided options below.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="bg-wedding-dark/60 p-8 rounded-xl border border-wedding-gold/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-wedding-gold rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-wedding-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              <h3 className="text-xl font-cinzel text-wedding-cream font-light mb-3">Bank Transfer</h3>
              <p className="text-sm font-cormorant text-wedding-cream mb-6 leading-relaxed">
                Directly support our honeymoon adventures or first home goals with an elegant direct bank contribution.
              </p>
              <div className="bg-wedding-dark/40 p-4 rounded-lg border border-wedding-gold/10 text-xs font-inter space-y-3 mb-6">
                <div className="flex justify-between border-b border-wedding-gold/10 pb-2">
                  <span className="text-wedding-cream/60 uppercase">Bank:</span>
                  <span className="font-medium text-wedding-cream">Lombard Odier Private Bank</span>
                </div>
                <div className="flex justify-between border-b border-wedding-gold/10 pb-2">
                  <span className="text-wedding-cream/60 uppercase">Beneficiary:</span>
                  <span className="font-medium text-wedding-cream">Hans & Czay</span>
                </div>
                <div className="flex justify-between items-center border-b border-wedding-gold/10 pb-2">
                  <span className="text-wedding-cream/60 uppercase">IBAN:</span>
                  <span className="font-medium text-wedding-goldlight">CH89 0023 9482 1042 8111 0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-wedding-cream/60 uppercase">SWIFT:</span>
                  <span className="font-medium text-wedding-goldlight">LOMDCH22XXX</span>
                </div>
              </div>
            </div>
            <button onClick={() => copyToClipboard('CH89 0023 9482 1042 8111 0')} className="w-full text-center py-3 bg-transparent border border-wedding-gold/40 text-wedding-gold hover:bg-wedding-gold/10 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.2em] font-medium uppercase transition-all duration-300 rounded-sm">
              Copy IBAN Details
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-wedding-dark/60 p-8 rounded-xl border border-wedding-gold/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-wedding-gold rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-wedding-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              <h3 className="text-xl font-cinzel text-wedding-cream font-light mb-3">Curated Registry</h3>
              <p className="text-sm font-cormorant text-wedding-cream mb-6 leading-relaxed">
                We have lovingly curated a wedding registry featuring beautiful, elegant keepsakes and lifestyle pieces from our favorite boutiques.
              </p>
              <p className="text-xs text-wedding-cream/60 leading-relaxed mb-8">
                Options include premium vintage collection tablewares, designer home accents, and art contributions for our newly renovated residence.
              </p>
            </div>
            <button onClick={() => setShowCuratedRegistry(true)} className="w-full text-center py-3 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.2em] font-medium uppercase transition-all duration-300 rounded-sm">
              Visit Wedding Registry
            </button>
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

      <CuratedRegistryScreen 
        isOpen={showCuratedRegistry} 
        onClose={() => setShowCuratedRegistry(false)} 
      />
    </section>
  );
}
