# Findings (written by T01, read by T03–T07 and T12)

## Baseline (T01, production build, 375×812)

Measured 2026-09-24 in the desktop browser pane (DPR 2, ~165 Hz display, no CPU
throttle, **warm HTTP cache**: the pane cannot disable the cache). "Slow frames"
means frames longer than 25 ms. The total is high because the display runs at
~165 Hz. A worst-frame column is added. Long tasks are > 50 ms.

| Scenario | CLS | Top shifts (value → node) | Long tasks > 50 ms | Slow frames / total (worst) |
| --- | --- | --- | --- | --- |
| S1 cold load → Welcome | 0.0000 | 0.0000 → `t-digit-group` (countdown digit, harmless) | none recorded | not measurable (tool lag, see timeline) |
| S2 Welcome → Our Story | 0 | none | 1 × 51 ms at +530 ms (new screen mounts) | 3 / 535 (49 ms); rerun 1 / 556 (36 ms) |
| S3 scroll Our Story | 0 | none | none | 0 / 744 (7 ms) |
| S4 menu → Gallery | 0 | none | none | 5 / 666 (41 ms) |
| S4 circular gallery, first open (cold GSAP) | 0.0165 | 0.0020, 0.0018, 0.0016 → dot strip `absolute rounded-full border-2 …` | close: 154 ms | open 2 / 475 (59 ms); close 3 / 348 (**203 ms**) |
| S4 circular gallery, second open (warm) | 0.0065 | 0.0044, 0.0021 → same dot strip | open: **216 ms** | open 3 / 344 (**286 ms**); next 1 / 383 (68 ms); close 0 / 413 (7 ms) |
| S5 Gallery → Dress Code → Details (back ×2) | 0 | none | none | 1 / 713 (45 ms) |

**S1 timeline** (from the resource and paint timing buffers, ms after navigation):
first contentful paint at 56 (loading screen) · `bg-music.mp3` 5,456 KB requested
at 45 · 12 `getDoc` calls run **one after another** (24 Listen-channel requests,
~65 ms each), the last ends at **2,009** · loading screen exit 1.5 s · Welcome hero
image (`/_next/image?url=…welcome-bg…`) first **requested at 3,456** · page
enter 0.1 + 0.8 s · Welcome text `delayChildren` 0.5 s and `TextsReveal` 800 ms.
**First Welcome text is about 4.5–5 s after navigation on a fast desktop.**

**S2 timing:** the first `TextsReveal` on the new screen gets `is-shown`
1,137 ms after the tap (back to Welcome: 1,322 ms). The stagger then runs 700 ms
plus 60 ms per line.

Screenshots (seen in session, not saved):
- **S1**, mid-exit: the "Curating Elegance" loading screen dimming over a dark
  background, with no Welcome content behind it yet.
- **S2**, ~0.6 s after the tap: **a blank dark screen** with only the back and menu
  buttons. This is the gap between the exit and the enter.

Real-phone check (one line): **not done.** The session had no phone. T07 should
record it, especially for the gallery open and the Welcome sparkles.

## After fixes (T07, production build, 375×812)

Measured 2026-09-24 after T03–T06, same pane and protocol as the baseline (warm
cache, no CPU throttle, display ~90–165 Hz). "Worst" is the longest frame.
"First new content" is the time from the tap until a new screen's `TextsReveal` gets
`is-shown` (text) and a new element is visible at > 10 % opacity.
Two setup notes: the step is saved in `localStorage` (`wedding_currentStep`), so
S1 sets it to `0` before reload. Menu items after the highest visited step are
locked, so S4 sets `wedding_highestVisitedStep` to `8`. The pane also hides the tab
while `navigate` runs (rAF stops, no FCP recorded), so reloads used
`location.reload()` from inside the page.

