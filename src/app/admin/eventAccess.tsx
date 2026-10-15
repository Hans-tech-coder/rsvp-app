'use client';

import { createContext, useContext } from 'react';
import type { AccessRole, EventAccess } from '@/lib/permissions';

// The event being edited (picked in the event switcher) and the signed-in
// account's role in it, read by the server admin layout (layout.tsx). UI only,
// to hide or disable what the role may not change (src/lib/permissions.ts);
// every server action checks again. Null on the login page and for an
// account with no event to open.
export type MyEventAccess = { eventId: string; role: AccessRole; clientDesign: boolean; email: string | null };

const EventAccessContext = createContext<MyEventAccess | null>(null);

export const EventAccessProvider = EventAccessContext.Provider;

/** The current event's ID, or null when there is none (the page then shows the events list link). */
export function useCurrentEventId(): string | null {
  return useContext(EventAccessContext)?.eventId ?? null;
}

/** Least access when there is none, so locked controls never show for a client. */
const LOADING: EventAccess = { role: 'client', clientDesign: false };

export function useEventAccess(): { access: MyEventAccess | null; rules: EventAccess } {
  const access = useContext(EventAccessContext);
  return { access, rules: access ?? LOADING };
}
