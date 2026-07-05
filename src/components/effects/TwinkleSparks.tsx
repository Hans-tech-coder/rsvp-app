"use client";

import { useEffect, useRef, memo } from 'react';

export const TwinkleSparks = memo(function TwinkleSparks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Adjust for high DPI displays
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', setSize);
    setSize();

    // Elegant luxury colors for glitter/fireflies
    const luxuryColors = ['#D4AF37', '#FFDF00', '#FDF5E6', '#FFF8DC', '#E6C27A', '#FFFFFF'];

    class Firefly {
      x: number;
      y: number;
      baseSize: number;
      color: string;
      speedX: number;
      speedY: number;
      angle: number;
      spin: number;
      opacity: number;
      fadeSpeed: number;
      fadingIn: boolean;
      maxOpacity: number;

      constructor(resetY = false) {
        this.x = Math.random() * width;
        this.y = resetY ? -20 : Math.random() * height;
        
        // Make the stars large enough to clearly see the 4-point shape
        this.baseSize = Math.random() * 8 + 4; 
        
        this.color = luxuryColors[Math.floor(Math.random() * luxuryColors.length)];
        
        // Very slow drifting and falling
        this.speedX = (Math.random() - 0.5) * 0.15; 
        this.speedY = Math.random() * 0.2 + 0.05; 
        
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.02;
        
        // Slowmo twinkling
        this.opacity = resetY ? 0 : Math.random() * 0.8;
        this.fadeSpeed = Math.random() * 0.008 + 0.003; 
        this.fadingIn = Math.random() > 0.5;
        this.maxOpacity = Math.random() * 0.6 + 0.4; 
      }

      update() {
        // Drift movement simulating floating in the air
        this.angle += this.spin;
        this.x += this.speedX + Math.sin(this.angle) * 0.2;
        this.y += this.speedY;

        // Twinkle effect (fade in and out)
        if (this.fadingIn) {
          this.opacity += this.fadeSpeed;
          if (this.opacity >= this.maxOpacity) {
            this.fadingIn = false;
          }
        } else {
          this.opacity -= this.fadeSpeed;
          if (this.opacity <= 0.02) {
            this.fadingIn = true;
            // Reposition slightly when fully faded out for randomness
            this.x += (Math.random() - 0.5) * 10;
          }
        }

        // Wrap around smoothly
        if (this.y > height + 20) {
          this.y = -20;
          this.x = Math.random() * width;
          this.opacity = 0;
          this.fadingIn = true;
        }
        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
      }

      drawFourPointStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        const currentOpacity = Math.max(0, Math.min(1, this.opacity));
        ctx.globalAlpha = currentOpacity;
        
        // The size pulses slightly with the opacity
        const dynamicSize = this.baseSize * (0.5 + currentOpacity * 0.5);
        const innerRadius = dynamicSize * 0.15; // The "fatness" of the star center

        ctx.fillStyle = this.color;
        
        // Add glow
        ctx.shadowBlur = 10 * currentOpacity;
        ctx.shadowColor = this.color;
        
        // Draw the 4-point star shape resembling the reference image
        this.drawFourPointStar(ctx, this.x, this.y, 4, dynamicSize, innerRadius);
        ctx.fill();

        // Optional: Draw a tiny intense core at the center when very bright
        if (currentOpacity > 0.6) {
           ctx.shadowBlur = 0;
           ctx.fillStyle = '#FFFFFF';
           ctx.globalAlpha = currentOpacity * 0.8;
           ctx.beginPath();
           ctx.arc(this.x, this.y, innerRadius * 0.8, 0, Math.PI * 2);
           ctx.fill();
        }

        ctx.restore();
      }
    }

    const fireflies: Firefly[] = [];
    const count = width < 768 ? 30 : 70; // Slightly fewer because they are bigger shapes
    
    for (let i = 0; i < count; i++) {
      fireflies.push(new Firefly(false));
    }

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < fireflies.length; i++) {
        fireflies[i].update();
        fireflies[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full opacity-100 mix-blend-screen" />;
});
