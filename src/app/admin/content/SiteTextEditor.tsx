'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, ChevronDown } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_SITE_TEXT, mergeSiteText, type SiteText } from '@/lib/siteText';
import { revalidateGuestSite } from '@/app/actions/admin';
import { AdminModal } from '../components/AdminModal';
import { EditorSaveBar } from './EditorSaveBar';
import { CharCount } from './CharCount';
import { SITE_TEXT_GROUPS, type SiteTextField } from './siteTextFields';

// Small wording on the guest site (buttons, labels, hints, error messages),
// stored in websiteContent/siteText. The guest pages read it on the server, so
// a save also asks Next.js to regenerate them (revalidateGuestSite).

function getText(text: SiteText, path: string): string {
  return path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], text) as string;
}

function setText(text: SiteText, path: string, value: string): SiteText {
  const [key, ...rest] = path.split('.');
  const node = text as unknown as Record<string, unknown>;
  return {
    ...node,
    [key]: rest.length ? setText(node[key] as SiteText, rest.join('.'), value) : value,
  } as unknown as SiteText;
}

const inputClass =
  'w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600';

export function SiteTextEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [query, setQuery] = useState('');

  const [formData, setFormData] = useState<SiteText>(DEFAULT_SITE_TEXT);
  const [originalData, setOriginalData] = useState<SiteText>(DEFAULT_SITE_TEXT);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'websiteContent', 'siteText'));
        if (docSnap.exists()) {
          const fetchedData = mergeSiteText(DEFAULT_SITE_TEXT, docSnap.data());
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }

        const backupSnap = await getDoc(doc(db, 'websiteContent', 'siteText_backup'));
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

  const handleChange = (path: string, value: string) => {
    setFormData(prev => setText(prev, path, value));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'websiteContent', 'siteText_backup'), originalData);
      await setDoc(doc(db, 'websiteContent', 'siteText'), formData);

      // The text is live in Firestore now; this makes the cached pages show it.
      const refresh = await revalidateGuestSite();
      if (!refresh.success) console.error('Guest site refresh failed:', refresh.error);

      setOriginalData(formData);
      setHasBackup(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error saving content:", error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    setFormData(originalData);
    setSaved(false);
  };

  const executeRestore = async () => {
    setRestoring(true);
    setIsRestoreModalOpen(false);
    try {
      const backupSnap = await getDoc(doc(db, 'websiteContent', 'siteText_backup'));
      if (backupSnap.exists()) {
        setFormData(mergeSiteText(DEFAULT_SITE_TEXT, backupSnap.data()));
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      alert(`Failed to load previous save: ${error instanceof Error ? error.message : error}`);
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-gray-500">Loading site text...</p>
      </div>
    );
  }

  // Search matches the field label, the group title, or the current wording.
  const q = query.trim().toLowerCase();
  const matches = (field: SiteTextField, groupTitle: string) =>
    !q ||
    field.label.toLowerCase().includes(q) ||
    groupTitle.toLowerCase().includes(q) ||
    getText(formData, field.path).toLowerCase().includes(q);
  const groups = SITE_TEXT_GROUPS
    .map(group => ({ ...group, fields: group.fields.filter(field => matches(field, group.title)) }))
    .filter(group => group.fields.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Site Text</h2>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">
          Buttons, labels, help lines and messages across the guest site. Leave a field empty to use the default shown in grey.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Find text, e.g. "Continue"'
          aria-label="Find text"
          className={`${inputClass} pl-9`}
        />
      </div>

      <div className="space-y-3">
        {groups.map(group => {
          const changed = group.fields.filter(f => getText(formData, f.path) !== getText(originalData, f.path)).length;
          return (
            // A search opens every matching group; otherwise the admin opens them one by one.
            <details
              key={`${group.id}-${q ? 'search' : 'browse'}`}
              open={!!q || undefined}
              className="group bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-xl focus-visible:outline-2 focus-visible:outline-gray-900 dark:focus-visible:outline-zinc-100">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                    {group.title}
                    {changed > 0 && (
                      <span className="ml-2 align-middle text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {changed} unsaved
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{group.description}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>

              <div className="px-6 pb-6 pt-2 space-y-5 border-t border-gray-200 dark:border-zinc-800">
                {group.fields.map(field => {
                  const id = `site-text-${field.path}`;
                  const value = getText(formData, field.path);
                  const fallback = getText(DEFAULT_SITE_TEXT, field.path);
                  return (
                    <div key={field.path} className="space-y-2">
                      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-zinc-300">{field.label}</label>
                      {field.multiline ? (
                        <textarea
                          id={id}
                          value={value}
                          onChange={(e) => handleChange(field.path, e.target.value)}
                          placeholder={fallback}
                          rows={3}
                          className={`${inputClass} resize-y`}
                        />
                      ) : (
                        <input
                          id={id}
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(field.path, e.target.value)}
                          placeholder={fallback}
                          maxLength={field.max}
                          className={inputClass}
                        />
                      )}
                      {field.max && <CharCount value={value} max={field.max} />}
                      {field.hint && <p className="text-xs text-gray-500 dark:text-zinc-500">{field.hint}</p>}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
        {groups.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-10">No text matches &ldquo;{query}&rdquo;.</p>
        )}
      </div>

      <EditorSaveBar hasChanges={hasChanges} saving={saving} saved={saved} hasBackup={hasBackup} onUndo={handleUndo} onRestore={() => setIsRestoreModalOpen(true)} onSave={() => setShowConfirmModal(true)} />

      <AdminModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={executeRestore}
        title="Restore Previous Save?"
        message="This will replace all your current edits with the last saved version. Press Save afterwards to publish it."
        type="confirm"
        variant="warning"
        confirmText={restoring ? "Restoring..." : "Yes, Restore"}
      />

      <AdminModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onConfirm={() => setIsSuccessModalOpen(false)}
        title="Restored Successfully"
        message="The previous save is back in the form. Press Save Changes to publish it."
        type="alert"
        variant="success"
        confirmText="Got it"
      />

      <AdminModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
        title="Publish Changes?"
        message="This will update the site text on the live website. Guests see it on their next page load. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
