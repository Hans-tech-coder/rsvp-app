# Guest site (`/<eventId>`)

Each event's guest site lives at **`/<eventId>`** (e.g. `/hans-and-czay`).
`src/app/page.tsx` redirects `/` to the default event (`DEFAULT_EVENT_ID` in
`src/lib/eventPaths.ts`, override with `NEXT_PUBLIC_DEFAULT_EVENT_ID`), so old
links to the bare domain keep working. An unknown or invalid event ID is a 404.

`src/app/[event]/page.tsx` (server) reads the event's content and site text,
sets the title and link preview, and renders the cached page (see Caching in
`docs/content-system.md`). Inside it, the guest site is **one client
component** (`src/app/[event]/GuestSite.tsx`) that swaps full-screen "screens"
in place. There is no routing between screens and no URL per screen.

## Step flow

`currentStep` (0–9) picks the screen. Order and labels are defined twice and
must stay in sync: the `currentStep === n` blocks in `GuestSite.tsx` and
`menuItems` in `src/components/layout/CanvasMenu.tsx` (labels from
`siteText.menu`, editable in the Site Text tab).

| Step | Screen | Menu label |
| --- | --- | --- |
| 0 | `WelcomeScreen` | Welcome |
| 1 | `OurStoryScreen` (timeline; a photo per entry is optional) | Our Story |
| 2 | `EntourageScreen` (People groups) | Entourage |
| 3 | `DetailsScreen` | Details |
| 4 | `DressCodeScreen` | Dress Code |
| 5 | `GalleryScreen` | Gallery |
| 6 | `FaqScreen` | FAQs |
| 7 | `RegistryScreen` | Registry |
| 8 | `RsvpCtaScreen` | Join Our Day |
| 9 | `RsvpScreen` (locked) | RSVP |

**Any event type.** The wedding-specific parts are content lists (shapes in
`docs/data-model.md` → Generic content shapes): Welcome / Entrance show the
hosts' names (`global.hosts`, "A & B", "A, B & C", or one name), the loader and
footer their initials; Entourage renders `entourage.groups` (pairs groups full
width, list / featured groups two side by side, empty groups hidden); Details
renders one card per `details.venues` entry (one or an odd last card centered,
empty fields and buttons hidden); Dress Code renders `dressCode.guidelines`
two per row (hidden when empty).

Every screen takes `onContinue` (→ `nextStep`). Some also take
`onLightboxChange` (Our Story, Gallery, Dress Code) so `GuestSite.tsx` can hide the back/menu
buttons and add `body.lightbox-open`.

To **add, remove, or reorder a screen**: edit the step blocks in `GuestSite.tsx`,
`menuItems` in `CanvasMenu.tsx`, the hard-coded `9` (RSVP step) in
`goToStep` / `handleStartUnlock`, the `goToStep(7)` back target of `RsvpScreen`,
and the table in `docs/FEATURE-MAP.md`.

## State kept in `GuestSite.tsx`

Saved keys are per event, `event:<eventId>:<name>`, so two events in one
browser don't share progress or an unlocked RSVP.

| State | Purpose | Persisted in `localStorage` |
| --- | --- | --- |
| `currentStep` | visible screen | `event:<eventId>:currentStep` |
| `highestVisitedStep` | menu only allows steps already reached | `event:<eventId>:highestVisitedStep` |
| `isUnlocked` | RSVP step is reachable | `event:<eventId>:isUnlocked` |
| `validatedInviteCode` | code passed to `RsvpScreen` | `event:<eventId>:inviteCode` |
| `showEntranceScreen` | code-entry overlay is open | no |
| `isMenuOpen`, `isLightboxOpen` | overlays | no |

`mounted` guards the first render so localStorage is read only on the client.

## RSVP lock

1. Going to step 9 while `!isUnlocked` opens the `EntranceScreen` overlay instead.
2. `EntranceScreen` calls `verifyInviteCode(code)` (server action). On success it
   calls `onStartUnlock` (unlocks, moves to step 9 behind the overlay), then
   `onUnlock(code)` (stores the code, closes the overlay).
