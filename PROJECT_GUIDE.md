# Hans & Czay Wedding — Project Guide

**Read this file before your first edit in a session.** It is the index to the
briefing on what this app is, how it is built, and the rules it follows, so a
fresh session can start work without reading the whole codebase.

It is short on purpose. The detailed parts live in `docs/` and are read **only
when a task touches them**. The code is the authority when the two disagree —
and when they disagree, fix the doc in the same change.

---

## 0. Where the rest of the guide lives

| If the task… | Read |
| --- | --- |
| needs to find **which files a feature lives in** (start here, always) | [`docs/FEATURE-MAP.md`](docs/FEATURE-MAP.md) |
| changes the **guest-facing site** — a screen, the step flow, the menu, the RSVP lock, music, animation | [`docs/guest-site.md`](docs/guest-site.md) |
| changes **editable text or images**, adds a field an admin can edit, touches an `*Editor.tsx` | [`docs/content-system.md`](docs/content-system.md) |
| changes a **Firestore collection or field**, a Storage path, or `wedding-content.json` | [`docs/data-model.md`](docs/data-model.md) |
| changes the **admin portal** — invites, guests, gifts, registry claims, login | [`docs/admin.md`](docs/admin.md) |
| changes **who can read or write what** — auth, session, rules, server actions | [`docs/security.md`](docs/security.md) |
| writes **any code** — naming, styling, colors, motion tokens, patterns | [`docs/conventions.md`](docs/conventions.md) |
| needs to know **known bugs, quirks, and unused code** | [`docs/current-state.md`](docs/current-state.md) |

---

## 1. What the product is

A **single-couple wedding website with RSVP and gift registry**, plus a private
admin portal. Production URL: `https://hans-czay-wedding.vercel.app`.

| Who | What they do | Where |
| --- | --- | --- |
| **Guests** (no account) | Step through a 10-screen story (welcome → our story → entourage → details → dress code → gallery → FAQs → registry → RSVP call-to-action → RSVP form). Unlock the RSVP form with a one-time 6-character invite code. Claim a registry gift. | `/` (one page, screens swap in place) |
| **Admins** (Firebase Auth user whose UID is in `admins`) | Generate and send invite codes, see RSVPs, manage registry gifts and claims, edit every text and image on the guest site. | `/admin/**` |

---

## 2. Stack and hard constraints

- **Next.js 16.2 (App Router), React 19.2, TypeScript.** This is *not* the
  Next.js in your training data. Read the matching guide in
  `node_modules/next/dist/docs/` before using a Next API. Example: route
  protection lives in **`src/proxy.ts`** (the old `middleware.ts` name is
  deprecated).
- **Tailwind CSS v4** (config lives in `src/app/globals.css` under `@theme`,
  there is no `tailwind.config.js`).
- **Motion 12** (`motion/react`, formerly Framer Motion) for screen
  transitions; CSS classes in `globals.css` for text/number reveals.
- **Firebase 12** client SDK (browser reads, admin content writes, Auth) and
  **firebase-admin 12** (server actions and server pages).
- **Vercel Blob** (`@vercel/blob`) for admin image uploads; Hobby quota is
  shared with the account's other projects (see `docs/data-model.md`).
- **Node 22.x.** Deployed on **Vercel**. No test suite exists — verify with
  `npm run lint`, `npm run build`, and the running app.

### Commands

```bash
npm run dev            # local dev server on :3000
npm run build          # production build (the main correctness gate)
npm run lint           # eslint
npm run sync-content   # PULL Firestore websiteContent -> src/data/wedding-content.json
node scripts/add-admin.js <email>   # needs GOOGLE_APPLICATION_CREDENTIALS
```

### Environment (`.env.local`, template in `.env.local.example`)

