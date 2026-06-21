import { cert } from 'firebase-admin/app';

try {
  cert({
    projectId: 'test',
    clientEmail: 'test@example.com',
    privateKey: 'invalid-key'
  });
  console.log("cert() succeeded");
} catch (e: any) {
  console.log("cert() threw synchronously:", e.message);
}
