'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Check, RotateCcw, History, Plus, Trash2, GripVertical } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

export function FaqsEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // State for the form fields
  const [header, setHeader] = useState({
    subtitle: weddingContent.faqHeader?.subtitle || "Guest Information",
    title: weddingContent.faqHeader?.title || "Things You Might Want to Know",
    description: weddingContent.faqHeader?.description || "Quick answers for our beloved guests"
  });
  const [originalHeader, setOriginalHeader] = useState({ ...header });
  
  const [items, setItems] = useState((weddingContent.faq || []).map(item => ({ ...item, id: nanoid() })));
  const [originalItems, setOriginalItems] = useState((weddingContent.faq || []).map(item => ({ ...item, id: nanoid() })));

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
        const docRef = doc(db, 'websiteContent', 'faq');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.items && Array.isArray(data.items)) {
            const mappedItems = data.items.map((item: any) => ({ ...item, id: nanoid() }));
            setItems(mappedItems);
            setOriginalItems(mappedItems);
          }
          if (data.header) {
            setHeader(prev => ({
              ...prev,
              ...data.header
            }));
            setOriginalHeader(prev => ({
              ...prev,
              ...data.header
            }));
          }
        }

        const backupRef = doc(db, 'websiteContent', 'faq_backup');
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

  const handleChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItems(prev => prev.map(item => item.id === id ? { ...item, [name]: value } : item));
    setSaved(false);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const addNewItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: nanoid(),
        q: "New Question",
        a: "New Answer"
      }
    ]);
    setSaved(false);
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = () => {
    if (itemToDelete !== null) {
      setItems(prev => prev.filter(item => item.id !== itemToDelete));
      setSaved(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleUndo = () => {
    setItems(originalItems);
    setHeader(originalHeader);
    setSaved(false);
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

  const saveContent = async () => {
    try {
      setSaving(true);
      
      const docRef = doc(db, 'websiteContent', 'faq');
      const backupRef = doc(db, 'websiteContent', 'faq_backup');
      
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        await setDoc(backupRef, {
          ...currentDoc.data(),
          backedUpAt: new Date().toISOString()
        });
        setHasBackup(true);
      }
      
      const dataToSave = items.map(({ id, ...rest }) => rest);
      await setDoc(docRef, { 
        header,
        items: dataToSave,
        updatedAt: new Date().toISOString() 
      });
      
      setOriginalHeader(header);
      setOriginalItems(items.map(item => ({ ...item })));
      
      setSaved(true);
      setShowConfirmModal(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const restoreBackup = async () => {
    try {
      setRestoring(true);
      const backupRef = doc(db, 'websiteContent', 'faq_backup');
      const backupSnap = await getDoc(backupRef);
      
      if (backupSnap.exists()) {
        const backupData = backupSnap.data();
        
        if (backupData.items && Array.isArray(backupData.items)) {
          const mappedItems = backupData.items.map((item: any) => ({ ...item, id: nanoid() }));
          setItems(mappedItems);
          setOriginalItems(mappedItems);
        }
        if (backupData.header) {
          setHeader(prev => ({
            ...prev,
            ...backupData.header
          }));
          setOriginalHeader(prev => ({
            ...prev,
            ...backupData.header
          }));
        }

        const docRef = doc(db, 'websiteContent', 'faq');
        await setDoc(docRef, {
          header: backupData.header || header,
          items: backupData.items || [],
          updatedAt: new Date().toISOString(),
          restoredAt: new Date().toISOString()
        });

        setIsRestoreModalOpen(false);
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      alert("Failed to restore backup. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-wedding-gold" />
      </div>
    );
  }

  const hasChanges = JSON.stringify(items.map(i => ({ q: i.q, a: i.a }))) !== JSON.stringify(originalItems.map(i => ({ q: i.q, a: i.a }))) || JSON.stringify(header) !== JSON.stringify(originalHeader);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">FAQs Details</h2>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">
          Manage the frequently asked questions displayed on the RSVP screen. Drag to reorder items.
        </p>
      </div>

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
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Questions & Answers</h3>
          <button 
            onClick={addNewItem}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <SortableContext 
              items={items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableFaqItem 
                  key={item.id} 
                  item={item} 
                  index={index} 
                  onChange={(e) => handleChange(item.id, e)} 
                  onRemove={() => confirmDelete(item.id)} 
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>

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
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={saveContent}
        title="Publish Changes?"
        message="This will update the FAQs section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />

      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Item?"
        message="Are you sure you want to remove this item? This action cannot be undone once saved."
        type="confirm"
        variant="danger"
        confirmText="Yes, Delete"
      />

      <AdminModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={restoreBackup}
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
    </div>
  );
}

function SortableFaqItem({ item, index, onChange, onRemove }: { item: any, index: number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, onRemove: () => void }) {
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
      className="p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800 relative group"
    >
      <div className="absolute top-4 left-4 flex items-center justify-center w-6 h-6 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-semibold rounded-full border border-gray-200 dark:border-zinc-700">
        {index + 1}
      </div>
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
          onClick={onRemove}
          className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remove Item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-8 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Question</label>
          <input 
            type="text" 
            name="q"
            value={item.q}
            onChange={onChange}
            className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all font-medium"
            placeholder="e.g. Can I bring a plus one?"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Answer</label>
          <textarea 
            name="a"
            value={item.a}
            onChange={onChange}
            rows={4}
            className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            placeholder="e.g. To help us maintain an accurate guest count..."
          />
        </div>
      </div>
    </div>
  );
}
