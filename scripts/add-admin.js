const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), quiet: true });

// Writes `adminAllowlist/{email}`. The person becomes an admin (with this
// role) the next time they sign in with Google; see createSessionCookie in
// src/app/actions/auth.ts. Works before they have ever signed in, and also
// sets the role on an existing admin. This script is the only way to create
// a super admin, and the break-glass path if every super admin is locked out.
async function addAdmin(email, role) {
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
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: 'script'
    });

    console.log(`Allowlisted ${email} as ${role}. It takes effect on their next Google sign-in.`);
    process.exit(0);
  } catch (error) {
    console.error('Error adding admin:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const role = args.includes('--super') ? 'super' : 'admin';
const targetEmail = args.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();
if (!targetEmail || !/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(targetEmail)) {
  console.error('Please provide an email address. Usage: node scripts/add-admin.js <email> [--super]');
  process.exit(1);
}

addAdmin(targetEmail, role);
