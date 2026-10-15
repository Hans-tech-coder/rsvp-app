'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Save, Check, RotateCcw, History, CircleCheck, Send, X } from 'lucide-react';
import { useReportUnsavedChanges } from './unsavedChanges';
import { AdminModal } from '../components/AdminModal';
import type { ContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';
import type { DocData, VersionInfo } from '@/lib/contentDrafts';
import { useBuilderLink } from '../builder/builderContext';

/** Unsaved edits are saved as a draft (never live) after this long without a change. */
export const AUTOSAVE_MS = 10_000;

interface EditorSaveBarProps {
  /** The editor's useContentDraft(). */
  draft: ContentDraft;
  hasChanges: boolean;
  saving: boolean;
  /** True for a few seconds after a save. */
  saved: boolean;
  onUndo: () => void;
  /** Saves the form as the draft; resolves false when nothing was saved. */
  onSave: () => Promise<boolean>;
  /** Loads a version's doc into the form (unsaved, like any edit). */
  onRestore: (data: DocumentData) => void;
  /** Holds autosave off (e.g. while a photo uploads). */
  busy?: boolean;
  /** The doc as onSave would save it now, for the visual builder's live preview and undo. */
  doc?: DocData;
  /** True when the doc holds only the editor's fields (saved with merge). */
  merge?: boolean;
}

const secondaryButton =
  'flex flex-1 @xl:flex-none justify-center items-center gap-2 min-h-11 px-3 @xl:px-5 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50';

const when = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function versionTitle(v: VersionInfo) {
  return v.publishedAt ? when(v.publishedAt) : (v.label ?? 'Earlier version');
}

// The Save / Publish row at the bottom of every content editor (F9). Save
// writes a draft (also automatically after AUTOSAVE_MS idle); Publish makes the
// draft live; History lists the last published versions to load back into the
// form, and drops the draft. Reports unsaved edits to the content page
// (unsavedChanges.tsx) and asks before overwriting a draft saved elsewhere.
export function EditorSaveBar({ draft, hasChanges, saving, saved, onUndo, onSave, onRestore, busy = false, doc, merge = false }: EditorSaveBarProps) {
  useReportUnsavedChanges(hasChanges);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<VersionInfo | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [working, setWorking] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const anyBusy = saving || working || draft.publishing;
  const canPublish = (hasChanges || draft.hasDraft) && !anyBusy;

  // Autosave: the timer restarts on every render, so it fires after the
  // editor has been still for AUTOSAVE_MS with unsaved edits. A failed or
  // declined autosave stops it until the admin saves by hand.
  const [autosaveOff, setAutosaveOff] = useState(false);
  const save = useRef(onSave);
  useEffect(() => {
    save.current = onSave;
  });
  useEffect(() => {
    if (!hasChanges || anyBusy || busy || autosaveOff) return;
    const timer = setTimeout(async () => {
      if (!(await save.current())) setAutosaveOff(true);
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  });
  const saveNow = async () => {
    const ok = await onSave();
    setAutosaveOff(!ok);
    return ok;
  };

  // In the visual builder: every change of the doc goes to its live preview,
  // and the builder can load a doc into the form (undo / redo) or save it.
  const builder = useBuilderLink();
  const docJson = doc === undefined ? null : JSON.stringify(doc);
  useEffect(() => {
    if (builder && docJson !== null) builder.docChanged(draft.docId, JSON.parse(docJson), merge);
  }, [builder, draft.docId, docJson, merge]);
  const handle = useRef({ restore: onRestore, save: saveNow });
  useEffect(() => {
    handle.current = { restore: onRestore, save: saveNow };
  });
  useEffect(() => {
    if (!builder) return;
    return builder.register(draft.docId, {
      restore: (data) => handle.current.restore(data),
      save: () => handle.current.save(),
    });
  }, [builder, draft.docId]);

  useEffect(() => {
    if (!historyOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !historyRef.current?.contains(e.target as Node)) setHistoryOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [historyOpen]);

  const run = async (task: () => Promise<void>, failure: string) => {
    setWorking(true);
    try {
      await task();
    } catch (error) {
      console.error(failure, error);
      alert(`${failure}: ${(error as Error).message}`);
    } finally {
      setWorking(false);
    }
  };

  const publish = () => {
    setConfirmPublish(false);
    run(async () => {
      if (hasChanges && !(await saveNow())) return;
      await draft.publish();
    }, 'Failed to publish');
  };

  const restore = () => {
    const target = restoreTarget;
    setRestoreTarget(null);
    setHistoryOpen(false);
    if (target) run(async () => onRestore(await draft.fetchVersion(target.id)), 'Failed to load that version');
  };

  const discard = () => {
    setConfirmDiscard(false);
    setHistoryOpen(false);
    run(() => draft.discard(), 'Failed to discard the draft');
  };

  const status = draft.publishing
    ? { text: 'Publishing...', className: 'text-gray-500 dark:text-zinc-400' }
    : saving
      ? { text: 'Saving draft...', className: 'text-gray-500 dark:text-zinc-400' }
      : hasChanges
        ? { text: autosaveOff ? 'Unsaved changes' : 'Unsaved changes (saved as a draft in a moment)', className: 'text-amber-700 dark:text-amber-400' }
        : draft.published
          ? { text: 'Published. Live on the website now.', className: 'text-green-700 dark:text-green-400' }
          : draft.hasDraft
            ? { text: saved ? 'Draft saved. Not live until you publish.' : 'Draft not published yet', className: 'text-blue-700 dark:text-blue-400' }
            : { text: 'All changes are live', className: 'text-gray-500 dark:text-zinc-400' };

  return (
    // Laid out by its own width (container queries), so it fits the content
    // page and the narrower builder drawer alike.
    <div className="@container sticky bottom-0 z-10 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 mt-12 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-gray-200 dark:border-zinc-800">
      <div className="flex flex-col @xl:flex-row justify-between items-stretch @xl:items-center gap-3">
      <p role="status" className={`flex items-center gap-2 text-sm font-medium ${status.className}`}>
        {hasChanges && !saving && !draft.publishing ? (
          <span className="w-2 h-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
        ) : draft.published && !anyBusy ? (
          <CircleCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : draft.hasDraft && !anyBusy ? (
          <span className="w-2 h-2 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
        ) : null}
        {status.text}
      </p>
      {/* One row on phones (short labels) so the bar leaves room for the form. */}
      <div className="flex w-full @xl:w-auto items-stretch @xl:items-center gap-2">
        {hasChanges && (
          <button onClick={onUndo} disabled={anyBusy} className={secondaryButton} aria-label="Undo" title="Back to the last saved version">
            <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden @xl:inline">Undo</span>
          </button>
        )}

        <div ref={historyRef} className="flex flex-1 @xl:flex-none">
          <button
            onClick={() => setHistoryOpen((open) => !open)}
            disabled={anyBusy}
            aria-expanded={historyOpen}
            aria-haspopup="dialog"
            aria-label="History"
            className={`${secondaryButton} w-full`}
          >
            <History className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden @xl:inline">History</span>
          </button>
          {/* Positioned against the (sticky) bar, so it stays inside the editor on phones. */}
          {historyOpen && (
            <div
              role="dialog"
              aria-label="Published versions"
              className="absolute bottom-full mb-2 left-4 right-4 @xl:left-auto @xl:right-6 @xl:w-80 max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-2"
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Published versions</p>
                <button onClick={() => setHistoryOpen(false)} aria-label="Close history" className="p-2 -mr-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              {draft.hasDraft && (
                <button
                  onClick={() => setConfirmDiscard(true)}
                  className="w-full text-left px-2 py-2.5 mb-1 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Discard the draft and go back to the live version
                </button>
              )}
              {draft.versions.length === 0 ? (
                <p className="px-2 py-3 text-sm text-gray-500 dark:text-zinc-400">Nothing published yet. Each Publish is kept here (the last 10).</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {draft.versions.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-3 px-2 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                          {versionTitle(v)}
                          {v.live && <span className="rounded-full bg-green-100 dark:bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">Live</span>}
                        </p>
                        {v.publishedBy && <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{v.publishedBy}</p>}
                      </div>
                      <button
                        onClick={() => setRestoreTarget(v)}
                        className="shrink-0 min-h-11 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button onClick={saveNow} disabled={anyBusy || !hasChanges} className={secondaryButton}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : saved && !hasChanges ? <Check className="w-4 h-4" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
          Save<span className="hidden @xl:inline"> Draft</span>
        </button>

        <button
          onClick={() => setConfirmPublish(true)}
          disabled={!canPublish}
          className={`flex flex-1 @xl:flex-none justify-center items-center gap-2 min-h-11 px-3 @xl:px-5 py-2.5 rounded-lg transition-colors ${
            !canPublish
              ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
              : 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200'
          }`}
        >
          {draft.publishing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
          Publish
        </button>
      </div>

      </div>

      {/* Through a portal: the bar's backdrop-blur would trap `fixed` modals inside it. */}
      {typeof document !== 'undefined' && createPortal(<>
      <AdminModal
        isOpen={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={publish}
        title="Publish to the live website?"
        message="Guests will see these changes right away. The version live now stays in History, so you can bring it back."
        type="confirm"
        variant="info"
        confirmText="Publish"
      />
      <AdminModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={restore}
        title="Load this version?"
        message={`The form will show the version from ${restoreTarget ? versionTitle(restoreTarget) : ''} in place of your current edits. Nothing goes live until you publish.`}
        type="confirm"
        variant="warning"
        confirmText="Load version"
      />
      <AdminModal
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discard}
        title="Discard the draft?"
        message="Your unpublished changes on this tab are deleted and the editor shows the live version again. This cannot be undone."
        type="confirm"
        variant="danger"
        confirmText="Discard draft"
      />
      <AdminModal
        isOpen={!!draft.conflict}
        onClose={() => draft.resolveConflict(false)}
        onConfirm={() => draft.resolveConflict(true)}
        title="Changed somewhere else"
        message={
          draft.conflict?.updatedAt
            ? `This draft was saved${draft.conflict.updatedBy ? ` by ${draft.conflict.updatedBy}` : ''} on ${when(draft.conflict.updatedAt)}, after you opened it (another tab or admin). Replace it with your edits?`
            : 'This tab was published or its draft discarded somewhere else (another tab or admin) after you opened it. Save your edits as a new draft anyway?'
        }
        type="confirm"
        variant="warning"
        confirmText="Use my edits"
        cancelText="Cancel"
      />
      </>, document.body)}
    </div>
  );
}
