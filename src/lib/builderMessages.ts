// What the visual builder (src/app/admin/builder) and its draft preview
// (src/app/[event]/preview/PreviewSite.tsx) say to each other by postMessage.
// Same origin only; the preview listens only after the builder's `init`, so
// the content page's plain preview and the live site never use any of it.

import type { DocData, EditableDocId } from './contentDrafts';

/** A guest screen type, or `entrance` (the invite-code screen, not a step). */
export type SectionId = string;

export type BuilderMessage =
  /** Turns on hover outlines and click-to-select. */
  | { type: 'builder:init' }
  /** The doc as the open editor would save it now (unsaved edits included). */
  | { type: 'builder:doc'; docId: EditableDocId; data: DocData; merge: boolean }
  /** Show this section (go to its step). */
  | { type: 'builder:goto'; section: SectionId };

export type PreviewMessage =
  /** The preview listens now: send it init, the edited docs and the section to show. */
  | { type: 'preview:ready' }
  /** The admin clicked a section (and maybe one field of it) in the preview. */
  | { type: 'preview:select'; section: SectionId; field: string | null };

/**
 * A builder message for the preview (sent by its parent page), else null.
 * Only our own origin is listened to.
 */
export function readBuilderMessage(event: MessageEvent): BuilderMessage | null {
  if (event.origin !== window.location.origin || window.parent === window || event.source !== window.parent) return null;
  const type = (event.data as { type?: unknown } | null)?.type;
  return typeof type === 'string' && type.startsWith('builder:') ? (event.data as BuilderMessage) : null;
}

/** A preview message for the builder (sent by one of its frames, same origin), else null. */
export function readPreviewMessage(event: MessageEvent): PreviewMessage | null {
  if (event.origin !== window.location.origin || !event.source) return null;
  const type = (event.data as { type?: unknown } | null)?.type;
  return typeof type === 'string' && type.startsWith('preview:') ? (event.data as PreviewMessage) : null;
}
