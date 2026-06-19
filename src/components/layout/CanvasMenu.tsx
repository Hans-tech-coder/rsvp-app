"use client";

import React from 'react';
import Image from 'next/image';

interface CanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (stepIndex: number) => void;
  highestVisitedStep: number;
  currentStep: number;
}

export function CanvasMenu({ isOpen, onClose, onNavigate, highestVisitedStep, currentStep }: CanvasMenuProps) {
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
    <div 
      className={`fixed inset-0 z-[60] bg-wedding-dark/95 backdrop-blur-md transition-all duration-500 flex justify-center items-center ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-transparent border border-wedding-cream/30 flex items-center justify-center text-wedding-cream hover:text-wedding-burgundy hover:border-wedding-burgundy transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <div className="text-center w-full max-w-md px-6 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-wedding-burgundy/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="mb-10 flex justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-wedding-gold/10 via-wedding-burgundy/20 to-transparent blur-[30px] rounded-full animate-pulse-slow"></div>
          <div className="w-32 h-32 flex items-center justify-center animate-float relative z-10">
            <Image 
              src="/hansandczay.svg" 
              alt="Hans and Czay Logo" 
              width={128} 
              height={128} 
              className="w-full h-full object-contain transition-transform duration-700 hover:scale-110"
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
      </div>
    </div>
  );
}
