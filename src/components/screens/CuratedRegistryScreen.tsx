import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { GiftSelectionModal } from './GiftSelectionModal';

interface Gift {
  id: number;
  name: string;
  link: string;
  maxCount: number;
  currentCount: number;
  iconFn: () => React.ReactNode;
}

const defaultGifts: Gift[] = [
  { 
    id: 1, name: "Kitchen Appliance", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 4v3m4-3v3m-2 3v7m-4-7h8m-6 7h4a2 2 0 002-2V8H8v7a2 2 0 002 2z" />
  },
  { 
    id: 2, name: "Dinnerware Set", link: "https://shopee.ph", maxCount: 2, currentCount: 0, 
    iconFn: () => <><circle cx="12" cy="12" r="8" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" strokeWidth="1.5"/></>
  },
  { 
    id: 3, name: "Coffee Machine", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 1v3M10 1v3M14 1v3" /></>
  },
  { 
    id: 4, name: "Home Decor Piece", link: "https://shopee.ph", maxCount: 3, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18v-5m0 0a4 4 0 10-4-4v4h8v-4a4 4 0 10-4 4zM8 21h8" />
  },
  { 
    id: 5, name: "Bedding Set", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16M2 6v12a2 2 0 002 2h16a2 2 0 002-2V6" />
  },
  { 
    id: 6, name: "Smart Home Device", link: "https://shopee.ph", maxCount: 2, currentCount: 0, 
    iconFn: () => <><circle cx="12" cy="12" r="9" strokeWidth="1.5"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v8M8 12h8" /></>
  },
  { 
    id: 7, name: "Cookware Set", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 11h12v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6zM4 11h16M9 7h6v4H9z" />
  },
  { 
    id: 8, name: "Blender Premium", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 4h6v9H9zM10 13v6a2 2 0 004 0v-6M10 16h4" />
  },
  { 
    id: 9, name: "Wine Glass Set", link: "https://shopee.ph", maxCount: 2, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 3h8l-1.5 7h-5L8 3zM12 10v10M9 20h6" />
  },
  { 
    id: 10, name: "Toaster Oven Deluxe", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <><rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="1.5"/><circle cx="8" cy="12" r="1" strokeWidth="1.5"/><circle cx="16" cy="12" r="1" strokeWidth="1.5"/></>
  },
  { 
    id: 11, name: "Air Fryer", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  },
  { 
    id: 12, name: "Vacuum Cleaner", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16a2 2 0 100-4 2 2 0 000 4zm0 0v-5m0 5a2 2 0 100 4 2 2 0 000-4zm0 0v5m8-10a2 2 0 100-4 2 2 0 000 4zm0 0v-5m0 5a2 2 0 100 4 2 2 0 000-4zm0 0v5" />
  },
  { 
    id: 13, name: "Knife Block Set", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  },
  { 
    id: 14, name: "Stand Mixer", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  },
  { 
    id: 15, name: "Slow Cooker", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  },
  { 
    id: 16, name: "Towels Set", link: "https://shopee.ph", maxCount: 2, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  },
  { 
    id: 17, name: "Baking Set", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
  },
  { 
    id: 18, name: "Luggage Set", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  },
  { 
    id: 19, name: "Throw Blankets", link: "https://shopee.ph", maxCount: 2, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  },
  { 
    id: 20, name: "Cutlery Set", link: "https://shopee.ph", maxCount: 2, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  },
  { 
    id: 21, name: "Rice Cooker", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  },
  { 
    id: 22, name: "Robot Vacuum", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  },
  { 
    id: 23, name: "Dutch Oven", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  },
  { 
    id: 24, name: "Water Purifier", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  },
  { 
    id: 25, name: "Picnic Basket", link: "https://shopee.ph", maxCount: 1, currentCount: 0, 
    iconFn: () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  }
];

interface CuratedRegistryScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CuratedRegistryScreen({ isOpen, onClose }: CuratedRegistryScreenProps) {
  const [gifts, setGifts] = useState<Gift[]>(defaultGifts);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
                      {gift.iconFn()}
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
