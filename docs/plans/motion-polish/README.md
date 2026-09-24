# Motion polish plan: smooth transitions and luxury scroll

**Goal.** The guest site should feel calm and expensive. Today, transitions lag,
elements jump, and loading stutters. First find and fix the causes, then add
subtle scroll effects.

**Order matters.** Scroll effects on top of a janky base make it worse,
especially on guests' phones. Tasks T03–T06 are *provisional*: T01's findings
decide whether each one runs, changes, or is cancelled.

## Tracker

Status: ⬜ todo · 🟨 in progress · ✅ done · ⛔ blocked · ➖ cancelled

| ID | Task | Skills | Depends on | Status | Session notes |
| --- | --- | --- | --- | --- | --- |
| T00 | Install Motion AI Kit (skill + free MCP), update docs | – | – | ✅ | `.claude/skills/motion/`, `.mcp.json` (`motion` server only) |
| T01 | [Investigate the jank (read-only, baseline numbers)](T01-investigate-jank.md) | `investigate-first`, `motion` | T00 | ✅ | Worst: circular gallery open (216 ms task, 3.2 s GSAP wait). Load handoff is late (~5 s to text), not shifting. CLS ≈ 0. No phone check yet |
| T02 | [Migrate `framer-motion` → `motion` package](T02-migrate-to-motion.md) | `migration`, `motion` | T00 | ✅ | `motion` ^12.43.0 via `motion/react`; lint unchanged (95 errors, all older); build OK; S1/S2/S4 same as before |
| T03 | [Fix: loading → first screen handoff](T03-fix-loading-handoff.md) | `surgical-patch`, `motion` | T01, T02 | ✅ | First text ~4.7 s → 1.15 s; `<main>` at 336 ms; CLS 0; crossfade, no gap; mp3 no longer preloaded. Cold cache/slow network unverified |
| T04 | [Fix: screen-swap transitions](T04-fix-screen-swap.md) | `surgical-patch`, `motion` | T01, T02 | ✅ | Crossfade, no `mode="wait"`. S2/S5: new screen visible ~30 ms after tap, text ~180 ms (was 1.14 s); 0–1 slow frames; 51 ms long task gone. Reduced motion checked in code only |
| T05 | [Fix: layout shift in reveals and images](T05-fix-layout-shift.md) | `surgical-patch`, `ui-ux-pro-max` | T01, T02 | ✅ | CLS 0 in S1–S3, S5 (S4 only the T06 dot strip). Text reveals transform+opacity only; image blur-up kept, ends at `none`. Gallery tiles ~5.1 MB → 184 KB, Our Story → 261 KB via `sizes` + optimizer; RevealImage lazy by default |
| T06 | [Fix: heavy effects (canvas, gallery, slider)](T06-fix-heavy-effects.md) | `surgical-patch`, `motion` | T01, T02 | ✅ | Gallery open: 216 ms long task → none, 80 → 2 SVG images, CLS 0.0065–0.0165 → 0, content 3.2 s → 24 ms (GSAP preloaded, MotionPathPlugin dropped). Sparks: DPR ≤ 2, sprite glow, pauses off-screen. No phone check yet |
| T07 | [Gate: prove the jank is gone](T07-verify-jank-gate.md) | `verify-and-stop` | T03–T06 | ✅ | S1–S5 all pass (CLS 0, no long tasks, ≤ 1.1 % slow frames, Welcome text 690 ms, swaps 177–190 ms). Phone: Samsung A56, all smooth |
| T08 | [Scroll-motion foundation (shared primitives + tokens)](T08-scroll-foundation.md) | `lean-build`, `motion`, `ui-ux-pro-max` | T07 | ✅ | Owner chose reveal + hero parallax. `ScrollMotion.tsx`: `ScrollContainerProvider`, `ScrollReveal`/`ScrollRevealItem`, `Parallax` (±24 px); 4 scroll tokens. Proof on Our Story (Continue + first photo): S3 0.1 % slow frames, CLS 0. Reduced motion checked in code only |
| T09 | [Apply scroll effects: Welcome + Our Story](T09-scroll-welcome-story.md) | `lean-build`, `motion` | T08 | ⬜ | |
| T10 | [Apply scroll effects: Entourage + Details + Dress Code](T10-scroll-entourage-details-dresscode.md) | `lean-build`, `motion` | T08 | ⬜ | |
| T11 | [Apply scroll effects: Gallery + FAQ + Registry + RSVP](T11-scroll-gallery-faq-registry-rsvp.md) | `lean-build`, `motion` | T08 | ⬜ | |
| T12 | [Final verify, review, docs sync](T12-final-verify.md) | `verify-and-stop`, `caveman-review`, `caveman-commit` | T09–T11 | ⬜ | |

