# Admin portal (`/admin/**`)

Private dashboard for each event's team (organizers and clients) and the
platform owners. Sidebar and mobile header are in
`src/app/admin/AdminShell.tsx` (skipped on `/admin/login`), rendered by the
server layout `src/app/admin/layout.tsx`. Admin UI uses plain
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
   `docs/data-model.md`), and refuses an account that is neither a platform
   owner nor a member of an event ("This Google account has no event to
   manage."). Then it makes a 5-day Firebase
   **session cookie** named `session` (`httpOnly`, `secure`, path `/`).
3. `src/proxy.ts` redirects `/admin/**` to `/admin/login` when the cookie is
   missing, and `/admin/login` to `/admin/dashboard` when present. It does not
   verify the cookie; each admin server page calls `requireEventPage(eventId)`
   (`src/lib/requireAdmin.ts`), which sends an invalid or revoked session, or
   one with no access to the event, to `/api/logout` (clears the cookie, then
   `/admin/login`).
4. Sign out (`AdminShell.tsx`): `auth.signOut()` + `clearSessionCookie()`.

Every admin page and action works on one event, **the current event**, and
checks the signed-in person's role **in that event**: owner, organizer or
client (`src/lib/permissions.ts`, details in `docs/security.md`). The current
event is the one picked in the sidebar's event switcher, kept in the
`adminEvent` cookie (`getCurrentEventId` in `src/lib/requireAdmin.ts`); when
it is missing or no longer open to the account, the default event, else the
account's first event. Server pages call `requireCurrentEventPage(min?)`,
which returns the event ID with the role. The server layout (`layout.tsx`)
reads the current event, the role and the account's events and hands them to
`AdminShell` → `EventAccessProvider` (`src/app/admin/eventAccess.tsx`);
client pages read the event with `useCurrentEventId()` and the role with
`useEventAccess()` to hide what the role may not change. Without a current
event the sidebar shows only All Events, and Content / Visual Builder show a
link to it (`components/NoEvent.tsx`).

## All Events and the event switcher (F11)

`/admin` (`page.tsx` server, `EventsClient.tsx`) lists every event the
account may open: all of them for an owner, the memberships for anyone else.
Each card shows the name, link, type, the date the guest site shows, the
account's role, badges (Open now, Home page = the default event, Live /
Archived) and the RSVP counts (attending, not attending, no reply yet,
invites; Firestore count queries). Archived events are listed apart, below.

- **Open** / the switcher: a plain link to `/admin/open/<eventId>`
  (`open/[event]/route.ts`), which sets the `adminEvent` cookie and goes to
  the dashboard. A plain link, so the content editors' leave guard asks first.
- **New event** (owners, and organizers of any event): name + link
  (suggested from the name with `toEventId`, editable). It starts with the
  default Wedding content (templates are F12). An organizer who creates one
  becomes its organizer; then the new event opens.
- **Duplicate** (organizers of the event): a new event with the published
  content, the invite message and the client design switch; guests, RSVPs,
  gifts, drafts, versions, team and log stay behind. Then it opens.
- **Change link** (organizers): copies every doc to the new ID, moves the
  members' `eventIds` and pending invites, deletes the old ID. The old URL
  becomes a 404, so do it before invitations go out.
- **Archive / Restore** (organizers): `status: 'archived'` makes the guest
  page a 404; nothing is deleted. Admins can still open and preview it.
- **Delete** (owners only): type the link to confirm; deletes the event doc
  and every subcollection. Uploaded images stay in Blob (F13).
- The default event (`/` opens it) cannot be renamed, archived or deleted.
- Links equal to a top-level route or `public/` folder (`admin`, `api`,
  `images`) are refused (`isFreeEventId`).

The sidebar's **event switcher** (`EventSwitcher.tsx`, above the nav) shows
the current event and lists the account's events (archived ones marked) plus
"Manage events" (`/admin`). The list is read by the server layout, so it is
fresh on every full load and after `router.refresh()`.

Platform owners: `node scripts/add-admin.js <email> --super` (reads
`FIREBASE_ADMIN_*` from `.env.local`, or `GOOGLE_APPLICATION_CREDENTIALS`).
The same script adds an event member with `--event <id> [--role organizer|client]`,
like the Team page. The person does not need to have signed in yet. See
`docs/security.md` for what is and is not checked.

## Team (organizers and owners)

`/admin/team` (`team/page.tsx` server, `TeamClient.tsx`), in the sidebar as
**Team** for organizers and owners only (a client who opens the URL goes to
the dashboard). It replaced the super-admin "Manage Admins" modal (F10).

