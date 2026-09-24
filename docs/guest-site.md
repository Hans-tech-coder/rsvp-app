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
`onLightboxChange` (Our Story, Gallery) so `page.tsx` can hide the back/menu
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

- **Screen swap:** `pageVariants` in `page.tsx` (fade + scale, 0.8 s in with
  `[0.22, 1, 0.36, 1]`, 0.5 s out) inside `AnimatePresence mode="wait"`.
- **Loader → first screen:** the outer `AnimatePresence` in `page.tsx` has no
  `mode="wait"`, so `<main>` mounts under `LoadingScreen` while it fades out.
  The loader's exit is a CSS opacity transition on `--duration-very-slow` /
  `--ease-in-out` driven by `usePresence` (instant under reduced motion).
- **Text:** wrap headings/paragraphs in `<TextsReveal>` (CSS `.t-stagger` in
  `globals.css`; waits 600 ms, or 800 ms with `isHero`, so it starts after the
  screen fade).
- **Images:** use `<RevealImage>` instead of a bare `<img>`.
- **Numbers:** `<PopInNumber>` (`.t-digit` CSS) for the countdown.
- **Tokens:** durations, easings, distances, and blur live as CSS variables at
  the top of `globals.css` (`--duration-*`, `--ease-*`, `--reveal-*`,
  `--stagger-*`, `--digit-*`). Use them; do not hard-code new timings.
- The `transitions-dev` skill matches this token system — use it for new CSS
  motion. For Motion code (`motion/react`: screen swaps, `whileInView`,
  scroll effects) use the `motion` skill.
- Planned work on jank and scroll effects is tracked in
  `docs/plans/motion-polish/README.md`.

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
