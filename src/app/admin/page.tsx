import { redirect } from 'next/navigation';
import { getAdmin, getCurrentEventId } from '@/lib/requireAdmin';
import { listEventSummaries, type EventSummary } from '@/lib/platformEvents';
import { hasRole } from '@/lib/permissions';
import { EventsClient } from './EventsClient';

export const dynamic = 'force-dynamic';

// All Events (F11): every event the account may open (all of them for an
// owner), with its date and RSVP counts, and the platform actions (new,
// duplicate, change link, archive, delete) in src/app/actions/events.ts.
export default async function EventsPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/api/logout');

  let events: EventSummary[] = [];
  let errorMsg: string | null = null;
  try {
    events = await listEventSummaries(admin);
  } catch (error) {
    console.error('Events list:', error);
    errorMsg = error instanceof Error ? error.message : 'Could not load the events.';
  }
  const currentId = await getCurrentEventId().catch(() => null);
  const canCreate = admin.isOwner || events.some((e) => hasRole(e.role, 'organizer'));

  return <EventsClient events={events} currentId={currentId} isOwner={admin.isOwner} canCreate={canCreate} errorMsg={errorMsg} />;
}
