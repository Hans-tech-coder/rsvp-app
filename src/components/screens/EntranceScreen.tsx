"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { InkRevealCanvas } from '@/components/ui/InkRevealCanvas';

interface EntranceScreenProps {
  onUnlock: () => void;
  onStartUnlock?: () => void;
}

export function EntranceScreen({ onUnlock, onStartUnlock }: EntranceScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [particles, setParticles] = useState<{ id: number; left: string; delay: string; duration: string; size: string }[]>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 10 + 10}s`,
      size: `${Math.random() * 4 + 1}px`
    }));
    setParticles(newParticles);
  }, []);

  const handleUnlock = () => {
    if (password.toUpperCase() === 'FOREVER2026') {
      setError(false);
      setIsUnlocking(true);
      if (onStartUnlock) onStartUnlock();
      setTimeout(() => {
        onUnlock();
      }, 3000);
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center bg-wedding-dark overflow-hidden">
      <motion.div 
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1920')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-wedding-dark/80 via-wedding-dark/30 to-transparent z-0"></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-up {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            50% { opacity: 0.4; }
            100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .shimmer-sweep {
            position: absolute;
            top: 0;
            left: -150%;
            width: 150%;
            height: 100%;
            background: linear-gradient(to right, transparent 0%, rgba(252, 250, 246, 0.02) 40%, rgba(252, 250, 246, 0.1) 50%, rgba(252, 250, 246, 0.02) 60%, transparent 100%);
            transform: skewX(-30deg);
        }
        .group:hover .shimmer-sweep {
            animation: sweep 4s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }
        @keyframes sweep {
            0% { left: -150%; }
            60% { left: 150%; }
            100% { left: 150%; }
        }
      `}} />

      {particles.map((p) => (
        <div 
          key={p.id}
          className="absolute rounded-full bg-[#F4EBE8] opacity-30 pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            animation: `float-up ${p.duration} linear infinite`,
            animationDelay: p.delay
          }}
        />
      ))}

      <InkRevealCanvas />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-20 w-[95%] max-w-lg p-10 md:p-14 bg-wedding-dark/80 backdrop-blur-xl rounded-2xl border-t border-l border-wedding-cream/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(128,0,32,0.15)] group"
      >
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="shimmer-sweep opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        </div>

        <div className="mb-10 flex justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-wedding-gold/20 via-wedding-burgundy/30 to-transparent blur-[40px] rounded-full animate-pulse-slow"></div>
          <div className="w-36 h-36 flex items-center justify-center animate-float relative z-10">
            <Image 
              src="/hansandczay.svg" 
              alt="Hans and Czay Logo" 
              width={144} 
              height={144} 
              className="w-full h-full object-contain transition-all duration-700 hover:scale-105"
              style={{ 
                filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.8)) drop-shadow(0px 0px 25px rgba(197,160,89,0.6)) drop-shadow(-1px -1px 3px rgba(255,255,255,0.4)) drop-shadow(2px 2px 4px rgba(0,0,0,0.9))'
              }}
            />
          </div>
        </div>

        <div className="text-center">
          <span className="inline-block text-[10px] uppercase tracking-[0.4em] text-wedding-gold font-medium mb-3 border-b border-wedding-gold/30 pb-1">The Royal Invitation</span>
          <h1 className="text-4xl md:text-5xl font-cinzel text-wedding-goldlight font-light tracking-widest mb-4 drop-shadow-md">Hans & Czay</h1>
          <p className="text-sm font-cormorant text-wedding-cream/90 italic tracking-widest mb-10 flex items-center justify-center gap-2">
            <span className="w-4 h-[1px] bg-wedding-gold/50"></span>
            December 20, 2026 • Paniqui, Tarlac
            <span className="w-4 h-[1px] bg-wedding-gold/50"></span>
          </p>
        </div>

        <div className="max-w-xs mx-auto relative z-20 min-h-[220px] flex flex-col justify-center">
          {isUnlocking ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center justify-center w-full"
            >
              <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 border-t-2 border-r-2 border-wedding-gold/80 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-2 border-b-2 border-l-2 border-wedding-burgundylight/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2.5s' }}></div>
                <div className="absolute inset-4 border-t-2 border-l-2 border-wedding-cream/40 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-2.5 h-2.5 bg-wedding-gold rounded-full animate-pulse shadow-[0_0_10px_rgba(197,160,89,0.8)]"></div>
                </div>
              </div>
              <p className="text-wedding-gold tracking-[0.4em] text-xs uppercase animate-pulse drop-shadow-md">Access Granted</p>
              <p className="text-wedding-cream/60 tracking-[0.2em] text-[9px] uppercase mt-3">Preparing your royal invitation...</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 1 }}
              className="w-full"
            >
              <p className="text-[11px] text-wedding-cream/70 tracking-widest mb-4 text-center uppercase">Awaiting your royal key</p>
              <div className="relative mb-8 group/input">
                <div className="absolute -inset-1 bg-gradient-to-r from-wedding-gold/0 via-wedding-gold/20 to-wedding-gold/0 rounded-lg blur opacity-0 group-focus-within/input:opacity-100 transition duration-500"></div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ENTER CODE" 
                  className="relative w-full bg-wedding-dark/60 border border-wedding-gold/30 rounded-sm text-wedding-gold tracking-[0.4em] text-center placeholder:tracking-widest placeholder:text-wedding-gold/30 py-4 px-4 focus:outline-none focus:border-wedding-gold focus:bg-wedding-dark/80 text-sm font-bold uppercase transition-all duration-300 shadow-inner" 
                />
                <div className={`absolute -bottom-6 left-0 right-0 text-[10px] text-red-400 tracking-wider text-center transition-opacity duration-300 font-medium ${error ? 'opacity-100' : 'opacity-0'}`}>
                  Incorrect access code. Please try again.
                </div>
              </div>
              
              <button onClick={handleUnlock} className="relative w-full overflow-hidden bg-wedding-burgundy/90 border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy hover:border-wedding-gold hover:text-wedding-goldlight px-6 py-4 text-xs tracking-[0.3em] font-medium transition-all duration-500 uppercase rounded-sm group/btn shadow-lg hover:shadow-wedding-gold/20">
                <span className="relative z-10">Confirm Attendance</span>
                <div className="absolute inset-0 h-full w-0 bg-white/10 group-hover/btn:w-full transition-all duration-500 ease-out z-0"></div>
              </button>
              
              <div className="mt-8 text-center animate-pulse-slow">
                <p className="text-[9px] text-wedding-cream/50 tracking-[0.2em] border border-wedding-cream/10 rounded-full px-4 py-1.5 inline-block bg-wedding-dark/30">HINT: USE CODE "FOREVER2026"</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
