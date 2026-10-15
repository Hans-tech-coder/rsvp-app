'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { addMember, cancelInvite, changeMemberRole, removeMember, setClientDesign } from '@/app/actions/team';
import { EVENT_ROLES, ROLE_NAMES, type EventRole } from '@/lib/permissions';
import type { ActivityEntry } from '@/lib/auditLog';
import { AdminModal } from '../components/AdminModal';

export type TeamMember = { uid: string; email: string; role: EventRole; addedAt: string | null };
export type TeamInvite = { email: string; role: EventRole; addedAt: string | null };

const ROLE_HELP: Record<EventRole, string> = {
  organizer: 'Everything in this event, including the team.',
  client: 'Text, photos, guests, invites, gifts and RSVPs; can show or hide sections.',
};

const card = 'bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] transition-colors duration-200';
const input = 'px-3 py-2 min-h-11 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100';
const sectionTitle = 'text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-500 mb-2';

function formatDate(iso: string | null, withTime = false) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, withTime
    ? { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' });
}

export function TeamClient({ eventId, myUid, isOwner, members, invites, clientDesign, activity }: {
  eventId: string;
  myUid: string;
  isOwner: boolean;
  members: TeamMember[];
  invites: TeamInvite[];
  clientDesign: boolean;
  activity: ActivityEntry[];
}) {
  const router = useRouter();
  const ids = useId();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EventRole>('client');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);

  /** Runs an action, shows its error, then reloads the page data. */
  const run = async (key: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy(key);
    setError('');
    const res = await action();
    if (!res.success) setError(res.error || 'Something went wrong.');
    router.refresh();
    setBusy(null);
    return res.success;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run('add', () => addMember(eventId, email, role))) setEmail('');
  };

  const handleRemove = async () => {
    if (!toRemove) return;
    await run(`remove:${toRemove.uid}`, () => removeMember(eventId, toRemove.uid));
    setToRemove(null);
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Team</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Who can sign in to manage this event. {isOwner ? 'As a platform owner you can open every event.' : 'Platform owners can open every event and are not listed here.'}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          {EVENT_ROLES.map((r) => (
            <div key={r} className="rounded-xl bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 p-3">
              <dt className="font-semibold text-gray-900 dark:text-zinc-100">{ROLE_NAMES[r]}</dt>
              <dd className="text-gray-600 dark:text-zinc-400 mt-0.5">{ROLE_HELP[r]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <form onSubmit={handleAdd} className={card}>
        <label htmlFor={`${ids}-email`} className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
          Add someone (Google account email)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id={`${ids}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
            className={`${input} flex-1 min-w-0`}
          />
          <label htmlFor={`${ids}-role`} className="sr-only">Role</label>
          <select id={`${ids}-role`} value={role} onChange={(e) => setRole(e.target.value as EventRole)} className={input}>
            {EVENT_ROLES.map((r) => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}
          </select>
          <button
            type="submit"
            disabled={busy === 'add'}
            className="min-h-11 px-4 rounded-xl text-sm font-semibold bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2 shrink-0"
          >
            {busy === 'add' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UserPlus className="w-4 h-4" aria-hidden="true" />}
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">
          Someone who has signed in before is added at once; anyone else joins the first time they sign in with Google.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>

      <div className={`${card} space-y-6`}>
        <section>
          <h3 className={sectionTitle}>Members ({members.length})</h3>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-zinc-500">No members yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl">
              {members.map((m) => {
                const isMe = m.uid === myUid;
                return (
                  <li key={m.uid} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-48">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 break-all">
                        {m.email || m.uid}
                        {isMe && <span className="text-gray-500 dark:text-zinc-500 font-normal"> (you)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Added {formatDate(m.addedAt)}</p>
                    </div>
                    <label htmlFor={`${ids}-role-${m.uid}`} className="sr-only">Role of {m.email}</label>
                    <select
                      id={`${ids}-role-${m.uid}`}
                      value={m.role}
                      disabled={isMe || busy !== null}
                      title={isMe ? 'You cannot change your own role' : undefined}
                      onChange={(e) => run(`role:${m.uid}`, () => changeMemberRole(eventId, m.uid, e.target.value as EventRole))}
                      className={`${input} disabled:opacity-60`}
                    >
                      {EVENT_ROLES.map((r) => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}
                    </select>
                    {!isMe && (
                      <button
                        onClick={() => setToRemove(m)}
                        aria-label={`Remove ${m.email}`}
                        className="p-2.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 className={sectionTitle}>Invited, not signed in yet ({invites.length})</h3>
          {invites.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-zinc-500">No one is waiting to sign in.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl">
              {invites.map((inv) => (
                <li key={inv.email} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-48">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 break-all">{inv.email}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{ROLE_NAMES[inv.role]} · invited {formatDate(inv.addedAt)}</p>
                  </div>
                  <button
                    onClick={() => run(`cancel:${inv.email}`, () => cancelInvite(eventId, inv.email))}
                    disabled={busy !== null}
                    className="min-h-10 px-3 text-xs font-semibold rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {busy === `cancel:${inv.email}` && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
                    Cancel invite
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className={`${card} flex items-start gap-4`}>
        <div className="flex-1 min-w-0">
          <h3 id={`${ids}-design`} className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Clients may change the design</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">The order of the sections, colors & fonts, and the music. Off: only organizers change them.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={clientDesign}
          aria-labelledby={`${ids}-design`}
          disabled={busy !== null}
          onClick={() => run('design', () => setClientDesign(eventId, !clientDesign))}
          className={`relative w-11 h-6 mt-1 shrink-0 rounded-full transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-zinc-100 ${
            clientDesign ? 'bg-gray-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-700'
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${clientDesign ? 'translate-x-5' : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Activity</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">Who changed what, newest first (last 50). Drafts are listed when they are published.</p>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-zinc-500">Nothing yet.</p>
        ) : (
          <ol className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-0.5">
                <time dateTime={a.at ?? undefined} className="shrink-0 sm:w-44 text-xs text-gray-500 dark:text-zinc-500 tabular-nums">{formatDate(a.at, true)}</time>
                <p className="min-w-0 text-gray-700 dark:text-zinc-300 break-words">
                  <span className="font-medium text-gray-900 dark:text-zinc-100">{a.email ?? 'Someone'}</span> {a.action.charAt(0).toLowerCase() + a.action.slice(1)}
                  {a.target && <span className="text-gray-500 dark:text-zinc-400"> · {a.target}</span>}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <AdminModal
        isOpen={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={handleRemove}
        type="confirm"
        variant="danger"
        title="Remove from the team?"
        message={`${toRemove?.email ?? ''} will lose access to this event right away.`}
        confirmText="Remove"
        isLoading={busy?.startsWith('remove:') ?? false}
      />
    </div>
  );
}
