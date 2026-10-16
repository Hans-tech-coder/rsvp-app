'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { uploadImage } from '@/lib/blob/uploadImage';
import { useContentDefaults } from './contentDefaults';
import { hostsFromLegacy, readHosts, type Host } from '@/lib/genericContent';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';
import { CharCount, TEXT_LIMITS } from './CharCount';

export function GlobalSettingsEditor({ eventId }: { eventId: string }) {
  const weddingContent = useContentDefaults().content;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'globalSettings');
  const loadDraft = draft.load;
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  // Extract defaults
  const defaultData = {
    logo: weddingContent.global.logo,
    ogImage: weddingContent.global.ogImage || '',
    hosts: weddingContent.global.hosts as Host[],
    coupleNameFormat: weddingContent.global.coupleNameFormat,
    venueShort: weddingContent.global.venueShort,
    targetDate: weddingContent.global.targetDate,
    footerTagline: weddingContent.global.footerTagline,
  };

  // Every field of the saved doc is kept and written back, including ones
  // this editor no longer shows (groomName / brideName and the venue fields
  // from before Oct 2026), so older code reading them still works.
  const fromDoc = (saved: Record<string, unknown>) => ({
    ...defaultData,
    ...saved,
    hosts: readHosts(saved.hosts) ?? hostsFromLegacy(saved) ?? defaultData.hosts,
  });

  const [formData, setFormData] = useState(defaultData);
  const [originalData, setOriginalData] = useState(defaultData);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadDraft();
        
        if (data) {
          const fetchedData = fromDoc(data);
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

  const updateHost = (index: number, field: keyof Host, value: string) => {
    setFormData(prev => ({ ...prev, hosts: prev.hosts.map((h, i) => (i === index ? { ...h, [field]: value } : h)) }));
    setSaved(false);
  };

  const addHost = () => {
    setFormData(prev => ({ ...prev, hosts: [...prev.hosts, { name: '', role: '' }] }));
    setSaved(false);
  };

  const removeHost = (index: number) => {
    setFormData(prev => ({ ...prev, hosts: prev.hosts.filter((_, i) => i !== index) }));
    setSaved(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSaved(false);
    
    try {
      const downloadURL = await uploadImage(file, 'images/global-logo', { type: 'image/png', maxDimension: 800 });
      setFormData(prev => ({ ...prev, logo: downloadURL }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOgImage(true);
    setSaved(false);
    
    try {
      const downloadURL = await uploadImage(file, 'images/global-og', { type: 'image/jpeg', maxDimension: 1200 });
      setFormData(prev => ({ ...prev, ogImage: downloadURL }));
    } catch (error) {
      console.error("Error uploading og image:", error);
      alert("Failed to upload preview image. Please try again.");
    } finally {
      setUploadingOgImage(false);
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
    setFormData(fromDoc(data));
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
      {/* Logo Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Global Logo</h3>
        <div className="flex flex-col @2xl:flex-row gap-6 items-start">
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

      {/* OG Image Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Link Preview Image (Open Graph)</h3>
        <div className="flex flex-col @2xl:flex-row gap-6 items-start">
          <div className="relative w-64 h-32 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center p-4">
            <img 
              src={formData.ogImage} 
              alt="OG Image Preview" 
              className="max-w-full max-h-full object-cover"
            />
            {uploadingOgImage && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs font-medium">Uploading...</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              This image appears when you share the website link on social media platforms (like Facebook or iMessage).
              Recommended: A landscape image (1200x630px).
            </p>
            <div>
              <input 
                type="file" 
                id="global-og-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleOgImageUpload}
                disabled={uploadingOgImage}
              />
              <label 
                htmlFor="global-og-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Preview Image
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Hosts Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Hosts</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Who the event is for: the couple, the debutante, the celebrant or the company. The names appear large on the Welcome and Entrance screens, and their initials form the monogram on the loading screen and in the footer.</p>
          </div>
          <button
            onClick={addHost}
            className="flex items-center gap-2 shrink-0 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add host
          </button>
        </div>
        <div className="space-y-3">
          {formData.hosts.map((host, index) => (
            <div key={index} className="grid grid-cols-1 @2xl:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Name</label>
                <input
                  type="text"
                  value={host.name}
                  onChange={(e) => updateHost(index, 'name', e.target.value)}
                  placeholder="e.g. Maria"
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Role <span className="font-normal text-gray-400 dark:text-zinc-500">(optional, not shown to guests)</span></label>
                <input
                  type="text"
                  value={host.role}
                  onChange={(e) => updateHost(index, 'role', e.target.value)}
                  placeholder="e.g. Groom, Debutante, Organizer"
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
                />
              </div>
              <button
                onClick={() => removeHost(index)}
                disabled={formData.hosts.length <= 1}
                className="p-2 mb-0.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors justify-self-start"
                title={formData.hosts.length <= 1 ? 'The event needs at least one host' : 'Remove host'}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Display Name (as written in sentences)</label>
          <input
            type="text"
            name="coupleNameFormat"
            value={formData.coupleNameFormat}
            onChange={handleChange}
            placeholder="e.g. Maria & Jose, Ana's 18th, ACME Summit 2027"
            className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
          />
          <p className="text-xs text-gray-500 dark:text-zinc-500">Used where the site names the event in a sentence: the link preview and browser tab, the 404 page and the RSVP confirmation email. In Site Text it is <code>{'{couple}'}</code>.</p>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Date & Location Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Global Date & Location</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">These are the primary display dates and locations used on the Welcome and Entrance screens and in the footer.</p>
        </div>
        <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-6">
          <div className="space-y-2 @2xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Short Venue</label>
            <input 
              type="text" 
              name="venueShort"
              value={formData.venueShort}
              onChange={handleChange}
              placeholder="e.g. Tagaytay, Cavite"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>

          <div className="space-y-2 @2xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Target Date (Countdown Timer)</label>
            <input 
              type="text" 
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              placeholder="e.g. June 14, 2027 16:00:00"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-zinc-500">Format: Month DD, YYYY HH:MM:SS. Used for the countdown timer on the Welcome screen and the date in the footer (shown as DD.MM.YYYY).</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {/* Footer Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Footer</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Shown at the bottom of every scrolling screen. The monogram uses the couple&apos;s initials and the date comes from the Target Date above.</p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Footer Tagline</label>
          <input
            maxLength={TEXT_LIMITS.cardTitle}
            type="text"
            name="footerTagline"
            value={formData.footerTagline}
            onChange={handleChange}
            placeholder="e.g. Thank you for celebrating with us"
            className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
          />
          <CharCount value={formData.footerTagline} max={TEXT_LIMITS.cardTitle} />
          <p className="text-xs text-gray-500 dark:text-zinc-500">Quotation marks are added automatically. Leave blank to use the default tagline.</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-zinc-400">Venue times, places and addresses are edited in the Venues (Event Details) tab.</p>

      <EditorSaveBar draft={draft} doc={formData} merge hasChanges={hasChanges} saving={saving} saved={saved} busy={uploadingImage || uploadingOgImage} onUndo={handleUndo} onRestore={handleRestore} onSave={handleSave} />
    </div>
  );
}
