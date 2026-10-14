'use client';

import { Loader2, Save, Check, RotateCcw, History, CircleCheck } from 'lucide-react';
import { useReportUnsavedChanges } from './unsavedChanges';

interface EditorSaveBarProps {
  hasChanges: boolean;
  saving: boolean;
  /** True for a few seconds after a save. */
  saved: boolean;
  hasBackup: boolean;
  onUndo: () => void;
  onRestore: () => void;
  onSave: () => void;
}

const secondaryButton =
  'flex flex-1 sm:flex-none justify-center items-center gap-2 px-3 sm:px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50';

// The Undo / Restore / Save row at the bottom of every content editor. Stays in
// view while the form scrolls, says whether the edits are live, and reports
// unsaved edits to the content page (see unsavedChanges.tsx).
export function EditorSaveBar({ hasChanges, saving, saved, hasBackup, onUndo, onRestore, onSave }: EditorSaveBarProps) {
  useReportUnsavedChanges(hasChanges);

  const status = saving
    ? { text: 'Publishing...', className: 'text-gray-500 dark:text-zinc-400' }
    : hasChanges
      ? { text: 'Unsaved changes', className: 'text-amber-700 dark:text-amber-400' }
      : saved
        ? { text: 'Saved. Live on the website now.', className: 'text-green-700 dark:text-green-400' }
        : { text: 'All changes are live', className: 'text-gray-500 dark:text-zinc-400' };

  return (
    <div className="sticky bottom-0 z-10 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 mt-12 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
      <p role="status" className={`flex items-center gap-2 text-sm font-medium ${status.className}`}>
        {hasChanges && !saving ? (
          <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
        ) : saved && !saving ? (
          <CircleCheck className="w-4 h-4" aria-hidden="true" />
        ) : null}
        {status.text}
      </p>
      {/* One row on phones (short labels) so the bar leaves room for the form. */}
      <div className="flex w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3">
        {hasChanges && (
          <button onClick={onUndo} disabled={saving} className={secondaryButton}>
            <RotateCcw className="w-4 h-4 shrink-0" />
            Undo<span className="hidden sm:inline"> Changes</span>
          </button>
        )}
        {hasBackup && (
          <button onClick={onRestore} disabled={saving} className={secondaryButton}>
            <History className="w-4 h-4 shrink-0" />
            Restore<span className="hidden sm:inline"> Previous Save</span>
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className={`flex flex-1 sm:flex-none justify-center items-center gap-2 px-3 sm:px-6 py-2.5 rounded-lg transition-colors ${
            !hasChanges
              ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
              : 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200'
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : <>Save<span className="hidden sm:inline"> Changes</span></>}
        </button>
      </div>
    </div>
  );
}
