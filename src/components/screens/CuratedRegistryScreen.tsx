import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { GiftSelectionModal } from './GiftSelectionModal';

import { RegistryGift } from '@/types';
import { getRegistryGifts } from '@/app/actions/registry';

interface Gift extends RegistryGift {
  iconFn?: () => React.ReactNode;
}

const defaultIcon = () => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
);

interface CuratedRegistryScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CuratedRegistryScreen({ isOpen, onClose }: CuratedRegistryScreenProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Fetch registry gifts from Server Action
    let mounted = true;
    const fetchGifts = async () => {
      const giftData = await getRegistryGifts();
      if (mounted) {
        setGifts(giftData.map(data => ({
          ...data,
          iconFn: defaultIcon
        })));
      }
    };
    
    fetchGifts();

    return () => {
      mounted = false;
    };
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const handleGiftSubmit = (details: { name: string; email: string; message: string }) => {
    if (!selectedGift) return;

    setGifts(prev => prev.map(gift => {
      if (gift.id === selectedGift.id) {
        return { ...gift, currentCount: gift.currentCount + 1 };
      }
      return gift;
    }));
    
    setSelectedGift(null);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 w-full h-full bg-wedding-dark z-[100] overflow-y-auto overflow-x-hidden flex flex-col"
        >
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <button 
        onClick={onClose}
        className="fixed top-6 left-6 z-[60] w-10 h-10 rounded-full bg-wedding-dark/50 backdrop-blur-sm border border-wedding-gold/30 flex items-center justify-center text-wedding-gold hover:text-wedding-goldlight hover:border-wedding-gold transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
      </button>

      <div className="max-w-6xl mx-auto w-full px-4 py-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-sm uppercase tracking-[0.4em] text-wedding-gold block mb-4">Curated Registry Suggestions</span>
          <p className="text-base font-cormorant italic text-wedding-goldlight/80 max-w-xl mx-auto">
            Should you wish to send a specific home keepsake, please choose one below to select it.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6"
        >
          {gifts.map((gift) => {
            const isAvailable = gift.currentCount < gift.maxCount;

            return (
              <motion.div 
                key={gift.id} 
                variants={itemVariants}
                className={`bg-wedding-dark/80 rounded-xl border p-3 sm:p-5 flex flex-col items-center justify-between aspect-square transition-all duration-300
                  ${isAvailable ? 'border-wedding-gold/20 hover:border-wedding-gold/40 shadow-sm hover:shadow-md' : 'border-wedding-gold/10 opacity-60 grayscale'}
                `}
              >
                <div className="flex flex-col items-center w-full mb-2 sm:mb-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center mb-2 sm:mb-3 ${isAvailable ? 'text-wedding-gold' : 'text-wedding-gold/40'}`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {gift.iconFn ? gift.iconFn() : defaultIcon()}
                    </svg>
                  </div>
                  <h3 className={`text-[8px] sm:text-[10px] text-center font-cinzel tracking-widest leading-relaxed uppercase ${isAvailable ? 'text-wedding-cream' : 'text-wedding-cream/50'}`}>
                    {gift.name}
                  </h3>
                </div>

                <div className="w-full space-y-1.5 sm:space-y-2 mt-auto">
                  <a 
                    href={gift.link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full block text-center py-1.5 sm:py-2 bg-transparent border border-wedding-gold/40 text-wedding-gold hover:border-wedding-gold hover:text-wedding-goldlight text-[8px] sm:text-[9px] tracking-[0.2em] uppercase transition-all duration-300 rounded-sm"
                  >
                    View Item
                  </a>
                  
                  <button 
                    disabled={!isAvailable}
                    onClick={() => setSelectedGift(gift)}
                    className={`w-full text-center py-1.5 sm:py-2 text-[8px] sm:text-[9px] tracking-[0.2em] uppercase transition-all duration-300 rounded-sm border
                      ${isAvailable 
                        ? 'bg-transparent border-wedding-gold/30 text-wedding-gold hover:bg-wedding-gold/10 hover:border-wedding-gold hover:text-wedding-goldlight' 
                        : 'bg-transparent border-wedding-gold/20 text-wedding-gold/40 cursor-not-allowed'}
                    `}
                  >
                    {isAvailable ? "Select This Gift" : "Selected"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

          <GiftSelectionModal 
            isOpen={selectedGift !== null}
            onClose={() => setSelectedGift(null)}
            giftName={selectedGift?.name || ""}
            onSubmit={handleGiftSubmit}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
