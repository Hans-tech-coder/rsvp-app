# Admin portal (`/admin/**`)

Private dashboard for the couple. Sidebar and mobile header are in
`src/app/admin/layout.tsx` (skipped on `/admin/login`). Admin UI uses plain
Tailwind grays (`gray-*` light, `zinc-*` dark) and lucide icons — **not** the
wedding palette.

## Login and session

1. `/admin/login` (`login/page.tsx`, client): `signInWithEmailAndPassword`
   (Firebase client Auth) → `getIdToken()` → server action
   `createSessionCookie(idToken)` (`actions/auth.ts`).
2. `createSessionCookie` verifies the ID token, refuses users with no
   `admins/{uid}` doc ("This account is not an admin."), then makes a 5-day
   Firebase **session cookie** named `session` (`httpOnly`, `secure`, path `/`).
3. `src/proxy.ts` redirects `/admin/**` to `/admin/login` when the cookie is
   missing, and `/admin/login` to `/admin/dashboard` when present. It does not
   verify the cookie; each admin server page calls `requireAdminPage()`
   (`src/lib/requireAdmin.ts`), which sends an invalid, revoked, or non-admin
   session to `/api/logout` (clears the cookie, then `/admin/login`).
4. Sign out (`layout.tsx`): `auth.signOut()` + `clearSessionCookie()`.

Adding an admin: the user must exist in Firebase Auth, then
`node scripts/add-admin.js <email>` (needs `GOOGLE_APPLICATION_CREDENTIALS`)
creates `admins/{uid}`. See `docs/security.md` for what is and is not checked.

## Page pattern

Data pages are split in two:

- `page.tsx` — **server component**, `export const dynamic = 'force-dynamic'`,
  reads Firestore with `getAdminDb()`, converts Timestamps to ISO strings
  (client components cannot receive Firestore Timestamps), and renders the client
  component.
- `*Client.tsx` — `'use client'`, owns table state (search, filter, pagination
  via `TablePagination`), confirms through `AdminModal`, calls a server action,
  then `router.refresh()` to re-run the server page.

Server actions return `{ success: true, ... }` or `{ success: false, error }`;
the client checks `success` and shows the error.

## Pages

| Route | What it does | Actions |
| --- | --- | --- |
| `/admin/dashboard` | Counts: total/unused codes, attending/not attending, gifts total/full/available | – |
| `/admin/invites` | Generate N codes; copy the invite message (template with `{{CODE}}`), mark as copied; regenerate or delete a code; edit the template | `generateInviteCodes`, `regenerateInviteCode`, `deleteInviteCode`, `toggleInviteCopiedStatus`, `updateInviteMessageTemplate` |
| `/admin/guests` | RSVP list with search/filter and CSV export (papaparse); delete an entry | `deleteInviteCode` |
| `/admin/gifts` | Registry gift CRUD (`name`, `link`, `maxCount`); reset claims | `addRegistryGift`, `updateRegistryGift`, `deleteRegistryGift`, `resetRegistryGift` |
| `/admin/registry` | Who claimed which gift; delete a claim (decrements the gift count) | `deleteGiftSelection` |
| `/admin/content` | Tabbed editors for every guest screen | none — editors write Firestore from the browser (see `docs/content-system.md`) |

## Adding an admin page

1. Create `src/app/admin/<name>/page.tsx` (server) + `<Name>Client.tsx`.
2. Add a nav item in `navItems` in `src/app/admin/layout.tsx`.
3. Put new mutations in `src/app/actions/admin.ts` (return the
   `{success, error}` shape) — and add the admin check described in
   `docs/security.md`.
4. Update `docs/FEATURE-MAP.md` and this file.
