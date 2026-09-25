# Current state

What is live, what is odd, and what is known to be broken or unused. Update this
when you find or fix one of these.

## Shipped

- 10-step guest site with Motion (`motion/react`) crossfade screen swaps,
  text/image reveal animations, scroll reveals and light parallax, circular 3D
  gallery lightbox, background music. The 2026-09 motion work measured CLS 0
  and ≤ 1.6 % slow frames on every swap and scroll, and passed a real-phone
  check (see `docs/conventions.md` → Motion performance check).
- Invite-code RSVP with one-time codes (transaction-safe).
- Curated registry with claim limits (transaction-safe) and bank-transfer info.
- Admin: dashboard counts, invite generation + message template, RSVP list with
  CSV export, gift CRUD, claim list, content editors for all 12 screens with
  one-step backup/restore.

## Known issues

| Issue | Where | Notes |
| --- | --- | --- |
| `/api/download` is an open proxy | `src/app/api/download/route.ts` | Security gap 1 |
| Guest PII readable by code from the browser | `firestore.rules` `guests` | Security gap 2 |
| Welcome 3D scene fetches the photo twice | `DepthParallaxScene.tsx` loads the raw Blob URL; the loader preloads the `next/image` srcset URL | ~220 KB extra on first visit. Feed the scene the same optimized URL to share the cache |
| No collision check when generating invite codes | `generateCode()` in `admin.ts` | A duplicate overwrites an existing guest doc |
| Replaced images are never deleted from Blob | all editors | Counts against the shared 1 GB Hobby Blob quota |
| Legacy Firebase Storage URLs return 402 | Firestore `websiteContent/*`, `wedding-content.json` | Google billing account closed; replace by re-uploading in the admin, then `npm run sync-content`. See `docs/data-model.md` |
| `wedding-content.json` has a mixed `gallery` key and an unused `faqs` key | `src/data/wedding-content.json` | Side effect of `sync-content.js`; see `docs/data-model.md` |
| Content merge is hand-written per doc | `WeddingContentContext.tsx` | New fields in field-by-field docs need an explicit line |
| `RsvpScreen` falls back to `'dev-mode'` as the code | `src/app/page.tsx` | Submission fails server-side, which is the intended outcome |
| `npm run lint` fails (89 errors, 51 warnings, all older than the 2026-09 motion work) | mainly `react-hooks/set-state-in-effect`, `no-explicit-any`, unused vars | `npm run build` is the working gate until they are fixed |
| Some motion ignores `prefers-reduced-motion` | `WelcomeScreen.tsx:74` and `RsvpCtaScreen.tsx:28` (background zoom), modal pop-ins in `OurStoryScreen.tsx:154`, `DetailsScreen.tsx:197`, `RegistryScreen.tsx:115`, `RsvpScreen.tsx:198`, hover lifts in `DetailsScreen.tsx:75,110` and `DressCodeScreen.tsx:71`, FAQ accordion `FaqScreen.tsx:61`, `TwinkleSparks`, the circular gallery | A `<MotionConfig reducedMotion="user">` around `<main>` would cover the Motion transforms; the canvas and GSAP need their own check |
| Circular gallery loads GSAP from cdnjs at runtime | `src/components/ui/circular-image-gallery.tsx` (`loadGsap`) | Third-party script without SRI, and a second animation library next to Motion. Removing it is a design decision |
| Guest page starts Firebase Auth (iframe + gapi scripts) though guests never sign in | `src/lib/firebase/client.ts:18` (`getAuth` at module scope) | Extra startup requests on every guest load |
| FAQ question cards keep `transition-all` while Motion animates them | `FaqScreen.tsx` (`ScrollReveal` className) | CSS may also transition Motion's inline opacity/transform; no jank measured |
| Music volume on iOS goes through Web Audio after the first slider touch | `AudioPlayer.tsx` (`ensureGain`) | Only checked in a desktop browser. On iOS < 17 the ringer switch may silence the music once that happens; the AudioContext is resumed on each `play` |
| Circular gallery keeps the last-closed photo mounted | `circular-image-gallery.tsx` (`closing` state never resets) | Two extra SVG `<image>`s at most; harmless |

## Unused code and dependencies

- `src/components/effects/FallingPetals.tsx` — not imported anywhere.
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
`NEXT_PUBLIC_FIREBASE_*` variables set; `layout.tsx` and every admin page call
the admin SDK at request time.
