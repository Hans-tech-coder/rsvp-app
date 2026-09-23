# Data model

The app stores everything in **Firestore** and **Firebase Storage**. There is no
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

## Firebase Storage paths

Uploads are made from admin editors with the browser SDK. Anyone can read;
only admins can write (`storage.rules`).

| Path | Uploaded by |
| --- | --- |
| `images/global-logo-<ts>`, `images/global-og-<ts>` | GlobalSettingsEditor |
| `images/welcome-bg-<ts>` | WelcomeScreenEditor |
| `images/entrance-bg-<ts>` | EntranceScreenEditor |
| `images/our-story-<ts>` | OurStoryEditor |
| `images/dress-code-<ts>` | DressCodeEditor |
| `images/registry-qr-<ts>` | RegistryEditor |
| `images/rsvpCta-bg-<ts>` | RsvpCtaEditor |
| `website/order-of-events-<ts>` | EventDetailsEditor |
| `gallery/<fileName>` | GalleryEditor |

Old files are never deleted when an image is replaced.

Static assets (music, SVG logo, bundled images) live in `public/`.
