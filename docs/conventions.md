# Conventions

Match the code around you. These are the patterns the codebase already uses.

## Next.js 16 specifics

- Read `node_modules/next/dist/docs/` for any Next API before using it; this
  version differs from older Next.js.
- Request-time redirect logic lives in `src/proxy.ts` (default export `proxy`,
  plus `config.matcher`). Do not create `middleware.ts`.
- `cookies()` is async: `const store = await cookies()`.
- Server actions: file starts with `'use server'`, lives in `src/app/actions/`.
- Admin data pages use `export const dynamic = 'force-dynamic'` and call
  `await requireAdminPage()` first. Every admin server action calls
  `await requireAdmin()` as the first line inside its `try` (see
  `docs/security.md`).
- Remote images must be on a host listed in `next.config.ts`
  (`images.unsplash.com`, `firebasestorage.googleapis.com`).

## Files and naming

- Imports use the `@/` alias (`@/components/...`, `@/lib/...`).
- Guest screens: `src/components/screens/<Name>Screen.tsx`, **named export**
  `export function <Name>Screen({ onContinue }: <Name>ScreenProps)`.
- Admin editors: `src/app/admin/content/<Name>Editor.tsx`, named export.
- Admin data pages: default export in `page.tsx`, client part in
  `<Name>Client.tsx` (default or named export — follow the folder).
- Shared types in `src/types/index.ts`.

## Server actions

- Wrap the body in `try/catch`; return `{ success: true, ...data }` or
  `{ success: false, error: string }`. Never throw to the client.
- Use `getAdminDb()` from `@/lib/firebase/admin` — call it inside the function,
  not at module top level.
- Any read-then-write on counts or status uses `runTransaction`; multi-doc
  writes without reads use `batch()`.
- Timestamps: `FieldValue.serverTimestamp()` on write; convert with
  `.toDate().toISOString()` before passing to a client component.

## Guest-site styling

- Tailwind v4 theme tokens from `globals.css` `@theme`:
  - colors `wedding-cream`, `-ivory`, `-champagne`, `-beige`, `-burgundy`,
    `-burgundydark`, `-burgundylight`, `-deepburgundy`, `-dark`, `-softdark`,
    `-charcoal`, `-gold`, `-goldlight`, `-golddark`
    (use as `bg-wedding-dark`, `text-wedding-gold`, …)
  - fonts `font-cinzel` (headings, uppercase titles), `font-cormorant`
    (elegant body/italic), `font-inter` (UI text, default)
- Dark background, cream text is the base look. Do not introduce new hex colors
  in components; add a token to `@theme` if one is truly needed.
- Mobile-first; the site is used mostly on phones. Use `100dvh`, not `100vh`.
- Hide scrollbars with `.no-scrollbar` where the design needs it.

## Motion

- Screen-level motion: Motion 12 (`motion.div`, `AnimatePresence`), imported
  from `motion/react`. The old `framer-motion` package is gone; never add it back.
- Text, number, and skeleton reveals: CSS classes in `globals.css`
  (`.t-stagger`, `.t-digit`, `.t-skel`) driven by `TextsReveal`,
  `PopInNumber`, and friends. Text reveals move with `transform` and
  `opacity` only; `filter: blur` is kept for the image blur-up and ends at
  `filter: none`, and for the slider cards' hover dim (`.t-view-*`, see
  `ViewOverlay.tsx`), which sits on the image wrapper. Hover-only effects go
  under `@media (hover: hover) and (pointer: fine)` so they never stick on
  touch. Do not add a permanent `will-change`.
- Focus pattern: anything clickable is keyboard-reachable. A non-button
  element that opens something (e.g. a photo card) gets role="button",
  `tabIndex={0}`, an `aria-label`, Enter on keydown and Space on keyup
  (`viewCardProps` in `ViewOverlay.tsx` does this). Its hover reveal is
  repeated for `:focus-visible` *outside* the hover media query, with a
  visible gold ring (`--color-wedding-gold`); draw the ring inside the
  element when a scroll container would clip it. React to keyboard focus
  only when the target `matches(':focus-visible')`, so mouse and touch
  focus change nothing. A modal moves focus in on open, traps Tab, and
  returns focus to its opener on close (see `circular-image-gallery.tsx`).
  Decorative duplicates (loop copies) are `aria-hidden` with `tabIndex={-1}`.
  The same role also makes the wedding-ring cursor tilt over it; a clickable
  element with no role gets `data-cursor="hover"` instead (`WeddingCursor.tsx`).
- Timing values come from the CSS variables at the top of `globals.css`
  (`--duration-*`, `--ease-*`, `--distance-*`, `--scale-*`, `--blur-*`).
  The main ease is `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-smooth-out`).
