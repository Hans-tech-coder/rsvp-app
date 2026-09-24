# T03: Fix the loading → first screen handoff

**Skills:** `surgical-patch`, `motion`. Read `findings.md` first. Only fix the
causes it assigns to T03.

**Scope (set by T01):** S1 is slow, not shifting (CLS ≈ 0; H1 refuted). Fix
the chain that puts Welcome text at ~5 s: (a) the 12 *sequential* `getDoc`
calls in `WeddingContentContext.tsx:30-41` (done at ~2.0 s, parallelize);
(b) the 1.5 s loading exit that must finish before `<main>` mounts under the
outer `AnimatePresence mode="wait"` (`page.tsx:156`, `LoadingScreen.tsx:12`);
(c) the Welcome hero image only requested at 3.46 s, after the loading exit
(preload it while loading); (d) `bg-music.mp3` (5.4 MB, `preload="auto"` in
`AudioPlayer.tsx:91`) downloading at t = 45 ms and competing for bandwidth.

## Files

`src/components/screens/LoadingScreen.tsx`, `src/contexts/WeddingContentContext.tsx`,
the loading branch of `src/app/page.tsx` (~lines 150–165), and the fonts in
`src/app/layout.tsx`.

## Direction (adjust to the evidence)

- Keep the loading screen up until content, fonts and the Welcome hero image
  are ready. Cap the wait (for example 2.5 s) so a slow network never traps
  guests on the loader.
- Crossfade from the loader into Welcome instead of leaving a blank gap.
- Never show default text that gets replaced a moment later.
- Use the motion tokens in `globals.css`. Do not add new hard-coded timings.

## Done when

- S1 CLS is **below 0.05** and no shift comes from Welcome content.
- There is no visible text or image swap on a cold load, including with cache
  disabled.
- Lint and build pass. The Result section shows before/after numbers against
  the baseline.

## Result

**Done 2026-09-24.** Changes:

- (a) `WeddingContentContext.tsx`: the 12 `getDoc` calls run through `Promise.all`.
  Error handling is unchanged: any failure falls back to the JSON defaults.
- (b) `page.tsx`: the outer `AnimatePresence` no longer uses `mode="wait"`, so
  `<main>` mounts under the loader. `LoadingScreen.tsx`: the outer element is a
  plain `div` whose exit is a CSS opacity transition on `--duration-very-slow` /
  `--ease-in-out`. `usePresence` removes it on `transitionend`, or at once under
  reduced motion. This replaces the hard-coded 1.5 s Motion exit.
- (c) `page.tsx`: the loader stays until content, `document.fonts.ready` and
  (on step 0) the Welcome hero are decoded. The hero is preloaded with
  `getImageProps` using the same srcset and sizes as `<Image fill>`, so Welcome
  reuses it. There is exactly one `/_next/image` request. The font and image wait
  is capped at `LOADER_MAX_WAIT_MS = 2500` ms after navigation. Content is still
  always awaited, so default text never flashes.
- (d) `AudioPlayer.tsx`: `preload="none"`. The mp3 downloads on the first
  `.play()` (first tap).

**Measurement.** Production build, 375×812 and desktop, warm cache (same as T01).
The pane was *hidden* this session, which pauses rAF, so the JS tool's ~5 s
post-reload lag and paused frames made the protocol snippet unusable for S1.
Instead, a same-origin page loaded `/` in a full-size iframe and timed DOM
milestones with a `MutationObserver`. Resource and layout-shift data came from
the iframe's buffered timeline. Screenshots were taken back to back so frames
advanced.

| S1 metric (ms after navigation) | Baseline (T01) | After T03 |
| --- | --- | --- |
| Firestore content done | 2,009 (24 requests, one after another) | ≤ 336 (3 Listen-channel requests; `<main>`, which needs content, mounted at 336) |
| Welcome hero requested | 3,456 | 351–378 (preload, while loader is up) |
| `<main>` mounts | ~3,500 (after the 1.5 s exit) | **336** (375 wide) / 355 (desktop) |
| Loader removed | ~3,500 | 859 / 885 (500 ms crossfade) |
| First Welcome text `is-shown` | ~4,500–5,000 | **1,148** / 1,182 |
| `bg-music.mp3` during load | 5,456 KB from t = 45 | not requested |
| CLS | 0.0000 | **0** (no shifts) |
| Long tasks > 50 ms | none | none |
| Slow frames | not measurable | not measurable (hidden pane) |

- Frames show a crossfade: the Welcome hero and sparkles are visible through
  the fading loader, with no blank dark gap. No text or image swaps.
- Reduced motion (`matchMedia` overridden in the iframe before hydration): the
  loader is removed 9 ms after `<main>` mounts.
- `npm run lint` on the four touched files: 3 errors and 2 warnings, **the same
  5 as before the change** (all older, see the parking lot). `npm run build` OK.
- **Not verified:** a truly cold cache, and the 2.5 s cap on a slow network. The
  pane cannot disable the cache or throttle. T07 should check both on a phone.
- The remaining ~0.8 s from `<main>` mount to the first text is Welcome's own
  entrance (`delayChildren`, `TextsReveal` 800 ms). That is T04's scope (H3).
