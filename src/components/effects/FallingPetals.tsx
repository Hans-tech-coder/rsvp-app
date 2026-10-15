import { memo } from 'react';

// Slow falling rose petals (burgundy, red and white). Pure CSS: each petal
// falls (`.t-petal`), sways side to side (`.t-petal-sway`) and tumbles in 3D
// (`.t-petal-spin`); keyframes and the reduced-motion rule live in globals.css.
// Values come from a seeded generator, so server and client render the same
// petals (no hydration mismatch, no effect). Half the petals are hidden on
// phones. Place it inside a positioned parent, behind the text.

const PETAL_COUNT = 24;

const PETAL_COLORS = [
  'text-primary-light/85',
  'text-primary/90',
  'text-primary-light/70',
  'text-ink/50',
  'text-ink/35',
];

// mulberry32: tiny deterministic PRNG
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(20261220);
const PETALS = Array.from({ length: PETAL_COUNT }, (_, i) => {
  const fall = 16 + rand() * 12; // 16–28 s from top to bottom
  return {
    id: i,
    left: `${(i / PETAL_COUNT) * 100 + rand() * (100 / PETAL_COUNT)}%`,
    size: Math.round(12 + rand() * 12), // 12–24 px
    color: PETAL_COLORS[Math.floor(rand() * PETAL_COLORS.length)],
    style: {
      '--petal-fall': `${fall.toFixed(1)}s`,
      '--petal-delay': `-${(rand() * fall).toFixed(1)}s`,
      '--petal-sway': `${Math.round(18 + rand() * 30)}px`,
      '--petal-sway-dur': `${(3.5 + rand() * 3).toFixed(1)}s`,
      '--petal-spin-dur': `${(6 + rand() * 6).toFixed(1)}s`,
      '--petal-tilt': `${Math.round(rand() * 360)}deg`,
    } as React.CSSProperties,
  };
});

const FallingPetals = memo(function FallingPetals() {
  return (
    <div className="t-petals pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PETALS.map((petal) => (
        <span
          key={petal.id}
          className={`t-petal ${petal.id % 2 ? 'max-sm:hidden' : ''}`}
          style={{ left: petal.left, ...petal.style }}
        >
          <span className="t-petal-sway">
            <svg
              viewBox="0 0 20 24"
              width={petal.size}
              height={Math.round(petal.size * 1.2)}
              className={`t-petal-spin ${petal.color}`}
            >
              {/* Rose petal: notched top, narrow base, lighter centre */}
              <path
                fill="currentColor"
                d="M10 24C3 19 0 11 2 5c1-3 4-4 6-2l2 2 2-2c2-2 5-1 6 2 2 6-1 14-8 19Z"
              />
              <path fill="var(--color-ink)" opacity="0.18" d="M10 21C6 17 5 11 7 7l3 3 3-3c2 4 1 10-3 14Z" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
});

export { FallingPetals };
