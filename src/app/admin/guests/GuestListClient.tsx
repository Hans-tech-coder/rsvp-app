'use client';

import { useState, useMemo } from 'react';
import { Guest } from '@/types';
import { Download, Copy, Check, Eye, X, Mail, Phone, MessageSquare, User, UserX, Search, Trash2, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { deleteInviteCode } from '@/app/actions/admin';
import { AdminModal } from '../components/AdminModal';

export default function GuestListClient({ initialGuests }: { initialGuests: Guest[] }) {
  const guests = initialGuests;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info'}>({
    isOpen: false, title: '', message: '', variant: 'info'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all', 'Yes', 'No'
  const [proxyFilter, setProxyFilter] = useState('all'); // 'all', 'with_proxy', 'no_proxy'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const router = useRouter();

  const handleExportCSV = () => {
    // Format data for CSV using filteredGuests so it respects current view
    const csvData = filteredGuests.map(g => ({
      'Invite Code': g.inviteCode,
      'Status': g.codeStatus,
      'Name': g.fullName || '',
      'Email': g.email || '',
      'Phone': g.phoneNumber || '',
      'Attending': g.willAttend || '',
      'Proxy': g.proxyName || '',
      'Message': g.message || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wedding_guests.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (code: string) => {
    setGuestToDelete(code);
  };

  const confirmDelete = async () => {
    if (!guestToDelete) return;
    setIsDeleting(true);
    const res = await deleteInviteCode(guestToDelete);
    setIsDeleting(false);
    if (res.success) {
      setGuestToDelete(null);
      router.refresh();
    } else {
      setGuestToDelete(null);
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: res.error,
        variant: 'danger'
      });
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Search & Filter logic
  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = g.fullName?.toLowerCase().includes(lowerQuery) ||
          g.inviteCode?.toLowerCase().includes(lowerQuery) ||
          g.email?.toLowerCase().includes(lowerQuery) ||
          g.phoneNumber?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }

      // 2. Attendance Filter
      if (attendanceFilter !== 'all' && g.willAttend !== attendanceFilter) {
        return false;
      }

      // 3. Proxy Filter
      const hasProxy = g.proxyName && g.proxyName.trim().toLowerCase() !== 'n/a';
      if (proxyFilter === 'with_proxy' && !hasProxy) {
        return false;
      }
      if (proxyFilter === 'no_proxy' && hasProxy) {
        return false;
      }

      return true;
    });
  }, [guests, searchQuery, attendanceFilter, proxyFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentGuests = filteredGuests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] overflow-hidden transition-colors duration-200">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 shrink-0">Guest List & RSVPs</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
              <select
                value={attendanceFilter}
                onChange={(e) => {
                  setAttendanceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-xl text-sm focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 outline-none transition-all cursor-pointer min-w-[130px] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat"

              >
                <option value="all">All Attendance</option>
                <option value="Yes">Attending (Yes)</option>
                <option value="No">Not Attending (No)</option>
              </select>
              
              <select
                value={proxyFilter}
                onChange={(e) => {
                  setProxyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-xl text-sm focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 outline-none transition-all cursor-pointer min-w-[130px] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat"

              >
                <option value="all">All Proxies</option>
                <option value="with_proxy">With Proxy</option>
                <option value="no_proxy">Without Proxy</option>
              </select>
            </div>
            
            <div className="relative w-full sm:w-56 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="text-sm font-medium flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto shrink-0"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400 relative">
            <thead className="bg-gray-50/95 dark:bg-zinc-950/95 backdrop-blur-sm text-gray-700 dark:text-zinc-300 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap w-16 text-gray-500 text-center">NO.</th>
                <th className="px-5 py-4 whitespace-nowrap">Invite Code</th>
                <th className="px-5 py-4 whitespace-nowrap">Status</th>
                <th className="px-5 py-4 whitespace-nowrap">Full Name</th>
                <th className="px-5 py-4 whitespace-nowrap">Attendance</th>
                <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {currentGuests.map((guest, index) => (
                <tr key={guest.inviteCode} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-zinc-500 font-medium">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-5 py-4 font-mono font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2 whitespace-nowrap">
                    {guest.inviteCode}
                    <button onClick={() => handleCopy(guest.inviteCode)} className="text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                      {copiedCode === guest.inviteCode ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${guest.codeStatus === 'used' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20'}`}>
                      {guest.codeStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap min-w-[200px]">
                    <div>{guest.fullName || '-'}</div>
                    {guest.willAttend === 'No' && guest.proxyName && (
                      <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Proxy: {guest.proxyName}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {guest.willAttend ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${guest.willAttend === 'Yes' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
                        {guest.willAttend}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                    {guest.codeStatus === 'used' && (
                      <button onClick={() => setSelectedGuest(guest)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-2 rounded-lg transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(guest.inviteCode)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors" title="Delete Guest">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500 dark:text-zinc-500">
                    {searchQuery ? 'No guests match your search.' : 'No guests found. Go to Invites to generate codes.'}
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
              className="appearance-none pl-3 pr-8 py-1 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_8px_center] bg-no-repeat"

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

      {/* View Guest Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                Guest Details
              </h3>
              <button onClick={() => setSelectedGuest(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="text-gray-900 dark:text-zinc-100 font-medium text-lg">{selectedGuest.fullName || '-'}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Email</p>
                      <p className="text-gray-900 dark:text-zinc-100 text-sm break-all">{selectedGuest.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Phone</p>
                      <p className="text-gray-900 dark:text-zinc-100 text-sm">{selectedGuest.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="w-px bg-gray-200 dark:bg-zinc-800 hidden md:block"></div>

                <div className="flex-1 space-y-4">
                   <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                     <span className={`px-2.5 py-1 inline-flex rounded-full text-xs font-semibold ${selectedGuest.willAttend === 'Yes' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
                        {selectedGuest.willAttend === 'Yes' ? 'Attending' : 'Not Attending'}
                      </span>
                   </div>

                   {selectedGuest.willAttend === 'No' && selectedGuest.proxyName && (
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400">
                          <UserX className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Proxy Name</p>
                          <p className="text-gray-900 dark:text-zinc-100 text-sm font-medium">{selectedGuest.proxyName}</p>
                        </div>
                      </div>
                   )}

                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Invite Code</p>
                      <p className="text-gray-900 dark:text-zinc-100 text-sm font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded inline-block">{selectedGuest.inviteCode}</p>
                    </div>
                </div>
              </div>

              {selectedGuest.message && (
                <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Message for Couple</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl text-gray-700 dark:text-zinc-300 text-sm italic border border-gray-100 dark:border-zinc-800/50">
                    "{selectedGuest.message}"
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 flex justify-end">
              <button 
                onClick={() => setSelectedGuest(null)}
                className="px-5 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AdminModal 
        isOpen={!!guestToDelete}
        onClose={() => setGuestToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Guest Record"
        message="Are you sure you want to delete this guest record? This will also delete their invite code, meaning they will no longer be able to access the RSVP form."
        type="confirm"
        variant="danger"
        isLoading={isDeleting}
        confirmText="Delete Record"
      />

      <AdminModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type="alert"
        variant={alertConfig.variant}
      />
    </div>
  );
}
