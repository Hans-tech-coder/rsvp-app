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

(fill in at the end of the session)
