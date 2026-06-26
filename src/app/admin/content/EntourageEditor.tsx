'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Check, RotateCcw, History, Plus, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';

export function EntourageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // State for the form fields
  const [data, setData] = useState({ ...weddingContent.entourage });
  const [originalData, setOriginalData] = useState({ ...weddingContent.entourage });

  const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'websiteContent', 'entourage');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          const mergedData = {
            subtitle: fetchedData.subtitle ?? weddingContent.entourage.subtitle,
            title: fetchedData.title ?? weddingContent.entourage.title,
            principalSponsors: fetchedData.principalSponsors ?? weddingContent.entourage.principalSponsors,
            honorAttendants: fetchedData.honorAttendants ?? weddingContent.entourage.honorAttendants,
            bridesmaids: fetchedData.bridesmaids ?? weddingContent.entourage.bridesmaids,
            groomsmen: fetchedData.groomsmen ?? weddingContent.entourage.groomsmen
          };
          setData(mergedData);
          setOriginalData(mergedData);
        }

        const backupRef = doc(db, 'websiteContent', 'entourage_backup');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleHonorAttendantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      honorAttendants: {
        ...prev.honorAttendants,
        [name]: value
      }
    }));
    setSaved(false);
  };

  const handleArrayChange = (arrayName: 'principalSponsors' | 'bridesmaids' | 'groomsmen', index: number, value: string) => {
    setData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = value;
      return { ...prev, [arrayName]: newArray };
    });
    setSaved(false);
  };

  const addArrayItem = (arrayName: 'principalSponsors' | 'bridesmaids' | 'groomsmen') => {
    setData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], ""]
    }));
    setSaved(false);
  };

  const removeArrayItem = (arrayName: 'principalSponsors' | 'bridesmaids' | 'groomsmen', index: number) => {
    setData(prev => {
      const newArray = [...prev[arrayName]];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const backupRef = doc(db, 'websiteContent', 'entourage_backup');
      await setDoc(backupRef, originalData, { merge: true });

      const docRef = doc(db, 'websiteContent', 'entourage');
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
      const backupRef = doc(db, 'websiteContent', 'entourage_backup');
      const backupSnap = await getDoc(backupRef);
      if (backupSnap.exists()) {
        const fetchedBackup = backupSnap.data();
        const mergedData = {
          subtitle: fetchedBackup.subtitle ?? weddingContent.entourage.subtitle,
          title: fetchedBackup.title ?? weddingContent.entourage.title,
          principalSponsors: fetchedBackup.principalSponsors ?? weddingContent.entourage.principalSponsors,
          honorAttendants: fetchedBackup.honorAttendants ?? weddingContent.entourage.honorAttendants,
          bridesmaids: fetchedBackup.bridesmaids ?? weddingContent.entourage.bridesmaids,
          groomsmen: fetchedBackup.groomsmen ?? weddingContent.entourage.groomsmen
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

  const renderArraySection = (title: string, arrayName: 'principalSponsors' | 'bridesmaids' | 'groomsmen') => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
        <button
          onClick={() => addArrayItem(arrayName)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data[arrayName].map((item, index) => (
          <div key={index} className="flex gap-2">
            <input 
              type="text" 
              value={item}
              onChange={(e) => handleArrayChange(arrayName, index, e.target.value)}
              className="flex-1 px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <button
              onClick={() => removeArrayItem(arrayName, index)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {data[arrayName].length === 0 && (
          <div className="col-span-full text-center py-8 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500">
            No {title.toLowerCase()} added yet.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Header Content</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle</label>
            <input 
              type="text" 
              name="subtitle"
              value={data.subtitle}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
            <input 
              type="text" 
              name="title"
              value={data.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Honor Attendants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Maid of Honor</label>
            <input 
              type="text" 
              name="maidOfHonor"
              value={data.honorAttendants.maidOfHonor}
              onChange={handleHonorAttendantChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Best Man</label>
            <input 
              type="text" 
              name="bestMan"
              value={data.honorAttendants.bestMan}
              onChange={handleHonorAttendantChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {renderArraySection("Principal Sponsors", "principalSponsors")}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Bridesmaids", "bridesmaids")}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Groomsmen", "groomsmen")}

      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-gray-200 dark:border-zinc-800 mt-12">
        <div className="flex w-full sm:w-auto items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Undo Changes
            </button>
          )}
          {hasBackup && (
            <button
              onClick={() => setIsRestoreModalOpen(true)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <History className="w-4 h-4" />
              Restore Previous Save
            </button>
          )}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors ${
              !hasChanges 
                ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                : 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200'
            }`}
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
        title="Restore Previous Save?"
        message="This will replace all your current edits with the last saved version. This action cannot be undone."
        type="confirm"
        variant="warning"
        confirmText={restoring ? "Restoring..." : "Yes, Restore"}
      />

      <AdminModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onConfirm={() => setIsSuccessModalOpen(false)}
        title="Restored Successfully"
        message="The previous save has been successfully restored."
        type="alert"
        variant="success"
        confirmText="Got it"
      />

      <AdminModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
        title="Publish Changes?"
        message="This will update the Entourage section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
