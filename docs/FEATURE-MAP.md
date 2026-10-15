# Feature map

Which files implement which feature. Find the feature, open only the files
listed. Paths are relative to the repo root. Update this file whenever a file is
added, moved, or deleted.

## Guest site (`/<eventId>`)

`/` redirects to the default event (`src/app/page.tsx`). Each event's guest
site is one cached server page, `src/app/[event]/page.tsx`, around one client
component. Step numbers are the `currentStep` values in
`src/app/[event]/GuestSite.tsx`.

| Step | Feature | Screen file | Content key(s) | Admin editor |
| --- | --- | --- | --- | --- |
| – | Loading splash (while fonts and the first photo load; monogram = name initials) | `src/components/screens/LoadingScreen.tsx` | `global` | `GlobalSettingsEditor.tsx` |
| 0 | Welcome + countdown | `src/components/screens/WelcomeScreen.tsx` | `welcomeScreen`, `global` | `WelcomeScreenEditor.tsx`, `GlobalSettingsEditor.tsx` |
| 1 | Our Story timeline (any timeline / program; photo optional) | `src/components/screens/OurStoryScreen.tsx` | `ourStory` | `OurStoryEditor.tsx` |
| 2 | Entourage = People groups (pairs / list / featured, optional photo + role) | `src/components/screens/EntourageScreen.tsx` | `entourage` (`groups[]`) | `EntourageEditor.tsx` (tab "People (Entourage)") |
| 3 | Event details: venue cards (any number), order of events download | `src/components/screens/DetailsScreen.tsx` | `details` (`venues[]`) | `EventDetailsEditor.tsx` (tab "Venues (Event Details)") |
| 4 | Dress code (palette, `guidelines[]`, inspiration slider + circular lightbox) | `src/components/screens/DressCodeScreen.tsx`, `src/components/ui/circular-image-gallery.tsx` | `dressCode` | `DressCodeEditor.tsx` |
| 5 | Gallery (slider + circular 3D lightbox) | `src/components/screens/GalleryScreen.tsx`, `src/components/ui/circular-image-gallery.tsx` | `gallery`, `galleryHeader` | `GalleryEditor.tsx` |
| 6 | FAQs | `src/components/screens/FaqScreen.tsx` | `faq`, `faqHeader` | `FaqsEditor.tsx` |
| 7 | Registry (bank transfer + curated gifts) | `src/components/screens/RegistryScreen.tsx`, `CuratedRegistryScreen.tsx`, `GiftSelectionModal.tsx` | `registry` (+ `rsvpForm` labels in modal) | `RegistryEditor.tsx`; gifts in `/admin/gifts` |
| 8 | RSVP call-to-action ("Join Our Day") | `src/components/screens/RsvpCtaScreen.tsx` | `rsvpCta` | `RsvpCtaEditor.tsx` |
| – | Invite-code lock overlay (before step 9) | `src/components/screens/EntranceScreen.tsx` | `entranceScreen`, `global` | `EntranceScreenEditor.tsx` |
| 9 | RSVP form (inline validation, phone field) | `src/components/screens/RsvpScreen.tsx`, `src/components/ui/PhoneField.tsx`, `src/lib/phoneCountries.ts` (+ `.test.ts`) | `rsvpForm` | `RsvpFormEditor.tsx` |

All editors are in `src/app/admin/content/`.

### Guest-site shell and shared pieces

