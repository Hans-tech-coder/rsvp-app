"use client";

import React, { useState, useEffect } from 'react';
import { motion , Variants } from 'framer-motion';
import { FallingPetals } from '@/components/effects/FallingPetals';
import weddingContent from '@/data/wedding-content.json';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const targetDate = new Date(weddingContent.welcomeScreen.targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.5,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <header className="absolute inset-0 w-full h-full overflow-hidden bg-wedding-dark text-center">
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <FallingPetals />
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay" 
          style={{ backgroundImage: `url('${weddingContent.welcomeScreen.backgroundImage}')` }}
        ></motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-wedding-dark/60 via-wedding-dark/40 to-wedding-dark/80"></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col"
      >
        <div className="flex-1 flex flex-col justify-center lg:justify-between items-center min-h-full w-full py-16 lg:py-0 gap-10 lg:gap-0">
        <motion.div variants={itemVariants} className="lg:pt-20 w-full">
          <p className="text-[11px] uppercase tracking-[0.4em] text-wedding-cream/80 font-medium">{weddingContent.welcomeScreen.subtitle}</p>
          <div className="w-12 h-[1px] bg-wedding-cream/40 mx-auto mt-3"></div>
        </motion.div>

        <motion.div variants={itemVariants} className="px-4 w-full max-w-4xl lg:py-12">
          <span className="text-sm font-cormorant italic text-wedding-cream/90 tracking-widest block mb-4">{weddingContent.welcomeScreen.topText}</span>
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-cinzel text-wedding-cream font-light tracking-widest leading-tight drop-shadow-lg whitespace-nowrap">
            {weddingContent.global.groomName} <span className="text-wedding-gold italic font-serif text-3xl sm:text-4xl md:text-6xl font-light">&</span> {weddingContent.global.brideName}
          </h2>
          <div className="w-24 h-[1px] bg-wedding-gold/40 mx-auto my-8"></div>
          <p className="text-xs uppercase tracking-[0.3em] text-wedding-cream/90 mb-3">{weddingContent.welcomeScreen.bottomText1}</p>
          <p className="text-lg md:text-2xl font-cormorant italic text-wedding-cream tracking-wider drop-shadow-md">{weddingContent.welcomeScreen.bottomText2}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:pb-8 w-full max-w-3xl px-4 flex flex-col items-center">
          <div className="grid grid-cols-4 gap-2 md:gap-8 bg-wedding-dark/50 backdrop-blur-md px-4 md:px-6 py-4 rounded-xl border border-wedding-gold/20 w-full max-w-md mb-6 shadow-xl">
            <div className="text-center">
              <span className="block text-2xl md:text-3xl font-cinzel text-wedding-cream drop-shadow-md">{mounted ? timeLeft.days : '00'}</span>
              <span className="text-[9px] uppercase tracking-widest text-wedding-cream/70">Days</span>
            </div>
            <div className="text-center border-l border-wedding-gold/20">
              <span className="block text-2xl md:text-3xl font-cinzel text-wedding-cream drop-shadow-md">{mounted ? timeLeft.hours : '00'}</span>
              <span className="text-[9px] uppercase tracking-widest text-wedding-cream/70">Hours</span>
            </div>
            <div className="text-center border-l border-wedding-gold/20">
              <span className="block text-2xl md:text-3xl font-cinzel text-wedding-cream drop-shadow-md">{mounted ? timeLeft.minutes : '00'}</span>
              <span className="text-[9px] uppercase tracking-widest text-wedding-cream/70">Min</span>
            </div>
            <div className="text-center border-l border-wedding-gold/20">
              <span className="block text-2xl md:text-3xl font-cinzel text-wedding-cream drop-shadow-md">{mounted ? timeLeft.seconds : '00'}</span>
              <span className="text-[9px] uppercase tracking-widest text-wedding-cream/70">Sec</span>
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-wedding-cream/90 mb-4">Paniqui, Tarlac</p>
          
          <div className="w-full flex justify-center mt-2 relative z-20">
            <button onClick={onContinue} className="group flex flex-col items-center justify-center space-y-3 cursor-pointer focus:outline-none animate-bounce">
              <span className="text-[10px] uppercase tracking-[0.3em] text-wedding-cream/90 group-hover:text-wedding-gold transition-colors duration-300 drop-shadow-md">Continue</span>
              <div className="w-10 h-10 rounded-full border border-wedding-cream/50 flex items-center justify-center transition-all duration-300 group-hover:bg-wedding-gold/10 group-hover:border-wedding-gold shadow-lg bg-wedding-dark/30 backdrop-blur-sm">
                <svg className="w-4 h-4 text-wedding-cream group-hover:text-wedding-gold transition-transform duration-300 group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              </div>
            </button>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </header>
  );
}
