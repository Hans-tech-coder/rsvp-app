'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Trash2, ChevronDown, GripVertical, Upload, X } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { paths } from '@/lib/eventPaths';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { uploadImage } from '@/lib/blob/uploadImage';
import { DEFAULT_CONTENT as weddingContent } from '@/lib/weddingContent';
import {
  PERSON_TITLES, emptyPerson, formatPerson, peopleGroupsFromLegacy, readPeopleGroups,
  type PeopleGroup, type PeopleLayout, type Person, type PersonPair,
} from '@/lib/genericContent';
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

// "People" (doc `entourage`): any number of titled groups. Content saved
// before Oct 2026 had fixed wedding lists whose titles were site text;
// peopleGroupsFromLegacy() turns them into groups until the first save.

type PeopleForm = { subtitle: string; title: string; groups: PeopleGroup[] };

const inputClass = "px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-zinc-500 transition-all";
const smallButtonClass = "flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium";

const LAYOUTS: { value: PeopleLayout; label: string; help: string }[] = [
  { value: 'list', label: 'List', help: 'A column of names. Two list or featured groups in a row sit side by side on desktop.' },
  { value: 'featured', label: 'Featured', help: 'A column of large names, e.g. parents or the maid of honor. Sits side by side with the next list or featured group on desktop.' },
  { value: 'pairs', label: 'Pairs', help: 'Two names facing each other on each row, full width, e.g. principal sponsors or speaker and moderator.' },
];

const emptyPair = (): PersonPair => ({ left: { ...emptyPerson(), title: 'Mrs.' }, right: { ...emptyPerson(), title: 'Mr.' }, together: true });

/** Keeps the names when the layout changes between pairs and a column. */
function withLayout(group: PeopleGroup, layout: PeopleLayout): PeopleGroup {
  if (layout === group.layout) return group;
  if (layout === 'pairs' && group.layout !== 'pairs') {
    const pairs: PersonPair[] = [];
    for (let i = 0; i < group.people.length; i += 2) {
      pairs.push({ left: group.people[i], right: group.people[i + 1] ?? emptyPerson(), together: false });
    }
    return { ...group, layout, people: [], pairs };
  }
  if (group.layout === 'pairs') {
    const people = group.pairs.flatMap((p) => [p.left, p.right]).filter((p) => formatPerson(p));
    return { ...group, layout, people, pairs: [] };
  }
  return { ...group, layout };
}

function formFromDoc(saved: DocumentData, siteText: DocumentData | undefined): PeopleForm {
  return {
    subtitle: saved.subtitle ?? weddingContent.entourage.subtitle,
    title: saved.title ?? weddingContent.entourage.title,
    groups: readPeopleGroups(saved.groups)
      ?? peopleGroupsFromLegacy(saved, siteText?.entourage)
      ?? weddingContent.entourage.groups,
  };
}

