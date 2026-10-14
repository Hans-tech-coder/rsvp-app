'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, X, Settings } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { uploadImage } from '@/lib/blob/uploadImage';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';
import { EditorSaveBar } from './EditorSaveBar';
import { CharCount, TEXT_LIMITS } from './CharCount';

// Time, location and address come from Global Settings (the guest site reads
// them from there), so they are shown here read-only.
type VenueFacts = Record<'ceremony' | 'reception', { time: string; location: string; address: string }>;

const venueFactsFrom = (global: Record<string, string | undefined>): VenueFacts => ({
  ceremony: {
    time: global.ceremonyTime || weddingContent.details.ceremony.time,
    location: global.ceremonyLocation || weddingContent.details.ceremony.location,
    address: global.ceremonyAddress || weddingContent.details.ceremony.address,
  },
  reception: {
    time: global.receptionTime || weddingContent.details.reception.time,
    location: global.receptionLocation || weddingContent.details.reception.location,
    address: global.receptionAddress || weddingContent.details.reception.address,
  },
});

export function EventDetailsEditor({ eventId, onEditGlobalSettings }: { eventId: string; onEditGlobalSettings: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [venueFacts, setVenueFacts] = useState<VenueFacts>(() => venueFactsFrom({}));
  
  // State for the form fields
  const [data, setData] = useState({ ...weddingContent.details, orderOfEventsImage: '' });
  const [originalData, setOriginalData] = useState({ ...weddingContent.details, orderOfEventsImage: '' });

  const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, paths.content(eventId, 'details'));
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
            },
            orderOfEventsImage: fetchedData.orderOfEventsImage || weddingContent.details.orderOfEventsImage || ''
          };
          setData(mergedData);
          setOriginalData(mergedData);
        }

        const backupRef = doc(db, paths.content(eventId, 'details_backup'));
        const backupSnap = await getDoc(backupRef);
        if (backupSnap.exists()) {
          setHasBackup(true);
        }

        const globalSnap = await getDoc(doc(db, paths.content(eventId, 'globalSettings')));
        if (globalSnap.exists()) {
          setVenueFacts(venueFactsFrom(globalSnap.data()));
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

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
      const backupRef = doc(db, paths.content(eventId, 'details_backup'));
      await setDoc(backupRef, originalData, { merge: true });

      const docRef = doc(db, paths.content(eventId, 'details'));
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
      const backupRef = doc(db, paths.content(eventId, 'details_backup'));
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
          },
          orderOfEventsImage: fetchedBackup.orderOfEventsImage || weddingContent.details.orderOfEventsImage || ''
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadImage(file, 'website/order-of-events');
      
      setData(prev => ({ ...prev, orderOfEventsImage: url }));
      setSaved(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setData(prev => ({ ...prev, orderOfEventsImage: '' }));
    setSaved(false);
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
              maxLength={TEXT_LIMITS.cardTitle}
              type="text" 
              name="subtitle"
              value={(data[section] as any).subtitle || ""}
              onChange={(e) => handleSectionChange(section, e)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <CharCount value={data[section].subtitle} max={TEXT_LIMITS.cardTitle} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
            <input 
              maxLength={TEXT_LIMITS.cardTitle}
              type="text" 
              name="title"
              value={data[section].title}
              onChange={(e) => handleSectionChange(section, e)}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <CharCount value={data[section].title} max={TEXT_LIMITS.cardTitle} />
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
        
        <div className="p-4 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-gray-500 dark:text-zinc-400">Time</dt>
              <dd className="text-gray-900 dark:text-zinc-100">{venueFacts[section].time}</dd>
              <dt className="text-gray-500 dark:text-zinc-400">Location</dt>
              <dd className="text-gray-900 dark:text-zinc-100">{venueFacts[section].location}</dd>
              <dt className="text-gray-500 dark:text-zinc-400">Address</dt>
              <dd className="text-gray-900 dark:text-zinc-100">{venueFacts[section].address}</dd>
            </dl>
            <button
              type="button"
              onClick={onEditGlobalSettings}
              className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              Edit in Global Settings
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-zinc-400">
            Time, location and address are set once in Global Settings so they match everywhere on the site.
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
                maxLength={TEXT_LIMITS.heading}
                type="text" 
                name="subtitle"
                value={data.header?.subtitle || ""}
                onChange={handleHeaderChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
              <CharCount value={data.header?.subtitle || ""} max={TEXT_LIMITS.heading} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
              <input 
                maxLength={TEXT_LIMITS.heading}
                type="text" 
                name="title"
                value={data.header?.title || ""}
                onChange={handleHeaderChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
              <CharCount value={data.header?.title || ""} max={TEXT_LIMITS.heading} />
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

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Order of Events</h3>
        </div>
        
        <div className="bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">Order of Events Image</label>
          
          {data.orderOfEventsImage ? (
            <div className="relative inline-block">
              <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex items-center justify-center min-h-[200px] min-w-[200px]">
                <img 
                  src={data.orderOfEventsImage} 
                  alt="Order of Events" 
                  className="max-h-[400px] w-auto object-contain"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={handleRemoveImage}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                    title="Remove Image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md h-48 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              {isUploadingImage ? (
                <div className="flex flex-col items-center text-gray-500 dark:text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500 dark:text-zinc-400">
                  <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-zinc-500" />
                  <span className="text-sm font-medium">Click to upload image</span>
                  <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      <EditorSaveBar hasChanges={hasChanges} saving={saving} saved={saved} hasBackup={hasBackup} onUndo={handleUndo} onRestore={() => setIsRestoreModalOpen(true)} onSave={() => setShowConfirmModal(true)} />

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
        message="This will update the Event Details section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
