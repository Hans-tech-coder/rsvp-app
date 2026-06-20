import { adminDb } from '@/lib/firebase/admin';
import { Guest } from '@/types';
import GuestListClient from './GuestListClient';

export const dynamic = 'force-dynamic';

export default async function GuestsPage() {
  const snapshot = await adminDb.collection('guests').orderBy('createdAt', 'desc').get();
  
  const guests = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      // Convert timestamps to string/Date for serialization to client component
      createdAt: data.createdAt?.toDate()?.toISOString() || null,
      submittedAt: data.submittedAt?.toDate()?.toISOString() || null,
    } as unknown as Guest;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Guest Management</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">Manage RSVPs, generate invite codes, and view attendee details.</p>
      </div>
      <GuestListClient initialGuests={guests} />
    </div>
  );
}
