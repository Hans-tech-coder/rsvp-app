'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { ArrowLeft, EyeOff, Redo2, Undo2, X } from 'lucide-react';
import { WelcomeScreenEditor } from '../content/WelcomeScreenEditor';
import { GlobalSettingsEditor } from '../content/GlobalSettingsEditor';
import { EntranceScreenEditor } from '../content/EntranceScreenEditor';
import { OurStoryEditor } from '../content/OurStoryEditor';
import { EntourageEditor } from '../content/EntourageEditor';
import { EventDetailsEditor } from '../content/EventDetailsEditor';
import { DressCodeEditor } from '../content/DressCodeEditor';
import { GalleryEditor } from '../content/GalleryEditor';
import { FaqsEditor } from '../content/FaqsEditor';
import { RegistryEditor } from '../content/RegistryEditor';
import { RsvpCtaEditor } from '../content/RsvpCtaEditor';
import { RsvpFormEditor } from '../content/RsvpFormEditor';
import { SiteTextEditor } from '../content/SiteTextEditor';
import { ThemeEditor } from '../content/ThemeEditor';
import { MusicEditor } from '../content/MusicEditor';
import { ScreensEditor } from '../content/ScreensEditor';
import { UnsavedChangesProvider, useUnsavedChangesGuard } from '../content/unsavedChanges';
import { ContentPageProvider } from '../content/contentDraft';
import { PreviewFrame } from '../components/PreviewFrame';
import { BuilderProvider, type BuilderLink, type EditorHandle } from './builderContext';
import { DEFAULT_EVENT_ID } from '@/lib/eventPaths';
import { SCREEN_NAMES, SCREEN_TYPES, mergeScreens, type ScreenType } from '@/lib/screens';
import { EMPTY_HISTORY, recordEdit, redoEntry, undoEntry } from '@/lib/builderHistory';
import { readPreviewMessage, type BuilderMessage } from '@/lib/builderMessages';
import type { DocumentData } from 'firebase/firestore';
import type { DocData, EditableDocId } from '@/lib/contentDrafts';

// The visual builder (F9a): the event's draft site in the middle, its
// sections on the left (the Screens list: pick, reorder, hide, rename), the
// picked section's editor on the right (the same editors as the content
// page). Clicking a section in the preview opens its editor; every edit shows
// in the preview at once (postMessage, src/app/[event]/preview/PreviewSite.tsx)
// and is saved as a draft like on the content page. One undo / redo history
// across all panels (src/lib/builderHistory.ts). Laptop and tablet widths;
// phones keep the content page.

type Panel = { label: string; docId: EditableDocId; Editor: ComponentType<{ eventId: string }>; section?: string };

const SITE_PANELS = {
  entrance: { label: 'Invite code screen', docId: 'entranceScreen', Editor: EntranceScreenEditor, section: 'entrance' },
  global: { label: 'Names, date & links', docId: 'globalSettings', Editor: GlobalSettingsEditor },
  theme: { label: 'Colors & Fonts', docId: 'theme', Editor: ThemeEditor },
  music: { label: 'Music', docId: 'music', Editor: MusicEditor },
  siteText: { label: 'Buttons & labels', docId: 'siteText', Editor: SiteTextEditor },
} satisfies Record<string, Panel>;

const SECTION_EDITORS: Record<ScreenType, Pick<Panel, 'docId' | 'Editor'>> = {
  welcome: { docId: 'welcomeScreen', Editor: WelcomeScreenEditor },
  ourStory: { docId: 'ourStory', Editor: OurStoryEditor },
  entourage: { docId: 'entourage', Editor: EntourageEditor },
  details: { docId: 'details', Editor: EventDetailsEditor },
  dressCode: { docId: 'dressCode', Editor: DressCodeEditor },
  gallery: { docId: 'gallery', Editor: GalleryEditor },
  faqs: { docId: 'faq', Editor: FaqsEditor },
  registry: { docId: 'registry', Editor: RegistryEditor },
  rsvpCta: { docId: 'rsvpCta', Editor: RsvpCtaEditor },
  rsvp: { docId: 'rsvpForm', Editor: RsvpFormEditor },
};

type PanelId = ScreenType | keyof typeof SITE_PANELS;

const PANELS: Record<PanelId, Panel> = {
  ...(Object.fromEntries(SCREEN_TYPES.map((type) => [type, { label: SCREEN_NAMES[type], section: type, ...SECTION_EDITORS[type] }])) as Record<ScreenType, Panel>),
  ...SITE_PANELS,
};

const isPanelId = (id: string): id is PanelId => id in PANELS;
const panelOfDoc = (docId: EditableDocId) => (Object.keys(PANELS) as PanelId[]).find((id) => PANELS[id].docId === docId);

/** An edit the builder itself loaded into a form (undo / redo): not a new history entry. */
const APPLY_WINDOW_MS = 1500;

const toolButton =
  'inline-flex items-center gap-2 min-h-10 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:pointer-events-none';

