"use client";

import React, { useEffect, useRef } from 'react';

export function InkRevealCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mc = [28, 25, 23]; // wedding-dark RGB
    const brushSize = 128;
    const lifetime = 600;
    const rStart = 10;
    const rVary = 0.45;
    const stampStep = 10;
    const maxStamps = 200;
    const segments = 36;
    const wobble = [0.14, 0.08, 0.05];
    const gradientInnerRadius = 0.2;
    const gradientStops = [0.95, 0.88, 0];

    interface Stamp {
      x: number;
      y: number;
      born: number;
      seed: number;
      rmax: number;
    }

    const stamps: Stamp[] = [];
    let running = false;
    let lastPos: { x: number; y: number } | null = null;
    let dims = { w: 0, h: 0 };
    let animationFrameId: number;

    let resizeObserver: ResizeObserver;

    function handleResize(entries: ResizeObserverEntry[]) {
      if (!canvas || !ctx) return;
      const entry = entries[0];
      const { width: w, height: h } = entry.contentRect;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      dims = { w, h };
      
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
      ctx.fillRect(-5, -5, w + 10, h + 10);
      
      // Redraw existing stamps so they don't disappear on resize
      const now = performance.now();
      ctx.globalCompositeOperation = "destination-out";
      for (let i = stamps.length - 1; i >= 0; i--) {
        const t = (now - stamps[i].born) / lifetime;
        if (t < 1) {
          const ease = 1 - Math.pow(1 - t, 3);
          const r = rStart + (stamps[i].rmax - rStart) * ease;
          const alpha = 1 - t * t;
          carveInk(stamps[i].x, stamps[i].y, r, stamps[i].seed, alpha);
        }
      }
    }

    // Use ResizeObserver instead of window resize event
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Initial manual size update before observer ticks
    const initialRect = canvas.getBoundingClientRect();
    if (initialRect.width > 0 && initialRect.height > 0) {
      handleResize([{ contentRect: initialRect } as ResizeObserverEntry]);
    }

    function carveInk(x: number, y: number, r: number, seed: number, alpha: number) {
      if (!ctx) return;
      const g = ctx.createRadialGradient(x, y, r * gradientInnerRadius, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${gradientStops[0] * alpha})`);
      g.addColorStop(0.5, `rgba(0,0,0,${gradientStops[1] * alpha})`);
      g.addColorStop(1, `rgba(0,0,0,${gradientStops[2] * alpha})`);
      ctx.fillStyle = g;

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const wob = 0.78 +
            wobble[0] * Math.sin(a * 3 + seed) +
            wobble[1] * Math.sin(a * 5 + seed * 2.1) +
            wobble[2] * Math.sin(a * 7 + seed * 0.7);
        const px = x + Math.cos(a) * r * wob;
        const py = y + Math.sin(a) * r * wob;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    function addStamp(x: number, y: number) {
      if (stamps.length >= maxStamps) stamps.shift();
      stamps.push({
        x, y,
        born: performance.now(),
        seed: Math.random() * Math.PI * 2,
        rmax: brushSize * (1 - rVary + Math.random() * rVary),
      });
    }

    function stampAlong(x: number, y: number) {
      if (!lastPos) {
        addStamp(x, y);
      } else {
        const dx = x - lastPos.x;
        const dy = y - lastPos.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(dist / stampStep));
        for (let i = 1; i <= steps; i++) {
          addStamp(lastPos.x + (dx * i) / steps, lastPos.y + (dy * i) / steps);
        }
      }
      lastPos = { x, y };
    }

    function loop() {
      if (!ctx) return;
      const now = performance.now();
      const { w, h } = dims;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
      ctx.fillRect(-5, -5, w + 10, h + 10);
      ctx.globalCompositeOperation = "destination-out";

      for (let i = stamps.length - 1; i >= 0; i--) {
        const t = (now - stamps[i].born) / lifetime;
        if (t >= 1) {
          stamps.splice(i, 1);
          continue;
        }
        const ease = 1 - Math.pow(1 - t, 3);
        const r = rStart + (stamps[i].rmax - rStart) * ease;
        const alpha = 1 - t * t;
        carveInk(stamps[i].x, stamps[i].y, r, stamps[i].seed, alpha);
      }

      if (stamps.length) {
        animationFrameId = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    }

    function startLoop() {
      if (!running) {
        running = true;
        animationFrameId = requestAnimationFrame(loop);
      }
    }

    function getRelativePos(e: MouseEvent | TouchEvent) {
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const pos = getRelativePos(e);
      lastPos = pos;
      stampAlong(pos.x, pos.y);
      startLoop();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getRelativePos(e);
      stampAlong(pos.x, pos.y);
      startLoop();
    };

    const handleMouseLeave = () => {
      lastPos = null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const pos = getRelativePos(e);
      lastPos = pos;
      stampAlong(pos.x, pos.y);
      startLoop();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const pos = getRelativePos(e);
      stampAlong(pos.x, pos.y);
      startLoop();
    };

    const handleTouchEnd = () => {
      lastPos = null;
    };

    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (canvas) {
        canvas.removeEventListener("mouseenter", handleMouseEnter);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute -inset-5 z-10 pointer-events-auto"
      style={{ width: 'calc(100% + 40px)', height: 'calc(100% + 40px)' }}
    />
  );
}
