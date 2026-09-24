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

(fill in at the end of the session)
