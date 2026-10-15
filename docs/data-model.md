# Data model

The app stores data in **Firestore** and uploaded images in **Vercel Blob**
(Firebase Storage until Sept 2026; see "Image storage" below). There is no
SQL database and no schema file: the shape lives in `src/types/index.ts`, in the
server actions, and in `src/data/wedding-content.json`. When you add or change a
field, update this file.

## Firestore collections

Event data is **scoped to an event**: everything a guest or an editor touches
lives under `events/{eventId}`. Admin accounts are still global. Every path is
built by `paths` in **`src/lib/eventPaths.ts`**; no other file in `src/` names a
collection (the Node scripts keep their own copy of the names). The rest of the
docs write event subcollections short: `guests` means
`events/{eventId}/guests`, `content/<doc>` means `events/{eventId}/content/<doc>`.

There is one event, `hans-and-czay` (`DEFAULT_EVENT_ID`, override with
`NEXT_PUBLIC_DEFAULT_EVENT_ID`). The event ID is also its URL: the guest site
is `/<eventId>` (`src/app/[event]/page.tsx`), and an ID without an
`events/{eventId}` doc is a 404. Until the admin event switcher (F11) exists,
every admin page (`const eventId = DEFAULT_EVENT_ID`) edits the default event.
Guest components get the ID from `useWeddingContent().eventId`; admin client
components and content editors get it as an `eventId` prop. Every server
action takes `eventId` as its first argument (except the global admin
actions). Event IDs that equal a top-level route (`admin`, `api`) would be
shadowed by it; F11 must refuse them.

| Path | Doc ID | Written by | Read by |
| --- | --- | --- | --- |
| `events/{eventId}` | event ID: lowercase letters, digits, inner hyphens, max 64 (`isValidEventId`) | `scripts/migrate-to-events.js` | `getEventContent` (exists → the event's page is served; fields not read yet). Fields: `slug` (= the ID), `type` (`'wedding'`), `status` (`'active'`), `createdAt` |
| `…/guests` | the invite code (e.g. `K7MPQ2`), unique per event | server actions (`admin.ts`, `rsvp.ts`) | admin pages; `verifyInviteCode` |
| `…/registryGifts` | auto ID | server actions (`admin.ts`, `registry.ts`) | `getRegistryGifts`; admin gifts/dashboard |
| `…/giftSelections` | auto ID | `claimGift`; deleted by `resetRegistryGift` / `deleteGiftSelection` | admin registry page |
| `…/settings` | `inviteTemplate` | `updateInviteMessageTemplate` | `getInviteMessageTemplate` |
| `…/content` | one doc per screen (below) + old `<doc>_backup` (no longer written, F9) | `publishDraft` (`src/app/actions/content.ts`), copying the doc's draft. Editors no longer write it from the browser | the server only (admin SDK, `src/lib/siteContentServer.ts`): all screen docs + `siteText` + `theme` + `music` + `screens` by `getEventContent(eventId)` for the cached event page and its metadata; `globalSettings` + `siteText` + `theme` + `music` by `getSiteContent(eventId)` for the 404 page and the default invite message; `globalSettings`, `details`, `dressCode`, `theme` by the RSVP email. The browser no longer reads `content` (the public read rule stays) |
| `…/drafts` | the content doc's ID (`EDITABLE_DOC_IDS` in `src/lib/contentDrafts.ts`) | `saveDraft` (also editor autosave); deleted by `publishDraft` / `discardDraft` | `loadDraft` (editors), `getEventDraftContent` (admin preview). Fields: `data` (the whole doc as it will be published), `updatedAt` (ms, strictly increasing; the editors' conflict check), `updatedBy` (admin email). Server only (no rule = no browser access) |
| `…/contentVersions` | the content doc's ID | `publishDraft` (adds the published doc on top, keeps the last 10, fewer if they pass ~900 KB) | `loadDraft` / `saveDraft` / `publishDraft` return the list without data; `getVersion` one version's `data`. Field: `items[]` of `{ id, publishedAt, publishedBy, label?, data }`. Before a doc's first publish the list is made up from the live doc and `<doc>_backup` and stored on that publish. Server only |
| `admins` (global) | Firebase Auth UID | `createSessionCookie` (claims an allowlist entry); deleted by `removeAdmin` (`admins.ts`, super only) | `firestore.rules`, `storage.rules` (`isAdmin()`), `requireAdmin.ts` |
| `adminAllowlist` (global) | lowercased email | `scripts/add-admin.js`; `addAdmin` / `cancelPendingAdmin` (`admins.ts`, super only) | `createSessionCookie`, `listAdmins` (server only; rules deny all browser access) |

