# Security model

## Who can do what (as built)

| Actor | Can |
| --- | --- |
| Anyone | Read an event's `content` and `registryGifts` (`events/{eventId}/…`) from the browser (`firestore.rules`);read all uploaded images (public Vercel Blob URLs); call the guest server actions (`rsvp.ts`, `registry.ts`). **Cannot** read or write `guests` from the browser (`allow read, write: if false`); invite-code checks and RSVPs go through `verifyInviteCode` / `submitRsvp` |
| Anyone, via `/api/download` | Download an image only from an allowed host (`isAllowedImageUrl` in `src/lib/downloadProxy.ts`): `https:`, default port, no credentials, and either a `*.public.blob.vercel-storage.com` host (`endsWith`, not `includes`) or `firebasestorage.googleapis.com` with a path under `/v0/b/${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/` (legacy URLs). Anything else gets 400 before any fetch. The fetch uses `redirect: 'error'`; a non-`image/*` reply gets 415, more than 15 MB gets 413 (by `content-length`, and by a byte count while reading when the header is missing or wrong). Upstream errors return a generic 502/500; details go to `console.error` only. `filename` is cut down to `[A-Za-z0-9._-]`, max 100 chars, fallback `download.jpg` (`sanitizeFilename`), so no header injection. Response sets `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`. Tests: `npm test` (`src/lib/downloadProxy.test.ts`) |
| Guest with a valid unused code | Submit one RSVP (`submitRsvp` transaction flips `codeStatus` to `used`) |
| Event **client** (`events/{eventId}/members/{uid}`, `role: 'client'`) | In that event only: every admin page, guests, invites, gifts, registry claims, and every content doc except the design. Design = section **order**, `theme` (colors & fonts) and `music`: allowed only when the event's `settings/permissions.clientDesign` is true. Showing, hiding and renaming sections are allowed. Read every content draft. Upload images and music (see below) |
| Event **organizer** (`role: 'organizer'`) | Everything in that event, including the design and the **Team** page: add, remove and re-role members (not themselves), cancel invites, turn `clientDesign` on or off, read the activity log |
| Platform **owner** (`admins/{uid}.role == 'super'`) | Everything an organizer can, in **every** event, with no membership. Made only by `scripts/add-admin.js --super` (or the Firebase console); the Team page never creates, removes or lists owners |
| Any member or owner, uploads | Upload images (and music, paths under `music/`: `audio/*`, 10 MB) to Vercel Blob with a token from `/api/upload`, which verifies the Firebase ID token the browser sends as `clientPayload` (`verifyIdToken(…, true)`) and that `admins/{uid}` is an owner or lists at least one event in `eventIds` (Blob paths are not per event). It deliberately does not use the 5-day `session` cookie, which can expire while the admin page stays open |
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
| `…/content/{doc}` | anyone | no (F10; only `publishDraft` writes it, with the admin SDK) |
| `…/drafts/{doc}`, `…/contentVersions/{doc}` | no (no rule) | no (no rule); server actions in `src/app/actions/content.ts` only |
| `…/guests/{code}` | no | no |
| `…/registryGifts/{id}` | anyone | no |
| `…/giftSelections/{id}` | `isMember(eventId)` (a member or an owner; no browser read uses it today) | no |
| `…/settings/{doc}` (`inviteTemplate`, `permissions`, `editLock`) | no | no |
| `…/members/{uid}`, `…/auditLog/{id}` | no | no |

