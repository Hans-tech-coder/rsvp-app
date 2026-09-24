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

(fill in at the end of the session: chosen intensity, primitive names and APIs)
