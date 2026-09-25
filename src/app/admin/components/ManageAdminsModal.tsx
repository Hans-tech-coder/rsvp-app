'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldCheck, UserPlus, X, Trash2 } from 'lucide-react';
import {
  addAdmin,
  cancelPendingAdmin,
  listAdmins,
  removeAdmin,
  type ActiveAdmin,
  type PendingAdmin,
} from '@/app/actions/admins';
import { AdminModal } from './AdminModal';

// Mount only while open (the layout renders it conditionally), so each
// opening starts with fresh state and a fresh listAdmins() load.
interface ManageAdminsModalProps {
  onClose: () => void;
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

function RoleBadge({ role }: { role: 'super' | 'admin' }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        role === 'super'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
          : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
      }`}
    >
      {role === 'super' ? 'Super admin' : 'Admin'}
    </span>
  );
}

export function ManageAdminsModal({ onClose }: ManageAdminsModalProps) {
  const [myUid, setMyUid] = useState<string | null>(null);
  const [admins, setAdmins] = useState<ActiveAdmin[]>([]);
  const [pending, setPending] = useState<PendingAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<ActiveAdmin | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const applyList = useCallback((res: Awaited<ReturnType<typeof listAdmins>>) => {
    if (res.success) {
      setMyUid(res.myUid ?? null);
      setAdmins(res.admins ?? []);
      setPending(res.pending ?? []);
    } else {
      setError(res.error || 'Failed to load admins');
    }
  }, []);

  const load = async () => applyList(await listAdmins());

  useEffect(() => {
    let cancelled = false;
    listAdmins().then((res) => {
      if (cancelled) return;
      applyList(res);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [applyList]);

  // Esc closes the confirmation first, then the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isRemoving) return;
      if (toRemove) setToRemove(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toRemove, isRemoving, onClose]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError('');
    const res = await addAdmin(email);
    if (res.success) {
      setEmail('');
      await load();
    } else {
      setError(res.error || 'Failed to add admin');
    }
    setIsAdding(false);
  };

  const handleCancelPending = async (pendingEmail: string) => {
    setBusyEmail(pendingEmail);
    setError('');
    const res = await cancelPendingAdmin(pendingEmail);
    if (!res.success) setError(res.error || 'Failed to cancel');
    await load();
    setBusyEmail(null);
  };

  const handleRemove = async () => {
    if (!toRemove) return;
    setIsRemoving(true);
    setError('');
    const res = await removeAdmin(toRemove.uid);
    if (!res.success) setError(res.error || 'Failed to remove admin');
    await load();
    setIsRemoving(false);
    setToRemove(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !toRemove) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-admins-title"
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[85dvh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-zinc-800"
        >
          <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
            <h3 id="manage-admins-title" className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Manage Admins
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="p-6 pb-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
            <label htmlFor="new-admin-email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Add admin (Google account email)
            </label>
            <div className="flex gap-2">
              <input
                id="new-admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2 shrink-0"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Add
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">
              They become an admin the first time they sign in with Google.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </form>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-500 mb-2">
                    Active ({admins.length})
                  </h4>
                  <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl">
                    {admins.map((admin) => (
                      <li key={admin.uid} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                            {admin.email || admin.uid}
                            {admin.uid === myUid && <span className="text-gray-500 dark:text-zinc-500 font-normal"> (you)</span>}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                            <RoleBadge role={admin.role} />
                            <span>Added {formatDate(admin.addedAt)}</span>
                          </div>
                        </div>
                        {admin.role !== 'super' && admin.uid !== myUid && (
                          <button
                            onClick={() => setToRemove(admin)}
                            aria-label={`Remove ${admin.email}`}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-500 mb-2">
                    Pending ({pending.length})
                  </h4>
                  {pending.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-zinc-500">No one is waiting to sign in.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl">
                      {pending.map((entry) => (
                        <li key={entry.email} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{entry.email}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                              <RoleBadge role={entry.role} />
                              <span>Added {formatDate(entry.addedAt)}</span>
                            </div>
                          </div>
                          {entry.role !== 'super' && (
                            <button
                              onClick={() => handleCancelPending(entry.email)}
                              disabled={busyEmail === entry.email}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {busyEmail === entry.email && <Loader2 className="w-3 h-3 animate-spin" />}
                              Cancel
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      <AdminModal
        isOpen={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={handleRemove}
        type="confirm"
        variant="danger"
        title="Remove this admin?"
        message={`${toRemove?.email ?? ''} will lose access to the admin portal right away.`}
        confirmText="Remove"
        isLoading={isRemoving}
      />
    </>
  );
}
