// F5 content migration: add the generic content fields to an event's content
// docs, computed from the old wedding-only fields.
//
//   globalSettings  groomName / brideName                 -> hosts[]
//   entourage       parents, principalSponsors, ... lists -> groups[]  (titles from siteText.entourage)
//   details         ceremony + reception (+ the venue      -> venues[]
//                   time/location/address in globalSettings)
//   dressCode       ladiesGuideline / gentlemenGuideline  -> guidelines[] (titles from siteText.dressCode)
//
// The same docs' `_backup` copies get the fields too, so "Restore" in the
// editors brings back the right titles. Adds fields only: the old fields stay
// as they are, so the code from before F5 keeps working if it is redeployed.
// A doc that already has the new field is left alone (safe to run again).
//
//   node scripts/migrate-content-f5.js             dry run: what would be added
//   node scripts/migrate-content-f5.js --write     add the missing fields
//   node scripts/migrate-content-f5.js --verify    every doc with old fields has a valid new
//                                                  field; exit code 1 if not
//   --dump <file>                                  also save the docs as they are now (JSON)
//   --event <id>                                   target event (default hans-and-czay)
//
// The conversion is src/lib/genericContent.ts itself (the site's legacy
// reader), loaded with jiti, which comes with Tailwind / ESLint / Vitest.
// Reads FIREBASE_ADMIN_* from .env.local, like sync-content.js.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { createJiti } = require('jiti');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const gc = createJiti(__filename)(path.join(__dirname, '../src/lib/genericContent.ts'));

const EVENT_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const eventId = option('--event') || 'hans-and-czay';
const WRITE = flag('--write');
const VERIFY = flag('--verify');
const DUMP = option('--dump');

// doc -> the new field, its reader, and how to build it from the old fields
const PLAN = {
  globalSettings: { field: 'hosts', read: gc.readHosts, build: (d) => gc.hostsFromLegacy(d) },
  entourage: { field: 'groups', read: gc.readPeopleGroups, build: (d, ctx) => gc.peopleGroupsFromLegacy(d, ctx.siteText.entourage) },
  details: { field: 'venues', read: gc.readVenues, build: (d, ctx) => gc.venuesFromLegacy(d, ctx.globalSettings) },
  dressCode: { field: 'guidelines', read: gc.readGuidelines, build: (d, ctx) => gc.guidelinesFromLegacy(d, ctx.siteText.dressCode) },
};

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

function summary(field, value) {
  if (field === 'hosts') return value.map((h) => `${h.name} (${h.role})`).join(', ');
  if (field === 'groups') return value.map((g) => `${g.title} [${g.layout}: ${g.layout === 'pairs' ? g.pairs.length : g.people.length}]`).join(', ');
  if (field === 'venues') return value.map((v) => `${v.title} @ ${v.time}`).join(', ');
  return value.map((g) => g.title).join(', ');
}

async function main() {
  if (!EVENT_ID.test(eventId)) {
    console.error(`Invalid --event "${eventId}"`);
    process.exit(1);
  }
  const db = init();
  const content = (id) => db.doc(`events/${eventId}/content/${id}`);

  const ids = ['siteText', ...Object.keys(PLAN).flatMap((id) => [id, `${id}_backup`])];
  const snaps = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await content(id).get()])));
  const ctx = {
    siteText: snaps.siteText.data() || {},
    // Old-shape venues take time/location/address from the live Global Settings
    globalSettings: snaps.globalSettings.data() || {},
  };

  if (DUMP) {
    const dump = Object.fromEntries(ids.filter((id) => snaps[id].exists).map((id) => [id, snaps[id].data()]));
    fs.writeFileSync(DUMP, JSON.stringify({ eventId, at: new Date().toISOString(), docs: dump }, null, 2));
    console.log(`Saved ${Object.keys(dump).length} docs to ${DUMP}`);
  }

  console.log(`${VERIFY ? 'Verify' : WRITE ? 'Write' : 'Dry run'}: events/${eventId}/content\n`);
  let problems = 0;
  let written = 0;

  for (const [docId, { field, read, build }] of Object.entries(PLAN)) {
    for (const id of [docId, `${docId}_backup`]) {
      const snap = snaps[id];
      if (!snap.exists) {
        console.log(`  ${id}: no doc`);
        continue;
      }
      const data = snap.data();
      const legacy = build(data, ctx);
      const current = read(data[field]);

      if (VERIFY) {
        if (current) {
          const same = legacy && JSON.stringify(current) === JSON.stringify(legacy);
          console.log(`  ${id}: ok, ${field} = ${summary(field, current)}${legacy && !same ? ' (edited since the migration)' : ''}`);
        } else if (legacy) {
          problems++;
          console.log(`  ${id}: MISSING ${field} (has old fields)`);
        } else {
          console.log(`  ${id}: neither shape (site uses the defaults)`);
        }
        continue;
      }

      if (current) {
        console.log(`  ${id}: already has ${field}, skipped`);
      } else if (!legacy) {
        console.log(`  ${id}: no old fields, nothing to add`);
      } else if (WRITE) {
        // Fails instead of overwriting if an editor saved the doc since it was read
        await content(id).update({ [field]: legacy }, { lastUpdateTime: snap.updateTime });
        written++;
        console.log(`  ${id}: added ${field} = ${summary(field, legacy)}`);
      } else {
        console.log(`  ${id}: would add ${field} = ${summary(field, legacy)}`);
      }
    }
  }

  if (VERIFY) {
    console.log(problems ? `\n${problems} doc(s) not migrated.` : '\nAll content docs have the new fields.');
    process.exit(problems ? 1 : 0);
  }
  console.log(WRITE ? `\nAdded fields to ${written} doc(s). Old fields left in place.` : '\nDry run: nothing written. Use --write to add.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
