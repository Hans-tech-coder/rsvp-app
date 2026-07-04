const admin = require('firebase-admin');

async function addAdmin(email) {
  try {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
      process.exit(1);
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
    
    const db = admin.firestore();
    const auth = admin.auth();
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Found user: ${userRecord.email} with UID: ${userRecord.uid}`);
    
    // Add to admins collection with the UID as the document ID
    await db.collection('admins').doc(userRecord.uid).set({
      email: userRecord.email,
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Successfully added ${email} to the admins collection!`);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`Error: No user found with email ${email}. Make sure they signed up first.`);
    } else {
      console.error('Error adding admin:', error);
    }
  } finally {
    process.exit(0);
  }
}

const targetEmail = process.argv[2];
if (!targetEmail) {
  console.error('Please provide an email address. Usage: node scripts/add-admin.js <email>');
  process.exit(1);
}

addAdmin(targetEmail);
