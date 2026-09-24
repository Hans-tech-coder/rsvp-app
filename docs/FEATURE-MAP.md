# Feature map

Which files implement which feature. Find the feature, open only the files
listed. Paths are relative to the repo root. Update this file whenever a file is
added, moved, or deleted.

## Guest site (`/`)

The whole guest site is one client page. Step numbers are the `currentStep`
values in `src/app/page.tsx`.

| Step | Feature | Screen file | Content key(s) | Admin editor |
| --- | --- | --- | --- | --- |
| – | Loading splash (while content loads) | `src/components/screens/LoadingScreen.tsx` | – | – |
| 0 | Welcome + countdown | `src/components/screens/WelcomeScreen.tsx` | `welcomeScreen`, `global` | `WelcomeScreenEditor.tsx`, `GlobalSettingsEditor.tsx` |
| 1 | Our Story timeline | `src/components/screens/OurStoryScreen.tsx` | `ourStory` | `OurStoryEditor.tsx` |
| 2 | Entourage | `src/components/screens/EntourageScreen.tsx` | `entourage` | `EntourageEditor.tsx` |
| 3 | Event details (ceremony, reception, order of events download) | `src/components/screens/DetailsScreen.tsx` | `details` (+ `global` venue/time fields) | `EventDetailsEditor.tsx`, `GlobalSettingsEditor.tsx` |
| 4 | Dress code (palette, guidelines, inspiration slider) | `src/components/screens/DressCodeScreen.tsx` | `dressCode` | `DressCodeEditor.tsx` |
| 5 | Gallery (slider + circular 3D lightbox) | `src/components/screens/GalleryScreen.tsx`, `src/components/ui/circular-image-gallery.tsx` | `gallery`, `galleryHeader` | `GalleryEditor.tsx` |
| 6 | FAQs | `src/components/screens/FaqScreen.tsx` | `faq`, `faqHeader` | `FaqsEditor.tsx` |
| 7 | Registry (bank transfer + curated gifts) | `src/components/screens/RegistryScreen.tsx`, `CuratedRegistryScreen.tsx`, `GiftSelectionModal.tsx` | `registry` (+ `rsvpForm` labels in modal) | `RegistryEditor.tsx`; gifts in `/admin/gifts` |
| 8 | RSVP call-to-action ("Join Our Day") | `src/components/screens/RsvpCtaScreen.tsx` | `rsvpCta` | `RsvpCtaEditor.tsx` |
| – | Invite-code lock overlay (before step 9) | `src/components/screens/EntranceScreen.tsx` | `entranceScreen`, `global` | `EntranceScreenEditor.tsx` |
| 9 | RSVP form | `src/components/screens/RsvpScreen.tsx` | `rsvpForm` | `RsvpFormEditor.tsx` |

All editors are in `src/app/admin/content/`.

### Guest-site shell and shared pieces

| Feature | Files |
| --- | --- |
| Step state, back/menu buttons, screen transitions, RSVP lock, localStorage | `src/app/page.tsx` |
| Content loading (JSON defaults + Firestore overrides) | `src/contexts/WeddingContentContext.tsx`, `src/data/wedding-content.json` |
| Step menu overlay | `src/components/layout/CanvasMenu.tsx` |
| Footer at the bottom of scrolling screens | `src/components/layout/EmbeddedFooter.tsx` |
| Background music + floating toggle | `src/components/AudioPlayer.tsx`, `public/bg-music.mp3` |
| Fonts, OG/Twitter metadata, theme script | `src/app/layout.tsx` |
| Colors, fonts, motion tokens, reveal CSS | `src/app/globals.css` |
| Staggered text reveal on scroll | `src/components/ui/TextsReveal.tsx` |
| Image fade/blur reveal | `src/components/ui/RevealImage.tsx` |
| Countdown digits pop-in | `src/components/ui/PopInNumber.tsx` |
| Auto-scrolling draggable strip | `src/components/ui/DraggableSlider.tsx` |
| Ink reveal canvas background | `src/components/ui/InkRevealCanvas.tsx` |
| Sparkle particles (welcome) | `src/components/effects/TwinkleSparks.tsx` |
| Image download proxy | `src/app/api/download/route.ts` (called from `DetailsScreen.tsx`) |
| Image upload (admin editors) | `src/lib/blob/uploadImage.ts` (compress + client upload), `src/app/api/upload/route.ts` (admin-only Blob token) |

