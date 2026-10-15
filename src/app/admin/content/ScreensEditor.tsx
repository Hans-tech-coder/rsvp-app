'use client';

import { useState, useEffect } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc } from 'firebase/firestore';
import { DEFAULT_SCREENS, mergeScreens, type ScreenConfig, type ScreensDoc } from '@/lib/screens';
import { DEFAULT_SITE_TEXT, mergeSiteText } from '@/lib/siteText';
import { ScreenList } from '../components/ScreenList';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';

// Which screens guests see, their order and their names in the menu
// (`content/screens`). Read on the server and walked by src/app/[event]/GuestSite.tsx.
export function ScreensEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'screens');
  const loadDraft = draft.load;
  const [defaultLabels, setDefaultLabels] = useState(DEFAULT_SITE_TEXT.menu);

  const [formData, setFormData] = useState<ScreenConfig[]>(DEFAULT_SCREENS);
  const [originalData, setOriginalData] = useState<ScreenConfig[]>(DEFAULT_SCREENS);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, siteTextSnap] = await Promise.all([
          loadDraft(),
          getDoc(doc(db, paths.content(eventId, 'siteText'))),
        ]);
        if (data) {
          const fetchedData = mergeScreens(data);
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }
        // Blank names fall back to the site text menu names, as on the guest site.
        setDefaultLabels(mergeSiteText(DEFAULT_SITE_TEXT, siteTextSnap.data()).menu);
      } catch (error) {
        console.error('Error fetching screens:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId, loadDraft]);

  const handleChange = (screens: ScreenConfig[]) => {
    setFormData(screens);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = mergeScreens({ screens: formData });
      const toDoc = (screens: ScreenConfig[]): ScreensDoc => ({ screens });
      if (!(await draft.save(toDoc(next), { merge: false }))) return false;

      setFormData(next);
      setOriginalData(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (error) {
      console.error('Error saving screens:', error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : error}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (data: DocumentData) => {
    setFormData(mergeScreens(data));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isShown = (type: ScreenConfig['type']) => formData.some((s) => s.type === type && s.enabled);
  const ctaLeadsNowhere = isShown('rsvpCta') && !isShown('rsvp');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Screens</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Guests go through the shown screens from top to bottom. Drag a screen or use the arrows to change the order, switch one off to hide it from the site and the menu, and rename it in the menu. Leave a name blank to keep the one in grey.
        </p>
      </div>

      {ctaLeadsNowhere && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-300">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          The RSVP Form is hidden, but the RSVP Call to Action still asks guests to reply. Hide both, or show the form.
        </p>
      )}

      <ScreenList screens={formData} onChange={handleChange} defaultLabels={defaultLabels} />

      <EditorSaveBar draft={draft} hasChanges={hasChanges} saving={saving} saved={saved} onUndo={() => { setFormData(originalData); setSaved(false); }} onRestore={handleRestore} onSave={handleSave} />
    </div>
  );
}