T01 and T02 do not depend on each other. T09, T10 and T11 do not depend on
each other and can run in any order.

## How to run a task (paste this into a fresh session)

```
Run task T0X from docs/plans/motion-polish/. Read README.md and that task file only.
```

## Rules for every task session

1. **Read only:** `PROJECT_GUIDE.md` (required by `AGENTS.md`), this README,
   your task file, `findings.md` when your task says so, and the files your task
   lists. Do not read other task files. Do not sweep the repo.
2. **Invoke the task's skills** before editing. For any Framer Motion API
   question, use `search-motion-docs` from the `motion` MCP server (platform
   `react`) rather than memory.
3. **Stay in scope.** If you find something outside the task, add a line to
   `findings.md` under "Parking lot". Do not fix it.
4. **Measure the same way every time** (see below). Numbers go in the task
   file's **Result** section, so T07 and T12 can compare against T01.
5. **Verify:** `npm run lint`, `npm run build`, then check the affected screens
   in the browser pane at phone width (375×812) *and* desktop. Also check with
   `prefers-reduced-motion: reduce` whenever motion changed.
6. **Close out:** fill the task file's **Result** section, set the tracker row
   to ✅ (or ⛔ with the reason), update any `docs/` file the change touches
   (see the end of `PROJECT_GUIDE.md`), and commit with `caveman-commit`. Commit
   only the task's own files.
7. **Out of budget mid-task?** Set the row to 🟨, write what is done and what is
   next in **Result**, and stop. The next session continues from there.

## Measurement protocol (same for every task)

Measure on a **production build**. The dev server adds overhead and React
StrictMode double-renders, which would hide real gains.

```bash
npm run build
```

```bash
npm run start
```

Open `http://localhost:3000` in the browser pane at 375×812. Paste this with the
JavaScript tool **before** reloading (it uses `buffered: true`, so a reload right
after also works):

```js
window.__perf = { cls: 0, shifts: [], longtasks: [], slowFrames: 0, frames: 0 };
new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) {
  __perf.cls += e.value;
  __perf.shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime),
    nodes: (e.sources || []).map(s => s.node ? (s.node.id || String(s.node.className).slice(0, 60) || s.node.nodeName) : '?') });
} }).observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver(l => { for (const e of l.getEntries())
  __perf.longtasks.push({ d: Math.round(e.duration), t: Math.round(e.startTime) });
}).observe({ type: 'longtask', buffered: true });
// Count frames > 25 ms for `ms` milliseconds; start it, then trigger a transition.
window.__fps = (ms = 3000) => new Promise(res => { let last = performance.now(), end = last + ms;
  __perf.slowFrames = 0; __perf.frames = 0;
  (function tick(now) { __perf.frames++; if (now - last > 25) __perf.slowFrames++; last = now;
    now < end ? requestAnimationFrame(tick) : res({ frames: __perf.frames, slow: __perf.slowFrames }); })(last); });
```

Record per scenario: **CLS**, the **top 3 shifts** with their nodes, **long tasks
over 50 ms**, and **slow frames / total frames** during the transition.
Scenarios:

- **S1:** cold load → loading screen → Welcome (hard reload, cache disabled)
- **S2:** Welcome → Our Story (tap Continue)
- **S3:** scroll Our Story to the bottom
- **S4:** jump via the menu to Gallery, open and close the circular gallery
- **S5:** Details → Dress Code → Gallery with the back button

The browser pane cannot throttle the CPU. For a phone-like check, also open the
production URL on a real mid-range phone and describe what you feel in one line.

## Out of scope

MotionScore audits, Motion+ example source, and the transition editor all
need Motion+, which is not set up. Admin pages are not part of this plan.
