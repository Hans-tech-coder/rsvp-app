# Admin portal (`/admin/**`)

Private dashboard for the couple. Sidebar and mobile header are in
`src/app/admin/layout.tsx` (skipped on `/admin/login`). Admin UI uses plain
Tailwind grays (`gray-*` light, `zinc-*` dark) and lucide icons — **not** the
wedding palette.

## Login and session

1. `/admin/login` (`login/page.tsx`, client): one **Sign in with Google**
   button → `signInWithPopup` (`prompt: 'select_account'`; a popup, because
   the redirect flow breaks when third-party cookies are blocked on
   `*.vercel.app`) → `getIdToken()` → server action
   `createSessionCookie(idToken)` (`actions/auth.ts`). On failure the page
   shows the error and signs the Firebase client out.
2. `createSessionCookie` verifies the ID token (with revocation), requires
   `sign_in_provider === 'google.com'`, `email_verified`, and a sign-in within
   the last 5 minutes, claims any `adminAllowlist/{email}` entry (see
   `docs/data-model.md`), and refuses users with no `admins/{uid}` doc ("This
   Google account is not an admin."). Then it makes a 5-day Firebase
   **session cookie** named `session` (`httpOnly`, `secure`, path `/`).
3. `src/proxy.ts` redirects `/admin/**` to `/admin/login` when the cookie is
   missing, and `/admin/login` to `/admin/dashboard` when present. It does not
   verify the cookie; each admin server page calls `requireAdminPage()`
   (`src/lib/requireAdmin.ts`), which sends an invalid, revoked, or non-admin
   session to `/api/logout` (clears the cookie, then `/admin/login`).
4. Sign out (`layout.tsx`): `auth.signOut()` + `clearSessionCookie()`.

Adding an admin: `node scripts/add-admin.js <email> [--super]` (reads `FIREBASE_ADMIN_*`
from `.env.local`, or `GOOGLE_APPLICATION_CREDENTIALS`) writes `adminAllowlist/{email}`. The person
does not need to exist yet; they become an admin on their next Google
sign-in. `--super` is the only way to make a super admin. See
`docs/security.md` for what is and is not checked.

## Manage Admins (super admins only)

Day-to-day admin changes happen in the portal, not the script. There is no
page or route for this: a **Manage Admins** button (`ShieldCheck` icon) sits
under the regular `navItems` in the sidebar (the same `<aside>` is the mobile
slide-in menu). `layout.tsx` calls `getMyAdminRole()` when it mounts and again
after leaving `/admin/login`, and renders the button only when the result is
`'super'`. Nothing renders while the call is pending, so a regular admin never
sees it flash.

The button opens `components/ManageAdminsModal.tsx`, which the layout mounts
only while it is open. The modal loads `listAdmins()` each time it opens and shows:

- an **Add admin** email field → `addAdmin(email)` writes
  `adminAllowlist/{email}` with `role: 'admin'`. It refuses an email that is
  already an admin or already pending;
- **Active** admins (email, role, date added). Each has a Remove button, which
  is hidden for yourself and for super admins. It asks for confirmation in
  `AdminModal`, then calls `removeAdmin(uid)`;
- **Pending** allowlist entries, each with **Cancel** →
  `cancelPendingAdmin(email)`. The button is hidden for pending super entries.

The modal closes on Esc (Esc closes an open confirmation first) and on a
backdrop click. The list scrolls inside the panel on small screens. The UI
never creates, removes, or cancels a super admin; use `add-admin.js --super`,
or delete the doc in the Firebase console.

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
