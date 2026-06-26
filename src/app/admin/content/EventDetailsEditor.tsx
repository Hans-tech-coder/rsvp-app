'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Check, RotateCcw, History } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';

export function EventDetailsEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // State for the form fields
  const [data, setData] = useState({ ...weddingContent.details });
  const [originalData, setOriginalData] = useState({ ...weddingContent.details });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'websiteContent', 'details');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          const mergedData = {
            header: {
              ...(weddingContent.details.header || { subtitle: "The Celebration", title: "Where & When", description: "A breathtaking romance in Paniqui, Tarlac." }),
              ...(fetchedData.header || {})
            },
            ceremony: {
              ...weddingContent.details.ceremony,
              ...(fetchedData.ceremony || {})
            },
            reception: {
              ...weddingContent.details.reception,
              ...(fetchedData.reception || {})
            }
          };
          setData(mergedData);
          setOriginalData(mergedData);
        }

        const backupRef = doc(db, 'websiteContent', 'details_backup');
        const backupSnap = await getDoc(backupRef);
        if (backupSnap.exists()) {
          setHasBackup(true);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSectionChange = (section: 'ceremony' | 'reception', e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const backupRef = doc(db, 'websiteContent', 'details_backup');
      await setDoc(backupRef, originalData, { merge: true });

      const docRef = doc(db, 'websiteContent', 'details');
      await setDoc(docRef, data, { merge: true });
      
      setOriginalData(data);
      setHasBackup(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setShowConfirmModal(false);
    } catch (error: any) {
      console.error("Error saving content:", error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    setData(originalData);
    setSaved(false);
  };

  const handleRestoreBackup = async () => {
    setIsRestoreModalOpen(true);
  };

  const executeRestore = async () => {
    setRestoring(true);
    setIsRestoreModalOpen(false);
    try {
      const backupRef = doc(db, 'websiteContent', 'details_backup');
      const backupSnap = await getDoc(backupRef);
      if (backupSnap.exists()) {
        const fetchedBackup = backupSnap.data();
        const mergedData = {
          header: {
            ...(weddingContent.details.header || { subtitle: "The Celebration", title: "Where & When", description: "A breathtaking romance in Paniqui, Tarlac." }),
            ...(fetchedBackup.header || {})
          },
          ceremony: {
            ...weddingContent.details.ceremony,
            ...(fetchedBackup.ceremony || {})
          },
          reception: {
            ...weddingContent.details.reception,
            ...(fetchedBackup.reception || {})
          }
        };
        setData(mergedData);
        setIsSuccessModalOpen(true);
      }
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      alert(`Failed to restore backup: ${error.message}`);
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

  const renderSection = (title: string, section: 'ceremony' | 'reception') => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Card Subtitle (e.g., The Vows)</label>
            <input 
              type="text" 
              name="subtitle"
              value={data[section].subtitle || ""}
              onChange={(e) => handleSectionChange(section, e)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
            <input 
              type="text" 
              name="title"
              value={data[section].title}
              onChange={(e) => handleSectionChange(section, e)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
          <textarea 
            name="description"
            value={data[section].description}
            onChange={(e) => handleSectionChange(section, e)}
            rows={4}
            className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Map Link URL</label>
            <input 
              type="text" 
              name="mapLink"
              value={data[section].mapLink}
              onChange={(e) => handleSectionChange(section, e)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Calendar Link: Location</label>
            <input 
              type="text" 
              name="calendarLoc"
              value={data[section].calendarLoc}
              onChange={(e) => handleSectionChange(section, e)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Calendar Link: Description</label>
            <input 
              type="text" 
              name="calendarDesc"
              value={data[section].calendarDesc}
              onChange={(e) => handleSectionChange(section, e)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Calendar Start (YYYY-MM-DDTHH:mm:ss)</label>
            <input 
              type="text" 
              name="calendarStart"
              value={data[section].calendarStart}
              onChange={(e) => handleSectionChange(section, e)}
              placeholder="e.g. 2026-12-20T15:00:00"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all font-mono text-sm"
            />
          </div>
        </div>
        
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg mt-2">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Time, Location, and Address fields are edited in the <strong>Global Settings</strong> tab to ensure they match everywhere on the site.
          </p>
        </div>
      </div>
    </div>
  );

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      header: {
        ...prev.header,
        [name]: value
      }
    }));
    setSaved(false);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Header Content</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle</label>
              <input 
                type="text" 
                name="subtitle"
                value={data.header?.subtitle || ""}
                onChange={handleHeaderChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
              <input 
                type="text" 
                name="title"
                value={data.header?.title || ""}
                onChange={handleHeaderChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
            <textarea 
              name="description"
              value={data.header?.description || ""}
              onChange={handleHeaderChange}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {renderSection('Ceremony Details', 'ceremony')}
      
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      
      {renderSection('Reception Details', 'reception')}

      <div className="pt-4 flex justify-between items-center gap-3 flex-wrap">
        <div>
          {hasBackup && (
            <button
              onClick={handleRestoreBackup}
              disabled={saving || restoring}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
            >
              {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
              Restore Previous Save
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {JSON.stringify(data) !== JSON.stringify(originalData) && (
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Undo Changes
            </button>
          )}
          <button
          onClick={() => setShowConfirmModal(true)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <AdminModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={executeRestore}
        title="Restore Previous Save"
        message="Are you sure you want to load the previous save? This will overwrite your current unsaved changes in the editor."
        type="confirm"
        variant="warning"
        confirmText="Yes, restore it"
      />

      <AdminModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Restore Loaded"
        message="Previous save loaded into the editor! Review the changes, then click 'Save Changes' to publish them to the live site."
        type="alert"
        variant="success"
      />

      <AdminModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
        title="Publish Changes?"
        message="This will update the Event Details section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
