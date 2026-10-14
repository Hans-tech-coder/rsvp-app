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

There is one event, `hans-and-czay` (`DEFAULT_EVENT_ID`). Until per-event
routing (F4) and the admin event switcher (F11) exist, the guest page
(`page.tsx` → `WeddingContentProvider eventId`) and every admin page
(`const eventId = DEFAULT_EVENT_ID`) use it. Guest components get the ID from
`useWeddingContent().eventId`; admin client components and content editors get
it as an `eventId` prop. Every server action takes `eventId` as its first
argument (except `revalidateGuestSite` and the global admin actions).

| Path | Doc ID | Written by | Read by |
| --- | --- | --- | --- |
| `events/{eventId}` | event ID: lowercase letters, digits, inner hyphens, max 64 (`isValidEventId`) | `scripts/migrate-to-events.js` | nothing yet (F4/F11). Fields: `slug`, `type` (`'wedding'`), `status` (`'active'`), `createdAt` |
| `…/guests` | the invite code (e.g. `K7MPQ2`), unique per event | server actions (`admin.ts`, `rsvp.ts`) | admin pages; `verifyInviteCode` |
| `…/registryGifts` | auto ID | server actions (`admin.ts`, `registry.ts`) | `getRegistryGifts`; admin gifts/dashboard |
| `…/giftSelections` | auto ID | `claimGift`; deleted by `resetRegistryGift` / `deleteGiftSelection` | admin registry page |
| `…/settings` | `inviteTemplate` | `updateInviteMessageTemplate` | `getInviteMessageTemplate` |
| `…/content` | one doc per screen (below) + `<doc>_backup` | admin editors, **from the browser** | `WeddingContentContext` (browser); `globalSettings` + `siteText` also on the server by `getSiteContent(eventId)` (`src/lib/siteContentServer.ts`, admin SDK) for the root layout, metadata and the 404 page; `globalSettings`, `details`, `dressCode` by the RSVP email |
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
| `globalSettings` | `global` (logo, names, `coupleNameFormat`, `targetDate`, `venueShort`, `ogImage`, `footerTagline`) **and** `details.ceremony` / `details.reception` time, location, address | `GlobalSettingsEditor.tsx` |
| `welcomeScreen` | `welcomeScreen` | `WelcomeScreenEditor.tsx` |
| `entranceScreen` | `entranceScreen` | `EntranceScreenEditor.tsx` |
| `ourStory` | `ourStory` (`subtitle`, `title`, `description`, `items[]`) | `OurStoryEditor.tsx` |
| `entourage` | `entourage` (`parents`, `principalSponsors`, `honorAttendants`, `bridesmaids`, `groomsmen`, `flowerGirls`, `ringBearers`) | `EntourageEditor.tsx` |
| `details` | `details` (`header`, `ceremony`, `reception`, `orderOfEventsImage`) | `EventDetailsEditor.tsx` |
| `dressCode` | `dressCode` | `DressCodeEditor.tsx` |
| `gallery` | `gallery` ← doc field `images[]`; `galleryHeader` ← doc field `header` | `GalleryEditor.tsx` |
| `faq` | `faq` ← doc field `items[]`; `faqHeader` ← doc field `header` | `FaqsEditor.tsx` |
| `registry` | `registry` (`header`, `bankTransfer`, `curatedRegistry`) | `RegistryEditor.tsx` |
| `rsvpCta` | `rsvpCta` | `RsvpCtaEditor.tsx` |
| `rsvpForm` | `rsvpForm` (`header`, `labels`, `attendanceOptions`, `actions`, `successModal`) | `RsvpFormEditor.tsx` |
| `siteText` | `siteText`: small UI wording grouped by screen (`common`, `menu`, `loading`, `welcome`, `motionHint`, `music`, `entrance`, `ourStory`, `entourage`, `details`, `dressCode`, `registry`, `curatedRegistry`, `giftModal`, `rsvp`, `phone`, `footer`, `notFound`, `seo`), every leaf a string. Read **on the server only** (not by `WeddingContentContext`). | `SiteTextEditor.tsx` ("Site Text" tab) |

`global.coupleNameFormat` ("Hans & Czay") is the couple's names as written in a
sentence: metadata, the 404 page, the RSVP email, `{couple}` in site text.
`global.dateShort` and `global.dateFull` were removed from the JSON in Oct 2026
(nothing showed them); the live `globalSettings` doc may still hold them and
`sync-content` may copy them back; they are harmless.

**`siteText` shape.** Defined by the JSON (the type is
`typeof wedding-content.json.siteText`, exported as `SiteText` from
`src/lib/siteText.ts`). `mergeSiteText()` overlays the doc on the JSON key by
key: unknown keys are ignored, and an empty or non-string value keeps the
default. Some strings hold `{name}` placeholders filled by `fillText()` /
`fillNodes()` (e.g. `rsvp.errors.checkMany` uses `{count}`); the Site Text
editor's field hints list them. The editor saves the whole merged object
(no `merge`), so the doc always has every key known at save time.

Every editor also writes `<doc>_backup` (e.g. `welcomeScreen_backup`) with the
previous values before saving, so the admin can restore one step back.

**JSON quirks** (from `sync-content.js` merging Firestore docs into the file):
the `gallery` key holds both array-index keys (`"0"`…`"7"`) and `images` /
`header`; there is an extra `faqs` key (the site reads `faq` + `faqHeader`, not
`faqs`). Do not "fix" these by hand without checking what the screens read.

**`entourage.principalSponsors`** is an array of pairs, one row per pair in
display order:

```ts
{ ninang: { title, name }, ninong: { title, name }, couple: boolean }
```

`title` comes from the editor's dropdown (`NINANG_TITLES` / `NINONG_TITLES` in
`src/lib/principalSponsors.ts`) or is `""`; either side may be blank for a solo
sponsor with no partner. Desktop shows ninang left, ninong right on one row;
phones show a couple on one line (`ninong & ninang`) and two solo
sponsors on a line each. Content saved before Oct 2026 is a flat `string[]`
(`"Mrs. A"`, `"Mr. B"`, couples as `"Mr. B & Mrs. A"`).
`normalizePrincipalSponsors()` reads both shapes (in the provider and in the
editor, including the backup restore), so a legacy doc keeps rendering; the
first save from `EntourageEditor` writes the pair shape. The flag was first
named `married`; one save on 2026-10-14 stored it under that name, and the
normalizer still reads it as `couple`. **Rollback:** code from before the change
crashes on the pair objects (`startsWith is not a function`), so rolling the
code back also needs `content/entourage` rewritten as a `string[]`.
Both `entourage` and `entourage_backup` already hold the pair shape, so the
backup cannot do this; write the strings by hand (couples as
`"Mr. B & Mrs. A"`, which the normalizer pairs again).

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
| `images/registry-qr` | PNG (keeps QR codes lossless) | RegistryEditor |
| `images/rsvpCta-bg` | default | RsvpCtaEditor |
| `website/order-of-events` | default | EventDetailsEditor |
| `gallery/photo` | default | GalleryEditor |

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
