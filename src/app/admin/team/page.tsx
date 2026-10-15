import { FieldPath, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireCurrentEventPage } from '@/lib/requireAdmin';
import { paths } from '@/lib/eventPaths';
import { readActivity, type ActivityEntry } from '@/lib/auditLog';
import { EVENT_ROLES, isEventRole, type EventRole } from '@/lib/permissions';
import { TeamClient, type TeamInvite, type TeamMember } from './TeamClient';

export const dynamic = 'force-dynamic';

const toIso = (value: unknown) => (value instanceof Timestamp ? value.toDate().toISOString() : null);

// The event's team (members, pending invites), the client design switch and
// the activity log. Organizers and owners only.
export default async function TeamPage() {
  const me = await requireCurrentEventPage('organizer');
  const { eventId } = me;

  let members: TeamMember[] = [];
  let invites: TeamInvite[] = [];
  let activity: ActivityEntry[] = [];
  let errorMsg: string | null = null;

  try {
    const db = getAdminDb();
    const [memberSnap, inviteSnap, log] = await Promise.all([
      db.collection(paths.members(eventId)).get(),
      db.collection(paths.adminAllowlist()).where(new FieldPath('events', eventId), 'in', [...EVENT_ROLES]).get(),
      readActivity(eventId),
    ]);
    members = memberSnap.docs
      .map((doc) => ({
        uid: doc.id,
        email: String(doc.get('email') ?? ''),
        role: (isEventRole(doc.get('role')) ? doc.get('role') : 'client') as EventRole,
        addedAt: toIso(doc.get('addedAt')),
      }))
      .sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role === 'organizer' ? -1 : 1));
    invites = inviteSnap.docs
      .map((doc) => ({ email: doc.id, role: doc.get(new FieldPath('events', eventId)) as EventRole, addedAt: toIso(doc.get('addedAt')) }))
      .sort((a, b) => a.email.localeCompare(b.email));
    activity = log;
  } catch (err) {
    console.error('Team Error:', err);
    errorMsg = (err as Error).message || 'An error occurred while loading the team.';
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-red-600 dark:text-red-300 font-mono text-sm break-all">{errorMsg}</p>
        </div>
      )}
      <TeamClient
        eventId={eventId}
        myUid={me.uid}
        isOwner={me.isOwner}
        members={members}
        invites={invites}
        clientDesign={me.clientDesign}
        activity={activity}
      />
    </div>
  );
}
