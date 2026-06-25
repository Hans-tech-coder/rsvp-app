import { getAdminDb } from '@/lib/firebase/admin';
import InviteListClient from './InviteListClient';
import { Guest } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InvitesPage() {
  const snapshot = await getAdminDb()
    .collection('guests')
    // Fallback if missing createdAt
    .get();

  const invites = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      // Convert timestamps to string/Date for serialization to client component
      createdAt: data.createdAt?.toDate()?.toISOString() || null,
      submittedAt: data.submittedAt?.toDate()?.toISOString() || null,
    } as unknown as Guest;
  });
  
  // Sort by createdAt descending locally since some documents might lack createdAt
  invites.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Invite Codes</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">Manage and generate invite codes for your guests.</p>
      </div>
      <InviteListClient initialInvites={invites} />
    </div>
  );
}
