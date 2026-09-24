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

(fill in at the end of the session)
