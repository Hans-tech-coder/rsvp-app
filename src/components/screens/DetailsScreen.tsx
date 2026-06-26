"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

interface DetailsScreenProps {
  onContinue: () => void;
}

export function DetailsScreen({ onContinue }: DetailsScreenProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const { content } = useWeddingContent();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const openMap = (url: string) => {
    setMapUrl(url);
  };

  const closeMap = () => {
    setMapUrl(null);
  };

  const addToCalendar = (title: string, desc: string, loc: string, start: string) => {
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start.replace(/[-:]/g, "")}Z/${start.replace(/[-:]/g, "")}Z&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc)}`;
    window.open(url, '_blank');
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
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">{content.details.header?.subtitle || "The Celebration"}</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">{content.details.header?.title || "Where & When"}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
          <p className="text-base font-cormorant italic text-wedding-goldlight/70 mt-3 max-w-lg mx-auto">{content.details.header?.description || "A breathtaking romance in Paniqui, Tarlac."}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ceremony Details */}
          <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-wedding-dark/60 p-8 md:p-12 rounded-xl shadow-lg border border-wedding-gold/20 hover:shadow-xl hover:border-wedding-gold/40 transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] bg-wedding-gold/10 border border-wedding-gold/30 text-wedding-goldlight px-3 py-1 font-semibold rounded-full">{content.details.ceremony.subtitle || "The Vows"}</span>
                <span className="text-sm font-cinzel text-wedding-goldlight/70">{content.details.ceremony.time}</span>
              </div>
              <h3 className="text-3xl font-cinzel text-wedding-cream font-light tracking-wide mb-4">{content.details.ceremony.title}</h3>
              <div className="w-16 h-[1px] bg-gradient-to-r from-wedding-gold/50 to-transparent mb-6"></div>
              <p className="text-sm font-cormorant text-wedding-cream mb-6 leading-relaxed">
                {content.details.ceremony.description}
              </p>
              <div className="space-y-3 text-sm text-wedding-cream mb-8 font-cormorant tracking-wide">
                <div className="flex items-start">
                  <span className="text-wedding-gold mr-3 mt-[2px]">✦</span> 
                  <p className="flex-1"><strong>Location:</strong>&nbsp;{content.details.ceremony.location}</p>
                </div>
                <div className="flex items-start">
                  <span className="text-wedding-gold mr-3 mt-[2px]">✦</span> 
                  <p className="flex-1"><strong>Address:</strong>&nbsp;{content.details.ceremony.address}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-wedding-gold/20">
              <button onClick={() => openMap(content.details.ceremony.mapLink)} className="text-center py-3 bg-transparent border border-wedding-gold/40 text-wedding-gold hover:bg-wedding-gold/10 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.15em] font-medium uppercase transition-all duration-300 rounded-sm">
                View Location
              </button>
              <button onClick={() => addToCalendar(content.details.ceremony.calendarDesc, content.details.ceremony.calendarDesc, content.details.ceremony.calendarLoc, content.details.ceremony.calendarStart)} className="text-center py-3 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.15em] font-medium uppercase transition-all duration-300 rounded-sm">
                Add To Calendar
              </button>
            </div>
          </motion.div>

          {/* Reception Details */}
          <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-wedding-dark/60 p-8 md:p-12 rounded-xl shadow-lg border border-wedding-gold/20 hover:shadow-xl hover:border-wedding-gold/40 transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] bg-wedding-gold/10 border border-wedding-gold/30 text-wedding-goldlight px-3 py-1 font-semibold rounded-full">{content.details.reception.subtitle || "The Dinner & Ball"}</span>
                <span className="text-sm font-cinzel text-wedding-goldlight/70">{content.details.reception.time}</span>
              </div>
              <h3 className="text-3xl font-cinzel text-wedding-cream font-light tracking-wide mb-4">{content.details.reception.title}</h3>
              <div className="w-16 h-[1px] bg-gradient-to-r from-wedding-gold/50 to-transparent mb-6"></div>
              <p className="text-sm font-cormorant text-wedding-cream mb-6 leading-relaxed">
                {content.details.reception.description}
              </p>
              <div className="space-y-3 text-sm text-wedding-cream mb-8 font-cormorant tracking-wide">
                <div className="flex items-start">
                  <span className="text-wedding-gold mr-3 mt-[2px]">✦</span> 
                  <p className="flex-1"><strong>Location:</strong>&nbsp;{content.details.reception.location}</p>
                </div>
                <div className="flex items-start">
                  <span className="text-wedding-gold mr-3 mt-[2px]">✦</span> 
                  <p className="flex-1"><strong>Address:</strong>&nbsp;{content.details.reception.address}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-wedding-gold/20">
              <button onClick={() => openMap(content.details.reception.mapLink)} className="text-center py-3 bg-transparent border border-wedding-gold/40 text-wedding-gold hover:bg-wedding-gold/10 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.15em] font-medium uppercase transition-all duration-300 rounded-sm">
                View Location
              </button>
              <button onClick={() => addToCalendar(content.details.reception.calendarDesc, content.details.reception.calendarDesc, content.details.reception.calendarLoc, content.details.reception.calendarStart)} className="text-center py-3 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.15em] font-medium uppercase transition-all duration-300 rounded-sm">
                Add To Calendar
              </button>
            </div>
          </motion.div>
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

      {/* Map Modal */}
      <AnimatePresence>
        {mapUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-wedding-dark border border-wedding-burgundylight/30 w-full max-w-4xl h-[80vh] rounded-xl overflow-hidden relative flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-4 border-b border-wedding-gold/20 bg-wedding-dark">
                <h3 className="font-cinzel tracking-widest text-wedding-goldlight">Location Map</h3>
                <button onClick={closeMap} className="text-wedding-cream/70 hover:text-wedding-gold transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="flex-1 w-full h-full relative">
                <iframe src={mapUrl} className="absolute inset-0 w-full h-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
