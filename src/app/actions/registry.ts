'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { RegistryGift } from '@/types';

export async function claimGift(
  giftId: string,
  formData: {
    fullName: string;
    email: string;
    message?: string;
  }
) {
  try {
    const giftRef = adminDb.collection('registryGifts').doc(giftId);
    // Create a new reference for the selection
    const selectionRef = adminDb.collection('giftSelections').doc();

    await adminDb.runTransaction(async (transaction) => {
      const giftDoc = await transaction.get(giftRef);

      if (!giftDoc.exists) {
        throw new Error('Gift not found');
      }

      const giftData = giftDoc.data() as RegistryGift;

      if (giftData.isFull || giftData.claimCount >= giftData.maxClaims) {
        throw new Error('This gift has already been fully claimed.');
      }

      const newClaimCount = giftData.claimCount + 1;
      const isNowFull = newClaimCount >= giftData.maxClaims;

      // Update the gift document atomically
      transaction.update(giftRef, {
        claimCount: newClaimCount,
        isFull: isNowFull,
      });

      // Create the selection document
      transaction.set(selectionRef, {
        giftId: giftId,
        giftName: giftData.name, // Copy name for easy table display
        fullName: formData.fullName,
        email: formData.email,
        message: formData.message || '',
        selectedAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to claim gift' };
  }
}
