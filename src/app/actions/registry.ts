'use server';

import { getAdminDb } from '@/lib/firebase/admin';
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
    const giftRef = getAdminDb().collection('registryGifts').doc(giftId);
    // Create a new reference for the selection
    const selectionRef = getAdminDb().collection('giftSelections').doc();

    await getAdminDb().runTransaction(async (transaction) => {
      const giftDoc = await transaction.get(giftRef);

      if (!giftDoc.exists) {
        throw new Error('Gift not found');
      }

      const giftData = giftDoc.data() as RegistryGift;

      if (giftData.isFull || giftData.currentCount >= giftData.maxCount) {
        throw new Error('This gift has already been fully claimed.');
      }

      const newClaimCount = giftData.currentCount + 1;
      const isNowFull = newClaimCount >= giftData.maxCount;

      // Update the gift document atomically
      transaction.update(giftRef, {
        currentCount: newClaimCount,
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

export async function getRegistryGifts() {
  try {
    const snapshot = await getAdminDb().collection('registryGifts').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    }) as (RegistryGift & { id: string })[];
  } catch (error) {
    console.error('Failed to fetch registry gifts:', error);
    return [];
  }
}
