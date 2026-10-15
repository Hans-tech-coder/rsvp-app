# Current state

What is live, what is odd, and what is known to be broken or unused. Update this
when you find or fix one of these.

## Shipped

- Guest site of up to 10 screens (admins reorder, hide and rename them; Oct 2026) with Motion (`motion/react`) crossfade screen swaps,
  text/image reveal animations, scroll reveals and light parallax, circular 3D
  gallery lightbox, background music. The 2026-09 motion work measured CLS 0
  and ≤ 1.6 % slow frames on every swap and scroll, and passed a real-phone
  check (see `docs/conventions.md` → Motion performance check).
- Invite-code RSVP with one-time codes (transaction-safe).
- Curated registry with claim limits (transaction-safe) and bank-transfer info.
- Admin: dashboard counts, invite generation + message template, RSVP list with
  CSV export, gift CRUD, claim list, content editors for all 12 screens (People
  groups, venues, hosts and dress-code guidelines are lists, for any event type,
  since Oct 2026) and
  a Site Text tab for every button, label, hint and error (Oct 2026), a
  Colors & Fonts tab (preset palettes, custom colors, contrast check, five
  font pairings, live preview; Oct 2026), a Music tab (on/off, upload a song,
  starting volume; Oct 2026), a Screens & Menu tab (reorder, show/hide,
  rename screens; Oct 2026). Editors save drafts (autosaved), a Publish
  button makes them live, History keeps the last 10 published versions per
  doc, and a phone / desktop preview shows the draft site (F9, Oct 2026). Google sign-in with an email allowlist; super admins
  add and remove regular admins from the Manage Admins modal in the sidebar.

## Known issues

