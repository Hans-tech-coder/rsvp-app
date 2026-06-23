import { getAdminDb } from '@/lib/firebase/admin';
import { RegistryGift } from '@/types';
import GiftsClient from './GiftsClient';

export const dynamic = 'force-dynamic';

export default async function GiftsPage() {
  let gifts: RegistryGift[] = [];
  let errorMsg = null;

  try {
    const giftsSnapshot = await getAdminDb().collection('registryGifts').orderBy('createdAt', 'desc').get();
    gifts = giftsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate()?.toISOString() || null,
      } as unknown as RegistryGift;
    });
  } catch (err: any) {
    console.error('Gifts Error:', err);
    errorMsg = err.message || 'An error occurred while fetching registry gifts.';
  }

  return (
    <div className="space-y-12">
      {errorMsg ? (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-red-600 dark:text-red-300 font-mono text-sm break-all">{errorMsg}</p>
        </div>
      ) : (
        <GiftsClient initialGifts={gifts} />
      )}
    </div>
  );
}
