# T04: Fix the screen-swap transitions

**Skills:** `surgical-patch`, `motion`. Search the Motion docs for
`AnimatePresence` and `popLayout` before changing modes. Read `findings.md`
first. Only fix the causes it assigns to T04.

**Scope (T01 rewrites this line):** the sequential exit → enter → text-delay
chain (H3), plus the back/menu button motion if T01 flags it.

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

(fill in at the end of the session)
