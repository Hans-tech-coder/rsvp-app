'use client';

import { useState, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { refreshGuestSite } from './refreshGuestSite';
import { uploadImage } from '@/lib/blob/uploadImage';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';
import { EditorSaveBar } from './EditorSaveBar';

export function EntranceScreenEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // State for the form fields
  const [formData, setFormData] = useState({
    backgroundImage: weddingContent.entranceScreen.backgroundImage,
  });

  const [originalData, setOriginalData] = useState({
    backgroundImage: weddingContent.entranceScreen.backgroundImage,
  });

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, paths.content(eventId, 'entranceScreen'));
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = {
            ...weddingContent.entranceScreen,
            ...docSnap.data()
          };
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }

        const backupRef = doc(db, paths.content(eventId, 'entranceScreen_backup'));
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSaved(false);
    
    try {
      const downloadURL = await uploadImage(file, 'images/entrance-bg');
      
      setFormData(prev => ({ ...prev, backgroundImage: downloadURL }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const backupRef = doc(db, paths.content(eventId, 'entranceScreen_backup'));
      await setDoc(backupRef, originalData, { merge: true });

      const docRef = doc(db, paths.content(eventId, 'entranceScreen'));
      await setDoc(docRef, formData, { merge: true });
      await refreshGuestSite(eventId);
      
      setOriginalData(formData);
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
    setFormData(originalData);
    setSaved(false);
  };

  const handleRestoreBackup = async () => {
    setIsRestoreModalOpen(true);
  };

  const executeRestore = async () => {
    setRestoring(true);
    setIsRestoreModalOpen(false);
    try {
      const backupRef = doc(db, paths.content(eventId, 'entranceScreen_backup'));
      const backupSnap = await getDoc(backupRef);
      if (backupSnap.exists()) {
        const fetchedBackup = {
          ...weddingContent.entranceScreen,
          ...backupSnap.data()
        };
        setFormData(fetchedBackup);
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

  return (
    <div className="space-y-8">
      {/* Background Image Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Entrance Screen Background Image</h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative w-full md:w-64 aspect-video bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0">
            {formData.backgroundImage ? (
              <img 
                src={formData.backgroundImage} 
                alt="Entrance Background" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs font-medium">Uploading...</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Upload a high-resolution image for the entrance screen background. 
              Recommended size: 1920x1080 pixels (16:9 ratio).
            </p>
            <div>
              <input 
                type="file" 
                id="entrance-bg-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              <label 
                htmlFor="entrance-bg-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload New Image
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <EditorSaveBar hasChanges={hasChanges} saving={saving} saved={saved} hasBackup={hasBackup} onUndo={handleUndo} onRestore={() => setIsRestoreModalOpen(true)} onSave={() => setShowConfirmModal(true)} />

      {/* Modals for Backup Restoration */}
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
        message="This will update the Entrance Screen section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
