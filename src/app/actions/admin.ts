'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { requireEventRole } from '@/lib/requireAdmin';
import { logActivity } from '@/lib/auditLog';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { paths } from '@/lib/eventPaths';
import { updateTag } from 'next/cache';
import { registryGiftsTag } from '@/lib/registryGifts';
import { getSiteContent } from '@/lib/siteContentServer';
import { getEventUrl } from '@/lib/siteUrl';

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

// Firestore's ALREADY_EXISTS: create() hit a code the event already has.
const isAlreadyExists = (error: unknown) => {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 6 || code === 'already-exists';
};
const CODE_ATTEMPTS = 3;

const newInvite = (code: string) => ({
  inviteCode: code,
  codeStatus: 'unused',
  isCopied: false,
  createdAt: FieldValue.serverTimestamp(),
});

export async function generateInviteCodes(eventId: string, count: number) {
  try {
    const me = await requireEventRole(eventId);
    const guestsRef = getAdminDb().collection(paths.guests(eventId));

    // Codes are unique per event: create() fails the whole batch if one already
    // exists, and then the batch is tried again with fresh codes.
    for (let attempt = 1; ; attempt++) {
      const codes = new Set<string>();
      while (codes.size < count) codes.add(generateCode(6));

      const batch = getAdminDb().batch();
      for (const code of codes) batch.create(guestsRef.doc(code), newInvite(code));

      try {
        await batch.commit();
        await logActivity(eventId, me, `Generated ${count} invite code${count === 1 ? '' : 's'}`);
        return { success: true, count, codes: [...codes] };
      } catch (error) {
        if (!isAlreadyExists(error) || attempt >= CODE_ATTEMPTS) throw error;
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate codes' };
  }
}

export async function deleteInviteCode(eventId: string, code: string) {
  try {
    const me = await requireEventRole(eventId);
    await getAdminDb().doc(paths.guest(eventId, code)).delete();
    await logActivity(eventId, me, 'Deleted invite code', code);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete code' };
  }
}

export async function regenerateInviteCode(eventId: string, oldCode: string) {
  try {
    const me = await requireEventRole(eventId);
    const oldRef = getAdminDb().doc(paths.guest(eventId, oldCode));

    for (let attempt = 1; ; attempt++) {
      const newCode = generateCode(6);
      const batch = getAdminDb().batch();
      // Delete the old code (this will also remove any attached RSVP data)
      batch.delete(oldRef);
      // Create the new code; fails (and retries) if the event already has it
      batch.create(getAdminDb().doc(paths.guest(eventId, newCode)), newInvite(newCode));

      try {
        await batch.commit();
        await logActivity(eventId, me, 'Replaced invite code', `${oldCode} → ${newCode}`);
        return { success: true, newCode };
      } catch (error) {
        if (!isAlreadyExists(error) || attempt >= CODE_ATTEMPTS) throw error;
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to regenerate code' };
  }
}

export async function addRegistryGift(eventId: string, data: { name: string; link: string; maxCount: number }) {
  try {
    const me = await requireEventRole(eventId);
    const giftRef = getAdminDb().collection(paths.registryGifts(eventId)).doc();
    await giftRef.set({
      ...data,
      currentCount: 0,
      isFull: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    updateTag(registryGiftsTag(eventId));
    await logActivity(eventId, me, 'Added gift', data.name);
    return { success: true, id: giftRef.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add gift' };
  }
}

export async function updateRegistryGift(eventId: string, giftId: string, data: Partial<{ name: string; link: string; maxCount: number }>) {
  try {
    const me = await requireEventRole(eventId);
    const giftRef = getAdminDb().doc(paths.registryGift(eventId, giftId));
    
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

    updateTag(registryGiftsTag(eventId));
    await logActivity(eventId, me, 'Edited gift', data.name ?? giftId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update gift' };
  }
}

export async function deleteRegistryGift(eventId: string, giftId: string) {
  try {
    const me = await requireEventRole(eventId);
    await getAdminDb().doc(paths.registryGift(eventId, giftId)).delete();
    updateTag(registryGiftsTag(eventId));
    await logActivity(eventId, me, 'Deleted gift', giftId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete gift' };
  }
}

function defaultInviteTemplate(siteUrl: string, couple: string) {
  return `You're Invited!

Dear Guest,

We are delighted to invite you to celebrate our wedding with us! Your presence on our special day would mean the world to us.

To view all the details of our wedding and confirm your attendance, please visit our wedding website:

🌐 Wedding Website: ${siteUrl}

To access the RSVP page, use your One-Time RSVP Code below:

🔑 RSVP Code: {{CODE}}

This code is unique to your invitation and can only be used once.

On our website, you'll find everything you need to know about our wedding, including the ceremony and reception details, venue, schedule, dress code, and other important information.

Before submitting your RSVP, please take a moment to read the FAQs section for important reminders and helpful information.

We look forward to celebrating this unforgettable day with you!

With love,
${couple}`;
}

/** Used until the admin saves their own; links to this event's site. */
async function getDefaultInviteTemplate(eventId: string) {
  const { global } = await getSiteContent(eventId);
  return defaultInviteTemplate(getEventUrl(eventId), global.coupleNameFormat);
}

export async function getInviteMessageTemplate(eventId: string) {
  try {
    await requireEventRole(eventId);
    const doc = await getAdminDb().doc(paths.setting(eventId, 'inviteTemplate')).get();
    return doc.data()?.template || await getDefaultInviteTemplate(eventId);
  } catch (error) {
    console.error('Failed to fetch invite template:', error);
    return defaultInviteTemplate(getEventUrl(eventId), '');
  }
}

export async function updateInviteMessageTemplate(eventId: string, template: string) {
  try {
    const me = await requireEventRole(eventId);
    await getAdminDb().doc(paths.setting(eventId, 'inviteTemplate')).set({ template });
    await logActivity(eventId, me, 'Edited the invite message');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update template' };
  }
}

export async function resetRegistryGift(eventId: string, giftId: string) {
  try {
    const me = await requireEventRole(eventId);
    const batch = getAdminDb().batch();

    // 1. Reset the gift
    const giftRef = getAdminDb().doc(paths.registryGift(eventId, giftId));
    batch.update(giftRef, {
      currentCount: 0,
      isFull: false
    });

    // 2. Delete all selections for this gift
    const selectionsSnapshot = await getAdminDb()
      .collection(paths.giftSelections(eventId))
      .where('giftId', '==', giftId)
      .get();
      
    selectionsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    updateTag(registryGiftsTag(eventId));
    await logActivity(eventId, me, 'Reset gift claims', giftId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reset gift' };
  }
}

export async function deleteGiftSelection(eventId: string, selectionId: string, giftId: string) {
  try {
    const me = await requireEventRole(eventId);
    const selectionRef = getAdminDb().doc(paths.giftSelection(eventId, selectionId));
    const giftRef = getAdminDb().doc(paths.registryGift(eventId, giftId));

    await getAdminDb().runTransaction(async (transaction) => {
      const selectionDoc = await transaction.get(selectionRef);
      if (!selectionDoc.exists) throw new Error('Selection not found');

      const giftDoc = await transaction.get(giftRef);
      if (giftDoc.exists) {
        const giftData = giftDoc.data() as any;
        const newCount = Math.max(0, (giftData.currentCount || 0) - 1);
        transaction.update(giftRef, {
          currentCount: newCount,
          isFull: newCount >= giftData.maxCount
        });
      }

      transaction.delete(selectionRef);
    });

    updateTag(registryGiftsTag(eventId));
    await logActivity(eventId, me, 'Deleted gift claim', giftId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete gift selection' };
  }
}

export async function toggleInviteCopiedStatus(eventId: string, code: string, isCopied: boolean) {
  try {
    await requireEventRole(eventId);
    const guestsRef = getAdminDb().doc(paths.guest(eventId, code));
    await guestsRef.update({
      isCopied,
      updatedAt: FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update copied status' };
  }
}

