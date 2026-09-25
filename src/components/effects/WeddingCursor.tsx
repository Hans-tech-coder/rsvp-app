"use client";

import { useEffect, useRef, useState } from 'react';

// Guest-site cursor: a solitaire wedding ring (hotspot = diamond tip), a gold
// stardust trail, a bouncy tilt over anything clickable and a sparkle burst on
// click. Mouse/trackpad only and never with reduced motion; everyone else keeps
// the native cursor. Hover/text-field rules: `.t-cursor-*` in globals.css.

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Hovering these tilts the ring. A clickable div/span needs role="button"
// (see viewCardProps) or data-cursor="hover" to be picked up.
const CLICKABLE = 'a[href], button:not(:disabled), [role="button"], [role="link"], [role="tab"], [role="menuitem"], label, summary, select, input[type="checkbox"], input[type="radio"], input[type="range"], input[type="submit"], input[type="button"], [data-cursor="hover"]';
// Text fields keep the native I-beam, so the ring hides over them.
const TEXT_FIELD = 'textarea, [contenteditable=""], [contenteditable="true"], input:not([type="checkbox"], [type="radio"], [type="range"], [type="submit"], [type="button"], [type="reset"], [type="file"], [type="color"])';

// Diamond centre relative to the hotspot (the svg is drawn with its tip at 0,0)
const DIAMOND = { x: 0, y: 5 };
const MAX_PARTICLES = 260;

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number; color: string; twinkle: number; drag: number;
};

const useFinePointer = () => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const fine = window.matchMedia(FINE_POINTER);
    const reduced = window.matchMedia(REDUCED_MOTION);
    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();
    fine.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      fine.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);
  return enabled;
};

export function WeddingCursor() {
  const enabled = useFinePointer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    const ctx = canvas?.getContext('2d');
    if (!enabled || !canvas || !cursor || !ctx) return;

    const root = document.documentElement;
    root.classList.add('t-cursor-on');

    const css = getComputedStyle(root);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const gold = token('--color-wedding-gold');
    const goldLight = token('--color-wedding-goldlight');
    const cream = token('--color-wedding-cream');
    const dustColor = () => {
      const r = Math.random();
      return r < 0.65 ? goldLight : r < 0.82 ? cream : gold;
    };

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const particles: Particle[] = [];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const add = (p: Particle) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push(p);
    };
    // Trail: small specks that twinkle and drift down
    const trail = (x: number, y: number) => add({
      x, y, vx: rand(-0.4, 0.4), vy: rand(-0.1, 0.6),
      life: 1, decay: rand(0.012, 0.025), size: rand(0.8, 2.2),
      color: dustColor(), twinkle: rand(0, 6), drag: 1,
    });
    // Burst: the same specks thrown outward, slowing down and settling
    const burst = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(1.2, 3.6);
        add({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, decay: rand(0.015, 0.025), size: rand(1, 2.6),
          color: dustColor(), twinkle: rand(0, 6), drag: 0.93,
        });
      }
    };

    let mouseX = -100;
    let mouseY = -100;
    let lastX = 0;
    let lastY = 0;
    let visible = false;
    let hovering = false;
    let frame = 0;
    let rafId: number | null = null;
    let moved = false;

    const setVisible = (next: boolean) => {
      if (visible === next) return;
      visible = next;
      cursor.dataset.visible = String(next);
    };
    const setHover = (next: boolean) => {
      if (hovering === next) return;
      hovering = next;
      cursor.dataset.hover = String(next);
      if (next) burst(mouseX + DIAMOND.x, mouseY + DIAMOND.y, 8);
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);
      if (moved) {
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        moved = false;
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        if (p.drag < 1) {
          p.vx *= p.drag;
          p.vy = p.vy * p.drag + 0.03;
        }
        p.x += p.vx;
        p.y += p.vy;
        const twinkle = 0.55 + 0.45 * Math.sin(frame * 0.35 + p.twinkle);
        ctx.globalAlpha = p.life * twinkle;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // The bigger specks get a thin cross glint
        if (p.size > 1.9) {
          const r = p.size * 3;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x - r, p.y);
          ctx.lineTo(p.x + r, p.y);
          ctx.moveTo(p.x, p.y - r);
          ctx.lineTo(p.x, p.y + r);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      // Idle: stop the loop until the mouse moves or clicks again
      rafId = particles.length || moved ? requestAnimationFrame(draw) : null;
    };
    const wake = () => {
      if (rafId === null) rafId = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        setVisible(false);
        return;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      moved = true;
      if (!visible) {
        lastX = mouseX;
        lastY = mouseY;
      }
      const target = e.target instanceof Element ? e.target : null;
      const overText = !!target?.closest(TEXT_FIELD);
      setVisible(!overText);
      setHover(!overText && !!target?.closest(CLICKABLE));
      // One speck every 8px travelled, spread along the path so fast moves stay even
      const distance = Math.hypot(mouseX - lastX, mouseY - lastY);
      const count = Math.min(4, Math.floor(distance / 8));
      if (count && !overText) {
        for (let i = 1; i <= count; i++) {
          trail(lastX + ((mouseX - lastX) * i) / count, lastY + ((mouseY - lastY) * i) / count);
        }
        lastX = mouseX;
        lastY = mouseY;
      }
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !visible) return;
      burst(e.clientX, e.clientY, 22);
      wake();
    };
    // Leaving the window (or entering an iframe) hides the ring
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) setVisible(false);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerout', onOut);
    window.addEventListener('resize', setSize);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('resize', setSize);
      root.classList.remove('t-cursor-on');
      delete cursor.dataset.visible;
      delete cursor.dataset.hover;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-none z-[9998]" />
      <div ref={cursorRef} aria-hidden="true" className="t-cursor fixed left-0 top-0 pointer-events-none z-[9999]">
        <svg className="t-cursor-ring" width="26" height="30" viewBox="0 0 26 30">
          <path d="M13 1l5 5-5 5-5-5z" className="fill-wedding-cream stroke-wedding-goldlight" strokeWidth=".8" />
          <path d="M9.5 7.5L13 11l3.5-3.5M8 6h10" fill="none" className="stroke-wedding-goldlight" strokeWidth=".5" />
          <circle cx="13" cy="20" r="8" fill="none" className="stroke-wedding-gold" strokeWidth="2.4" />
        </svg>
      </div>
    </>
  );
}
