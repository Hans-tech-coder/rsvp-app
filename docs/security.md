# Security model

## Who can do what (as built)

| Actor | Can |
| --- | --- |
| Anyone | Read an event's `content` and `registryGifts` (`events/{eventId}/…`) from the browser (`firestore.rules`);read all uploaded images (public Vercel Blob URLs); call the guest server actions (`rsvp.ts`, `registry.ts`). **Cannot** read or write `guests` from the browser (`allow read, write: if false`); invite-code checks and RSVPs go through `verifyInviteCode` / `submitRsvp` |
| Anyone, via `/api/download` | Download an image only from an allowed host (`isAllowedImageUrl` in `src/lib/downloadProxy.ts`): `https:`, default port, no credentials, and either a `*.public.blob.vercel-storage.com` host (`endsWith`, not `includes`) or `firebasestorage.googleapis.com` with a path under `/v0/b/${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/` (legacy URLs). Anything else gets 400 before any fetch. The fetch uses `redirect: 'error'`; a non-`image/*` reply gets 415, more than 15 MB gets 413 (by `content-length`, and by a byte count while reading when the header is missing or wrong). Upstream errors return a generic 502/500; details go to `console.error` only. `filename` is cut down to `[A-Za-z0-9._-]`, max 100 chars, fallback `download.jpg` (`sanitizeFilename`), so no header injection. Response sets `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`. Tests: `npm test` (`src/lib/downloadProxy.test.ts`) |
| Guest with a valid unused code | Submit one RSVP (`submitRsvp` transaction flips `codeStatus` to `used`) |
| Signed-in admin (`admins/{uid}` exists; role `super` or `admin`) | Write any event's `content` from the browser (rules check `isAdmin()`; every admin can act on every event until per-event roles, F10);upload images to Vercel Blob with a token from `/api/upload`, which verifies the Firebase ID token the browser sends as `clientPayload` (`verifyIdToken(…, true)`) and that `admins/{uid}` exists before issuing it. It deliberately does not use the 5-day `session` cookie, which can expire while the admin page stays open |
| Super admin (`role: 'super'`) | Everything a signed-in admin can, plus add a regular admin to `adminAllowlist`, cancel a pending regular admin, and remove a regular admin (`src/app/actions/admins.ts`). Cannot create, remove, or cancel a super admin from the UI; only `scripts/add-admin.js --super` (or the Firebase console) can |
| Server (firebase-admin) | Everything — admin SDK bypasses rules |

Browser writes to `guests`, `registryGifts`, and `giftSelections` are denied by
the rules; those go through server actions. `guests` (guest PII) is also
unreadable from the browser: every read is `getAdminDb()` in `rsvp.ts`,
`admin.ts`, or an admin server page. A new browser read of `guests` would be
denied by the rules; add a server action instead.

**Event-scoped rules** (`match /events/{eventId}` in `firestore.rules`):

| Path | Browser read | Browser write |
| --- | --- | --- |
| `events/{eventId}` (event record) | no | no |
| `…/content/{doc}` | anyone | `isAdmin()` |
| `…/guests/{code}` | no | no |
| `…/registryGifts/{id}` | anyone | no |
| `…/giftSelections/{id}` | `isAdmin()` | no |
| `…/settings/{doc}` | no | no |

Checked on 2026-10-14 against the deployed rules with anonymous REST calls
(content and gifts 200; guests, selections, settings, event record and a
content write 403). The old root rules (`websiteContent`, `guests`, …) are
still in the file, unchanged, so the previous code keeps working during the
switch and as a rollback; they go when the root collections are removed (see
`docs/data-model.md`).

**Guest actions take an `eventId` from the browser.** It is not trusted for
access: it only picks which event's data the action touches, and the path
helpers in `src/lib/eventPaths.ts` reject anything that is not a plain slug
(and any document ID containing `/`). A guest can still only verify a code,
submit one RSVP per unused code, and claim an existing gift, now within the
event they name. Admin actions take `eventId` too and still check only
`requireAdmin()`.

## Admin check on the server (`src/lib/requireAdmin.ts`)

`src/proxy.ts` only checks that a `session` cookie **exists** (a cheap
redirect). The real check is in `src/lib/requireAdmin.ts`:

