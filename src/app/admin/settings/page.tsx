import { getAdminDb } from '@/lib/firebase/admin';
import { requireCurrentEventPage } from '@/lib/requireAdmin';
import { paths } from '@/lib/eventPaths';
import { readEmailSettings } from '@/lib/email/emailSettings';
import { senderAddress } from '@/lib/email/sender';
import { getEventStorage, type EventStorage } from '@/lib/blob/eventStorage';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

// The event's settings (F13): email sender name and reply-to, storage used
// against the cap, and for platform owners the clean-up of unused files.
// Organizers and owners only.
export default async function SettingsPage() {
  const me = await requireCurrentEventPage('organizer');
  const { eventId } = me;
  const db = getAdminDb();

  const [emailDoc, globalDoc, storage] = await Promise.all([
    db.doc(paths.setting(eventId, 'email')).get(),
    db.doc(paths.content(eventId, 'globalSettings')).get(),
    getEventStorage(eventId).catch((error): EventStorage | null => {
      console.error('Settings: storage usage failed:', error);
      return null;
    }),
  ]);
  const eventName = String(globalDoc.get('coupleNameFormat') ?? '') || eventId;

  return (
    <SettingsClient
      eventId={eventId}
      eventName={eventName}
      email={readEmailSettings(emailDoc.data())}
      senderAddress={senderAddress()}
      storage={storage}
      isOwner={me.isOwner}
    />
  );
}
