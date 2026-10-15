# Feature map

Which files implement which feature. Find the feature, open only the files
listed. Paths are relative to the repo root. Update this file whenever a file is
added, moved, or deleted.

## Guest site (`/<eventId>`)

`/` redirects to the default event (`src/app/page.tsx`). Each event's guest
site is one cached server page, `src/app/[event]/page.tsx`, around one client
component. Step numbers are the default order (no `content/screens` doc);
admins reorder, hide and rename screens in the Screens & Menu tab, so an
event's `currentStep` values follow its own list (see Screens below).

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
| – | Invite-code lock overlay (before the RSVP form step) | `src/components/screens/EntranceScreen.tsx` | `entranceScreen`, `global` | `EntranceScreenEditor.tsx` |
| 9 | RSVP form (inline validation, phone field) | `src/components/screens/RsvpScreen.tsx`, `src/components/ui/PhoneField.tsx`, `src/lib/phoneCountries.ts` (+ `.test.ts`) | `rsvpForm` | `RsvpFormEditor.tsx` |

All editors are in `src/app/admin/content/`.

### Guest-site shell and shared pieces

| Feature | Files |
| --- | --- |
| Per-event route: 404 for an unknown event, title/description/link preview (`generateMetadata`), ISR cache (`revalidate`, empty `generateStaticParams`); renders `EventSite` (mounts `SiteTextProvider`, `ThemeStyle`, `WeddingContentProvider`, `GuestSite`, `AudioPlayer`) | `src/app/[event]/page.tsx`, `src/app/[event]/EventSite.tsx` |
| Admin draft preview: `/<eventId>?preview=<token>` rewritten (`next.config.ts` `beforeFiles`) to a per-request, `noindex`, admins-only page that reads the raw docs with drafts applied (`getEventDraftDocs`) and builds the site in the browser (`PreviewSite` → `buildEventSite` → `EventSite`), with a "Draft preview" badge; non-admins are redirected to the live page. Inside the visual builder it also takes live edits and does hover / click-to-select (postMessage, `src/lib/builderMessages.ts`) | `src/app/[event]/preview/page.tsx`, `src/app/[event]/preview/PreviewSite.tsx`, `next.config.ts`, `src/lib/siteContentServer.ts`, `src/lib/eventSite.ts` |
| `/` → default event redirect | `src/app/page.tsx` |
| Step state, back/menu buttons, screen transitions, RSVP lock, localStorage (keys `event:<eventId>:…`, `event:<eventId>:preview:…` in the admin preview); `renderScreen(type)` maps a screen type to its component; preview only (`PreviewControl`): `data-section` on the shown screen, `onGoto` to show a section, stays on the shown screen when the builder reorders; `data-field` markers on texts through `useFieldMarker()` (Welcome texts and the section headers; list in `docs/content-system.md` → How an editor works, step 11) | `src/app/[event]/GuestSite.tsx`, `src/contexts/EditMarkersContext.tsx` |
| Screens: which screens are shown, their order and menu names per event (`content/screens`; `SCREEN_TYPES`, `mergeScreens`, `visibleScreens`, `screenLabel`, Welcome pinned, RSVP locked by type); passed as `<GuestSite screens>` | `src/lib/screens.ts` (tested by `screens.test.ts`), read in `src/lib/siteContentServer.ts`; editor `src/app/admin/content/ScreensEditor.tsx` (tab "Screens & Menu") around the reusable list `src/app/admin/components/ScreenList.tsx` (drag / arrows, show-hide switch, rename; also the visual builder's section list through `selected` / `onSelect`); admin names of the screens `SCREEN_NAMES` in `screens.ts` |
| Content loading: read on the server (`getEventContent`, admin SDK), merged over the JSON defaults (`buildEventSite` in `src/lib/eventSite.ts`: `mergeWeddingContent`, `mergeGlobal`, `CONTENT_DOC_IDS`, site text, theme, music, screens), handed to the browser with the event ID | `src/lib/siteContentServer.ts` (server only), `src/lib/eventSite.ts` (pure, also run by the preview), `src/lib/weddingContent.ts`, `src/contexts/WeddingContentContext.tsx` (`useWeddingContent`), `src/data/wedding-content.json` |
| Site text: every small guest-visible wording (buttons, labels, hints, errors, default menu names, loader, 404, link preview). Read on the server, given to all guest components by `src/app/[event]/page.tsx` (404: `not-found.tsx`); `useSiteText()` in a component | `src/lib/siteContentServer.ts` (`getEventContent` / `getSiteContent`, server only), `src/contexts/SiteTextContext.tsx` (`SiteTextProvider`, `useSiteText`), `src/lib/siteText.ts` (`SiteText` type, `mergeSiteText`, `fillText`, `fillNodes`; tested by `src/lib/siteText.test.ts`), JSON key `siteText`; editor `src/app/admin/content/SiteTextEditor.tsx` + field labels `siteTextFields.ts` |
| Step menu overlay (labels per step come from `GuestSite.tsx`) | `src/components/layout/CanvasMenu.tsx` |
| Footer at the bottom of scrolling screens (monogram from `global.hosts` initials, tagline `global.footerTagline`, date `global.targetDate` as DD.MM.YYYY; all edited in `GlobalSettingsEditor.tsx`) | `src/components/layout/EmbeddedFooter.tsx` |
| Background music + floating toggle, volume slider, "music is playing" hint (track, on/off and start volume per event from `content/music`) | `src/components/AudioPlayer.tsx`, `.t-vol-*` in `src/app/globals.css`, `public/bg-music.mp3` (default track); `src/lib/music.ts` (type, `mergeMusic`, tested by `music.test.ts`); editor `src/app/admin/content/MusicEditor.tsx` (tab "Music"), upload `src/lib/blob/uploadAudio.ts` |
| Theme script, `metadataBase` (site URL) and the admin pages' title; mounts the fonts | `src/app/layout.tsx` |
| Font pairings: every font loaded by next/font (`src/app/fonts.ts`), pairings and role variables `font-heading`/`-elegant`/`-body` (`src/lib/fonts.ts`, tested by `fonts.test.ts`); chosen per event as `theme.fontPairing` in the Colors & Fonts tab | `src/app/fonts.ts`, `src/lib/fonts.ts`, `src/app/admin/content/ThemeEditor.tsx` |
| Site URL for links that leave the site (link preview base, invite message, RSVP email): `getSiteUrl`, `getEventUrl` | `src/lib/siteUrl.ts` (server only) |
| 404 page for any unknown URL or event (default event's look: couple's photo inside the "404", days-to-wedding line, "Back to the celebration" → `/`; global settings read on the server and passed as `site`; own `SiteTextProvider` + `AudioPlayer`; wording from site text `notFound`; same burgundy backdrop and button style as the inner screens; embossed logo `.t-emboss` in `globals.css`; also mounts `FallingPetals` and `WeddingCursor`) | `src/app/not-found.tsx` (metadata) → `src/components/screens/NotFoundScreen.tsx` |
| Colors, fonts, motion tokens, reveal CSS | `src/app/globals.css` |
| Theme: each event's colors (semantic tokens `ink`, `surface`, `primary`, `accent`… and the font roles, overridden per event as a server-rendered `:root` style; presets, shade derivation, WCAG contrast) | `src/lib/theme.ts` (tested by `src/lib/theme.test.ts`), `src/components/ThemeStyle.tsx` (mounted by `src/app/[event]/page.tsx` and `src/app/not-found.tsx`), read in `src/lib/siteContentServer.ts`; editor `src/app/admin/content/ThemeEditor.tsx` (tab "Colors & Fonts"), doc `content/theme` |
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
| `loadDraft`, `saveDraft` (conflict check on the draft's `updatedAt`), `publishDraft` (draft → live, version list, rebuilds the event's cached page; the default event also the 404), `discardDraft`, `getVersion`; doc shapes and pure helpers in `src/lib/contentDrafts.ts` (tested by `contentDrafts.test.ts`) | `content.ts` | every content editor, through `admin/content/contentDraft.tsx` (`useContentDraft`) and `EditorSaveBar.tsx` |
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
| `/admin/content` | `src/app/admin/content/page.tsx` (client, tab list, preview panel) | `*Editor.tsx` in same folder ("Site Text" tab = `SiteTextEditor.tsx`, "Screens & Menu" = `ScreensEditor.tsx`, "Colors & Fonts" = `ThemeEditor.tsx`, "Music" = `MusicEditor.tsx`); each takes an `eventId` prop from the page | event `content/*` + Vercel Blob |
| Visual builder (F9a): full-screen; section list (the Screens editor with `ScreenList` in pick mode) + "Whole site" panels on the left, the draft preview (`PreviewFrame`) in the middle, the picked section's editor (the same `*Editor.tsx`) in a drawer; click in the preview opens a section (and focuses a marked field), edits show live, one undo / redo across panels, unsaved edits saved as a draft when switching panels; tablet and wider (phones: a link to Content) | `src/app/admin/builder/page.tsx` | `builderContext.tsx` (editor ↔ builder link, used by `EditorSaveBar`), `src/lib/builderHistory.ts` (undo / redo, tested by `builderHistory.test.ts`), `src/lib/builderMessages.ts` (postMessage protocol), `src/app/[event]/preview/PreviewSite.tsx` | `drafts/*`, `contentVersions/*` via the editors |
| Content editors' shared pieces: sticky Undo / History / Save Draft / Publish row with draft status, 10 s autosave to the draft, conflict prompt; `doc` / `merge` props hand the doc as it would be saved to the visual builder (`EditorSaveBar.tsx`, laid out by container queries); draft / publish / versions hook and the page context that reloads the preview or the editor (`contentDraft.tsx`); "Leave without saving?" guard for tab switch, admin links and page close (`unsavedChanges.tsx`); character limits + counter (`CharCount.tsx`, `TEXT_LIMITS`) | `src/app/admin/content/page.tsx` | `EditorSaveBar.tsx`, `contentDraft.tsx`, `unsavedChanges.tsx`, `CharCount.tsx` | `drafts/*`, `contentVersions/*` via `src/app/actions/content.ts` |
| Draft preview frame: Preview button on the content page (docked from 1024 px, full screen below); phone / desktop / both iframes of `?preview=`, scaled to fit; also the visual builder's canvas | `src/app/admin/content/page.tsx`, `src/app/admin/builder/page.tsx` | `src/app/admin/components/PreviewFrame.tsx` | – |
| sidebar/nav | `src/app/admin/layout.tsx` | – | – |
| Manage Admins (sidebar button, super admins only; no route) | `src/app/admin/layout.tsx` | `src/app/admin/components/ManageAdminsModal.tsx` | `admins`, `adminAllowlist` |
| shared UI | `src/app/admin/components/AdminModal.tsx`, `TablePagination.tsx`, `PreviewFrame.tsx` | | |

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
| 621 | `src/app/admin/content/DressCodeEditor.tsx` |
| 576 | `src/app/admin/content/EntourageEditor.tsx` |
| 541 | `src/components/screens/RsvpScreen.tsx` |
| 540 | `src/app/admin/content/RegistryEditor.tsx` |
| 488 | `src/app/admin/content/OurStoryEditor.tsx` |
| 471 | `src/components/ui/circular-image-gallery.tsx` |
| 445 | `src/app/admin/content/EventDetailsEditor.tsx` |
| 428 | `src/app/admin/content/GalleryEditor.tsx` |
| 427 | `src/app/[event]/GuestSite.tsx` |
