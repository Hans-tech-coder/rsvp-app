"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Onboarding hint for the welcome 3D scene: "move your mouse" on desktop, "tilt
// your phone" on phones. Appears after the intro and leaves after a few seconds.
// If the guest has not tried it, it comes back (up to 3 times) so a guest who
// missed it still notices. Once they try it, or after the last showing, it stays
// away for the rest of the visit (also when they come back to the Welcome), and
// shows again on the next page load.
//
// iOS only sends tilt after a permission prompt that must come from a tap, so there
// the hint is a button that asks for it.

type Mode = 'mouse' | 'tilt' | 'tilt-ios';

// Module scope: survives the Welcome unmounting and remounting, resets on reload
let finishedThisLoad = false;
const FIRST_SHOW_MS = 2600; // after the names and date have revealed
const VISIBLE_MS = { mouse: 5000, tilt: 5000, 'tilt-ios': 7000 };
const GAP_MS = 9000; // hidden time before it comes back
const MAX_SHOWS = 3;
// Tries only count once the hint has been up this long, so a stray mouse move
// as it appears does not whisk it away before it is read
const READ_MS = 1500;
const COPY = {
  mouse: { title: 'Move your mouse', sub: 'to bring the scene to life' },
  tilt: { title: 'Tilt your phone', sub: 'to bring the scene to life' },
  'tilt-ios': { title: 'Tap to enable motion', sub: 'then tilt your phone' },
};

type OrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

function detectMode(): Mode | null {
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return 'mouse';
  if (!window.matchMedia('(pointer: coarse)').matches || !('DeviceOrientationEvent' in window)) return null;
  // Newer Chrome also has requestPermission (it grants at once), so check for iOS itself
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS && typeof (DeviceOrientationEvent as OrientationWithPermission).requestPermission === 'function' ? 'tilt-ios' : 'tilt';
}

export function MotionHint() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    let shows = 0;
    let shownAt = 0;
    let isUp = false;
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let current: Mode | null = null;

    const schedule = (fn: () => void, ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
    const hide = () => {
      isUp = false;
      setVisible(false);
      if (finished) return;
      if (shows >= MAX_SHOWS) {
        finished = true;
        finishedThisLoad = true;
      } else {
        schedule(show, GAP_MS);
      }
    };
    const show = () => {
      if (finished) return;
      shows++;
      isUp = true;
      shownAt = performance.now();
      setVisible(true);
      schedule(hide, VISIBLE_MS[current!]);
    };
    // The guest tried it: let them see the effect for a moment, then stop for good
    const tried = () => {
      if (finished || !isUp || performance.now() - shownAt < READ_MS) return;
      finished = true;
      finishedThisLoad = true;
      schedule(() => {
        isUp = false;
        setVisible(false);
        setDone(true);
      }, 1200);
    };

    let travelled = 0;
    let lastX: number | null = null;
    let lastY = 0;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (lastX !== null && isUp) travelled += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      if (travelled > 300) tried();
    };
    let startGamma: number | null = null;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      if (!isUp) {
        startGamma = e.gamma;
        return;
      }
      if (startGamma === null) startGamma = e.gamma;
      if (Math.abs(e.gamma - startGamma) > 10) tried();
    };
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('deviceorientation', onTilt);

    schedule(() => {
      if (finishedThisLoad) return;
      current = detectMode();
      if (!current) return;
      setMode(current);
      show();
    }, FIRST_SHOW_MS);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
    };
  }, [done]);

  const enableTilt = async () => {
    finishedThisLoad = true;
    try {
      await (DeviceOrientationEvent as OrientationWithPermission).requestPermission?.();
    } catch {
      // Denied or unavailable: the scene keeps its idle drift
    }
    setVisible(false);
    setDone(true);
  };

  const copy = mode ? COPY[mode] : null;
  const isButton = mode === 'tilt-ios';

  return (
    // Sits just above the countdown (the parent is the countdown group, position: relative)
    <div className="absolute inset-x-0 bottom-full mb-4 [@media(max-height:700px)]:mb-1.5 z-20 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {visible && copy && (
          <motion.div
            key="motion-hint"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <HintBody
              as={isButton ? 'button' : 'div'}
              onClick={isButton ? enableTilt : undefined}
              title={copy.title}
              sub={copy.sub}
              icon={mode === 'mouse' ? <MouseIcon /> : <PhoneIcon />}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HintBody({ as, onClick, title, sub, icon }: {
  as: 'button' | 'div';
  onClick?: () => void;
  title: string;
  sub: string;
  icon: React.ReactNode;
}) {
  const Tag = as;
  return (
    <Tag
      {...(as === 'button' ? { type: 'button' as const, onClick } : {})}
      className={`relative flex items-center gap-4 pl-4 pr-6 py-3 [@media(max-height:700px)]:py-1.5 [@media(max-height:700px)]:gap-3 border border-wedding-gold/50 bg-wedding-dark/80 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.45)] text-left ${
        as === 'button' ? 'pointer-events-auto cursor-pointer active:scale-[0.98] transition-transform' : ''
      }`}
    >
      <span aria-hidden="true" className="absolute inset-[3px] border border-wedding-gold/20 pointer-events-none"></span>
      <span aria-hidden="true" className="flex h-9 w-9 [@media(max-height:700px)]:h-6 [@media(max-height:700px)]:w-6 items-center justify-center text-wedding-goldlight">{icon}</span>
      <span className="flex flex-col">
        <span className="font-cinzel text-[11px] uppercase tracking-[0.3em] text-wedding-goldlight">{title}</span>
        <span className="[@media(max-height:700px)]:hidden font-cormorant italic text-sm text-wedding-cream/80 tracking-wide">{sub}</span>
      </span>
    </Tag>
  );
}

function MouseIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {/* Faint arrows either side, the mouse sways between them */}
      <path d="M4 18l3-3M4 18l3 3M32 18l-3-3M32 18l-3 3" opacity="0.5" />
      <g className="t-hint-sway">
        <rect x="12.5" y="9" width="11" height="18" rx="5.5" />
        <path d="M18 12.5v3" />
      </g>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {/* Arc hints the rocking motion; the phone tilts under it */}
      <path d="M8 9a14 14 0 0 1 20 0" opacity="0.5" />
      <g className="t-hint-tilt">
        <rect x="13" y="11" width="10" height="18" rx="2" />
        <path d="M16.5 26h3" />
      </g>
    </svg>
  );
}
