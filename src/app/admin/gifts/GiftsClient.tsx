'use client';

import { useState } from 'react';
import { RegistryGift } from '@/types';
import { addRegistryGift, deleteRegistryGift, updateRegistryGift } from '@/app/actions/admin';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminModal } from '../components/AdminModal';

export default function GiftsClient({ initialGifts }: { initialGifts: RegistryGift[] }) {
  const gifts = initialGifts;
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info'}>({
    isOpen: false, title: '', message: '', variant: 'info'
  });
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info', action: () => Promise<void> | void, confirmText: string}>({
    isOpen: false, title: '', message: '', variant: 'info', action: () => {}, confirmText: 'Confirm'
  });

  // Form state
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [maxCount, setMaxCount] = useState(1);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setLink('');
    setMaxCount(1);
    setIsModalOpen(true);
  };

  const openEditModal = (gift: RegistryGift) => {
    setEditingId(gift.id || null);
    setName(gift.name);
    setLink(gift.link);
    setMaxCount(gift.maxCount);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = { name, link, maxCount };
    
    if (editingId) {
      const res = await updateRegistryGift(editingId, data);
      if (!res.success) {
        setAlertConfig({ isOpen: true, title: 'Error', message: res.error, variant: 'danger' });
      }
    } else {
      const res = await addRegistryGift(data);
      if (!res.success) {
        setAlertConfig({ isOpen: true, title: 'Error', message: res.error, variant: 'danger' });
      }
    }

    setLoading(false);
    setIsModalOpen(false);
    router.refresh();
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Gift',
      message: 'Are you sure you want to delete this gift?',
      variant: 'danger',
      confirmText: 'Delete',
      action: async () => {
        setIsProcessing(true);
        const res = await deleteRegistryGift(id);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] gap-4 transition-colors duration-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Registry Items</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage gifts and their availability limits</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-white shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Gift
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400 relative">
            <thead className="bg-gray-50/95 dark:bg-zinc-950/95 backdrop-blur-sm text-gray-700 dark:text-zinc-300 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4 w-16 text-center text-gray-500">NO.</th>
                <th className="px-5 py-4">Gift Name</th>
                <th className="px-5 py-4">Purchase Link</th>
                <th className="px-5 py-4">Claimed</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {gifts.map((gift, index) => (
                <tr key={gift.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 text-center font-medium text-gray-500 dark:text-zinc-500">
                    {index + 1}
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900 dark:text-zinc-100">
                    {gift.name}
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <a href={gift.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 line-clamp-1 underline underline-offset-2">
                      {gift.link}
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <span className={gift.currentCount >= gift.maxCount ? 'text-red-600 dark:text-red-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                      {gift.currentCount}
                    </span>
                    {' '} / {gift.maxCount}
                  </td>
                  <td className="px-5 py-4">
                    {gift.isFull ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400">
                        Fully Claimed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(gift)} className="p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(gift.id!)} className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {gifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500 dark:text-zinc-500">
                    No gifts added yet. Click "Add Gift" to start building your registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors duration-200">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{editingId ? 'Edit Gift' : 'Add New Gift'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 text-2xl leading-none transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Gift Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600" placeholder="E.g. Kitchen Stand Mixer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Purchase Link</label>
                <input required value={link} onChange={e => setLink(e.target.value)} type="url" placeholder="https://shopee.ph/..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Max Claims Allowed</label>
                <input type="number" min="1" required value={maxCount} onChange={e => setMaxCount(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all" />
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">How many guests can contribute to or claim this gift?</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-white flex items-center shadow-md disabled:opacity-70 transition-all">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Gift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modals */}
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
