'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ExternalLink, Copy, Link2, Archive, ArchiveRestore, Trash2, ArrowRight } from 'lucide-react';
import { deleteEvent, duplicateEvent, renameEvent, setEventArchived } from '@/app/actions/events';
import { toEventId } from '@/lib/eventPaths';
import { ROLE_NAMES } from '@/lib/permissions';
import { eventTypeName } from '@/lib/templates/catalog';
import type { EventSummary } from '@/lib/platformEvents';
import { AdminModal } from './components/AdminModal';

type Dialog =
  | { kind: 'duplicate'; event: EventSummary }
  | { kind: 'rename'; event: EventSummary }
  | { kind: 'archive'; event: EventSummary }
  | { kind: 'delete'; event: EventSummary };

const secondaryButton =
  'inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors';
const inputClass =
  'w-full min-h-11 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100';

export function EventsClient({
  events,
  currentId,
  isOwner,
  canCreate,
  errorMsg,
}: {
  events: EventSummary[];
  currentId: string | null;
  isOwner: boolean;
  canCreate: boolean;
  errorMsg: string | null;
}) {
  const router = useRouter();
  const ids = useId();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [linkEdited, setLinkEdited] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = events.filter((e) => !e.archived);
  const archived = events.filter((e) => e.archived);

  const openDialog = (next: Dialog) => {
    const source = 'event' in next ? next.event : null;
    const startName = next.kind === 'duplicate' && source ? `${source.name} (copy)` : '';
    setName(startName);
    setLink(next.kind === 'rename' && source ? source.id : toEventId(startName));
    setLinkEdited(next.kind === 'rename');
    setConfirmText('');
    setError(null);
    setDialog(next);
  };

  const close = () => {
    if (!busy) setDialog(null);
  };

  const onName = (value: string) => {
    setName(value);
    if (!linkEdited) setLink(toEventId(value));
  };

  const run = async () => {
    if (!dialog || busy) return;
    setBusy(true);
    setError(null);
    const result =
      dialog.kind === 'duplicate'
        ? await duplicateEvent(dialog.event.id, name, link)
        : dialog.kind === 'rename'
          ? await renameEvent(dialog.event.id, link)
          : dialog.kind === 'archive'
            ? await setEventArchived(dialog.event.id, !dialog.event.archived)
            : await deleteEvent(dialog.event.id, confirmText);
    if (!result.success) {
      setError(result.error);
      setBusy(false);
      return;
    }
    if (dialog.kind === 'duplicate' && 'eventId' in result) {
      // Open the new event: makes it the current one and shows its dashboard.
      window.location.assign(`/admin/open/${result.eventId}`);
      return;
    }
    setBusy(false);
    setDialog(null);
    router.refresh();
  };

  const linkField = (
    <div>
      <label htmlFor={`${ids}-link`} className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
        Link
      </label>
      <div className="flex items-center rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-zinc-100">
        <span className="pl-3 text-sm text-gray-500 dark:text-zinc-500 select-none">site/</span>
        <input
          id={`${ids}-link`}
          value={link}
          onChange={(e) => {
            setLink(e.target.value.toLowerCase());
            setLinkEdited(true);
          }}
          maxLength={64}
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={`${ids}-link-help`}
          className="flex-1 min-w-0 min-h-11 pr-3 bg-transparent text-sm text-gray-900 dark:text-zinc-100 focus:outline-none"
        />
      </div>
      <p id={`${ids}-link-help`} className="mt-1.5 text-xs text-gray-500 dark:text-zinc-500">
        The guest page’s address. Lowercase letters, numbers and hyphens.
      </p>
    </div>
  );

  const nameField = (
    <div>
      <label htmlFor={`${ids}-name`} className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
        Event name
      </label>
      <input
        id={`${ids}-name`}
        value={name}
        onChange={(e) => onName(e.target.value)}
        maxLength={80}
        placeholder="e.g. Ana’s 18th Birthday"
        autoFocus
        className={inputClass}
      />
    </div>
  );

  const errorLine = error && (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {error}
    </p>
  );

  const dialogProps = (): { title: string; confirm: string; variant: 'info' | 'warning' | 'danger'; body: React.ReactNode } | null => {
    if (!dialog) return null;
    switch (dialog.kind) {
      case 'duplicate':
        return {
          title: `Duplicate “${dialog.event.name}”`,
          confirm: 'Duplicate',
          variant: 'info',
          body: (
            <>
              {nameField}
              {linkField}
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                Copies the published site (texts, photos, colors, screens) and the invite message. Guests, RSVPs, gifts,
                drafts and the team are not copied.
              </p>
            </>
          ),
        };
      case 'rename':
        return {
          title: 'Change link',
          confirm: 'Change link',
          variant: 'warning',
          body: (
            <>
              {linkField}
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                The old address <span className="font-mono">/{dialog.event.id}</span> stops working. Do this before
                invitations go out.
              </p>
            </>
          ),
        };
      case 'archive':
        return dialog.event.archived
          ? {
              title: 'Restore event',
              confirm: 'Restore',
              variant: 'info',
              body: <p className="text-sm text-gray-600 dark:text-zinc-400">The guest page opens again at /{dialog.event.id}.</p>,
            }
          : {
              title: 'Archive event',
              confirm: 'Archive',
              variant: 'warning',
              body: (
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Guests can no longer open /{dialog.event.id}. Nothing is deleted, and you can restore it any time.
                </p>
              ),
            };
      case 'delete':
        return {
          title: 'Delete event',
          confirm: 'Delete forever',
          variant: 'danger',
          body: (
            <>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Deletes <strong className="text-gray-900 dark:text-zinc-100">{dialog.event.name}</strong> and everything in
                it: content, guests, RSVPs, gifts, team and activity. This cannot be undone.
              </p>
              <div>
                <label htmlFor={`${ids}-confirm`} className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                  Type <span className="font-mono">{dialog.event.id}</span> to confirm
                </label>
                <input
                  id={`${ids}-confirm`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  className={inputClass}
                />
              </div>
            </>
          ),
        };
    }
  };
  const shown = dialogProps();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">All Events</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">
            {isOwner ? 'Every event on the platform.' : 'The events you are a member of.'} Open one to manage it.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/new"
            className="min-h-11 px-4 rounded-xl text-sm font-semibold bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            New event
          </Link>
        )}
      </div>

      {errorMsg && (
        <div role="alert" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error loading events</h2>
          <p className="text-red-600 dark:text-red-300 font-mono text-sm break-all">{errorMsg}</p>
        </div>
      )}

      {!errorMsg && events.length === 0 && (
        <p className="text-gray-500 dark:text-zinc-400">No events yet.{canCreate ? ' Create the first one.' : ''}</p>
      )}

      {active.length > 0 && (
        <ul className="space-y-4">
          {active.map((event) => (
            <EventCard key={event.id} event={event} isCurrent={event.id === currentId} isOwner={isOwner} canCreate={canCreate} onAction={openDialog} />
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <section aria-labelledby={`${ids}-archived`}>
          <h2 id={`${ids}-archived`} className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-3">
            Archived
          </h2>
          <ul className="space-y-4">
            {archived.map((event) => (
              <EventCard key={event.id} event={event} isCurrent={event.id === currentId} isOwner={isOwner} canCreate={canCreate} onAction={openDialog} />
            ))}
          </ul>
        </section>
      )}

      {shown && (
        <AdminModal
          isOpen
          type="confirm"
          variant={shown.variant}
          title={shown.title}
          message=""
          confirmText={shown.confirm}
          isLoading={busy}
          onClose={close}
          onConfirm={run}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            {shown.body}
            {errorLine}
            <button type="submit" hidden />
          </form>
        </AdminModal>
      )}
    </div>
  );
}

function EventCard({
  event,
  isCurrent,
  isOwner,
  canCreate,
  onAction,
}: {
  event: EventSummary;
  isCurrent: boolean;
  isOwner: boolean;
  canCreate: boolean;
  onAction: (dialog: Dialog) => void;
}) {
  const organizer = event.role !== 'client';
  const pending = event.rsvp ? event.rsvp.invites - event.rsvp.responded : 0;

  return (
    <li
      className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 sm:p-6 shadow-sm transition-colors ${
        isCurrent ? 'border-gray-900 dark:border-zinc-300' : 'border-gray-200 dark:border-zinc-800'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 break-words">{event.name}</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5 break-all">
            /{event.id} · {eventTypeName(event.type)} · {event.date} · {ROLE_NAMES[event.role]}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {isCurrent && <Badge tone="dark">Open now</Badge>}
          {event.isDefault && <Badge tone="blue">Home page</Badge>}
          {event.archived ? <Badge tone="gray">Archived</Badge> : <Badge tone="green">Live</Badge>}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Attending" value={event.rsvp?.attending} />
        <Stat label="Not attending" value={event.rsvp?.notAttending} />
        <Stat label="No reply yet" value={event.rsvp ? pending : undefined} />
        <Stat label="Invites" value={event.rsvp?.invites} />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`/admin/open/${event.id}`}
          className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-lg text-sm font-semibold bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
        >
          Open
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
        {!event.archived && (
          <a href={`/${event.id}`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            View site
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        {organizer && canCreate && (
          <button type="button" className={secondaryButton} onClick={() => onAction({ kind: 'duplicate', event })}>
            <Copy className="w-4 h-4" aria-hidden="true" />
            Duplicate
          </button>
        )}
        {organizer && !event.isDefault && (
          <button type="button" className={secondaryButton} onClick={() => onAction({ kind: 'rename', event })}>
            <Link2 className="w-4 h-4" aria-hidden="true" />
            Change link
          </button>
        )}
        {organizer && !event.isDefault && (
          <button type="button" className={secondaryButton} onClick={() => onAction({ kind: 'archive', event })}>
            {event.archived ? <ArchiveRestore className="w-4 h-4" aria-hidden="true" /> : <Archive className="w-4 h-4" aria-hidden="true" />}
            {event.archived ? 'Restore' : 'Archive'}
          </button>
        )}
        {isOwner && !event.isDefault && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            onClick={() => onAction({ kind: 'delete', event })}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-zinc-950/60 border border-gray-100 dark:border-zinc-800 px-3 py-2.5">
      <dt className="text-xs text-gray-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums">{value ?? '–'}</dd>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'dark' | 'blue' | 'gray' | 'green'; children: React.ReactNode }) {
  const tones = {
    dark: 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