| Scenario | CLS | Top shifts | Long tasks > 50 ms | Slow frames / total (worst) | First new content | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| S1 cold load → Welcome | 0 | none | none | 0 / 351 | FCP 56 ms · `<main>` 337 ms · first Welcome text **690 ms** (was ~4.5–5 s) | pass |
| S2 Welcome → Our Story | 0 | none | none (was 51 ms) | 0 / 407 | text **177 ms**, visible 207 ms (was 1,137 ms) | pass |
| S3 scroll Our Story (4,931 px in 4 s) | 0 | none | none | 0 / 789 | – | pass |
| S4 menu → Gallery | 0 | none | none | 5 / 442 (1.1 %) | text 222 ms, image 183 ms | pass |
| S4 circular gallery, first open | 0 (was 0.0165) | none | none | 2 / 551 (62 ms) | 2 SVG `<image>`s (was 80) | pass |
| S4 next photo | 0 | none | none | 0 / 219 (20 ms) | – | pass |
| S4 close | 0 | none | none (was 154 ms) | 0 / 243 (16 ms) | – | pass |
| S4 second open (warm) | 0 (was 0.0065) | none | none (was **216 ms**) | 1 / 331 (51 ms; was 286 ms) | – | pass |
| S4 second close | 0 | none | none | 0 / 243 (17 ms) | – | pass |
| S5 Gallery → Dress Code (back) | 0 | none | none | 0 / 402 (20 ms) | text **187 ms**, visible 207 ms | pass |
| S5 Dress Code → Details (back) | 0 | none | none | 0 / 407 (19 ms) | text **190 ms**, visible 208 ms | pass |

Thresholds (T07): CLS < 0.05 · no long task > 50 ms in a transition · slow
frames ≤ 5 % · S2/S5 first new content within ~300 ms. **Every row passes.**

Real-phone check (one line): **Samsung Galaxy A56, production URL, tested by
the owner. All smooth:** load → Welcome, screen swaps, Our Story scroll, the
circular gallery (open, next, close, reopen), and the back button.

## Hypotheses (ranked by evidence)

Status per row: confirmed · refuted · untested. Each confirmed row names the fix
task (T03–T06) that owns it.

| # | Hypothesis | Evidence | Status | Owner task |
| --- | --- | --- | --- | --- |
| H7′ | Circular gallery is heavy on open (reframed H7) | 216 ms long task and 286 ms frame on a warm open. 154 ms long task and 203 ms frame on the first close. It mounts 80 SVG `<image>`s (40 with `blur-xl`) for 40 photos (`circular-image-gallery.tsx:114-130, 312-313`). GSAP and MotionPathPlugin load one after the other from a CDN (`:24-53`, 1,809 + 1,348 ms), so the first open waits **3.2 s**. The dot strip animates `left` (`:368`) and starts at a 1200×800 placeholder (`:326`), giving CLS 0.0065–0.0165 per open. | confirmed | T06 |
| H2 | Loading hands off late and in the wrong order | The loading screen does **not** leave early. It leaves late: 12 sequential `getDoc` (`WeddingContentContext.tsx:30-41`) take until 2.0 s. Then the 1.5 s exit (`LoadingScreen.tsx:12`) must finish before `<main>` mounts (`page.tsx:156` `mode="wait"`). The hero image is requested only at 3.46 s because it mounts with Welcome (`WelcomeScreen.tsx:80`). The 5.4 MB music file (`AudioPlayer.tsx:91` `preload="auto"`) downloads from 45 ms. Fonts are `next/font` preloads fetched at 19 ms, so they are ready. CLS ≈ 0: nothing shifts, it is only slow. | confirmed (as lateness, not as a shift) | T03 |
| H3 | Sequential screen swap reads as lag | Screenshot at ~0.6 s after the tap shows a blank screen. Text is revealed 1.14–1.32 s after the tap and fully in at ~2 s. `pageVariants` exit 0.5 s → delay 0.1 → enter 0.8 s (`page.tsx:131-153`). `TextsReveal` waits 600/800 ms from mount (`TextsReveal.tsx:24`). A 51 ms long task occurs when Our Story mounts. | confirmed | T04 |
| H8 | Large un-optimized images | The Gallery loads ~33 photos, **~5.1 MB** in total (43–370 KB each, WebP up to 2000 px from `uploadImage.ts:24`), as raw eager `<img>` in 180 px tiles (`GalleryScreen.tsx:147,167` via `RevealImage`). Our Story has 7 PNG/JPEG files (39–173 KB, ≤ 960 px) and all load eagerly at mount. `next.config.ts` has no remote pattern for the Blob host. No stall was measured on desktop; the risk is on phones. | confirmed (weight); stall unproven | T05 |
| H4 | Reveals animate expensive properties / images lack reserved size | **Expensive properties: yes.** `filter: blur` on every text line (4 px) and image (8 px), with a permanent `will-change: transform, opacity, filter` (`globals.css:96-162`). **Reserved size: refuted.** `RevealImage` wrappers are fixed (e.g. 238×256), the Entrance logo has `width`/`height` (`EntranceScreen.tsx:144-148`), Welcome and Entrance backgrounds use `next/image fill`, and CLS is 0 in S2, S3 and S5. | confirmed (blur) / refuted (size) | T05 |
| H6 | Canvas effects run hidden or at full DPR | `TwinkleSparks`: canvas at full DPR (750×1624 at DPR 2; would be 1125×2436 on a DPR 3 phone, `TwinkleSparks.tsx:23-24`). `shadowBlur` is set on each of ~33 fills per frame (`:138`). The rAF loop never pauses (`:166-175`), including under the menu overlay. On desktop: 0 slow frames out of 496. `InkRevealCanvas` is refuted: its DPR is capped at 2 (`:47`) and its loop stops when idle (`:154-156`). | confirmed in code (sparks), no measured jank; needs phone | T06 |
| H1 | JSON defaults paint, then Firestore content replaces them | Refuted. `setContent` and `setLoading(false)` run in the same async continuation (`WeddingContentContext.tsx:205-209`), so React batches them. `<main>` is not mounted while `loading` is true. S1 CLS is 0.00001 (a countdown digit only). | refuted | – |
| H5 | `whileInView` blocks re-trigger or start together | Refuted. All 15 are `viewport={{ once: true }}`. S3 scroll: 0 slow frames out of 744, CLS 0. | refuted | – |
| H7 | Gallery or slider sets React state every frame | Refuted as stated. The gallery animates refs through GSAP and has no per-frame `setState`. `DraggableSlider` scrolls via refs and `scrollLeft` (`:23-51`). The real gallery cost is in H7′. | refuted | – |

