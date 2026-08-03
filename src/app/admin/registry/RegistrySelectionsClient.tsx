'use client';

import { useState } from 'react';
import { GiftSelection } from '@/types';
import { TablePagination } from '../components/TablePagination';
import { AdminModal } from '../components/AdminModal';
import { deleteGiftSelection } from '@/app/actions/admin';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RegistrySelectionsClient({ initialSelections }: { initialSelections: GiftSelection[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info'}>({
    isOpen: false, title: '', message: '', variant: 'info'
  });
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info', action: () => Promise<void> | void, confirmText: string}>({
    isOpen: false, title: '', message: '', variant: 'info', action: () => {}, confirmText: 'Confirm'
  });

  const totalPages = Math.ceil(initialSelections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSelections = initialSelections.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = (selection: GiftSelection) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Selection',
      message: `Are you sure you want to delete this selection from ${selection.fullName}? This will automatically reset the gift's claim count.`,
      variant: 'danger',
      confirmText: 'Delete',
      action: async () => {
        setIsProcessing(true);
        const res = await deleteGiftSelection(selection.id!, selection.giftId);
        setIsProcessing(false);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        if (res.success) {
          router.refresh();
        } else {
          setAlertConfig({ isOpen: true, title: 'Error', message: res.error, variant: 'danger' });
        }
      }
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] overflow-hidden transition-colors duration-200">
      <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Gift Selections</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Track who claimed what</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400 relative">
          <thead className="bg-gray-50/95 dark:bg-zinc-950/95 backdrop-blur-sm text-gray-700 dark:text-zinc-300 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-5 py-4 w-16 text-center text-gray-500">NO.</th>
              <th className="px-5 py-4">Gift Selected</th>
              <th className="px-5 py-4">Guest Name</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Message</th>
              <th className="px-5 py-4">Selected On</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {paginatedSelections.map((selection, index) => (
              <tr key={selection.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-4 text-center font-medium text-gray-500 dark:text-zinc-500">{startIndex + index + 1}</td>
                <td className="px-5 py-4 font-medium text-gray-900 dark:text-zinc-100">{selection.giftName}</td>
                <td className="px-5 py-4 font-medium text-gray-900 dark:text-zinc-100">{selection.fullName}</td>
                <td className="px-5 py-4">{selection.email}</td>
                <td className="px-5 py-4 max-w-[200px] truncate" title={selection.message}>{selection.message || '-'}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {selection.selectedAt ? new Date(selection.selectedAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleDelete(selection)} className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete Selection">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedSelections.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-500 dark:text-zinc-500">
                  No gifts have been claimed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        setItemsPerPage={setItemsPerPage}
      />

      <AdminModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type="alert"
        variant={alertConfig.variant}
      />

      <AdminModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type="confirm"
        variant={confirmConfig.variant}
        isLoading={isProcessing}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
}
