# Current state

What is live, what is odd, and what is known to be broken or unused. Update this
when you find or fix one of these.

## Shipped

- 10-step guest site with Framer Motion screen transitions, text/image reveal
  animations, circular 3D gallery lightbox, background music.
- Invite-code RSVP with one-time codes (transaction-safe).
- Curated registry with claim limits (transaction-safe) and bank-transfer info.
- Admin: dashboard counts, invite generation + message template, RSVP list with
  CSV export, gift CRUD, claim list, content editors for all 12 screens with
  one-step backup/restore.

## Known issues

| Issue | Where | Notes |
| --- | --- | --- |
| Admin server actions and pages do not verify the session/admin | `src/app/actions/admin.ts`, `src/proxy.ts` | See `docs/security.md` gap 1–2 |
| `/api/download` is an open proxy | `src/app/api/download/route.ts` | Security gap 3 |
| Guest PII readable by code from the browser | `firestore.rules` `guests` | Security gap 4 |
| No collision check when generating invite codes | `generateCode()` in `admin.ts` | A duplicate overwrites an existing guest doc |
| Replaced images are never deleted from Blob | all editors | Counts against the shared 1 GB Hobby Blob quota |
| Legacy Firebase Storage URLs return 402 | Firestore `websiteContent/*`, `wedding-content.json` | Google billing account closed; replace by re-uploading in the admin, then `npm run sync-content`. See `docs/data-model.md` |
| `wedding-content.json` has a mixed `gallery` key and an unused `faqs` key | `src/data/wedding-content.json` | Side effect of `sync-content.js`; see `docs/data-model.md` |
| Content merge is hand-written per doc | `WeddingContentContext.tsx` | New fields in field-by-field docs need an explicit line |
| `RsvpScreen` falls back to `'dev-mode'` as the code | `src/app/page.tsx` | Submission fails server-side, which is the intended outcome |

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
