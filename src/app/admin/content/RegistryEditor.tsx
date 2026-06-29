'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Check, RotateCcw, History, Plus, Trash2, GripVertical, Image as ImageIcon, Upload } from 'lucide-react';
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

export function RegistryEditor() {
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
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  
  // State for the form fields
  const [header, setHeader] = useState({
    subtitle: weddingContent.registry?.header?.subtitle || "Wishing Well",
    title: weddingContent.registry?.header?.title || "Registry & Contributions",
    description: weddingContent.registry?.header?.description || "Your presence is our ultimate gift, but should you wish to honor us, we have provided options below."
  });
  
  const [bankTransfer, setBankTransfer] = useState({
    title: weddingContent.registry?.bankTransfer?.title || "Bank Transfer",
    description: weddingContent.registry?.bankTransfer?.description || "Directly support our honeymoon adventures or first home goals with an elegant direct bank contribution."
  });
  
  const [curatedRegistry, setCuratedRegistry] = useState({
    title: weddingContent.registry?.curatedRegistry?.title || "Curated Registry",
    description1: weddingContent.registry?.curatedRegistry?.description1 || "We have lovingly curated a wedding registry featuring beautiful, elegant keepsakes and lifestyle pieces from our favorite boutiques.",
    description2: weddingContent.registry?.curatedRegistry?.description2 || "Options include premium vintage collection tablewares, designer home accents, and art contributions for our newly renovated residence."
  });

  const [originalHeader, setOriginalHeader] = useState({ ...header });
  const [originalBankTransfer, setOriginalBankTransfer] = useState({ ...bankTransfer });
  const [originalCuratedRegistry, setOriginalCuratedRegistry] = useState({ ...curatedRegistry });
  
  const [banks, setBanks] = useState((weddingContent.registry?.bankTransfer?.banks || []).map((item: any) => ({ ...item, id: nanoid() })));
  const [originalBanks, setOriginalBanks] = useState((weddingContent.registry?.bankTransfer?.banks || []).map((item: any) => ({ ...item, id: nanoid() })));

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
        const docRef = doc(db, 'websiteContent', 'registry');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bankTransfer?.banks && Array.isArray(data.bankTransfer.banks)) {
            const mappedBanks = data.bankTransfer.banks.map((item: any) => ({ ...item, id: nanoid() }));
            setBanks(mappedBanks);
            setOriginalBanks(mappedBanks);
          }
          if (data.header) {
            setHeader(prev => ({ ...prev, ...data.header }));
            setOriginalHeader(prev => ({ ...prev, ...data.header }));
          }
          if (data.bankTransfer) {
            const { banks, ...restBankTransfer } = data.bankTransfer;
            setBankTransfer(prev => ({ ...prev, ...restBankTransfer }));
            setOriginalBankTransfer(prev => ({ ...prev, ...restBankTransfer }));
          }
          if (data.curatedRegistry) {
            setCuratedRegistry(prev => ({ ...prev, ...data.curatedRegistry }));
            setOriginalCuratedRegistry(prev => ({ ...prev, ...data.curatedRegistry }));
          }
        }

        const backupRef = doc(db, 'websiteContent', 'registry_backup');
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

  const handleBankChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBanks(prev => prev.map(item => item.id === id ? { ...item, [name]: value } : item));
    setSaved(false);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };
  
  const handleBankTransferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBankTransfer(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };
  
  const handleCuratedRegistryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCuratedRegistry(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const index = banks.findIndex(b => b.id === id);
    setUploadingImageIndex(index);
    setSaved(false);
    
    try {
      const storageRef = ref(storage, `images/registry-qr-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setBanks(prev => prev.map(item => item.id === id ? { ...item, qrImage: downloadURL } : item));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const addNewBank = () => {
    setBanks(prev => [
      ...prev,
      {
        id: nanoid(),
        name: "New Bank",
        qrImage: ""
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
      setBanks(prev => prev.filter(item => item.id !== itemToDelete));
      setSaved(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleUndo = () => {
    setBanks(originalBanks);
    setHeader(originalHeader);
    setBankTransfer(originalBankTransfer);
    setCuratedRegistry(originalCuratedRegistry);
    setSaved(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBanks((items) => {
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
      
      const docRef = doc(db, 'websiteContent', 'registry');
      const backupRef = doc(db, 'websiteContent', 'registry_backup');
      
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        await setDoc(backupRef, {
          ...currentDoc.data(),
          backedUpAt: new Date().toISOString()
        });
        setHasBackup(true);
      }
      
      const banksToSave = banks.map(({ id, ...rest }) => rest);
      await setDoc(docRef, { 
        header,
        bankTransfer: {
          ...bankTransfer,
          banks: banksToSave
        },
        curatedRegistry,
        updatedAt: new Date().toISOString() 
      });
      
      setOriginalHeader(header);
      setOriginalBankTransfer(bankTransfer);
      setOriginalCuratedRegistry(curatedRegistry);
      setOriginalBanks(banks.map(item => ({ ...item })));
      
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
      const backupRef = doc(db, 'websiteContent', 'registry_backup');
      const backupSnap = await getDoc(backupRef);
      
      if (backupSnap.exists()) {
        const backupData = backupSnap.data();
        
        if (backupData.bankTransfer?.banks && Array.isArray(backupData.bankTransfer.banks)) {
          const mappedBanks = backupData.bankTransfer.banks.map((item: any) => ({ ...item, id: nanoid() }));
          setBanks(mappedBanks);
          setOriginalBanks(mappedBanks);
        }
        if (backupData.header) {
          setHeader(prev => ({ ...prev, ...backupData.header }));
          setOriginalHeader(prev => ({ ...prev, ...backupData.header }));
        }
        if (backupData.bankTransfer) {
          const { banks, ...restBankTransfer } = backupData.bankTransfer;
          setBankTransfer(prev => ({ ...prev, ...restBankTransfer }));
          setOriginalBankTransfer(prev => ({ ...prev, ...restBankTransfer }));
        }
        if (backupData.curatedRegistry) {
          setCuratedRegistry(prev => ({ ...prev, ...backupData.curatedRegistry }));
          setOriginalCuratedRegistry(prev => ({ ...prev, ...backupData.curatedRegistry }));
        }

        const docRef = doc(db, 'websiteContent', 'registry');
        await setDoc(docRef, {
          header: backupData.header || header,
          bankTransfer: backupData.bankTransfer || { ...bankTransfer, banks: [] },
          curatedRegistry: backupData.curatedRegistry || curatedRegistry,
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

  const hasChanges = 
    JSON.stringify(banks.map(i => ({ name: i.name, qrImage: i.qrImage }))) !== JSON.stringify(originalBanks.map(i => ({ name: i.name, qrImage: i.qrImage }))) || 
    JSON.stringify(header) !== JSON.stringify(originalHeader) ||
    JSON.stringify(bankTransfer) !== JSON.stringify(originalBankTransfer) ||
    JSON.stringify(curatedRegistry) !== JSON.stringify(originalCuratedRegistry);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Registry Details</h2>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">
          Manage the wedding registry section. You can update headers, descriptions, and the list of banks for QR transfer.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Header Content</h3>
        <div className="grid grid-cols-1 gap-6 bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Bank Transfer Details</h3>
        <div className="grid grid-cols-1 gap-6 bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Card Title</label>
            <input 
              type="text" 
              name="title"
              value={bankTransfer.title}
              onChange={handleBankTransferChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Card Description</label>
            <textarea 
              name="description"
              value={bankTransfer.description}
              onChange={handleBankTransferChange}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            />
          </div>

          <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900 dark:text-zinc-100">Bank & QR Codes</h4>
              <button 
                onClick={addNewBank}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Bank
              </button>
            </div>

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SortableContext 
                  items={banks.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {banks.map((item, index) => (
                    <SortableBankItem 
                      key={item.id} 
                      item={item} 
                      index={index} 
                      isUploading={uploadingImageIndex === index}
                      onChange={(e) => handleBankChange(item.id, e)} 
                      onRemove={() => confirmDelete(item.id)} 
                      onImageUpload={(e) => handleImageUpload(item.id, e)}
                    />
                  ))}
                </SortableContext>
              </div>
            </DndContext>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Curated Registry Details</h3>
        <div className="grid grid-cols-1 gap-6 bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Card Title</label>
            <input 
              type="text" 
              name="title"
              value={curatedRegistry.title}
              onChange={handleCuratedRegistryChange}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">First Paragraph</label>
            <textarea 
              name="description1"
              value={curatedRegistry.description1}
              onChange={handleCuratedRegistryChange}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Second Paragraph</label>
            <textarea 
              name="description2"
              value={curatedRegistry.description2}
              onChange={handleCuratedRegistryChange}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all resize-none"
            />
          </div>
        </div>
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
        message="This will update the registry section on the live website immediately. A backup of the current version will be saved."
        type="confirm"
        variant="info"
        confirmText="Yes, Publish Now"
      />

      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Bank?"
        message="Are you sure you want to remove this bank? This action cannot be undone once saved."
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

function SortableBankItem({ 
  item, 
  index, 
  isUploading,
  onChange, 
  onRemove,
  onImageUpload
}: { 
  item: any;
  index: number;
  isUploading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onRemove: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
      className="p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800 relative group flex flex-col"
    >
      <div className="absolute top-4 left-4 flex items-center justify-center w-6 h-6 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-semibold rounded-full border border-gray-200 dark:border-zinc-700 z-10">
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
          title="Remove Bank"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6 flex-1 flex flex-col">
        {/* Image Upload Area */}
        <div className="mb-4 aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700 overflow-hidden relative group/image bg-white dark:bg-zinc-950 flex items-center justify-center w-full max-w-[200px] mx-auto">
          {item.qrImage ? (
            <>
              <img src={item.qrImage} alt="QR Code" className="w-full h-full object-contain p-2" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Change
                  <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                </label>
              </div>
            </>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-medium uppercase tracking-wider">Upload QR Code</span>
                  <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                </>
              )}
            </label>
          )}
        </div>

        <div className="space-y-2 mt-auto">
          <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 text-center uppercase tracking-widest">Bank Name</label>
          <input 
            type="text" 
            name="name"
            value={item.name}
            onChange={onChange}
            className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all font-medium text-center"
            placeholder="e.g. GCash"
          />
        </div>
      </div>
    </div>
  );
}