`NEXT_PUBLIC_FIREBASE_*` (six client keys) and `FIREBASE_ADMIN_PROJECT_ID`,
`FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, and `BLOB_READ_WRITE_TOKEN`
(from the connected Blob store, `vercel env pull`). Never print,
commit, or paste their values.

---

## 3. Directory map

```
src/
  app/
    page.tsx                 guest site: the whole 10-step flow (client component)
    layout.tsx               fonts, theme script, OG metadata (reads Firestore), <AudioPlayer/>
    globals.css              Tailwind @theme colors/fonts + motion tokens + reveal CSS
    actions/                 server actions: rsvp.ts, registry.ts, admin.ts, auth.ts
    api/download/route.ts    image download proxy (used by DetailsScreen)
    api/upload/route.ts      admin-only Vercel Blob upload token
    api/logout/route.ts      clears the session cookie, redirects to /admin/login
    admin/                   admin portal (layout.tsx = sidebar)
      content/               Content manager: page.tsx (tabs) + one *Editor.tsx per screen
      components/            AdminModal, TablePagination
      dashboard|invites|guests|gifts|registry|login/
  components/
    screens/                 one file per guest screen (+ GiftSelectionModal, LoadingScreen)
    ui/                      reusable visual pieces (TextsReveal, RevealImage, sliders, gallery…)
    effects/                 TwinkleSparks (used), FallingPetals (unused)
    layout/                  CanvasMenu (step menu), EmbeddedFooter
  contexts/WeddingContentContext.tsx   JSON defaults + Firestore overrides -> useWeddingContent()
  data/wedding-content.json  default/fallback content for every screen
  lib/firebase/              client.ts (browser SDK), admin.ts (admin SDK, server only)
  lib/blob/uploadImage.ts    compress + upload an image to Vercel Blob (all editors)
  lib/requireAdmin.ts        admin check for server actions and admin pages (server only)
  types/index.ts             Guest, RegistryGift, GiftSelection, AdminUser
  proxy.ts                   /admin/** redirect when no session cookie
scripts/                     sync-content.js, add-admin.js
firestore.rules, storage.rules, firebase.json   deployed with the Firebase CLI
legacy/                      old static site — reference only, not built
```

---

## 4. Standing rules

1. **Work from the map, not from a sweep.** Open `docs/FEATURE-MAP.md`, go to
   the 2–3 files it names. Do not Glob/Grep the whole repo to get oriented.
2. **Read ranges, not whole files.** `grep -n` the symbol, then read around it.
   The files over 400 lines are listed at the bottom of the feature map.
3. **Smallest correct change.** Touch only the files the task needs. Do not
   reformat, rename, or "clean up" neighbours.
4. **Match the screen/editor pair.** A new editable field touches four places —
   see the checklist in `docs/content-system.md`. Missing one means the admin
   saves a value the site never shows (or the reverse).
5. **Mutations of guests, gifts, and selections go through server actions**
   in `src/app/actions/` with `firebase-admin`. Only `websiteContent` is written
   from the browser (by admin editors).
6. **Keep the guest site mobile-first.** Every screen fills `100dvh`; check
   phone width first.
7. **One feature per session.** Finish, verify, then start fresh.
8. **Plans are never committed.** Implementation plans go in
   `docs/plans/<name>/`, which is git-ignored. Anything that must outlive the
   plan goes into the matching `docs/` file. See Plans in
   `docs/conventions.md`.

---

## Keeping this guide updated

A change that adds or alters any of the following must update the doc **in the
same change**:

| Change | Update |
| --- | --- |
| new file, moved file, new screen/editor/action/route | `docs/FEATURE-MAP.md` |
| new or changed screen, step order, guest flow | `docs/guest-site.md` |
| new editable field, new `websiteContent` doc, editor behavior | `docs/content-system.md` + `docs/data-model.md` |
| Firestore collection/field, Storage path | `docs/data-model.md` |
| admin page or admin action | `docs/admin.md` |
| auth, rules, session, anything access-related | `docs/security.md` |
| new shared component, token, or pattern | `docs/conventions.md` |
| bug found but not fixed, quirk, removed code | `docs/current-state.md` |

A guide that has drifted is worse than none: the next session will trust it.
