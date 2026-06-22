'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Guest } from '@/types';
import weddingContent from '@/data/wedding-content.json';

export async function verifyInviteCode(inviteCode: string) {
  try {
    const guestRef = getAdminDb().collection('guests').doc(inviteCode);
    const guestDoc = await guestRef.get();

    if (!guestDoc.exists) {
      return { valid: false, error: 'Invalid invite code.' };
    }

    const guestData = guestDoc.data() as Guest;
    if (guestData.codeStatus === 'used') {
      return { valid: false, error: 'This invite code has already been used.' };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: 'Failed to verify code. Please try again.' };
  }
}

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
    // Normal flow: We use the inviteCode as the document ID for the 'guests' collection
    const guestRef = getAdminDb().collection('guests').doc(inviteCode);

    await getAdminDb().runTransaction(async (transaction) => {
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
