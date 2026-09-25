# Guest site (`/`)

The guest site is **one client page** (`src/app/page.tsx`) that swaps full-screen
"screens" in place. There is no routing between screens and no URL per screen.

## Step flow

`currentStep` (0–9) picks the screen. Order and labels are defined twice and
must stay in sync: the `currentStep === n` blocks in `page.tsx` and
`menuItems` in `src/components/layout/CanvasMenu.tsx`.

| Step | Screen | Menu label |
| --- | --- | --- |
| 0 | `WelcomeScreen` | Welcome |
| 1 | `OurStoryScreen` | Our Story |
| 2 | `EntourageScreen` | Entourage |
| 3 | `DetailsScreen` | Details |
| 4 | `DressCodeScreen` | Dress Code |
| 5 | `GalleryScreen` | Gallery |
| 6 | `FaqScreen` | FAQs |
| 7 | `RegistryScreen` | Registry |
| 8 | `RsvpCtaScreen` | Join Our Day |
| 9 | `RsvpScreen` (locked) | RSVP |

Every screen takes `onContinue` (→ `nextStep`). Some also take
`onLightboxChange` (Our Story, Gallery, Dress Code) so `page.tsx` can hide the back/menu
buttons and add `body.lightbox-open`.

To **add, remove, or reorder a screen**: edit the step blocks in `page.tsx`,
`menuItems` in `CanvasMenu.tsx`, the hard-coded `9` (RSVP step) in
`goToStep` / `handleStartUnlock`, the `goToStep(7)` back target of `RsvpScreen`,
and the table in `docs/FEATURE-MAP.md`.

## State kept in `page.tsx`

| State | Purpose | Persisted in `localStorage` |
| --- | --- | --- |
| `currentStep` | visible screen | `wedding_currentStep` |
| `highestVisitedStep` | menu only allows steps already reached | `wedding_highestVisitedStep` |
| `isUnlocked` | RSVP step is reachable | `wedding_isUnlocked` |
| `validatedInviteCode` | code passed to `RsvpScreen` | `wedding_inviteCode` |
| `showEntranceScreen` | code-entry overlay is open | no |
| `isMenuOpen`, `isLightboxOpen` | overlays | no |

`mounted` guards the first render so localStorage is read only on the client.

## RSVP lock

1. Going to step 9 while `!isUnlocked` opens the `EntranceScreen` overlay instead.
2. `EntranceScreen` calls `verifyInviteCode(code)` (server action). On success it
   calls `onStartUnlock` (unlocks, moves to step 9 behind the overlay), then
   `onUnlock(code)` (stores the code, closes the overlay).
3. `RsvpScreen` calls `submitRsvp(inviteCode, formData)`. The action runs a
   Firestore transaction that fails if the code is already `used`.
4. On success, `onSubmitSuccess` relocks (`isUnlocked = false`, code cleared).

`RsvpScreen` receives `'dev-mode'` if no code is stored; submitting with it fails
server-side (no such doc).

## Registry claim

`RegistryScreen` shows bank-transfer info and embeds `CuratedRegistryScreen`,
which loads gifts with `getRegistryGifts()` and claims one through
`GiftSelectionModal` → `claimGift(giftId, {fullName, email, message})`. The
transaction rejects when `currentCount >= maxCount`.

## Transitions and motion

- **Screen swap:** `pageVariants` in `page.tsx` is a crossfade inside an
  `AnimatePresence` with no `mode="wait"`. The new screen enters from the tap
  (opacity + `transform: scale(0.97→1)`, 0.7 s, `[0.22, 1, 0.36, 1]`) on top of
  the old one, which fades out in 0.45 s. The exiting screen flips to
  `zIndex: 0` and `pointerEvents: none` at once, so it never covers or catches
  taps. Under reduced motion it is an opacity-only 0.15 s fade
  (`useReducedMotion`). Screens are `absolute inset-0` and remount on each
  swap, so every screen opens scrolled to the top.
- **Loader → first screen:** the outer `AnimatePresence` in `page.tsx` has no
  `mode="wait"`, so `<main>` mounts under `LoadingScreen` while it fades out.
  The loader's exit is a CSS opacity transition on `--duration-very-slow` /
  `--ease-in-out` driven by `usePresence` (instant under reduced motion).
  The loader stays up until content has loaded (the 12 `websiteContent` docs
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
  (`WelcomeScreen.tsx`); otherwise, under reduced motion, or without WebGL, the
  flat photo + `TwinkleSparks` render. With the scene on, `MotionHint` shows
  just above the countdown (absolute inside the countdown group; one line and
  more compact on screens under 700 px tall) 2.6 s after
  the Welcome mounts: "Move your mouse" on hover/fine-pointer
  devices, "Tilt your phone" on touch devices, and on iOS a "Tap to enable
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
  name column, second column delayed. Details: one reveal per venue card plus
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
  scroll effects) use the `motion` skill.
- After changing motion, loading, or scrolling, run the Motion performance
  check in `docs/conventions.md` → Verification.

## Music

`AudioPlayer` (mounted in `layout.tsx`) renders `<audio id="wedding-bg-music"
src="/bg-music.mp3" preload="none">` and a toggle. It downloads only when
`.play()` is first called, so the 5.4 MB file does not compete with the first load. Browsers block autoplay, so `nextStep` on
step 0 (the first user tap) calls `.play()`. `OurStoryScreen` also reaches the
element by id.

## Layout rules

- Every screen is `absolute inset-0` inside a `100dvh` `<main>` with
  `overflow-hidden`; screens that scroll manage their own scroll container and
  end with `<EmbeddedFooter />`.
- Fixed controls: back (top-left) and menu (top-right) at `z-[40]`; menu overlay
  `z-[60]`; entrance overlay `z-[100]`.
- Colors and fonts: see `docs/conventions.md`.
