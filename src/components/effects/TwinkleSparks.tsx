"use client";

import { useEffect, useRef, memo } from 'react';

// Fireflies: soft yellow-green glows that wander slowly and blink the way real
// ones do: a quick flash, a slow fade, then a dark pause (sometimes a double flash).
export const TwinkleSparks = memo(function TwinkleSparks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let width = window.innerWidth;
    let height = window.innerHeight;
    // Capped at 2: a DPR 3 phone would otherwise fill 2.25x the pixels for no visible gain
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Adjust for high DPI displays
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', setSize);
    setSize();

    // Firefly light: mostly yellow-green, some warm amber to sit with the gold theme
    const glowColors = ['214, 255, 110', '214, 255, 110', '236, 255, 150', '255, 226, 130'];

    // One soft glow sprite per color, drawn once: a hot pale core, a colored
    // body and a wide faint halo. Stamping it with drawImage is cheap per frame.
    const SPRITE_RADIUS = 24;
    const sprites = glowColors.map((rgb) => {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = SPRITE_RADIUS * 2 * dpr;
      const sctx = sprite.getContext('2d');
      if (!sctx) return sprite;
      sctx.scale(dpr, dpr);
      const g = sctx.createRadialGradient(SPRITE_RADIUS, SPRITE_RADIUS, 0, SPRITE_RADIUS, SPRITE_RADIUS, SPRITE_RADIUS);
      g.addColorStop(0, 'rgba(255, 255, 235, 1)');
      g.addColorStop(0.1, `rgba(${rgb}, 1)`);
      g.addColorStop(0.28, `rgba(${rgb}, 0.5)`);
      g.addColorStop(0.55, `rgba(${rgb}, 0.15)`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SPRITE_RADIUS * 2, SPRITE_RADIUS * 2);
      return sprite;
    });

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    type Phase = 'dark' | 'rise' | 'fade';

    class Firefly {
      x = rand(0, width);
      y = rand(0, height);
      // Depth: nearer fireflies are bigger, brighter and faster
      depth = rand(0.45, 1);
      sprite = sprites[Math.floor(Math.random() * sprites.length)];
      heading = rand(0, Math.PI * 2);
      turn = 0;
      speed = rand(8, 20);
      bob = rand(0, Math.PI * 2);
      brightness = 0;
      peak = 1;
      phase: Phase = 'dark';
      timer = rand(0, 3); // random start so they never blink in sync
      duration = 1;
      flashesLeft = 0;

      update(dt: number) {
        // Lazy wandering flight: the heading drifts smoothly, with a gentle bob
        this.turn += rand(-1, 1) * 2.5 * dt;
        this.turn = Math.max(-1.2, Math.min(1.2, this.turn));
        this.heading += this.turn * dt;
        this.bob += dt * 1.6;
        const v = this.speed * this.depth;
        this.x += Math.cos(this.heading) * v * dt;
        this.y += (Math.sin(this.heading) * v - 2) * dt + Math.sin(this.bob) * 0.15;

        const m = 30;
        if (this.x < -m) this.x = width + m;
        if (this.x > width + m) this.x = -m;
        if (this.y < -m) this.y = height + m;
        if (this.y > height + m) this.y = -m;

        // Blink: dark pause -> quick flash -> slow fade
        this.timer -= dt;
        if (this.phase === 'dark') {
          this.brightness = 0;
          if (this.timer <= 0) {
            if (this.flashesLeft === 0) this.flashesLeft = Math.random() < 0.25 ? 2 : 1;
            this.peak = rand(0.75, 1) * (0.6 + this.depth * 0.4);
            this.phase = 'rise';
            this.timer = this.duration = rand(0.2, 0.45);
          }
        } else if (this.phase === 'rise') {
          const t = 1 - Math.max(0, this.timer) / this.duration;
          this.brightness = this.peak * t * t * (3 - 2 * t);
          if (this.timer <= 0) {
            this.phase = 'fade';
            this.timer = this.duration = rand(1, 2.2);
          }
        } else {
          const t = Math.max(0, this.timer) / this.duration;
          this.brightness = this.peak * Math.pow(t, 1.5);
          if (this.timer <= 0) {
            this.flashesLeft--;
            this.phase = 'dark';
            this.timer = this.flashesLeft > 0 ? rand(0.25, 0.5) : rand(0.6, 2.8);
          }
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.brightness < 0.01) return;
        const r = SPRITE_RADIUS * (0.55 + this.depth * 0.6);
        ctx.globalAlpha = Math.min(1, this.brightness);
        ctx.drawImage(this.sprite, this.x - r, this.y - r, r * 2, r * 2);
      }
    }

    const fireflies: Firefly[] = [];
    const count = width < 768 ? 32 : 64;

    for (let i = 0; i < count; i++) {
      fireflies.push(new Firefly());
    }

    let last = 0;
    const loop = (now: number) => {
      // Time-based, so the flight and blink speed are the same on 60 Hz and 120 Hz screens.
      // Clamped so a resume after a pause does not jump.
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < fireflies.length; i++) {
        fireflies[i].update(dt);
        fireflies[i].draw(ctx);
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(loop);
    };

    // Run only while the canvas is on screen and the tab is visible
    let onScreen = true;
    const sync = () => {
      const shouldRun = onScreen && document.visibilityState === 'visible';
      if (shouldRun && animationFrameId === null) {
        last = 0;
        animationFrameId = requestAnimationFrame(loop);
      } else if (!shouldRun && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      window.removeEventListener('resize', setSize);
      document.removeEventListener('visibilitychange', sync);
      observer.disconnect();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full opacity-100 mix-blend-screen" />;
});
