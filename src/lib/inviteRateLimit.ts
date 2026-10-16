import { createHash } from 'node:crypto';
import { getAdminDb } from './firebase/admin';
import { paths } from './eventPaths';

// Server only. Slows down guessing of invite codes (F13): a visitor (by IP,
// across all events) gets MAX_FAILURES wrong codes per WINDOW_MS, then
// verifyInviteCode and submitRsvp answer `tooMany` until the window ends.
// Only wrong codes count, so a guest who mistypes once is never in the way.
// `rateLimits/{sha256(ip)}` = { failures, windowStart (ms), expiresAt };
// the IP itself is not stored. expiresAt is there for a Firestore TTL policy.

export const MAX_FAILURES = 10;
export const WINDOW_MS = 15 * 60 * 1000;

export type Attempts = { failures: number; windowStart: number };

/** True when this visitor may not try another code now. */
export function isBlocked(state: Attempts | null, now: number): boolean {
  return !!state && now - state.windowStart < WINDOW_MS && state.failures >= MAX_FAILURES;
}

/** The count after one more wrong code: a new window once the old one is over. */
export function afterFailure(state: Attempts | null, now: number): Attempts {
  if (!state || now - state.windowStart >= WINDOW_MS) return { failures: 1, windowStart: now };
  return { failures: state.failures + 1, windowStart: state.windowStart };
}

function readAttempts(data: FirebaseFirestore.DocumentData | undefined): Attempts | null {
  return data && typeof data.failures === 'number' && typeof data.windowStart === 'number'
    ? { failures: data.failures, windowStart: data.windowStart }
    : null;
}

/** The visitor's IP as Vercel passes it ('unknown' locally without one). */
export function visitorIp(h: Headers): string {
  return h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

const docFor = (ip: string) => getAdminDb().doc(paths.rateLimit(createHash('sha256').update(ip).digest('hex')));

export async function isInviteGuessBlocked(ip: string): Promise<boolean> {
  return isBlocked(readAttempts((await docFor(ip).get()).data()), Date.now());
}

export async function recordWrongInviteCode(ip: string): Promise<void> {
  const ref = docFor(ip);
  await getAdminDb().runTransaction(async (tx) => {
    const now = Date.now();
    const next = afterFailure(readAttempts((await tx.get(ref)).data()), now);
    tx.set(ref, { ...next, expiresAt: new Date(next.windowStart + WINDOW_MS) });
  });
}
