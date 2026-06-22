import { getAdminDb } from '@/lib/firebase/admin';
import { Guest } from '@/types';
import GuestListClient from './GuestListClient';

export const dynamic = 'force-dynamic';

export default async function GuestsPage() {
  let guests: Guest[] = [];
  let errorMsg = null;

  try {
    const snapshot = await getAdminDb().collection('guests').orderBy('createdAt', 'desc').get();
    
    guests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        // Convert timestamps to string/Date for serialization to client component
        createdAt: data.createdAt?.toDate()?.toISOString() || null,
        submittedAt: data.submittedAt?.toDate()?.toISOString() || null,
      } as unknown as Guest;
    }).filter(guest => guest.codeStatus === 'used');
  } catch (err: any) {
    console.error('Guests Error:', err);
    errorMsg = err.message || 'An error occurred while fetching guests.';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Guest Management</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">Manage RSVPs, generate invite codes, and view attendee details.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-red-600 dark:text-red-300 font-mono text-sm break-all">{errorMsg}</p>
        </div>
      )}

      {!errorMsg && <GuestListClient initialGuests={guests} />}
    </div>
  );
}