- Scroll motion: use the primitives in `src/components/ui/ScrollMotion.tsx`,
  not ad-hoc `whileInView`/`useScroll`. The page never scrolls, so a scrolling
  screen puts a ref on its own scroll element and wraps its content in
  `<ScrollContainerProvider containerRef={ref}>`; the primitives read it for
  `viewport.root` and `useScroll({ container })`.
  - `<ScrollReveal delay?>` fades and rises once (16 px, 800 ms,
    `--ease-smooth-out`). `<ScrollReveal stagger>` instead staggers its direct
    `<ScrollRevealItem>` children (120 ms apart, or pass seconds).
  - Columns that sit side by side on desktop but stack on phones: give each
    its own `<ScrollReveal>` and delay the second by
    `SCROLL_MOTION.revealStagger`, instead of one `stagger` parent — a stagger
    parent would reveal the stacked column while it is still off-screen.
  - Long lists (e.g. FAQ questions): same reason — one `<ScrollReveal>` per
    item, with a light stagger from a capped index delay
    (`Math.min(index * 0.06, 0.24)` in `FaqScreen`), so the items visible
    together are offset and later ones never lag.
  - `<Parallax distance?>` drifts its layer on `y` by ±24 px (max 40) while it
    crosses the view. Give it classes that make it taller than an
    `overflow-hidden` parent by `distance` each side (e.g.
    `absolute inset-x-0 -inset-y-6`). Images and decorative layers only.
  - Tokens: `--duration-scroll-reveal`, `--distance-scroll-reveal`,
    `--stagger-scroll-reveal`, `--distance-parallax` in `globals.css`,
    mirrored by `SCROLL_MOTION`; change both together.
  - Rules: no bounce; reveals play once; text only reveals, never parallax;
    at most one parallax element per viewport; no scroll effects on form
    inputs; never stack a primitive on an element that already has
    `whileInView` (replace it). Under reduced motion every primitive renders a
    plain static `div`.
  - `ScrollReveal` triggers at `viewport.amount: 0.2`, so a block taller than
    5× its scroll container never reveals. Wrap per card/column/item, as the
    screens do, rather than around one long block.
- Reduced motion: any new motion must respect `prefers-reduced-motion`
  (`useReducedMotion` in Motion code, a `@media (prefers-reduced-motion:
  reduce)` rule in CSS). Known older exceptions are listed in
  `docs/current-state.md`.
- Canvas effects (`TwinkleSparks`, `InkRevealCanvas`) cancel their animation
  frame on unmount and cap the device pixel ratio at 2 — keep both in any new
  canvas effect. `TwinkleSparks` also pauses while off-screen or the tab is
  hidden, and draws its glow from pre-rendered sprites instead of setting
  `shadowBlur` every frame. `DepthParallaxScene` (WebGL) caps the ratio at 1.5
  instead, since every pixel samples the photo twice, and pauses the same way.
- Before writing Motion code, use the `motion` skill
  (`.claude/skills/motion/`). It searches the live Motion docs through the
  free `motion` MCP server in `.mcp.json`, so API details come from the docs
  rather than memory. The Motion+ features (MotionScore audits, example
  source, transition editor) are not set up.

## Admin styling

- Neutral palette: `bg-white dark:bg-zinc-900`, borders `gray-200 /
  zinc-800`, primary buttons `bg-gray-900 text-white dark:bg-zinc-100
  dark:text-zinc-900`. Light/dark via `@teispace/next-themes` (`ThemeToggle`).
- Icons: `lucide-react`.
- Confirmations and alerts: `AdminModal` (never `window.confirm`; some old code
  still uses `alert()` for errors).
- Tables: client-side search/filter + `TablePagination`.
- Sortable lists: `@dnd-kit/core` + `@dnd-kit/sortable`, ids from `nanoid`.

## Verification

There are no automated tests. Before calling work done:

1. `npm run lint`
2. `npm run build` (type errors show here)
3. Run `npm run dev` and check the change in the browser at phone width
   (guest site) or in `/admin` (admin). The `verify-and-stop` skill covers
   this.

### Motion performance check

Run this after any change to motion, a screen swap, loading, images, or
scrolling on the guest site, to catch jank coming back.

Measure on a **production build**. The dev server adds overhead and runs
StrictMode double renders, which hide real numbers. Run `npm run build`, then
`npm run start` (launch config `prod`). Open `http://localhost:3000` in the
browser pane at 375×812 and paste this with the JavaScript tool (it uses
`buffered: true`, so a reload right after still counts):

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

| Scenario | Pass when |
| --- | --- |
| S1 cold load → loading screen → Welcome | CLS < 0.05, first Welcome text ≤ ~700 ms |
| S2 Welcome → Our Story (tap Continue) | first new text ≤ ~300 ms after the tap |
| S3 scroll Our Story top → bottom | slow frames ≤ 5 % |
| S4 menu → Gallery, open/close the circular gallery | no long task > 50 ms |
| S5 Details → Dress Code → Gallery with the back button | same as S2 |

All scenarios also need CLS < 0.05, no long task > 50 ms, and slow frames
≤ 5 %.

- The step is saved in `localStorage`. Reset `wedding_currentStep` before S1,
  and raise `wedding_highestVisitedStep` so the menu can reach Gallery for S4.
- Reload with `location.reload()`, not `navigate`. The pane hides the tab
  during `navigate`, which pauses rAF and skips FCP.
- The pane cannot throttle the CPU or emulate `prefers-reduced-motion`. Check
  reduced motion in the code, and check the feel on a real phone.
- **Baseline (2026-09-24, after the jank fixes and scroll effects):** CLS 0 in
  every scenario, no long tasks, at most 1.6 % slow frames, and new text
  161–220 ms after a tap. Smooth on a real Samsung Galaxy A56. The full tables
  are in git: `git show 308e0a6:docs/plans/motion-polish/findings.md`.

## Commits

Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:` …), imperative,
short subject. The `caveman-commit` skill writes these.

## Plans

- Implementation plans for features and fixes live in `docs/plans/<name>/`
  (a `README.md`, plus task files if the plan is split). The folder is in
  `.gitignore`, so plans stay on this machine and never reach a commit or push.
- Never commit a plan, and never force-add one (`git add -f`). Do not link a
  plan from a tracked doc as if it will exist later.
- Before closing a plan, move anything durable into the matching `docs/` file
  (see "Keeping this guide updated" in `PROJECT_GUIDE.md`): results, baselines,
  quirks, parking-lot items. Then delete the plan folder.
- Plans are local, so a fresh git worktree or another machine will not have
  them. Run a plan from this checkout.
- Older plans committed before this rule are only in git history (e.g. the
  motion-polish baseline cited under Verification).
