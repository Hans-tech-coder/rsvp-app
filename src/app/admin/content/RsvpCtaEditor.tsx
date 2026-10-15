'use client';

import { useState, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/blob/uploadImage';
import weddingContent from '@/data/wedding-content.json';
import Image from 'next/image';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';
import { CharCount, TEXT_LIMITS } from './CharCount';

export function RsvpCtaEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'rsvpCta');
  const loadDraft = draft.load;
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State for the form fields
  const [formData, setFormData] = useState({
    backgroundImage: weddingContent.rsvpCta.backgroundImage,
    subtitle: weddingContent.rsvpCta.subtitle,
    title: weddingContent.rsvpCta.title,
    description: weddingContent.rsvpCta.description,
    buttonText: weddingContent.rsvpCta.buttonText,
  });

  const [originalData, setOriginalData] = useState({
    backgroundImage: weddingContent.rsvpCta.backgroundImage,
    subtitle: weddingContent.rsvpCta.subtitle,
    title: weddingContent.rsvpCta.title,
    description: weddingContent.rsvpCta.description,
    buttonText: weddingContent.rsvpCta.buttonText,
  });

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadDraft();
        
        if (data) {
          const fetchedData = {
            ...weddingContent.rsvpCta,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const downloadURL = await uploadImage(file, 'images/rsvpCta-bg');
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
    setFormData({ ...weddingContent.rsvpCta, ...data });
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-gray-500">Loading RSVP CTA content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">RSVP Call to Action</h2>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Update the text and background for the RSVP section</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">Background Image</h3>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-full md:w-64 h-40 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0">
              {formData.backgroundImage ? (
                <Image 
                  src={formData.backgroundImage} 
                  alt="RSVP Background" 
                  fill
                  className="object-cover"
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
                This image is displayed full-screen behind the RSVP text section. 
                Recommended size: 1920x1080 pixels. High quality landscape photos work best to cover different screen sizes.
              </p>
              <div>
                <input 
                  type="file" 
                  id="rsvp-bg-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <label 
                  htmlFor="rsvp-bg-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors text-gray-900 dark:text-zinc-100"
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingImage ? 'Uploading...' : 'Replace Image'}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">Content</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle</label>
                <input
                  maxLength={TEXT_LIMITS.heading}
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all dark:text-zinc-100"
                />
                <CharCount value={formData.subtitle} max={TEXT_LIMITS.heading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
                <input
                  maxLength={TEXT_LIMITS.heading}
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all dark:text-zinc-100"
                />
                <CharCount value={formData.title} max={TEXT_LIMITS.heading} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all dark:text-zinc-100 resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Button Text</label>
              <input
                maxLength={TEXT_LIMITS.button}
                type="text"
                name="buttonText"
                value={formData.buttonText}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all dark:text-zinc-100"
              />
              <CharCount value={formData.buttonText} max={TEXT_LIMITS.button} />
            </div>
          </div>
        </div>
      </div>

      <EditorSaveBar draft={draft} hasChanges={hasChanges} saving={saving} saved={saved} busy={uploadingImage} onUndo={handleUndo} onRestore={handleRestore} onSave={handleSave} />
    </div>
  );
}
