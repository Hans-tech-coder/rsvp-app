# Current state

What is live, what is odd, and what is known to be broken or unused. Update this
when you find or fix one of these.

## Shipped

- Guest site of up to 10 screens (admins reorder, hide and rename them; Oct 2026) with Motion (`motion/react`) crossfade screen swaps,
  text/image reveal animations, scroll reveals and light parallax, circular 3D
  gallery lightbox, background music. The 2026-09 motion work measured CLS 0
  and ≤ 1.6 % slow frames on every swap and scroll, and passed a real-phone
  check (see `docs/conventions.md` → Motion performance check).
- No public JavaScript carries the first couple's content (2026-10-16): no
  `/_next/static/chunks` file holds `src/data/wedding-content.json` (guest
  pages, admin, draft preview, the 404). The merge lives in
  `src/lib/contentMerge.ts` (no JSON; defaults are an argument),
  `src/lib/weddingContent.ts` (imports the JSON) is server only, and the
  editors and `PreviewSite` get `CONTENT_DEFAULTS` from the server in the
  page's payload, for a signed-in admin only. If `/api/not-found` fails twice
  the 404 shows a generic page (no JSON chunk any more), and the editor
  placeholders use neutral examples (`Maria & Jose`, `Tagaytay, Cavite`, a
  parking FAQ). Check with `docs/content-system.md` → "Browser JavaScript
  must not import the JSON". The admin chunks still hold generic wedding
  wording from the editors' own `|| "…"` fallbacks and entourage group
  titles (`Principal Sponsors`), nothing naming a couple.
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
  doc, and a phone / desktop preview shows the draft site (F9, Oct 2026). A
  visual builder (`/admin/builder`, tablet and wider) shows the draft site
  with the section list and the editors around it: click a section to edit
  it, live preview, undo / redo (F9a, Oct 2026). Google sign-in by invite only. Roles per event
  (F10, Oct 2026): platform owners (every event), organizers (everything in
  the event and its Team page) and clients (content, guests, gifts; the
  design only if allowed); an activity log and a one-tab-at-a-time builder
  lock with take-over.

## Known issues

