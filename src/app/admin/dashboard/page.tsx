import { adminDb } from '@/lib/firebase/admin';
import { Guest, RegistryGift } from '@/types';
import { Users, UserCheck, UserX, Gift, CheckCircle2 } from 'lucide-react';

// Force dynamic since we want fresh data on each load
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch Guests Data
  const guestsSnapshot = await adminDb.collection('guests').get();
  const guests = guestsSnapshot.docs.map(doc => doc.data() as Guest);
  
  const totalCodes = guests.length;
  const usedCodes = guests.filter(g => g.codeStatus === 'used');
  const unusedCodes = totalCodes - usedCodes.length;
  const attendingCount = usedCodes.filter(g => g.willAttend === 'Yes').length;
  const notAttendingCount = usedCodes.filter(g => g.willAttend === 'No').length;

  // Fetch Registry Data
  const giftsSnapshot = await adminDb.collection('registryGifts').get();
  const gifts = giftsSnapshot.docs.map(doc => doc.data() as RegistryGift);
  
  const totalGifts = gifts.length;
  const fullyClaimedGifts = gifts.filter(g => g.isFull).length;
  const availableGifts = totalGifts - fullyClaimedGifts;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">High-level stats for RSVPs and your registry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Invites Sent" value={totalCodes} icon={Users} />
        <StatCard title="Attending (Yes)" value={attendingCount} icon={UserCheck} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-500/10" />
        <StatCard title="Not Attending (No)" value={notAttendingCount} icon={UserX} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-500/10" />
        <StatCard title="Pending / Unused" value={unusedCodes} icon={Users} color="text-gray-500 dark:text-zinc-400" bg="bg-gray-50 dark:bg-zinc-800/50" />
      </div>

      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-5">Registry Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard title="Total Registry Items" value={totalGifts} icon={Gift} />
          <StatCard title="Fully Claimed" value={fullyClaimedGifts} icon={CheckCircle2} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-500/10" />
          <StatCard title="Still Available" value={availableGifts} icon={Gift} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = 'text-gray-900 dark:text-zinc-100', bg = 'bg-gray-50 dark:bg-zinc-800' }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex items-center justify-between transition-colors duration-200">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
