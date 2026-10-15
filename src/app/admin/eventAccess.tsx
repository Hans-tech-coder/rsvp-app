'use client';

import { createContext, useContext } from 'react';
import type { AccessRole, EventAccess } from '@/lib/permissions';

// The signed-in account's role in the event being edited, loaded once by the
// admin layout (getMyEventAccess). UI only, to hide or disable what the role
// may not change (src/lib/permissions.ts); every server action checks again.
export type MyEventAccess = { role: AccessRole; clientDesign: boolean; email: string | null };

const EventAccessContext = createContext<MyEventAccess | null>(null);

export const EventAccessProvider = EventAccessContext.Provider;

/** Least access until the layout has loaded it, so locked controls never flash for a client. */
const LOADING: EventAccess = { role: 'client', clientDesign: false };

export function useEventAccess(): { access: MyEventAccess | null; rules: EventAccess } {
  const access = useContext(EventAccessContext);
  return { access, rules: access ?? LOADING };
}
