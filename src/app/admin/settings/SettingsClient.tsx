'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Search, Trash2 } from 'lucide-react';
import { cleanUpStorage, saveEmailSettings } from '@/app/actions/settings';
import { SENDER_NAME_MAX, type EmailSettings } from '@/lib/email/emailSettings';
import { formatBytes } from '@/lib/blob/blobRefs';
import type { EventStorage, UnusedFiles } from '@/lib/blob/eventStorage';
import { AdminModal } from '../components/AdminModal';

const card = 'bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] transition-colors duration-200';
const input = 'w-full px-3 py-2 min-h-11 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100';
const label = 'block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5';
const help = 'mt-1.5 text-xs text-gray-500 dark:text-zinc-500';
const primaryButton = 'min-h-11 px-4 rounded-xl text-sm font-semibold bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2 shrink-0';
const secondaryButton = 'min-h-11 px-4 rounded-xl text-sm font-semibold border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 shrink-0';

export function SettingsClient({ eventId, eventName, email, senderAddress, storage, isOwner }: {
  eventId: string;
  eventName: string;
  email: EmailSettings;
  senderAddress: string | null;
  storage: EventStorage | null;
  isOwner: boolean;
}) {
  const router = useRouter();
  const ids = useId();
  const [senderName, setSenderName] = useState(email.senderName);
  const [replyTo, setReplyTo] = useState(email.replyTo);
  const [saving, setSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [checking, setChecking] = useState<'find' | 'delete' | null>(null);
  const [unused, setUnused] = useState<UnusedFiles | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cleanUpMessage, setCleanUpMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const changed = senderName.trim() !== email.senderName || replyTo.trim() !== email.replyTo;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEmailMessage(null);
    const res = await saveEmailSettings(eventId, { senderName, replyTo });
    setEmailMessage(res.success ? { ok: true, text: 'Saved. The next emails use these settings.' } : { ok: false, text: res.error || 'Something went wrong.' });
    setSaving(false);
    if (res.success) router.refresh();
  };

  const runCleanUp = async (apply: boolean) => {
    setChecking(apply ? 'delete' : 'find');
    setCleanUpMessage(null);
    const res = await cleanUpStorage(apply);
    if (!res.success) {
      setCleanUpMessage({ ok: false, text: res.error });
    } else if (apply) {
      setUnused(null);
      setCleanUpMessage({ ok: true, text: `Deleted ${res.unused.files} files (${formatBytes(res.unused.bytes)}).` });
      router.refresh();
    } else {
      setUnused(res.unused);
    }
    setChecking(null);
    setConfirmDelete(false);
  };

  const fromName = senderName.trim() || eventName;
  const usedShare = storage ? Math.min(1, storage.usedBytes / storage.capBytes) : 0;
  const full = storage !== null && storage.usedBytes >= storage.capBytes;

  return (
    <div className="space-y-6">
      <div className={card}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">How this event&apos;s emails are sent, and the space its photos and music use.</p>
      </div>

      <form onSubmit={handleSave} className={card} aria-labelledby={`${ids}-email-title`}>
        <h3 id={`${ids}-email-title`} className="text-base font-semibold text-gray-900 dark:text-zinc-100">Emails to guests</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Guests get an email when they send their RSVP.{' '}
          {senderAddress ? <>It is sent from <span className="font-medium text-gray-700 dark:text-zinc-300 break-all">{senderAddress}</span>.</> : 'Sending is not set up on this site yet, so no emails go out.'}
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${ids}-sender`} className={label}>Sender name</label>
            <input
              id={`${ids}-sender`}
              value={senderName}
              maxLength={SENDER_NAME_MAX}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder={eventName}
              className={input}
            />
            <p className={help}>What guests see as the sender. Empty = the event&apos;s name.</p>
          </div>
          <div>
            <label htmlFor={`${ids}-reply`} className={label}>Replies go to</label>
            <input
              id={`${ids}-reply`}
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="name@example.com"
              className={input}
            />
            <p className={help}>When a guest answers the email. Empty = the sending address.</p>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 p-3 text-sm text-gray-600 dark:text-zinc-400 break-words">
          From: <span className="font-medium text-gray-900 dark:text-zinc-100">{fromName}</span>
          {senderAddress && <> &lt;{senderAddress}&gt;</>}
          {replyTo.trim() && <><br />Reply-to: <span className="font-medium text-gray-900 dark:text-zinc-100">{replyTo.trim()}</span></>}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <button type="submit" disabled={saving || !changed} className={primaryButton}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            Save
          </button>
          {emailMessage && (
            <p role={emailMessage.ok ? 'status' : 'alert'} className={`text-sm ${emailMessage.ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {emailMessage.text}
            </p>
          )}
        </div>
      </form>

      <section className={card} aria-labelledby={`${ids}-storage-title`}>
        <h3 id={`${ids}-storage-title`} className="text-base font-semibold text-gray-900 dark:text-zinc-100">Storage</h3>
        {storage ? (
          <>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              <span className="font-medium text-gray-900 dark:text-zinc-100 tabular-nums">{formatBytes(storage.usedBytes)}</span> of {formatBytes(storage.capBytes)} used
              {' '}· {storage.files} {storage.files === 1 ? 'file' : 'files'}
            </p>
            <div
              role="meter"
              aria-label="Storage used"
              aria-valuemin={0}
              aria-valuemax={storage.capBytes}
              aria-valuenow={Math.min(storage.usedBytes, storage.capBytes)}
              aria-valuetext={`${formatBytes(storage.usedBytes)} of ${formatBytes(storage.capBytes)}`}
              className="mt-3 h-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden"
            >
              <div
                className={`h-full rounded-full ${full ? 'bg-red-600 dark:bg-red-500' : usedShare > 0.8 ? 'bg-amber-500' : 'bg-gray-900 dark:bg-zinc-100'}`}
                style={{ width: `${Math.max(usedShare * 100, storage.usedBytes > 0 ? 1 : 0)}%` }}
              />
            </div>
            {full && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">Full: new uploads are refused until space is freed.</p>}
          </>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">Could not read the storage right now. Reload to try again.</p>
        )}
        <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
          Photos and songs uploaded for this event. When one is replaced or removed and no draft or saved version uses it any more, it is deleted automatically a day later.
        </p>

        {isOwner && (
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Unused files (all events)</h4>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Platform owners: find and delete now the files no event uses, unused for more than a day. The daily clean-up does the same.</p>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <button type="button" onClick={() => runCleanUp(false)} disabled={checking !== null} className={secondaryButton}>
                {checking === 'find' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
                Find unused files
              </button>
              {unused && unused.files > 0 && (
                <button type="button" onClick={() => setConfirmDelete(true)} disabled={checking !== null} className={`${secondaryButton} text-red-700 dark:text-red-400`}>
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Delete {unused.files} {unused.files === 1 ? 'file' : 'files'}
                </button>
              )}
            </div>
            {unused && (
              <div role="status" className="mt-3 text-sm text-gray-600 dark:text-zinc-400">
                {unused.files === 0 ? 'Nothing to delete.' : (
                  <>
                    <p>{unused.files} unused {unused.files === 1 ? 'file' : 'files'}, {formatBytes(unused.bytes)}{unused.files > unused.sample.length ? `; the first ${unused.sample.length}:` : ':'}</p>
                    <ul className="mt-1.5 space-y-0.5 font-mono text-xs break-all">
                      {unused.sample.map((path) => <li key={path}>{path}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}
            {cleanUpMessage && (
              <p role={cleanUpMessage.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${cleanUpMessage.ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {cleanUpMessage.text}
              </p>
            )}
          </div>
        )}
      </section>

      <AdminModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => runCleanUp(true)}
        type="confirm"
        variant="danger"
        title="Delete the unused files?"
        message={`${unused?.files ?? 0} files (${formatBytes(unused?.bytes ?? 0)}) are deleted for good. No event, draft or saved version uses them.`}
        confirmText="Delete"
        isLoading={checking === 'delete'}
      />
    </div>
  );
}
