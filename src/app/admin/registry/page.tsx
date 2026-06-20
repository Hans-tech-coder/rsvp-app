import { adminDb } from '@/lib/firebase/admin';
import { RegistryGift, GiftSelection } from '@/types';
import RegistryClient from './RegistryClient';
import { Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RegistryPage() {
  // Fetch Registry Gifts
  const giftsSnapshot = await adminDb.collection('registryGifts').orderBy('createdAt', 'desc').get();
  const gifts = giftsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate()?.toISOString() || null,
    } as unknown as RegistryGift;
  });

  // Fetch Selections
  const selectionsSnapshot = await adminDb.collection('giftSelections').orderBy('selectedAt', 'desc').get();
  const selections = selectionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      selectedAt: data.selectedAt?.toDate()?.toISOString() || null,
    } as unknown as GiftSelection;
  });

  return (
    <div className="space-y-12">
      <RegistryClient initialGifts={gifts} />

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] overflow-hidden transition-colors duration-200">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Gift Selections</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Track who claimed what</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
            <thead className="bg-gray-50 dark:bg-zinc-950/50 text-gray-700 dark:text-zinc-300 uppercase text-xs font-semibold">
              <tr>
                <th className="px-5 py-4">Gift Selected</th>
                <th className="px-5 py-4">Guest Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Message</th>
                <th className="px-5 py-4">Selected On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {selections.map((selection) => (
                <tr key={selection.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-zinc-100">{selection.giftName}</td>
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-zinc-100">{selection.fullName}</td>
                  <td className="px-5 py-4">{selection.email}</td>
                  <td className="px-5 py-4 max-w-[200px] truncate" title={selection.message}>{selection.message || '-'}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {selection.selectedAt ? new Date(selection.selectedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {selections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500 dark:text-zinc-500">
                    No gifts have been claimed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
