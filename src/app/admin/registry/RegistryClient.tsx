'use client';

import { useState } from 'react';
import { RegistryGift } from '@/types';
import { addRegistryGift, deleteRegistryGift, updateRegistryGift } from '@/app/actions/admin';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminModal } from '../components/AdminModal';

export default function RegistryClient({ initialGifts }: { initialGifts: RegistryGift[] }) {
  const [gifts] = useState<RegistryGift[]>(initialGifts);
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
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [maxClaims, setMaxClaims] = useState(1);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setMaxClaims(1);
    setIsModalOpen(true);
  };

  const openEditModal = (gift: RegistryGift) => {
    setEditingId(gift.id || null);
    setName(gift.name);
    setDescription(gift.description);
    setImageUrl(gift.imageUrl);
    setMaxClaims(gift.maxClaims);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = { name, description, imageUrl, maxClaims };
    
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gifts.map(gift => (
          <div key={gift.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] overflow-hidden flex flex-col transition-colors duration-200 group">
            <div className="h-48 bg-gray-100 dark:bg-zinc-800 relative overflow-hidden">
              {gift.imageUrl ? (
                <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-zinc-500">No Image</div>
              )}
              {gift.isFull && (
                <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    Fully Claimed
                  </span>
                </div>
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100 mb-1.5">{gift.name}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-5 flex-1 leading-relaxed">{gift.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                  <span className={gift.claimCount >= gift.maxClaims ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    {gift.claimCount}
                  </span>
                  {' '} / {gift.maxClaims} claimed
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(gift)} className="p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(gift.id!)} className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {gifts.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            No gifts added yet. Click "Add Gift" to start building your registry.
          </div>
        )}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600" placeholder="A brief description of this gift..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Image URL</label>
                <input required value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Max Claims Allowed</label>
                <input type="number" min="1" required value={maxClaims} onChange={e => setMaxClaims(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all" />
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
