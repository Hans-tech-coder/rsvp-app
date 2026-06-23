'use server';

import { getAdminDb } from '@/lib/firebase/admin';
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
    const batch = getAdminDb().batch();
    const generatedCodes: string[] = [];
    const guestsRef = getAdminDb().collection('guests');

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
    await getAdminDb().collection('guests').doc(code).delete();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete code' };
  }
}

export async function regenerateInviteCode(oldCode: string) {
  try {
    const guestsRef = getAdminDb().collection('guests');
    const newCode = generateCode(6);
    
    const batch = getAdminDb().batch();
    // Delete the old code (this will also remove any attached RSVP data)
    batch.delete(guestsRef.doc(oldCode));
    
    // Create the new code
    batch.set(guestsRef.doc(newCode), {
      inviteCode: newCode,
      codeStatus: 'unused',
      createdAt: FieldValue.serverTimestamp(),
    });
    
    await batch.commit();
    return { success: true, newCode };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to regenerate code' };
  }
}

export async function addRegistryGift(data: { name: string; link: string; maxCount: number }) {
  try {
    const giftRef = getAdminDb().collection('registryGifts').doc();
    await giftRef.set({
      ...data,
      currentCount: 0,
      isFull: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id: giftRef.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add gift' };
  }
}

export async function updateRegistryGift(giftId: string, data: Partial<{ name: string; link: string; maxCount: number }>) {
  try {
    const giftRef = getAdminDb().collection('registryGifts').doc(giftId);
    
    await getAdminDb().runTransaction(async (transaction) => {
      const doc = await transaction.get(giftRef);
      if (!doc.exists) throw new Error('Gift not found');
      
      const currentData = doc.data() as any;
      const updates: any = { ...data };
      
      // If maxCount is updated, we might need to re-evaluate isFull
      if (data.maxCount !== undefined) {
        updates.isFull = currentData.currentCount >= data.maxCount;
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
    await getAdminDb().collection('registryGifts').doc(giftId).delete();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete gift' };
  }
}
