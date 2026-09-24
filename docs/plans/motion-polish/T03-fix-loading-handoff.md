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

(fill in at the end of the session)