| Issue | Where | Notes |
| --- | --- | --- |
| Welcome 3D scene fetches the photo twice | `DepthParallaxScene.tsx` loads the raw Blob URL; the loader preloads the `next/image` srcset URL | ~220 KB extra on first visit. Feed the scene the same optimized URL to share the cache |
| Replaced images are never deleted from Blob | all editors | Counts against the shared 1 GB Hobby Blob quota |
| Legacy Firebase Storage URLs return 402 | Firestore `events/hans-and-czay/content/*` (and the old root `websiteContent/*` copy), `wedding-content.json` |Google billing account closed; replace by re-uploading in the admin, then `npm run sync-content`. See `docs/data-model.md` |
| `wedding-content.json` has a mixed `gallery` key and an unused `faqs` key | `src/data/wedding-content.json` | Side effect of `sync-content.js`; see `docs/data-model.md` |
| Content merge is hand-written per doc | `mergeWeddingContent()` in `src/lib/weddingContent.ts` | New fields in field-by-field docs need an explicit line |
| `RsvpScreen` falls back to `'dev-mode'` as the code | `src/app/[event]/GuestSite.tsx` | Submission fails server-side, which is the intended outcome |
| `npm run lint` fails (89 errors, 51 warnings, all older than the 2026-09 motion work) | mainly `react-hooks/set-state-in-effect`, `no-explicit-any`, unused vars | `npm run build` is the working gate until they are fixed |
| Some motion ignores `prefers-reduced-motion` | `WelcomeScreen.tsx:74` and `RsvpCtaScreen.tsx:28` (background zoom), modal pop-ins in `OurStoryScreen.tsx:154`, `DetailsScreen.tsx:197`, `RegistryScreen.tsx:115`, `RsvpScreen.tsx:436`, hover lifts in `DetailsScreen.tsx:75,110` and `DressCodeScreen.tsx:71`, FAQ accordion `FaqScreen.tsx:61`, `TwinkleSparks`, the circular gallery | A `<MotionConfig reducedMotion="user">` around `<main>` would cover the Motion transforms; the canvas and GSAP need their own check |
| Circular gallery loads GSAP from cdnjs at runtime | `src/components/ui/circular-image-gallery.tsx` (`loadGsap`) | Third-party script without SRI, and a second animation library next to Motion. Removing it is a design decision |
| Guest page starts Firebase Auth (iframe + gapi scripts) though guests never sign in | `src/lib/firebase/client.ts:18` (`getAuth` at module scope) | Extra startup requests on every guest load |
| FAQ question cards keep `transition-all` while Motion animates them | `FaqScreen.tsx` (`ScrollReveal` className) | CSS may also transition Motion's inline opacity/transform; no jank measured |
| RSVP email ignores the event's font pairing | `src/lib/email/sendRsvpConfirmation.ts` (`font`) | Always Classic (Cinzel / Cormorant Garamond / Inter, mostly blocked by mail clients anyway). Colors do follow the theme |
| Music upload and save not tried signed in (F7) | `MusicEditor.tsx`, `/api/upload` (`music/` branch) | Checked: the editor loads and reads, on/off and volume, the default track plays on the guest site. Not checked: a real upload to Blob, a saved custom track or "off" on the guest site |
| Music volume on iOS goes through Web Audio after the first slider touch | `AudioPlayer.tsx` (`ensureGain`) | Only checked in a desktop browser. On iOS < 17 the ringer switch may silence the music once that happens; the AudioContext is resumed on each `play` |
| A few guest-visible words are still in code | country names in `phoneCountries.ts`; dates formatted with `en-US` (`EntranceScreen`, metadata `{date}`); image `alt` and `aria-*` labels; "Visit Our Website" in the RSVP email | |
| A content change made outside the admin shows within the hour | `src/app/[event]/page.tsx` (`revalidate = 3600`), `publishDraft` in `src/app/actions/content.ts` | Event pages are cached; an admin Publish rebuilds them at once. A Firestore console or script edit waits for the hourly rebuild (the 404 page: the next default-event save or deploy). Facebook and Messenger cache link previews on their side |
| Root collections still hold a copy of the event data | Firestore root `websiteContent`, `guests`, `registryGifts`, `giftSelections`, `settings` + their block in `firestore.rules` | Kept on purpose after the F3 move to `events/hans-and-czay` (rollback path). Re-sync with `scripts/migrate-to-events.js --write --overwrite` right before the F3 deploy; remove later as its own step. See `docs/data-model.md` |
| F3 admin side checked by query, not by a signed-in session | `src/app/admin/**` | The admin pages' exact queries and the deployed rules were run against `events/hans-and-czay`; no real admin Save, invite generation or gift edit was done after the move |
| A venue's `calendarStart` repeats its time |`EventDetailsEditor.tsx` (venue card: "Time" and "Calendar Start") | Changing the Time does not move the Add to Calendar time; edit both |
| Content docs still hold the old wedding-only fields (F5) | `globalSettings` (`groomName`, `brideName`, venue fields), `entourage` (fixed lists), `details` (`ceremony`, `reception`), `dressCode` (`ladiesGuideline`, `gentlemenGuideline`) | Kept on purpose for a rollback to pre-F5 code; frozen at the 2026-10-14 migration. Remove in a later step (`docs/data-model.md` → Generic content shapes) |
| Publish does not check the live doc for changes made elsewhere | `publishDraft` in `src/app/actions/content.ts` | The `updatedAt` check covers drafts only. A live doc changed outside the drafts (console, script, an older deployed admin still writing `content` from the browser) since the draft was started is overwritten by Publish; that version is not in History either. Until F10 the owner is the only editor |
| `content` is still writable from the browser by any admin | `firestore.rules` (`events/{eventId}/content`: `allow write: if isAdmin()`) | Editors no longer write it (F9), but the rule was not tightened (needs a rules deploy). Drafts and versions have no rule, so the browser cannot touch them |
| F9 partly tried against Firestore | `src/app/actions/content.ts` | Checked signed in on :3000 (2026-10-15): load, History, Restore, autosave, the draft in `?preview=` and not on the live page, Discard, and one Publish of an unchanged `globalSettings` (live doc identical before and after, draft deleted, `contentVersions/globalSettings` stored with the publish + "Before drafts" + "Older backup"). Not tried: a two-tab conflict, Restore of a version that differs, the guest page rebuild after Publish on Vercel (dev does not cache) |
| Old `<doc>_backup` docs stay in Firestore | `events/{eventId}/content/*_backup` | No longer written; read once as "Older backup" until a doc's first Publish stores its version list. Delete later |
| The admin preview shares the guest site's RSVP flow | `src/app/[event]/preview/page.tsx` | It is the real site: an RSVP or gift claim sent from the preview is real. Its saved step progress is kept apart (`event:<id>:preview:*` keys) |
| Timeline entry photo cannot be removed, only replaced | `OurStoryEditor.tsx` | An entry without a photo shows no image block on the site, but the editor has no "remove photo" button |
| Sign Out does not warn about unsaved content edits | `src/app/admin/layout.tsx` (`handleLogout`) | Tab switch, admin links and page close do (`unsavedChanges.tsx`) |
| Screens save not tried signed in (F8) | `ScreensEditor.tsx` | Checked: the editor reads the live doc with no false "unsaved" state, the list reorders (arrows, keyboard drag), hides and renames at phone width; the guest flow with a reordered/hidden list (temporary route, removed). Not checked: a real Save to `content/screens` and the rebuilt guest page |
| A guest's saved step is a position, not a screen | `GuestSite.tsx` (`event:<eventId>:currentStep`, `highestVisitedStep`) | After an admin reorders or hides screens, a returning guest resumes at the same position (clamped to the last), which may be another screen; the menu unlocks by position too |
| Circular gallery keeps the last-closed photo mounted | `circular-image-gallery.tsx` (`closing` state never resets) | Two extra SVG `<image>`s at most; harmless |

## Unused code and dependencies

- `recharts`, `@tanstack/react-table` — in `package.json`, not imported.
- `refactor_editors.py` — one-off script with a hard-coded macOS path.
- `legacy/` — the old static site, reference only.

- Firebase Storage: `storage` export in `src/lib/firebase/client.ts`,
  `getAdminStorage` in `admin.ts`, `storage.rules` — no longer used for uploads.
  Keep until the legacy URLs are gone (rollback path), then remove.

Remove them only when asked.

## Deployment

Vercel (Node 22). Image uploads need a **public** Vercel Blob store connected
to the project (`BLOB_READ_WRITE_TOKEN`). Firestore/Storage rules are deployed separately with the
Firebase CLI. The Vercel project must have all `FIREBASE_ADMIN_*` and
`NEXT_PUBLIC_FIREBASE_*` variables set at **build** time too: `not-found.tsx`
reads Firestore when the static 404 is built, event pages when they are
(re)generated, and every admin page calls the admin SDK at request time.
Links that leave the site (link previews, invite message, RSVP email) use
`getSiteUrl()` (`src/lib/siteUrl.ts`): `NEXT_PUBLIC_SITE_URL` if set, else
Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, else `http://localhost:3000`. Set
`NEXT_PUBLIC_SITE_URL` when a custom domain is added.
