const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// NOTE: Before running this script, you must set the GOOGLE_APPLICATION_CREDENTIALS 
// environment variable to the path of your Firebase service account key JSON file.

async function syncContent() {
  try {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
      console.log('Please download a service account key from Firebase Console > Project Settings > Service Accounts');
      console.log('Then run: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json" && npm run sync-content');
      process.exit(1);
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
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
