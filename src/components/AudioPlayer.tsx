"use client";

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AudioPlayer() {
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactionDone = useRef(false);

  // Do not render anything if we are on an admin route
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set default volume to 50%
    }

    const handleInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Playback started successfully!
            setIsPlaying(true);
            
            // Now it's safe to remove the listeners because audio is playing
            ['click', 'touchend'].forEach(event => {
              document.removeEventListener(event, handleInteraction);
            });
          }).catch((error) => {
            // Playback failed (e.g. they just scrolled instead of tapping)
            // We DO NOT remove the listeners here so the next tap can try again
            console.log("Audio waiting for valid interaction...");
          });
        }
      }
    };

    // Listen only to explicit tap/click events, not scroll.
    // Do not use { once: true } so we can retry if the first tap fails.
    ['click', 'touchend'].forEach(event => {
      document.addEventListener(event, handleInteraction);
    });

    return () => {
      ['click', 'touchend'].forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
        interactionDone.current = true; // Ensure logic knows user interacted
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isAdmin) {
    return null;
  }

  return (
    <>
      <audio 
        id="wedding-bg-music"
        ref={audioRef} 
        src="/bg-music.mp3" 
        loop 
        preload="auto" 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-wedding-gold/20 backdrop-blur-md border border-wedding-gold/30 text-wedding-gold shadow-lg transition-all duration-300 hover:scale-110 hover:bg-wedding-gold/30 ${
          isPlaying ? 'animate-[pulse_4s_ease-in-out_infinite]' : ''
        }`}
        aria-label={isPlaying ? "Mute background music" : "Play background music"}
      >
        {isPlaying ? (
          <Volume2 className="w-6 h-6" />
        ) : (
          <VolumeX className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
