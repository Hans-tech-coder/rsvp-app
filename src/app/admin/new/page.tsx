import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/requireAdmin';
import { canCreateEvents } from '@/lib/platformEvents';
import { NewEventWizard } from './NewEventWizard';

export const dynamic = 'force-dynamic';

// New Event wizard (F12): template -> names, date, venue -> palette, then the
// new event opens in the visual builder. Owners and organizers only; the
// event is created by createEvent (src/app/actions/events.ts) from the
// templates in src/lib/templates.
export default async function NewEventPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/api/logout');
  if (!(await canCreateEvents(admin))) redirect('/admin');

  return <NewEventWizard />;
}
