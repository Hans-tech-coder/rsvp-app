# T07: Gate — prove the jank is gone

**Skills:** `verify-and-stop`. **Do not edit product code.**

## Steps

1. Build for production and run S1–S5 from the README measurement protocol.
2. Add an **After fixes** table to `findings.md`, next to the baseline.
3. Check each scenario against its threshold:
   - CLS below 0.05
   - no long tasks over 50 ms during transitions
   - slow frames at or below 5%
   - S2 and S5: first new content within ~300 ms of the tap
4. Do the real-phone check on the deployed preview or production and describe
   it in one line.
5. For any failure, set the owning task (T03–T06) back to ⬜ in the tracker and
   add a one-line reason in its Result section. T08 stays blocked until every
   row passes.

## Done when

Every scenario passes, or each failure is sent back to its owning task with a
reason.

## Result

Session 2026-09-24. No product code changed.

- `npm run build`: OK. Measured with `npm run start` (launch config `prod`) in
  the browser pane at 375×812. Full table: `findings.md` → "After fixes".
- **S1–S5 all pass** every threshold. CLS is 0 everywhere, there are no long
  tasks over 50 ms, and the worst slow-frame rate is 1.1 % (menu → Gallery).
  First Welcome text shows at 690 ms (was ~4.5–5 s). S2 and S5 show new text
  in 177–190 ms (was 1.1–1.3 s). The circular gallery opens with no long task
  (was 216 ms) and a worst frame of 51–62 ms (was 286 ms).
- No task was sent back to T03–T06.
- **Real-phone check: pass.** The owner tested on a Samsung Galaxy A56 against
  the production URL, and every scenario felt smooth. T08 is unblocked.
- Method notes, which also apply to T12: the step is saved in `localStorage`,
  so reset `wedding_currentStep` before S1 and raise
  `wedding_highestVisitedStep` for S4. Reload with `location.reload()`, because
  the pane hides the tab during `navigate`, which pauses rAF and skips FCP.
