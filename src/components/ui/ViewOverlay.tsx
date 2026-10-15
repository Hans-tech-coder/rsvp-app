import type { KeyboardEvent } from 'react';
import { useSiteText } from '@/contexts/SiteTextContext';

// Hover "View" chip for slider photo cards (Gallery, Dress Code). Put it inside
// a card with `t-view-card` whose image wrapper has `t-view-media`; the motion
// lives in globals.css. Decorative only: the card itself is the click target.
export function ViewOverlay() {
  const text = useSiteText();
  return (
    <div aria-hidden="true" className="t-view-scrim absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-gradient-to-b from-surface/10 via-surface/30 to-surface/10">
      <span className="t-view-button relative flex items-center gap-2.5 px-4 py-2.5 border border-accent/60 bg-surface/60 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
        <span className="absolute inset-[3px] border border-accent/20"></span>
        <span className="h-px w-3 bg-accent/60"></span>
        <span className="font-heading text-[11px] uppercase tracking-[0.35em] pl-[0.35em] text-accent-light">{text.common.view}</span>
        <span className="h-px w-3 bg-accent/60"></span>
      </span>
    </div>
  );
}

// Spread on a `t-view-card` to make it a keyboard button: one Tab stop, Enter
// opens on keydown and Space on keyup, like a native <button>. Opening on
// keyup keeps the Space press from also hitting the lightbox's close button.
export function viewCardProps(label: string, onOpen: () => void) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); onOpen(); }
      else if (e.key === ' ') e.preventDefault();
    },
    onKeyUp: (e: KeyboardEvent) => {
      if (e.key === ' ') onOpen();
    },
  };
}
