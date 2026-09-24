# T03: Fix the loading → first screen handoff

**Skills:** `surgical-patch`, `motion`. Read `findings.md` first. Only fix the
causes it assigns to T03.

**Scope (T01 rewrites this line):** the causes behind S1 — the content swap
(H1) and a premature loading exit (H2), if T01 confirms them.

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
