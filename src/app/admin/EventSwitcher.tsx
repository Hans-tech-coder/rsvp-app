'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, CalendarRange } from 'lucide-react';
import type { EventChoice } from '@/lib/platformEvents';

// The sidebar's event picker. Each event is a plain link to
// /admin/open/<eventId> (sets the current event, full page load), so the
// content editors' leave guard catches it like any other admin link.
// "Manage events" goes to the events list (/admin).
export function EventSwitcher({ current, events, onNavigate }: { current: string; events: EventChoice[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentEvent = events.find((e) => e.id === current);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative px-4 pt-4 shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-11 flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/60 text-left hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-zinc-100"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-xs text-gray-500 dark:text-zinc-400">Event</span>
          <span className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{currentEvent?.name ?? current}</span>
          <span className="block text-xs text-gray-500 dark:text-zinc-500 truncate">/{current}</span>
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={listId}
          className="absolute left-4 right-4 top-full mt-1 z-10 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden"
        >
          <ul className="max-h-72 overflow-y-auto py-1" aria-label="Your events">
            {events.map((event) => {
              const isCurrent = event.id === current;
              return (
                <li key={event.id}>
                  <a
                    href={`/admin/open/${event.id}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={onNavigate}
                    className="flex items-center gap-2 min-h-11 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus-visible:bg-gray-100 dark:focus-visible:bg-zinc-800 outline-none"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium text-gray-900 dark:text-zinc-100">{event.name}</span>
                      <span className="block truncate text-xs text-gray-500 dark:text-zinc-500">
                        /{event.id}{event.archived ? ' · Archived' : ''}
                      </span>
                    </span>
                    {isCurrent && <Check className="w-4 h-4 shrink-0 text-gray-900 dark:text-zinc-100" aria-hidden="true" />}
                  </a>
                </li>
              );
            })}
          </ul>
          <Link
            href="/admin"
            onClick={() => {
              setOpen(false);
              onNavigate();
            }}
            className="flex items-center gap-2 min-h-11 px-3 border-t border-gray-200 dark:border-zinc-800 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus-visible:bg-gray-100 dark:focus-visible:bg-zinc-800 outline-none"
          >
            <CalendarRange className="w-4 h-4" aria-hidden="true" />
            Manage events
          </Link>
        </div>
      )}
    </div>
  );
}
