"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { DraggableSlider } from '@/components/ui/DraggableSlider';

interface DressCodeScreenProps {
  onContinue: () => void;
}

export function DressCodeScreen({ onContinue }: DressCodeScreenProps) {
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

  const colors = [
    { name: "Dark Burgundy", hex: "#4A1519" },
    { name: "Deep Burgundy", hex: "#841B2D" },
    { name: "Antique Gold", hex: "#BFA071" },
    { name: "Soft Blush", hex: "#D2B1A2" },
    { name: "Ivory Cream", hex: "#F4F5EB" }
  ];

  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-4xl mx-auto text-center w-full relative z-10"
      >
        <motion.div variants={itemVariants} className="mb-16">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">The Style Guideline</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">La Palette de l&apos;Amour</h2>
          <div className="w-16 h-[1px] bg-wedding-gold/30 mx-auto mt-4"></div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-wedding-dark/60 p-8 md:p-12 rounded-xl border border-wedding-gold/20 shadow-md">
          <p className="text-sm uppercase tracking-[0.2em] text-wedding-gold font-semibold mb-3">Dress Code: Formal Black Tie Optional</p>
          <p className="text-base font-cormorant italic text-wedding-goldlight max-w-2xl mx-auto leading-relaxed mb-10">
            To honor our vision of a beautiful, cohesive atmosphere in Tarlac, we respectfully request our guests to dress in harmony with our burgundy and gold color story.
          </p>

          {/* Suggested Color Swatches */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
            {colors.map((color, index) => (
              <motion.div whileHover={{ scale: 1.05 }} key={index} className={`flex flex-col items-center ${index === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <div 
                  className="w-16 h-16 rounded-full border border-wedding-burgundy/20 shadow-inner mb-2 flex items-center justify-center mx-auto"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="w-14 h-14 rounded-full border border-dashed border-white/40"></div>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-wedding-cream/80 text-center">{color.name}</span>
              </motion.div>
            ))}
          </div>

          {/* Attire Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-t border-wedding-gold/20 pt-8 mb-10">
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-wedding-gold font-bold mb-3">For Ladies</h4>
              <p className="text-sm font-cormorant text-wedding-cream leading-relaxed">
                Floor-length gowns or refined midi-cocktail dresses in shades of burgundy, blush, antique gold, or warm neutrals. Flowing silhouettes and romantic laces are highly welcomed.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-wedding-gold font-bold mb-3">For Gentlemen</h4>
              <p className="text-sm font-cormorant text-wedding-cream leading-relaxed">
                Classic dinner suit (Tuxedo) or tailored suit with crisp white dress shirts. Deep charcoal, navy, or black tailored coordinates. Bowties or silk ties matching the theme are preferred.
              </p>
            </div>
          </div>

          {/* Outfit Inspiration Slider */}
          <div className="border-t border-wedding-gold/20 pt-8 mt-4">
            <h4 className="text-xs uppercase tracking-[0.25em] text-wedding-gold/80 font-bold mb-6 text-center">Outfit Inspiration</h4>
            
            <div className="relative w-full max-w-full" style={{
              mask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
              WebkitMask: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)'
            }}>
              <div className="outfit-slider-wrapper w-full py-4">
                <DraggableSlider speed={0.5}>
                  {[...Array(2)].map((_, i) => (
                    <React.Fragment key={i}>
                      <div className="w-[140px] sm:w-[180px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden relative group shadow-sm border border-wedding-gold/20 flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=400" alt="Ladies Dress 1" className="w-full h-full object-cover transform duration-500 group-hover:scale-105 pointer-events-none" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
                          <span className="text-[9px] uppercase tracking-widest text-wedding-cream/90 pointer-events-none">Ladies</span>
                        </div>
                      </div>
                      <div className="w-[140px] sm:w-[180px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden relative group shadow-sm border border-wedding-gold/20 flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400" alt="Gentlemen Suit 1" className="w-full h-full object-cover transform duration-500 group-hover:scale-105 pointer-events-none" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
                          <span className="text-[9px] uppercase tracking-widest text-wedding-cream/90 pointer-events-none">Gentlemen</span>
                        </div>
                      </div>
                      <div className="w-[140px] sm:w-[180px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden relative group shadow-sm border border-wedding-gold/20 flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400" alt="Ladies Dress 2" className="w-full h-full object-cover transform duration-500 group-hover:scale-105 pointer-events-none" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
                          <span className="text-[9px] uppercase tracking-widest text-wedding-cream/90 pointer-events-none">Ladies</span>
                        </div>
                      </div>
                      <div className="w-[140px] sm:w-[180px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden relative group shadow-sm border border-wedding-gold/20 flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=400" alt="Gentlemen Suit 2" className="w-full h-full object-cover transform duration-500 group-hover:scale-105 pointer-events-none" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
                          <span className="text-[9px] uppercase tracking-widest text-wedding-cream/90 pointer-events-none">Gentlemen</span>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </DraggableSlider>
              </div>
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