**Ranking rationale:** H7′ is the only scenario with long tasks > 150 ms and a
visible stall (3.2 s on first open). H2 adds ~3 s of avoidable wait on every
cold load. H3 makes every one of ~10 screen swaps take ~2 s. H8 and H4 are costs
that matter mainly on phones. H6 is code-level only until a phone check.

## Parking lot

Out-of-scope issues found during any task. One line each, with `file:line`.

- The guest page loads the Firebase Auth iframe and `apis.google.com` gapi scripts at startup (`src/lib/firebase/client.ts:18` `getAuth` at module scope), even though guests never sign in.
- The circular gallery loads GSAP from cdnjs at runtime (`src/components/ui/circular-image-gallery.tsx:36-47`). This is a third-party script without SRI and a second animation library next to Motion. (Its load *delay* is in T06 scope. Removing GSAP is a design decision.)
- `npm run lint` fails on `main` with 95 errors and 52 warnings, all older than T02. They are mainly `react-hooks/set-state-in-effect` (e.g. `src/components/screens/WelcomeScreen.tsx:21`, `src/components/ui/circular-image-gallery.tsx:80-81`), `@typescript-eslint/no-explicit-any` (`src/types/index.ts:14-43`), `ban-ts-comment`, and `prefer-const`. The verify step's "lint passes" cannot hold until they are fixed. T02 compared its lint against the baseline instead.
- (T05, for T06) The circular gallery still loads the full stored photos (`src/components/ui/circular-image-gallery.tsx:312-313`, raw `href={url}`, up to 2000 px). Before T05 the Gallery tiles had already cached those files. Now the tiles load 384 px copies, so the first circular-gallery open downloads the originals cold (1 × 376 ms long task measured on open). Passing optimized URLs there belongs to T06. *(Done in T06.)*
- (T06) Neither `TwinkleSparks` (`src/components/effects/TwinkleSparks.tsx`) nor the circular gallery (`src/components/ui/circular-image-gallery.tsx`) checks `prefers-reduced-motion`; the sparks drift and the hearts bounce regardless.
