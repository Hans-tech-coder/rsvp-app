# Security model

## Who can do what (as built)

| Actor | Can |
| --- | --- |
| Anyone | Read `websiteContent`, `registryGifts`, and any single `guests/{code}` doc from the browser (`firestore.rules`); read all uploaded images (public Vercel Blob URLs); call the guest server actions (`rsvp.ts`, `registry.ts`); call `/api/download` |
| Guest with a valid unused code | Submit one RSVP (`submitRsvp` transaction flips `codeStatus` to `used`) |
| Signed-in admin (`admins/{uid}` exists; role `super` or `admin`, which are identical until the Manage Admins UI lands) | Write `websiteContent` from the browser (rules check `isAdmin()`); upload images to Vercel Blob with a token from `/api/upload`, which verifies the Firebase ID token the browser sends as `clientPayload` (`verifyIdToken(…, true)`) and that `admins/{uid}` exists before issuing it. It deliberately does not use the 5-day `session` cookie, which can expire while the admin page stays open |
| Server (firebase-admin) | Everything — admin SDK bypasses rules |

Browser writes to `guests`, `registryGifts`, and `giftSelections` are denied by
the rules; those go through server actions.

## Admin check on the server (`src/lib/requireAdmin.ts`)

`src/proxy.ts` only checks that a `session` cookie **exists** (a cheap
redirect). The real check is in `src/lib/requireAdmin.ts`:

- `getAdmin()` reads the `session` cookie,
  `verifySessionCookie(cookie, true)` (signature, expiry, revocation), and
  checks `admins/{uid}` exists. Returns `{ uid, role }` (missing `role` =
  `'admin'`). Memoized per request with React `cache`. `getAdminUid()` returns
  just the UID.
- `requireAdmin()` throws `Unauthorized`. **Every** function in
  `src/app/actions/admin.ts` calls it first inside its `try`, so an
  unauthenticated call returns `{ success: false, error: 'Unauthorized' }`.
  Any new admin action must do the same. `requireSuperAdmin()` also throws
  `Unauthorized` unless the role is `super`; use it for admin-management
  actions.
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
- `adminAllowlist` is written only by `scripts/add-admin.js` (and read only by
  the server); `firestore.rules` denies all browser access to it. Until the
  Email/Password provider is disabled in the Firebase Console, a password
  user can still sign in to Firebase, but gets no session cookie.

`/admin/content` is a client page; its writes go through Firestore rules
(`isAdmin()`) and `/api/upload`, not through these helpers.

## Secrets

- `FIREBASE_ADMIN_*` are server-only. Never import `src/lib/firebase/admin.ts`
  from a `'use client'` file.
- `NEXT_PUBLIC_FIREBASE_*` are public by design (they ship to the browser).
- `.env*` is git-ignored except `.env.local.example`. Do not print or commit
  real values.

## Known gaps (not fixed yet — read before touching auth)

1. **`/api/download` fetches any URL** passed in `?url=` (open proxy / SSRF).
   Restrict it to the image hosts (`*.public.blob.vercel-storage.com`, plus
   `firebasestorage.googleapis.com` while legacy URLs remain).
2. **`guests/{code}` has `allow get: if true`.** Anyone who knows or guesses a
   used code can read that guest's name, email, phone, and message from the
   browser. The site itself only uses the server action `verifyInviteCode`, so
   this rule can likely be `false`.
3. **No rate limit on `verifyInviteCode`.** 32^6 ≈ 1.07 billion codes makes
   guessing slow, but there is no throttle.
4. `firestore.rules` has overlapping `allow` lines per collection
   (e.g. `allow read, write: if isAdmin()` and `allow write: if false`); rules
   are OR-ed, so the `false` lines do nothing. Read them as "admin OR public
   read".

## Rules deployment

`firestore.rules` and `storage.rules` are deployed with the Firebase CLI
(`npx firebase deploy --only firestore:rules,storage`, project from
`.firebaserc`). Editing the file does nothing until deployed — confirm with the
owner before deploying.

## Security review

Use the built-in `/security-review` first. The Strix skills
(`find-security-vulnerabilities-in-code`, `fix-security-vulnerabilities-with-strix`)
only on request, and **never against the production URL**.
