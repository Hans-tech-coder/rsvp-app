# T01: Investigate the jank (read-only)

**Skills:** `investigate-first`, then `motion` (read `best-practices/index.md`
and `best-practices/react.md` in the skill for what counts as a jank pattern).

**Do not edit product code.** You may only edit `findings.md`, this file, the
tracker in `README.md`, and the *Scope* line of T03–T06 (you are allowed to
open those four files only to rewrite their Scope line).

## Goal

Name the real causes of three symptoms the owner reported, with evidence:
1. Transitions between screens feel laggy.
2. Elements or components jump.
3. Loading stutters.

## Steps

1. Run the measurement protocol in `README.md` for S1–S5 and fill the baseline
   table in `findings.md`. Take one screenshot mid-transition for S1 and S2.
2. Test each hypothesis below. Look for the cheapest check that could prove it
   wrong. Read files by range (`grep -n` first).
3. Rank the results in `findings.md`. Assign every confirmed cause to T03, T04,
   T05 or T06. If a cause fits none of them, add it to T06 and say so.
4. Rewrite the **Scope** line of each of T03–T06 to match the evidence. If a
   task has no confirmed cause, set its tracker row to ➖ and give the reason.

## Starting hypotheses (not proven — confirm or refute each)

| # | Hypothesis | Where to look |
| --- | --- | --- |
| H1 | Content swap: the site first paints the JSON defaults, then Firestore overrides replace the text and images, so things jump | `src/contexts/WeddingContentContext.tsx`, `src/data/wedding-content.json` |
| H2 | The loading screen leaves before fonts, content, or the Welcome hero image are ready, so Welcome paints and then shifts | `src/components/screens/LoadingScreen.tsx`, the loading branch in `src/app/page.tsx` (~line 156), fonts in `src/app/layout.tsx` |
| H3 | Screen swaps are sequential: 0.5 s exit, then 0.8 s enter under `AnimatePresence mode="wait"`, then `TextsReveal` waits another 600–800 ms. That is about 2 s before text appears, which reads as lag | `pageVariants` in `src/app/page.tsx`, `src/components/ui/TextsReveal.tsx`, tokens at the top of `src/app/globals.css` |
| H4 | Reveals animate expensive properties (`filter: blur`, width/height, letter-spacing) or images have no reserved size | `src/components/ui/RevealImage.tsx`, reveal CSS in `globals.css`, the `<img>` in `EntranceScreen.tsx` |
| H5 | The many `whileInView` blocks (every screen, ~2 each) re-trigger or start together while scrolling | `grep -n whileInView src/components/screens` |
| H6 | Canvas effects keep running rAF while hidden, or draw at full device pixel ratio | `src/components/effects/TwinkleSparks.tsx`, `src/components/ui/InkRevealCanvas.tsx` |
| H7 | The circular gallery or the draggable slider sets React state every frame | `src/components/ui/circular-image-gallery.tsx` (383 lines, read by range), `src/components/ui/DraggableSlider.tsx` |
| H8 | Large un-optimized images (raw `<img>`, Blob/Firebase URLs) cause decode stalls when a screen enters | image sources in the screens; `next.config.ts` |

## Done when

- The baseline table is filled for S1–S5.
- Every hypothesis is confirmed or refuted with a concrete observation (a
  number, a shift node, a line of code, or a screenshot).
- The Scope lines of T03–T06 are updated and the tracker row statuses match.

## Result

Done 2026-09-24. The baseline table, the S1 timeline, and the ranked hypotheses
are in `findings.md`. No product code was changed.

- **Confirmed:** H7′ (circular gallery open: 216 ms long task, 286 ms frame,
  3.2 s GSAP CDN wait, dot strip CLS up to 0.0165) → T06. H2 (loading hands off
  **late**, not early: sequential Firestore reads to 2.0 s, 1.5 s exit, hero
  image requested at 3.46 s, 5.4 MB music preload) → T03. H3 (blank gap, text
  at 1.1–1.3 s, full at ~2 s) → T04. H8 (Gallery ~5.1 MB of full-size photos
  in 180 px tiles) and H4-blur (reveal `filter: blur` + permanent
  `will-change`) → T05. H6 (TwinkleSparks full DPR + `shadowBlur`, loop never
  pauses; code only, no desktop jank) → T06.
- **Refuted:** H1 (no content swap; CLS ≈ 0), H4 reserved-size, H5
  (`once: true` everywhere), H7 as stated (no per-frame state), and
  `InkRevealCanvas`.
- All four fix tasks keep a confirmed cause, so none is cancelled. Their Scope
  lines are rewritten.
- **Limits:** measured on a desktop at DPR 2 and ~165 Hz, with a warm cache and
  no CPU throttle. Frame counts are not comparable to a 60 Hz phone, so T07
  must use the same pane. The real-phone check was not done; T07 should do it.