3. `RsvpScreen` validates in the browser first (`validateRsvp`, form is
   `noValidate`): full name (two words), email, phone (country minimum digits),
   attendance (no default; the guest must pick) and the privacy box are
   required; proxy (shown on "decline") and message (max 500, counter) are
   optional. Each field has a hint line that its error replaces; errors show
   after the field is left or after a submit attempt and clear as soon as the
   value is fixed. A failed submit focuses and scrolls to the first bad field
   and shows a count above the button. "Fields marked * are required" is a
   floating card (same style as the music hint) beside the Full Name asterisk:
   shown once, 0.7 s after that field is fully in view, and kept until the
   first input anywhere in the form (`onInput`: typing, a choice, the checkbox,
   the country code) or a submit attempt. When it appears every asterisk
   pulses three times (`data-hint="on"` on the form,
   `group-data-[hint=on]/form:` classes). The hint, placeholder and error texts
   come from site text (`siteText.rsvp`, `siteText.phone`; Site Text tab).
   The phone country is first guessed from the device time zone, then
   language (on Windows any UTC+8 zone counts as PH, because Windows has no
   Manila zone and PH PCs report e.g. `Asia/Shanghai`), then replaced by the
   IP country from `getVisitorCountry()` unless the guest already touched the
   field; Philippines is the fallback. `getVisitorCountry` reads Vercel's
   `x-vercel-ip-country`; without it, it looks the IP up at `api.country.is`
   (in dev, the machine's own public IP).
   A leading `0` and a pasted `+<code>` are stripped (a pasted foreign code
   switches the country), digits are capped at the country maximum, and the
   number is saved as `+63 917 123 4567`.
   Then `RsvpScreen` calls `submitRsvp(inviteCode, formData)`. The action runs a
   Firestore transaction that fails if the code is already `used`. After it
   succeeds, `after()` sends the guest a confirmation email
   (`src/lib/email/sendRsvpConfirmation.ts`, Gmail SMTP via nodemailer): their
   answers, plus date, every venue and dress code (with palette
   swatches) when attending, or when declining with a proxy (the intro then
   names the proxy); a decline without a proxy gets only the thank-you and
   answers. The email matches the site's look: the OG image as
   hero, the event's theme colors (`content/theme` through `mergeTheme()`, so the
   default palette without a saved theme) inlined as hex because email clients
   cannot read CSS variables (`line` and `muted` are blended with `mixHex()`, since
   many clients drop `rgba()`), and Cinzel / Cormorant Garamond / Inter
   from Google Fonts (the Classic pairing, whatever the event's font pairing). Gmail and Outlook block web fonts and fall back to
   Georgia/Arial. Content follows the same precedence as `WeddingContentContext` (JSON defaults,
   then the event's `content/details`, `dressCode`, `globalSettings`, `theme`).Missing Gmail
   env vars or a failed send are logged and never fail the RSVP.
4. On success, `onSubmitSuccess` relocks (`isUnlocked = false`, code cleared).

`RsvpScreen` receives `'dev-mode'` if no code is stored; submitting with it fails
server-side (no such doc).

## Registry claim

`RegistryScreen` shows bank-transfer info and embeds `CuratedRegistryScreen`,
which loads gifts with `getRegistryGifts()` and claims one through
`GiftSelectionModal` → `claimGift(giftId, {fullName, email, message})`. The
transaction rejects when `currentCount >= maxCount`.

## Transitions and motion

- **Screen swap:** `pageVariants` in `GuestSite.tsx` is a crossfade inside an
  `AnimatePresence` with no `mode="wait"`. The new screen enters from the tap
  (opacity + `transform: scale(0.97→1)`, 0.7 s, `[0.22, 1, 0.36, 1]`) on top of
  the old one, which fades out in 0.45 s. The exiting screen flips to
  `zIndex: 0` and `pointerEvents: none` at once, so it never covers or catches
  taps. Under reduced motion it is an opacity-only 0.15 s fade
  (`useReducedMotion`). Screens are `absolute inset-0` and remount on each
  swap, so every screen opens scrolled to the top.
- **Loader → first screen:** the outer `AnimatePresence` in `GuestSite.tsx` has no
  `mode="wait"`, so `<main>` mounts under `LoadingScreen` while it fades out.
  The loader's exit is a CSS opacity transition on `--duration-very-slow` /
  `--ease-in-out` driven by `usePresence` (instant under reduced motion).
  The loader stays up until content has loaded (the 12 `content` docs of the event
  are fetched in parallel) and fonts plus, on step 0, the Welcome hero image
  are ready (`assetsReady`). The asset wait is capped at `LOADER_MAX_WAIT_MS`
  (2.5 s after navigation).
- **Welcome background:** `DepthParallaxScene` draws the photo in WebGL, shifted
  per pixel by a depth map (mouse on desktop, tilt on phones: full swing at
  12 degrees, re-centring on the grip angle over ~4 s, ~23 px on a phone; after 1.5 s
  without input an idle drift fades in, ~28 px desktop / ~18 px phone on a
  ~16 s loop; iOS gets the drift only, since tilt needs a permission prompt). The
  fireflies fly at their own depths, hide behind the couple and blur out of
  focus. Up to 16 of them stay in the couple's area (`subject` rect, image uv,
  in `DEPTH_MAPS`) and light the photo there: the background shader multiplies
  a warm light into surfaces at the firefly's depth (the photo's own color only,
  so dark areas do not turn orange). The optional `unlit` ellipse gets no light;
  it is set on the groom's hair. It runs only when the photo URL has
  a map in `DEPTH_MAPS`
  (`src/lib/welcomeDepthMaps.ts`); otherwise, under reduced motion, or without WebGL, the
  flat photo + `TwinkleSparks` render. With the scene on, `MotionHint` shows
  just above the countdown (absolute inside the countdown group; one line and
  more compact on screens under 700 px tall) 2.6 s after
  the Welcome mounts: "Move your mouse" when `hasMouse()` (`src/lib/pointer.ts`)
  is true, "Tilt your phone" on touch devices (if neither is known yet and the
  pointer is not coarse, the mouse hint waits for the first real mouse move), and on iOS a "Tap to enable
  motion" button that asks for the tilt permission. Each showing lasts 5 s (7 s
  on iOS); if the guest has not tried it, it returns after 9 s, up to 3
  showings. Trying it (300 px of mouse travel or 10 degrees of tilt, counted only
  after the hint has been up 1.5 s, or the iOS tap) hides it 1.2 s later and
  stops it for the rest of the visit (a module-level flag, so returning to the
  Welcome does not bring it back). Nothing is stored: every page load shows it
  again. A new photo needs a new map: Depth
  Anything V2, R = depth, G = dilated + blurred depth, 960 px WebP.