export default function VisualBuilderPage() {
  // The only event until the event switcher (F11)
  const eventId = DEFAULT_EVENT_ID;
  const [selected, setSelected] = useState<PanelId>('welcome');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [history, setHistory] = useState(EMPTY_HISTORY);
  const [shownScreens, setShownScreens] = useState(() => mergeScreens(undefined));
  const [editorKey, setEditorKey] = useState(0);
  const [screensKey, setScreensKey] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Leave guard over both editors on the page (the section list and the drawer).
  const { setDirty, dialog } = useUnsavedChangesGuard();
  const [screensDirty, setScreensDirty] = useState(false);
  const [panelDirty, setPanelDirty] = useState(false);
  useEffect(() => setDirty(screensDirty || panelDirty), [screensDirty, panelDirty, setDirty]);

  // Live state, read by message handlers and callbacks.
  const docs = useRef(new Map<EditableDocId, { doc: DocData; merge: boolean }>());
  const handles = useRef(new Map<EditableDocId, EditorHandle>());
  const frames = useRef(new Set<Window>());
  const applying = useRef<{ docId: EditableDocId; until: number } | null>(null);
  const pendingRestore = useRef<{ docId: EditableDocId; doc: DocData } | null>(null);
  const selectedRef = useRef(selected);
  const panelDirtyRef = useRef(panelDirty);
  useEffect(() => {
    selectedRef.current = selected;
    panelDirtyRef.current = panelDirty;
  });

  const post = useCallback((message: BuilderMessage, to?: Window) => {
    for (const frame of to ? [to] : frames.current) {
      if (frame.closed) frames.current.delete(frame);
      else frame.postMessage(message, window.location.origin);
    }
  }, []);

  const showSection = useCallback((panel: PanelId, to?: Window) => {
    const section = PANELS[panel].section;
    if (section) post({ type: 'builder:goto', section }, to);
  }, [post]);

  const loadIntoForm = useCallback((docId: EditableDocId, doc: DocData) => {
    const handle = handles.current.get(docId);
    if (!handle) {
      pendingRestore.current = { docId, doc };
      return;
    }
    applying.current = { docId, until: Date.now() + APPLY_WINDOW_MS };
    handle.restore(doc as DocumentData);
  }, []);

  const link = useMemo<BuilderLink>(() => ({
    docChanged(docId, doc, merge) {
      const previous = docs.current.get(docId);
      docs.current.set(docId, { doc, merge });
      post({ type: 'builder:doc', docId, data: doc, merge });
      if (docId === 'screens') setShownScreens(mergeScreens(doc));
      // The first doc of a freshly opened editor is where it starts, not an edit.
      if (!previous) return;
      const apply = applying.current;
      if (apply?.docId === docId && Date.now() < apply.until) {
        applying.current = null;
        return;
      }
      setHistory((h) => recordEdit(h, docId, previous.doc, doc));
    },
    register(docId, handle) {
      handles.current.set(docId, handle);
      const pending = pendingRestore.current;
      if (pending?.docId === docId) {
        pendingRestore.current = null;
        loadIntoForm(docId, pending.doc);
      }
      return () => {
        if (handles.current.get(docId) === handle) handles.current.delete(docId);
        docs.current.delete(docId);
      };
    },
  }), [post, loadIntoForm]);

  /**
   * Opens a panel. Unsaved edits of the open one are saved as its draft
   * first (never live), since its editor closes; nothing changes if that fails.
   */
  const select = useCallback(async (panel: PanelId, field: string | null = null) => {
    const current = selectedRef.current;
    if (panel !== current && panelDirtyRef.current) {
      const handle = handles.current.get(PANELS[current].docId);
      if (handle && !(await handle.save())) return false;
    }
    setSelected(panel);
    setDrawerOpen(true);
    setFocusField(field);
    showSection(panel);
    return true;
  }, [showSection]);

  const step = useCallback(async (direction: 'undo' | 'redo') => {
    const entry = direction === 'undo' ? undoEntry(history) : redoEntry(history);
    if (!entry) return;
    const panel = panelOfDoc(entry.docId);
    // The section list is always open; other docs open their panel first.
    if (entry.docId !== 'screens' && panel && panel !== selectedRef.current && !(await select(panel))) return;
    setHistory((h) => ({ ...h, index: h.index + (direction === 'undo' ? -1 : 1) }));
    loadIntoForm(entry.docId, direction === 'undo' ? entry.before : entry.after);
  }, [history, select, loadIntoForm]);

  // The preview frames: each says when it listens (also after a reload) and
  // when the admin clicks a section in it.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = readPreviewMessage(event);
      if (!message) return;
      const frame = event.source as Window;
      if (message.type === 'preview:ready') {
        frames.current.add(frame);
        post({ type: 'builder:init' }, frame);
        docs.current.forEach(({ doc, merge }, docId) => post({ type: 'builder:doc', docId, data: doc, merge }, frame));
        showSection(selectedRef.current, frame);
      }
      if (message.type === 'preview:select' && isPanelId(message.section)) {
        select(message.section, message.field);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post, select, showSection]);

  // Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y, outside text fields (those keep
  // the browser's own undo while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key.toLowerCase();
      if (key === 'z' || key === 'y') {
        e.preventDefault();
        step(key === 'y' || e.shiftKey ? 'redo' : 'undo');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  // A click on a text in the preview focuses its field once the editor is up.
  useEffect(() => {
    if (!focusField) return;
    let tries = 0;
    const timer = setInterval(() => {
      const input = drawerRef.current?.querySelector<HTMLElement>(`[name="${CSS.escape(focusField)}"]`);
      if (input || ++tries > 50) {
        clearInterval(timer);
        setFocusField(null);
        input?.focus();
        input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [focusField, selected]);

  const screensPage = useMemo(() => ({ refreshPreview: () => {}, reloadEditor: () => setScreensKey((k) => k + 1) }), []);
  const drawerPage = useMemo(() => ({ refreshPreview: () => {}, reloadEditor: () => setEditorKey((k) => k + 1) }), []);

  const panel = PANELS[selected];
  const hidden = selected in SECTION_EDITORS && !shownScreens.find((s) => s.type === selected)?.enabled;
  const { Editor } = panel;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <header className="h-14 shrink-0 flex items-center gap-3 px-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Link href="/admin/content" className={toolButton}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Content
        </Link>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight">Visual builder</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">Edits are drafts. Publish each part when it is ready.</p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-1">
          <button onClick={() => step('undo')} disabled={!undoEntry(history)} className={toolButton} title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" aria-hidden="true" />
            Undo
          </button>
          <button onClick={() => step('redo')} disabled={!redoEntry(history)} className={toolButton} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" aria-hidden="true" />
            Redo
          </button>
        </div>
      </header>

      {/* Phones keep the content page. */}
      <div className="md:hidden flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-gray-600 dark:text-zinc-400 max-w-xs">The visual builder needs a tablet or a computer. On a phone, edit the site in Content.</p>
        <Link href="/admin/content" className="min-h-11 inline-flex items-center px-4 rounded-lg bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium">Open Content</Link>
      </div>

      <BuilderProvider value={link}>
        <div className="relative hidden md:flex flex-1 min-h-0">
          {/* Sections + site-wide panels */}
          <aside aria-label="Sections" className="w-[22rem] shrink-0 overflow-y-auto border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 lg:px-8 pt-5">
            <UnsavedChangesProvider value={setScreensDirty}>
              <ContentPageProvider value={screensPage}>
                <ScreensEditor
                  key={screensKey}
                  eventId={eventId}
                  selected={selected in SECTION_EDITORS ? (selected as ScreenType) : null}
                  onSelect={(type) => select(type)}
                />
              </ContentPageProvider>
            </UnsavedChangesProvider>
            <div className="pb-6">
              <h3 className="text-sm font-semibold mb-2">Whole site</h3>
              <ul className="space-y-1">
                {(Object.keys(SITE_PANELS) as (keyof typeof SITE_PANELS)[]).map((id) => (
                  <li key={id}>
                    <button
                      onClick={() => select(id)}
                      aria-current={selected === id ? 'true' : undefined}
                      className={`w-full text-left min-h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                        selected === id
                          ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {SITE_PANELS[id].label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex">
            {/* Canvas */}
            <main aria-label="Draft preview" className="flex-1 min-w-0 p-4">
              <PreviewFrame eventId={eventId} reloadKey={0} initialMode="phone" />
            </main>

            {/* Editor drawer: docked right from lg; below, over the section list, so the preview stays in view. */}
            {drawerOpen && (
              <section
                aria-label={`${panel.label} editor`}
                className="absolute inset-y-0 left-0 z-10 w-[22rem] shadow-2xl border-r lg:border-r-0 lg:shadow-none lg:static lg:w-[24rem] xl:w-[28rem] 2xl:w-[30rem] shrink-0 flex flex-col border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div className="shrink-0 flex items-center gap-2 px-6 h-14 border-b border-gray-200 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold truncate">{panel.label}</h2>
                    {hidden && (
                      <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                        <EyeOff className="w-3 h-3" aria-hidden="true" /> Hidden: guests do not see this section
                      </p>
                    )}
                  </div>
                  <button onClick={() => setDrawerOpen(false)} aria-label="Close editor and show the sections" title="Show the sections" className="lg:hidden p-2.5 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
                <div ref={drawerRef} className="@container flex-1 overflow-y-auto px-6 lg:px-8 pt-6">
                  <UnsavedChangesProvider value={setPanelDirty}>
                    <ContentPageProvider value={drawerPage}>
                      <Editor key={`${selected}-${editorKey}`} eventId={eventId} />
                    </ContentPageProvider>
                  </UnsavedChangesProvider>
                </div>
              </section>
            )}
          </div>
        </div>
      </BuilderProvider>
      {dialog}
    </div>
  );
}
