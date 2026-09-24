# Data model

The app stores data in **Firestore** and uploaded images in **Vercel Blob**
(Firebase Storage until Sept 2026; see "Image storage" below). There is no
SQL database and no schema file: the shape lives in `src/types/index.ts`, in the
server actions, and in `src/data/wedding-content.json`. When you add or change a
field, update this file.

## Firestore collections

| Collection | Doc ID | Written by | Read by |
| --- | --- | --- | --- |
| `guests` | the invite code (e.g. `K7MPQ2`) | server actions (`admin.ts`, `rsvp.ts`) | admin pages; `verifyInviteCode` |
| `registryGifts` | auto ID | server actions (`admin.ts`, `registry.ts`) | `getRegistryGifts`; admin gifts/dashboard |
| `giftSelections` | auto ID | `claimGift`; deleted by `resetRegistryGift` / `deleteGiftSelection` | admin registry page |
| `admins` | Firebase Auth UID | `scripts/add-admin.js` (or Console) | `firestore.rules`, `storage.rules` (`isAdmin()`) |
| `settings` | `inviteTemplate` | `updateInviteMessageTemplate` | `getInviteMessageTemplate` |
| `websiteContent` | one doc per screen (below) + `<doc>_backup` | admin editors, **from the browser** | `WeddingContentContext` (browser), `layout.tsx` (OG image, admin SDK) |

### `guests/{inviteCode}` — type `Guest`

| Field | Type | Set when |
| --- | --- | --- |
| `inviteCode` | string | code generated |
| `codeStatus` | `'unused' \| 'used'` | `'unused'` at creation; `'used'` on RSVP |
| `isCopied` | boolean | admin marks the invite message as copied/sent |
| `createdAt` | Timestamp | code generated |
| `updatedAt` | Timestamp | `toggleInviteCopiedStatus` (not in the TS type) |
| `fullName`, `email`, `phoneNumber` | string | RSVP submitted |
| `willAttend` | `'Yes' \| 'No'` | RSVP submitted |
| `proxyName`, `message` | string (may be `''`) | RSVP submitted |
| `submittedAt` | Timestamp | RSVP submitted |

Codes are 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I, O, 0, 1),
made with `crypto.randomBytes` in `generateCode()` (`admin.ts`). There is no
collision check — a duplicate code would silently overwrite the existing doc.
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

`email`, `addedAt`. Its existence is what makes a user an admin.

### `settings/inviteTemplate`

`{ template: string }`. `{{CODE}}` in the text is replaced with the guest's
code by the invites page. Default text lives in `DEFAULT_INVITE_TEMPLATE`
(`admin.ts`).

## `websiteContent` docs ↔ `wedding-content.json` keys

`src/data/wedding-content.json` holds the **default** content. A Firestore doc,
if present, overrides it (merge rules in `docs/content-system.md`).

| Firestore doc | JSON key(s) the site reads | Editor |
| --- | --- | --- |
| `globalSettings` | `global` (logo, names, dates, `targetDate`, `ogImage`) **and** `details.ceremony` / `details.reception` time, location, address | `GlobalSettingsEditor.tsx` |
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

Every editor also writes `<doc>_backup` (e.g. `welcomeScreen_backup`) with the
previous values before saving, so the admin can restore one step back.

**JSON quirks** (from `sync-content.js` merging Firestore docs into the file):
the `gallery` key holds both array-index keys (`"0"`…`"7"`) and `images` /
`header`; there is an extra `faqs` key (the site reads `faq` + `faqHeader`, not
`faqs`). Do not "fix" these by hand without checking what the screens read.

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
the circular gallery, video covers) render these URLs with plain
`<img>`/CSS backgrounds, so guests download the stored file itself. Gallery
tiles and Our Story images pass `sizes` to `RevealImage`, so they go through
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
