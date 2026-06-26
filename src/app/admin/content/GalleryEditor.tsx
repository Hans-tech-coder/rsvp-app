'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Check, RotateCcw, History, Plus, Trash2, Upload, ImageIcon, GripVertical } from 'lucide-react';
import { db, storage } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { AdminModal } from '../components/AdminModal';
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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type GalleryItem = {
  id: string;
  url: string;
  isUploading?: boolean;
  file?: File;
};

export function GalleryEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  const { content: weddingContent } = useWeddingContent();
  const [header, setHeader] = useState({
    subtitle: weddingContent.galleryHeader?.subtitle || "Our Memories",
    title: weddingContent.galleryHeader?.title || "The Gallery"
  });
  const [originalHeader, setOriginalHeader] = useState({ ...header });

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [originalGallery, setOriginalGallery] = useState<GalleryItem[]>([]);
  const [lastBackup, setLastBackup] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const docRef = doc(db, 'websiteContent', 'gallery');
      const docSnap = await getDoc(docRef);
      
      const backupRef = doc(db, 'websiteContent', 'gallery_backup');
      const backupSnap = await getDoc(backupRef);
      
      if (backupSnap.exists()) {
        setHasBackup(true);
        setLastBackup(backupSnap.data());
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.images && Array.isArray(data.images)) {
           const mappedGallery = data.images.map((url: string) => ({ id: nanoid(), url }));
           setGallery(mappedGallery);
           setOriginalGallery(mappedGallery);
        } else {
            setGallery([]);
            setOriginalGallery([]);
        }
        if (data.header) {
          setHeader({
            subtitle: data.header.subtitle || "Our Memories",
            title: data.header.title || "The Gallery"
          });
          setOriginalHeader({
            subtitle: data.header.subtitle || "Our Memories",
            title: data.header.title || "The Gallery"
          });
        }
      } else {
        // Fallback to local data
        const fallbackGallery = (weddingContent.gallery || []).map((url: string) => ({ id: nanoid(), url }));
        setGallery(fallbackGallery);
        setOriginalGallery(fallbackGallery);
      }
    } catch (err) {
      console.error('Error fetching gallery content:', err);
      setError('Failed to load gallery content');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    setGallery(originalGallery);
    setHeader(originalHeader);
    setSaved(false);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Create temporary items
    const newItems = files.map(file => ({
      id: nanoid(),
      url: '',
      isUploading: true,
      file
    }));

    setGallery(prev => [...prev, ...newItems]);
    setSaved(false);

    // Upload files sequentially or in parallel
    // Doing sequentially here to avoid memory spikes if many images
    for (const item of newItems) {
      try {
        if (!item.file) continue;
        const fileExtension = item.file.name.split('.').pop();
        const fileName = `gallery-${Date.now()}-${nanoid()}.${fileExtension}`;
        const storageRef = ref(storage, `gallery/${fileName}`);
        
        await uploadBytes(storageRef, item.file);
        const url = await getDownloadURL(storageRef);
        
        setGallery(prev => prev.map(p => p.id === item.id ? { ...p, url, isUploading: false, file: undefined } : p));
      } catch (err) {
        console.error('Error uploading image:', err);
        setGallery(prev => prev.filter(p => p.id !== item.id));
        setError('Failed to upload some images. Please try again.');
      }
    }
    
    // Clear input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    setGallery(prev => prev.filter(item => item.id !== id));
    setSaved(false);
  };

  const handleSingleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setGallery(prev => prev.map(p => p.id === id ? { ...p, isUploading: true } : p));
      
      const fileExtension = file.name.split('.').pop();
      const fileName = `gallery-${Date.now()}-${nanoid()}.${fileExtension}`;
      const storageRef = ref(storage, `gallery/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setGallery(prev => prev.map(p => p.id === id ? { ...p, url, isUploading: false } : p));
      setSaved(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
      setGallery(prev => prev.map(p => p.id === id ? { ...p, isUploading: false } : p));
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setGallery((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      setSaved(false);
    }
  };

  const saveContent = async () => {
    try {
      setSaving(true);
      setError(null);

      // Create backup
      const currentDocRef = doc(db, 'websiteContent', 'gallery');
      const currentDocSnap = await getDoc(currentDocRef);
      
      if (currentDocSnap.exists()) {
        const backupRef = doc(db, 'websiteContent', 'gallery_backup');
        await setDoc(backupRef, {
            ...currentDocSnap.data(),
            backedUpAt: new Date().toISOString()
        });
        setHasBackup(true);
        setLastBackup(currentDocSnap.data());
      }

      const imageUrls = gallery.map(item => item.url).filter(url => url !== '');
      await setDoc(currentDocRef, { images: imageUrls, header });
      setOriginalHeader(header);
      setOriginalGallery(gallery);

      setSaved(true);
      setShowConfirmModal(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const restoreBackup = async () => {
    if (!lastBackup) return;
      
    try {
      setSaving(true);
      setError(null);
        
      const docRef = doc(db, 'websiteContent', 'gallery');
      await setDoc(docRef, lastBackup);
        
      const mergedData = lastBackup.images ?? weddingContent.gallery;
      setGallery(mergedData.map((url: string) => ({ id: nanoid(), url })));
      
      if (lastBackup.header) {
        setHeader(lastBackup.header);
        setOriginalHeader(lastBackup.header);
      } else if (weddingContent.galleryHeader) {
        setHeader(weddingContent.galleryHeader);
        setOriginalHeader(weddingContent.galleryHeader);
      }

      setSaved(true);
      setShowRestoreModal(false);
      setIsSuccessModalOpen(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setError('Failed to restore backup');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-wedding-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Gallery Details</h2>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">
          Manage the photos displayed in the gallery. Drag the handles to reorder images.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Header Content</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle</label>
              <input 
                type="text" 
                name="subtitle"
                value={header.subtitle}
                onChange={handleHeaderChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
              <input 
                type="text" 
                name="title"
                value={header.title}
                onChange={handleHeaderChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Photos</h3>
          <div>
            <input 
              type="file" 
              id="gallery-bulk-upload" 
              accept="image/*" 
              multiple
              className="hidden" 
              onChange={handleBulkUpload}
            />
            <label 
              htmlFor="gallery-bulk-upload"
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Photos
            </label>
          </div>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-wrap gap-4">
            <SortableContext 
              items={gallery.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              {gallery.map((item, index) => (
                <SortableGalleryItem 
                  key={item.id} 
                  item={item} 
                  index={index} 
                  onRemove={removeImage} 
                  onUpload={handleSingleImageUpload} 
                />
              ))}
            </SortableContext>
            {gallery.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 italic col-span-full">No gallery images added yet.</p>
            )}
          </div>
        </DndContext>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-gray-200 dark:border-zinc-800 mt-12">
        {error && (
          <div className="w-full text-left sm:w-auto sm:mr-auto">
            <p className="text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          </div>
        )}
        <div className="flex w-full sm:w-auto items-center gap-3">
          {(JSON.stringify(gallery.map(i => i.url)) !== JSON.stringify(originalGallery.map(i => i.url)) || JSON.stringify(header) !== JSON.stringify(originalHeader)) && (
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Undo Changes
            </button>
          )}
          {hasBackup && (
            <button
              onClick={() => setShowRestoreModal(true)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <History className="w-4 h-4" />
              Restore Previous Save
            </button>
          )}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={saving || !(JSON.stringify(gallery.map(i => i.url)) !== JSON.stringify(originalGallery.map(i => i.url)) || JSON.stringify(header) !== JSON.stringify(originalHeader))}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors ${
              !(JSON.stringify(gallery.map(i => i.url)) !== JSON.stringify(originalGallery.map(i => i.url)) || JSON.stringify(header) !== JSON.stringify(originalHeader)) 
                ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                : 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200'
            }`}
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
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={saveContent}
        title="Publish Changes?"
        message="This will update the Gallery section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />

      <AdminModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={restoreBackup}
        title="Restore Previous Save?"
        message="This will replace all your current edits with the last saved version. This action cannot be undone."
        type="confirm"
        variant="warning"
        confirmText={saving ? "Restoring..." : "Yes, Restore"}
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
    </div>
  );
}

