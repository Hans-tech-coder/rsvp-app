const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), quiet: true });

// Writes `adminAllowlist/{email}`. It takes effect the next time they sign
// in with Google; see createSessionCookie in src/app/actions/auth.ts. Works
// before they have ever signed in, and on an existing account.
//   --super                    platform owner (every event). This script is
//                              the only way to make one, and the break-glass
//                              path if every owner is locked out.
//   --event <id> [--role r]    member of that event: organizer (default) or
//                              client. The Team page does the same in the app.
async function addAdmin(email, role, eventId, eventRole) {
  try {
    if (!admin.apps.length) {
      if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
      } else {
        console.error('Error: Firebase Admin credentials not found. Set FIREBASE_ADMIN_* in .env.local or GOOGLE_APPLICATION_CREDENTIALS.');
        process.exit(1);
      }
    }

    await admin.firestore().collection('adminAllowlist').doc(email).set({
      role,
      ...(eventId ? { events: { [eventId]: eventRole } } : {}),
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: 'script'
    }, { merge: true });

    console.log(`Allowlisted ${email} as ${eventId ? `${eventRole} of ${eventId}` : 'platform owner'}. It takes effect on their next Google sign-in.`);
    process.exit(0);
  } catch (error) {
    console.error('Error adding admin:', error);
    process.exit(1);
  }
}

const USAGE = 'Usage: node scripts/add-admin.js <email> --super | --event <id> [--role organizer|client]';
const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const isSuper = args.includes('--super');
const eventId = option('--event');
const eventRole = option('--role') || 'organizer';
const values = new Set([eventId, option('--role')]);
const targetEmail = args.find((arg) => !arg.startsWith('--') && !values.has(arg))?.trim().toLowerCase();
if (!targetEmail || !/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(targetEmail)) {
  console.error(`Please provide an email address. ${USAGE}`);
  process.exit(1);
}
if (isSuper === !!eventId) {
  console.error(`Give either --super or --event. ${USAGE}`);
  process.exit(1);
}
if (eventId && (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(eventId) || !['organizer', 'client'].includes(eventRole))) {
  console.error(`Invalid event or role. ${USAGE}`);
  process.exit(1);
}

addAdmin(targetEmail, isSuper ? 'super' : 'admin', eventId, eventRole);
