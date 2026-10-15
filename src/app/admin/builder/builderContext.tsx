'use client';

import { createContext, useContext } from 'react';
import type { DocumentData } from 'firebase/firestore';
import type { DocData, EditableDocId } from '@/lib/contentDrafts';

// How the content editors talk to the visual builder (F9a) through their
// EditorSaveBar. Null outside the builder (the content page), where nothing
// of this runs.

/** What the builder may do to an open editor: load a doc into its form (undo / redo), save its draft. */
export type EditorHandle = { restore: (doc: DocumentData) => void; save: () => Promise<boolean> };

export type BuilderLink = {
  /** The doc as the editor would save it now; called on load and on every edit. */
  docChanged: (docId: EditableDocId, doc: DocData, merge: boolean) => void;
  /** Called by each open editor; returns the unregister. */
  register: (docId: EditableDocId, handle: EditorHandle) => () => void;
};

const BuilderContext = createContext<BuilderLink | null>(null);

export const BuilderProvider = BuilderContext.Provider;

export const useBuilderLink = () => useContext(BuilderContext);
