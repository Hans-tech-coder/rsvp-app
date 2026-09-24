# T08: Scroll-motion foundation

**Skills:** `lean-build`, `motion` (search the docs for `useScroll`, `scroll`,
`parallax` and `useReducedMotion`), and `ui-ux-pro-max` (its Scroll Reveal and
Parallax Scroll presets, Subtle tier, for timing and do/don't — ignore the GSAP
code itself). Optionally, `grilling` for the design decision in step 1.

## Key constraint

The page itself does not scroll. Each screen is `absolute inset-0` inside a
`100dvh` `<main>` with `overflow-hidden`, and screens that scroll have **their
own scroll container** (see `docs/guest-site.md` → Layout rules). So:

- `useScroll` needs the `container` option pointing at the screen's scroll
  element, not the window.
- Window-level smooth-scroll libraries (Lenis and similar) do not fit this
  layout, and scroll-jacking feels laggy on phones. **Keep native scrolling.**
  The luxury feel comes from what moves, not from hijacking the scroll.

## Steps

1. **Decide the direction with the owner.** Show two or three intensity options
   (for example: reveal only / reveal + gentle hero parallax / reveal + parallax
   + a thin gold scroll-progress line). Record the choice in Result.
2. Build the smallest set of shared primitives in `src/components/ui/`, for
   example:
   - a way for a screen to share its scroll container ref (a context or a prop)
   - `ScrollReveal`: fade and rise when the element enters the view, once, with
     an optional stagger for children
   - `Parallax`: a small `y` offset tied to container scroll through
     `useScroll({ container, target })` + `useTransform`, at most ±24–40 px
3. Add scroll tokens to `globals.css` next to the existing motion tokens (or TS
   constants that mirror them). No bounce. Use `--ease-smooth-out`.
4. **Reduced motion:** every primitive renders statically under
   `useReducedMotion()`.
5. Prove it on **one** element of `OurStoryScreen`. T09 does the rest of that
   screen. Do not also animate an element that already has `whileInView` —
   replace it instead.

## Luxury rules (T09–T11 follow these)

- Small distances, long soft easing, and nothing that bounces.
- At most one parallax element per viewport. Text never uses parallax; it
  only reveals.
- Reveals play once. Nothing re-animates on scroll-up.
- No scroll effects on form inputs.

## Done when

- The primitives exist and are used on one element. Scrolling Our Story (S3)
  has slow frames at or below 5% and CLS below 0.05.
- Reduced motion is static.
- `docs/conventions.md` (Motion section) and `docs/FEATURE-MAP.md` (shared
  pieces table) list the new primitives and tokens.
- Lint and build pass.

## Result

**Chosen intensity (owner, 2026-09-24):** reveal + gentle hero parallax. No
scroll-progress line.

**Primitives** — `src/components/ui/ScrollMotion.tsx`:

- `ScrollContainerProvider({ containerRef })` / `useScrollContainer()`: a
  screen shares its scroll element; falls back to the viewport when absent.
- `ScrollReveal({ delay?, stagger?, className })`: fade + rise 16 px, once,
  800 ms `--ease-smooth-out`, `whileInView` with `viewport.root` = container,
  `amount: 0.2`. With `stagger` (true = 120 ms, or seconds) it staggers direct
  `ScrollRevealItem` children instead of moving itself.
- `Parallax({ distance? = 24, className })`: `useScroll({ container, target,
  offset: ['start end', 'end start'] })` → `useTransform` to `y` +distance →
  −distance. Caller oversizes the layer inside an `overflow-hidden` parent.
- All render a plain `div` under `useReducedMotion()`.
- Tokens: `--duration-scroll-reveal` 800ms, `--distance-scroll-reveal` 16px,
  `--stagger-scroll-reveal` 120ms, `--distance-parallax` 24px in
  `globals.css`, mirrored by `SCROLL_MOTION`.

**Proof on Our Story:** the Continue block's `whileInView` was replaced by
`<ScrollReveal delay={0.2}>`, and the first timeline photo is wrapped in
`<Parallax className="absolute inset-x-0 -inset-y-6">` (the other photos are
left for T09). Section has `ref` + `ScrollContainerProvider`.

**Measurements (production build, S3 = scroll Our Story top → bottom in 5 s):**

| Viewport | Slow frames | CLS | Long tasks > 50 ms |
| --- | --- | --- | --- |
| 375×812 | 1 / 970 (0.1 %) | 0 | none |
| desktop 1345 px | 1 / 626 (0.16 %) | 0 | none |

Parallax layer moved +10.8 → −24 px (clamped) across 0–900 px of scroll; layer
304 px in a 256 px clip, so no edge shows. Continue block ends at opacity 1,
`transform: none`.

**Checks:** changed files lint clean, total lint unchanged (141 problems, all
older); build OK. Reduced motion verified in code only (the browser pane
cannot emulate `prefers-reduced-motion`); each primitive returns a static
`div` when `useReducedMotion()` is true. No phone check this session.
