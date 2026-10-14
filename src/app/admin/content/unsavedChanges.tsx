'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminModal } from '../components/AdminModal';

// Editors report whether they hold unsaved edits (through EditorSaveBar); the
// content page asks before anything would throw those edits away.
const UnsavedChangesContext = createContext<(dirty: boolean) => void>(() => {});

export const UnsavedChangesProvider = UnsavedChangesContext.Provider;

export function useReportUnsavedChanges(dirty: boolean) {
  const setDirty = useContext(UnsavedChangesContext);
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
}

// Guards the three ways out of an editor: another tab (`guard`), a link to
// another admin page (click intercepted), and closing or reloading the page
// (browser's own prompt). Render `dialog` once.
export function useUnsavedChangesGuard() {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);

  const guard = useCallback(
    (leave: () => void) => {
      if (dirty) setPendingLeave(() => leave);
      else leave();
    },
    [dirty],
  );

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Capture on window runs before Next's <Link> handler, so the navigation
    // can be held until the admin confirms.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingLeave(() => () => router.push(url.pathname + url.search + url.hash));
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('click', onClick, true);
    };
  }, [dirty, router]);

  const dialog = (
    <AdminModal
      isOpen={pendingLeave !== null}
      onClose={() => setPendingLeave(null)}
      onConfirm={() => {
        const leave = pendingLeave;
        setPendingLeave(null);
        setDirty(false);
        leave?.();
      }}
      title="Leave without saving?"
      message="You have changes on this screen that are not saved yet. If you leave now, they will be lost."
      type="confirm"
      variant="warning"
      confirmText="Leave without saving"
      cancelText="Keep editing"
    />
  );

  return { setDirty, guard, dialog };
}
