import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const app = getApps().length > 0 ? getApps()[0] : initializeApp({ projectId: 'test' });
const db = getFirestore(app);

const proxyDb = new Proxy({} as any, {
  get: (target, prop) => db[prop as keyof typeof db]
});

try {
  proxyDb.collection('guests');
  console.log("SUCCESS!");
} catch (e: any) {
  console.error("FAILED!", e.message);
}
