"use client";

import React, { useEffect, useState, memo } from 'react';

// Pre-calculate random values to avoid hydration mismatch
const PETAL_COUNT = 35;

interface PetalData {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  width: string;
  height: string;
  colorClass: string;
  rotation: string;
}

const FallingPetals = memo(() => {
  const [petals, setPetals] = useState<PetalData[]>([]);

  useEffect(() => {
    // Generate petals only on the client side
    const generatedPetals: PetalData[] = Array.from({ length: PETAL_COUNT }).map((_, i) => {
      const isBurgundy = Math.random() > 0.4; // 60% burgundy, 40% white
      const size = Math.random() * 10 + 8; // 8px to 18px

      return {
        id: i,
        left: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 10 + 10}s`, // 10-20s fall time
        animationDelay: `-${Math.random() * 20}s`, // Start at different times
        width: `${size}px`,
        height: `${size * 1.2}px`, // Slightly oval
        colorClass: isBurgundy ? 'bg-wedding-burgundy/60' : 'bg-wedding-cream/60',
        rotation: `${Math.random() * 360}deg`
      };
    });
    setPetals(generatedPetals);
  }, []);

  if (petals.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotateZ(0deg) rotateX(0deg) rotateY(0deg);
          }
          100% {
            transform: translateY(110vh) rotateZ(360deg) rotateX(180deg) rotateY(180deg);
          }
        }
        .petal {
          position: absolute;
          top: -10%;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          border-radius: 150px 0 150px 0; /* Leaf/petal shape */
          box-shadow: inset 0 0 4px rgba(0,0,0,0.1);
        }
      `}</style>
      
      {petals.map((petal) => (
        <div
          key={petal.id}
          className={`petal ${petal.colorClass} backdrop-blur-[1px]`}
          style={{
            left: petal.left,
            width: petal.width,
            height: petal.height,
            animationDuration: petal.animationDuration,
            animationDelay: petal.animationDelay,
            transform: `rotate(${petal.rotation})`,
          }}
        />
      ))}
    </div>
  );
});

FallingPetals.displayName = 'FallingPetals';

export { FallingPetals };
