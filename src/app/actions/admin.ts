'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * Generate unique alphanumeric invite codes.
 * We use crypto.randomBytes to avoid external dependencies like nanoid.
 */
function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function generateInviteCodes(count: number) {
  try {
    const batch = adminDb.batch();
    const generatedCodes: string[] = [];
    const guestsRef = adminDb.collection('guests');

    for (let i = 0; i < count; i++) {
      const code = generateCode(6);
      generatedCodes.push(code);
      
      const docRef = guestsRef.doc(code);
      batch.set(docRef, {
        inviteCode: code,
        codeStatus: 'unused',
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true, count, codes: generatedCodes };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate codes' };
  }
}

export async function deleteInviteCode(code: string) {
  try {
    await adminDb.collection('guests').doc(code).delete();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete code' };
  }
}

export async function addRegistryGift(data: { name: string; description: string; imageUrl: string; maxClaims: number }) {
  try {
    const giftRef = adminDb.collection('registryGifts').doc();
    await giftRef.set({
      ...data,
      claimCount: 0,
      isFull: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id: giftRef.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add gift' };
  }
}

export async function updateRegistryGift(giftId: string, data: Partial<{ name: string; description: string; imageUrl: string; maxClaims: number }>) {
  try {
    const giftRef = adminDb.collection('registryGifts').doc(giftId);
    
    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(giftRef);
      if (!doc.exists) throw new Error('Gift not found');
      
      const currentData = doc.data() as any;
      const updates: any = { ...data };
      
      // If maxClaims is updated, we might need to re-evaluate isFull
      if (data.maxClaims !== undefined) {
        updates.isFull = currentData.claimCount >= data.maxClaims;
      }

      transaction.update(giftRef, updates);
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update gift' };
  }
}

export async function deleteRegistryGift(giftId: string) {
  try {
    await adminDb.collection('registryGifts').doc(giftId).delete();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete gift' };
  }
}
