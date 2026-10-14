'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, ChevronDown } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';
import { EditorSaveBar } from './EditorSaveBar';
import { CharCount, TEXT_LIMITS } from './CharCount';
import { NINANG_TITLES, NINONG_TITLES, emptySponsor, formatSponsor, normalizePrincipalSponsors, type Sponsor } from '@/lib/principalSponsors';

export function EntourageEditor({ eventId }: { eventId: string }) {
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
        const docRef = doc(db, paths.content(eventId, 'entourage'));
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          const mergedData = {
            subtitle: fetchedData.subtitle ?? weddingContent.entourage.subtitle,
            title: fetchedData.title ?? weddingContent.entourage.title,
            principalSponsors: normalizePrincipalSponsors(fetchedData.principalSponsors) ?? weddingContent.entourage.principalSponsors,
            honorAttendants: fetchedData.honorAttendants ?? weddingContent.entourage.honorAttendants,
            parents: fetchedData.parents ?? weddingContent.entourage.parents,
            bridesmaids: fetchedData.bridesmaids ?? weddingContent.entourage.bridesmaids,
            groomsmen: fetchedData.groomsmen ?? weddingContent.entourage.groomsmen,
            flowerGirls: fetchedData.flowerGirls ?? weddingContent.entourage.flowerGirls,
            ringBearers: fetchedData.ringBearers ?? weddingContent.entourage.ringBearers
          };
          setData(mergedData);
          setOriginalData(mergedData);
        }

        const backupRef = doc(db, paths.content(eventId, 'entourage_backup'));
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

  const handleArrayChange = (arrayName: 'bridesmaids' | 'groomsmen' | 'flowerGirls' | 'ringBearers' | 'groomParents' | 'brideParents', index: number, value: string) => {
    setData(prev => {
      if (arrayName === 'groomParents') {
        const newArray = [...prev.parents.groom];
        newArray[index] = value;
        return { ...prev, parents: { ...prev.parents, groom: newArray } };
      }
      if (arrayName === 'brideParents') {
        const newArray = [...prev.parents.bride];
        newArray[index] = value;
        return { ...prev, parents: { ...prev.parents, bride: newArray } };
      }
      const newArray = [...prev[arrayName as 'bridesmaids' | 'groomsmen' | 'flowerGirls' | 'ringBearers']];
      newArray[index] = value;
      return { ...prev, [arrayName]: newArray };
    });
    setSaved(false);
  };

  const addArrayItem = (arrayName: 'bridesmaids' | 'groomsmen' | 'flowerGirls' | 'ringBearers' | 'groomParents' | 'brideParents') => {
    setData(prev => {
      if (arrayName === 'groomParents') {
        return { ...prev, parents: { ...prev.parents, groom: [...prev.parents.groom, ""] } };
      }
      if (arrayName === 'brideParents') {
        return { ...prev, parents: { ...prev.parents, bride: [...prev.parents.bride, ""] } };
      }
      return {
        ...prev,
        [arrayName]: [...prev[arrayName as 'bridesmaids' | 'groomsmen' | 'flowerGirls' | 'ringBearers'], ""]
      };
    });
    setSaved(false);
  };

  const removeArrayItem = (arrayName: 'bridesmaids' | 'groomsmen' | 'flowerGirls' | 'ringBearers' | 'groomParents' | 'brideParents', index: number) => {
    setData(prev => {
      if (arrayName === 'groomParents') {
        const newArray = [...prev.parents.groom];
        newArray.splice(index, 1);
        return { ...prev, parents: { ...prev.parents, groom: newArray } };
      }
      if (arrayName === 'brideParents') {
        const newArray = [...prev.parents.bride];
        newArray.splice(index, 1);
        return { ...prev, parents: { ...prev.parents, bride: newArray } };
      }
      const newArray = [...prev[arrayName as 'bridesmaids' | 'groomsmen' | 'flowerGirls' | 'ringBearers']];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
    setSaved(false);
  };

  const updateSponsor = (index: number, side: 'ninang' | 'ninong', field: keyof Sponsor, value: string) => {
    setData(prev => {
      const pairs = [...prev.principalSponsors];
      pairs[index] = { ...pairs[index], [side]: { ...pairs[index][side], [field]: value } };
      return { ...prev, principalSponsors: pairs };
    });
    setSaved(false);
  };

  const toggleCouple = (index: number) => {
    setData(prev => {
      const pairs = [...prev.principalSponsors];
      pairs[index] = { ...pairs[index], couple: !pairs[index].couple };
      return { ...prev, principalSponsors: pairs };
    });
    setSaved(false);
  };

  const addSponsorPair = () => {
    setData(prev => ({
      ...prev,
      principalSponsors: [
        ...prev.principalSponsors,
        { ninang: { ...emptySponsor(), title: 'Mrs.' }, ninong: { ...emptySponsor(), title: 'Mr.' }, couple: true },
      ],
    }));
    setSaved(false);
  };

  const removeSponsorPair = (index: number) => {
    setData(prev => ({ ...prev, principalSponsors: prev.principalSponsors.filter((_, i) => i !== index) }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const backupRef = doc(db, paths.content(eventId, 'entourage_backup'));
      await setDoc(backupRef, originalData, { merge: true });

      const docRef = doc(db, paths.content(eventId, 'entourage'));
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
      const backupRef = doc(db, paths.content(eventId, 'entourage_backup'));
      const backupSnap = await getDoc(backupRef);
      if (backupSnap.exists()) {
        const fetchedBackup = backupSnap.data();
        const mergedData = {
          subtitle: fetchedBackup.subtitle ?? weddingContent.entourage.subtitle,
          title: fetchedBackup.title ?? weddingContent.entourage.title,
          principalSponsors: normalizePrincipalSponsors(fetchedBackup.principalSponsors) ?? weddingContent.entourage.principalSponsors,
          honorAttendants: fetchedBackup.honorAttendants ?? weddingContent.entourage.honorAttendants,
          parents: fetchedBackup.parents ?? weddingContent.entourage.parents,
          bridesmaids: fetchedBackup.bridesmaids ?? weddingContent.entourage.bridesmaids,
          groomsmen: fetchedBackup.groomsmen ?? weddingContent.entourage.groomsmen,
          flowerGirls: fetchedBackup.flowerGirls ?? weddingContent.entourage.flowerGirls,
          ringBearers: fetchedBackup.ringBearers ?? weddingContent.entourage.ringBearers
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

  const renderArraySection = (title: string, arrayName: 'bridesmaids' | 'groomsmen' | 'flowerGirls' | 'ringBearers' | 'groomParents' | 'brideParents') => {
    const arrayData = arrayName === 'groomParents' ? data.parents.groom : 
                      arrayName === 'brideParents' ? data.parents.bride : 
                      data[arrayName];
                      
    return (
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
          {arrayData.map((item, index) => (
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
          {arrayData.length === 0 && (
            <div className="col-span-full text-center py-8 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500">
              No {title.toLowerCase()} added yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  const inputClass = "px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all";

  const renderSponsorInput = (index: number, side: 'ninang' | 'ninong') => {
    const sponsor = data.principalSponsors[index][side];
    const titles = side === 'ninang' ? NINANG_TITLES : NINONG_TITLES;
    // Keep a title the list no longer has, so opening the editor never drops it
    const options = sponsor.title && !titles.includes(sponsor.title) ? [sponsor.title, ...titles] : titles;
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">{side === 'ninang' ? 'Ninang' : 'Ninong'}</label>
        <div className="flex gap-2">
          <div className="relative w-28 shrink-0">
            <select
              value={sponsor.title}
              onChange={(e) => updateSponsor(index, side, 'title', e.target.value)}
              aria-label={`${side === 'ninang' ? 'Ninang' : 'Ninong'} title`}
              className="w-full appearance-none pl-4 pr-9 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all cursor-pointer"
            >
              <option value="">—</option>
              {options.map(title => <option key={title} value={title}>{title}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-zinc-400" />
          </div>
          <input
            type="text"
            value={sponsor.name}
            placeholder="Full name"
            onChange={(e) => updateSponsor(index, side, 'name', e.target.value)}
            aria-label={`${side === 'ninang' ? 'Ninang' : 'Ninong'} name`}
            className={`flex-1 min-w-0 ${inputClass}`}
          />
        </div>
      </div>
    );
  };

  const renderSponsorsSection = () => {
    const pairs = data.principalSponsors;
    const ninangOnly = pairs.flatMap((p, i) => (formatSponsor(p.ninang) && !formatSponsor(p.ninong) ? [i + 1] : []));
    const ninongOnly = pairs.flatMap((p, i) => (!formatSponsor(p.ninang) && formatSponsor(p.ninong) ? [i + 1] : []));

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Principal Sponsors</h3>
          <button
            onClick={addSponsorPair}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add pair
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          One row per pair, in the order they appear on the site. On desktop the ninang sits on the left and the ninong faces her on the right.
          Tick <span className="font-medium">Couple</span> when the two are a pair: phones show them on one line. Two solo sponsors in one row stay facing each other on desktop and get a line each on phones.
        </p>
        {ninangOnly.length > 0 && ninongOnly.length > 0 && (
          <p className="text-sm px-4 py-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Row {ninangOnly.join(', ')} has only a ninang and row {ninongOnly.join(', ')} only a ninong. Put a solo ninong into a ninang-only row (and remove his old row) to keep both sides balanced.
          </p>
        )}
        <div className="space-y-3">
          {pairs.map((pair, index) => {
            const ninang = formatSponsor(pair.ninang);
            const ninong = formatSponsor(pair.ninong);
            const preview = !ninang || !ninong
              ? `Only a ${ninang ? 'ninang' : ninong ? 'ninong' : 'blank row'}${ninang || ninong ? ': the other side stays empty on desktop' : ': hidden on the site'}`
              : pair.couple
                ? `Phone: one line: ${ninong} & ${ninang}`
                : 'Phone: two lines, ninang first';
            return (
              <div key={index} className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">#{index + 1}</span>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer select-none">
                    <input type="checkbox" checked={pair.couple} onChange={() => toggleCouple(index)} className="w-4 h-4 accent-gray-900 dark:accent-zinc-100" />
                    Couple
                  </label>
                  <button
                    onClick={() => removeSponsorPair(index)}
                    className="ml-auto p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove pair"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderSponsorInput(index, 'ninang')}
                  {renderSponsorInput(index, 'ninong')}
                </div>
                <p className={`text-xs ${ninang && ninong ? 'text-gray-500 dark:text-zinc-400' : 'text-amber-700 dark:text-amber-400'}`}>{preview}</p>
              </div>
            );
          })}
          {pairs.length === 0 && (
            <div className="text-center py-8 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500">
              No principal sponsors added yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Header Content</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle</label>
            <input 
              maxLength={TEXT_LIMITS.heading}
              type="text" 
              name="subtitle"
              value={data.subtitle}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <CharCount value={data.subtitle} max={TEXT_LIMITS.heading} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
            <input 
              maxLength={TEXT_LIMITS.heading}
              type="text" 
              name="title"
              value={data.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <CharCount value={data.title} max={TEXT_LIMITS.heading} />
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

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Parents of the Groom", "groomParents")}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Parents of the Bride", "brideParents")}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      {renderSponsorsSection()}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Bridesmaids", "bridesmaids")}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Groomsmen", "groomsmen")}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Flower Girls", "flowerGirls")}
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
      {renderArraySection("Ring Bearers", "ringBearers")}

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
        message="This will update the Entourage section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
