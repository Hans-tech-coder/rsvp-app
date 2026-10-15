# Content system (editable text and images)

Almost every word and image on the guest site is editable from
`/admin/content`. This file explains how a value travels from the editor to
the screen, and the checklist for adding a new editable field.

## How content reaches a screen

```
src/data/wedding-content.json      (defaults, bundled at build time)
          +
Firestore events/{eventId}/content/<doc>   (overrides, read on the server with the admin SDK)
          │  getEventContent(eventId) in src/lib/siteContentServer.ts
          │  merged by mergeWeddingContent() in src/lib/weddingContent.ts
          ▼
src/app/[event]/page.tsx  ->  <WeddingContentProvider content>  ->  useWeddingContent().content
```

1. `src/app/[event]/page.tsx` (a server component) calls
   `getEventContent(eventId)`. It reads `events/{eventId}` first (missing →
   `null` → 404, so a made-up URL costs one read), then the twelve screen docs
   plus `siteText` and `theme` in one `getAll`. A Firestore error throws (the cached page
   stays up instead of being replaced by the defaults).
2. `mergeWeddingContent()` merges each doc over the JSON default. The merge is
   **written by hand per doc** — there is no generic merge. Patterns used:
   - shallow spread: `welcomeScreen`, `entranceScreen`, `registry`, `rsvpCta`, `rsvpForm`
   - one level deeper for nested objects: `details.header`, `dressCode.header`
   - field-by-field with `??`: `ourStory`, `entourage`, `dressCode` fields
   - the generic lists (`entourage.groups`, `details.venues`,
     `dressCode.guidelines`, `global.hosts`) through their reader in
     `src/lib/genericContent.ts`, else built from the doc's old wedding-only
     fields (`*FromLegacy`; `siteText` is passed in for the old group and
     guideline titles), else the JSON default. See "Generic content shapes" in
     `docs/data-model.md`
   - `globalSettings` → `content.global` with `mergeGlobal()`: every text key
     of the JSON `global`; an empty or non-text value keeps the default (the
     same rule as the 404 page); `hosts` as above
   - special: `gallery` doc → `content.gallery` = `images[]`, `content.galleryHeader` = `header`;
     `faq` doc → `content.faq` = `items[]`, `content.faqHeader` = `header`
3. The page hands the merged content (plain JSON) and the event ID to
   `WeddingContentProvider`; the browser never reads content from Firestore.
4. `GuestSite.tsx` keeps `LoadingScreen` up until `document.fonts.ready` and,
   when the first screen is Welcome, its hero image is preloaded (same srcset as
   `<Image fill>`, via `getImageProps`). That wait is capped at 2.5 s after
   navigation (`LOADER_MAX_WAIT_MS`). Then the step flow mounts and
   `LoadingScreen` crossfades out over it.

### Caching and refresh after a save

- `/[event]` is generated on its first visit and cached (ISR,
  `generateStaticParams` returns `[]`). Visits after that cost no Firestore
  reads.
- Every editor calls `refreshGuestSite(eventId)`
  (`src/app/admin/content/refreshGuestSite.ts`) after each write to a live
  `content` doc (save, undo/restore that writes). It calls the
  `revalidateGuestSite(eventId)` server action: the default event revalidates
  the whole site (`revalidatePath('/', 'layout')`, because the 404 page shows
  it); any other event only `/<eventId>`. The next visit rebuilds the page.
- A failed refresh is only logged (the save itself succeeded). The page also
  rebuilds itself at most hourly (`revalidate = 3600`), which is the bound for
  a missed refresh or a change made outside the admin (Firestore console,
  script).

The type of `content` is `WeddingContent` (`src/lib/weddingContent.ts`): the
type of `wedding-content.json` with the generic lists typed by
`genericContent.ts`. So **a key must exist in the JSON to be typed**. Code
that needs the typed defaults imports `DEFAULT_CONTENT` from
`src/lib/weddingContent.ts` rather than the JSON itself.

## Site text (buttons, labels, hints, errors)

Small UI wording that is not part of a screen's own content ("Continue",
countdown labels, form hints and errors, menu names, loader, 404 page, link
preview title) lives in `siteText`, **not** in `WeddingContentContext`:

```
src/data/wedding-content.json  siteText   (defaults)
          +
Firestore events/{eventId}/content/siteText   (read with the admin SDK on the server)
          │  getEventContent(eventId) (with the screen docs) / getSiteContent(eventId) (404 only)
          ▼
src/app/[event]/page.tsx -> <SiteTextProvider> -> useSiteText()   (every guest component, AudioPlayer)
                         -> generateMetadata (title, description, OG, favicon = global.logo)
src/app/not-found.tsx    -> its own <SiteTextProvider> + NotFoundScreen (default event) + its <title>
```

