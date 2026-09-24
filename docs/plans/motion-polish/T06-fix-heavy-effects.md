# T06: Fix heavy effects (canvas, gallery, slider)

**Skills:** `surgical-patch`, `motion` (MotionValues instead of React state for
per-frame values). Read `findings.md` first. Only fix the causes it assigns to
T06.

**Scope (T01 rewrites this line):** per-frame work from canvas effects, the
circular gallery and the slider (H6, H7), plus any cause T01 could not place
elsewhere.

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
