const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function syncContent() {
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
        console.error('Error: Firebase Admin credentials not found.');
        console.log('Please either:');
        console.log('1. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local');
        console.log('2. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable to a service account JSON file');
        process.exit(1);
      }
    }
    
    const db = admin.firestore();
    const contentPath = path.join(__dirname, '../src/data/wedding-content.json');
    
    // Read the current JSON structure to use as a base
    let currentContent = {};
    if (fs.existsSync(contentPath)) {
      currentContent = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    }
    
    console.log('Pulling latest content from Firestore...');
    
    const docs = [
      'welcomeScreen', 'globalSettings', 'entranceScreen', 'ourStory',
      'entourage', 'details', 'dressCode', 'gallery', 'faq', 'registry',
      'rsvpCta', 'rsvpForm'
    ];
    
    // Map Firestore document IDs to their corresponding keys in the JSON file
    const docToKeyMap = {
      'welcomeScreen': 'welcomeScreen',
      'globalSettings': 'global',
      'entranceScreen': 'entranceScreen',
      'ourStory': 'ourStory',
      'entourage': 'entourage',
      'details': 'details',
      'dressCode': 'dressCode',
      'gallery': 'gallery',
      'faq': 'faqs',
      'registry': 'registry',
      'rsvpCta': 'rsvpCta',
      'rsvpForm': 'rsvpForm'
    };
    
    for (const docId of docs) {
      const docSnap = await db.collection('websiteContent').doc(docId).get();
      if (docSnap.exists) {
        const jsonKey = docToKeyMap[docId];
        currentContent[jsonKey] = {
          ...currentContent[jsonKey],
          ...docSnap.data()
        };
        console.log(`Synced: ${docId}`);
      }
    }
    
    // Write back to the JSON file
    fs.writeFileSync(contentPath, JSON.stringify(currentContent, null, 2), 'utf8');
    console.log('\nSuccess! wedding-content.json has been updated with the latest data from the database.');
    
  } catch (error) {
    console.error('Error syncing content:', error);
  } finally {
    process.exit(0);
  }
}

syncContent();
