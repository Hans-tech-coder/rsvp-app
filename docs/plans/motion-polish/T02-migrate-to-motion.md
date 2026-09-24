# T02: Migrate `framer-motion` → `motion`

**Skills:** `migration`, `motion` (follow its "Upgrading Motion" section: search
the codex for `upgrade` on platform `react` and read the whole page).

**Why:** The Motion skill and MCP docs assume `motion/react`. Framer Motion was
renamed to Motion, and the two packages must never both be installed. Doing
this before the fix tasks means all new code uses the right import.

This is mechanical work. A smaller or faster model is enough for it.

## Scope

- `package.json` / `package-lock.json`: add `motion` at the **same major** as
  the installed `framer-motion` (`^12.40.0` today), then remove `framer-motion`.
- Swap `from 'framer-motion'` → `from 'motion/react'` in these 18 files (check
  with `grep -rln framer-motion src`):
  `src/app/page.tsx`, `src/components/layout/CanvasMenu.tsx`,
  `src/components/layout/EmbeddedFooter.tsx`, `src/components/ui/TextsReveal.tsx`,
  and in `src/components/screens/`: `CuratedRegistryScreen`, `DetailsScreen`,
  `DressCodeScreen`, `EntourageScreen`, `EntranceScreen`, `FaqScreen`,
  `GalleryScreen`, `GiftSelectionModal`, `LoadingScreen`, `OurStoryScreen`,
  `RegistryScreen`, `RsvpCtaScreen`, `RsvpScreen`, `WelcomeScreen`.
- Change nothing else. No behavior or timing changes.

## Steps

1. Record the rollback point with `git rev-parse HEAD` in **Result**.
2. Install `motion`, swap the imports, and uninstall `framer-motion`.
3. Run `grep -rn framer-motion src package.json`. It must return nothing.
4. Run `npm run lint` and `npm run build`.
5. Smoke-test S1, S2 and S4 from the README in the browser pane. Everything must
   look the same as before.
6. Docs: in `PROJECT_GUIDE.md` §2, change "Framer Motion 12" to
   "Motion 12 (`motion/react`, formerly Framer Motion)". Update the matching
   mentions in `docs/conventions.md` and `docs/guest-site.md`. Delete rule 8
   from the plan README.

## Rollback

`git revert <commit>`, then `npm install`.

## Done when

`framer-motion` is absent from `src/` and `package.json`, the build passes, and
the smoke test shows no visual change.

## Result

**Status: ✅ done.**

- Rollback point: `c2114be14e53c2b68d3f15448d5f57c74d7c03da`.
- Upgrade guide read (`react/react-upgrade-guide`). From 12.40.0 the only step
  is the package swap plus the import swap. Stayed on major 12, not 13.
- Package: `motion` ^12.43.0 installed and `framer-motion` removed from
  `package.json`. The user ran the install because the npm registry was very
  slow in the agent session. `framer-motion` 12.43.0 still appears in
  `package-lock.json`, but only as a dependency of `motion` itself
  (`motion/react` re-exports it). That is expected, and it is not a second
  install.
- Imports: all 18 files import from `motion/react`. A comment in
  `TextsReveal.tsx` (line 21) that named framer-motion now says Motion.
  `grep -rn framer-motion src package.json` returns nothing.
- Lint: 95 errors and 52 warnings, **the same as at the rollback point**.
  A per-message diff against a lint of HEAD in a separate worktree found no
  new and no removed issues, and none mention motion. They are older problems
  (see the parking lot in `findings.md`).
- Build: `npm run build` passes (Next.js 16.2.9, Turbopack).
- Smoke test on the production build (375×812, plus a desktop check):
  S1 loading → Welcome, S2 Welcome → Our Story, and S4 menu → Gallery →
  circular gallery open and close all look and behave as before. No console
  errors. The roughly 1 s black wait on gallery open is the GSAP load that
  T01 already recorded (T06 scope). To reach Gallery from the menu, a fresh
  visitor must first unlock it: the menu disables screens above
  `localStorage.wedding_highestVisitedStep`.
- Docs: `PROJECT_GUIDE.md` §2, `docs/conventions.md`, `docs/guest-site.md`
  updated. Rule 8 removed from the plan README.
- Not committed: the user commits after review.
