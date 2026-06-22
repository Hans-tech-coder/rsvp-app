"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';
import { OurStoryScreen } from '@/components/screens/OurStoryScreen';
import { EntourageScreen } from '@/components/screens/EntourageScreen';
import { DetailsScreen } from '@/components/screens/DetailsScreen';
import { DressCodeScreen } from '@/components/screens/DressCodeScreen';
import { GalleryScreen } from '@/components/screens/GalleryScreen';
import { FaqScreen } from '@/components/screens/FaqScreen';
import { RegistryScreen } from '@/components/screens/RegistryScreen';
import { RsvpCtaScreen } from '@/components/screens/RsvpCtaScreen';
import { RsvpScreen } from '@/components/screens/RsvpScreen';
import { EntranceScreen } from '@/components/screens/EntranceScreen';
import { CanvasMenu } from '@/components/layout/CanvasMenu';

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showEntranceScreen, setShowEntranceScreen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highestVisitedStep, setHighestVisitedStep] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [validatedInviteCode, setValidatedInviteCode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goToStep = (step: number) => {
    if (step === currentStep) return;
    
    if (step === 9 && !isUnlocked) {
      setShowEntranceScreen(true);
      return;
    }
    
    setCurrentStep(step);
    if (step > highestVisitedStep) {
      setHighestVisitedStep(step);
    }
  };

  const handleStartUnlock = () => {
    setIsUnlocked(true);
    setCurrentStep(9);
    if (9 > highestVisitedStep) {
      setHighestVisitedStep(9);
    }
  };

  const handleUnlock = (code: string) => {
    // The screen transition has already finished behind the overlay
    setValidatedInviteCode(code);
    setShowEntranceScreen(false);
  };

  const nextStep = () => {
    goToStep(currentStep + 1);
  };

  // Variants for a luxury cinematic transition
  const pageVariants: Variants = {
    initial: { 
      opacity: 0, 
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 1.8, 
        ease: [0.22, 1, 0.36, 1], // Custom slow out ease
        delay: 0.2
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.05,
      transition: { 
        duration: 1.5, 
        ease: [0.64, 0, 0.78, 0] // Custom slow in ease
      }
    }
  };

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-wedding-dark">
      
      {/* Global Effect removed to specific screens */}

      {mounted && (
        <>
          {/* Global Navigation Controls */}
          <AnimatePresence>
            {currentStep > 0 && !isLightboxOpen && (
              <motion.button 
                key="back-button"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, delay: 0.8 }}
                onClick={() => goToStep(currentStep - 1)} 
                className="absolute top-6 left-6 w-10 h-10 z-[40] rounded-full bg-wedding-dark/50 backdrop-blur-sm border border-wedding-cream/30 flex items-center justify-center text-wedding-cream hover:bg-wedding-burgundy hover:border-wedding-burgundy transition-all duration-300 pointer-events-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Hamburger Menu Button */}
          <AnimatePresence>
            {currentStep > 0 && !isLightboxOpen && (
              <motion.button 
                key="menu-button"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, delay: 1 }}
                onClick={() => setIsMenuOpen(true)} 
                className="absolute top-6 right-6 w-10 h-10 z-[40] rounded-full bg-wedding-dark/50 backdrop-blur-sm border border-wedding-cream/30 flex items-center justify-center text-wedding-cream hover:bg-wedding-burgundy hover:border-wedding-burgundy transition-all duration-300 pointer-events-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Screens with Framer Motion */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="welcome-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <WelcomeScreen onContinue={nextStep} />
                </motion.div>
              )}
              
              {currentStep === 1 && (
                <motion.div
                  key="our-story-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <OurStoryScreen onContinue={nextStep} />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="entourage-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <EntourageScreen onContinue={nextStep} />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="details-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <DetailsScreen onContinue={nextStep} />
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="dresscode-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <DressCodeScreen onContinue={nextStep} />
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="gallery-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <GalleryScreen 
                    onContinue={nextStep} 
                    onLightboxChange={setIsLightboxOpen} 
                  />
                </motion.div>
              )}

              {currentStep === 6 && (
                <motion.div
                  key="faq-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <FaqScreen onContinue={nextStep} />
                </motion.div>
              )}

              {currentStep === 7 && (
                <motion.div
                  key="registry-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <RegistryScreen onContinue={nextStep} />
                </motion.div>
              )}

              {currentStep === 8 && (
                <motion.div
                  key="rsvp-cta-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <RsvpCtaScreen onContinue={nextStep} />
                </motion.div>
              )}

              {currentStep === 9 && (
                <motion.div
                  key="rsvp-screen"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  <RsvpScreen 
                    inviteCode={validatedInviteCode || 'dev-mode'} 
                    onContinue={() => goToStep(7)} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Menu */}
          <CanvasMenu 
            isOpen={isMenuOpen} 
            onClose={() => setIsMenuOpen(false)} 
            onNavigate={goToStep}
            highestVisitedStep={highestVisitedStep}
            currentStep={currentStep}
          />

          {/* Password Lock for RSVP */}
          <AnimatePresence>
            {showEntranceScreen && (
              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
                 className="fixed inset-0 z-[100] bg-wedding-dark"
              >
                 <EntranceScreen onUnlock={handleUnlock} onStartUnlock={handleStartUnlock} />
                 
                 {/* Back button to close Entrance Screen without unlocking */}
                 <button 
                   onClick={() => setShowEntranceScreen(false)}
                   className="absolute top-6 left-6 z-[110] w-10 h-10 rounded-full bg-wedding-dark/50 backdrop-blur-sm border border-wedding-cream/30 flex items-center justify-center text-wedding-cream hover:text-wedding-burgundy hover:border-wedding-burgundy transition-all duration-300"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                   </svg>
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}
