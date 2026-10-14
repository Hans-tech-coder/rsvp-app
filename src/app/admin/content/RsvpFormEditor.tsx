'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { refreshGuestSite } from './refreshGuestSite';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';
import { EditorSaveBar } from './EditorSaveBar';
import { CharCount, TEXT_LIMITS } from './CharCount';

export function RsvpFormEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // State for the form fields
  const [formData, setFormData] = useState(weddingContent.rsvpForm);
  const [originalData, setOriginalData] = useState(weddingContent.rsvpForm);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, paths.content(eventId, 'rsvpForm'));
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = {
            ...weddingContent.rsvpForm,
            ...docSnap.data()
          };
          setFormData(fetchedData as typeof weddingContent.rsvpForm);
          setOriginalData(fetchedData as typeof weddingContent.rsvpForm);
        }

        const backupRef = doc(db, paths.content(eventId, 'rsvpForm_backup'));
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
  }, [eventId]);

  const handleChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create backup of current live data before saving new data
      const docRef = doc(db, paths.content(eventId, 'rsvpForm'));
      const backupRef = doc(db, paths.content(eventId, 'rsvpForm_backup'));
      
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        await setDoc(backupRef, currentDoc.data());
        setHasBackup(true);
      } else {
        // If no live data exists yet, backup the JSON defaults
        await setDoc(backupRef, weddingContent.rsvpForm);
        setHasBackup(true);
      }

      await setDoc(docRef, formData);
      await refreshGuestSite(eventId);
      setOriginalData(formData);
      setSaved(true);
      setShowConfirmModal(false);
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const backupRef = doc(db, paths.content(eventId, 'rsvpForm_backup'));
      const docRef = doc(db, paths.content(eventId, 'rsvpForm'));
      
      const backupSnap = await getDoc(backupRef);
      
      if (backupSnap.exists()) {
        const backupData = backupSnap.data() as typeof weddingContent.rsvpForm;
        await setDoc(docRef, backupData);
        await refreshGuestSite(eventId);
        setFormData(backupData);
        setOriginalData(backupData);
        setSaved(true);
        setIsRestoreModalOpen(false);
        setIsSuccessModalOpen(true);
      }
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      alert(`Failed to restore backup: ${error.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const handleUndo = () => {
    setFormData(originalData);
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-gray-500 ml-3">Loading RSVP Form content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">RSVP Form</h2>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Customize the labels, placeholders, and texts on the RSVP page</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">Screen Header</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle</label>
              <input
                maxLength={TEXT_LIMITS.heading}
                type="text"
                value={formData.header.subtitle}
                onChange={(e) => handleChange('header', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
              <CharCount value={formData.header.subtitle} max={TEXT_LIMITS.heading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
              <input
                maxLength={TEXT_LIMITS.heading}
                type="text"
                value={formData.header.title}
                onChange={(e) => handleChange('header', 'title', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
              <CharCount value={formData.header.title} max={TEXT_LIMITS.heading} />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
              <textarea
                value={formData.header.description}
                onChange={(e) => handleChange('header', 'description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Labels Section */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">Form Labels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Full Name Label</label>
              <input
                type="text"
                value={formData.labels.fullName}
                onChange={(e) => handleChange('labels', 'fullName', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Email Label</label>
              <input
                type="text"
                value={formData.labels.email}
                onChange={(e) => handleChange('labels', 'email', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Phone Label</label>
              <input
                type="text"
                value={formData.labels.phone}
                onChange={(e) => handleChange('labels', 'phone', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Attendance Label</label>
              <input
                type="text"
                value={formData.labels.attendance}
                onChange={(e) => handleChange('labels', 'attendance', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Proxy Label</label>
              <input
                type="text"
                value={formData.labels.proxy}
                onChange={(e) => handleChange('labels', 'proxy', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Proxy Placeholder</label>
              <input
                type="text"
                value={formData.labels.proxyPlaceholder}
                onChange={(e) => handleChange('labels', 'proxyPlaceholder', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Message Label</label>
              <input
                type="text"
                value={formData.labels.message}
                onChange={(e) => handleChange('labels', 'message', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Message Placeholder</label>
              <input
                type="text"
                value={formData.labels.messagePlaceholder}
                onChange={(e) => handleChange('labels', 'messagePlaceholder', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Attendance Options Section */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">Attendance Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Accepting Invitation</label>
              <input
                type="text"
                value={formData.attendanceOptions.yes}
                onChange={(e) => handleChange('attendanceOptions', 'yes', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Declining Invitation</label>
              <input
                type="text"
                value={formData.attendanceOptions.no}
                onChange={(e) => handleChange('attendanceOptions', 'no', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">Actions & Consent</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Privacy Act Text</label>
              <textarea
                value={formData.actions.privacyText}
                onChange={(e) => handleChange('actions', 'privacyText', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Submit Button Text</label>
              <input
                maxLength={TEXT_LIMITS.button}
                type="text"
                value={formData.actions.submitButton}
                onChange={(e) => handleChange('actions', 'submitButton', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
              <CharCount value={formData.actions.submitButton} max={TEXT_LIMITS.button} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Submitting Loading Text</label>
              <input
                maxLength={TEXT_LIMITS.button}
                type="text"
                value={formData.actions.submittingButton}
                onChange={(e) => handleChange('actions', 'submittingButton', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
              <CharCount value={formData.actions.submittingButton} max={TEXT_LIMITS.button} />
            </div>
          </div>
        </div>

        {/* Success Modal Section */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">Success Modal</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Modal Title</label>
              <input
                maxLength={TEXT_LIMITS.heading}
                type="text"
                value={formData.successModal.title}
                onChange={(e) => handleChange('successModal', 'title', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
              <CharCount value={formData.successModal.title} max={TEXT_LIMITS.heading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Modal Description</label>
              <textarea
                value={formData.successModal.description}
                onChange={(e) => handleChange('successModal', 'description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Modal Button Text</label>
              <input
                maxLength={TEXT_LIMITS.button}
                type="text"
                value={formData.successModal.buttonText}
                onChange={(e) => handleChange('successModal', 'buttonText', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-zinc-100"
              />
              <CharCount value={formData.successModal.buttonText} max={TEXT_LIMITS.button} />
            </div>
          </div>
        </div>

      </div>

      <EditorSaveBar hasChanges={hasChanges} saving={saving} saved={saved} hasBackup={hasBackup} onUndo={handleUndo} onRestore={() => setIsRestoreModalOpen(true)} onSave={() => setShowConfirmModal(true)} />

      {/* Confirmation Modal */}
      <AdminModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Publish Changes"
        message="Are you sure you want to publish these changes? They will be immediately visible to your guests."
        type="confirm"
        confirmText="Publish"
        cancelText="Cancel"
        onConfirm={handleSave}
      />

      {/* Restore Modal */}
      <AdminModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Restore Backup"
        message="Are you sure you want to restore the last published version? This will overwrite your current changes."
        type="confirm"
        variant="danger"
        confirmText={restoring ? "Restoring..." : "Restore"}
        cancelText="Cancel"
        onConfirm={handleRestore}
      />

      {/* Success Modal */}
      <AdminModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success"
        message="Your changes have been successfully published."
        type="alert"
        variant="success"
        confirmText="Close"
        onConfirm={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
