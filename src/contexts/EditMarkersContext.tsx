'use client';

import { createContext, useContext } from 'react';

// On only in the admin draft preview (GuestSite's `preview`): screens mark
// their editable texts with `data-field="<editor input name>"`, so a click in
// the visual builder's preview opens that field. The live site gets no markers.
const EditMarkersContext = createContext(false);

export const EditMarkersProvider = EditMarkersContext.Provider;

/** `{...field('subtitle')}` on an element: its editor field, in the preview only. */
export function useFieldMarker() {
  const on = useContext(EditMarkersContext);
  return (name: string) => (on ? { 'data-field': name } : {});
}
