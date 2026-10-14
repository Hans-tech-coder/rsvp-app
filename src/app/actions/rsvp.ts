'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Guest } from '@/types';
import weddingContent from '@/data/wedding-content.json';
import { after } from 'next/server';
import { headers } from 'next/headers';
import { sendRsvpConfirmation } from '@/lib/email/sendRsvpConfirmation';

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

const ISO_COUNTRY = /^[A-Z]{2}$/;
const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|::ffff:127\.|f[cd]|fe80)/i;

/** Visitor's country (ISO code) from their IP, used to preselect the phone
 *  country code. Vercel's geo header first; without it (local dev or another
 *  host) the IP is looked up at api.country.is. Null when unknown. */
export async function getVisitorCountry(): Promise<string | null> {
  const h = await headers();
  const fromVercel = h.get('x-vercel-ip-country');
  if (fromVercel && ISO_COUNTRY.test(fromVercel)) return fromVercel;

  const ip = h.get('x-forwarded-for')?.split(',')[0].trim() ?? '';
  const isPublic = ip !== '' && !PRIVATE_IP.test(ip);
  // A loopback/private IP in dev means the guest is this machine: look up its own public IP.
  if (!isPublic && process.env.NODE_ENV === 'production') return null;

  try {
    const res = await fetch(`https://api.country.is/${isPublic ? encodeURIComponent(ip) : ''}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const { country } = (await res.json()) as { country?: string };
    return country && ISO_COUNTRY.test(country) ? country : null;
  } catch {
    return null;
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

    // Confirmation email runs after the response; a failed send never fails the RSVP.
    after(async () => {
      try {
        await sendRsvpConfirmation(formData);
      } catch (error) {
        console.error('RSVP confirmation email failed:', error);
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit RSVP' };
  }
}
