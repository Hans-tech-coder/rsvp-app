// F10 roles migration: give every admin from before F10 a place in an event's
// team, so they keep their access when the per-event checks go live.
//
//   admins/{uid}            role 'admin' (or none)  -> events/{event}/members/{uid} { role }
//                                                     + admins/{uid}.eventIds += event
//   adminAllowlist/{email}  role 'admin', no events -> adminAllowlist/{email}.events[event] = role
//
// Platform owners (role 'super') are left alone: they open every event
// without a membership. Adds only: nothing is deleted or overwritten (an
// existing membership keeps its role), so the code from before F10, which
// ignores these fields, keeps working, and the script is safe to run again.
// Rollback: redeploy the old code; the added fields are unused by it.
//
//   node scripts/migrate-members-f10.js             dry run: what would be added
//   node scripts/migrate-members-f10.js --write     add the missing memberships
//   node scripts/migrate-members-f10.js --verify    every non-owner account and invite has an event;
//                                                   exit code 1 if not
//   --event <id>   target event (default hans-and-czay)
//   --role <role>  organizer (default) or client
//
// Prints counts only (no emails). Reads FIREBASE_ADMIN_* from .env.local.

const admin = require('firebase-admin');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local'), quiet: true });

const EVENT_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const ROLES = ['organizer', 'client'];
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const eventId = option('--event') || 'hans-and-czay';
const role = option('--role') || 'organizer';
const WRITE = flag('--write');
const VERIFY = flag('--verify');

function init() {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) {
    console.error('FIREBASE_ADMIN_PRIVATE_KEY (and _PROJECT_ID, _CLIENT_EMAIL) missing from .env.local');
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: key.replace(/\\n/g, '\n'),
    }),
  });
  return admin.firestore();
}

const isOwner = (doc) => doc.get('role') === 'super';
const hasEvents = (doc) => {
  const events = doc.get('events');
  return !!events && typeof events === 'object' && Object.values(events).some((r) => ROLES.includes(r));
};

async function main() {
  if (!EVENT_ID.test(eventId)) throw new Error(`Invalid event: ${eventId}`);
  if (!ROLES.includes(role)) throw new Error(`Invalid role: ${role} (organizer or client)`);
  const db = init();

  const event = await db.doc(`events/${eventId}`).get();
  if (!event.exists) throw new Error(`events/${eventId} does not exist`);

  const [accounts, allowlist] = await Promise.all([db.collection('admins').get(), db.collection('adminAllowlist').get()]);
  const people = accounts.docs.filter((d) => !isOwner(d));
  const members = await Promise.all(people.map((d) => db.doc(`events/${eventId}/members/${d.id}`).get()));
  const invites = allowlist.docs.filter((d) => !isOwner(d));

  const accountsToAdd = people.filter((d, i) => !members[i].exists || !(d.get('eventIds') || []).includes(eventId));
  const invitesToAdd = invites.filter((d) => !hasEvents(d));

  console.log(`Event ${eventId}: ${accounts.size} accounts (${accounts.size - people.length} owners), ${allowlist.size} pending invites.`);

  if (VERIFY) {
    const noEvent = people.filter((d) => !(d.get('eventIds') || []).length).length;
    const missing = people.filter((d, i) => (d.get('eventIds') || []).includes(eventId) && !members[i].exists).length;
    console.log(`Accounts without an event: ${noEvent}. Listing ${eventId} without a membership: ${missing}. Invites without an event: ${invitesToAdd.length}.`);
    const ok = noEvent === 0 && missing === 0 && invitesToAdd.length === 0;
    console.log(ok ? 'Verify OK.' : 'Verify FAILED.');
    process.exit(ok ? 0 : 1);
  }

  console.log(`To add: ${accountsToAdd.length} memberships (${role}), ${invitesToAdd.length} invites (${role}).`);
  if (!WRITE) {
    console.log('Dry run. Add --write to apply.');
    return;
  }

  const batch = db.batch();
  people.forEach((d, i) => {
    if (!members[i].exists) {
      batch.create(members[i].ref, {
        email: d.get('email') || '',
        role,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        addedBy: 'migrate-members-f10',
      });
    }
    batch.update(d.ref, { eventIds: admin.firestore.FieldValue.arrayUnion(eventId) });
  });
  invitesToAdd.forEach((d) => batch.set(d.ref, { events: { [eventId]: role } }, { merge: true }));
  await batch.commit();
  console.log('Written. Run with --verify to check.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
