'use server';

import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';
import { getEventAccess, requireEventRole } from '@/lib/requireAdmin';
import { logActivity } from '@/lib/auditLog';
import { ROLE_NAMES, isEventRole, type AccessRole, type EventRole } from '@/lib/permissions';

// An event's team (F10), for the Team page (src/app/admin/team/). Members
// live in `events/{eventId}/members/{uid}`; each account also lists its
// events in `admins/{uid}.eventIds` (sign-in, upload check). Someone who has
// never signed in waits as `adminAllowlist/{email}.events[eventId]` and is
// added on their first Google sign-in (createSessionCookie in auth.ts).
// Organizers and owners only, except getMyEventAccess. Platform owners
// (`role: 'super'`) are not members: they are made with scripts/add-admin.js.

const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function errorCode(error: unknown) {
  return (error as { code?: unknown } | null)?.code;
}

const normalizeEmail = (raw: string) => String(raw ?? '').trim().toLowerCase();

/** The signed-in account's role in the event, for the admin UI (sidebar, locks). UI only: every action checks again. */
export async function getMyEventAccess(eventId: string): Promise<{ role: AccessRole; clientDesign: boolean; email: string | null } | null> {
  const access = await getEventAccess(eventId);
  return access && { role: access.role, clientDesign: access.clientDesign, email: access.email };
}

export async function addMember(eventId: string, rawEmail: string, role: EventRole) {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    const email = normalizeEmail(rawEmail);
    if (!EMAIL_PATTERN.test(email)) return { success: false, error: 'Enter a valid email address.' };
    if (!isEventRole(role)) return { success: false, error: 'Pick a role.' };

    const db = getAdminDb();
    const account = await db.collection(paths.admins()).where('email', '==', email).limit(1).get();

    if (!account.empty) {
      // Has signed in before: add them now.
      const accountDoc = account.docs[0];
      if (accountDoc.get('role') === 'super') {
        return { success: false, error: 'That person is a platform owner and can already open every event.' };
      }
      const batch = db.batch();
      batch.create(db.doc(paths.member(eventId, accountDoc.id)), {
        email,
        role,
        addedAt: FieldValue.serverTimestamp(),
        addedBy: me.uid,
      });
      batch.update(accountDoc.ref, { eventIds: FieldValue.arrayUnion(eventId) });
      try {
        await batch.commit();
      } catch (error) {
        if (errorCode(error) === 6) return { success: false, error: 'That person is already in the team.' };
        throw error;
      }
    } else {
      // Not signed in yet: an invite that becomes a membership on their first sign-in.
      const ref = db.doc(paths.adminAllowlistEntry(email));
      const refused = await db.runTransaction(async (tx) => {
        const entry = await tx.get(ref);
        if (entry.get('role') === 'super') return 'That person is invited as a platform owner and will open every event.';
        if (entry.exists && entry.get(new FieldPath('events', eventId))) return 'That person is already invited.';
        tx.set(
          ref,
          {
            role: entry.exists ? entry.get('role') ?? 'admin' : 'admin',
            events: { [eventId]: role },
            addedBy: me.uid,
            ...(entry.exists ? {} : { addedAt: FieldValue.serverTimestamp() }),
          },
          { merge: true },
        );
        return null;
      });
      if (refused) return { success: false, error: refused };
    }

    await logActivity(eventId, me, 'Added to the team', `${email} as ${ROLE_NAMES[role]}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to add the member') };
  }
}

export async function changeMemberRole(eventId: string, uid: string, role: EventRole) {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    if (!isEventRole(role)) return { success: false, error: 'Pick a role.' };
    if (!uid || uid === me.uid) return { success: false, error: 'You cannot change your own role.' };

    const ref = getAdminDb().doc(paths.member(eventId, uid));
    const member = await ref.get();
    if (!member.exists) return { success: false, error: 'That member is no longer in the team.' };
    await ref.update({ role });

    await logActivity(eventId, me, 'Changed a role', `${member.get('email') ?? uid} to ${ROLE_NAMES[role]}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to change the role') };
  }
}

/**
 * Takes someone off the event. When it was their last event their account
 * goes too, and their sessions are revoked, so their next request is refused
 * (instead of the 5-day cookie staying valid). Other events keep working.
 */
export async function removeMember(eventId: string, uid: string) {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    if (!uid || uid === me.uid) return { success: false, error: 'You cannot remove yourself.' };

    const db = getAdminDb();
    const memberRef = db.doc(paths.member(eventId, uid));
    const accountRef = db.doc(paths.admin(uid));

    const result = await db.runTransaction(async (tx) => {
      const [member, account] = await tx.getAll(memberRef, accountRef);
      if (!member.exists) return null;
      tx.delete(memberRef);
      if (!account.exists) return { email: member.get('email') as string | undefined, lastEvent: false };

      const eventIds: unknown = account.get('eventIds');
      const remaining = Array.isArray(eventIds) ? eventIds.filter((id) => id !== eventId) : [];
      const lastEvent = remaining.length === 0 && account.get('role') !== 'super';
      if (lastEvent) tx.delete(accountRef);
      else tx.update(accountRef, { eventIds: FieldValue.arrayRemove(eventId) });
      return { email: member.get('email') as string | undefined, lastEvent };
    });
    if (!result) return { success: false, error: 'That member is no longer in the team.' };

    if (result.lastEvent) {
      try {
        await getAdminAuth().revokeRefreshTokens(uid);
      } catch (error) {
        if (errorCode(error) !== 'auth/user-not-found') throw error;
      }
    }
    await logActivity(eventId, me, 'Removed from the team', result.email ?? uid);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to remove the member') };
  }
}

/** Withdraws an invite to this event; an entry with no event left (and not an owner's) is deleted. */
export async function cancelInvite(eventId: string, rawEmail: string) {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    const email = normalizeEmail(rawEmail);
    const db = getAdminDb();
    const ref = db.doc(paths.adminAllowlistEntry(email));

    const found = await db.runTransaction(async (tx) => {
      const entry = await tx.get(ref);
      const events = entry.get('events');
      if (!entry.exists || !events || typeof events !== 'object' || !(eventId in events)) return false;
      const othersLeft = Object.keys(events).some((id) => id !== eventId);
      if (!othersLeft && entry.get('role') !== 'super') tx.delete(ref);
      else tx.update(ref, new FieldPath('events', eventId), FieldValue.delete());
      return true;
    });
    if (!found) return { success: false, error: 'That invite no longer exists.' };

    await logActivity(eventId, me, 'Cancelled an invite', email);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to cancel the invite') };
  }
}

/** Lets clients change the design (section order, colors & fonts, music) of this event, or not. */
export async function setClientDesign(eventId: string, allowed: boolean) {
  try {
    const me = await requireEventRole(eventId, 'organizer');
    await getAdminDb().doc(paths.setting(eventId, 'permissions')).set({ clientDesign: allowed === true }, { merge: true });
    await logActivity(eventId, me, allowed ? 'Let clients change the design' : 'Locked the design for clients');
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Failed to save the setting') };
  }
}
