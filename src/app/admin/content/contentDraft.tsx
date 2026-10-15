'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { discardDraft, getVersion, loadDraft, publishDraft, saveDraft } from '@/app/actions/content';
import type { DocumentData } from 'firebase/firestore';
import type { DocData, EditableDocId, VersionInfo } from '@/lib/contentDrafts';

// Draft / publish / versions for one content editor (F9). The editor keeps
// its own form state; this hook talks to src/app/actions/content.ts and holds
// what EditorSaveBar shows (draft saved?, versions, conflicts).

/** What the content page offers every editor: refresh the preview, reload the editor. */
type ContentPageHooks = { refreshPreview: () => void; reloadEditor: () => void };
const ContentPageContext = createContext<ContentPageHooks>({ refreshPreview: () => {}, reloadEditor: () => {} });
export const ContentPageProvider = ContentPageContext.Provider;

export type Conflict = { updatedAt: number | null; updatedBy: string | null };

export function useContentDraft(eventId: string, docId: EditableDocId) {
  const page = useContext(ContentPageContext);
  // The draft's updatedAt as this editor last saw it (null = no draft).
  const updatedAt = useRef<number | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const answerConflict = useRef<((overwrite: boolean) => void) | null>(null);

  /** The doc to edit: the draft, else the live doc, else null (use the defaults). */
  const load = useCallback(async (): Promise<DocumentData | null> => {
    const result = await loadDraft(eventId, docId);
    if (!result.success) throw new Error(result.error);
    updatedAt.current = result.updatedAt;
    setHasDraft(result.hasDraft);
    setVersions(result.versions);
    return result.data;
  }, [eventId, docId]);

  /**
   * Saves the editor's doc as the draft. `merge`: the editor sends only its
   * fields (as with `setDoc(…, { merge: true })`). Resolves false when the
   * admin chose not to overwrite a draft saved elsewhere; throws on failure.
   */
  const save = useCallback(async (data: DocData, { merge }: { merge: boolean }): Promise<boolean> => {
    let result = await saveDraft(eventId, docId, data, { merge, expectedUpdatedAt: updatedAt.current });
    if (!result.success && 'conflict' in result) {
      const found = result.conflict;
      const overwrite = await new Promise<boolean>((resolve) => {
        answerConflict.current = resolve;
        setConflict(found);
      });
      setConflict(null);
      if (!overwrite) return false;
      result = await saveDraft(eventId, docId, data, { merge, expectedUpdatedAt: updatedAt.current, force: true });
    }
    if (!result.success) throw new Error('error' in result ? result.error : 'Failed to save the draft');
    updatedAt.current = result.updatedAt;
    setHasDraft(true);
    setVersions(result.versions);
    setPublished(false);
    page.refreshPreview();
    return true;
  }, [eventId, docId, page]);

  const resolveConflict = useCallback((overwrite: boolean) => {
    answerConflict.current?.(overwrite);
    answerConflict.current = null;
  }, []);

  /** Makes the saved draft live. Throws on failure. */
  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      const result = await publishDraft(eventId, docId);
      if (!result.success) throw new Error(result.error);
      updatedAt.current = null;
      setHasDraft(false);
      setVersions(result.versions);
      setPublished(true);
      setTimeout(() => setPublished(false), 4000);
      page.refreshPreview();
    } finally {
      setPublishing(false);
    }
  }, [eventId, docId, page]);

  /** Drops the draft and reloads the editor from the live doc. Throws on failure. */
  const discard = useCallback(async () => {
    const result = await discardDraft(eventId, docId);
    if (!result.success) throw new Error(result.error);
    page.refreshPreview();
    page.reloadEditor();
  }, [eventId, docId, page]);

  /** One version's doc, to load into the form (Restore). Throws on failure. */
  const fetchVersion = useCallback(async (versionId: string): Promise<DocumentData> => {
    const result = await getVersion(eventId, docId, versionId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  }, [eventId, docId]);

  return {
    load, save, publish, discard, fetchVersion, resolveConflict,
    hasDraft, versions, publishing, published, conflict,
  };
}

export type ContentDraft = ReturnType<typeof useContentDraft>;
