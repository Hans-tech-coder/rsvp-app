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

Session 2026-09-24. Production build, browser pane, 375×812 at DPR 2 (desktop
pane is DPR 1), warm HTTP cache except for the new `/_next/image` variants.

**Changes**

- `globals.css`: `.t-stagger-line` now animates `opacity` + `transform` only.
  The 4 px blur, its transitions, and the permanent
  `will-change: transform, opacity, filter` are removed, along with the
  `--stagger-blur` token. `.t-skel-skeleton` fades with opacity only. The image
  (`.t-skel-content`) keeps its 8 px blur-up (the visible look), but the revealed
  state is `filter: none`, so no filter layer stays once it has loaded.
  Reduced-motion rules are unchanged; they still switch these transitions off
  (checked in the code; the pane cannot emulate reduced motion).
- `RevealImage.tsx`: `loading="lazy"` and `decoding="async"` by default (callers
  can override). New opt-in: with `sizes`, the `<img>` gets `src`/`srcSet`/`sizes`
  from `next/image` `getImageProps` (`fill`). It keeps the plain `<img>`, the
  caller's classes, and the layout, so the reserved boxes do not change.
- `GalleryScreen.tsx` (both rows): `sizes="(min-width: 768px) 280px, (min-width: 640px) 220px, 180px"`.
- `OurStoryScreen.tsx`: `sizes="(min-width: 768px) 440px, calc(100vw - 112px)"`.
- Other `RevealImage` callers are untouched, apart from getting lazy loading
  (menu logo SVG, Details order-of-events, Dress Code, Registry QR).

**Before (T01) → after**

| Scenario | CLS | Top shifts | Long tasks > 50 ms | Slow frames / total |
| --- | --- | --- | --- | --- |
| S1 load → Welcome | 0.0000 → **0** | none | none → none | not measurable (tool lag) |
| S2 Welcome → Our Story | 0 → **0** | none | 51 ms (T04 removed it) → none | frame counter stalls while the tool awaits; not comparable |
| S3 scroll Our Story | 0 → **0** | none | none → none | 0/744 → **2/648** |
| S4 menu → Gallery (first visit, cold optimizer) | 0 → **0** | none | none → none | 5/666 → 9/439 |
| S4 menu → Gallery (warm) | – → **0** | none | none | **5/443**; steady marquee 0/564 |
| S4 circular gallery open (T06 scope) | 0.0065–0.0165 → 0.0175 | dot strip `absolute rounded-full border-2 …` only | 64 + 376 ms | 5/356 |
| S4 circular gallery close | – → **0** | none | none | 0/409 |
| S5 Gallery → Dress Code → Details (back ×2) | 0 → **0** | none | none → none | 1/713 → **0/977** |
| Desktop Gallery (1345 px, DPR 1) | **0** | none | – | – |

No shift entry points at a reveal or image node. The only shifts left are the
circular-gallery dot strip (H7′, T06).

**Image weight**

- Gallery on entry: ~5.1 MB of 2000 px originals, all eager → **13 requests,
  184 KB** (384w WebP, largest 23 KB). Offscreen tiles load lazily as the
  marquee brings them in. Desktop DPR 1 also picks 384w for 278 px tiles.
- Our Story: 7 PNG/JPEG (39–173 KB) at mount → 7 × 640w WebP, **13–59 KB each,
  261 KB total**. Only the 3 near the viewport load at mount; the rest load on scroll.

**Gates:** `npm run build` OK. `npm run lint` unchanged: 95 errors, 52 warnings,
all older (see Parking lot). The touched files only carry the existing
`no-img-element` warning.

**Not verified:** real phone; cold network. First visits call `/_next/image`,
which counts against Vercel Image Optimization (noted in `docs/data-model.md`).
The circular gallery now fetches originals cold (Parking lot, for T06).
