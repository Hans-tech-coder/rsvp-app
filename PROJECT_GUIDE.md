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
admin portal. Production URL: `https://hans-czay-wedding.vercel.app` (`/`
redirects to the event, `/hans-and-czay`). Being turned into a multi-event
platform: data and guest URLs are already per event (`/<eventId>`).

| Who | What they do | Where |
| --- | --- | --- |
| **Guests** (no account) | Step through up to 10 screens (by default welcome → our story → entourage → details → dress code → gallery → FAQs → registry → RSVP call-to-action → RSVP form; admins reorder, hide and rename them). Unlock the RSVP form with a one-time 6-character invite code. Claim a registry gift. | `/<eventId>` (one page, screens swap in place; `/` → default event) |
| **Admins** (Google sign-in, by invite only; per event an **organizer** or a **client**, and platform **owners** who open every event) | Pick the event to work on (sidebar switcher; **All Events** lists them with RSVP counts and creates (a wizard: Wedding, Debut, Birthday / Anniversary or Corporate / Seminar template, names, date, venue, palette), duplicates, re-links, archives and, for owners, deletes events). Generate and send invite codes, see RSVPs, manage registry gifts and claims, edit every text, image, color, font, the music, and which screens show in what order on the guest site. Edits are drafts (autosaved) until Publish; a preview shows the draft site and History restores earlier published versions. A **visual builder** (tablet and wider) shows the draft site with the sections and editors around it: click a section to edit it, live, with undo / redo. Clients cannot change the design (section order, colors & fonts, music) unless the event allows it; organizers manage the event's **Team** (members, invites, that switch, the activity log). One person at a time in the builder (Take over). | `/admin/**` |

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
- **Firebase 12** client SDK (guest registry reads, admin content writes, Auth) and
  **firebase-admin 12** (server actions and server pages).
- **Vercel Blob** (`@vercel/blob`) for admin image uploads; Hobby quota is
  shared with the account's other projects (see `docs/data-model.md`).
- **Node 22.x.** Deployed on **Vercel**. No real test suite: the only tests
  are Vitest unit tests for the `/api/download` allowlist (`npm test`). Verify
  with `npm run lint`, `npm run build`, and the running app.

### Commands

```bash
npm run dev            # local dev server on :3000
npm run build          # production build (the main correctness gate)
npm run lint           # eslint
npm test               # vitest, src/ only (lib unit tests)
npm run sync-content   # PULL Firestore events/hans-and-czay/content -> src/data/wedding-content.json
node scripts/migrate-to-events.js [--write [--overwrite] | --verify]   # copy root collections into the event (F3)
node scripts/migrate-content-f5.js [--write | --verify] [--dump <file>]   # add generic content fields (hosts, groups, venues, guidelines) to old docs (F5)
node scripts/add-admin.js <email> --super | --event <id> [--role organizer|client]   # invite an owner or an event member; reads FIREBASE_ADMIN_* from .env.local
node scripts/migrate-members-f10.js [--write | --verify] [--event <id>] [--role organizer|client]   # give pre-F10 admins and invites a role in an event (F10)
```

### Environment (`.env.local`, template in `.env.local.example`)