- **Scroll effects:** scrolling screens use the `ScrollMotion.tsx` primitives
  (rules in `docs/conventions.md` → Motion). Our Story: one `ScrollReveal` per
  timeline card, `Parallax` on every other photo. Entourage: one reveal per
  group column, second column delayed; a pairs group (principal sponsors)
  reveals one pair row at a time. Details: one reveal per venue card plus
  the order-of-events block. Dress Code: palette card with staggered swatches.
  Gallery: the slider block. FAQ: one reveal per question (capped delay).
  Registry: one reveal per card. Each screen's Continue button reveals too, and
  on RSVP CTA the button follows the heading. Welcome does not scroll and has none. The RSVP
  form has no scroll motion; only its heading uses `TextsReveal`.
- **Circular gallery:** GSAP loads from the CDN once per page (`loadGsap`,
  started when the Gallery or Dress Code screen mounts). Only the open,
  in-place and closing photos mount full-size SVG `<image>`s, served resized
  through the image optimizer; neighbours are pre-fetched. The `shape` prop
  picks the clip the photo grows out of: `"heart"` (default, Gallery) or
  `"circle"` (Dress Code outfit inspiration, which skips cards with an empty
  URL). An image's `title` shows as a caption above the dot strip once the
  photo is in place (Dress Code passes the outfit label; Gallery passes none).
  Esc closes it; the left and right arrow keys step like the on-screen buttons.