| Feature | Files |
| --- | --- |
| Per-event route: 404 for an unknown event, title/description/link preview (`generateMetadata`), ISR cache (`revalidate`, empty `generateStaticParams`), mounts `SiteTextProvider`, `WeddingContentProvider`, `AudioPlayer` | `src/app/[event]/page.tsx` |
| `/` → default event redirect | `src/app/page.tsx` |
| Step state, back/menu buttons, screen transitions, RSVP lock, localStorage (keys `event:<eventId>:…`) | `src/app/[event]/GuestSite.tsx` |
| Content loading: read on the server (`getEventContent`, admin SDK), merged over the JSON defaults (`mergeWeddingContent`, `mergeGlobal`, `CONTENT_DOC_IDS`), handed to the browser with the event ID | `src/lib/siteContentServer.ts` (server only), `src/lib/weddingContent.ts`, `src/contexts/WeddingContentContext.tsx` (`useWeddingContent`), `src/data/wedding-content.json` |
| Site text: every small guest-visible wording (buttons, labels, hints, errors, menu, loader, 404, link preview). Read on the server, given to all guest components by `src/app/[event]/page.tsx` (404: `not-found.tsx`); `useSiteText()` in a component | `src/lib/siteContentServer.ts` (`getEventContent` / `getSiteContent`, server only), `src/contexts/SiteTextContext.tsx` (`SiteTextProvider`, `useSiteText`), `src/lib/siteText.ts` (`SiteText` type, `mergeSiteText`, `fillText`, `fillNodes`; tested by `src/lib/siteText.test.ts`), JSON key `siteText`; editor `src/app/admin/content/SiteTextEditor.tsx` + field labels `siteTextFields.ts` |
| Step menu overlay | `src/components/layout/CanvasMenu.tsx` |
| Footer at the bottom of scrolling screens (monogram from `global.hosts` initials, tagline `global.footerTagline`, date `global.targetDate` as DD.MM.YYYY; all edited in `GlobalSettingsEditor.tsx`) | `src/components/layout/EmbeddedFooter.tsx` |
| Background music + floating toggle, volume slider, "music is playing" hint | `src/components/AudioPlayer.tsx`, `.t-vol-*` in `src/app/globals.css`, `public/bg-music.mp3` |
| Fonts, theme script, `metadataBase` (site URL) and the admin pages' title | `src/app/layout.tsx` |
| Site URL for links that leave the site (link preview base, invite message, RSVP email): `getSiteUrl`, `getEventUrl` | `src/lib/siteUrl.ts` (server only) |
| 404 page for any unknown URL or event (default event's look: couple's photo inside the "404", days-to-wedding line, "Back to the celebration" → `/`; global settings read on the server and passed as `site`; own `SiteTextProvider` + `AudioPlayer`; wording from site text `notFound`; same burgundy backdrop and button style as the inner screens; embossed logo `.t-emboss` in `globals.css`; also mounts `FallingPetals` and `WeddingCursor`) | `src/app/not-found.tsx` (metadata) → `src/components/screens/NotFoundScreen.tsx` |
| Colors, fonts, motion tokens, reveal CSS | `src/app/globals.css` |
| Theme: each event's colors (semantic tokens `ink`, `surface`, `primary`, `accent`… overridden per event as a server-rendered `:root` style; presets, shade derivation, WCAG contrast) | `src/lib/theme.ts` (tested by `src/lib/theme.test.ts`), `src/components/ThemeStyle.tsx` (mounted by `src/app/[event]/page.tsx` and `src/app/not-found.tsx`), read in `src/lib/siteContentServer.ts`; editor `src/app/admin/content/ThemeEditor.tsx` (tab "Theme & Colors"), doc `content/theme` |
| Staggered text reveal on scroll | `src/components/ui/TextsReveal.tsx` |
| Scroll motion: scroll-container context, `ScrollReveal`/`ScrollRevealItem` (reveal once), `Parallax` (image drift), `SCROLL_MOTION` constants | `src/components/ui/ScrollMotion.tsx` |
| Image fade/blur reveal | `src/components/ui/RevealImage.tsx` |
| Hover/focus "View" chip and keyboard-button props (`viewCardProps`) for slider photo cards (Gallery, Dress Code) | `src/components/ui/ViewOverlay.tsx` + `.t-view-*` in `globals.css` |
| Phone input with country-code picker (auto-detected), live formatting, per-country digit cap and "N more digits" guide; country list, detection and parsing helpers | `src/components/ui/PhoneField.tsx`, `src/lib/phoneCountries.ts` (tested by `src/lib/phoneCountries.test.ts`); used by `RsvpScreen.tsx` |
| Countdown digits pop-in | `src/components/ui/PopInNumber.tsx` |
| Auto-scrolling draggable strip (pauses on hover and keyboard focus; hidden loop copy) | `src/components/ui/DraggableSlider.tsx` |
| Ink reveal canvas background | `src/components/ui/InkRevealCanvas.tsx` |
| Welcome 3D background: depth-parallax photo + depth-aware fireflies that light the couple (WebGL); map and couple area paired to the photo in `DEPTH_MAPS` in `src/lib/welcomeDepthMaps.ts` (`hasDepthMap()` also drives the 3D warning in `WelcomeScreenEditor.tsx`), asset `public/images/welcome-depth.webp` | `src/components/effects/DepthParallaxScene.tsx` |
| Welcome motion onboarding hint ("Move your mouse" / "Tilt your phone", iOS tap-to-enable), every page load, repeats up to 3 times until tried | `src/components/ui/MotionHint.tsx` (icon keyframes `t-hint-*` in `globals.css`) |
| Firefly glow particles (welcome fallback, drawn above the dark gradient) | `src/components/effects/TwinkleSparks.tsx` |
| Slow falling rose petals, burgundy/red/white, CSS only (404 page) | `src/components/effects/FallingPetals.tsx` + `.t-petal*` in `globals.css` |
| Wedding-ring cursor: gold stardust trail, tilt over clickables, sparkle burst on click (mouse/trackpad only, mounted in `GuestSite` in `src/app/[event]/GuestSite.tsx`) | `src/components/effects/WeddingCursor.tsx` + `.t-cursor*` in `globals.css` |
| Mouse detection (`t-mouse` on `<html>`) that gates every hover style, the ring cursor and the mouse hint | `pointer-init` script in `src/app/layout.tsx`, `hasMouse()` in `src/lib/pointer.ts`, `@custom-variant hover` in `globals.css` |
| Generic content shapes: hosts, People groups, venues, guidelines (types, readers, display helpers, legacy adapters for the old wedding-only fields) | `src/lib/genericContent.ts`, tested by `src/lib/genericContent.test.ts`; used by `weddingContent.ts` (merge), the four editors, the screens and `scripts/migrate-content-f5.js` |
| Legacy principal sponsors reader (`{ninang, ninong, couple}` pairs and the older `string[]`), only for converting old content | `src/lib/principalSponsors.ts`, tested by `src/lib/principalSponsors.test.ts`; used by `genericContent.ts` |
| Image download proxy | `src/app/api/download/route.ts` (called from `DetailsScreen.tsx`); host allowlist + filename sanitizer in `src/lib/downloadProxy.ts`, tested by `src/lib/downloadProxy.test.ts` |
| Image upload (admin editors) | `src/lib/blob/uploadImage.ts` (compress + client upload), `src/app/api/upload/route.ts` (admin-only Blob token) |

