'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Guest } from '@/types';

export async function submitRsvp(
  inviteCode: string,
  formData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    willAttend: 'Yes' | 'No';
    proxyName?: string;
    message?: string;
  }
) {
  try {
    // We use the inviteCode as the document ID for the 'guests' collection
    const guestRef = adminDb.collection('guests').doc(inviteCode);

    await adminDb.runTransaction(async (transaction) => {
      const guestDoc = await transaction.get(guestRef);

      if (!guestDoc.exists) {
        throw new Error('Invalid invite code');
      }

      const guestData = guestDoc.data() as Guest;

      if (guestData.codeStatus === 'used') {
        throw new Error('This invite code has already been used.');
      }

      // Update the document atomically
      transaction.update(guestRef, {
        codeStatus: 'used',
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        willAttend: formData.willAttend,
        proxyName: formData.proxyName || '',
        message: formData.message || '',
        submittedAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit RSVP' };
  }
}
