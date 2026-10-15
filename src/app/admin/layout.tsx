import { getAdmin, getCurrentEventId, getEventAccess } from '@/lib/requireAdmin';
import { listEventChoices, type EventChoice } from '@/lib/platformEvents';
import type { MyEventAccess } from './eventAccess';
import { AdminShell } from './AdminShell';

// Reads, on the server, which event the admin pages show (the event switcher's
// `adminEvent` cookie, src/lib/requireAdmin.ts), the role in it, and the
// account's events, then renders the sidebar around the page (AdminShell).
// Nothing here protects a page: each page and action checks the role itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let access: MyEventAccess | null = null;
  let events: EventChoice[] = [];

  const admin = await getAdmin();
  if (admin) {
    try {
      const eventId = await getCurrentEventId();
      const [role, choices] = await Promise.all([eventId ? getEventAccess(eventId) : null, listEventChoices(admin)]);
      if (eventId && role) access = { eventId, role: role.role, clientDesign: role.clientDesign, email: role.email };
      events = choices;
    } catch (error) {
      // The page below still loads (or shows its own error); only the sidebar loses the event.
      console.error('Admin layout: event read failed:', error);
    }
  }

  return (
    <AdminShell access={access} events={events}>
      {children}
    </AdminShell>
  );
}
