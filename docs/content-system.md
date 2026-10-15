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

### Caching and refresh after Publish

- `/[event]` is generated on its first visit and cached (ISR,
  `generateStaticParams` returns `[]`). Visits after that cost no Firestore
  reads.
- Only **Publish** changes a live `content` doc (see "Drafts, preview and
  versions" below). `publishDraft` (`src/app/actions/content.ts`) then
  revalidates: the default event the whole site (`revalidatePath('/',
  'layout')`, because the 404 page shows it); any other event only
  `/<eventId>`. The next visit rebuilds the page. Saving a draft changes
  nothing guests see, so it refreshes nothing.
- The page also rebuilds itself at most hourly (`revalidate = 3600`), which is
  the bound for a change made outside the admin (Firestore console, script).

## Drafts, preview and versions (F9)

Editors never write the live doc. Each content doc has three places
(`src/lib/contentDrafts.ts`, paths in `src/lib/eventPaths.ts`):

| Path | What |
| --- | --- |
| `events/{eventId}/content/{doc}` | live: what guests see |
| `events/{eventId}/drafts/{doc}` | `{ data, updatedAt, updatedBy }`: the whole doc as it will be published. No draft = nothing unpublished |
| `events/{eventId}/contentVersions/{doc}` | `{ items: [{ id, publishedAt, publishedBy, label?, data }] }`, newest first, the last 10 publishes (fewer if they would pass ~900 KB) |

All reads and writes go through the admin-only server actions in
`src/app/actions/content.ts` (the browser has no Firestore access to drafts or
versions):

- `loadDraft(eventId, doc)` → the draft, else the live doc, else `null`
  (editor keeps the JSON defaults), plus `hasDraft`, the draft's `updatedAt`
  and the version list (no doc data).
- `saveDraft(eventId, doc, data, { merge, expectedUpdatedAt, force? })`: in a
  transaction. `merge: true` editors send only their fields; they are merged
  over the draft (else the live doc) the way `setDoc(…, { merge: true })`
  would (`mergeDoc`: maps key by key, arrays replaced), so the draft is always
  the whole doc. If the draft's `updatedAt` is not the one the editor loaded
  (saved, published or discarded in another tab or by another admin), it
  returns `conflict` and the editor asks "Changed somewhere else": "Use my
  edits" saves again with `force`. Returns the version list.
- `publishDraft(eventId, doc)`: copies the draft over the live doc (`set`,
  whole doc), puts it on top of the version list, deletes the draft,
  revalidates the guest site. Returns the version list.
- `discardDraft(eventId, doc)`: deletes the draft; the editor reloads from
  the live doc.
- `getVersion(eventId, doc, versionId)`: one version's doc, for Restore.

Before a doc's first Publish its version list is made up on the fly from the
live doc ("Before drafts") and the old `<doc>_backup` ("Older backup"), and the
first Publish stores both, so nothing the single backup kept is lost.
`<doc>_backup` docs are no longer written; they stay in Firestore.

**Preview.** `/<eventId>?preview=<token>` is rewritten (`next.config.ts`,
`beforeFiles`) to `src/app/[event]/preview/page.tsx`: rendered per request,
`noindex`, admins only (anyone else is redirected to the live page). It reads
every doc's draft over the live one (`getEventDraftDocs` in
`src/lib/siteContentServer.ts`) and hands the raw docs to `PreviewSite.tsx`,
which merges them in the browser with the same pure `buildEventSite`
(`src/lib/eventSite.ts`) the live page uses on the server and renders the same
`EventSite`, so the preview is the real guest site, with a small "Draft preview"
badge. Building in the browser is what lets the visual builder change it live. The token is any value; the content manager sends a fresh one to
reload. The cached live page is untouched (it stays ISR).

**Preview frame.** `src/app/admin/components/PreviewFrame.tsx` shows that URL
in a phone (390×844) and/or desktop (1440×900) iframe, drawn at the device
size and scaled to fit (Phone / Desktop / Both, reload, open in a new tab).
The content page has a **Preview** button: docked beside the editor from
1024 px wide (the tab list becomes the dropdown), full screen over it below.
It reloads after every draft save, publish and discard. It is also the visual
builder's canvas (below).

## Visual builder (F9a)

