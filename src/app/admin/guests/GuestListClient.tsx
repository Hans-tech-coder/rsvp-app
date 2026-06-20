'use client';

import { useState } from 'react';
import { Guest } from '@/types';
import { generateInviteCodes, deleteInviteCode } from '@/app/actions/admin';
import { Loader2, Download, Trash2, Copy, Check } from 'lucide-react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';

export default function GuestListClient({ initialGuests }: { initialGuests: Guest[] }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [codeCount, setCodeCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    if (codeCount < 1 || codeCount > 100) return alert('Enter a valid number (1-100)');
    setGenerating(true);
    const res = await generateInviteCodes(codeCount);
    setGenerating(false);
    if (res.success) {
      alert(`Generated ${res.count} codes successfully!`);
      router.refresh(); // Refresh server data
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this unused code?')) return;
    const res = await deleteInviteCode(code);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleExportCSV = () => {
    // Format data for CSV
    const csvData = guests.map(g => ({
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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Guest List & RSVPs</h2>
          <button
            onClick={handleExportCSV}
            className="text-sm font-medium flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
            <thead className="bg-gray-50 dark:bg-zinc-950/50 text-gray-700 dark:text-zinc-300 uppercase text-xs font-semibold">
              <tr>
                <th className="px-5 py-4">Invite Code</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Full Name</th>
                <th className="px-5 py-4">Attendance</th>
                <th className="px-5 py-4">Message</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {guests.map((guest) => (
                <tr key={guest.inviteCode} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 font-mono font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    {guest.inviteCode}
                    <button onClick={() => handleCopy(guest.inviteCode)} className="text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                      {copiedCode === guest.inviteCode ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${guest.codeStatus === 'used' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20'}`}>
                      {guest.codeStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-zinc-100">{guest.fullName || '-'}</td>
                  <td className="px-5 py-4">
                    {guest.willAttend ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${guest.willAttend === 'Yes' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
                        {guest.willAttend}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4 max-w-[200px] truncate" title={guest.message}>{guest.message || '-'}</td>
                  <td className="px-5 py-4 text-right">
                    {guest.codeStatus === 'unused' && (
                      <button onClick={() => handleDelete(guest.inviteCode)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500 dark:text-zinc-500">
                    No invite codes found. Generate some above.
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
