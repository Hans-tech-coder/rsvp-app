# T05: Fix layout shift in reveals and images

**Skills:** `surgical-patch`, `ui-ux-pro-max` (its performance rules on CLS and
reserving space). Read `findings.md` first. Only fix the causes it assigns to
T05.

**Scope (T01 rewrites this line):** reveals that animate layout or expensive
properties, and images without reserved space (H4, H8).

## Files

`src/components/ui/RevealImage.tsx`, the reveal CSS in `src/app/globals.css`
(`.t-stagger`, `.t-skel` and related), `src/components/ui/TextsReveal.tsx`, and
whichever screens T01 names by shift node.

## Direction (adjust to the evidence)

- Give every image a reserved box (`aspect-ratio` or width/height) before it
  loads.
- Reveals move with `transform` and `opacity` only. Use `filter: blur` only on
  small elements, and never on full-screen layers on mobile.
- Keep the look. This task changes *how* things animate, not *what* guests
  see.

## Done when

- CLS is **below 0.05** in every scenario S1–S5, and no remaining shift entry
  points at a reveal or image node.
- Lint and build pass. Before/after numbers go in Result.

## Result

(fill in at the end of the session)
