'use client';

import { useState, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/blob/uploadImage';
import { useContentDefaults } from './contentDefaults';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';

export function EntranceScreenEditor({ eventId }: { eventId: string }) {
  const weddingContent = useContentDefaults().content;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const draft = useContentDraft(eventId, 'entranceScreen');
  const loadDraft = draft.load;
  
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
        const data = await loadDraft();
        if (data) {
          const fetchedData = {
            ...weddingContent.entranceScreen,
            ...data
          };
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadDraft, weddingContent]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSaved(false);
    
    try {
      const downloadURL = await uploadImage(eventId, file, 'images/entrance-bg');
      
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
      if (!(await draft.save(formData, { merge: true }))) return false;
      setOriginalData(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (error: any) {
      console.error("Error saving content:", error);
      alert(`Failed to save changes: ${error.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    setFormData(originalData);
    setSaved(false);
  };

  const handleRestore = (data: DocumentData) => {
    setFormData({ ...weddingContent.entranceScreen, ...data });
    setSaved(false);
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
        <div className="flex flex-col @2xl:flex-row gap-6 items-start">
          <div className="relative w-full @2xl:w-64 aspect-video bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0">
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

      <EditorSaveBar draft={draft} doc={formData} merge hasChanges={hasChanges} saving={saving} saved={saved} busy={uploadingImage} onUndo={handleUndo} onRestore={handleRestore} onSave={handleSave} />
    </div>
  );
}
