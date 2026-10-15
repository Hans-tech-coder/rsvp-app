'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import weddingContent from '@/data/wedding-content.json';
import { AdminModal } from '../components/AdminModal';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';
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

export function FaqsEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'faq');
  const loadDraft = draft.load;
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
        const data = await loadDraft();
        if (data) {
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
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadDraft]);

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
      
      const dataToSave = items.map(({ id, ...rest }) => rest);
      const ok = await draft.save({
        header,
        items: dataToSave,
        updatedAt: new Date().toISOString()
      }, { merge: false });
      if (!ok) return false;

      setOriginalHeader(header);
      setOriginalItems(items.map(item => ({ ...item })));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Failed to save changes. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (version: DocumentData) => {
    if (Array.isArray(version.items)) {
      setItems(version.items.map((item) => ({ ...item, id: nanoid() })));
    }
    if (version.header) {
      setHeader(prev => ({ ...prev, ...version.header }));
    }
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
              maxLength={TEXT_LIMITS.heading}
              type="text" 
              name="subtitle"
              value={header.subtitle}
              onChange={handleHeaderChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <CharCount value={header.subtitle} max={TEXT_LIMITS.heading} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Title</label>
            <input 
              maxLength={TEXT_LIMITS.heading}
              type="text" 
              name="title"
              value={header.title}
              onChange={handleHeaderChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <CharCount value={header.title} max={TEXT_LIMITS.heading} />
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

      <EditorSaveBar draft={draft} hasChanges={hasChanges} saving={saving} saved={saved} onUndo={handleUndo} onRestore={handleRestore} onSave={saveContent} />

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
