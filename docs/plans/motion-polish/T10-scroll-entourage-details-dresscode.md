# T10: Apply scroll effects — Entourage + Details + Dress Code

**Skills:** `lean-build`, `motion`. Read T08's **Result** section for the
chosen intensity and the primitive APIs, and follow T08's "Luxury rules".

## Files

`src/components/screens/EntourageScreen.tsx`, `src/components/screens/DetailsScreen.tsx`,
`src/components/screens/DressCodeScreen.tsx`, and the T08 primitives. Use them;
do not edit them. If a primitive needs a change, note it in `findings.md` →
Parking lot.

## Direction

- **Entourage:** name groups reveal with a soft stagger. No parallax on text.
- **Details:** venue cards reveal. At most one parallax, on the venue image if
  there is one. Leave the download button alone.
- **Dress Code:** palette swatches can stagger in. The inspiration slider
  already moves on its own, so give it no extra scroll motion.
- Replace the existing `whileInView` blocks with the primitives.

## Done when

- Per screen: a full scroll has slow frames at or below 5% and CLS below 0.05.
- Reduced motion is static.
- Lint and build pass.

## Result

**Changes** (T08 primitives only, none edited). Each screen's `<section>` now
has a `ref` and a `ScrollContainerProvider`. The old outer `whileInView` +
`containerVariants`/`itemVariants` wrappers are gone, and so are the Continue
blocks' `whileInView`. Continue → `<ScrollReveal delay={0.2}>`, as on Our Story.

- **Entourage:** every name column (parents, sponsors, honor attendants,
  bridesmaids/groomsmen, flower girls/ring bearer) is its own `ScrollReveal`,
  with the right-hand column delayed by `SCROLL_MOTION.revealStagger`. Side by
  side (desktop) the columns stagger softly; stacked (phone) each column reveals
  as it enters. A single `stagger` parent would reveal the lower column while
  it is still off-screen. No parallax.
- **Details:** each venue card gets a `ScrollReveal` (the second one delayed one
  stagger step). The hover lift stays on the inner card, which gets `h-full` so
  both cards stay the same height (518 px at desktop). The Order of Events block
  is one `ScrollReveal`, as before; the download button inside it is untouched.
  There is no venue image, so no parallax.
- **Dress Code:** the card is a `ScrollReveal`. Swatches are
  `<ScrollReveal stagger delay={0.2}>` + `ScrollRevealItem` each, with the
  hover scale on an inner `motion.div`. The inspiration slider has no scroll
  motion.

**Measurements (production build, full scroll top → bottom in 5 s, fresh
observers per screen):**

| Screen | Viewport | Scroll px | Slow frames | CLS | Long tasks > 50 ms |
| --- | --- | --- | --- | --- | --- |
| Entourage | 375×812 | 2917 | 0 / 1071 (0 %) | 0 | none |
| Details | 375×812 | 1945 | 0 / 1073 (0 %) | 0 | none |
| Dress Code | 375×812 | 1151 | 1 / 1059 (0.09 %) | 0 | none |
| Entourage | desktop 1345 px | 1624 | 0 / 1071 (0 %) | 0 | none |
| Details | desktop 1345 px | 1377 | 0 / 1029 (0 %) | 0 | none |
| Dress Code | desktop 1345 px | 484 | 0 / 1056 (0 %) | 0 | none |

Before scrolling, blocks below the fold sat at opacity 0 (so the reveal
measures against the screen's container); after the scroll, every reveal
element was at opacity 1 with `transform: none`.

**Checks:** changed files lint clean apart from two older `as any` in
`DetailsScreen.tsx`; total lint unchanged (141 problems). Build OK. Reduced motion
verified in code only (the browser pane cannot emulate it): every element that
moves is now a primitive, and each primitive renders a static `div`. The only
`motion` left is hover (`whileHover`) and the map modal. No phone check this
session.

**Docs:** `docs/conventions.md` → scroll motion: the side-by-side column
pattern. Parking lot: `ScrollReveal`'s `amount: 0.2` limit on very tall blocks.
