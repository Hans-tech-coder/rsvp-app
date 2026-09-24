# T04: Fix the screen-swap transitions

**Skills:** `surgical-patch`, `motion`. Search the Motion docs for
`AnimatePresence` and `popLayout` before changing modes. Read `findings.md`
first. Only fix the causes it assigns to T04.

**Scope (set by T01):** the sequential chain (H3, confirmed): 0.5 s exit →
blank frame (screenshot shows only back/menu buttons) → 0.1 s delay + 0.8 s
enter (`pageVariants`, `page.tsx:131`) → `TextsReveal` timer 600/800 ms
(`TextsReveal.tsx:24`). First text is revealed 1.14–1.32 s after the tap and
fully in at ~2 s. Also the 51 ms long task when the new screen mounts. The
back/menu buttons were not flagged.

## Files

`pageVariants` and the `AnimatePresence` blocks in `src/app/page.tsx` (read by
range; the file is 397 lines), `src/components/ui/TextsReveal.tsx`, and the
motion tokens at the top of `src/app/globals.css`.

## Direction (adjust to the evidence)

- "Luxury" means *unhurried*, not *delayed*. The new screen should start
  appearing within about 300 ms of the tap, and the entrance can still take
  0.6–0.8 s with `--ease-smooth-out`.
- Screens are `absolute inset-0`, so the old and new screen can overlap (a
  crossfade) without a layout jump. Evaluate this against `mode="wait"`.
- Animate only `opacity` and `transform`. Per the Motion best practices, a
  `transform` string runs on WAAPI, off the main thread.
- Shorten the `TextsReveal` delays to match the new timing.
- Each screen's scroll container must start at the top.

## Done when

- S2 and S5: the first new content is visible within ~300 ms of the tap, slow
  frames stay at or below 5%, and there are no long tasks during the swap.
- With reduced motion, the swap is an instant or near-instant fade.
- Lint and build pass. Before/after numbers go in Result.

## Result

**Done 2026-09-24.** Files: `src/app/page.tsx` (`pageVariants`, screen
`AnimatePresence`), `src/components/ui/TextsReveal.tsx` (delay),
`docs/guest-site.md` (transitions section). `globals.css` unchanged.

**What changed**

- Screen `AnimatePresence` drops `mode="wait"`, so the swap is a crossfade.
  The new screen mounts on the tap and enters with opacity plus
  `transform: scale(0.97)→scale(1)`, 0.7 s, `[0.22, 1, 0.36, 1]`
  (`--ease-smooth-out`), with no delay. The old screen exits with opacity plus
  `scale(1.02)`, 0.45 s, `[0.4, 0, 1, 1]`. Both use a `transform` string, so
  they run on WAAPI.
- On exit, `zIndex: 0` and `pointerEvents: 'none'` apply instantly
  (`duration: 0` per value), and the entering screen has `zIndex: 1`. The new
  screen is always on top in both directions, and the fading screen cannot catch
  taps. Sampled mid-swap: old `0.96 z0 pe:none` with new `0.40 z1` at 74 ms, and
  old gone by ~510 ms.
- Reduced motion (`useReducedMotion`): opacity only, 0.15 s linear in and out.
- `TextsReveal` delay goes from 600/800 ms to **150/350 ms** (hero). The lines
  now rise while the screen fades in.

**Numbers** (production build, browser pane, warm cache, ~165 Hz display, no
CPU throttle; "visible" = the new screen layer has opacity > 0.1; "text" = its
first `.t-stagger` gets `is-shown`; both measured from the tap)

| Scenario | Before (T01) | After |
| --- | --- | --- |
| S2 Welcome → Our Story, cold (first Continue after reload) | visible ≥ 600 ms (0.5 s exit + 0.1 s delay; blank frame at ~0.6 s) · text 1,137 ms · long task 51 ms at +530 · slow 3/535 (49 ms) | visible **28 ms** · text **185 ms** · **no long tasks** · slow **0/409** (worst 24 ms) · CLS 0 |
| S2 repeat (warm), 2 runs | – | visible 30 / 30 ms · text 184 / 170 ms · no long tasks · slow 0/410, 0/412 |
| S2 back, Our Story → Welcome (hero), 2 runs | text 1,322 ms | visible 30 / 39 ms · text 372 / 371 ms · no long tasks · slow 0/389, 0/389 |
| S5 Gallery → Dress Code → Details (back ×2) | slow 1/713 (45 ms) | visible 43 / 25 ms · text 208 / 181 ms · no long tasks · slow 1/407 (30 ms), 0/412 · CLS 0 |
| Desktop 1345 px, Welcome ⇄ Our Story | – | visible 33 / 108 ms · text 190 / 369 ms · no long tasks · slow 3/391, 1/369 |

- **Scroll to top:** the Details container scrolled to 800 px, back to the
  previous screen → the new screen's scroll container is at 0 (it remounts).
  Checked on every swap above.
- **51 ms long task:** gone in all runs, including cold S2. React now mounts the
  new screen at the tap, while the WAAPI exit runs off the main thread, instead
  of mounting it after a 500 ms wait. No code targeted it directly. If it comes
  back on a phone, the next lever is `startTransition` around `setCurrentStep`.
- **Lint:** 95 errors / 52 warnings, the same as the baseline. The touched files
  have only the older `set-state-in-effect` at `page.tsx:53`. **Build:** OK.

**Not verified**

- **Reduced motion in the browser.** The pane cannot emulate
  `prefers-reduced-motion`. The reduced branch is checked by code only: opacity
  0.15 s, and `.t-stagger-line` already has `transition: none` under reduce.
- **S1 first Welcome text.** The pane cannot attach a probe before a reload.
  Estimate from the code and T03's numbers (`<main>` at 336 ms): the hero
  stagger now starts at ~690 ms instead of ~1,140 ms. The loader (500 ms fade)
  is at ~30% opacity then, so the text rises through the end of the crossfade.
  T07 should measure it.
- **Real phone.** No phone in this session (same as T01).