A path helper throws on an invalid event ID or a document ID containing `/`,
so a guest-typed code can never point at another document; the action's
`try` turns that into its usual failure result.

### Old root collections (kept until verified, then removed)

Before Oct 2026 the same data lived at the root: `websiteContent` (now
`content`), `guests`, `registryGifts`, `giftSelections`, `settings`. On
2026-10-14 `scripts/migrate-to-events.js --write` copied all 48 docs into
`events/hans-and-czay` with the same doc IDs (so `giftSelections.giftId` still
matches) and `--verify` confirmed every doc equal. Nothing in `src/` reads or
writes the root copies any more; `firestore.rules` still allows them so a
rollback to the old code keeps working.

- **Re-sync before going live.** The deployed site keeps writing to the root
  until the F3 code is deployed. Right before deploying, run
  `node scripts/migrate-to-events.js --write --overwrite`, then `--verify`.
- **Rollback.** Redeploy the previous commit: it reads the root collections,
  which are untouched. Anything written under `events/` after the switch
  (RSVPs, claims, content saves) is not in the root and must be copied back by
  hand.
- **Removal** of the root collections and their rules is a separate, later
  step, done only after the event copy has run in production for a while.

`scripts/migrate-to-events.js` (dry run by default; `--write` copies missing
docs, `--overwrite` also replaces differing ones, `--verify` exits 1 on any
missing or different doc; `--event <id>`) never deletes anything.

### `guests/{inviteCode}` — type `Guest`

| Field | Type | Set when |
| --- | --- | --- |
| `inviteCode` | string | code generated |
| `codeStatus` | `'unused' \| 'used'` | `'unused'` at creation; `'used'` on RSVP |
| `isCopied` | boolean | admin marks the invite message as copied/sent |
| `createdAt` | Timestamp | code generated |
| `updatedAt` | Timestamp | `toggleInviteCopiedStatus` (not in the TS type) |
| `fullName`, `email`, `phoneNumber` | string | RSVP submitted (`phoneNumber` is international, e.g. `+63 917 123 4567`, since 2026-10; older RSVPs hold what the guest typed) |
| `willAttend` | `'Yes' \| 'No'` | RSVP submitted |
| `proxyName`, `message` | string (may be `''`) | RSVP submitted |
| `submittedAt` | Timestamp | RSVP submitted |

Codes are 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I, O, 0, 1),
made with `crypto.randomBytes` in `generateCode()` (`admin.ts`). They are unique
per event: `generateInviteCodes` and `regenerateInviteCode` write with
`create()`, so a code the event already has fails the batch, which is retried
with fresh codes (up to 3 tries). The same code may exist in two events.
`regenerateInviteCode` **deletes** the old doc, including any RSVP on it.

### `registryGifts/{id}` — type `RegistryGift`

`name`, `link`, `maxCount`, `currentCount`, `isFull`, `createdAt`.
Invariant: `isFull === currentCount >= maxCount`. Every action that changes
`currentCount` or `maxCount` recomputes `isFull` inside a transaction or batch.

### `giftSelections/{id}` — type `GiftSelection`

`giftId`, `giftName` (copied at claim time), `fullName`, `email`, `message`,
`selectedAt`. Deleting one through `deleteGiftSelection` decrements the gift's
`currentCount`.

### `admins/{uid}`

`email`, `role` (`'super' | 'admin'`; a doc without it counts as `'admin'`),
`addedAt`, `addedBy` (UID of the super admin who added them, or `'script'`).
Its existence is what makes a user an admin. Type `AdminUser`, `AdminRole`.

### `adminAllowlist/{email}`

`role`, `addedAt`, `addedBy`. A pending grant for someone who **may** become an
admin. On their next Google sign-in, `createSessionCookie` copies it onto
`admins/{uid}` in a transaction (creating the doc, or setting `role` on an
existing one) and deletes the entry.

### `settings/inviteTemplate` (per event)

`{ template: string }`. `{{CODE}}` in the text is replaced with the guest's
code by the invites page. Default text lives in `DEFAULT_INVITE_TEMPLATE`
(`admin.ts`).

## `content` docs ↔ `wedding-content.json` keys

`src/data/wedding-content.json` holds the **default** content. A Firestore doc,
if present, overrides it (merge rules in `docs/content-system.md`).