`/admin/builder` (`src/app/admin/builder/page.tsx`, full screen; "Visual
builder" button on the content page and in the sidebar) shows one event to
edit in place. Left: **Sections** = `ScreensEditor` with `ScreenList` in pick
mode (`selected` / `onSelect`: click a name to edit it; the picked row shows
its arrows and menu name; drag and the switch as usual), then **Whole site**
panels (Invite code screen, Names / date / links = Global Settings, Colors &
Fonts, Music, Buttons & labels = Site Text). Middle: `PreviewFrame` (phone by
default). Right: the picked panel's editor, the same `*Editor.tsx` as the tab
(docked from 1024 px; below that it covers the section list, so the preview
stays in view; phones get a link to the content page instead).

- **Live preview.** Every editor hands its `EditorSaveBar` the doc as it
  would save it now (`doc`, plus `merge` for editors saved with merge). In the
  builder the bar passes it on (`builderContext.tsx`), and the builder posts
  it to the preview frames; `PreviewSite` puts it over its raw doc
  (`mergeDoc` when `merge`) and re-renders. No server call while typing.
- **Preview → builder.** Messages are same-origin only
  (`src/lib/builderMessages.ts`). The frame says `preview:ready` when it
  listens (also after a reload); the builder answers `builder:init` (turns on
  hover outlines and click-to-select), the docs of the open editors, and
  `builder:goto` for the picked section. Hover outlines the screen (or a text
  marked `data-field`) with its name; a click that is not on a button or link
  sends `preview:select`, which opens that section's editor and focuses the
  input whose `name` equals the `data-field`. Buttons and links in the
  preview still work (Continue, the menu).
- **Go to a section.** Picking a section moves the preview to its step
  (`builder:goto`; the RSVP form opens without a code, `entrance` opens the
  invite-code screen). A hidden section cannot be shown; its drawer says so.
- **Undo / redo.** One in-memory history across panels (`src/lib/builderHistory.ts`):
  each entry is one doc `before` → `after`; consecutive edits to the same
  field merge; a new edit drops redo; the last 100 are kept; a reload empties
  it. Undo opens the entry's panel if needed and loads `before` into the form
  through the editor's `onRestore`, so "unsaved" works as usual (undo back to
  the saved state = no changes). Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y work
  outside text fields. The tab editors' own Undo (back to saved) stays.
- **Saving.** Each panel has its own `EditorSaveBar` (Save Draft, Publish,
  History, autosave) as on the content page. Switching panels with unsaved
  edits saves them as that panel's draft first (never live); if that fails,
  the panel stays open. Leaving the page with unsaved edits asks first.
- Owner-only for now (any admin); F10 adds the client locks.

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
- Draft, preview and Publish: same as the content above.
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

- No rebuild: the style is part of the cached page, so a change is live after
  the usual Publish. It sits on `:root` and is unlayered,
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
  and fonts). Saves the whole doc (no `merge`) as the draft, like every
  editor (Publish makes it live; History restores an earlier version).
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
draft / publish / history pattern as the other editors.

## Screens and menu

