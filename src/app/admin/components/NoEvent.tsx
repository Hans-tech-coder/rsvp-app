import Link from 'next/link';
import { CalendarRange } from 'lucide-react';

/** For a client admin page when the account has no event to open. */
export function NoEvent() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
      <p className="text-gray-700 dark:text-zinc-300">There is no event to edit yet.</p>
      <Link
        href="/admin"
        className="mt-4 inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-sm font-semibold bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
      >
        <CalendarRange className="w-4 h-4" aria-hidden="true" />
        Go to All Events
      </Link>
    </div>
  );
}
