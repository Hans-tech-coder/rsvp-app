'use client';

import { useState } from 'react';
import { WelcomeScreenEditor } from './WelcomeScreenEditor';
import { GlobalSettingsEditor } from './GlobalSettingsEditor';
import { EntranceScreenEditor } from './EntranceScreenEditor';
import { OurStoryEditor } from './OurStoryEditor';
import { EntourageEditor } from './EntourageEditor';
import { EventDetailsEditor } from './EventDetailsEditor';
import { DressCodeEditor } from './DressCodeEditor';
import { GalleryEditor } from './GalleryEditor';
import { FaqsEditor } from './FaqsEditor';

export default function ContentManagerPage() {
  const [activeTab, setActiveTab] = useState('welcome');

  const tabs = [
    { id: 'global-settings', label: 'Global Settings' },
    { id: 'welcome', label: 'Welcome Screen' },
    { id: 'entrance', label: 'Entrance Screen' },
    { id: 'our-story', label: 'Our Story' },
    { id: 'entourage', label: 'Entourage' },
    { id: 'event-details', label: 'Event Details' },
    { id: 'dress-code', label: 'Dress Code' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'rsvp-cta', label: 'RSVP CTA' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Content & Image Manager</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">
          Select a screen from the sidebar to update its images and text.
        </p>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 overflow-y-auto shrink-0">
          <div className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* Main Content Area */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-white dark:bg-zinc-900">
          {activeTab === 'global-settings' && <GlobalSettingsEditor />}
          {activeTab === 'welcome' && <WelcomeScreenEditor />}
          {activeTab === 'entrance' && <EntranceScreenEditor />}
          {activeTab === 'our-story' && <OurStoryEditor />}
          {activeTab === 'entourage' && <EntourageEditor />}
          {activeTab === 'event-details' && <EventDetailsEditor />}
          {activeTab === 'dress-code' && <DressCodeEditor />}
          {activeTab === 'gallery' && <GalleryEditor />}
          {activeTab === 'faqs' && <FaqsEditor />}
          
          {activeTab !== 'welcome' && activeTab !== 'global-settings' && activeTab !== 'entrance' && activeTab !== 'our-story' && activeTab !== 'entourage' && activeTab !== 'event-details' && activeTab !== 'dress-code' && activeTab !== 'gallery' && activeTab !== 'faqs' && (
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
      </div>
    </div>
  );
}