export function EntourageEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'entourage');
  const loadDraft = draft.load;
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  // Old-shape content took its group titles from site text
  const siteTextRef = useRef<DocumentData | undefined>(undefined);

  const initial: PeopleForm = {
    subtitle: weddingContent.entourage.subtitle,
    title: weddingContent.entourage.title,
    groups: weddingContent.entourage.groups,
  };
  const [data, setData] = useState<PeopleForm>(initial);
  const [originalData, setOriginalData] = useState<PeopleForm>(initial);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loaded, siteTextSnap] = await Promise.all([
          loadDraft(),
          getDoc(doc(db, paths.content(eventId, 'siteText'))),
        ]);
        siteTextRef.current = siteTextSnap.data();

        if (loaded) {
          const mergedData = formFromDoc(loaded, siteTextRef.current);
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
  }, [eventId, loadDraft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const updateGroup = (index: number, change: (group: PeopleGroup) => PeopleGroup) => {
    setData(prev => ({ ...prev, groups: prev.groups.map((g, i) => (i === index ? change(g) : g)) }));
    setSaved(false);
  };

  const addGroup = () => {
    setData(prev => ({
      ...prev,
      groups: [...prev.groups, { id: nanoid(), title: '', layout: 'list', people: [emptyPerson()], pairs: [] }],
    }));
    setSaved(false);
  };

  const executeRemoveGroup = () => {
    if (groupToDelete === null) return;
    setData(prev => ({ ...prev, groups: prev.groups.filter((_, i) => i !== groupToDelete) }));
    setGroupToDelete(null);
    setSaved(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setData(prev => {
        const oldIndex = prev.groups.findIndex(g => g.id === active.id);
        const newIndex = prev.groups.findIndex(g => g.id === over.id);
        return { ...prev, groups: arrayMove(prev.groups, oldIndex, newIndex) };
      });
      setSaved(false);
    }
  };

  const uploadPhoto = async (groupIndex: number, personIndex: number, file: File) => {
    const key = `${data.groups[groupIndex].id}:${personIndex}`;
    setUploading(key);
    try {
      const url = await uploadImage(file, 'images/people', { maxDimension: 600 });
      updateGroup(groupIndex, g => ({ ...g, people: g.people.map((p, i) => (i === personIndex ? { ...p, photo: url } : p)) }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // merge: true keeps the old fixed lists for older code
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
    setData(formFromDoc(version, siteTextRef.current));
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Subtitle</label>
            <input
              maxLength={TEXT_LIMITS.heading}
              type="text"
              name="subtitle"
              value={data.subtitle}
              onChange={handleChange}
              className={`w-full ${inputClass}`}
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
              className={`w-full ${inputClass}`}
            />
            <CharCount value={data.title} max={TEXT_LIMITS.heading} />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Groups</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Each group has its own title and layout (entourage roles, 18 Roses, speakers, committee…). Drag to reorder. A group with no names is hidden on the site.</p>
          </div>
          <button
            onClick={addGroup}
            className="flex items-center gap-2 shrink-0 px-4 py-2 bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Group
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <SortableContext items={data.groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
              {data.groups.map((group, index) => (
                <SortableGroup
                  key={group.id}
                  group={group}
                  index={index}
                  uploading={uploading}
                  onChange={(change) => updateGroup(index, change)}
                  onRemove={() => setGroupToDelete(index)}
                  onUploadPhoto={(personIndex, file) => uploadPhoto(index, personIndex, file)}
                />
              ))}
            </SortableContext>
            {data.groups.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                <p className="text-gray-500 dark:text-zinc-400">No groups yet. Add one to get started.</p>
              </div>
            )}
          </div>
        </DndContext>
      </div>

      <EditorSaveBar draft={draft} doc={data} merge hasChanges={hasChanges} saving={saving} saved={saved} busy={uploading !== null} onUndo={handleUndo} onRestore={handleRestore} onSave={handleSave} />

      <AdminModal
        isOpen={groupToDelete !== null}
        onClose={() => setGroupToDelete(null)}
        onConfirm={executeRemoveGroup}
        title="Remove Group"
        message={`Remove "${(groupToDelete !== null && data.groups[groupToDelete]?.title) || 'this group'}" and all its names? It leaves the site when you save.`}
        type="confirm"
        variant="danger"
        confirmText="Yes, remove it"
      />
    </div>
  );
}

function SortableGroup({
  group,
  index,
  uploading,
  onChange,
  onRemove,
  onUploadPhoto,
}: {
  group: PeopleGroup;
  index: number;
  uploading: string | null;
  onChange: (change: (group: PeopleGroup) => PeopleGroup) => void;
  onRemove: () => void;
  onUploadPhoto: (personIndex: number, file: File) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const layout = LAYOUTS.find(l => l.value === group.layout) ?? LAYOUTS[0];

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
      <div className="flex flex-col @2xl:flex-row @2xl:items-start gap-3">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">Group #{index + 1} title</label>
          <input
            type="text"
            maxLength={TEXT_LIMITS.heading}
            value={group.title}
            onChange={(e) => onChange(g => ({ ...g, title: e.target.value }))}
            placeholder="e.g. Principal Sponsors"
            className={`w-full ${inputClass}`}
          />
          <CharCount value={group.title} max={TEXT_LIMITS.heading} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">Layout</label>
          <div className="relative w-full @2xl:w-40">
            <select
              value={group.layout}
              onChange={(e) => onChange(g => withLayout(g, e.target.value as PeopleLayout))}
              className={`w-full appearance-none pr-9 cursor-pointer ${inputClass}`}
            >
              {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-zinc-400" />
          </div>
        </div>
        <div className="flex items-center gap-1 @2xl:pt-6">
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
            title="Remove group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-zinc-400">{layout.help}</p>

      {group.layout === 'pairs'
        ? <PairRows group={group} onChange={onChange} />
        : <PeopleRows group={group} uploading={uploading} onChange={onChange} onUploadPhoto={onUploadPhoto} />}
    </div>
  );
}

function PeopleRows({
  group,
  uploading,
  onChange,
  onUploadPhoto,
}: {
  group: PeopleGroup;
  uploading: string | null;
  onChange: (change: (group: PeopleGroup) => PeopleGroup) => void;
  onUploadPhoto: (personIndex: number, file: File) => void;
}) {
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const update = (index: number, field: keyof Person, value: string) =>
    onChange(g => ({ ...g, people: g.people.map((p, i) => (i === index ? { ...p, [field]: value } : p)) }));

  return (
    <div className="space-y-3">
      {group.people.map((person, index) => {
        const isUploading = uploading === `${group.id}:${index}`;
        return (
          <div key={index} className="flex flex-col @lg:flex-row gap-2 @lg:items-center">
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => fileInputs.current[index]?.click()}
                disabled={isUploading}
                className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                title={person.photo ? 'Change photo' : 'Add photo (optional)'}
              >
                {isUploading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : person.photo
                    ? <img src={person.photo} alt="" className="w-full h-full object-cover" />
                    : <Upload className="w-4 h-4" />}
              </button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { fileInputs.current[index] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadPhoto(index, file);
                  e.target.value = '';
                }}
              />
              {person.photo && (
                <button type="button" onClick={() => update(index, 'photo', '')} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Remove photo">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={person.name}
              onChange={(e) => update(index, 'name', e.target.value)}
              placeholder="Full name"
              aria-label="Name"
              className={`flex-1 min-w-0 ${inputClass}`}
            />
            <input
              type="text"
              value={person.role}
              onChange={(e) => update(index, 'role', e.target.value)}
              placeholder="Role (optional)"
              aria-label="Role"
              className={`@lg:w-48 min-w-0 ${inputClass}`}
            />
            <button
              onClick={() => onChange(g => ({ ...g, people: g.people.filter((_, i) => i !== index) }))}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors self-end @lg:self-auto"
              title="Remove name"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        );
      })}
      {group.people.length === 0 && (
        <div className="text-center py-6 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500">
          No names yet.
        </div>
      )}
      <button onClick={() => onChange(g => ({ ...g, people: [...g.people, emptyPerson()] }))} className={smallButtonClass}>
        <Plus className="w-4 h-4" />
        Add name
      </button>
    </div>
  );
}

function PairRows({ group, onChange }: { group: PeopleGroup; onChange: (change: (group: PeopleGroup) => PeopleGroup) => void }) {
  const updatePair = (index: number, change: (pair: PersonPair) => PersonPair) =>
    onChange(g => ({ ...g, pairs: g.pairs.map((p, i) => (i === index ? change(p) : p)) }));

  const pairs = group.pairs;
  const leftOnly = pairs.flatMap((p, i) => (formatPerson(p.left) && !formatPerson(p.right) ? [i + 1] : []));
  const rightOnly = pairs.flatMap((p, i) => (!formatPerson(p.left) && formatPerson(p.right) ? [i + 1] : []));

  const renderSide = (index: number, side: 'left' | 'right') => {
    const person = pairs[index][side];
    // Keep a title the list does not have, so opening the editor never drops it
    const options = person.title && !PERSON_TITLES.includes(person.title) ? [person.title, ...PERSON_TITLES] : PERSON_TITLES;
    const label = side === 'left' ? 'Left' : 'Right';
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">{label}</label>
        <div className="flex gap-2">
          <div className="relative w-28 shrink-0">
            <select
              value={person.title}
              onChange={(e) => updatePair(index, p => ({ ...p, [side]: { ...p[side], title: e.target.value } }))}
              aria-label={`${label} title`}
              className={`w-full appearance-none pl-4 pr-9 cursor-pointer ${inputClass}`}
            >
              <option value="">—</option>
              {options.map(title => <option key={title} value={title}>{title}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-zinc-400" />
          </div>
          <input
            type="text"
            value={person.name}
            placeholder="Full name"
            onChange={(e) => updatePair(index, p => ({ ...p, [side]: { ...p[side], name: e.target.value } }))}
            aria-label={`${label} name`}
            className={`flex-1 min-w-0 ${inputClass}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        On desktop the left and right names face each other on one row. Tick <span className="font-medium">Together</span>{' '}when the two are a couple: phones show them on one line, right name first (&ldquo;Mr. B &amp; Mrs. A&rdquo;). Two solo names in one row get a line each on phones.
      </p>
      {leftOnly.length > 0 && rightOnly.length > 0 && (
        <p className="text-sm px-4 py-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Row {leftOnly.join(', ')} has only a left name and row {rightOnly.join(', ')} only a right name. Move a solo right name into a left-only row (and remove its old row) to keep both sides balanced.
        </p>
      )}
      {pairs.map((pair, index) => {
        const left = formatPerson(pair.left);
        const right = formatPerson(pair.right);
        const preview = !left || !right
          ? `Only a ${left ? 'left name' : right ? 'right name' : 'blank row'}${left || right ? ': the other side stays empty on desktop' : ': hidden on the site'}`
          : pair.together
            ? `Phone: one line: ${right} & ${left}`
            : 'Phone: two lines, left name first';
        return (
          <div key={index} className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">#{index + 1}</span>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer select-none">
                <input type="checkbox" checked={pair.together} onChange={() => updatePair(index, p => ({ ...p, together: !p.together }))} className="w-4 h-4 accent-gray-900 dark:accent-zinc-100" />
                Together
              </label>
              <button
                onClick={() => onChange(g => ({ ...g, pairs: g.pairs.filter((_, i) => i !== index) }))}
                className="ml-auto p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove pair"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-4">
              {renderSide(index, 'left')}
              {renderSide(index, 'right')}
            </div>
            <p className={`text-xs ${left && right ? 'text-gray-500 dark:text-zinc-400' : 'text-amber-700 dark:text-amber-400'}`}>{preview}</p>
          </div>
        );
      })}
      {pairs.length === 0 && (
        <div className="text-center py-6 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500">
          No pairs yet.
        </div>
      )}
      <button onClick={() => onChange(g => ({ ...g, pairs: [...g.pairs, emptyPair()] }))} className={smallButtonClass}>
        <Plus className="w-4 h-4" />
        Add pair
      </button>
    </div>
  );
}
