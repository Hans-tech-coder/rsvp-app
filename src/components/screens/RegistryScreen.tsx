"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { CuratedRegistryScreen } from './CuratedRegistryScreen';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

interface RegistryScreenProps {
  onContinue: () => void;
}

export function RegistryScreen({ onContinue }: RegistryScreenProps) {
  const { content } = useWeddingContent();
  const [showCuratedRegistry, setShowCuratedRegistry] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
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
              
              <div className="grid grid-cols-2 gap-3 mt-auto">
                {['GCash', 'Maya', 'Maribank', 'Landbank', 'BPI', 'GoTyme'].map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className="w-full text-center py-3 bg-wedding-dark/40 border border-wedding-gold/20 text-wedding-cream hover:bg-wedding-gold/10 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.1em] font-medium transition-all duration-300 rounded-sm"
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
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

      <AnimatePresence>
        {selectedBank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedBank(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-wedding-dark border border-wedding-gold/30 rounded-xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedBank(null)}
                className="absolute top-4 right-4 text-wedding-cream/50 hover:text-wedding-gold transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-cinzel text-wedding-goldlight mb-2">{selectedBank}</h3>
                <p className="text-sm font-cormorant text-wedding-cream/80">Scan the QR code to transfer</p>
              </div>

              <div className="bg-white p-4 rounded-lg aspect-square flex items-center justify-center mb-6">
                <div className="w-full h-full border-4 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"></path></svg>
                  <span className="text-xs font-inter uppercase tracking-wider text-center px-4">Place {selectedBank} QR Code Here</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-inter text-wedding-cream/60 uppercase tracking-widest">Thank you for your generosity</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