- `getAdmin()` reads the `session` cookie,
  `verifySessionCookie(cookie, true)` (signature, expiry, revocation), and
  checks `admins/{uid}` exists. Returns `{ uid, role }` (missing `role` =
  `'admin'`). Memoized per request with React `cache`. `getAdminUid()` returns
  just the UID.
- `requireAdmin()` throws `Unauthorized` (it also guards `revalidateGuestSite(eventId)`, which only regenerates cached pages and checks the ID with `isValidEventId`). **Every** function in
  `src/app/actions/admin.ts` calls it first inside its `try`, so an
  unauthenticated call returns `{ success: false, error: 'Unauthorized' }`.
  Any new admin action must do the same. `requireSuperAdmin()` also throws
  `Unauthorized` unless the role is `super`. Every action in
  `src/app/actions/admins.ts` calls it first, except `getMyAdminRole()`,
  which only reports the caller's role so the sidebar can hide the
  Manage Admins button. Hiding the button is UI only; the actions are the
  boundary.
- `removeAdmin(uid)` deletes `admins/{uid}` and then calls
  `revokeRefreshTokens(uid)`, so `verifySessionCookie(…, true)` rejects the
  removed admin's 5-day session on their **next request**. Their browser
  Firestore access stops at the next ID-token refresh (at most 1 hour), and the
  rules deny them from then on because `admins/{uid}` is gone. It refuses to
  remove the caller or a `super`.
- `requireAdminPage()` is the first line of every admin server page
  (`dashboard`, `invites`, `guests`, `gifts`, `registry`). On failure it
  redirects to `/api/logout`, which deletes the cookie and redirects to
  `/admin/login` (going straight to login would loop, because the proxy
  bounces any cookie holder from login to the dashboard).
- `createSessionCookie` refuses to issue a cookie unless the ID token is from
  **Google** sign-in (`sign_in_provider === 'google.com'`) with
  `email_verified`, was signed in within the last 5 minutes, and the user has
  an `admins/{uid}` doc (or an `adminAllowlist/{email}` entry, which it turns
  into one). Being able to sign in with Google does not make anyone an admin;
  the allowlist does. There is no email-domain check.
- `adminAllowlist` is written only by `scripts/add-admin.js` and the
  super-admin actions in `admins.ts` (and read only by the server);
  `addAdmin` uses `create()`, so it never overwrites (downgrades) an existing
  pending super entry; `firestore.rules` denies all browser access to it. Until the
  Email/Password provider is disabled in the Firebase Console, a password
  user can still sign in to Firebase, but gets no session cookie.

`/admin/content` is a client page; its writes go through Firestore rules
(`isAdmin()`) and `/api/upload`, not through these helpers.

## Secrets

- `FIREBASE_ADMIN_*` are server-only. Never import `src/lib/firebase/admin.ts`
  from a `'use client'` file.
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` (RSVP confirmation sender) are server-only;
  the password is a Google App Password, never the account login password.
- `NEXT_PUBLIC_FIREBASE_*` are public by design (they ship to the browser).
- `.env*` is git-ignored except `.env.local.example`. Do not print or commit
  real values.

## Known gaps (not fixed yet — read before touching auth)

1. **No rate limit on `verifyInviteCode`.** 32^6 ≈ 1.07 billion codes makes
   guessing slow, but there is no throttle.
2. The **old root** rules have overlapping `allow` lines for `registryGifts` and
   `giftSelections` (e.g. `allow read, write: if isAdmin()` and
   `allow write: if false`); rules are OR-ed, so the `false` lines do nothing.
   Read them as "admin OR public read". The new `events/` rules do not have
   this (one line per operation), and the root block goes away with the root
   collections.

## Rules deployment

`firestore.rules` and `storage.rules` are deployed with the Firebase CLI
(`npx firebase deploy --only firestore:rules,storage`, project from
`.firebaserc`). Editing the file does nothing until deployed — confirm with the
owner before deploying. The event-scoped `firestore.rules` were deployed on
2026-10-14 (with the owner's OK), ahead of the code that uses them.

## Security review

Use the built-in `/security-review` first. The Strix skills
(`find-security-vulnerabilities-in-code`, `fix-security-vulnerabilities-with-strix`)
only on request, and **never against the production URL**.
