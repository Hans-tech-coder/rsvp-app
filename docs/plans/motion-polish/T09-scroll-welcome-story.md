# T09: Apply scroll effects — Welcome + Our Story

**Skills:** `lean-build`, `motion`. Read T08's **Result** section for the
chosen intensity and the primitive APIs, and follow T08's "Luxury rules".

## Files

`src/components/screens/WelcomeScreen.tsx`, `src/components/screens/OurStoryScreen.tsx`,
and the T08 primitives. Use them; do not edit them. If a primitive needs a
change, note it in `findings.md` → Parking lot.

## Direction

- **Our Story** has the most impact: timeline entries reveal in sequence as
  they arrive, with one gentle parallax on the photos.
- **Welcome** is a single screen with little or no scroll. Only add motion if
  it scrolls. Otherwise leave it and write "no change, not scrollable" in
  Result.
- Replace the existing ad-hoc `whileInView` blocks in these files with the
  primitives. Never stack two animations on one element.

## Done when

- Per screen: a full scroll to the bottom has slow frames at or below 5% and CLS
  below 0.05.
- Reduced motion is static.
- It feels good on a real phone (one line in Result).
- Lint and build pass.

## Result

**Welcome:** no change, not scrollable. Its scroll element is 812/812 px at
375×812 and 900/900 px at 1440×900. Its motion is a load-in (`animate`), not
`whileInView`.

**Our Story** (`OurStoryScreen.tsx`):

- The outer `motion.div` stagger (`containerVariants`/`itemVariants`,
  `whileInView` on the window, not the scroll element) is now a plain `div`.
  It fired once for the whole list and also faded the `TextsReveal` heading,
  which stacked two animations on one element.
- Each timeline card is a `<ScrollReveal>`, so cards reveal one by one as each
  arrives (16 px rise, 800 ms, once). On load only card 1 (phone) or cards 1–2
  (desktop) are shown; the rest stay at opacity 0 until they scroll in.
- `<Parallax className="absolute inset-x-0 -inset-y-6">` wraps the photo of
  every other card (index 0, 2, 4, 6 → 4 of 7 photos). All photos would put
  two parallax layers in one phone viewport (card pitch ≈ 555 px < 812 px).
  Alternating keeps it at most one at 375×812 and 1440×900 (drifting photos
  are ≈ 1,370 px apart on desktop). Only viewports taller than ≈ 1,100 px
  (e.g. the 1345×1274 pane) show two at once.
- The Continue block keeps T08's `<ScrollReveal delay={0.2}>`.

**Measurements (production build, S3 = scroll Our Story top → bottom in 5 s):**

| Viewport | Slow frames | CLS | Long tasks > 50 ms | Max parallax in view |
| --- | --- | --- | --- | --- |
| 375×812 | 1 / 918 (0.1 %) | 0 | none | 1 |
| desktop 1345×1274 | 0 / 865 (0 %) | 0 | none | 2 (tall pane only) |
| 1440×900 (layout check) | – | – | – | 1 |

After the scroll, every card ends at opacity 1 with `transform: none`.

**Checks:** changed file lints clean. Total lint is unchanged (141 problems,
all older). Build OK. Reduced motion is verified in code only, because the
browser pane cannot emulate it: the ad-hoc variants are gone, and
`ScrollReveal`/`Parallax` render static `div`s under `useReducedMotion()`.
**Phone:** not checked this session; the owner still has to add the one-line
feel check.