| Issue | Where | Notes |
| --- | --- | --- |
| Welcome 3D scene fetches the photo twice | `DepthParallaxScene.tsx` loads the raw Blob URL; the loader preloads the `next/image` srcset URL | ~220 KB extra on first visit. Feed the scene the same optimized URL to share the cache |
| Unused Blob files are deleted only once the cron runs | `src/app/api/cron/blob-cleanup/route.ts`, `vercel.json` | Needs `CRON_SECRET` in Vercel (not set on 2026-10-16); until then only an owner's Delete on the Settings page removes them. The first dry run (2026-10-16, read only) found 4 unused files (old `images/our-story-*`, 0.4 MB) of 61; nothing was deleted |
| Legacy Firebase Storage URLs return 402 | Firestore `events/hans-and-czay/content/*` (and the old root `websiteContent/*` copy), `wedding-content.json` |Google billing account closed; replace by re-uploading in the admin, then `npm run sync-content`. See `docs/data-model.md` |
| `wedding-content.json` has a mixed `gallery` key and an unused `faqs` key | `src/data/wedding-content.json` | Side effect of `sync-content.js`; see `docs/data-model.md`. `faqs` is left out of `DEFAULT_CONTENT` (`src/lib/weddingContent.ts`), so it never reaches a page |
| Content merge is hand-written per doc | `mergeContent()` in `src/lib/contentMerge.ts` | New fields in field-by-field docs need an explicit line |
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
| Publish does not check the live doc for changes made elsewhere | `publishDraft` in `src/app/actions/content.ts` | The `updatedAt` check covers drafts only. A live doc changed outside the drafts (console, script, an older deployed admin still writing `content` from the browser) since the draft was started is overwritten by Publish; that version is not in History either. Two members editing the same doc on the content page are guarded by the draft check only (the edit lock is the builder's) |
| F10 member migration added nothing | `scripts/migrate-members-f10.js` | Ran on 2026-10-15 (`--write`, `--verify` OK): both accounts are owners. Run it again if a regular admin or invite is added with the old code before the F10 push. The F10 rules are deployed (2026-10-15, see `docs/security.md`) |
| F10 checked with owner accounts only | `src/app/actions/team.ts`, `auth.ts` | No second (organizer / client) account has signed in: the invite claim, Team add / re-role / remove and a real client session are untried. The client UI locks were checked by forcing the role in a temporary route. Builder edit lock checked on :3000 (2026-10-15): blocked by another tab of the same account, Take over (logged), heartbeat, auto-claim after a dead lock's 90 s, release by link and by full navigation (beacon), the taken-over tab's overlay within one heartbeat. A tab closed by the browser pane's tool sent no `pagehide`, so its lock waited out the 90 s |
| Organizers are per event, not per agency | `src/lib/permissions.ts`, `events/{eventId}/members` | The plan's "events of their agency" needs an agency record; today an organizer is added to each event on its Team page. Any organizer of any event may create events (F11), and sees only the events they are a member of |
| Events created before F12 show the Wedding defaults (the Hans & Czay text and photos) | `src/data/wedding-content.json` | Since F12 a new event gets every content doc from its template (`src/lib/templates`). An event made with the F11 dialog has no content docs and still shows the JSON defaults until edited |
| Dress Code shows "Dress Code:" before its title | `DressCodeScreen.tsx` line ~67 | A literal F0 missed; reads oddly on the Corporate template's "Attire" page. Needs a `siteText.dressCode` key + Site Text field |
| RSVP email sender changed from "<name> Wedding" to the event's name | `sendRsvpConfirmation.ts`, `settings/email` | F13: an organizer can set any sender name and a reply-to on the Settings page. Still one sending Gmail account for every event (`src/lib/email/sender.ts`) |
| Corporate template: the RSVP proxy field asks for the company | `src/lib/templates/corporate.ts` (`rsvpForm.labels.proxy`) | Stored and listed as `proxy` in Guests, the CSV and the email ("Proxy") |
| Template sample photos are small | `public/templates/*.webp` | Many are 1024 px wide (the free source's size), soft as a full-width desktop background. Replace with larger CC0 photos or the demo events' own (F14) |
| F12 checked with one real create (Debut only) | `createEvent`, `src/app/admin/new` | Checked: 20 unit tests (every template: no first-couple text or Blob photo, known site text keys, photos exist, answers filled in), tsc, build, lint, the wizard on :3000 at 1186 px and 375 px, each template's guest site rendered from `buildTemplateDocs` in a temporary route (removed). Write test 2026-10-15 with the owner's OK (production Firestore, via the wizard on :3000): `f12-test` from the Debut template, Black & Gold; the builder opened on it with the Debut content and palette; `/f12-test` 200 with title "Ana’s Debut \| You Are Invited", template photo as og:image; All Events card "Debut · March 6, 2027"; activity "created the event · Ana’s Debut, from the Debut template". Deleted from All Events: no doc or subcollection left (read-only admin SDK check), `/f12-test` 404, `hans-and-czay` 200. Right after Delete the page showed "This page couldn’t load" because the dev server refused connections for a moment (cause not seen: its log is outside the session); a reload was fine. Not tried: an organizer creating, the Wedding / Birthday / Corporate templates through a real create |
| Archived events still accept RSVPs and gift claims by direct call | `src/app/actions/rsvp.ts`, `registry.ts` | The guest page is a 404, so no guest reaches the forms; the actions themselves do not read `status` |
| Change link is not atomic | `renameEvent` in `src/app/actions/events.ts` | Copy, move accounts, then delete the old ID. An RSVP written to the old ID during the move is lost; a failure after the copy leaves both IDs (the old one still works). Uploaded images keep their Blob URLs (not per event) |
| Delete leaves the event's images in Blob until the next clean-up | `deleteEvent` | No event points at them any more, so the daily clean-up (or an owner's Delete on Settings) removes them a day later (F13) |
| F11 checked with an owner account only | `src/app/actions/events.ts`, `moveEventAccounts` in `src/lib/platformEvents.ts` | On 2026-10-15 on :3000 (production Firestore, owner's OK): create, duplicate (of `hans-and-czay`: 28 content docs equal, 2 settings), change link (old ID gone, every doc moved, the open event followed), archive (guest 404, Archived list) / restore (200), delete with a wrong then the right link (nothing left; `hans-and-czay` unchanged). Not tried: an organizer creating an event (joins as organizer), moving members' `eventIds` and pending invites on change link / delete (the test events had none), the production ISR cache after archive |
| The edit lock covers the visual builder only | `src/app/actions/editLock.ts` | The content page's tab editors do not take it; two people there rely on the draft `updatedAt` check |
| Audit log grows without a cleanup | `events/{eventId}/auditLog` | One small doc per admin change; the Team page shows the last 50 |
| Old `admins.ts` / Manage Admins removed | – | Replaced by the per-event Team page (`/admin/team`, `src/app/actions/team.ts`). An account without events (an old regular admin before the migration) is refused at sign-in |
| F9 partly tried against Firestore | `src/app/actions/content.ts` | Checked signed in on :3000 (2026-10-15): load, History, Restore, autosave, the draft in `?preview=` and not on the live page, Discard, and one Publish of an unchanged `globalSettings` (live doc identical before and after, draft deleted, `contentVersions/globalSettings` stored with the publish + "Before drafts" + "Older backup"). Not tried: a two-tab conflict, Restore of a version that differs, the guest page rebuild after Publish on Vercel (dev does not cache) |
| Visual builder saves not tried (F9a) | `src/app/admin/builder/page.tsx` | Checked on :3000 signed in (2026-10-15, no writes): all 15 panels load in the drawer without overflow at 1440 / 1024 / 768, the phone message at 375; click a Welcome text → its field focused; typing shows in the preview at once and is one undo step; undo / redo; picking a section moves the preview (RSVP form, invite-code screen); hide and undo; a color preset live and undone; the live page has no markers; non-admin `?preview=` → 307. Not tried: Save Draft / Publish from the builder, the save on panel switch, undo across panels (both write a draft), two frames in "Both" |
| Builder click-to-edit covers the Welcome texts and the section headers only | screens in `src/components/screens/` | Marked (`useFieldMarker`): the Welcome texts, each section's header subtitle / title / description and the Dress Code description (checked on :3000, 2026-10-15: each click focused its input). A click on anything else (list items, cards, the Dress Code main title, Registry cards, the invite-code screen) opens the section's editor at the top. The builder focuses the first input with the name, so a repeated `name` cannot be marked without renaming it (the editors' change handlers use `name`) |
| Builder undo history is lost on reload and on Discard | `src/lib/builderHistory.ts` | In memory by design; History (published versions) covers the rest. Entries for a doc whose draft was discarded still undo to their old values |
| A hidden section cannot be shown in the builder preview | `GuestSite.tsx` (`onGoto`) | Picking it opens its editor with a "Hidden" note; the preview stays where it was |
| Old `<doc>_backup` docs stay in Firestore | `events/{eventId}/content/*_backup` | No longer written; read once as "Older backup" until a doc's first Publish stores its version list. Delete later |
| The admin preview shares the guest site's RSVP flow | `src/app/[event]/preview/page.tsx` | It is the real site: an RSVP or gift claim sent from the preview is real. Its saved step progress is kept apart (`event:<id>:preview:*` keys) |
| Timeline entry photo cannot be removed, only replaced | `OurStoryEditor.tsx` | An entry without a photo shows no image block on the site, but the editor has no "remove photo" button |
| Sign Out does not warn about unsaved content edits | `src/app/admin/AdminShell.tsx` (`handleLogout`) | Tab switch, admin links and page close do (`unsavedChanges.tsx`) |
| Screens save not tried signed in (F8) | `ScreensEditor.tsx` | Checked: the editor reads the live doc with no false "unsaved" state, the list reorders (arrows, keyboard drag), hides and renames at phone width; the guest flow with a reordered/hidden list (temporary route, removed). Not checked: a real Save to `content/screens` and the rebuilt guest page |
| A guest's saved step is a position, not a screen | `GuestSite.tsx` (`event:<eventId>:currentStep`, `highestVisitedStep`) | After an admin reorders or hides screens, a returning guest resumes at the same position (clamped to the last), which may be another screen; the menu unlocks by position too |
| Circular gallery keeps the last-closed photo mounted | `circular-image-gallery.tsx` (`closing` state never resets) | Two extra SVG `<image>`s at most; harmless |
| Pre-F13 uploads count toward no event's storage | `getEventStorage` (`src/lib/blob/eventStorage.ts`) | The first wedding's files (`images/`, `gallery/`, `website/`, about 8 MB) are in no event folder, so its Settings page shows 0 MB until new uploads. They are still cleaned up when unused |
| A new event that takes a former link shares that folder's count | `getEventStorage` (folders `events/<id>/` + `formerIds`) | After `a` is renamed to `b`, a new event called `a` also counts `events/a/` (which `b` counts too). Rare; usage only, nothing is deleted by it |
| Storage cap is one number for every event | `EVENT_STORAGE_CAP_BYTES` in `src/lib/blob/blobRefs.ts` | 200 MB. No per-event override yet (needed when plans differ, at the paid upgrade) |
| `rateLimits` docs are never removed | `src/lib/inviteRateLimit.ts` | Each has `expiresAt`; set up a Firestore TTL policy on `rateLimits.expiresAt` (console) to delete them. Rate limit not tried against production Firestore (would write a doc); unit-tested only |
| Firestore reads that grow with the platform (F13 budget check) | admin layout (`listEventChoices`: an owner still reads every event doc on every admin click, N reads), Guests / Invites (every guest doc per view) | Fine today (see "Firestore read budget" in `docs/data-model.md`). Already fixed: the switcher no longer reads `globalSettings` (event `siteName`), the dashboard uses count queries, the guest registry list is cached. Next when events grow: page the guest lists on the server; cache the switcher list per account |

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
to the project (`BLOB_READ_WRITE_TOKEN`). The daily Blob clean-up (Vercel Cron in
`vercel.json`) runs only when `CRON_SECRET` is set in the Vercel project
(any long random string); Hobby runs it once a day at an approximate time. Firestore/Storage rules are deployed separately with the
Firebase CLI. The Vercel project must have all `FIREBASE_ADMIN_*` and
`NEXT_PUBLIC_FIREBASE_*` variables set at **build** time too: `/api/not-found`
(the 404 page's content) reads Firestore when it is built, event pages when they are
(re)generated, and every admin page calls the admin SDK at request time.
Links that leave the site (link previews, invite message, RSVP email) use
`getSiteUrl()` (`src/lib/siteUrl.ts`): `NEXT_PUBLIC_SITE_URL` if set, else
Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, else `http://localhost:3000`. Set
`NEXT_PUBLIC_SITE_URL` when a custom domain is added.