Which guest screens are shown, their order and their names in the menu are
the `content/screens` doc (`src/lib/screens.ts`: `{ screens: [{ type,
enabled, label }] }`, array order = step order), read on the server
(`getEventContent` → `mergeScreens()`) and passed to `<GuestSite screens>`. No
doc = the Wedding order, all shown. Editor `ScreensEditor.tsx` (tab "Screens &
Menu") wraps the reusable `ScreenList` (`src/app/admin/components/`): drag or
up/down arrows to reorder, a switch to show/hide, a name field per screen
(blank = the `siteText.menu` default, shown greyed). Welcome is pinned first
and shown; the RSVP form keeps its invite-code lock wherever it sits; a
warning shows while the RSVP form is hidden but its call to action is not.
Same draft / publish / history pattern as the other editors; the
saved list is normalized by `mergeScreens` first. Menu names are no longer in
the Site Text tab; `siteText.menu` stays as their defaults.

## How an editor works (`src/app/admin/content/*Editor.tsx`)

All the editors follow the same pattern (copy an existing one, do not invent
a new one):

1. **State:** `formData` (being edited) and `originalData` (last saved), both
   seeded from `wedding-content.json`. `hasChanges` = JSON compare of the two.
   `const draft = useContentDraft(eventId, '<doc>')` and `const loadDraft =
   draft.load` (`contentDraft.tsx`; the stable `loadDraft` goes in the effect's deps).
2. **Load:** `await loadDraft()` gives the draft, else the live doc, else
   `null` (keep the defaults); spread it over the JSON default (or the
   editor's `fromDoc` / `formFromDoc`) and set both states.
3. **Upload image:** `await uploadImage(file, '<folder>/<name>')` from
   `src/lib/blob/uploadImage.ts` (compresses, uploads to Vercel Blob, returns the
   URL; see `docs/data-model.md`), put the URL into `formData`. It reaches
   guests only after Publish. Pass the upload state as the bar's `busy` so
   autosave waits for it.
4. **Save (draft):** `handleSave` returns `Promise<boolean>`: `if (!(await
   draft.save(payload, { merge }))) return false;` then set `originalData`,
   flash `saved`, `return true`; on an error alert (or `setError`) and
   `return false`. No confirm modal (a draft is harmless). Most editors use
   `merge: true`; `FaqsEditor`, `RegistryEditor`, `GalleryEditor`,
   `SiteTextEditor`, `RsvpFormEditor`, `ThemeEditor`, `MusicEditor` and
   `ScreensEditor` send the whole doc (`merge: false`).
5. **Undo:** reset `formData` to `originalData` (no network): back to the
   last saved draft.
6. **Restore:** `handleRestore(data)` puts a version's doc into the form only
   (same transform as Load, `originalData` untouched), so it shows as unsaved
   changes; autosave then makes it the draft, and Publish makes it live. The
   bar fetches the version and asks first.
7. Lists (story items, FAQs, gallery, dress-code images, banks) are sortable with
   `@dnd-kit` and get ids from `nanoid`.
8. **Save row:** render `<EditorSaveBar draft doc merge? hasChanges saving
   saved busy? onUndo onRestore onSave />` (`EditorSaveBar.tsx`), never a
   hand-made button row. `doc` is exactly what `onSave` would save now
   (build it with one `toDoc()` used by both, without `updatedAt` or list
   ids), `merge` when saved with `merge: true`: the visual builder's live
   preview and undo run on it, and `onRestore` must accept it back. It sticks to the bottom of the editor and holds: the status ("Unsaved
   changes (saved as a draft in a moment)" / "Draft saved. Not live until you
   publish." / "Draft not published yet" / "Published. Live on the website
   now." / "All changes are live"); Undo; **History** (the published versions,
   newest first, the live one marked, each with Restore; "Discard the draft"
   when there is one); **Save Draft**; **Publish** (asks first; saves pending
   edits, then publishes). **Autosave:** unsaved edits are saved as the draft
   after 10 s without a change (`AUTOSAVE_MS`), never published; a failed or
   declined autosave stops until the next manual Save. The bar's modals go
   through a portal (its `backdrop-blur` would trap `fixed` children). It
   reports `hasChanges` to the content page: while an editor has unsaved
   changes, `page.tsx` (through `useUnsavedChangesGuard()` in
   `unsavedChanges.tsx`) asks "Leave without saving?" before switching tabs or
   following a link to another admin page, and the browser asks before
   closing or reloading. Sign Out is not guarded.
9. **Character limits:** short display text (titles, the small heading above
   them, card titles, buttons) gets `maxLength={TEXT_LIMITS.<kind>}` and a
   `<CharCount value max />` under the input (`CharCount.tsx`). Site Text
   fields take a `max` in `siteTextFields.ts`; buttons and menu names have one.
   An older saved value over the limit is kept and the counter turns red.
10. **Layout by the pane, not the window:** editors use container-query
   variants (`@lg:` ≈ old `sm:`, `@2xl:` ≈ `md:`, `@3xl:` ≈ `lg:`), never
   `sm:` / `md:` / `lg:`, because the same editor sits in the wide content
   page pane and in the narrow builder drawer (both are `@container`).
11. **Click-to-edit (optional, cheap cases):** give the input a `name`, and
   the text on the guest screen `{...field('<that name>')}` from
   `useFieldMarker()` (`src/contexts/EditMarkersContext.tsx`; renders nothing
   on the live site). The builder focuses the **first** input in the drawer
   with that `name`, so mark a text only when its input is the first one
   with the name (the header inputs come first). Done for the Welcome texts
   and the header subtitle / title / description of Our Story, People,
   Venues, Dress Code, Gallery, FAQs, Registry, RSVP Call to Action and the
   RSVP form, plus the Dress Code description. Not marked: list items, the
   Dress Code main title and Registry card texts (their `name` repeats a
   header's), buttons (a click on them works the button), and texts that
   another panel edits (Site Text, Global Settings: the invite-code screen).

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

Editors save through the server actions in `src/app/actions/content.ts`
(admin SDK, `requireAdmin`), never with the browser SDK. Other docs an editor
only reads for legacy adapters (`siteText` in People and Screens,
`globalSettings` in Venues) are still read live from the browser.

## Checklist: add a new editable field

Example: a new `welcomeScreen.footnote` text.

1. **`src/data/wedding-content.json`** — add the key with a sensible default
   (this also makes it typed).
2. **Merge in `mergeWeddingContent()`** (`src/lib/weddingContent.ts`) —
   shallow-spread docs and `global` pick it up automatically; field-by-field
   docs (`ourStory`, `entourage`, `dressCode`) need an explicit line. A new
   field on a host, person, venue or guideline goes into its type **and**
   reader in `src/lib/genericContent.ts`: the readers copy known fields only.
3. **Editor** — add it to the initial `formData` / `originalData`, its
   Load / Restore transform, and add an input. It is saved as part of the
   editor's draft; Publish makes it live.
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
