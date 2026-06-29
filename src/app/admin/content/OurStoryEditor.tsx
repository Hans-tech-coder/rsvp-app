'use client';

import { useState, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon, Save, Check, RotateCcw, History, Plus, Trash2, GripVertical } from 'lucide-react';
import { db, storage } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import weddingContent from '@/data/wedding-content.json';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function OurStoryEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  // State for the form fields
  const [header, setHeader] = useState({
    subtitle: weddingContent.ourStory.subtitle,
    title: weddingContent.ourStory.title,
    description: weddingContent.ourStory.description
  });
  const [originalHeader, setOriginalHeader] = useState({ ...header });
  
  const [items, setItems] = useState(weddingContent.ourStory.items.map(item => ({ ...item, id: nanoid() })));
  const [originalItems, setOriginalItems] = useState(weddingContent.ourStory.items.map(item => ({ ...item, id: nanoid() })));

  const hasChanges = JSON.stringify(items) !== JSON.stringify(originalItems) || JSON.stringify(header) !== JSON.stringify(originalHeader);

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
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'websiteContent', 'ourStory');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.items) {
            const mappedItems = data.items.map((item: any) => ({ ...item, id: nanoid() }));
            setItems(mappedItems);
            setOriginalItems(mappedItems);
          }
          setHeader(prev => ({
            ...prev,
            subtitle: data.subtitle ?? prev.subtitle,
            title: data.title ?? prev.title,
            description: data.description ?? prev.description
          }));
          setOriginalHeader(prev => ({
            ...prev,
            subtitle: data.subtitle ?? prev.subtitle,
            title: data.title ?? prev.title,
            description: data.description ?? prev.description
          }));
        }

        const backupRef = doc(db, 'websiteContent', 'ourStory_backup');
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
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [name]: value };
      return newItems;
    });
    setSaved(false);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageIndex(index);
    setSaved(false);
    
    try {
      const storageRef = ref(storage, `images/our-story-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setItems(prev => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], image: downloadURL };
        return newItems;
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const addNewItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: nanoid(),
        date: "",
        title: "",
        image: "",
        description: ""
      }
    ]);
    setSaved(false);
  };

  const confirmRemoveItem = (index: number) => {
    setItemToDelete(index);
    setIsDeleteModalOpen(true);
  };

  const executeRemoveItem = () => {
    if (itemToDelete !== null) {
      setItems(prev => prev.filter((_, i) => i !== itemToDelete));
      setSaved(false);
      setItemToDelete(null);
    }
    setIsDeleteModalOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      setSaved(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        subtitle: header.subtitle,
        title: header.title,
        description: header.description,
        items: items.map(({ id, ...rest }) => rest)
      };
      const backupPayload = {
        subtitle: originalHeader.subtitle,
        title: originalHeader.title,
        description: originalHeader.description,
        items: originalItems.map(({ id, ...rest }) => rest)
      };

      const backupRef = doc(db, 'websiteContent', 'ourStory_backup');
      await setDoc(backupRef, backupPayload, { merge: true });

      const docRef = doc(db, 'websiteContent', 'ourStory');
      await setDoc(docRef, payload, { merge: true });
      
      setOriginalItems(items);
      setOriginalHeader(header);
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
    setItems(originalItems);
    setHeader(originalHeader);
    setSaved(false);
  };

  const handleRestoreBackup = async () => {
    setIsRestoreModalOpen(true);
  };

  const executeRestore = async () => {
    setRestoring(true);
    setIsRestoreModalOpen(false);
    try {
      const backupRef = doc(db, 'websiteContent', 'ourStory_backup');
      const backupSnap = await getDoc(backupRef);
      if (backupSnap.exists()) {
        const data = backupSnap.data();
        if (data.items) {
          setItems(data.items.map((item: any) => ({ ...item, id: nanoid() })));
        }
        setHeader(prev => ({
          ...prev,
          subtitle: data.subtitle ?? prev.subtitle,
          title: data.title ?? prev.title,
          description: data.description ?? prev.description
        }));
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

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Header Content</h3>
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
            <textarea 
              name="description"
              value={header.description}
              onChange={handleHeaderChange}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Our Story Chapters</h3>
        <button
          onClick={addNewItem}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Chapter
        </button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <SortableContext 
            items={items.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, index) => (
              <SortableStoryItem 
                key={item.id}
                item={item}
                index={index}
                handleChange={handleChange}
                handleImageUpload={handleImageUpload}
                confirmRemoveItem={confirmRemoveItem}
                uploadingImageIndex={uploadingImageIndex}
              />
            ))}
          </SortableContext>
          {items.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
              <p className="text-gray-500 dark:text-zinc-400">No story chapters yet. Add one to get started!</p>
            </div>
          )}
        </div>
      </DndContext>

      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-gray-200 dark:border-zinc-800 mt-12">
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Undo Changes
            </button>
          )}
          {hasBackup && (
            <button
              onClick={() => setIsRestoreModalOpen(true)}
              disabled={saving}
              className="flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <History className="w-4 h-4" />
              Restore Previous Save
            </button>
          )}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={saving || !hasChanges}
            className={`flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg transition-colors ${
              !hasChanges 
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
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={executeRemoveItem}
        title="Remove Story Chapter"
        message="Are you sure you want to remove this story chapter? This action cannot be undone."
        type="confirm"
        variant="danger"
        confirmText="Yes, delete it"
      />

      <AdminModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
        title="Publish Changes?"
        message="This will update the Our Story section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}

function SortableStoryItem({ 
  item, 
  index, 
  handleChange, 
  handleImageUpload, 
  confirmRemoveItem,
  uploadingImageIndex 
}: { 
  item: any, 
  index: number, 
  handleChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  handleImageUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void,
  confirmRemoveItem: (index: number) => void,
  uploadingImageIndex: number | null
}) {
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
      className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm relative group"
    >
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div 
          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to reorder"
          {...attributes} 
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <button 
          onClick={() => confirmRemoveItem(index)}
          className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remove Chapter"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-4">
        <div className="relative w-full md:w-48 h-48 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.title || "Chapter Image"} 
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-sm">No image</span>
            </div>
          )}
          {uploadingImageIndex === index && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          )}
          
          <div className="absolute bottom-2 right-2">
            <input 
              type="file" 
              id={`story-image-upload-${item.id}`} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleImageUpload(index, e)}
              disabled={uploadingImageIndex === index}
            />
            <label 
              htmlFor={`story-image-upload-${item.id}`}
              className="inline-flex items-center justify-center w-8 h-8 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full shadow-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              title="Change Image"
            >
              <Upload className="w-4 h-4" />
            </label>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Date / Timeframe</label>
              <input 
                type="text" 
                name="date"
                value={item.date}
                onChange={(e) => handleChange(index, e)}
                placeholder="e.g. September 2020"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Chapter Title</label>
              <input 
                type="text" 
                name="title"
                value={item.title}
                onChange={(e) => handleChange(index, e)}
                placeholder="e.g. A Serendipitous Encounter"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
            <textarea 
              name="description"
              value={item.description}
              onChange={(e) => handleChange(index, e)}
              rows={4}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
