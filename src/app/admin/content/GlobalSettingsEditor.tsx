'use client';

import { useState, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon, Save, Check, RotateCcw, History } from 'lucide-react';
import { db, storage } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';

export function GlobalSettingsEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Extract defaults
  const defaultData = {
    logo: weddingContent.global.logo,
    brideName: weddingContent.global.brideName,
    groomName: weddingContent.global.groomName,
    venueShort: weddingContent.global.venueShort,
    targetDate: weddingContent.global.targetDate,
    ceremonyTime: weddingContent.details.ceremony.time,
    ceremonyLocation: weddingContent.details.ceremony.location,
    ceremonyAddress: weddingContent.details.ceremony.address,
    receptionTime: weddingContent.details.reception.time,
    receptionLocation: weddingContent.details.reception.location,
    receptionAddress: weddingContent.details.reception.address,
  };

  const [formData, setFormData] = useState(defaultData);
  const [originalData, setOriginalData] = useState(defaultData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'websiteContent', 'globalSettings');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = { ...defaultData, ...docSnap.data() };
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }

        const backupRef = doc(db, 'websiteContent', 'globalSettings_backup');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSaved(false);
    
    try {
      const storageRef = ref(storage, `images/global-logo-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, logo: downloadURL }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const backupRef = doc(db, 'websiteContent', 'globalSettings_backup');
      await setDoc(backupRef, originalData, { merge: true });

      const docRef = doc(db, 'websiteContent', 'globalSettings');
      await setDoc(docRef, formData, { merge: true });
      
      setOriginalData(formData);
      setHasBackup(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
      const backupRef = doc(db, 'websiteContent', 'globalSettings_backup');
      const backupSnap = await getDoc(backupRef);
      if (backupSnap.exists()) {
        const fetchedBackup = { ...defaultData, ...backupSnap.data() };
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
      {/* Logo Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Global Logo</h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative w-32 h-32 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center p-4">
            <img 
              src={formData.logo} 
              alt="Global Logo" 
              className="max-w-full max-h-full object-contain"
            />
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs font-medium">Uploading...</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              This logo is displayed in the navigation menu and entrance screen. 
              Recommended: A transparent PNG or SVG.
            </p>
            <div>
              <input 
                type="file" 
                id="global-logo-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              <label 
                htmlFor="global-logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload New Logo
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Couple Details Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">The Couple</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">These names are used across the website, including the Entrance, Our Story, and Registry screens.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Bride Name</label>
            <input 
              type="text" 
              name="brideName"
              value={formData.brideName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Groom Name</label>
            <input 
              type="text" 
              name="groomName"
              value={formData.groomName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Date & Location Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Global Date & Location</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">These are the primary display dates and locations used in headers, footers, and the Welcome screen.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Short Venue</label>
            <input 
              type="text" 
              name="venueShort"
              value={formData.venueShort}
              onChange={handleChange}
              placeholder="e.g. Paniqui, Tarlac"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Target Date (Countdown Timer)</label>
            <input 
              type="text" 
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              placeholder="e.g. December 20, 2026 15:00:00"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-zinc-500">Format: Month DD, YYYY HH:MM:SS. Used for the countdown timer on the Welcome screen.</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Ceremony Details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Ceremony Specifics</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Used specifically on the Event Details screen to tell guests when and where the ceremony will happen.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Ceremony Time</label>
            <input 
              type="text" 
              name="ceremonyTime"
              value={formData.ceremonyTime}
              onChange={handleChange}
              placeholder="e.g. 3:00 PM"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Ceremony Location Name</label>
            <input 
              type="text" 
              name="ceremonyLocation"
              value={formData.ceremonyLocation}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Ceremony Full Address</label>
            <input 
              type="text" 
              name="ceremonyAddress"
              value={formData.ceremonyAddress}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Reception Details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Reception Specifics</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Used specifically on the Event Details screen to tell guests when and where the reception will happen.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Reception Time</label>
            <input 
              type="text" 
              name="receptionTime"
              value={formData.receptionTime}
              onChange={handleChange}
              placeholder="e.g. 6:30 PM"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Reception Location Name</label>
            <input 
              type="text" 
              name="receptionLocation"
              value={formData.receptionLocation}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Reception Full Address</label>
            <input 
              type="text" 
              name="receptionAddress"
              value={formData.receptionAddress}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
        </div>
      </div>

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
          {JSON.stringify(formData) !== JSON.stringify(originalData) && (
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
            onClick={handleSave}
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
    </div>
  );
}
