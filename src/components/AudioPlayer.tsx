"use client";

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactionDone = useRef(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set default volume to 50%
    }

    const handleInteraction = () => {
      if (!interactionDone.current && audioRef.current) {
        interactionDone.current = true;
        
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error("Audio playback failed:", error);
          // Kung sakaling ma-block pa rin, irereset natin para pwede i-click sa next interaction
          interactionDone.current = false;
        });
        
        // Remove listeners
        ['click', 'touchstart', 'touchend', 'scroll'].forEach(event => {
          document.removeEventListener(event, handleInteraction);
        });
      }
    };

    // Add listeners for different types of user interactions
    ['click', 'touchstart', 'touchend', 'scroll'].forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      ['click', 'touchstart', 'touchend', 'scroll'].forEach(event => {
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

  return (
    <>
      <audio ref={audioRef} src="/bg-music.mp3" loop preload="auto" />
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
