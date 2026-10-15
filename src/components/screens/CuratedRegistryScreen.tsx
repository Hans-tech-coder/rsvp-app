import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence , Variants } from 'motion/react';
import { GiftSelectionModal } from './GiftSelectionModal';

import { RegistryGift } from '@/types';
import { getRegistryGifts, claimGift } from '@/app/actions/registry';
import { useSiteText } from '@/contexts/SiteTextContext';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

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
  const text = useSiteText();
  const { eventId } = useWeddingContent();
  const [gifts, setGifts]= useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Fetch registry gifts from Server Action
    let mounted = true;
    const fetchGifts = async () => {
      const giftData = await getRegistryGifts(eventId);
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
  }, [eventId]);

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

  const handleGiftSubmit = async (details: { name: string; email: string; message: string }) => {
    if (!selectedGift || !selectedGift.id) return;

    const res = await claimGift(eventId, selectedGift.id, {
      fullName: details.name,
      email: details.email,
      message: details.message
    });

    if (res.success) {
      setGifts(prev => prev.map(gift => {
        if (gift.id === selectedGift.id) {
          const newCount = gift.currentCount + 1;
          return { ...gift, currentCount: newCount, isFull: newCount >= gift.maxCount };
        }
        return gift;
      }));
      setSelectedGift(null);
    } else {
      alert(text.curatedRegistry.errors[res.code ?? 'failed']);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 w-full h-full bg-surface z-[100] overflow-y-auto overflow-x-hidden flex flex-col"
        >
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface via-primary-deep to-surface pointer-events-none"></div>

      <button 
        onClick={onClose}
        aria-label="Close registry"
        className="fixed top-6 left-6 z-[60] w-11 h-11 rounded-full bg-surface/50 backdrop-blur-sm border border-accent/30 flex items-center justify-center text-accent hover:text-accent-light hover:border-accent transition-all duration-300 active:scale-95"
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
          <span className="text-sm uppercase tracking-[0.4em] text-accent block mb-4">{text.curatedRegistry.title}</span>
          <p className="text-base font-cormorant italic text-accent-light/80 max-w-xl mx-auto">
            {text.curatedRegistry.intro}
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
                className={`bg-surface/80 rounded-xl border p-3 sm:p-5 flex flex-col items-center justify-between aspect-square transition-all duration-300
                  ${isAvailable ? 'border-accent/20 hover:border-accent/40 shadow-sm hover:shadow-md' : 'border-accent/10 opacity-60 grayscale'}
                `}
              >
                <div className="flex flex-col items-center w-full mb-2 sm:mb-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center mb-2 sm:mb-3 ${isAvailable ? 'text-accent' : 'text-accent/40'}`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {gift.iconFn ? gift.iconFn() : defaultIcon()}
                    </svg>
                  </div>
                  <h3 className={`text-[8px] sm:text-[10px] text-center font-cinzel tracking-widest leading-relaxed uppercase ${isAvailable ? 'text-ink' : 'text-ink/50'}`}>
                    {gift.name}
                  </h3>
                </div>

                <div className="w-full space-y-1.5 sm:space-y-2 mt-auto">
                  <a 
                    href={gift.link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full block text-center py-1.5 sm:py-2 bg-transparent border border-accent/40 text-accent hover:border-accent hover:text-accent-light text-[8px] sm:text-[9px] tracking-[0.2em] uppercase transition-all duration-300 rounded-sm"
                  >
                    {text.curatedRegistry.viewItem}
                  </a>
                  
                  <button 
                    disabled={!isAvailable}
                    onClick={() => setSelectedGift(gift)}
                    className={`w-full text-center py-1.5 sm:py-2 text-[8px] sm:text-[9px] tracking-[0.2em] uppercase transition-all duration-300 rounded-sm border
                      ${isAvailable 
                        ? 'bg-transparent border-accent/30 text-accent hover:bg-accent/10 hover:border-accent hover:text-accent-light' 
                        : 'bg-transparent border-accent/20 text-accent/40 cursor-not-allowed'}
                    `}
                  >
                    {isAvailable ? text.curatedRegistry.selectGift : text.curatedRegistry.selected}
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
