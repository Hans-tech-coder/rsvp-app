'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, PanelsTopLeft, X } from 'lucide-react';
import { WelcomeScreenEditor } from './WelcomeScreenEditor';
import { GlobalSettingsEditor } from './GlobalSettingsEditor';
import { EntranceScreenEditor } from './EntranceScreenEditor';
import { OurStoryEditor } from './OurStoryEditor';
import { EntourageEditor } from './EntourageEditor';
import { EventDetailsEditor } from './EventDetailsEditor';
import { DressCodeEditor } from './DressCodeEditor';
import { GalleryEditor } from './GalleryEditor';
import { FaqsEditor } from './FaqsEditor';
import { RegistryEditor } from './RegistryEditor';
import { RsvpCtaEditor } from './RsvpCtaEditor';
import { RsvpFormEditor } from './RsvpFormEditor';
import { SiteTextEditor } from './SiteTextEditor';
import { ThemeEditor } from './ThemeEditor';
import { MusicEditor } from './MusicEditor';
import { ScreensEditor } from './ScreensEditor';
import { UnsavedChangesProvider, useUnsavedChangesGuard } from './unsavedChanges';
import { ContentPageProvider } from './contentDraft';
import { PreviewFrame } from '../components/PreviewFrame';
import { useCurrentEventId, useEventAccess } from '../eventAccess';
import { NoEvent } from '../components/NoEvent';
import { canEditDesign } from '@/lib/permissions';

/** The current event's ContentManagerPage; nothing to edit until the account has an event. */
export default function ContentManagerPage() {
  const eventId = useCurrentEventId();
  if (!eventId) return <NoEvent />;
  return <ContentManager key={eventId} eventId={eventId} />;
}

