'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Upload, ImageIcon, GripVertical } from 'lucide-react';
import { uploadImage } from '@/lib/blob/uploadImage';
import { useContentDefaults } from './contentDefaults';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';
import { CharCount, TEXT_LIMITS } from './CharCount';
import { guidelinesFromLegacy, readGuidelines, type Guideline } from '@/lib/genericContent';
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

interface ColorData {
  name: string;
  hex: string;
}

interface ImageData {
  id?: string;
  type: string;
  url: string;
}

interface DressCodeData {
  header: {
    subtitle: string;
    title: string;
  };
  title: string;
  description: string;
  guidelines: Guideline[];
  colors: ColorData[];
  inspirationImages: ImageData[];
}

export function DressCodeEditor({ eventId }: { eventId: string }) {
  const weddingContent = useContentDefaults().content;
  const [data, setData] = useState<DressCodeData>({
    header: {
      subtitle: weddingContent.dressCode.header?.subtitle || "The Style Guideline",
      title: weddingContent.dressCode.header?.title || "La Palette de l'Amour",
    },
    title: weddingContent.dressCode.title,
    description: weddingContent.dressCode.description,
    guidelines: weddingContent.dressCode.guidelines,
    colors: weddingContent.dressCode.colors || [],
    inspirationImages: (weddingContent.dressCode.inspirationImages || []).map(img => ({ ...img, id: nanoid() }))
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [originalData, setOriginalData] = useState<DressCodeData | null>(null);
  
  const draft = useContentDraft(eventId, 'dressCode');
  
  const loadDraft = draft.load;

  const hasChanges = !!originalData && JSON.stringify(data) !== JSON.stringify(originalData);

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

  // A saved doc (draft, live or a version) over the defaults; ids for the sortable images.
  const fromDoc = useCallback((fetchedData: DocumentData): DressCodeData => ({
    header: {
      ...(weddingContent.dressCode.header || { subtitle: "The Style Guideline", title: "La Palette de l'Amour" }),
      ...(fetchedData.header || {})
    },
    title: fetchedData.title ?? weddingContent.dressCode.title,
    description: fetchedData.description ?? weddingContent.dressCode.description,
    // Content saved before Oct 2026: ladiesGuideline / gentlemenGuideline
    guidelines: readGuidelines(fetchedData.guidelines) ?? guidelinesFromLegacy(fetchedData) ?? weddingContent.dressCode.guidelines,
    colors: fetchedData.colors ?? weddingContent.dressCode.colors,
    inspirationImages: (Array.isArray(fetchedData.inspirationImages) ? fetchedData.inspirationImages : weddingContent.dressCode.inspirationImages).map((img) => ({ ...img, id: nanoid() })),
  }), [weddingContent]);

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedData = await loadDraft();
        if (fetchedData) {
          const mergedData = fromDoc(fetchedData);
          setData(mergedData);
          setOriginalData(mergedData);
        }
      } catch (err: any) {
        console.error("Error fetching dress code data:", err);
        setError("Failed to load data. You can still edit and save to override.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [loadDraft, fromDoc]);

  const handleUndo = () => {
    if (originalData) {
      setData(originalData);
      setSaved(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: value
    }));
    setSaved(false);
  };

  const updateGuideline = (index: number, field: 'title' | 'text', value: string) => {
    setData(prev => ({ ...prev, guidelines: prev.guidelines.map((g, i) => (i === index ? { ...g, [field]: value } : g)) }));
    setSaved(false);
  };

  const addGuideline = () => {
    setData(prev => ({ ...prev, guidelines: [...prev.guidelines, { id: nanoid(), title: '', text: '' }] }));
    setSaved(false);
  };

  const removeGuideline = (index: number) => {
    setData(prev => ({ ...prev, guidelines: prev.guidelines.filter((_, i) => i !== index) }));
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

  const handleColorChange = (index: number, field: keyof ColorData, value: string) => {
    const newColors = [...data.colors];
    newColors[index] = { ...newColors[index], [field]: value };
    setData(prev => ({ ...prev, colors: newColors }));
    setSaved(false);
  };

  const addColor = () => {
    setData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: 'New Color', hex: '#000000' }]
    }));
    setSaved(false);
  };

  const removeColor = (index: number) => {
    const newColors = [...data.colors];
    newColors.splice(index, 1);
    setData(prev => ({ ...prev, colors: newColors }));
    setSaved(false);
  };

  const handleImageChange = (index: number, field: keyof ImageData, value: string) => {
    const newImages = [...data.inspirationImages];
    newImages[index] = { ...newImages[index], [field]: value };
    setData(prev => ({ ...prev, inspirationImages: newImages }));
    setSaved(false);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageIndex(index);
    setSaved(false);
    
    try {
      const url = await uploadImage(file, 'images/dress-code');
      
      const newImages = [...data.inspirationImages];
      newImages[index] = { ...newImages[index], url };
      setData(prev => ({ ...prev, inspirationImages: newImages }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const addImage = () => {
    setData(prev => ({
      ...prev,
      inspirationImages: [...prev.inspirationImages, { id: nanoid(), type: 'New Type', url: '' }]
    }));
    setSaved(false);
  };

  const removeImage = (id: string) => {
    const newImages = data.inspirationImages.filter(img => img.id !== id);
    setData(prev => ({ ...prev, inspirationImages: newImages }));
    setSaved(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setData((prevData) => {
        const oldIndex = prevData.inspirationImages.findIndex(item => item.id === active.id);
        const newIndex = prevData.inspirationImages.findIndex(item => item.id === over.id);

        return {
          ...prevData,
          inspirationImages: arrayMove(prevData.inspirationImages, oldIndex, newIndex)
        };
      });
      setSaved(false);
    }
  };

  // The saved doc: the form without the photos' list ids.
  const toDoc = () => ({
    ...data,
    inspirationImages: data.inspirationImages.map(({ id, ...rest }) => rest)
  });

  const saveContent = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      if (!(await draft.save(toDoc(), { merge: true }))) return false;

      setOriginalData(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (err: any) {
      console.error("Error saving dress code data:", err);
      setError("Failed to save changes. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = (version: DocumentData) => {
    setData(fromDoc(version));
    setSaved(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
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
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
              />
              <CharCount value={data.header?.title || ""} max={TEXT_LIMITS.heading} />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Dress Code Information</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Dress Code Main Title</label>
            <input 
              maxLength={TEXT_LIMITS.cardTitle}
              type="text" 
              name="title"
              value={data.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
            <CharCount value={data.title} max={TEXT_LIMITS.cardTitle} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Description</label>
            <textarea 
              name="description"
              value={data.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-y"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Guidelines</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Attire notes with their own title (e.g. For Ladies, For Gentlemen, For Sponsors). Two sit side by side on desktop.</p>
          </div>
          <button
            onClick={addGuideline}
            className="flex items-center gap-2 shrink-0 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add guideline
          </button>
        </div>
        <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-6">
          {data.guidelines.map((guideline, index) => (
            <div key={guideline.id} className="space-y-2 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={TEXT_LIMITS.cardTitle}
                  value={guideline.title}
                  onChange={(e) => updateGuideline(index, 'title', e.target.value)}
                  placeholder="Title, e.g. For Ladies"
                  aria-label="Guideline title"
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
                />
                <button
                  onClick={() => removeGuideline(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove guideline"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <CharCount value={guideline.title} max={TEXT_LIMITS.cardTitle} />
              <textarea
                value={guideline.text}
                onChange={(e) => updateGuideline(index, 'text', e.target.value)}
                rows={4}
                aria-label="Guideline text"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
              />
            </div>
          ))}
          {data.guidelines.length === 0 && (
            <div className="@2xl:col-span-2 text-center py-8 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500">
              No guidelines. The section is hidden on the site.
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Color Palette</h3>
          <button 
            onClick={addColor}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Color
          </button>
        </div>
        
        <div className="space-y-4">
          {data.colors.map((color, index) => (
            <div key={index} className="flex flex-col @lg:flex-row gap-4 items-start @lg:items-center p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-full shadow-inner border border-gray-200 dark:border-zinc-700 flex-shrink-0" style={{ backgroundColor: color.hex }} />
              
              <div className="flex-1 w-full space-y-2">
                <label className="block text-xs text-gray-500 dark:text-zinc-400">Color Name</label>
                <input 
                  type="text" 
                  value={color.name}
                  onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md text-sm outline-none focus:border-gray-400 dark:focus:border-zinc-500"
                />
              </div>
              
              <div className="flex-1 w-full space-y-2">
                <label className="block text-xs text-gray-500 dark:text-zinc-400">HEX Code</label>
                <input 
                  type="text" 
                  value={color.hex}
                  onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md text-sm outline-none focus:border-gray-400 dark:focus:border-zinc-500 font-mono"
                />
              </div>

              <button 
                onClick={() => removeColor(index)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors mt-6 @lg:mt-0"
                title="Remove Color"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {data.colors.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 italic">No colors added yet.</p>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Inspiration Images</h3>
          <button 
            onClick={addImage}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Image
          </button>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-4">
            <SortableContext 
              items={data.inspirationImages.map(img => img.id!)}
              strategy={rectSortingStrategy}
            >
              {data.inspirationImages.map((image, index) => (
                <SortableInspirationImage
                  key={image.id}
                  image={image}
                  index={index}
                  handleImageChange={handleImageChange}
                  handleImageUpload={handleImageUpload}
                  removeImage={removeImage}
                  uploadingImageIndex={uploadingImageIndex}
                />
              ))}
            </SortableContext>
            {data.inspirationImages.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 italic col-span-full">No inspiration images added yet.</p>
            )}
          </div>
        </DndContext>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <EditorSaveBar draft={draft} doc={toDoc()} merge hasChanges={hasChanges} saving={isSaving} saved={saved} busy={uploadingImageIndex !== null} onUndo={handleUndo} onRestore={handleRestore} onSave={saveContent} />
    </div>
  );
}

function SortableInspirationImage({
  image,
  index,
  handleImageChange,
  handleImageUpload,
  removeImage,
  uploadingImageIndex
}: {
  image: ImageData,
  index: number,
  handleImageChange: (index: number, field: keyof ImageData, value: string) => void,
  handleImageUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void,
  removeImage: (id: string) => void,
  uploadingImageIndex: number | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id! });

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
      className="flex flex-col @lg:flex-row gap-4 items-start @lg:items-center p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800 relative pt-10 @lg:pt-4 group"
    >
      <div className="absolute top-2 left-3 z-10 flex items-center justify-center w-6 h-6 bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-semibold rounded-full">
        {index + 1}
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div 
          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to reorder"
          {...attributes} 
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <button 
          onClick={() => removeImage(image.id!)}
          className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remove Image"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative w-24 h-24 bg-gray-200 dark:bg-zinc-800 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-zinc-700">
        {image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={image.type} className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px]">No Img</span>
          </div>
        )}
        
        {uploadingImageIndex === index && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
            <Loader2 className="w-5 h-5 animate-spin mb-1" />
          </div>
        )}

        <div className="absolute bottom-1 right-1 z-20">
          <input 
            type="file" 
            id={`dress-image-upload-${image.id}`} 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleImageUpload(index, e)}
            disabled={uploadingImageIndex === index}
          />
          <label 
            htmlFor={`dress-image-upload-${image.id}`}
            className="inline-flex items-center justify-center w-7 h-7 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full shadow-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            title="Change Image"
          >
            <Upload className="w-3.5 h-3.5" />
          </label>
        </div>
      </div>
      
      <div className="flex-1 w-full space-y-4">
        <div className="space-y-2">
          <label className="block text-xs text-gray-500 dark:text-zinc-400">Type/Label</label>
          <input 
            type="text" 
            value={image.type}
            onChange={(e) => handleImageChange(index, 'type', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md text-sm outline-none focus:border-gray-400 dark:focus:border-zinc-500"
          />
        </div>
      </div>
    </div>
  );
}