- **Text:** wrap headings/paragraphs in `<TextsReveal>` (CSS `.t-stagger` in
  `globals.css`; waits 150 ms, or 350 ms with `isHero`, so the lines rise
  while the screen fades in; the hero waits a little for the loader's fade).
- **Images:** use `<RevealImage>` instead of a bare `<img>`. It is lazy and
  `decoding="async"` by default. For photos, pass `sizes` (the rendered
  width): it then serves a resized srcset through the Next image optimizer
  (`getImageProps`) instead of the full stored file. Gallery tiles and Our
  Story covers do this; other callers still load the stored file.
- **Slider photo cards that open a lightbox** (Gallery, Dress Code outfit
  inspiration): the card gets `t-view-card` and
  `{...viewCardProps(label, open)}` (from `ViewOverlay.tsx`: role="button",
  one Tab stop, Enter/Space, `aria-label` such as "View photo 3" or "View
  Guest - Ladies outfit"), its `RevealImage` gets
  `wrapperClassName="t-view-media …"`, and it renders `<ViewOverlay />`. A
  Dress Code card with an empty `url` gets none of these and stays
  unreachable. On hover (mouse only) the photo scales, blurs 2 px and dims,
  and a gold-framed "View" chip rises in; `:focus-visible` shows the same
  plus a gold ring, on every device. Touch shows nothing extra: a tap opens
  the lightbox. Keep the filter on the wrapper, never on the `<img>`, whose
  blur-up rule ends at `filter: none` and would override it.
  `DraggableSlider` renders its children twice for the loop: the second copy
  is `aria-hidden` and its cards get `tabIndex={-1}` (not `inert`, which
  would block clicks on a visible copy). Keyboard focus inside a slider
  pauses its auto-scroll and scrolls the card clear of the screens' 10% edge
  fade (`EDGE_FADE`; change both together). The lightbox
  (`CircularImageGallery`) is a modal dialog: focus moves to its close button
  on open, Tab cycles inside it, and focus returns to the opening card when
  it unmounts.
- **Numbers:** `<PopInNumber>` (`.t-digit` CSS) for the countdown.
- **Tokens:** durations, easings, distances, and blur live as CSS variables at
  the top of `globals.css` (`--duration-*`, `--ease-*`, `--reveal-*`,
  `--stagger-*`, `--digit-*`, `--*-scroll-reveal`, `--distance-parallax`).
  Use them; do not hard-code new timings.
- **Reduced motion:** screen swaps, the loader, text/number/image reveals and
  every scroll primitive respect `prefers-reduced-motion`. Some older motion
  does not yet (see `docs/current-state.md` → Known issues).
- The `transitions-dev` skill matches this token system — use it for new CSS
  motion. For Motion code (`motion/react`: screen swaps, `whileInView`,
  scroll effects) use the `motion` skill. For layout and visual design of
  guest pages use `design-taste-frontend`; its motion recipes are generic, so
  map them onto these tokens instead of adding new timings.
- After changing motion, loading, or scrolling, run the Motion performance
  check in `docs/conventions.md` → Verification.

## Custom cursor

`WeddingCursor` (mounted in `GuestSite` in `src/app/[event]/GuestSite.tsx`, so never on `/admin`)
replaces the cursor with a gold solitaire ring whose diamond tip is the
hotspot. Moving leaves a trail of twinkling gold stardust. Hovering anything
clickable tilts and grows the ring with a bounce and a few sparkles, and a
click throws a gold sparkle burst. The particles are drawn on one fixed canvas
(`z-[9998]`, ring `z-[9999]`) whose loop stops when idle.

- **Mouse/trackpad only.** It runs only while `<html>` has `t-mouse` (set by
  the `pointer-init` script in `layout.tsx` from the `(hover: hover) and
  (pointer: fine)` query or the first real mouse move, since some Chrome
  installs report `hover: none` with a mouse; a touch clears it) and without
  `prefers-reduced-motion`. It adds `t-cursor-on` to `<html>` to hide the
  native cursor. Phones, touch and reduced-motion guests get the normal
  cursor and no effects.
- **Clickable detection** is a selector list (`CLICKABLE`): links, buttons,
  `role="button"`/`link`/`tab`/`menuitem`, labels, selects, checkboxes, radios,
  ranges, and `[data-cursor="hover"]`.
- **Text fields** keep the native I-beam and the ring hides over them.

## Music

`AudioPlayer` (mounted in `src/app/[event]/page.tsx` and `not-found.tsx` with
the event's `content/music`, see `docs/content-system.md`) renders `<audio id="wedding-bg-music"
src=… preload="none">` and a toggle: the event's uploaded track, or
`/bg-music.mp3` when none. When the event turned music off it renders nothing
(the `getElementById` callers below already allow a missing element). It downloads only when
`.play()` is first called, so the 5.4 MB file does not compete with the first load. Browsers block autoplay, so `nextStep` on
step 0 (the first user tap) calls `.play()`. `OurStoryScreen` also reaches the
element by id.

The controls sit bottom-right (`#audio-controls`, hidden while
`body.video-modal-open`):

- **Mute button.** A tap/click pauses or resumes the music. The icon follows the
  state (`VolumeX` muted, `Volume1` below 50 %, `Volume2` otherwise).
- **Volume slider** (0–100 %, starts at the event's saved volume, default 50 %). A solid pill that slides out of
  the button to the left (400 ms smooth-out) and back into it (350 ms
  ease-in-out), transform only and no fade: its left border leads out, and on
  close the right side goes in first and the left border last
  (`.t-vol-panel` window / `.t-vol-pill` / `.t-vol-range` in `globals.css`). Desktop: opens
  on hover and closes 400 ms after the mouse leaves. Touch: a tap on the button
  mutes *and* opens it; it closes after 3.5 s idle or a tap outside. Keyboard:
  opens when the button gets `:focus-visible`, then Tab reaches the slider.
  Slider at 0 pauses; raising it from a muted state plays again.
- **Onboarding hint.** The first time the music plays in a page load, a
  "Music is playing" bubble points at the button 1.8 s later (so the first
  screen swap finishes) with a gold ripple ring, and leaves after 7 s or on
  any touch/focus of the controls. Copy follows the input the guest actually
  used (the pointer type of their latest press, so the tap or click that
  started the music): "Click to mute · hover for volume" for a mouse, "Tap to
  mute or change the volume" for touch or pen. The shared mouse check
  (`hasMouse()`, `src/lib/pointer.ts`) is only the fallback (keyboard start),
  because some phones report hover wrongly. The same check decides whether a button tap opens the slider.
- **iOS volume.** iOS ignores `audio.volume`, so there the slider starts at
  100 % (the true level) and the first slider touch routes the element through
  a Web Audio `GainNode` (`ensureGain`), with `navigator.audioSession.type =
  'playback'` so the ringer switch does not silence it on iOS 17+.

## Layout rules

- Every screen is `absolute inset-0` inside a `100dvh` `<main>` with
  `overflow-hidden`; screens that scroll manage their own scroll container and
  end with `<EmbeddedFooter />`.
- Fixed controls: back (top-left) and menu (top-right) at `z-[40]`; menu overlay
  `z-[60]`; entrance overlay `z-[100]`.
- Colors and fonts: see `docs/conventions.md`.

## 404 page

Any unknown URL, including an event ID that doesn't exist, renders
`src/app/not-found.tsx` (the root `not-found`, HTTP 404, title from site text
`notFound.pageTitle`), which shows `NotFoundScreen` for the **default event**.
It is not a step and sits outside `WeddingContentProvider`: names, logo, venue
and wedding date come from the default event's global settings, read on the
server (`getSiteContent(DEFAULT_EVENT_ID)`); the Welcome photo still comes
straight from `src/data/wedding-content.json` (shows an admin change only after
`npm run sync-content`). `src/app/[event]/page.tsx` also calls `notFound()` in
`generateMetadata`; without it the root title replaced the 404 title after
hydration. The days-to-wedding line is read on the client
(`useSyncExternalStore`), because the page is prerendered. It uses the inner
screens' `primary` backdrop and their `primary` button (text in `accent-light` for
contrast), in the default event's theme. The logo is the original monogram, static, with an embossed
look (`.t-emboss` in `globals.css`), and `FallingPetals`
drifts behind the text (24 petals, 12 on phones; seeded values so server and
client match; transform-only CSS). Under reduced motion the petals are hidden.
Its one action links
to `/` (the default event), which resumes the guest's saved step from
`localStorage`. `not-found.tsx` mounts `AudioPlayer` and its own
`SiteTextProvider`.
