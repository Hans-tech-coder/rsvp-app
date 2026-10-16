'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildEventSite, type SiteDocs } from '@/lib/eventSite';
import type { ContentDefaults } from '@/lib/contentMerge';
import { mergeDoc, type DocData } from '@/lib/contentDrafts';
import { readBuilderMessage, type PreviewMessage } from '@/lib/builderMessages';
import { SCREEN_NAMES } from '@/lib/screens';
import { EventSite } from '../EventSite';

// The draft preview, built in the browser from the event's raw docs so the
// visual builder (src/app/admin/builder) can change it live: once the builder
// says `init`, its edits re-render the site, hovering outlines the section
// (or text) under the pointer, and a click there selects it in the builder.
// Without the builder (the content page's preview) it is the plain draft site.

const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], [role="switch"]';

type Outline = { top: number; left: number; width: number; height: number; label: string; field: boolean };

function sectionName(section: string) {
  return section === 'entrance' ? 'Invite code screen' : (SCREEN_NAMES as Record<string, string>)[section] ?? section;
}

export function PreviewSite({ eventId, docs: initialDocs, defaults }: { eventId: string; docs: SiteDocs; defaults: ContentDefaults }) {
  const [docs, setDocs] = useState(initialDocs);
  const gotoListeners = useRef(new Set<(section: string) => void>());
  const [builder, setBuilder] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const site = useMemo(() => buildEventSite(docs, defaults), [docs, defaults]);
  const preview = useMemo(() => ({
    onGoto: (listener: (section: string) => void) => {
      gotoListeners.current.add(listener);
      return () => { gotoListeners.current.delete(listener); };
    },
  }), []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = readBuilderMessage(event);
      if (!message) return;
      if (message.type === 'builder:init') setBuilder(true);
      if (message.type === 'builder:goto') gotoListeners.current.forEach((go) => go(message.section));
      if (message.type === 'builder:doc') {
        const { docId, data, merge } = message;
        setDocs((prev) => ({ ...prev, [docId]: merge ? mergeDoc((prev[docId] ?? {}) as DocData, data) : data }));
      }
    };
    window.addEventListener('message', onMessage);
    // Inside the builder (or any admin page's frame): ask for its state.
    if (window.parent !== window) {
      const ready: PreviewMessage = { type: 'preview:ready' };
      window.parent.postMessage(ready, window.location.origin);
    }
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!builder) return;
    const target = (e: Event) => {
      const el = e.target instanceof Element ? e.target : null;
      const section = el?.closest<HTMLElement>('[data-section]');
      if (!el || !section) return null;
      const field = el.closest<HTMLElement>('[data-field]');
      return { section, field: field && section.contains(field) ? field : null };
    };

    const onMove = (e: PointerEvent) => {
      const hit = target(e);
      if (!hit) return setOutline(null);
      const box = (hit.field ?? hit.section).getBoundingClientRect();
      const name = sectionName(hit.section.dataset.section!);
      setOutline({ top: box.top, left: box.left, width: box.width, height: box.height, label: hit.field ? `${name}: text` : name, field: !!hit.field });
    };
    const onLeave = () => setOutline(null);

    // A click on a button or link still works (Continue, the menu); anywhere
    // else it selects what is under the pointer.
    const onClick = (e: MouseEvent) => {
      const hit = target(e);
      if (!hit || (e.target as Element).closest(INTERACTIVE)) return;
      e.preventDefault();
      e.stopPropagation();
      const message: PreviewMessage = {
        type: 'preview:select',
        section: hit.section.dataset.section!,
        field: hit.field?.dataset.field ?? null,
      };
      window.parent.postMessage(message, window.location.origin);
    };

    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('click', onClick, true);
    };
  }, [builder]);

  return (
    <>
      <EventSite eventId={eventId} site={site} preview={preview} />
      {builder && outline && (
        <div
          aria-hidden="true"
          className="fixed z-[9998] pointer-events-none rounded-sm outline-2 -outline-offset-2 outline-dashed outline-sky-500"
          style={{ top: outline.top, left: outline.left, width: outline.width, height: outline.height }}
        >
          {/* A text's label sits above it; a whole section's inside, at the bottom. */}
          <span className={`absolute ${outline.field ? 'left-0 bottom-full mb-1' : 'left-2 bottom-2'} whitespace-nowrap rounded bg-sky-600 px-2 py-1 font-sans text-[11px] font-semibold text-white shadow`}>
            {outline.label} · click to edit
          </span>
        </div>
      )}
    </>
  );
}