`isOwner()` reads `admins/{uid}.role`; `isMember(eventId)` checks
`events/{eventId}/members/{uid}` exists, or `isOwner()`. The F10 rules were
deployed on 2026-10-15 (owner's OK) and checked with anonymous REST calls:
`content` and `registryGifts` read 200; `guests`, `giftSelections`,
`settings/permissions`, `settings/editLock`, `members`, `auditLog`, `drafts`
and the event record 403; a `content` write and a `members` write 403.

The F3 rules were checked on 2026-10-14 against the deployed rules with anonymous REST calls
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
event they name. Admin actions take `eventId` too and check the caller's
role **in that event** (`requireEventRole(eventId, …)`), so a member of one
event cannot act on another by sending its ID.

## Admin check on the server (`src/lib/requireAdmin.ts`)

`src/proxy.ts` only checks that a `session` cookie **exists** (a cheap
redirect). The real check is in `src/lib/requireAdmin.ts`; the rules of who
may do what are pure functions in `src/lib/permissions.ts` (tested), shared
with the admin UI:

- `getAdmin()` reads the `session` cookie,
  `verifySessionCookie(cookie, true)` (signature, expiry, revocation), and
  checks the account `admins/{uid}` exists. Returns `{ uid, email, isOwner,
  eventIds }` (`email` from the session, shown as "published by" in History
  and in the activity log). Says nothing about an event.
- `getEventAccess(eventId)` adds the role in that event: `owner` for a
  platform owner, else the `members/{uid}` role, else null; and the event's
  `clientDesign`. Both are memoized per request with React `cache`.
- `requireEventRole(eventId, min = 'client')` throws `Unauthorized` without
  access or below `min`. **Every** function in `src/app/actions/admin.ts`,
  `content.ts` (drafts, publish, versions; they also check the event ID with
  `isValidEventId` and the doc ID against `EDITABLE_DOC_IDS`), `team.ts`
  (`'organizer'`) and `editLock.ts` calls it first inside its `try`, so an
  unauthorized call returns `{ success: false, error: 'Unauthorized' }`.
  Any new admin action must do the same. The server admin layout only reports
  the caller's role, for the sidebar and the locks; hiding a control is UI
  only, the actions are the boundary.
- The current event (`adminEvent` cookie, set by `/admin/open/<eventId>`)
  only picks which event the pages show: `getCurrentEventId` ignores a
  cookie for an event the account cannot open (`canOpenEvent`: a role in it,
  and for an owner, the event exists), and every page and action still checks
  the role in the event it is given. The open link is a GET, so another site
  could switch which of your events is shown (the sidebar shows it), never
  open one you have no role in.
- Platform event actions (`src/app/actions/events.ts`): `createEvent` needs
  an owner or an organizer of any event; `duplicateEvent` an organizer of the
  source; `renameEvent` and `setEventArchived` an organizer of the event;
  `deleteEvent` an owner (`requireEventRole(eventId, 'owner')`) and the link
  typed back. The default event is refused by rename, archive and delete. A
  new event ID must pass `isFreeEventId` (not `admin`, `api`, `images`), and
  `create()` refuses a taken ID. An archived event's guest page is a 404
  (`readEventDocs`); its RSVP / registry actions are not blocked yet.
- Content locks: `saveDraft`, `publishDraft` and `discardDraft` refuse a
  design doc (`theme`, `music`) unless `canEditDoc` allows it, and
  `saveDraft` refuses a `screens` doc whose order differs from the current
  draft (else live) doc unless the caller may change the design
  (`keepsScreenOrder`). Restoring an old version goes through `saveDraft`, so
  it is checked the same way.
- `removeMember(eventId, uid)` deletes `members/{uid}` and takes the event
  off the account's `eventIds`. The per-request role check stops them at
  once in that event. When it was their last event (and they are not an
  owner) the account doc is deleted and `revokeRefreshTokens(uid)` called,
  so `verifySessionCookie(…, true)` rejects their 5-day session on their
  **next request**. It refuses to remove or re-role the caller.
- `requireCurrentEventPage(min)` (= `requireEventPage` on the current
  event) is the first line of every admin server page (`dashboard`,
  `invites`, `guests`, `gifts`, `registry`: any member; `team`:
  organizers); with no event to open it goes to `/admin` (All Events, which
  only needs a valid account). Without access it redirects to `/api/logout`, which
  deletes the cookie and redirects to `/admin/login` (going straight to login
  would loop, because the proxy bounces any cookie holder from login to the
  dashboard); a member below `min` goes to the dashboard.
- `createSessionCookie` refuses to issue a cookie unless the ID token is from
  **Google** sign-in (`sign_in_provider === 'google.com'`) with
  `email_verified`, was signed in within the last 5 minutes, and the account
  is a platform owner or a member of at least one event (`eventIds`), after
  claiming any `adminAllowlist/{email}` entry (which creates the account and
  the memberships it lists). Being able to sign in with Google does not make
  anyone an admin; an invite does. There is no email-domain check. A claim
  never downgrades an owner, and an entry that grants nothing (no owner role,
  no event) is left untouched.
- `adminAllowlist` is written only by `scripts/add-admin.js` and the Team
  actions in `team.ts` (and read only by the server); `addMember` refuses an
  email invited as an owner, so the UI never changes an owner entry;
  `firestore.rules` denies all browser access to it. Until the
  Email/Password provider is disabled in the Firebase Console, a password
  user can still sign in to Firebase, but gets no session cookie.

`/admin/content` is a client page; its content saves go through the admin
server actions in `src/app/actions/content.ts` (`requireAdmin`), uploads
through `/api/upload`.

**Draft preview.** `/<eventId>?preview=<token>` renders the event with its
unpublished drafts (`src/app/[event]/preview/page.tsx`, per request,
`noindex`). It checks `getEventAccess(eventId)` itself (the proxy does not
run there) and redirects anyone without access to that event to the live
page, so drafts are never shown to guests.
The token carries no access; only the admin session does. In the visual
builder the preview frame and `/admin/builder` exchange `postMessage`s;
both sides ignore any message whose origin is not the site's own
(`src/lib/builderMessages.ts`), and the preview only accepts them from its
parent window. They carry draft content to show, never anything saved: saves
still go through the admin-checked server actions.

**Edit lock.** The visual builder holds `settings/editLock` (`holder` = a
random ID per tab, `uid`, `email`, `at`) through `holdEditLock` /
`releaseEditLock` (`src/app/actions/editLock.ts`, any member). A closing tab
frees it with `navigator.sendBeacon` to `POST /api/edit-lock/release`
(`src/app/api/edit-lock/release/route.ts`), which calls `releaseEditLock`, so
the session cookie and the holder ID are checked the same way. It is
coordination, not access control: any member may take it over (logged), and
the draft conflict check in `saveDraft` still guards the data.

**Activity log.** `logActivity` (`src/lib/auditLog.ts`) adds
`events/{eventId}/auditLog/{auto}` `{ at, uid, email, action, target }` after
each admin mutation (publish, discard, invites, gifts, claims, the invite
message, team changes, the design switch, a builder take-over). Not logged:
draft saves and autosaves (the draft keeps `updatedBy`), the "copied" mark on
an invite. A failed log write never fails the action. Server only; organizers
read it on the Team page.

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
2. `storage.rules` (Firebase Storage, no longer used for uploads) still
   allows any `admins/{uid}` to write; left as it was.
3. The **old root** rules have overlapping `allow` lines for `registryGifts` and
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
2026-10-14 (with the owner's OK), ahead of the code that uses them. The F10
rules were deployed on 2026-10-15 after `scripts/migrate-members-f10.js`
(owner's OK), also ahead of the F10 code: the code before F10 never wrote
`content` from the browser after F9, and reads `giftSelections` on the
server, so it keeps working under them.

## Security review

Use the built-in `/security-review` first. The Strix skills
(`find-security-vulnerabilities-in-code`, `fix-security-vulnerabilities-with-strix`)
only on request, and **never against the production URL**.