## Server actions (`src/app/actions/`)

| Action | File | Called from |
| --- | --- | --- |
| `verifyInviteCode` | `rsvp.ts` | `EntranceScreen.tsx` |
| `submitRsvp` | `rsvp.ts` | `RsvpScreen.tsx` |
| `getRegistryGifts`, `claimGift` | `registry.ts` | `CuratedRegistryScreen.tsx` |
| `createSessionCookie`, `clearSessionCookie` | `auth.ts` | `admin/login/page.tsx`, `admin/layout.tsx` |
| `generateInviteCodes`, `deleteInviteCode`, `regenerateInviteCode`, `toggleInviteCopiedStatus`, `getInviteMessageTemplate`, `updateInviteMessageTemplate` | `admin.ts` | `admin/invites/*`, `admin/guests/GuestListClient.tsx` (delete) |
| `addRegistryGift`, `updateRegistryGift`, `deleteRegistryGift`, `resetRegistryGift` | `admin.ts` | `admin/gifts/GiftsClient.tsx` |
| `deleteGiftSelection` | `admin.ts` | `admin/registry/RegistrySelectionsClient.tsx` |

## Admin portal (`/admin/**`)

Each data page is a **server component** (`page.tsx`, `force-dynamic`, reads via
`getAdminDb()`) that passes plain data to a **client component** that calls
server actions and then `router.refresh()`.

| Route | Server page | Client component | Data |
| --- | --- | --- | --- |
| `/admin/login` | `src/app/admin/login/page.tsx` (client) | – | Firebase Auth → session cookie |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | – (stat cards inline) | `guests`, `registryGifts` |
| `/admin/invites` | `src/app/admin/invites/page.tsx` | `InviteListClient.tsx` | `guests` (all codes), `settings/inviteTemplate` |
| `/admin/guests` | `src/app/admin/guests/page.tsx` | `GuestListClient.tsx` (CSV export via papaparse) | `guests` |
| `/admin/gifts` | `src/app/admin/gifts/page.tsx` | `GiftsClient.tsx` | `registryGifts` |
| `/admin/registry` | `src/app/admin/registry/page.tsx` | `RegistrySelectionsClient.tsx` | `giftSelections` |
| `/admin/content` | `src/app/admin/content/page.tsx` (client, tab list) | `*Editor.tsx` in same folder | `websiteContent/*` + Vercel Blob |
| sidebar/nav | `src/app/admin/layout.tsx` | – | – |
| shared UI | `src/app/admin/components/AdminModal.tsx`, `TablePagination.tsx` | | |

## Auth, rules, infrastructure

| Feature | Files |
| --- | --- |
| `/admin` redirect when no cookie | `src/proxy.ts` |
| Firebase client init | `src/lib/firebase/client.ts` |
| Firebase admin init (env parsing) | `src/lib/firebase/admin.ts` |
| Firestore / Storage rules | `firestore.rules`, `storage.rules`, `firebase.json`, `.firebaserc` |
| Shared types | `src/types/index.ts` |
| Pull Firestore content into JSON | `scripts/sync-content.js` |
| Grant admin to a user | `scripts/add-admin.js` |
| Next config (remote image hosts, dev origin) | `next.config.ts` |

## Files over 400 lines

Read these by range (`grep -n` then read around the line), never whole.

| Lines | File |
| --- | --- |
| 700 | `src/app/admin/content/DressCodeEditor.tsx` |
| 661 | `src/app/admin/content/RegistryEditor.tsx` |
| 597 | `src/app/admin/content/OurStoryEditor.tsx` |
| 557 | `src/app/admin/content/GalleryEditor.tsx` |
| 498 | `src/app/admin/content/GlobalSettingsEditor.tsx` |
| 493 | `src/app/admin/content/FaqsEditor.tsx` |
| 486 | `src/data/wedding-content.json` |
| 469 | `src/app/admin/content/EventDetailsEditor.tsx` |
| 435 | `src/app/admin/content/RsvpFormEditor.tsx` |
| 400 | `src/app/admin/content/EntourageEditor.tsx` |

`src/app/page.tsx` (397) and `src/components/ui/circular-image-gallery.tsx` (383)
are close to the limit.
