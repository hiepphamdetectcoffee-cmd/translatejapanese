import React, { useState, useEffect } from 'react';
import { AppSettings, TranslationDirection, Difficulty, Topic } from '../types';
import { DIRECTIONS, DIFFICULTIES, TOPICS } from '../constants';
import { storageService } from '../services/storageService';
import { Card, Button, Badge } from '../components/UI';
import { Settings as SettingsIcon, Trash2, Save, LogOut, Shield, Bell, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    storageService.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all practice history? This action cannot be undone.')) {
      storageService.clearHistory();
      alert('History cleared successfully.');
    }
  };

  return (
    <div className="space-y-12">
      <header className="space-y-2 border-b border-neutral-800 pb-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter">System</h1>
        <p className="label-caps text-neutral-500">Global Preference Configuration</p>
      </header>

      <div className="mx-auto max-w-4xl space-y-12">
        <div className="grid gap-8 md:grid-cols-12">
          <section className="space-y-8 md:col-span-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 text-black">
                <SettingsIcon size={24} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Practice Presets</h2>
            </div>

            <Card className="space-y-8 border-neutral-800 bg-neutral-900/20">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="label-caps">Default Direction</label>
                  <select
                    value={settings.defaultDirection}
                    onChange={(e) => setSettings({ ...settings, defaultDirection: e.target.value as TranslationDirection })}
                    className="w-full border-b border-neutral-800 bg-transparent py-4 text-sm font-bold text-white focus:border-white focus:outline-none"
                  >
                    {DIRECTIONS.map(d => <option key={d.value} value={d.value} className="bg-neutral-900">{d.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Difficulty Level</label>
                  <select
                    value={settings.defaultDifficulty}
                    onChange={(e) => setSettings({ ...settings, defaultDifficulty: e.target.value as Difficulty })}
                    className="w-full border-b border-neutral-800 bg-transparent py-4 text-sm font-bold text-white focus:border-white focus:outline-none"
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-neutral-900">{d}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Preferred Topic</label>
                  <select
                    value={settings.defaultTopic}
                    onChange={(e) => setSettings({ ...settings, defaultTopic: e.target.value as Topic })}
                    className="w-full border-b border-neutral-800 bg-transparent py-4 text-sm font-bold text-white focus:border-white focus:outline-none"
                  >
                    {TOPICS.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Items Per Page</label>
                  <input
                    type="number"
                    value={settings.itemsPerPage}
                    onChange={(e) => setSettings({ ...settings, itemsPerPage: parseInt(e.target.value) || 10 })}
                    className="w-full border-b border-neutral-800 bg-transparent py-4 text-sm font-bold text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Max Sentences Per Batch</label>
                  <select
                    value={settings.maxBatchSize}
                    onChange={(e) => setSettings({ ...settings, maxBatchSize: parseInt(e.target.value) })}
                    className="w-full border-b border-neutral-800 bg-transparent py-4 text-sm font-bold text-white focus:border-white focus:outline-none"
                  >
                    {[3, 5, 10].map(val => (
                      <option key={val} value={val} className="bg-neutral-900">
                        {val} {val === 10 ? '(Slower/Warn)' : ''}
                      </option>
                    ))}
                  </select>
                  {settings.maxBatchSize === 10 && (
                    <p className="text-[10px] uppercase font-black text-orange-500 mt-2">Note: Large batches may increase processing time.</p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} className="w-full py-6">
                  {isSaved ? 'CONFIGURATION SYNCED' : 'COMMIT SETTINGS'}
                </Button>
              </div>
            </Card>
          </section>

          <aside className="space-y-8 md:col-span-4">
            <section className="space-y-6">
              <label className="label-caps">Status</label>
              <Card className="border-emerald-900/30 bg-emerald-950/10 p-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-emerald-400">ACTIVE</span>
                  <span className="text-[8px] font-black uppercase text-neutral-600">Local DB Status</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </Card>
            </section>

            <section className="space-y-6">
              <label className="label-caps text-red-500">Destruction Zone</label>
              <Card className="border-red-900/30 bg-red-950/5 p-6 space-y-4">
                <p className="text-[10px] font-black uppercase text-neutral-600 leading-tight">Proceed with extreme caution. Data wipe is binary and final.</p>
                <Button variant="danger" size="sm" className="w-full" onClick={handleClearHistory}>
                  Wipe Archives
                </Button>
              </Card>
            </section>
          </aside>
        </div>

        <footer className="pt-24 text-center">
          <p className="label-caps !text-neutral-800">JP-VI PRACTICE v1.0.0-PRO</p>
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-neutral-900 mt-2">© 2024 TRANSLATION CORE TECHNOLOGIES</p>
        </footer>
      </div>
    </div>
  );
};