`NEXT_PUBLIC_FIREBASE_*` (six client keys) and `FIREBASE_ADMIN_PROJECT_ID`,
`FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `BLOB_READ_WRITE_TOKEN`
(from the connected Blob store, `vercel env pull`), and `GMAIL_USER` +
`GMAIL_APP_PASSWORD` (sender for RSVP confirmation emails; optional, emails are
skipped without them). Optional, not secret: `NEXT_PUBLIC_DEFAULT_EVENT_ID`
(where `/` goes; default `hans-and-czay`) and `NEXT_PUBLIC_SITE_URL` (public
address for links that leave the site; on Vercel the production domain is used
without it). Never print, commit, or paste the secret values.

---

## 3. Directory map

```
src/
  app/
    page.tsx                 redirects / to the default event
    [event]/page.tsx         one event's guest site: server read, metadata, ISR cache -> EventSite.tsx (providers, <AudioPlayer/>)
    [event]/preview/page.tsx admin draft preview (/<eventId>?preview=<token>, rewritten in next.config.ts) -> PreviewSite.tsx (builds the site in the browser; live edits, hover/click for the builder)
    [event]/GuestSite.tsx    the whole step flow, driven by the event's screens list (client component)
    layout.tsx               theme script, metadataBase, mounts fonts.ts (reads no Firestore)
    fonts.ts                 every font of every pairing (next/font), CSS variables on <html>
    not-found.tsx            404 for unknown URLs/events (default event's look)
    globals.css              Tailwind @theme colors + font roles (Wedding default) + motion tokens + reveal CSS
    actions/                 server actions: rsvp.ts, registry.ts, admin.ts, auth.ts, content.ts (drafts, publish, versions), team.ts (members, invites), editLock.ts (builder lock), events.ts (new, duplicate, change link, archive, delete)
    api/download/route.ts    image download proxy (used by DetailsScreen)
    api/not-found/route.ts   the 404 page's content (default event), fetched by the 404 in the browser
    api/upload/route.ts      admin-only Vercel Blob upload token
    api/logout/route.ts      clears the session cookie, redirects to /admin/login
    api/edit-lock/release/   frees the builder's edit lock when its tab closes (sendBeacon)
    admin/                   admin portal: page.tsx = All Events (F11, EventsClient); new/ = New Event wizard (F12); layout.tsx (server: current event, role, events) -> AdminShell.tsx (sidebar) + EventSwitcher.tsx; eventAccess.tsx = event + role for the UI; open/[event]/route.ts = switch event
      builder/               Visual builder: page.tsx (sections, preview canvas, editor drawer, undo/redo) + builderContext (editor <-> builder link) + useEditLock (one tab at a time)
      team/                  Team: members, invites, client design switch, activity log
      content/               Content manager: page.tsx (tabs, preview) + one *Editor.tsx per screen + EditorSaveBar / contentDraft (draft, publish, history) + layout.tsx / contentDefaults.tsx (JSON defaults from the server)
      components/            AdminModal, TablePagination, ScreenList (reorder/show/rename screens), PreviewFrame (phone/desktop draft preview, builder canvas)
      dashboard|invites|guests|gifts|registry|login/
  components/
    screens/                 one file per guest screen (+ GiftSelectionModal, LoadingScreen)
    ui/                      reusable visual pieces (TextsReveal, RevealImage, sliders, gallery…)
    effects/                 TwinkleSparks, FallingPetals (404 page), WeddingCursor, DepthParallaxScene
    layout/                  CanvasMenu (step menu), EmbeddedFooter
  contexts/WeddingContentContext.tsx   server-merged content + eventId from [event]/page.tsx -> useWeddingContent()
  contexts/SiteTextContext.tsx         site text (buttons, labels, errors) from [event]/page.tsx -> useSiteText()
  contexts/EditMarkersContext.tsx      preview only: useFieldMarker() puts data-field on texts for the builder
  data/wedding-content.json  default/fallback content for every screen (first couple's; server only, admin and preview get it as props)
  lib/eventPaths.ts          every Firestore path (events/{eventId}/content|guests|registryGifts|giftSelections|settings|members|auditLog, admins) (+ .test.ts)
  lib/firebase/              client.ts (browser SDK), admin.ts (admin SDK, server only)
  lib/blob/uploadImage.ts    compress + upload an image to Vercel Blob (all editors)
  lib/blob/uploadAudio.ts    upload a music file to Vercel Blob (Music editor)
  lib/requireAdmin.ts        session + role-in-event check for server actions and admin pages; the current event (adminEvent cookie) (server only)
  lib/platformEvents.ts      the platform's events: lists (All Events, switcher), who may create, copy for duplicate / change link (server only)
  lib/templates/             event templates (F12): catalog.ts (types, name fields, palettes, screens), <type>.ts (starting content), index.ts (wizard answers -> content docs) (+ templates.test.ts); photos in public/templates/
  lib/permissions.ts         roles (owner / organizer / client) and what each may change (+ .test.ts)
  lib/auditLog.ts            event activity log: logActivity, readActivity (server only)
  lib/siteText.ts            SiteText type, merge, {placeholder} fill (+ .test.ts)
  lib/theme.ts               event colors + font pairing: tokens, presets, mergeTheme, contrast (+ .test.ts); applied by components/ThemeStyle.tsx
  lib/fonts.ts               font roles (heading/elegant/body), families, pairings (+ .test.ts)
  lib/music.ts               event background music: type, mergeMusic, default track (+ .test.ts)
  lib/screens.ts             which screens an event shows, order, menu names: SCREEN_TYPES, SCREEN_NAMES, mergeScreens (+ .test.ts)
  lib/contentDrafts.ts       content drafts + published versions: shapes, mergeDoc, version list (+ .test.ts)
  lib/eventSite.ts           buildEventSite(docs, defaults): raw content docs -> everything the guest site shows (pure; server and preview)
  lib/contentMerge.ts        content merge (mergeContent, mergeGlobalSettings, CONTENT_DOC_IDS, types); pure, no JSON, defaults are an argument
  lib/builderHistory.ts      visual builder undo / redo (+ .test.ts)
  lib/builderMessages.ts     builder <-> preview postMessage types, same-origin readers
  lib/siteContentServer.ts   getEventContent() (event page), getEventDraftDocs() (preview), getSiteContent() (404) via admin SDK (server only)
  lib/weddingContent.ts      the JSON defaults (DEFAULT_CONTENT, DEFAULT_SITE_TEXT, CONTENT_DEFAULTS) + merges bound to them; server only (client code gets CONTENT_DEFAULTS as props)
  lib/genericContent.ts      hosts / People groups / venues / guidelines: types, readers, old-shape adapters (+ .test.ts)
  lib/siteUrl.ts             getSiteUrl(), getEventUrl() for links that leave the site (server only)
  lib/downloadProxy.ts       URL allowlist + filename sanitizer for /api/download (+ .test.ts)
  lib/email/sendRsvpConfirmation.ts   guest RSVP confirmation email via Gmail SMTP (server only)
  types/index.ts             Guest, RegistryGift, GiftSelection, AdminUser
  proxy.ts                   /admin/** redirect when no session cookie
scripts/                     sync-content.js, add-admin.js, migrate-to-events.js, migrate-content-f5.js, migrate-members-f10.js
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
   in `src/app/actions/` with `firebase-admin`. Only the event's `content` is written
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
| new editable field, new `content` doc, editor behavior |`docs/content-system.md` + `docs/data-model.md` |
| Firestore collection/field, Storage path | `docs/data-model.md` |
| admin page or admin action | `docs/admin.md` |
| auth, rules, session, anything access-related | `docs/security.md` |
| new shared component, token, or pattern | `docs/conventions.md` |
| bug found but not fixed, quirk, removed code | `docs/current-state.md` |

A guide that has drifted is worse than none: the next session will trust it.
