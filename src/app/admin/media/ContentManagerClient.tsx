'use client';

import React, { useState } from 'react';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { Loader2, Image as ImageIcon, Type, Save } from 'lucide-react';
// We'll add Firebase Storage logic here later

export function ContentManagerClient() {
  const { content, loading } = useWeddingContent();
  const [activeTab, setActiveTab] = useState('global');
  const [isSaving, setIsSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-wedding-gold" />
      </div>
    );
  }

  const tabs = [
    { id: 'global', label: 'Global Settings' },
    { id: 'welcomeScreen', label: 'Welcome Screen' },
    { id: 'entranceScreen', label: 'Entrance Screen' },
    { id: 'ourStory', label: 'Our Story' },
    { id: 'dressCode', label: 'Dress Code' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'rsvpCtaScreen', label: 'RSVP CTA' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 font-cinzel">Content & Media Manager</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage texts and images across the landing page.</p>
        </div>
        <button 
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-wedding-gold text-white rounded-lg hover:bg-wedding-burgundy transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Publish Changes
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                activeTab === tab.id 
                  ? 'bg-gray-100 dark:bg-zinc-800 text-wedding-gold font-medium'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-zinc-950/50">
          <div className="max-w-3xl mx-auto">
            {activeTab === 'global' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 border-b border-gray-200 dark:border-zinc-800 pb-2">Global Settings</h2>
                
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Global Logo URL
                    </label>
                    <div className="flex gap-4 items-start">
                      <div className="w-32 h-32 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-zinc-700 overflow-hidden relative group">
                        <img src={content.global.logoUrl || '/hansandczay.svg'} alt="Logo" className="w-full h-full object-contain p-4" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                          <span className="text-white text-xs font-medium bg-wedding-gold px-3 py-1 rounded-md">Change</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <input type="text" defaultValue={content.global.logoUrl} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-md text-sm text-gray-900 dark:text-zinc-100" readOnly />
                        <p className="text-xs text-gray-500 mt-2">Click the image to upload a new logo to Firebase Storage.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                        <Type className="w-4 h-4" /> Groom Name
                      </label>
                      <input type="text" defaultValue={content.global.groomName} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-wedding-gold outline-none transition-shadow" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                        <Type className="w-4 h-4" /> Bride Name
                      </label>
                      <input type="text" defaultValue={content.global.brideName} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-wedding-gold outline-none transition-shadow" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab !== 'global' && (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-zinc-400">Editor for {tabs.find(t => t.id === activeTab)?.label} is coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
