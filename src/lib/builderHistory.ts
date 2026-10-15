// The visual builder's undo / redo (F9a): one in-memory history across every
// editor panel, never saved (reload = empty; drafts and History cover that).
// Pure, so it is tested (builderHistory.test.ts).
//
// - Each entry is one doc going from `before` to `after`.
// - Consecutive edits to the same field of the same doc merge into one entry,
//   so typing a word is one undo, not one per letter.
// - A new edit after an undo drops the redo entries.

import { stableStringify, type DocData, type EditableDocId } from './contentDrafts';

export type HistoryEntry = { docId: EditableDocId; before: DocData; after: DocData; field: string };

/** `index` = how many entries are applied; undo steps back over entries[index - 1]. */
export type BuilderHistory = { entries: HistoryEntry[]; index: number };

export const EMPTY_HISTORY: BuilderHistory = { entries: [], index: 0 };

export const MAX_HISTORY = 100;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Dotted path of the first place two docs differ (`items.2.q`), '' for the
 * whole value, null when they are equal. A list that grew or shrank differs
 * at the list itself.
 */
export function firstDifference(a: unknown, b: unknown, path = ''): string | null {
  if (stableStringify(a) === stableStringify(b)) return null;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    for (let i = 0; i < a.length; i++) {
      const found = firstDifference(a[i], b[i], path ? `${path}.${i}` : `${i}`);
      if (found !== null) return found;
    }
  }
  if (isObject(a) && isObject(b)) {
    for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
      const found = firstDifference(a[key], b[key], path ? `${path}.${key}` : key);
      if (found !== null) return found;
    }
  }
  return path;
}

/** Adds an edit of one doc; returns the same history when nothing changed. */
export function recordEdit(history: BuilderHistory, docId: EditableDocId, before: DocData, after: DocData): BuilderHistory {
  const field = firstDifference(before, after);
  if (field === null) return history;
  const kept = history.entries.slice(0, history.index);
  const last = kept[kept.length - 1];
  if (last && last.docId === docId && last.field === field) {
    kept[kept.length - 1] = { ...last, after };
    return { entries: kept, index: kept.length };
  }
  const entries = [...kept, { docId, before, after, field }].slice(-MAX_HISTORY);
  return { entries, index: entries.length };
}

/** The entry to undo (load its `before`), or null. */
export const undoEntry = (h: BuilderHistory) => (h.index > 0 ? h.entries[h.index - 1] : null);

/** The entry to redo (load its `after`), or null. */
export const redoEntry = (h: BuilderHistory) => (h.index < h.entries.length ? h.entries[h.index] : null);