- Server-read so the text is right on first paint, also on the loading screen
  and the music hint. The root layout reads nothing from Firestore (the admin
  pages don't need event text).
- Refresh after a save: same as the content above (`refreshGuestSite`).
- Merge rule: `mergeSiteText()` (`src/lib/siteText.ts`): known keys only, empty
  value = default. Placeholders like `{count}` are filled with `fillText()`
  (string) or `fillNodes()` (when a value is an element, e.g. the red `*` or
  the styled day count).
- Server actions return error **codes** (`verifyInviteCode` and `submitRsvp`:
  `invalid` / `used` / `failed`; `claimGift`: `notFound` / `full` /
  `failed`); the screen shows the matching site-text message.
- Not covered: image `alt` text and `aria-*` labels stay in the components;
  the loader's "H&C" monogram is hard-coded (see `docs/current-state.md`).

`src/app/[event]/page.tsx` gets the OG/Twitter image (`global.ogImage`) the same way;
link-preview URLs are made absolute with `metadataBase` in `src/app/layout.tsx`
(`getSiteUrl()` in `src/lib/siteUrl.ts`).

## Theme (colors and fonts)

The guest site's colors are the nine semantic tokens in `globals.css` `@theme`
(`--color-ink`, `--color-surface`, `--color-primary`, …; Tailwind classes
`bg-surface`, `text-accent`, …). Each event can override them:

```
src/lib/theme.ts  DEFAULT_THEME (= preset "Burgundy & Gold" = globals.css values)
          +
Firestore events/{eventId}/content/theme   (read with the admin SDK on the server)
          │  getEventContent(eventId) / getSiteContent(eventId) (404) → mergeTheme()
          ▼
<ThemeStyle theme> (src/components/ThemeStyle.tsx)  →  <style id="event-theme">:root{--color-…;--font-heading:…}</style>
```

The same doc holds the **font pairing** (`fontPairing`, an id from
`FONT_PAIRINGS` in `src/lib/fonts.ts`). The site has three font roles
(`font-heading` titles and names, `font-elegant` subtitles and italic prose,
`font-body` UI text); a pairing names one loaded family per role, and
`themeCss()` writes `--font-heading: var(--font-montserrat), sans-serif` etc.
into the same `:root` rule. Every family of every pairing is loaded once by
`next/font` in `src/app/fonts.ts` (a CSS variable each on `<html>`); only the
default pairing (Classic: Cinzel / Cormorant Garamond / Inter) is preloaded,
so the browser downloads another pairing's files only on an event that uses
it. A new pairing: add any new family to `src/app/fonts.ts` and
`FONT_FAMILIES` (same variable name; `fonts.test.ts` checks), then the pairing
to `FONT_PAIRINGS`.

- No rebuild: the style is part of the cached page, so a save is live after
  the usual `refreshGuestSite(eventId)`. It sits on `:root` and is unlayered,
  so it beats Tailwind's `@layer theme` defaults and reaches portals and the
  `body` background (`--background` = `var(--color-surface)`).
- `mergeTheme()` keeps only the nine known keys with a `#RRGGBB` value and a
  known pairing id (the rest stay default), which is what makes the raw
  `<style>` safe.
- Not in `wedding-content.json` and not pulled by `sync-content`: the default
  belongs to the template (`THEME_PRESETS` in `src/lib/theme.ts`).
  `src/lib/theme.test.ts` / `src/lib/fonts.test.ts` fail if the default
  preset or pairing and the `globals.css` values drift apart.
- Editor (`ThemeEditor.tsx`, tab "Colors & Fonts"): preset palettes, a picker
  + hex box per main color (picking one also moves its shades,
  `deriveShades`), "Fine-tune shades", a readability list (WCAG contrast of
  the text/background pairs the site uses, `CONTRAST_PAIRS`; 4.5:1 is "Easy to
  read", 3–4.5 "Large text only"), a Fonts list (one card per pairing, each
  drawn in its own fonts), a live preview drawn with the guest site's own
  classes under the edited variables, and "Reset to template default" (colors
  and fonts). Saves the whole doc (no `merge`) after writing `theme_backup`;
  Restore loads the backup into the form (Save to make it live).
- The RSVP email uses the event's theme colors too (inlined hex, see
  `docs/guest-site.md`), but always the Classic fonts.
