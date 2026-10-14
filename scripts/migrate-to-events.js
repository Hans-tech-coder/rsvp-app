// F3 data migration: copy the root collections into one event.
//
//   websiteContent -> events/<event>/content
//   guests         -> events/<event>/guests
//   registryGifts  -> events/<event>/registryGifts
//   giftSelections -> events/<event>/giftSelections
//   settings       -> events/<event>/settings
//
// Copies, never moves: the root collections are left as they are. Doc IDs are
// kept, so giftSelections.giftId still points at its gift.
//
//   node scripts/migrate-to-events.js             dry run: what would be copied
//   node scripts/migrate-to-events.js --write     copy docs the event does not have yet
//   node scripts/migrate-to-events.js --write --overwrite
//                                                 also replace event docs that differ
//                                                 (e.g. the root changed after the first copy)
//   node scripts/migrate-to-events.js --verify    every root doc exists in the event and
//                                                 is equal; exit code 1 if not
//   --event <id>                                  target event (default hans-and-czay)
//
// Safe to run again: without --overwrite it only adds what is missing.
// Reads FIREBASE_ADMIN_* from .env.local, like sync-content.js.

const admin = require('firebase-admin');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Same names as src/lib/eventPaths.ts (scripts are plain Node and cannot import it).
const COLLECTIONS = {
  websiteContent: 'content',
  guests: 'guests',
  registryGifts: 'registryGifts',
  giftSelections: 'giftSelections',
  settings: 'settings',
};
const EVENT_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const BATCH_LIMIT = 400;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const eventIdx = args.indexOf('--event');
const eventId = eventIdx >= 0 ? args[eventIdx + 1] : 'hans-and-czay';
const WRITE = flag('--write');
const OVERWRITE = flag('--overwrite');
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

// Deep equality for Firestore data (Timestamps, arrays, maps, primitives).
function same(a, b) {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (typeof a.isEqual === 'function') return a.constructor === b.constructor && a.isEqual(b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
}

async function main() {
  if (!EVENT_ID.test(eventId || '')) {
    console.error(`Invalid --event "${eventId}" (lowercase letters, digits, hyphens)`);
    process.exit(1);
  }
  if (OVERWRITE && !WRITE) {
    console.error('--overwrite only works with --write');
    process.exit(1);
  }

  const db = init();
  const project = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const mode = VERIFY ? 'VERIFY' : WRITE ? (OVERWRITE ? 'WRITE + OVERWRITE' : 'WRITE (missing only)') : 'DRY RUN';
  console.log(`Project ${project} -> events/${eventId}   [${mode}]\n`);

  const eventRef = db.doc(`events/${eventId}`);
  const eventSnap = await eventRef.get();
  console.log(`events/${eventId}: ${eventSnap.exists ? 'exists' : 'missing'}`);

  let problems = 0;
  let pending = [];
  const flush = async () => {
    for (let i = 0; i < pending.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const [ref, data] of pending.slice(i, i + BATCH_LIMIT)) batch.set(ref, data);
      await batch.commit();
    }
    pending = [];
  };

  for (const [rootName, subName] of Object.entries(COLLECTIONS)) {
    const [rootSnap, targetSnap] = await Promise.all([
      db.collection(rootName).get(),
      db.collection(`events/${eventId}/${subName}`).get(),
    ]);
    const target = new Map(targetSnap.docs.map((d) => [d.id, d.data()]));

    let missing = 0;
    let differ = 0;
    let equal = 0;
    for (const doc of rootSnap.docs) {
      const existing = target.get(doc.id);
      const ref = db.doc(`events/${eventId}/${subName}/${doc.id}`);
      if (existing === undefined) {
        missing++;
        if (WRITE) pending.push([ref, doc.data()]);
        if (VERIFY) console.log(`  missing: ${subName}/${doc.id}`);
      } else if (!same(existing, doc.data())) {
        differ++;
        if (WRITE && OVERWRITE) pending.push([ref, doc.data()]);
        if (VERIFY) console.log(`  differs: ${subName}/${doc.id}`);
      } else {
        equal++;
      }
    }
    const extra = targetSnap.size - (rootSnap.size - missing);
    problems += missing + differ;

    console.log(
      `${rootName.padEnd(15)} -> ${subName.padEnd(15)} root ${String(rootSnap.size).padStart(4)} | ` +
      `equal ${equal}, missing ${missing}, differs ${differ}` +
      (extra > 0 ? `, only in event ${extra} (kept)` : '')
    );

    if (WRITE && pending.length) {
      const n = pending.length;
      await flush();
      console.log(`  wrote ${n}`);
    }
  }

  if (WRITE && !eventSnap.exists) {
    await eventRef.set({
      slug: eventId,
      type: 'wedding',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`\ncreated events/${eventId}`);
  }

  if (VERIFY) {
    if (!eventSnap.exists) problems++;
    console.log(problems ? `\nVERIFY FAILED: ${problems} problem(s)` : '\nVERIFY OK: every root doc is in the event, unchanged');
    process.exit(problems ? 1 : 0);
  }
  if (!WRITE) console.log('\nDry run, nothing written. Add --write to copy.');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
