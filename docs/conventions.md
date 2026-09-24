# Conventions

Match the code around you. These are the patterns the codebase already uses.

## Next.js 16 specifics

- Read `node_modules/next/dist/docs/` for any Next API before using it; this
  version differs from older Next.js.
- Request-time redirect logic lives in `src/proxy.ts` (default export `proxy`,
  plus `config.matcher`). Do not create `middleware.ts`.
- `cookies()` is async: `const store = await cookies()`.
- Server actions: file starts with `'use server'`, lives in `src/app/actions/`.
- Admin data pages use `export const dynamic = 'force-dynamic'`.
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
  `PopInNumber`, and friends.
- Timing values come from the CSS variables at the top of `globals.css`
  (`--duration-*`, `--ease-*`, `--distance-*`, `--scale-*`, `--blur-*`).
  The main ease is `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-smooth-out`).
- Canvas effects (`TwinkleSparks`, `InkRevealCanvas`) cancel their animation
  frame on unmount — keep that in any new canvas effect.
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

## Commits

Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:` …), imperative,
short subject. The `caveman-commit` skill writes these.
