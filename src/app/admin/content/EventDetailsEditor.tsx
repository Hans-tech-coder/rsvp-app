'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, X, Plus, Trash2, GripVertical } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { uploadImage } from '@/lib/blob/uploadImage';
import { useContentDefaults } from './contentDefaults';
import type { WeddingContent } from '@/lib/contentMerge';
import { emptyVenue, readVenues, venuesFromLegacy, type Venue } from '@/lib/genericContent';
import { AdminModal } from '../components/AdminModal';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import { CharCount, TEXT_LIMITS } from './CharCount';
import { nanoid } from 'nanoid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Venues / program: any number of cards, each with its own time, place and
// address (edited only here). Content saved before Oct 2026 had a fixed
// ceremony + reception whose time, location and address lived in Global
// Settings; venuesFromLegacy() reads that shape until the first save.

type DetailsForm = { header: WeddingContent['details']['header']; venues: Venue[]; orderOfEventsImage: string };

const inputClass = "w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all";

function formFromDoc(weddingContent: WeddingContent, saved: DocumentData, globalDoc: DocumentData | undefined): DetailsForm {
  return {
    header: { ...weddingContent.details.header, ...(saved.header || {}) },
    venues: readVenues(saved.venues) ?? venuesFromLegacy(saved, globalDoc) ?? weddingContent.details.venues,
    orderOfEventsImage: saved.orderOfEventsImage || weddingContent.details.orderOfEventsImage || '',
  };
}

export function EventDetailsEditor({ eventId }: { eventId: string }) {
  const weddingContent = useContentDefaults().content;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'details');
  const loadDraft = draft.load;
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Old-shape venues take their time / location / address from Global Settings
  const globalDocRef = useRef<DocumentData | undefined>(undefined);

  const initial: DetailsForm = {
    header: weddingContent.details.header,
    venues: weddingContent.details.venues,
    orderOfEventsImage: '',
  };
  const [data, setData] = useState<DetailsForm>(initial);
  const [originalData, setOriginalData] = useState<DetailsForm>(initial);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loaded, globalSnap] = await Promise.all([
          loadDraft(),
          getDoc(doc(db, paths.content(eventId, 'globalSettings'))),
        ]);
        globalDocRef.current = globalSnap.data();

        if (loaded) {
          const mergedData = formFromDoc(weddingContent, loaded, globalDocRef.current);
          setData(mergedData);
          setOriginalData(mergedData);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, loadDraft, weddingContent]);

  const updateVenue = (index: number, field: keyof Venue, value: string) => {
    setData(prev => ({ ...prev, venues: prev.venues.map((v, i) => (i === index ? { ...v, [field]: value } : v)) }));
    setSaved(false);
  };

  const addVenue = () => {
    setData(prev => ({ ...prev, venues: [...prev.venues, emptyVenue(nanoid())] }));
    setSaved(false);
  };

  const executeRemoveVenue = () => {
    if (venueToDelete === null) return;
    setData(prev => ({ ...prev, venues: prev.venues.filter((_, i) => i !== venueToDelete) }));
    setVenueToDelete(null);
    setSaved(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setData(prev => {
        const oldIndex = prev.venues.findIndex(v => v.id === active.id);
        const newIndex = prev.venues.findIndex(v => v.id === over.id);
        return { ...prev, venues: arrayMove(prev.venues, oldIndex, newIndex) };
      });
      setSaved(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // merge: true keeps the old ceremony / reception fields for older code
      if (!(await draft.save(data, { merge: true }))) return false;

      setOriginalData(data);
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
    setData(originalData);
    setSaved(false);
  };

  const handleRestore = (version: DocumentData) => {
    setData(formFromDoc(weddingContent, version, globalDocRef.current));
    setSaved(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
                className={inputClass}
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
                className={inputClass}
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
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Venues</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">One card per venue or program stop (ceremony, reception, registration, sessions…), in the order guests see them. Drag to reorder. Empty fields and buttons are hidden on the site.</p>
          </div>
          <button
            onClick={addVenue}
            className="flex items-center gap-2 shrink-0 px-4 py-2 bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Venue
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <SortableContext items={data.venues.map(v => v.id)} strategy={verticalListSortingStrategy}>
              {data.venues.map((venue, index) => (
                <SortableVenue
                  key={venue.id}
                  venue={venue}
                  index={index}
                  onChange={updateVenue}
                  onRemove={setVenueToDelete}
                />
              ))}
            </SortableContext>
            {data.venues.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                <p className="text-gray-500 dark:text-zinc-400">No venues yet. Add one to get started.</p>
              </div>
            )}
          </div>
        </DndContext>
      </div>

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

      <EditorSaveBar draft={draft} doc={data} merge hasChanges={hasChanges} saving={saving} saved={saved} busy={isUploadingImage} onUndo={handleUndo} onRestore={handleRestore} onSave={handleSave} />

      <AdminModal
        isOpen={venueToDelete !== null}
        onClose={() => setVenueToDelete(null)}
        onConfirm={executeRemoveVenue}
        title="Remove Venue"
        message={`Remove "${(venueToDelete !== null && data.venues[venueToDelete]?.title) || 'this venue'}"? It leaves the site when you save.`}
        type="confirm"
        variant="danger"
        confirmText="Yes, remove it"
      />
    </div>
  );
}

function SortableVenue({
  venue,
  index,
  onChange,
  onRemove,
}: {
  venue: Venue;
  index: number;
  onChange: (index: number, field: keyof Venue, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: venue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const field = (name: keyof Venue, label: string, opts: { placeholder?: string; max?: number; mono?: boolean; wide?: boolean } = {}) => (
    <div className={`space-y-2 ${opts.wide ? '@2xl:col-span-2' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</label>
      <input
        type="text"
        maxLength={opts.max}
        value={venue[name]}
        onChange={(e) => onChange(index, name, e.target.value)}
        placeholder={opts.placeholder}
        className={`${inputClass} ${opts.mono ? 'font-mono text-sm' : ''}`}
      />
      {opts.max && <CharCount value={venue[name]} max={opts.max} />}
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">#{index + 1}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate">{venue.title || 'Untitled venue'}</span>
        <div className="ml-auto flex items-center gap-1">
          <div
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Remove venue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-6">
        {field('subtitle', 'Card Subtitle (e.g., The Vows)', { max: TEXT_LIMITS.cardTitle })}
        {field('title', 'Title', { max: TEXT_LIMITS.cardTitle })}
        {field('time', 'Time', { placeholder: 'e.g. 3:00 PM' })}
        {field('location', 'Location Name')}
        {field('address', 'Full Address', { wide: true })}
        <div className="space-y-2 @2xl:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
          <textarea
            value={venue.description}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>
        {field('mapLink', 'Map Link URL (embed link for the map window)')}
        {field('calendarLoc', 'Calendar Link: Location')}
        {field('calendarDesc', 'Calendar Link: Description')}
        {field('calendarStart', 'Calendar Start (YYYY-MM-DDTHH:mm:ss)', { placeholder: 'e.g. 2026-12-20T15:00:00', mono: true })}
      </div>
    </div>
  );
}
