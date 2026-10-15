'use client';

import { useState, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon, Info, AlertTriangle } from 'lucide-react';
import { uploadImage } from '@/lib/blob/uploadImage';
import weddingContent from '@/data/wedding-content.json';
import Image from 'next/image';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';
import { CharCount, TEXT_LIMITS } from './CharCount';
import { hasDepthMap } from '@/lib/welcomeDepthMaps';

export function WelcomeScreenEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'welcomeScreen');
  const loadDraft = draft.load;
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State for the form fields
  const [formData, setFormData] = useState({
    backgroundImage: weddingContent.welcomeScreen.backgroundImage,
    subtitle: weddingContent.welcomeScreen.subtitle,
    topText: weddingContent.welcomeScreen.topText,
    bottomText1: weddingContent.welcomeScreen.bottomText1,
    bottomText2: weddingContent.welcomeScreen.bottomText2,
  });

  const [originalData, setOriginalData] = useState({
    backgroundImage: weddingContent.welcomeScreen.backgroundImage,
    subtitle: weddingContent.welcomeScreen.subtitle,
    topText: weddingContent.welcomeScreen.topText,
    bottomText1: weddingContent.welcomeScreen.bottomText1,
    bottomText2: weddingContent.welcomeScreen.bottomText2,
  });

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadDraft();
        
        if (data) {
          const fetchedData = {
            ...weddingContent.welcomeScreen,
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
  }, [loadDraft]);

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
      const downloadURL = await uploadImage(file, 'images/welcome-bg');
      
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
    setFormData({ ...weddingContent.welcomeScreen, ...data });
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Background Image</h3>
        <div className="flex flex-col @2xl:flex-row gap-6 items-start">
          <div className="relative w-full @2xl:w-64 h-40 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0">
            {formData.backgroundImage ? (
              <img 
                src={formData.backgroundImage} 
                alt="Welcome Background" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">No image</span>
              </div>
            )}
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              This image is displayed full-screen when the user first opens the website. 
              Recommended size: 1920x1080 pixels. High quality portrait or landscape photos work best.
            </p>
            {hasDepthMap(formData.backgroundImage) ? (
              <p className="flex gap-2 p-3 text-sm rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                This photo has the 3D motion effect. A new photo shows still (no 3D) until a developer makes a depth map for it.
              </p>
            ) : (
              <p className="flex gap-2 p-3 text-sm rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                The 3D motion effect is off for this photo: it has no depth map, so guests see it still. Ask a developer to make one to turn the effect back on.
              </p>
            )}
            <div>
              <input 
                type="file" 
                id="welcome-bg-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              <label 
                htmlFor="welcome-bg-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Replace Image
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Text Content Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Text Content</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle / Tagline</label>
            <input 
              maxLength={TEXT_LIMITS.heading}
              type="text" 
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 transition-all"
            />
            <CharCount value={formData.subtitle} max={TEXT_LIMITS.heading} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Top Text</label>
            <input 
              maxLength={TEXT_LIMITS.cardTitle}
              type="text" 
              name="topText"
              value={formData.topText}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 transition-all"
            />
            <CharCount value={formData.topText} max={TEXT_LIMITS.cardTitle} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Bottom Text 1</label>
            <input 
              maxLength={TEXT_LIMITS.cardTitle}
              type="text" 
              name="bottomText1"
              value={formData.bottomText1}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 transition-all"
            />
            <CharCount value={formData.bottomText1} max={TEXT_LIMITS.cardTitle} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Bottom Text 2</label>
            <input 
              maxLength={TEXT_LIMITS.sentence}
              type="text" 
              name="bottomText2"
              value={formData.bottomText2}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-500 transition-all"
            />
            <CharCount value={formData.bottomText2} max={TEXT_LIMITS.sentence} />
          </div>
        </div>
      </div>

      <EditorSaveBar draft={draft} doc={formData} merge hasChanges={hasChanges} saving={saving} saved={saved} busy={uploadingImage} onUndo={handleUndo} onRestore={handleRestore} onSave={handleSave} />
    </div>
  );
}
