'use client';

import { useState, useEffect, useId } from 'react';
import { Loader2, Upload, Music2, RotateCcw } from 'lucide-react';
import { DEFAULT_MUSIC, MUSIC_MAX_BYTES, MUSIC_MIN_VOLUME, mergeMusic, musicSrc, type Music } from '@/lib/music';
import { uploadAudio } from '@/lib/blob/uploadAudio';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';

const secondaryButton =
  'inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50';

// The guest site's background music (`content/music`): on/off, the track (an
// upload to Vercel Blob or the default track in public/) and the volume it
// starts at. Read on the server and played by src/components/AudioPlayer.tsx.
export function MusicEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'music');
  const loadDraft = draft.load;
  const [uploading, setUploading] = useState(false);
  const ids = useId();

  const [formData, setFormData] = useState<Music>(DEFAULT_MUSIC);
  const [originalData, setOriginalData] = useState<Music>(DEFAULT_MUSIC);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadDraft();
        if (data) {
          const fetchedData = mergeMusic(data);
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }
      } catch (error) {
        console.error('Error fetching music:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loadDraft]);

  const update = (patch: Partial<Music>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAudio(eventId, file);
      update({ url, fileName: file.name });
    } catch (error) {
      console.error('Error uploading music:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload the song. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!(await draft.save(formData, { merge: false }))) return false;

      setOriginalData(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (error) {
      console.error('Error saving music:', error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : error}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (data: DocumentData) => {
    setFormData(mergeMusic(data));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const percent = Math.round(formData.volume * 100);
  const trackName = formData.url ? formData.fileName || 'Uploaded song' : 'Default song (comes with the website)';

  return (
    <div className="space-y-8 max-w-2xl">
      {/* On / off */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Background Music</h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="mt-0.5 w-5 h-5 shrink-0 rounded border-gray-300 dark:border-zinc-600 accent-gray-900 dark:accent-zinc-100"
          />
          <span>
            <span className="block text-sm font-medium text-gray-900 dark:text-zinc-100">Play music on the website</span>
            <span className="block text-sm text-gray-500 dark:text-zinc-400">
              Starts on the guest&apos;s first tap (browsers do not allow sound before that). Guests can mute it or change the volume with the round button in the corner.
            </span>
          </span>
        </label>
      </section>

      <fieldset disabled={!formData.enabled} className="space-y-8 disabled:opacity-50">
        {/* Track */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Song</h3>
          <div className="relative rounded-xl border border-gray-200 dark:border-zinc-800 p-4 space-y-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400">
                <Music2 className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{trackName}</span>
            </div>
            {/* key: a new upload reloads the player */}
            <audio key={musicSrc(formData)} controls preload="none" src={musicSrc(formData)} className="w-full" aria-label={`Listen: ${trackName}`} />
            {uploading && (
              <div className="absolute inset-0 rounded-xl bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Uploading...
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            MP3 works on every phone. Up to {MUSIC_MAX_BYTES / 1024 / 1024} MB (about 10 minutes); smaller files start faster for guests on mobile data.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              type="file"
              id={`${ids}-upload`}
              accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/*"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading || !formData.enabled}
            />
            <label htmlFor={`${ids}-upload`} className={`${secondaryButton} cursor-pointer`}>
              <Upload className="w-4 h-4" aria-hidden="true" />
              {formData.url ? 'Upload a different song' : 'Upload a song'}
            </label>
            {formData.url && (
              <button type="button" onClick={() => update({ url: '', fileName: '' })} className={secondaryButton}>
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Use the default song
              </button>
            )}
          </div>
        </section>

        {/* Volume */}
        <section className="space-y-3">
          <div>
            <label htmlFor={`${ids}-volume`} className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Starting volume</label>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">How loud the music is when it starts. Keep it soft so it does not startle guests.</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              id={`${ids}-volume`}
              type="range"
              min={MUSIC_MIN_VOLUME * 100}
              max={100}
              step={5}
              value={percent}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
              aria-valuetext={`${percent}%`}
              className="flex-1 accent-gray-900 dark:accent-zinc-100"
            />
            <span className="w-12 text-right text-sm tabular-nums text-gray-700 dark:text-zinc-300">{percent}%</span>
          </div>
        </section>
      </fieldset>

      <EditorSaveBar draft={draft} doc={formData} hasChanges={hasChanges} saving={saving} saved={saved} busy={uploading} onUndo={() => { setFormData(originalData); setSaved(false); }} onRestore={handleRestore} onSave={handleSave} />
    </div>
  );
}
