# T05: Fix layout shift in reveals and images

**Skills:** `surgical-patch`, `ui-ux-pro-max` (its performance rules on CLS and
reserving space). Read `findings.md` first. Only fix the causes it assigns to
T05.

**Scope (set by T01):** no layout-shift fix needed: CLS ≈ 0 in S1–S3 and S5,
and `RevealImage` and Entrance images have reserved space. What remains: (a) the
reveal CSS animates `filter: blur` (text 4 px, images 8 px) with a permanent
`will-change: transform, opacity, filter` on every line (`globals.css:96-162`)
(H4); (b) oversized raw `<img>` from Blob (H8): the Gallery loads ~5.1 MB of
photos up to 2000 px for 180 px tiles, all eager, and Our Story uses PNGs.
The circular-gallery dot shift is in T06.

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