function SortableGalleryItem({ item, index, onRemove, onUpload }: { item: GalleryItem, index: number, onRemove: (id: string) => void, onUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex flex-col gap-2 items-center p-2 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800 relative group w-36"
    >
      <div className="absolute top-1 left-2 z-10 flex items-center justify-center w-5 h-5 bg-gray-200/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 text-[10px] font-bold rounded-full backdrop-blur-sm shadow-sm">
        {index + 1}
      </div>
      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 dark:bg-zinc-800/90 rounded-md shadow-sm backdrop-blur-sm">
        <div 
          className="p-1 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to reorder"
          {...attributes} 
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <button 
          onClick={() => onRemove(item.id)}
          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          title="Remove Image"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative w-32 h-32 bg-gray-200 dark:bg-zinc-800 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-zinc-700 mt-1">
        {item.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">No Image</span>
          </div>
        )}
        
        {item.isUploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs font-medium">Uploading...</span>
          </div>
        )}

        {!item.isUploading && (
          <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <input 
              type="file" 
              id={`gallery-upload-${item.id}`} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => onUpload(item.id, e)}
              disabled={item.isUploading}
            />
            <label 
              htmlFor={`gallery-upload-${item.id}`}
              className="inline-flex items-center justify-center w-8 h-8 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full shadow-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              title="Change Image"
            >
              <Upload className="w-4 h-4" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
