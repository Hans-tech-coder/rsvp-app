import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/requireAdmin';
import { canCreateEvents } from '@/lib/platformEvents';
import { getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';
import { EVENT_TYPES } from '@/lib/templates/catalog';
import { demoEventId } from '@/lib/templates/demos';
import { NewEventWizard } from './NewEventWizard';

export const dynamic = 'force-dynamic';

// New Event wizard (F12): template -> names, date, venue -> palette, then the
// new event opens in the visual builder. Owners and organizers only; the
// event is created by createEvent (src/app/actions/events.ts) from the
// templates in src/lib/templates. The live demo events (F14) are linked
// under the template cards.
export default async function NewEventPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/api/logout');
  if (!(await canCreateEvents(admin))) redirect('/admin');

  const db = getAdminDb();
  const docs = await db.getAll(...EVENT_TYPES.map((t) => db.doc(paths.event(demoEventId(t))))).catch(() => []);
  const demos = EVENT_TYPES.filter((_, i) => docs[i]?.get('demo') === true && docs[i]?.get('status') !== 'archived');

  return <NewEventWizard demos={demos} />;
}