| Firestore doc | JSON key(s) the site reads | Editor |
| --- | --- | --- |
| `globalSettings` | `global` (logo, `hosts[]`, `coupleNameFormat`, `targetDate`, `venueShort`, `ogImage`, `footerTagline`) | `GlobalSettingsEditor.tsx` |
| `welcomeScreen` | `welcomeScreen` | `WelcomeScreenEditor.tsx` |
| `entranceScreen` | `entranceScreen` | `EntranceScreenEditor.tsx` |
| `ourStory` | `ourStory` (`subtitle`, `title`, `description`, `items[]`; admin tab "Timeline (Our Story)", an item's `image` and `videoLink` are optional) | `OurStoryEditor.tsx` |
| `entourage` | `entourage` (`subtitle`, `title`, `groups[]`; admin tab "People (Entourage)") | `EntourageEditor.tsx` |
| `details` | `details` (`header`, `venues[]`, `orderOfEventsImage`; admin tab "Venues (Event Details)") | `EventDetailsEditor.tsx` |
| `dressCode` | `dressCode` (`header`, `title`, `description`, `colors[]`, `guidelines[]`, `inspirationImages[]`) | `DressCodeEditor.tsx` |
| `gallery` | `gallery` ← doc field `images[]`; `galleryHeader` ← doc field `header` | `GalleryEditor.tsx` |
| `faq` | `faq` ← doc field `items[]`; `faqHeader` ← doc field `header` | `FaqsEditor.tsx` |
| `registry` | `registry` (`header`, `bankTransfer`, `curatedRegistry`) | `RegistryEditor.tsx` |
| `rsvpCta` | `rsvpCta` | `RsvpCtaEditor.tsx` |
| `rsvpForm` | `rsvpForm` (`header`, `labels`, `attendanceOptions`, `actions`, `successModal`) | `RsvpFormEditor.tsx` |
| `theme` | not in the JSON: `{ preset, colors: { primary, accent, surface, ink, primaryLight, primaryDeep, accentLight, accentDark, surfaceSoft }, fontPairing }`, each color `#RRGGBB`; `preset` is a preset id from `src/lib/theme.ts` or `custom`; `fontPairing` an id from `src/lib/fonts.ts` (`classic`, `romantic`, `garden`, `modern`, `glamour`; missing = `classic`). No doc = the Wedding default (Burgundy & Gold, Classic). Read on the server only (`mergeTheme`), written as a `:root` style. | `ThemeEditor.tsx` ("Colors & Fonts" tab) |
| `music` | not in the JSON: `{ enabled, url, fileName, volume }`. `url` is an https Blob URL or `''` (= `public/bg-music.mp3`); `fileName` the upload's original name (editor only); `volume` the starting volume, 0.1–1. No doc = on, default track, 0.5. Read on the server only (`mergeMusic`), passed to `AudioPlayer`. | `MusicEditor.tsx` ("Music" tab) |
| `screens` | not in the JSON: `{ screens: [{ type, enabled, label }] }`, array order = step order. `type` one of `SCREEN_TYPES` in `src/lib/screens.ts` (`welcome`, `ourStory`, `entourage`, `details`, `dressCode`, `gallery`, `faqs`, `registry`, `rsvpCta`, `rsvp`; also the `siteText.menu` keys); `enabled` false hides it from the flow and menu; `label` the menu name (max 30) or `''` = `siteText.menu[type]`. No doc = Wedding order, all shown. Read on the server only (`mergeScreens`: drops unknown/repeated types, re-adds missing ones, keeps `welcome` first and on), passed to `GuestSite`. | `ScreensEditor.tsx` ("Screens & Menu" tab) |
| `siteText` | `siteText`: small UI wording grouped by screen (`common`, `menu`, `loading`, `welcome`, `motionHint`, `music`, `entrance`, `ourStory`, `details`, `dressCode`, `registry`, `curatedRegistry`, `giftModal`, `rsvp`, `phone`, `footer`, `notFound`, `seo`), every leaf a string. Read **on the server only**, into `SiteTextProvider` (not `WeddingContentContext`). | `SiteTextEditor.tsx` ("Site Text" tab) |

`global.coupleNameFormat` ("Hans & Czay", "Ana's 18th", "ACME Summit 2027";
"Display Name" in the editor) is the event's name as written in a sentence:
metadata, the 404 page, the RSVP email, `{couple}` in site text. The key kept
its old name so saved site text and docs need no change.
`global.dateShort` and `global.dateFull` were removed from the JSON in Oct 2026
(nothing showed them); the live `globalSettings` doc may still hold them;
`sync-content` drops them from the JSON.

**`siteText` shape.** Defined by the JSON (the type is
`typeof wedding-content.json.siteText`, exported as `SiteText` from
`src/lib/siteText.ts`). `mergeSiteText()` overlays the doc on the JSON key by
key: unknown keys are ignored, and an empty or non-string value keeps the
default. Some strings hold `{name}` placeholders filled by `fillText()` /
`fillNodes()` (e.g. `rsvp.errors.checkMany` uses `{count}`); the Site Text
editor's field hints list them. The editor saves the whole merged object
(no `merge`), so the doc always has every key known at save time.

Before F9 every editor wrote `<doc>_backup` (e.g. `welcomeScreen_backup`) with
the previous values before saving. Since F9 an editor saves a draft
(`drafts/<doc>`) and Publish keeps the last 10 published versions
(`contentVersions/<doc>`); the old `_backup` docs are only read once, as the
"Older backup" entry of a doc's first version list (see "Drafts, preview and
versions" in `docs/content-system.md`). They can be deleted once every doc has
been published at least once.

**JSON quirks** (from `sync-content.js` merging Firestore docs into the file):
the `gallery` key holds both array-index keys (`"0"`…`"7"`) and `images` /
`header`; there is an extra `faqs` key (the site reads `faq` + `faqHeader`, not
`faqs`). Do not "fix" these by hand without checking what the screens read.

### Generic content shapes (F5, Oct 2026)

So one site can serve any event type, four parts of the content are lists.
Types, readers and display helpers live in **`src/lib/genericContent.ts`**
(tested by `genericContent.test.ts`); `WeddingContent` in
`src/lib/weddingContent.ts` is the JSON's type with these lists typed.

| Field | Shape | Shown on |
| --- | --- | --- |
| `global.hosts[]` | `{ name, role }`. `role` (Groom, Debutante, Organizer…) is not shown to guests | Welcome and Entrance names (`"A & B"`, three or more `"A, B & C"`), loader and footer monogram (initials), logo `alt` |
| `entourage.groups[]` | `{ id, title, layout: 'pairs' \| 'list' \| 'featured', people: Person[], pairs: PersonPair[] }`; `Person` = `{ title, name, role, photo }` (`title` is the honorific, used by pairs), `PersonPair` = `{ left, right, together }` | People screen. `list` / `featured` groups use `people` and fill two columns side by side (featured = large names); `pairs` groups use `pairs`, full width, left and right facing each other; a pair that is `together` shares one phone line as "right & left" ("Mr. B & Mrs. A"). A group with no names is hidden |
| `details.venues[]` | `{ id, title, subtitle, time, location, address, description, mapLink, calendarStart, calendarLoc, calendarDesc }` (all strings) | Venue cards, two per row (one or an odd last one centered); empty fields and buttons hidden. RSVP email lists every venue |
| `dressCode.guidelines[]` | `{ id, title, text }` | Dress Code screen, two per row |

Venue time / location / address are edited only in the Venues editor now
(before F5 they were Global Settings fields that overrode `details`).

**Old shape, still readable.** Until Oct 2026 the same docs held:
`globalSettings.groomName` / `brideName` and `ceremonyTime|Location|Address`,
`receptionTime|Location|Address`; `entourage.parents{bride,groom}`,
`principalSponsors`, `honorAttendants{maidOfHonor,bestMan}`, `bridesmaids`,
`groomsmen`, `flowerGirls`, `ringBearers` (group titles were site text
`siteText.entourage.*`); `details.ceremony` / `details.reception`;
`dressCode.ladiesGuideline` / `gentlemenGuideline` (titles were
`siteText.dressCode.ladies` / `gentlemen`). When a doc has no new field, the
merge (and each editor, including Restore) builds it from these with
`hostsFromLegacy`, `peopleGroupsFromLegacy` (titles from the event's site text,
else English), `venuesFromLegacy` (Global Settings venue fields win, as before)
and `guidelinesFromLegacy`. `principalSponsors` itself may be the pair shape
`{ ninang, ninong, couple }` (ninang → left, ninong → right, `couple` →
`together`; an early save named the flag `married`) or the older flat
`string[]` (`"Mrs. A"`, couples as `"Mr. B & Mrs. A"`); both are read by
`normalizePrincipalSponsors()` in `src/lib/principalSponsors.ts`, which only
serves this conversion now.

**Migration.** `scripts/migrate-content-f5.js` adds the new fields to
`globalSettings`, `entourage`, `details`, `dressCode` and their `_backup`
docs, computed by `genericContent.ts` itself (loaded with `jiti`). Dry run by
default; `--write` adds missing fields only (`update` with the doc's update
time as precondition, so a concurrent editor save makes it fail instead of
being overwritten); `--verify` exits 1 if a doc with old fields lacks the new
one; `--dump <file>` saves the docs first; `--event <id>`. It never removes or
changes an old field. Run on `hans-and-czay` on 2026-10-14 (8 docs, verified;
dump in the git-ignored plan backups).

**Old fields are kept** in the docs on purpose: editors save with
`merge: true` (Global Settings writes back every field it loaded), so the old
fields stay as they were at migration time. The JSON has only the new shape;
`sync-content` deletes the old keys when it pulls and warns about a doc
without the new field. Removing the old fields from Firestore is a separate,
later step (after the F5 code has run in production for a while).

**Rollback.** Redeploy the code from before F5: it reads the old fields, which
are untouched, so the site shows the content as it was at migration time.
Edits made in the new editors after that (new groups, venues, guidelines,
host names) are not in the old fields and are lost on rollback unless copied
back by hand. Site text saved after F5 no longer has `entourage.*` and
`dressCode.ladies` / `gentlemen`, so old code shows its English defaults for
those titles.

## Image storage (Vercel Blob)

Admin editors call `uploadImage(file, name, opts)` from
`src/lib/blob/uploadImage.ts`. It resizes and re-encodes the image in the
browser (default: longest side 2000px, WebP, quality 0.82; small files, SVG,
GIF and undecodable files such as HEIC go up unchanged), then uploads straight
to a **public** Vercel Blob store with a client token from `/api/upload`
(admin-only, see `docs/security.md`). Blob adds a random suffix, so a path is
`<name>-<random>.<ext>` and uploads never overwrite. The returned URL
(`https://<store>.public.blob.vercel-storage.com/...`) is what goes into
Firestore.

| Name passed to `uploadImage` | Options | Uploaded by |
| --- | --- | --- |
| `images/global-logo` | PNG, max 800px | GlobalSettingsEditor |
| `images/global-og` | JPEG, max 1200px (social previews) | GlobalSettingsEditor |
| `images/welcome-bg` | default | WelcomeScreenEditor |
| `images/entrance-bg` | default | EntranceScreenEditor |
| `images/our-story` | default | OurStoryEditor |
| `images/dress-code` | default | DressCodeEditor |
| `images/people` | max 600px (round photo next to a name) | EntourageEditor (People) |
| `images/registry-qr` | PNG (keeps QR codes lossless) | RegistryEditor |
| `images/rsvpCta-bg` | default | RsvpCtaEditor |
| `website/order-of-events` | default | EventDetailsEditor |
| `gallery/photo` | default | GalleryEditor |

Music goes through `uploadAudio(file)` (`src/lib/blob/uploadAudio.ts`) as
`music/background-<random>.<ext>`, unchanged (no re-encoding). The upload
token gives paths under `music/` `audio/*` and a 10 MB cap (`MUSIC_MAX_BYTES`),
every other path `image/*` and 20 MB. A guest downloads the track only when it
first plays (`preload="none"`), but each play of an uploaded track is Blob
transfer, so a smaller MP3 also saves quota. Replaced uploads stay in Blob
(nothing deletes them, same as images).

Why compress: most guest screens (RevealImage without `sizes`, RSVP CTA,
video covers) render these URLs with plain
`<img>`/CSS backgrounds, so guests download the stored file itself. Gallery
tiles and Our Story images pass `sizes` to `RevealImage`, and the circular
gallery picks a viewport-sized copy for each photo and its dot, so they go through
the Next image optimizer (`/_next/image`, allowed by the Blob entry in
`next.config.ts` `remotePatterns`). Those resized copies count against the
Vercel Image Optimization allowance, not Blob transfer, after the first fetch. The Vercel Hobby plan includes 1 GB Blob
storage and 10 GB Blob data transfer per month, **shared by every project in
the account**; going over blocks Blob for up to 30 days.

Old files are never deleted when an image is replaced.

**Firebase Storage (legacy).** Until Sept 2026 uploads went to Firebase Storage
(`images/<name>-<ts>`, `gallery/gallery-<ts>-<id>.<ext>`,
`website/order-of-events-<ts>`). The project's Google billing account was
closed, so those URLs now return HTTP 402 and are being replaced by
re-uploading. `firebasestorage.googleapis.com` stays in `next.config.ts`
`remotePatterns` until no Firestore doc or `wedding-content.json` entry
points there.

Static assets (music, SVG logo, bundled images) live in `public/`.