- **Add someone**: email + role → `addMember`. An email with an account is
  added to `members` at once; anyone else gets an invite
  (`adminAllowlist/{email}.events[eventId]`) and joins on their first Google
  sign-in. Refuses platform owners and people already in the team or invited.
- **Members**: email, date added, a role select (`changeMemberRole`) and
  Remove (`removeMember`, confirmed in `AdminModal`). Both are disabled for
  yourself.
- **Invited, not signed in yet**: Cancel invite → `cancelInvite`.
- **Clients may change the design** switch → `setClientDesign` (section
  order, colors & fonts, music).
- **Activity**: the last 50 audit log entries (who, what, when).

Owners are not listed (they open every event); there is no UI to add or
remove one.

## Client locks

For a client without `clientDesign`: the **Colors & Fonts** and **Music** tabs
(content page) and panels (builder) are hidden, and the Screens list has no
drag handles or arrows (show / hide and rename stay; "The order is set by
your organizer."). The server refuses the same changes (`saveDraft`,
`publishDraft`, `discardDraft`).

## Builder edit lock

Only one browser tab per event uses the visual builder at a time
(`builder/useEditLock.ts` + `actions/editLock.ts`). Anyone else (or the same
person in a second tab) sees "X is editing this event" over the builder, with
**Take over** and **Back to Content**. The tab that loses the lock saves its
open edits as drafts and shows "X took over editing". Leaving the builder
frees the lock (a link inside the admin: `releaseEditLock`; closing the tab
or leaving the site: a beacon to `/api/edit-lock/release`). A tab that
crashes or goes offline frees it after 90 s without a heartbeat; a waiting
tab then gets it on its next check (every 30 s). Browsers slow timers in
background tabs (about one check a minute), which stays inside the 90 s. Phones (the builder's phone message) never take the lock.

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
| `/admin/invites` | Generate N codes; copy the invite message (template with `{{CODE}}`; until one is saved, the default links to the event's own URL, `getEventUrl(eventId)`, and is signed with its `coupleNameFormat`), mark as copied; regenerate or delete a code; edit the template | `generateInviteCodes`, `regenerateInviteCode`, `deleteInviteCode`, `toggleInviteCopiedStatus`, `updateInviteMessageTemplate` |
| `/admin/guests` | RSVP list with search/filter and CSV export (papaparse); delete an entry | `deleteInviteCode` |
| `/admin/gifts` | Registry gift CRUD (`name`, `link`, `maxCount`); reset claims | `addRegistryGift`, `updateRegistryGift`, `deleteRegistryGift`, `resetRegistryGift` |
| `/admin/registry` | Who claimed which gift; delete a claim (decrements the gift count) | `deleteGiftSelection` |
| `/admin/content` | Tabbed editors for every guest screen, plus **Site Text** (every button, label, hint and error message, grouped by screen, with a search box; empty field = default) **Screens & Menu** (reorder, show/hide and rename the guest screens; `content/screens`), **Colors & Fonts** (palette presets, color pickers, readability check, font pairings, live preview; `content/theme`) and **Music** (on/off, song upload, starting volume; `content/music`) | `loadDraft`, `saveDraft`, `publishDraft`, `discardDraft`, `getVersion` (`src/app/actions/content.ts`): editors save a draft (also autosaved after 10 s idle), **Publish** makes it live and rebuilds the cached guest page, **History** restores one of the last 10 published versions. A **Preview** button shows the draft site in a phone / desktop frame (docked from 1024 px, full screen below). See "Drafts, preview and versions" in `docs/content-system.md` |
| `/admin/team` | The event's team, invites, the client design switch and the activity log (organizers and owners) | `addMember`, `changeMemberRole`, `removeMember`, `cancelInvite`, `setClientDesign` (`src/app/actions/team.ts`) |
| `/admin/builder` | **Visual builder** (tablet and wider; full screen): section list (pick, drag, show/hide, rename) and site-wide panels on the left, the draft site in the middle, the picked section's editor on the right. Click a section in the preview to edit it; edits show live; Undo / Redo across panels. See "Visual builder" in `docs/content-system.md` | Same as `/admin/content` (each panel is the same editor with its own Save Draft / Publish / History) |

## Adding an admin page

1. Create `src/app/admin/<name>/page.tsx` (server) + `<Name>Client.tsx`.
2. Add a nav item in `navItems` in `src/app/admin/AdminShell.tsx`.
3. Put new mutations in `src/app/actions/admin.ts` (return the
   `{success, error}` shape) — start each with `requireEventRole(eventId, …)`
   (see `docs/security.md`), call `const { eventId } = await
   requireCurrentEventPage(…)` first in the page, and record the change with
   `logActivity`.
4. Update `docs/FEATURE-MAP.md` and this file.
