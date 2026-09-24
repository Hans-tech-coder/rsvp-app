"use client";

import React from 'react';
import Image from 'next/image';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { motion, AnimatePresence } from 'motion/react';
import { RevealImage } from '@/components/ui/RevealImage';

interface CanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (stepIndex: number) => void;
  highestVisitedStep: number;
  currentStep: number;
}

export function CanvasMenu({ isOpen, onClose, onNavigate, highestVisitedStep, currentStep }: CanvasMenuProps) {
  const { content } = useWeddingContent();
  const logoUrl = content.global.logo;

  const menuItems = [
    { label: "Welcome", step: 0 },
    { label: "Our Story", step: 1 },
    { label: "Entourage", step: 2 },
    { label: "Details", step: 3 },
    { label: "Dress Code", step: 4 },
    { label: "Gallery", step: 5 },
    { label: "FAQs", step: 6 },
    { label: "Registry", step: 7 },
    { label: "Join Our Day", step: 8 },
    { label: "RSVP", step: 9 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] bg-wedding-dark/95 flex justify-center items-center pointer-events-auto"
        >
          <button 
            onClick={onClose} 
            aria-label="Close menu"
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-transparent border border-wedding-cream/30 flex items-center justify-center text-wedding-cream hover:text-wedding-burgundy hover:border-wedding-burgundy transition-all duration-300 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center w-full max-w-md px-6 relative"
          >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-wedding-burgundy/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="mb-10 flex justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-wedding-gold/10 via-wedding-burgundy/20 to-transparent blur-[30px] rounded-full animate-pulse-slow"></div>
          <div className="w-32 h-32 flex items-center justify-center animate-float relative z-10">
            <RevealImage 
              src={logoUrl} 
              alt={`${content.global.groomName} & ${content.global.brideName} Logo`} 
              className="w-full h-full object-contain transition-transform duration-700 hover:scale-110"
              wrapperClassName="w-full h-full flex items-center justify-center"
              style={{ 
                filter: 'drop-shadow(0px 15px 25px rgba(0,0,0,0.7)) drop-shadow(0px 0px 20px rgba(197,160,89,0.5)) drop-shadow(-1px -1px 2px rgba(255,255,255,0.3)) drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
              }}
            />
          </div>
        </div>

        <div className="w-12 h-[1px] bg-wedding-cream/20 mx-auto mb-8"></div>

        <nav className="flex flex-col gap-6 font-cinzel tracking-[0.2em] uppercase text-sm h-[40vh] overflow-y-auto no-scrollbar py-4 relative z-10">
          {menuItems.map((item, idx) => {
            const isVisited = item.step <= highestVisitedStep;
            const isActive = item.step === currentStep;
            
            return (
              <button
                key={idx}
                disabled={!isVisited}
                onClick={() => {
                  if (isVisited) {
                    onNavigate(item.step);
                    onClose();
                  }
                }}
                className={`transition-all duration-300 relative group flex items-center justify-center gap-3
                  ${isVisited ? 'hover:text-wedding-burgundylight hover:drop-shadow-[0_0_8px_rgba(252,250,246,0.6)] cursor-pointer text-wedding-cream' : 'opacity-40 cursor-not-allowed text-wedding-cream/50'}
                  ${isActive ? 'text-wedding-burgundylight drop-shadow-[0_0_8px_rgba(252,250,246,0.4)]' : ''}
                `}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-wedding-burgundylight shadow-[0_0_8px_rgba(128,0,32,0.8)] absolute -left-4"></span>
                )}
                <span className="relative z-10">{item.label}</span>
                {isVisited && (
                  <>
                    <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-wedding-burgundylight transition-all duration-300 group-hover:w-1/2 group-hover:-translate-x-1/2"></span>
                    <span className="absolute -bottom-2 right-1/2 w-0 h-[1px] bg-wedding-burgundylight transition-all duration-300 group-hover:w-1/2 group-hover:translate-x-1/2"></span>
                  </>
                )}
              </button>
            );
          })}
        </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