## Server actions (`src/app/actions/`)

| Action | File | Called from |
| --- | --- | --- |
| `verifyInviteCode` | `rsvp.ts` | `EntranceScreen.tsx` |
| `submitRsvp`, `getVisitorCountry` (`x-vercel-ip-country`, else `api.country.is`) | `rsvp.ts` | `RsvpScreen.tsx` |
| `getRegistryGifts`, `claimGift` | `registry.ts` | `CuratedRegistryScreen.tsx` |
| `createSessionCookie`, `clearSessionCookie` | `auth.ts` | `admin/login/page.tsx`, `admin/layout.tsx` |
| `generateInviteCodes`, `deleteInviteCode`, `regenerateInviteCode`, `toggleInviteCopiedStatus`, `getInviteMessageTemplate`, `updateInviteMessageTemplate` | `admin.ts` | `admin/invites/*`, `admin/guests/GuestListClient.tsx` (delete) |
| `addRegistryGift`, `updateRegistryGift`, `deleteRegistryGift`, `resetRegistryGift` | `admin.ts` | `admin/gifts/GiftsClient.tsx` |
| `deleteGiftSelection` | `admin.ts` | `admin/registry/RegistrySelectionsClient.tsx` |
| `revalidateGuestSite(eventId)` (rebuilds the event's cached page on its next visit; the default event also the 404) | `admin.ts` | every content editor, through `admin/content/refreshGuestSite.ts` |
| `getMyAdminRole` | `admins.ts` | `admin/layout.tsx` (shows Manage Admins for super admins) |
| `listAdmins`, `addAdmin`, `cancelPendingAdmin`, `removeAdmin` (super only) | `admins.ts` | `admin/components/ManageAdminsModal.tsx` |

## Admin portal (`/admin/**`)

Each data page is a **server component** (`page.tsx`, `force-dynamic`, reads via
`getAdminDb()`) that passes plain data to a **client component** that calls
server actions and then `router.refresh()`.

| Route | Server page | Client component | Data |
| --- | --- | --- | --- |
| `/admin/login` | `src/app/admin/login/page.tsx` (client) | – | Google popup sign-in → session cookie (allowlist claim in `auth.ts`) |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | – (stat cards inline) | event `guests`, `registryGifts` |
| `/admin/invites` | `src/app/admin/invites/page.tsx` | `InviteListClient.tsx` | event `guests` (all codes), `settings/inviteTemplate` |
| `/admin/guests` | `src/app/admin/guests/page.tsx` | `GuestListClient.tsx` (CSV export via papaparse) | event `guests` |
| `/admin/gifts` | `src/app/admin/gifts/page.tsx` | `GiftsClient.tsx` | event `registryGifts` |
| `/admin/registry` | `src/app/admin/registry/page.tsx` | `RegistrySelectionsClient.tsx` | event `giftSelections` |
| `/admin/content` | `src/app/admin/content/page.tsx` (client, tab list) | `*Editor.tsx` in same folder ("Site Text" tab = `SiteTextEditor.tsx`, "Theme & Colors" = `ThemeEditor.tsx`); each takes an `eventId` prop from the page | event `content/*` + Vercel Blob |
| Content editors' shared pieces: sticky Undo / Restore / Save row with live status (`EditorSaveBar.tsx`), "Leave without saving?" guard for tab switch, admin links and page close (`unsavedChanges.tsx`), character limits + counter (`CharCount.tsx`, `TEXT_LIMITS`) | `src/app/admin/content/page.tsx` | `EditorSaveBar.tsx`, `unsavedChanges.tsx`, `CharCount.tsx`; after each live write `refreshGuestSite.ts` | – |
| sidebar/nav | `src/app/admin/layout.tsx` | – | – |
| Manage Admins (sidebar button, super admins only; no route) | `src/app/admin/layout.tsx` | `src/app/admin/components/ManageAdminsModal.tsx` | `admins`, `adminAllowlist` |
| shared UI | `src/app/admin/components/AdminModal.tsx`, `TablePagination.tsx` | | |

## Auth, rules, infrastructure

| Feature | Files |
| --- | --- |
| `/admin` redirect when no cookie | `src/proxy.ts` |
| Admin check (session cookie + `admins/{uid}`) for actions and pages | `src/lib/requireAdmin.ts` (`getAdmin`, `getAdminUid`, `requireAdmin`, `requireSuperAdmin`, `requireAdminPage`) |
| Clear a bad session and go to login | `src/app/api/logout/route.ts` |
| RSVP confirmation email to the guest (Gmail SMTP) | `src/lib/email/sendRsvpConfirmation.ts`, called via `after()` in `submitRsvp` |
| Firestore paths: every collection and doc path, event-scoped (`paths`, `DEFAULT_EVENT_ID` (env `NEXT_PUBLIC_DEFAULT_EVENT_ID`), `isValidEventId`) | `src/lib/eventPaths.ts`, tested by `src/lib/eventPaths.test.ts` |
| Copy root collections into an event (dry run / `--write` / `--overwrite` / `--verify`) | `scripts/migrate-to-events.js` |
| Add the generic content fields to old-shape content docs (dry run / `--write` / `--verify` / `--dump`) | `scripts/migrate-content-f5.js` |
| Firebase client init | `src/lib/firebase/client.ts` |
| Firebase admin init (env parsing) | `src/lib/firebase/admin.ts` |
| Firestore / Storage rules | `firestore.rules`, `storage.rules`, `firebase.json`, `.firebaserc` |
| Shared types | `src/types/index.ts` |
| Pull Firestore content into JSON | `scripts/sync-content.js` |
| Allowlist an admin or super admin (`--super`) | `scripts/add-admin.js` |
| Next config (remote image hosts, dev origin) | `next.config.ts` |

## Files over 400 lines

Read these by range (`grep -n` then read around the line), never whole.

| Lines | File |
| --- | --- |
| 977 | `src/data/wedding-content.json` |
| 711 | `src/app/admin/content/DressCodeEditor.tsx` |
| 635 | `src/app/admin/content/EntourageEditor.tsx` |
| 628 | `src/app/admin/content/RegistryEditor.tsx` |
| 562 | `src/app/admin/content/OurStoryEditor.tsx` |
| 541 | `src/components/screens/RsvpScreen.tsx` |
| 512 | `src/app/admin/content/GalleryEditor.tsx` |
| 504 | `src/app/admin/content/EventDetailsEditor.tsx` |
| 471 | `src/components/ui/circular-image-gallery.tsx` |
| 470 | `src/app/[event]/GuestSite.tsx` |
| 458 | `src/app/admin/content/FaqsEditor.tsx` |
| 451 | `src/app/admin/content/GlobalSettingsEditor.tsx` |
| 408 | `src/app/admin/content/RsvpFormEditor.tsx` |
