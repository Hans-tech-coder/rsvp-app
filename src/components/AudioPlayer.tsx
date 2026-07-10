"use client";

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element only on the client
    audioRef.current = new Audio('/bg-music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5; // Set default volume to 50%

    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Listen for the first user interaction to start playing
    const handleInteraction = () => {
      if (!hasInteracted && audioRef.current) {
        setHasInteracted(true);
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error("Audio playback failed:", error);
        });
        
        // Remove listeners after first interaction
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [hasInteracted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
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
  );
}
