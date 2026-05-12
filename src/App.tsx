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

export default function App() {
  return (
    <Layout>
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
