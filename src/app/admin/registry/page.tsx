import { getAdminDb } from '@/lib/firebase/admin';
import { GiftSelection } from '@/types';
import { RegistrySelectionsClient } from './RegistrySelectionsClient';

export const dynamic = 'force-dynamic';

export default async function RegistryPage() {
  let selections: GiftSelection[] = [];
  let errorMsg = null;

  try {
    // Fetch Selections
    const selectionsSnapshot = await getAdminDb().collection('giftSelections').orderBy('selectedAt', 'desc').get();
    selections = selectionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        selectedAt: data.selectedAt?.toDate()?.toISOString() || null,
      } as unknown as GiftSelection;
    });
  } catch (err: any) {
    console.error('Registry Error:', err);
    errorMsg = err.message || 'An error occurred while fetching registry data.';
  }

  return (
    <div className="space-y-12">
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-red-600 dark:text-red-300 font-mono text-sm break-all">{errorMsg}</p>
        </div>
      )}

      <RegistrySelectionsClient initialSelections={selections} />
    </div>
  );
}