- Not themed: the firefly and candle-light glows (Welcome effects
  are light, not brand), neutral black/white shadows.

## Music

Each event's background music is the `content/music` doc (`src/lib/music.ts`:
`enabled`, `url`, `fileName`, `volume`), read on the server with the other
docs (`getEventContent` / `getSiteContent` → `mergeMusic()`) and passed to
`<AudioPlayer music>`. No doc = on, the default track (`public/bg-music.mp3`),
50 %. Editor `MusicEditor.tsx` (tab "Music"): on/off, upload a song
(`uploadAudio()`, straight to Blob, no re-encoding, 10 MB cap), "Use the
default song", a listen player, and the starting volume (10–100 %). Same
backup/restore/save pattern as the other editors (`music_backup`).

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

**Venue and time have one source.** Each venue's time, location and address
are edited only on its card in the Venues (Event Details) tab
(`details.venues[]`). Global Settings keeps only `venueShort` (the short place
under the date). Before F5 these were Global Settings fields; an old-shape
`details` doc still takes them from there (`venuesFromLegacy`), so the editor
reads `globalSettings` too until the doc is migrated or saved.

**Generic lists in the editors.** People (`EntourageEditor`), Venues
(`EventDetailsEditor`), hosts (`GlobalSettingsEditor`) and guidelines
(`DressCodeEditor`) load through the same readers / legacy adapters as the
site (`src/lib/genericContent.ts`), also on Restore, and save the new field
with `merge: true`, which leaves the old wedding-only fields in the doc for
older code (see "Generic content shapes" in `docs/data-model.md`). People
groups and venues are sortable (`@dnd-kit`, ids from `nanoid`); removing one
asks first. Switching a People group between a column layout and `pairs`
keeps the names (two per row, or flattened back).

**Welcome background:** `WelcomeScreenEditor` tells the admin whether the
current photo has a depth map (`hasDepthMap()` in `src/lib/welcomeDepthMaps.ts`).
A new photo has none, so the 3D effect turns off until a developer adds a map.

Editors write to Firestore **directly from the browser**; this works because
the admin is signed in with the Firebase client SDK and `firestore.rules`
allows writes to `events/{eventId}/content` for `isAdmin()`. After each write
to a live doc an editor must call `refreshGuestSite(eventId)`, or the guest
page keeps showing the cached version for up to an hour.

## Checklist: add a new editable field

Example: a new `welcomeScreen.footnote` text.

1. **`src/data/wedding-content.json`** — add the key with a sensible default
   (this also makes it typed).
2. **Merge in `mergeWeddingContent()`** (`src/lib/weddingContent.ts`) —
   shallow-spread docs and `global` pick it up automatically; field-by-field
   docs (`ourStory`, `entourage`, `dressCode`) need an explicit line. A new
   field on a host, person, venue or guideline goes into its type **and**
   reader in `src/lib/genericContent.ts`: the readers copy known fields only.
3. **Editor** — add it to the initial `formData` / `originalData` and add an
   input. A new write to a live doc is followed by `refreshGuestSite(eventId)`.
4. **Screen** — read `content.<key>.<field>`, with a fallback if the value can
   be empty.
5. **Site text** (a button, label, hint or error, not a screen's content):
   add the key under `siteText` in the JSON, read it with `useSiteText()`, and
   add a field to `SITE_TEXT_GROUPS` in `src/app/admin/content/siteTextFields.ts`.
   No merge or provider change is needed. `src/lib/siteText.test.ts` fails if a
   key has no editor field (or the reverse).
6. If it is a **new Firestore doc**, also add it to `CONTENT_DOC_IDS` in
   `src/lib/weddingContent.ts`, to `docs` / `docToKeyMap` in `scripts/sync-content.js`, to the tab
   list in `src/app/admin/content/page.tsx` (and its "not implemented" guard),
   and to the table in `docs/data-model.md`.

## `npm run sync-content`

This **pulls** Firestore → JSON: it reads the
thirteen `content` docs of an event (`hans-and-czay`, or `--event <id>`; `siteText` is merged key by key, like
`mergeSiteText()`, so new default keys survive) with the admin SDK and merges them into
`src/data/wedding-content.json`. Run it to make the bundled defaults match
production (so the first paint, before overrides load, already shows the real
content). It never writes to Firestore. The old wedding-only fields that the
live docs still carry (see "Generic content shapes" in `docs/data-model.md`)
are deleted from the JSON as it pulls; a doc without the new list field
(not migrated yet) gets a warning to run `scripts/migrate-content-f5.js`.
