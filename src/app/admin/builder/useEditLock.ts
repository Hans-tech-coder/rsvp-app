'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { holdEditLock, releaseEditLock, type EditLockState } from '@/app/actions/editLock';

// The builder's side of the edit lock (src/app/actions/editLock.ts): claims
// it on open, renews it every HEARTBEAT_MS, frees it on close (a beacon to
// src/app/api/edit-lock/release when the tab closes). While someone
// else holds it the builder is blocked and offers "Take over"; a blocked tab
// keeps asking, so it gets the lock once the other one goes quiet. Only where
// the builder can be used (tablet and wider), so a phone that opens the page
// never blocks anyone.

const HEARTBEAT_MS = 30_000;
const WIDE = '(min-width: 768px)';
const RELEASE_URL = '/api/edit-lock/release';

export type EditLockStatus =
  | { state: 'checking' }
  | { state: 'held' }
  | { state: 'blocked'; by: string | null; sameUser: boolean; lost: boolean }
  | { state: 'error' };

function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(WIDE);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

/** `onLost` runs when another tab takes the lock from this one (save open edits). */
export function useEditLock(eventId: string, onLost: () => void) {
  const enabled = useWide();
  const [holder] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<EditLockStatus>({ state: 'checking' });
  const held = useRef(false);
  const onLostRef = useRef(onLost);
  useEffect(() => {
    onLostRef.current = onLost;
  });

  const apply = useCallback((result: EditLockState) => {
    if (!result.success) {
      // A failed heartbeat (offline for a moment) keeps the lock; a failed first check is shown.
      if (!held.current) setStatus({ state: 'error' });
      return;
    }
    if (result.held) {
      held.current = true;
      setStatus({ state: 'held' });
      return;
    }
    const lost = held.current;
    held.current = false;
    if (lost) onLostRef.current();
    setStatus({ state: 'blocked', by: result.by, sameUser: result.sameUser, lost });
  }, []);

  const check = useCallback(
    (takeOver: boolean) => holdEditLock(eventId, holder, takeOver)
      .catch((): EditLockState => ({ success: false, error: 'Offline' }))
      .then(apply),
    [eventId, holder, apply],
  );

  useEffect(() => {
    if (!enabled) return;
    check(false);
    const timer = setInterval(() => check(false), HEARTBEAT_MS);
    // Closing the tab or leaving the site: a beacon, since a server action
    // call is cancelled while the page unloads. Coming back (back / forward
    // cache) claims the free lock again on the next check.
    const onPageHide = () => {
      if (!held.current) return;
      held.current = false;
      navigator.sendBeacon(RELEASE_URL, new Blob([JSON.stringify({ eventId, holder })], { type: 'application/json' }));
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      // Leaving the builder inside the admin: the page is still alive.
      clearInterval(timer);
      window.removeEventListener('pagehide', onPageHide);
      if (held.current) releaseEditLock(eventId, holder);
      held.current = false;
    };
  }, [enabled, check, eventId, holder]);

  const takeOver = useCallback(() => {
    setStatus({ state: 'checking' });
    return check(true);
  }, [check]);

  const retry = useCallback(() => {
    setStatus({ state: 'checking' });
    return check(false);
  }, [check]);

  return { status: enabled ? status : ({ state: 'held' } as EditLockStatus), takeOver, retry };
}
