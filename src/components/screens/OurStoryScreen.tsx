"use client";

import React, { useState, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';
import { useWeddingContent } from '@/contexts/WeddingContentContext';

interface OurStoryScreenProps {
  onContinue: () => void;
  onLightboxChange?: (isOpen: boolean) => void;
}

export function OurStoryScreen({ onContinue, onLightboxChange }: OurStoryScreenProps) {
  const { content } = useWeddingContent();
  const [activeVideo, setActiveVideo] = useState<{link: string, coverImage: string} | null>(null);
  const [wasMusicPlaying, setWasMusicPlaying] = useState(false);

  useEffect(() => {
    if (activeVideo) {
      document.body.classList.add('video-modal-open');
    } else {
      document.body.classList.remove('video-modal-open');
    }
    return () => {
      document.body.classList.remove('video-modal-open');
    };
  }, [activeVideo]);

  const openVideo = (link: string, coverImage: string) => {
    const audioEl = document.getElementById('wedding-bg-music') as HTMLAudioElement;
    if (audioEl && !audioEl.paused) {
      setWasMusicPlaying(true);
      audioEl.pause();
    } else {
      setWasMusicPlaying(false);
    }
    setActiveVideo({ link, coverImage });
    if (onLightboxChange) {
      onLightboxChange(true);
    }
  };

  const closeVideo = () => {
    setActiveVideo(null);
    if (onLightboxChange) {
      onLightboxChange(false);
    }
    if (wasMusicPlaying) {
      const audioEl = document.getElementById('wedding-bg-music') as HTMLAudioElement;
      if (audioEl) {
        audioEl.play().catch(console.error);
      }
    }
  };
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const timelineItems = content.ourStory.items;

  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-5xl mx-auto relative z-10 w-full"
      >
        <motion.div variants={itemVariants} className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">{content.ourStory.subtitle}</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">{content.ourStory.title}</h2>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent mx-auto mt-6"></div>
          <p className="text-base font-cormorant italic text-wedding-goldlight/70 mt-3 max-w-md mx-auto">{content.ourStory.description}</p>
        </motion.div>

        <div className="relative border-l border-wedding-gold/20 ml-4 md:border-l-0 md:ml-0 md:flex md:flex-col md:items-center">
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-[1px] bg-wedding-gold/10"></div>

          {timelineItems.map((item, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className={`relative mb-16 md:mb-24 w-full md:w-1/2 pl-8 ${index % 2 === 0 ? 'md:pl-0 md:pr-16 md:mr-auto' : 'md:pl-16 md:ml-auto'}`}
            >
              <div className={`absolute -left-4 ${index % 2 === 0 ? 'md:left-auto md:-right-4' : 'md:-left-4'} top-0 w-8 h-8 rounded-full bg-wedding-dark border border-wedding-gold/40 flex items-center justify-center z-10`}>
                <div className="w-2.5 h-2.5 rounded-full bg-wedding-gold"></div>
              </div>
              <div className="bg-wedding-dark/40 p-6 md:p-8 rounded-lg shadow-sm border border-wedding-gold/10 hover:shadow-lg hover:border-wedding-gold/30 transition-all duration-500">
                <span className="text-xs uppercase tracking-widest text-wedding-gold/70 font-semibold block mb-1">{item.date}</span>
                <h3 className="text-2xl font-cinzel text-wedding-cream font-light mb-3">{item.title}</h3>
                <div className="relative w-full h-64 md:h-72 mb-6 rounded-xl overflow-hidden group shadow-lg">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="absolute inset-0 w-full h-full object-cover object-[center_25%] transform group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                  {/* Cinematic gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-wedding-dark/80 via-transparent to-wedding-dark/20 opacity-80 group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-wedding-gold/20 rounded-xl" />
                </div>
                <p className="text-sm font-cormorant text-wedding-cream leading-relaxed">{item.description}</p>
                {item.videoLink && (
                  <button
                    onClick={() => openVideo(item.videoLink!, item.image)}
                    data-suppress-audio-autoplay="true"
                    className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-wedding-gold/10 hover:bg-wedding-gold/20 border border-wedding-gold/30 rounded-full transition-all duration-300 group/btn w-fit"
                  >
                    <Play className="w-4 h-4 text-wedding-gold group-hover/btn:scale-110 transition-transform duration-300" fill="currentColor" />
                    <span className="text-xs uppercase tracking-widest text-wedding-gold font-medium">Watch Video</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
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

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 touch-none"
            onClick={closeVideo}
          >
            <button
              onClick={closeVideo}
              className="fixed top-4 right-4 md:top-6 md:right-6 text-wedding-cream/70 hover:text-wedding-cream transition-colors z-[110] bg-black/50 hover:bg-black/70 p-3 rounded-full backdrop-blur-sm"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              data-suppress-audio-autoplay="true"
              className="relative w-full max-w-4xl h-[85vh] rounded-xl overflow-hidden bg-black ring-1 ring-wedding-gold/20 shadow-2xl flex items-center justify-center"
            >
              {/* Blurred background image behind the video */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 blur-xl scale-110"
                style={{ backgroundImage: `url(${activeVideo.coverImage})` }}
              />
              <div className="absolute inset-0 z-0 bg-black/60" /> {/* Darken the blur to match cinematic theme */}

              <div className="relative z-10 w-full h-full">
                {(activeVideo.link.includes('youtube.com') || activeVideo.link.includes('youtu.be') || activeVideo.link.includes('vimeo.com')) ? (
                  <iframe
                    src={
                      activeVideo.link.includes('vimeo.com') 
                        ? `${activeVideo.link.replace('vimeo.com/', 'player.vimeo.com/video/').split('?')[0]}?transparent=0&badge=0&autopause=0&player_id=0`
                        : activeVideo.link.includes('watch?v=') 
                          ? activeVideo.link.replace('watch?v=', 'embed/') 
                          : activeVideo.link.includes('youtu.be/') 
                            ? activeVideo.link.replace('youtu.be/', 'youtube.com/embed/') 
                            : activeVideo.link
                    }
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    style={{ backgroundColor: '#000000' }}
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeVideo.link}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