function ContentManager({ eventId }: { eventId: string }) {
  const [activeTab, setActiveTab] = useState('global-settings');
  const { setDirty, guard, dialog } = useUnsavedChangesGuard();
  // Draft preview beside the editor (lg and up) or over it (smaller screens).
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  // Bumped to reload the editor from the server (after Discard draft).
  const [editorKey, setEditorKey] = useState(0);

  const togglePreview = () => setPreviewOpen((open) => !open);

  const pageHooks = useMemo(() => ({
    refreshPreview: () => setPreviewKey((k) => k + 1),
    reloadEditor: () => setEditorKey((k) => k + 1),
  }), []);

  // Switching tabs unmounts the editor, so unsaved edits are asked about first.
  const selectTab = (id: string) => {
    if (id !== activeTab) guard(() => setActiveTab(id));
  };

  // Colors & Fonts and Music are design: hidden for a client unless the event allows it.
  const design = canEditDesign(useEventAccess().rules);
  const tabs = [
    { id: 'global-settings', label: 'Global Settings' },
    { id: 'screens', label: 'Screens & Menu' },
    { id: 'site-text', label: 'Site Text' },
    ...(design ? [{ id: 'theme', label: 'Colors & Fonts' }, { id: 'music', label: 'Music' }] : []),
    { id: 'welcome', label: 'Welcome Screen' },
    { id: 'entrance', label: 'Entrance Screen' },
    { id: 'our-story', label: 'Timeline (Our Story)' },
    { id: 'entourage', label: 'People (Entourage)' },
    { id: 'event-details', label: 'Venues (Event Details)' },
    { id: 'dress-code', label: 'Dress Code' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'registry', label: 'Registry' },
    { id: 'rsvp-cta', label: 'RSVP CTA' },
    { id: 'rsvp-form', label: 'RSVP Form' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Content & Image Manager</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">
            Edits are saved as a draft. Check them in the preview, then Publish to show guests.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
        {/* The builder needs a tablet or wider. */}
        <Link
          href="/admin/builder"
          className="hidden md:inline-flex items-center gap-2 min-h-11 px-4 rounded-lg bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors"
        >
          <PanelsTopLeft className="w-4 h-4" aria-hidden="true" />
          Visual builder
        </Link>
        <button
          onClick={togglePreview}
          aria-pressed={previewOpen}
          className="shrink-0 inline-flex items-center gap-2 min-h-11 px-4 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {previewOpen ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          {previewOpen ? 'Hide preview' : 'Preview'}
        </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
      <div className={`flex-1 min-w-0 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col ${previewOpen ? '' : 'md:flex-row'}`}>
        {/* Sidebar Navigation (a dropdown while the preview is docked beside it) */}
        <div className={`w-full border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 shrink-0 ${previewOpen ? '' : 'md:w-64 md:border-b-0 md:border-r'}`}>
          {/* Mobile Dropdown */}
          <div className={`p-4 relative ${previewOpen ? '' : 'md:hidden'}`}>
            <select
              value={activeTab}
              onChange={(e) => selectTab(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-900 dark:text-zinc-100 outline-none appearance-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          
          {/* Desktop Sidebar */}
          <div className={`hidden p-4 space-y-1 overflow-y-auto h-full ${previewOpen ? '' : 'md:block'}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area: editors lay out by its width (container queries), as in the builder drawer. */}
        <div className="@container flex-1 p-6 lg:p-8 overflow-y-auto bg-white dark:bg-zinc-900">
          <UnsavedChangesProvider value={setDirty}>
          <ContentPageProvider value={pageHooks}>
          <div key={editorKey}>
          {activeTab === 'global-settings' && <GlobalSettingsEditor eventId={eventId} />}
          {activeTab === 'welcome' && <WelcomeScreenEditor eventId={eventId} />}
          {activeTab === 'entrance' && <EntranceScreenEditor eventId={eventId} />}
          {activeTab === 'our-story' && <OurStoryEditor eventId={eventId} />}
          {activeTab === 'entourage' && <EntourageEditor eventId={eventId} />}
          {activeTab === 'event-details' && <EventDetailsEditor eventId={eventId} />}
          {activeTab === 'dress-code' && <DressCodeEditor eventId={eventId} />}
          {activeTab === 'gallery' && <GalleryEditor eventId={eventId} />}
          {activeTab === 'faqs' && <FaqsEditor eventId={eventId} />}
          {activeTab === 'registry' && <RegistryEditor eventId={eventId} />}
          {activeTab === 'rsvp-cta' && <RsvpCtaEditor eventId={eventId} />}
          {activeTab === 'rsvp-form' && <RsvpFormEditor eventId={eventId} />}
          {activeTab === 'site-text' && <SiteTextEditor eventId={eventId} />}
          {design && activeTab === 'theme' && <ThemeEditor eventId={eventId} />}
          {design && activeTab === 'music' && <MusicEditor eventId={eventId} />}
          {activeTab === 'screens' && <ScreensEditor eventId={eventId} />}
          
          {activeTab !== 'welcome' && activeTab !== 'global-settings' && activeTab !== 'entrance' && activeTab !== 'our-story' && activeTab !== 'entourage' && activeTab !== 'event-details' && activeTab !== 'dress-code' && activeTab !== 'gallery' && activeTab !== 'faqs' && activeTab !== 'registry' && activeTab !== 'rsvp-cta' && activeTab !== 'rsvp-form' && activeTab !== 'site-text' && activeTab !== 'theme' && activeTab !== 'music' && activeTab !== 'screens' && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-gray-500 dark:text-zinc-400 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
              <p className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">
                {tabs.find(t => t.id === activeTab)?.label}
              </p>
              <p className="max-w-sm">
                Editor for this screen is not yet implemented. Please select another screen.
              </p>
            </div>
          )}
          </div>
          </ContentPageProvider>
          </UnsavedChangesProvider>
        </div>
      </div>

      {/* Draft preview: docked beside the editor from lg, full screen over it below. */}
      {previewOpen && (
        <section
          aria-label="Draft preview"
          className="fixed inset-0 z-40 flex flex-col gap-3 bg-white dark:bg-zinc-900 p-4 lg:static lg:z-auto lg:w-[46%] lg:shrink-0 lg:rounded-2xl lg:border lg:border-gray-200 lg:dark:border-zinc-800 lg:shadow-sm"
        >
          <div className="flex items-center justify-between lg:hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Draft preview</p>
            <button onClick={togglePreview} aria-label="Close preview" className="p-2.5 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <PreviewFrame eventId={eventId} reloadKey={previewKey} initialMode="phone" />
          </div>
        </section>
      )}
      </div>
      {dialog}
    </div>
  );
}
