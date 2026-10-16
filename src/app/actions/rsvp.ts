'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Guest } from '@/types';
import weddingContent from '@/data/wedding-content.json';
import { after } from 'next/server';
import { headers } from 'next/headers';
import { sendRsvpConfirmation } from '@/lib/email/sendRsvpConfirmation';
import { paths } from '@/lib/eventPaths';
import { isInviteGuessBlocked, recordWrongInviteCode, visitorIp } from '@/lib/inviteRateLimit';

const TOO_MANY = 'Too many wrong codes. Please wait a few minutes and try again.';

// A failed count must not turn a wrong code into "failed to verify".
const countWrongCode = (ip: string) => recordWrongInviteCode(ip).catch((error) => console.error('Invite rate limit write failed:', error));

export async function verifyInviteCode(eventId: string, inviteCode: string) {
  try {
    const ip = visitorIp(await headers());
    if (await isInviteGuessBlocked(ip)) {
      return { valid: false, code: 'tooMany' as const, error: TOO_MANY };
    }

    const guestRef = getAdminDb().doc(paths.guest(eventId, inviteCode));
    const guestDoc = await guestRef.get();

    if (!guestDoc.exists) {
      await countWrongCode(ip);
      return { valid: false, code: 'invalid' as const, error: 'Invalid invite code.' };
    }

    const guestData = guestDoc.data() as Guest;
    if (guestData.codeStatus === 'used') {
      return { valid: false, code: 'used' as const, error: 'This invite code has already been used.' };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, code: 'failed' as const, error: 'Failed to verify code. Please try again.' };
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
  eventId: string,
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
    // The same limit as verifyInviteCode: a direct call must not be a way around it.
    const ip = visitorIp(await headers());
    if (await isInviteGuessBlocked(ip)) {
      return { success: false, code: 'tooMany' as const, error: TOO_MANY };
    }

    // The invite code is the guest's document ID within the event
    const guestRef = getAdminDb().doc(paths.guest(eventId, inviteCode));

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
        await sendRsvpConfirmation(eventId, formData);
      } catch (error) {
        console.error('RSVP confirmation email failed:', error);
      }
    });

    return { success: true };
  } catch (error: any) {
    // The guest page shows its own (editable) wording for each code.
    const code: 'invalid' | 'used' | 'failed' = error.message === 'Invalid invite code' ? 'invalid'
      : error.message === 'This invite code has already been used.' ? 'used'
      : 'failed';
    if (code === 'invalid') await countWrongCode(visitorIp(await headers()));
    return { success: false, code, error: error.message || 'Failed to submit RSVP' };
  }
}
