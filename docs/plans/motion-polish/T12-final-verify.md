# T12: Final verify, review, docs sync

**Skills:** `verify-and-stop`, `caveman-review`, `caveman-commit`.

## Steps

1. Build for production and run S1–S5, plus a full scroll of every scrolling
   screen. Add a **Final** column to the tables in `findings.md` and compare it
   with the baseline.
2. Check reduced motion on every screen.
3. Do the real-phone check on the deployed preview and describe it in one line.
4. Review the whole plan's diff with `caveman-review`. The base is the commit
   that added this plan:
   `git log --reverse --format=%h -- docs/plans/motion-polish/README.md`, then
   take the first line.
   Fix only real defects, and write down anything else in the Parking lot.
5. **Docs sync.** `docs/guest-site.md` (Transitions and motion section),
   `docs/conventions.md` (Motion section), and `docs/FEATURE-MAP.md` must
   describe the final state. Move any unresolved Parking-lot items to
   `docs/current-state.md`.
6. Set every tracker row to its final status. Mark the plan **Done** at the top
   of the README.

## Done when

All thresholds hold, the docs match the code, and the review found no
unaddressed defects. Deploying stays the owner's call.

## Result

**Status: done, except the real-phone check (owner, after deploying).**
Not committed; the owner commits.

- **Gates:** `npm run build` passes. `npm run lint` has 89 errors and 51
  warnings, down from 95/52 before the plan. None are new: every one in the
  plan's files is an older pattern (`set-state-in-effect`, `no-explicit-any`,
  unused vars).
- **S1–S5 and full scroll** (production build, phone and desktop): every row
  passes the T07 thresholds. CLS 0 (S1 0.00001, a countdown digit), no long
  task > 50 ms, slow frames ≤ 1.6 %, first new text 161–220 ms after a tap.
  Every `ScrollReveal` fired on every screen. Numbers are in `findings.md` →
  Final.
- **Reduced motion:** checked in code only, because the pane cannot emulate
  it. The plan's motion honours it: swaps, loader, CSS reveals, and all
  `ScrollMotion` primitives. Older motion that ignores it is now listed in
  `docs/current-state.md`.
- **Real phone:** not done. There was no phone in this session, and T08–T11
  have to reach the deployed preview first (the owner deploys).
- **Review** (`caveman-review`, `62c7b8e..HEAD`, src only): no real defects.
  The riskier spots checked out. Details and Registry cards stay equal height
  inside their `ScrollReveal` wrappers (518/518 px, 398/398 px). The loader
  cap handles a content fetch slower than 2.5 s. The `Parallax` layer overhang
  (`-inset-y-6`) matches its 24 px distance. There were three nits, all older
  or harmless, and they went to the Parking lot and to `current-state.md`:
  - `FaqScreen` cards keep `transition-all` on a Motion element.
  - The circular gallery's `closing` state never resets.
  - Some older motion ignores reduced motion.
- **Docs sync:** `guest-site.md` covers the loader wait, the scroll effects per
  screen, the circular-gallery loading, the scroll tokens, and reduced motion.
  `conventions.md` adds the `ScrollReveal` `amount` limit and a reduced-motion
  rule. `current-state.md` updates Shipped and moves every open Parking-lot
  item to Known issues. `FEATURE-MAP.md` lists `page.tsx` (464 lines) as over
  400.

