'use client';

import { useId } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Lock, Pin } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LOCKED_SCREEN, PINNED_SCREEN, SCREEN_LABEL_MAX, SCREEN_NAMES, type ScreenConfig, type ScreenType } from '@/lib/screens';
import { CharCount } from '../content/CharCount';

interface ScreenListProps {
  screens: ScreenConfig[];
  onChange: (screens: ScreenConfig[]) => void;
  /** Menu name used when a screen's own is blank (site text `menu`) */
  defaultLabels: Record<ScreenType, string>;
  /**
   * Visual builder: rows are picked by clicking their name, and only the
   * picked row shows its arrows and menu name (a narrow column).
   */
  selected?: ScreenType | null;
  onSelect?: (type: ScreenType) => void;
}

// The guest screens as a list to reorder (drag or arrows), show / hide and
// rename. Controlled: the caller owns the list and saves it (ScreensEditor.tsx,
// also the visual builder's section list). Welcome stays first and shown.
export function ScreenList({ screens, onChange, defaultLabels, selected = null, onSelect }: ScreenListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Nothing moves above the pinned first screen.
  const move = (from: number, to: number) => {
    if (to < 1 || to >= screens.length || from < 1) return;
    onChange(arrayMove(screens, from, to));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(
      screens.findIndex((s) => s.type === active.id),
      screens.findIndex((s) => s.type === over.id),
    );
  };

  const update = (type: ScreenType, patch: Partial<ScreenConfig>) =>
    onChange(screens.map((s) => (s.type === type ? { ...s, ...patch } : s)));

  let step = 0;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={screens.map((s) => s.type)} strategy={verticalListSortingStrategy}>
        <ol className={onSelect ? 'space-y-2' : 'space-y-3'}>
          {screens.map((screen, index) => (
            <ScreenRow
              key={screen.type}
              screen={screen}
              step={screen.enabled ? ++step : null}
              canMoveUp={index > 1}
              canMoveDown={index > 0 && index < screens.length - 1}
              onMove={(by) => move(index, index + by)}
              onToggle={(enabled) => update(screen.type, { enabled })}
              onRename={(label) => update(screen.type, { label })}
              defaultLabel={defaultLabels[screen.type]}
              select={onSelect && { selected: selected === screen.type, onSelect: () => onSelect(screen.type) }}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

const iconButton =
  'p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:pointer-events-none';

function ScreenRow({ screen, step, canMoveUp, canMoveDown, onMove, onToggle, onRename, defaultLabel, select }: {
  screen: ScreenConfig;
  /** Position guests see it at, or null when hidden */
  step: number | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (by: -1 | 1) => void;
  onToggle: (enabled: boolean) => void;
  onRename: (label: string) => void;
  defaultLabel: string;
  select?: { selected: boolean; onSelect: () => void };
}) {
  const ids = useId();
  const pinned = screen.type === PINNED_SCREEN;
  const name = SCREEN_NAMES[screen.type];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: screen.type,
    disabled: pinned,
  });
  // In the builder only the picked row shows its arrows and menu name.
  const expanded = !select || select.selected;

  const arrows = !pinned && (
    <>
      <button type="button" className={iconButton} disabled={!canMoveUp} onClick={() => onMove(-1)} aria-label={`Move ${name} up`}>
        <ArrowUp className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" className={iconButton} disabled={!canMoveDown} onClick={() => onMove(1)} aria-label={`Move ${name} down`}>
        <ArrowDown className="w-4 h-4" aria-hidden="true" />
      </button>
    </>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' }}
      className={`relative rounded-xl border transition-colors ${select ? 'p-2' : 'p-4'} ${
        isDragging ? 'shadow-lg border-gray-400 dark:border-zinc-500 bg-white dark:bg-zinc-900'
          : select?.selected ? 'border-gray-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 ring-1 ring-gray-900 dark:ring-zinc-100'
            : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50'
      }`}
    >
      <div className={`flex items-center ${select ? 'gap-2' : 'gap-3'}`}>
        {pinned ? (
          <span className="p-2 text-gray-400 dark:text-zinc-500" title="Always the first screen">
            <Pin className="w-4 h-4" aria-hidden="true" />
          </span>
        ) : (
          <button
            type="button"
            className={`${iconButton} cursor-grab active:cursor-grabbing touch-none`}
            aria-label={`Drag to move ${name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        <span
          className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
            step ? 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300' : 'border-dashed border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-zinc-500'
          }`}
          aria-hidden="true"
        >
          {step ?? '–'}
        </span>

        <div className="min-w-0 flex-1">
          {select ? (
            <button
              type="button"
              onClick={select.onSelect}
              aria-current={select.selected ? 'true' : undefined}
              className={`w-full text-left min-h-9 text-sm font-medium leading-snug rounded focus-visible:outline-2 focus-visible:outline-gray-900 dark:focus-visible:outline-zinc-100 ${step ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500 line-through'}`}
            >
              {name}
            </button>
          ) : (
          <p className={`text-sm font-medium leading-snug ${step ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500 line-through'}`}>
            {name}
          </p>
          )}
          {pinned && <p className="text-xs text-gray-500 dark:text-zinc-400">Always first and shown</p>}
          {screen.type === LOCKED_SCREEN && (
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400">
              <Lock className="w-3 h-3" aria-hidden="true" /> Opens with an invite code
            </p>
          )}
        </div>

        {!pinned && (
          <div className="flex items-center gap-1 shrink-0">
            {!select && arrows}
            <button
              type="button"
              role="switch"
              aria-checked={screen.enabled}
              aria-label={`Show ${name}`}
              onClick={() => onToggle(!screen.enabled)}
              className={`ml-1 relative w-11 h-6 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-zinc-100 ${
                screen.enabled ? 'bg-gray-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${screen.enabled ? 'translate-x-5' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      {expanded && (
      <div className={select ? 'mt-2' : 'mt-3 sm:pl-[5.5rem]'}>
        {select && arrows && <div className="flex justify-end gap-1 mb-1">{arrows}</div>}
        <label htmlFor={`${ids}-label`} className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">
          Name in the menu
        </label>
        <input
          id={`${ids}-label`}
          type="text"
          value={screen.label}
          maxLength={SCREEN_LABEL_MAX}
          placeholder={defaultLabel}
          onChange={(e) => onRename(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100"
        />
        <CharCount value={screen.label} max={SCREEN_LABEL_MAX} />
      </div>
      )}
    </li>
  );
}
