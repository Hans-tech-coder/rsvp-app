'use client';

import { useState, useEffect } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_SCREENS, mergeScreens, type ScreenConfig, type ScreensDoc } from '@/lib/screens';
import { DEFAULT_SITE_TEXT, mergeSiteText } from '@/lib/siteText';
import { refreshGuestSite } from './refreshGuestSite';
import { AdminModal } from '../components/AdminModal';
import { ScreenList } from '../components/ScreenList';
import { EditorSaveBar } from './EditorSaveBar';

// Which screens guests see, their order and their names in the menu
// (`content/screens`). Read on the server and walked by src/app/[event]/GuestSite.tsx.
export function ScreensEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [defaultLabels, setDefaultLabels] = useState(DEFAULT_SITE_TEXT.menu);

  const [formData, setFormData] = useState<ScreenConfig[]>(DEFAULT_SCREENS);
  const [originalData, setOriginalData] = useState<ScreenConfig[]>(DEFAULT_SCREENS);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docSnap, backupSnap, siteTextSnap] = await Promise.all([
          getDoc(doc(db, paths.content(eventId, 'screens'))),
          getDoc(doc(db, paths.content(eventId, 'screens_backup'))),
          getDoc(doc(db, paths.content(eventId, 'siteText'))),
        ]);
        if (docSnap.exists()) {
          const fetchedData = mergeScreens(docSnap.data());
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }
        if (backupSnap.exists()) setHasBackup(true);
        // Blank names fall back to the site text menu names, as on the guest site.
        setDefaultLabels(mergeSiteText(DEFAULT_SITE_TEXT, siteTextSnap.data()).menu);
      } catch (error) {
        console.error('Error fetching screens:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const handleChange = (screens: ScreenConfig[]) => {
    setFormData(screens);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = mergeScreens({ screens: formData });
      const toDoc = (screens: ScreenConfig[]): ScreensDoc => ({ screens });
      await setDoc(doc(db, paths.content(eventId, 'screens_backup')), toDoc(originalData));
      await setDoc(doc(db, paths.content(eventId, 'screens')), toDoc(next));
      await refreshGuestSite(eventId);

      setFormData(next);
      setOriginalData(next);
      setHasBackup(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error saving screens:', error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : error}`);
    } finally {
      setSaving(false);
    }
  };

  const executeRestore = async () => {
    setRestoring(true);
    setIsRestoreModalOpen(false);
    try {
      const backupSnap = await getDoc(doc(db, paths.content(eventId, 'screens_backup')));
      if (backupSnap.exists()) {
        setFormData(mergeScreens(backupSnap.data()));
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('Error restoring screens backup:', error);
      alert(`Failed to restore backup: ${error instanceof Error ? error.message : error}`);
    } finally {
      setRestoring(false);
    }
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

      <EditorSaveBar hasChanges={hasChanges} saving={saving} saved={saved} hasBackup={hasBackup} onUndo={() => { setFormData(originalData); setSaved(false); }} onRestore={() => setIsRestoreModalOpen(true)} onSave={() => setShowConfirmModal(true)} />

      <AdminModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={executeRestore}
        title="Restore Previous Save?"
        message="This will replace all your current edits with the last saved version. This action cannot be undone."
        type="confirm"
        variant="warning"
        confirmText={restoring ? 'Restoring...' : 'Yes, Restore'}
      />

      <AdminModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onConfirm={() => setIsSuccessModalOpen(false)}
        title="Restored Successfully"
        message="The previous save has been loaded. Press Save to make it live."
        type="alert"
        variant="success"
        confirmText="Got it"
      />

      <AdminModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
        title="Publish Changes?"
        message="This will change the website's screens and menu immediately. A backup of the current screen settings will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
