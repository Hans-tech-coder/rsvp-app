# Content system (editable text and images)

Almost every word and image on the guest site is editable from
`/admin/content`. This file explains how a value travels from the editor to
the screen, and the checklist for adding a new editable field.

## How content reaches a screen

```
src/data/wedding-content.json      (defaults, bundled at build time)
          +
Firestore events/{eventId}/content/<doc>   (overrides, fetched in the browser)
          │  merged in src/contexts/WeddingContentContext.tsx
          ▼
useWeddingContent().content        (read by every screen)
```

1. `WeddingContentProvider` (wraps the guest page in `src/app/page.tsx`) starts
   with the JSON as `content` and `loading = true`.
2. On mount it `getDoc`s all twelve screen docs of the event's `content` (not `siteText`) **in parallel**
   (`Promise.all`) with the **browser SDK** (public read is allowed by
   `firestore.rules`). One failing read falls back to the JSON for everything.
3. It merges each doc over the JSON default. The merge is **written by hand per
   doc** in the provider — there is no generic merge. Patterns used:
   - shallow spread: `welcomeScreen`, `entranceScreen`, `registry`, `rsvpCta`, `rsvpForm`
   - one level deeper for nested objects: `details.header/ceremony/reception`, `dressCode.header`
   - field-by-field with `??`: `ourStory`, `entourage`, `dressCode` fields
     (`entourage.principalSponsors` goes through `normalizePrincipalSponsors()`
     first, see `docs/data-model.md`)
   - field-by-field with `||` (empty string falls back to default): `globalSettings`
   - special: `gallery` doc → `content.gallery` = `images[]`, `content.galleryHeader` = `header`;
     `faq` doc → `content.faq` = `items[]`, `content.faqHeader` = `header`
   - `globalSettings` also writes into `details.ceremony` / `details.reception`
     (time, location, address) — it overrides the `details` doc for those fields.
4. `loading` turns false → `page.tsx` also waits for `document.fonts.ready` and,
   when the first screen is Welcome, preloads its hero image (same srcset as
   `<Image fill>`, via `getImageProps`). That extra wait is capped at 2.5 s after
   navigation (`LOADER_MAX_WAIT_MS`). Then the step flow mounts and
   `LoadingScreen` crossfades out over it. Content is always awaited, so default
   text never flashes.

The type of `content` is `typeof wedding-content.json`, so **a key must exist in
the JSON to be typed**.

## Site text (buttons, labels, hints, errors)

Small UI wording that is not part of a screen's own content ("Continue",
countdown labels, form hints and errors, menu names, loader, 404 page, link
preview title) lives in `siteText`, **not** in `WeddingContentContext`:

```
src/data/wedding-content.json  siteText   (defaults)
          +
Firestore events/{eventId}/content/siteText   (read with the admin SDK on the server)
          │  getSiteContent() in src/lib/siteContentServer.ts (also reads globalSettings)
          ▼
src/app/layout.tsx  ->  <SiteTextProvider>  ->  useSiteText()   (every client component)
                    ->  generateMetadata (title, description, OG, favicon = global.logo)
src/app/not-found.tsx -> NotFoundScreen (site = merged global) + its <title>
```

- Server-read so the text is right on first paint, also outside the guest
  page's provider (loading screen, music hint in `AudioPlayer`, 404 page).
- `/` and the 404 page are **static** (built with the Firestore values). After
  a save, `SiteTextEditor` and `GlobalSettingsEditor` call the
  `revalidateGuestSite()` server action (`revalidatePath('/', 'layout')`), so
  the next visit regenerates them. A save from another place (a script, the
  Firestore console) shows only after the next deploy or such a save.
- Merge rule: `mergeSiteText()` (`src/lib/siteText.ts`): known keys only, empty
  value = default. Placeholders like `{count}` are filled with `fillText()`
  (string) or `fillNodes()` (when a value is an element, e.g. the red `*` or
  the styled day count).
- Server actions return error **codes** (`verifyInviteCode` and `submitRsvp`:
  `invalid` / `used` / `failed`; `claimGift`: `notFound` / `full` /
  `failed`); the screen shows the matching site-text message.
- Not covered: image `alt` text and `aria-*` labels stay in the components;
  the loader's "H&C" monogram is hard-coded (see `docs/current-state.md`).

`src/app/layout.tsx` gets the OG/Twitter image (`global.ogImage`) the same way.

## How an editor works (`src/app/admin/content/*Editor.tsx`)

All the editors follow the same pattern (copy an existing one, do not invent
a new one):

1. **State:** `formData` (being edited) and `originalData` (last saved), both
   seeded from `wedding-content.json`. `hasChanges` = JSON compare of the two.
