# Security model

## Who can do what (as built)

| Actor | Can |
| --- | --- |
| Anyone | Read `websiteContent`, `registryGifts`, and any single `guests/{code}` doc from the browser (`firestore.rules`); read all Storage files; call any server action; call `/api/download` |
| Guest with a valid unused code | Submit one RSVP (`submitRsvp` transaction flips `codeStatus` to `used`) |
| Signed-in admin (`admins/{uid}` exists) | Write `websiteContent` and Storage from the browser (rules check `isAdmin()`) |
| Server (firebase-admin) | Everything — admin SDK bypasses rules |

Browser writes to `guests`, `registryGifts`, and `giftSelections` are denied by
the rules; those go through server actions.

## Secrets

- `FIREBASE_ADMIN_*` are server-only. Never import `src/lib/firebase/admin.ts`
  from a `'use client'` file.
- `NEXT_PUBLIC_FIREBASE_*` are public by design (they ship to the browser).
- `.env*` is git-ignored except `.env.local.example`. Do not print or commit
  real values.

## Known gaps (not fixed yet — read before touching auth)

1. **Admin server actions do not check the caller.** Every function in
   `src/app/actions/admin.ts` (generate/delete/regenerate codes, gift CRUD,
   reset claims, delete selections, edit the invite template) runs with the
   admin SDK and no session or `admins` check. Server actions are public POST
   endpoints, so anyone who can obtain an action ID can call them.
   **Fix pattern:** a `requireAdmin()` helper that reads the `session` cookie,
   `getAdminAuth().verifySessionCookie(cookie, true)`, and checks
   `admins/{uid}` exists; call it first in every admin action and admin
   server page.
2. **`src/proxy.ts` only checks that a `session` cookie exists**, not that it is
   valid. Server pages then read Firestore with the admin SDK, so a fake cookie
   value reaches the admin pages. Same fix: verify in the pages/actions (the
   proxy should stay a cheap redirect).
3. **`/api/download` fetches any URL** passed in `?url=` (open proxy / SSRF).
   Restrict it to the Firebase Storage host
   (`firebasestorage.googleapis.com`).
4. **`guests/{code}` has `allow get: if true`.** Anyone who knows or guesses a
   used code can read that guest's name, email, phone, and message from the
   browser. The site itself only uses the server action `verifyInviteCode`, so
   this rule can likely be `false`.
5. **No rate limit on `verifyInviteCode`.** 32^6 ≈ 1.07 billion codes makes
   guessing slow, but there is no throttle.
6. `firestore.rules` has overlapping `allow` lines per collection
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
