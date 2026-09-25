"use client";

import { useState, useEffect, useRef } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';

const DEFAULT_VOLUME = 0.5;
// Onboarding hint: shown once per page load, a moment after the music first
// starts (the first tap also swaps the screen), then leaves on its own
const HINT_DELAY_MS = 1800;
const HINT_VISIBLE_MS = 7000;
// Touch has no hover, so a tap opens the slider and it closes after this idle time
const PANEL_IDLE_MS = 3500;
const HINT_COPY = {
  mouse: 'Click to mute · hover for volume',
  touch: 'Tap to mute or change the volume',
};

export function AudioPlayer() {
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintMode, setHintMode] = useState<'mouse' | 'touch'>('touch');
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const interactionDone = useRef(false);
  // Pointer type of the guest's latest press ('mouse', 'touch', 'pen')
  const lastPointer = useRef<string | null>(null);
  const hintDone = useRef(false);
  const panelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // iOS ignores audio.volume (it is always 1), so there the volume goes
  // through a Web Audio gain node, created on the first slider touch
  const nativeVolume = useRef(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Do not render anything if we are on an admin route
  const isAdmin = pathname?.startsWith('/admin');

  // Hover only exists for a mouse. Trust the input the guest actually used (the
  // tap or click that started the music) over the media query, which some
  // phones get wrong (e.g. Samsung models that report hover for their stylus)
  const usesMouse = () =>
    lastPointer.current
      ? lastPointer.current === 'mouse'
      : window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  useEffect(() => {
    if (isAdmin) return;
    if (audioRef.current) {
      audioRef.current.volume = DEFAULT_VOLUME; // Set default volume to 50%
      nativeVolume.current = Math.abs(audioRef.current.volume - DEFAULT_VOLUME) < 0.01;
    }

    const handleInteraction = (e: Event) => {
      // Check if the click originated from an element that wants to suppress autoplay
      const target = e.target as HTMLElement;
      if (target.closest('[data-suppress-audio-autoplay="true"]')) {
        return; // Ignore this interaction for background music
      }

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
    const trackPointer = (e: PointerEvent) => {
      lastPointer.current = e.pointerType;
    };
    document.addEventListener('pointerdown', trackPointer, true);

    return () => {
      ['click', 'touchend'].forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      document.removeEventListener('pointerdown', trackPointer, true);
    };
  }, []);

  // Show the hint once, the first time the music plays
  useEffect(() => {
    if (!isPlaying || hintDone.current) return;
    hintDone.current = true;
    const showTimer = setTimeout(() => {
      setHintMode(usesMouse() ? 'mouse' : 'touch');
      setHintVisible(true);
    }, HINT_DELAY_MS);
    const hideTimer = setTimeout(() => setHintVisible(false), HINT_DELAY_MS + HINT_VISIBLE_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isPlaying]);

  // A touch outside the controls closes the slider
  useEffect(() => {
    if (!panelOpen) return;
    const onOutside = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      if (panelTimer.current) clearTimeout(panelTimer.current);
      setPanelOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [panelOpen]);

  useEffect(() => () => {
    if (panelTimer.current) clearTimeout(panelTimer.current);
  }, []);

  const clearPanelTimer = () => {
    if (panelTimer.current) clearTimeout(panelTimer.current);
    panelTimer.current = null;
  };
  const openPanel = (closeAfterMs?: number) => {
    clearPanelTimer();
    setPanelOpen(true);
    if (closeAfterMs) panelTimer.current = setTimeout(() => setPanelOpen(false), closeAfterMs);
  };
  const closePanel = (afterMs = 0) => {
    clearPanelTimer();
    if (afterMs) panelTimer.current = setTimeout(() => setPanelOpen(false), afterMs);
    else setPanelOpen(false);
  };
  // Any use of the controls means the guest found them
  const dismissHint = () => setHintVisible(false);

  // Must run inside a tap or key press: iOS only starts an AudioContext then
  const ensureGain = (level: number) => {
    const audio = audioRef.current;
    if (nativeVolume.current || !audio) return;
    if (!ctxRef.current) {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      // Without this, Web Audio on iOS 17+ goes quiet when the ringer is off
      if (nav.audioSession) nav.audioSession.type = 'playback';
      if (typeof window.AudioContext !== 'function') return;
      const ctx = new window.AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = level;
      ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      ctxRef.current = ctx;
      gainRef.current = gain;
    }
    if (ctxRef.current.state !== 'running') ctxRef.current.resume().catch(() => {});
  };

  const applyVolume = (level: number) => {
    setVolume(level);
    if (gainRef.current) gainRef.current.gain.value = level;
    else if (audioRef.current) audioRef.current.volume = level;
  };

  const changeVolume = (level: number) => {
    applyVolume(level);
    const audio = audioRef.current;
    if (!audio) return;
    // The slider at zero is the same as muting; raising it plays again
    if (level === 0 && !audio.paused) audio.pause();
    else if (level > 0 && audio.paused) audio.play().catch(console.error);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (volume === 0) applyVolume(DEFAULT_VOLUME);
        audioRef.current.play().catch(console.error);
        interactionDone.current = true; // Ensure logic knows user interacted
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isAdmin) {
    return null;
  }

  const VolumeIcon = !isPlaying ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const percent = Math.round(volume * 100);

  return (
    <>
      <style>{`
        body.video-modal-open #audio-controls {
          display: none !important;
        }
      `}</style>
      <audio
        id="wedding-bg-music"
        ref={audioRef}
        src="/bg-music.mp3"
        loop
        preload="none"
        onPlay={() => {
          setIsPlaying(true);
          // Show the level the guest really hears until the gain node takes over
          if (!nativeVolume.current && !gainRef.current) setVolume(1);
          // iOS suspends the AudioContext when the tab is backgrounded
          if (ctxRef.current?.state === 'suspended') ctxRef.current.resume().catch(() => {});
        }}
        onPause={() => setIsPlaying(false)}
      />
      <div
        id="audio-controls"
        ref={wrapRef}
        className="fixed bottom-6 right-6 z-50"
        onPointerDown={dismissHint}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') openPanel();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') closePanel(400);
        }}
        onFocus={(e) => {
          dismissHint();
          if (e.target.matches(':focus-visible')) openPanel();
        }}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) closePanel();
        }}
      >
        <AnimatePresence>
          {hintVisible && (
            <motion.div
              key="music-hint"
              role="status"
              aria-live="polite"
              className="absolute bottom-full right-0 mb-4 w-max max-w-[calc(100vw-3rem)] pointer-events-none"
              style={{ transformOrigin: 'bottom right' }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
              transition={{ duration: reduceMotion ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative flex flex-col gap-0.5 pl-4 pr-5 py-2.5 border border-wedding-gold/50 bg-wedding-dark/85 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                <span aria-hidden="true" className="absolute inset-[3px] border border-wedding-gold/20 pointer-events-none"></span>
                <span className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-wedding-goldlight">Music is playing</span>
                <span className="font-cormorant italic text-sm text-wedding-cream/85 tracking-wide">{HINT_COPY[hintMode]}</span>
                {/* Caret pointing down at the button's centre */}
                <span aria-hidden="true" className="absolute -bottom-[6px] right-[19px] h-2.5 w-2.5 rotate-45 border-r border-b border-wedding-gold/50 bg-wedding-dark"></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          id="audio-toggle-btn"
          type="button"
          onClick={(e) => {
            dismissHint();
            togglePlay();
            // Touch has no hover: open the slider with the tap. A mouse click has
            // detail > 0; a keyboard press (detail 0) keeps the focus-opened panel
            if (e.detail > 0 && !usesMouse()) openPanel(PANEL_IDLE_MS);
          }}
          className="relative z-10 block p-3 rounded-full bg-wedding-gold/20 backdrop-blur-md border border-wedding-gold/30 text-wedding-gold shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-wedding-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wedding-gold"
          aria-label={isPlaying ? "Mute background music" : "Play background music"}
          aria-controls="audio-volume-panel"
          aria-expanded={panelOpen}
        >
          {/* Gold ring that ripples out while the hint points at the button */}
          {hintVisible && (
            <span aria-hidden="true" className="absolute inset-0 rounded-full border border-wedding-gold motion-safe:animate-ping pointer-events-none"></span>
          )}
          <span className={`block ${isPlaying ? 'motion-safe:animate-[pulse_4s_ease-in-out_infinite]' : ''}`}>
            <VolumeIcon className="w-6 h-6" />
          </span>
        </button>

        <div
          id="audio-volume-panel"
          data-open={panelOpen}
          className="t-vol-panel absolute inset-y-0 right-0"
        >
          <div className="t-vol-pill h-full flex items-center gap-3 pl-5 pr-16 rounded-full bg-wedding-dark/90 border border-wedding-gold/30">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={percent}
              aria-label="Music volume"
              aria-valuetext={`${percent}%`}
              tabIndex={panelOpen ? 0 : -1}
              className="t-vol-range w-24 sm:w-32"
              style={{ '--vol': `${percent}%` } as React.CSSProperties}
              onPointerDown={() => {
                ensureGain(volume);
                clearPanelTimer();
              }}
              onPointerUp={(e) => {
                if (e.pointerType !== 'mouse') openPanel(PANEL_IDLE_MS);
              }}
              onKeyDown={() => ensureGain(volume)}
              onChange={(e) => changeVolume(Number(e.target.value) / 100)}
            />
            <span aria-hidden="true" className="w-8 text-right font-inter text-[11px] tabular-nums text-wedding-goldlight/90">{percent}%</span>
          </div>
        </div>
      </div>
    </>
  );
}