2. **Load:** `getDoc(doc(db, paths.content(eventId, '<doc>')))` (`eventId` is the editor's prop), spread over the JSON default, set
   both states. Check whether `<doc>_backup` exists to enable "Restore".
3. **Upload image:** `await uploadImage(file, '<folder>/<name>')` from
   `src/lib/blob/uploadImage.ts` (compresses, uploads to Vercel Blob, returns the
   URL; see `docs/data-model.md`), put the URL into `formData`. The image is live only after Save.
4. **Save:** confirm modal (`AdminModal`) → write the previous values to
   `<doc>_backup` → write `<doc>`. Most editors use
   `setDoc(..., { merge: true })`; `FaqsEditor`, `RegistryEditor`, `SiteTextEditor` and
   `RsvpFormEditor` write **without** `merge`, replacing the whole doc.
5. **Undo:** reset `formData` to `originalData` (no network).
6. **Restore backup:** differs per editor. Simple editors (Welcome, Entrance,
   Global, RSVP CTA…) load `<doc>_backup` into the form and the admin must
   still press Save; `GalleryEditor`, `DressCodeEditor` and `RegistryEditor`
   write the backup straight into the live doc. Read the editor's restore
   handler before changing this.
7. Lists (story items, FAQs, gallery, dress-code images, banks) are sortable with
   `@dnd-kit` and get ids from `nanoid`.
8. **Save row:** render `<EditorSaveBar hasChanges saving saved hasBackup onUndo
   onRestore onSave />` (`EditorSaveBar.tsx`), never a hand-made button row. It
   sticks to the bottom of the editor, says "Unsaved changes" / "Saved. Live on
   the website now." / "All changes are live", and reports `hasChanges` to the
   content page. While an editor has unsaved changes, `page.tsx` (through
   `useUnsavedChangesGuard()` in `unsavedChanges.tsx`) asks "Leave without
   saving?" before switching tabs or following a link to another admin page,
   and the browser asks before closing or reloading. Sign Out is not guarded.
9. **Character limits:** short display text (titles, the small heading above
   them, card titles, buttons) gets `maxLength={TEXT_LIMITS.<kind>}` and a
   `<CharCount value max />` under the input (`CharCount.tsx`). Site Text
   fields take a `max` in `siteTextFields.ts`; buttons and menu names have one.
   An older saved value over the limit is kept and the counter turns red.

**Venue and time have one source.** Ceremony / reception time, location and
address are edited only in Global Settings (the provider overrides the
`details` doc with them). The Event Details editor reads `globalSettings` and
shows them read-only with an "Edit in Global Settings" button (switches tab
through the unsaved-changes guard).

**Welcome background:** `WelcomeScreenEditor` tells the admin whether the
current photo has a depth map (`hasDepthMap()` in `src/lib/welcomeDepthMaps.ts`).
A new photo has none, so the 3D effect turns off until a developer adds a map.

Editors write to Firestore **directly from the browser**; this works because
the admin is signed in with the Firebase client SDK and `firestore.rules`
allows writes to `events/{eventId}/content` for `isAdmin()`.

## Checklist: add a new editable field

Example: a new `welcomeScreen.footnote` text.

1. **`src/data/wedding-content.json`** — add the key with a sensible default
   (this also makes it typed).
2. **Merge in `WeddingContentContext.tsx`** — shallow-spread docs pick it up
   automatically; field-by-field docs (`ourStory`, `entourage`, `dressCode`,
   `globalSettings`) need an explicit line.
3. **Editor** — add it to the initial `formData` / `originalData` and add an
   input.
4. **Screen** — read `content.<key>.<field>`, with a fallback if the value can
   be empty.
5. **Site text** (a button, label, hint or error, not a screen's content):
   add the key under `siteText` in the JSON, read it with `useSiteText()`, and
   add a field to `SITE_TEXT_GROUPS` in `src/app/admin/content/siteTextFields.ts`.
   No merge or provider change is needed. `src/lib/siteText.test.ts` fails if a
   key has no editor field (or the reverse).
6. If it is a **new Firestore doc**, also add it to the `getDoc` list in the
   provider, to `docs` / `docToKeyMap` in `scripts/sync-content.js`, to the tab
   list in `src/app/admin/content/page.tsx` (and its "not implemented" guard),
   and to the table in `docs/data-model.md`.

## `npm run sync-content`

This **pulls** Firestore → JSON: it reads the
thirteen `content` docs of an event (`hans-and-czay`, or `--event <id>`; `siteText` is merged key by key, like
`mergeSiteText()`, so new default keys survive) with the admin SDK and merges them into
`src/data/wedding-content.json`. Run it to make the bundled defaults match
production (so the first paint, before overrides load, already shows the real
content). It never writes to Firestore.
