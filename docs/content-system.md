# Content system (editable text and images)

Almost every word and image on the guest site is editable from
`/admin/content`. This file explains how a value travels from the editor to
the screen, and the checklist for adding a new editable field.

## How content reaches a screen

```
src/data/wedding-content.json      (defaults, bundled at build time)
          +
Firestore websiteContent/<doc>     (overrides, fetched in the browser)
          │  merged in src/contexts/WeddingContentContext.tsx
          ▼
useWeddingContent().content        (read by every screen)
```

1. `WeddingContentProvider` (wraps the guest page in `src/app/page.tsx`) starts
   with the JSON as `content` and `loading = true`.
2. On mount it `getDoc`s all twelve `websiteContent` docs with the **browser
   SDK** (public read is allowed by `firestore.rules`).
3. It merges each doc over the JSON default. The merge is **written by hand per
   doc** in the provider — there is no generic merge. Patterns used:
   - shallow spread: `welcomeScreen`, `entranceScreen`, `registry`, `rsvpCta`, `rsvpForm`
   - one level deeper for nested objects: `details.header/ceremony/reception`, `dressCode.header`
   - field-by-field with `??`: `ourStory`, `entourage`, `dressCode` fields
   - field-by-field with `||` (empty string falls back to default): `globalSettings`
   - special: `gallery` doc → `content.gallery` = `images[]`, `content.galleryHeader` = `header`;
     `faq` doc → `content.faq` = `items[]`, `content.faqHeader` = `header`
   - `globalSettings` also writes into `details.ceremony` / `details.reception`
     (time, location, address) — it overrides the `details` doc for those fields.
4. `loading` turns false → `LoadingScreen` exits and the step flow renders.

The type of `content` is `typeof wedding-content.json`, so **a key must exist in
the JSON to be typed**.

`src/app/layout.tsx` separately reads `websiteContent/globalSettings.ogImage`
with the admin SDK for the OG/Twitter image.

## How an editor works (`src/app/admin/content/*Editor.tsx`)

All twelve editors follow the same pattern (copy an existing one, do not invent
a new one):

1. **State:** `formData` (being edited) and `originalData` (last saved), both
   seeded from `wedding-content.json`. `hasChanges` = JSON compare of the two.
2. **Load:** `getDoc(websiteContent/<doc>)`, spread over the JSON default, set
   both states. Check whether `<doc>_backup` exists to enable "Restore".
3. **Upload image:** `uploadBytes` to a Storage path (see `docs/data-model.md`),
   `getDownloadURL`, put the URL into `formData`. The image is live only after Save.
4. **Save:** confirm modal (`AdminModal`) → write the previous values to
   `<doc>_backup` → write `<doc>`. Most editors use
   `setDoc(..., { merge: true })`; `FaqsEditor`, `RegistryEditor` and
   `RsvpFormEditor` write **without** `merge`, replacing the whole doc.
5. **Undo:** reset `formData` to `originalData` (no network).
6. **Restore backup:** differs per editor. Simple editors (Welcome, Entrance,
   Global, RSVP CTA…) load `<doc>_backup` into the form and the admin must
   still press Save; `GalleryEditor`, `DressCodeEditor` and `RegistryEditor`
   write the backup straight into the live doc. Read the editor's restore
   handler before changing this.
7. Lists (story items, FAQs, gallery, dress-code images, banks) are sortable with
   `@dnd-kit` and get ids from `nanoid`.

Editors write to Firestore **directly from the browser**; this works because
the admin is signed in with the Firebase client SDK and `firestore.rules`
allows `websiteContent` writes for `isAdmin()`.

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
5. If it is a **new Firestore doc**, also add it to the `getDoc` list in the
   provider, to `docs` / `docToKeyMap` in `scripts/sync-content.js`, to the tab
   list in `src/app/admin/content/page.tsx` (and its "not implemented" guard),
   and to the table in `docs/data-model.md`.

## `npm run sync-content`

This **pulls** Firestore → JSON: it reads the
twelve `websiteContent` docs with the admin SDK and merges them into
`src/data/wedding-content.json`. Run it to make the bundled defaults match
production (so the first paint, before overrides load, already shows the real
content). It never writes to Firestore.
