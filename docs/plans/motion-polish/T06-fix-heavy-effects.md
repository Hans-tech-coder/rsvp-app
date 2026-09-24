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

(fill in at the end of the session)
