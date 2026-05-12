/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PracticePage } from './pages/PracticePage';
import { ImagePracticePage } from './pages/ImagePracticePage';
import { InterviewPage } from './pages/InterviewPage';
import { SpeakingPracticePage } from './pages/SpeakingPracticePage';
import { LibraryPage } from './pages/LibraryPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { PerformanceTestPage } from './pages/PerformanceTestPage';
import { DEV_TEST_MODE } from './constants';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isKeyMissing = !apiKey || apiKey === 'PASTE_MY_GEMINI_API_KEY_HERE';

  return (
    <Layout>
      {isKeyMissing && (
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 text-amber-800">
            <AlertCircle className="shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-bold">Gemini API Key Missing</p>
              <p>Please configure <code className="bg-amber-100 px-1 rounded">VITE_GEMINI_API_KEY</code> in your environment settings (Vercel, Netlify, etc.) to enable AI features.</p>
            </div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<PracticePage />} />
        <Route path="/scan" element={<ImagePracticePage />} />
        <Route path="/speak" element={<SpeakingPracticePage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {DEV_TEST_MODE && <Route path="/performance-test" element={<PerformanceTestPage />} />}
      </Routes>
    </Layout>
  );
}
