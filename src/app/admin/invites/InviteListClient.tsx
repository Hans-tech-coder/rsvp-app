'use client';

import { useState } from 'react';
import { Guest } from '@/types';
import { generateInviteCodes, deleteInviteCode, regenerateInviteCode } from '@/app/actions/admin';
import { Loader2, Trash2, Copy, Check, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminModal } from '../components/AdminModal';

export default function InviteListClient({ initialInvites }: { initialInvites: Guest[] }) {
  const invites = initialInvites;
  const [codeCount, setCodeCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all');
  
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info'}>({
    isOpen: false, title: '', message: '', variant: 'info'
  });
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info', action: () => Promise<void> | void, confirmText: string}>({
    isOpen: false, title: '', message: '', variant: 'info', action: () => {}, confirmText: 'Confirm'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const router = useRouter();

  const handleGenerate = async () => {
    if (codeCount < 1 || codeCount > 100) {
      setAlertConfig({ isOpen: true, title: 'Invalid Input', message: 'Enter a valid number (1-100)', variant: 'warning' });
      return;
    }
    setGenerating(true);
    const res = await generateInviteCodes(codeCount);
    setGenerating(false);
    if (res.success) {
      setAlertConfig({ isOpen: true, title: 'Success', message: `Generated ${res.count} codes successfully!`, variant: 'success' });
      router.refresh();
    } else {
      setAlertConfig({ isOpen: true, title: 'Error', message: res.error, variant: 'danger' });
    }
  };

  const handleDelete = (code: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Invite Code',
      message: 'Are you sure you want to delete this unused code?',
      variant: 'danger',
      confirmText: 'Delete',
      action: async () => {
        setIsProcessing(true);
        const res = await deleteInviteCode(code);
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

  const handleRegenerate = (oldCode: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Regenerate Code',
      message: 'Are you sure you want to regenerate this code? This will delete the current code and create a new unused one.',
      variant: 'warning',
      confirmText: 'Regenerate',
      action: async () => {
        setIsProcessing(true);
        const res = await regenerateInviteCode(oldCode);
        setIsProcessing(false);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        if (res.success) {
          setAlertConfig({ isOpen: true, title: 'Success', message: `Code regenerated successfully. New code: ${res.newCode}`, variant: 'success' });
          router.refresh();
        } else {
          setAlertConfig({ isOpen: true, title: 'Error', message: res.error, variant: 'danger' });
        }
      }
    });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter logic
  const filteredInvites = invites.filter(invite => {
    if (statusFilter === 'all') return true;
    return invite.codeStatus === statusFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInvites.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInvites = filteredInvites.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Generate Invite Codes</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Create new unique codes for your guests</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="100"
            value={codeCount}
            onChange={(e) => setCodeCount(parseInt(e.target.value))}
            className="w-24 px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-white shadow-md disabled:opacity-70 flex items-center transition-all"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Generate
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] overflow-hidden transition-colors duration-200">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Invite Codes</h2>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'used' | 'unused');
                setCurrentPage(1); // Reset to page 1 on filter change
              }}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-xl text-sm focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 outline-none transition-all cursor-pointer font-medium"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-4 h-4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1rem'
              }}
            >
              <option value="all">All Codes</option>
              <option value="unused">Unused Codes</option>
              <option value="used">Used Codes</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400 relative">
            <thead className="bg-gray-50/95 dark:bg-zinc-950/95 backdrop-blur-sm text-gray-700 dark:text-zinc-300 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap w-16 text-gray-500 text-center">NO.</th>
                <th className="px-5 py-4 whitespace-nowrap">Invite Code</th>
                <th className="px-5 py-4 whitespace-nowrap">Status</th>
                <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {currentInvites.map((invite, index) => (
                <tr key={invite.inviteCode} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-zinc-500 font-medium">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-5 py-4 font-mono font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2 whitespace-nowrap">
                    {invite.inviteCode}
                    <button onClick={() => handleCopy(invite.inviteCode)} className="text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors" title="Copy Code">
                      {copiedCode === invite.inviteCode ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${invite.codeStatus === 'used' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20'}`}>
                      {invite.codeStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                    <button onClick={() => handleRegenerate(invite.inviteCode)} className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 p-2 rounded-lg transition-colors" title="Regenerate Code">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {invite.codeStatus === 'unused' && (
                      <button onClick={() => handleDelete(invite.inviteCode)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors" title="Delete Code">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredInvites.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-zinc-500">
                    {invites.length === 0 
                      ? "No invite codes found. Generate some above."
                      : "No invite codes match the selected filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pl-2 pr-6 py-1 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 transition-all cursor-pointer"

            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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
