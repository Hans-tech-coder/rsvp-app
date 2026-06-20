import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

export function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const cleanEnvVar = (value: string | undefined) => {
    if (!value) return '';
    let cleaned = value;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned;
  };

  const projectId = cleanEnvVar(process.env.FIREBASE_ADMIN_PROJECT_ID);
  const clientEmail = cleanEnvVar(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  let privateKey = cleanEnvVar(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  privateKey = privateKey.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin environment variables are missing. Please configure them in Vercel.');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Lazy initialization proxies
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get: (target, prop) => getFirestore(getAdminApp())[prop as keyof ReturnType<typeof getFirestore>]
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get: (target, prop) => getAuth(getAdminApp())[prop as keyof ReturnType<typeof getAuth>]
});

export const adminStorage = new Proxy({} as ReturnType<typeof getStorage>, {
  get: (target, prop) => getStorage(getAdminApp())[prop as keyof ReturnType<typeof getStorage>]
});
