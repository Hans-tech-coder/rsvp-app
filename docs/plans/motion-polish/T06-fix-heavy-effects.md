# T06: Fix heavy effects (canvas, gallery, slider)

**Skills:** `surgical-patch`, `motion` (MotionValues instead of React state for
per-frame values). Read `findings.md` first. Only fix the causes it assigns to
T06.

**Scope (set by T01):** the circular gallery (`circular-image-gallery.tsx`)
is the worst jank measured. (a) GSAP and MotionPathPlugin load one after the
other from a CDN on first open, so the gallery appears after 3.2 s; (b) it
mounts all 40 photos as 80 full-screen SVG `<image>`s (40 with `blur-xl`),
which gives a 216 ms long task and a 286 ms frame on open; (c) the dot strip
animates `left` and starts at a 1200×800 placeholder, which gives CLS
0.0065–0.0165 per open. Also the `TwinkleSparks` canvas: full device pixel
ratio, `shadowBlur` on each of ~33 fills per frame, and a loop that never
pauses (H6; code-confirmed, no slow frames on desktop, needs a phone check).
Refuted: per-frame React state (H7), `InkRevealCanvas`, `DraggableSlider`.

## Files

`src/components/effects/TwinkleSparks.tsx`, `src/components/ui/InkRevealCanvas.tsx`,
`src/components/ui/circular-image-gallery.tsx` (383 lines, read by range), and
`src/components/ui/DraggableSlider.tsx`.

## Direction (adjust to the evidence)

- Pause canvas rAF loops when the canvas is off-screen or the tab is hidden.
  Cap the device pixel ratio at 2, and use fewer particles on small screens.
- Never call `setState` every frame. Drive per-frame values with MotionValues
  (`useMotionValue`, `useTransform`), and read them only in effects or
  callbacks.
- Keep the cancel-on-unmount rule from `docs/conventions.md`.

## Done when

- S4 and the Welcome screen have no long tasks over 50 ms, and slow frames stay
  at or below 5%.
- The effects look the same at a glance.
- Lint and build pass. Before/after numbers go in Result.

## Result

Done 2026-09-24. Production build, browser pane, 375×812 (DPR 2) and desktop
(1345×1274, DPR 1). Warm HTTP cache (the pane cannot disable it).

**Changes**

- `circular-image-gallery.tsx`
  - (a) GSAP loads through a shared `loadGsap()` promise. `MotionPathPlugin`
    is dropped: no animation used `motionPath`, so the second CDN load after
    the first is gone. `GalleryScreen` calls `loadGsap()` on mount, so the
    script is ready before the first tap.
  - (b) Only the open, in-place and closing photos mount their two SVG
    `<image>`s (≤ 4 instead of 80). The other 37+ are tiny hearts hidden
    under the dot strip, so nothing visible changes. Photos and dots now use
    one resized copy from the Next image optimizer (`w=750` on a phone,
    `1920` on desktop, `96` for dots) instead of the stored original. The
    next and previous photos are preloaded.
  - (c) The dot strip moves with the CSS `translate` property instead of
    `left`, and the width/height start from `window` instead of a 1200×800
    placeholder. (`translate`, not `transform`: Tailwind v4 `scale-125` is the
    `scale` property, which would scale a `transform` offset.)
- `TwinkleSparks.tsx`: DPR capped at 2. The glow is drawn once per color into
  a sprite and stamped with `drawImage`, so `shadowBlur` no longer runs on
  every fill. The rAF loop pauses when the canvas is off-screen
  (IntersectionObserver) or the tab is hidden, and it still cancels on
  unmount. The particle count is unchanged (30 below 768 px, 70 above).
  Old and new stars were drawn side by side on a test canvas and look the same.

**Before (T01) → after**

| Scenario | CLS | Long tasks > 50 ms | Slow frames / total (worst) |
| --- | --- | --- | --- |
| Welcome idle, sparks (phone) | 0 → 0.00001 (countdown digit) | none → none | 0 / 496 → 0 / 495 (8 ms) |
| Welcome idle, sparks (desktop) | – | none | 0 / 470 (12 ms) |
| S4 menu → Gallery | 0 → 0 | none → none | 5 / 666 (41 ms) → 7 / 442 (47 ms), 1.6 % |
| S4 first open | 0.0165 → **0** | none (216 ms on warm open) → **none** | 2 / 475 (59 ms) → 5 / 376 (43 ms), 1.3 % |
| S4 time to gallery content, first open | **3.2 s** (cold GSAP) → **24 ms** (GSAP preloaded on Gallery mount) | | |
| S4 next photo | – | none | 2 / 364 (58 ms) |
| S4 dot jump | 0 | none | 2 / 256 (37 ms) |
| S4 first close | – | 154 ms → **none** | 3 / 348 (203 ms) → 0 / 194 (16 ms) |
| S4 warm reopen / close | 0.0065 → **0** | 216 ms → **none** | 3 / 344 (286 ms) → 2 / 389 (41 ms); close 0 / 327 |
| S4 open, desktop | 0 | none | 4 / 224 (64 ms), 1.8 % |

Mounted SVG `<image>`s on open: 80 → 2 (4 while one photo closes). Photo
bytes: originals up to ~370 KB → 20–32 KB (`w=750`); dots ~2 KB each.

**Checks:** `npm run build` OK. `npm run lint` 95 → 89 errors (52 warnings); the
six removed were old `@ts-ignore`/set-state errors in the gallery loader. None
are new. Visual: the heart open/close choreography, the blurred backdrop, the
centered active dot (phone: x 188, y 722 = centre, h − 90) and the desktop dot
row all match.

**Not verified:** a real phone (the sparks were the H6 concern; T07 should feel
it). Cold network: a *first* GSAP fetch from cdnjs was not measured (the pane
cache is warm), but it now overlaps the time the guest spends on the Gallery
screen. `prefers-reduced-motion`: the motion itself did not change, and neither
effect honoured it before (parked). A far dot jump shows the heart before its
photo arrives the first time (~0.4 s optimizer fetch), because distant photos
are no longer all downloaded on open.
