import { PracticeHistory, AppSettings, SpeakingHistory } from '../types';
import { STORAGE_KEY, SETTINGS_KEY } from '../constants';

const SPEAKING_HISTORY_KEY = 'speaking_history';

const defaultSettings: AppSettings = {
  defaultDirection: 'JA_TO_VI',
  defaultDifficulty: 'Beginner',
  defaultTopic: 'Daily conversation',
  itemsPerPage: 10,
  maxBatchSize: 5,
};

export const storageService = {
  getHistory: (): PracticeHistory[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse history', e);
      return [];
    }
  },

  saveHistory: (history: PracticeHistory[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  },

  addHistoryItem: (item: PracticeHistory) => {
    const history = storageService.getHistory();
    const newHistory = [item, ...history];
    storageService.saveHistory(newHistory);
  },

  deleteHistoryItem: (id: string) => {
    const history = storageService.getHistory();
    const newHistory = history.filter(h => h.id !== id);
    storageService.saveHistory(newHistory);
  },

  toggleFavorite: (id: string) => {
    const history = storageService.getHistory() || [];
    const newHistory = history.map(h => 
      h.id === id ? { ...h, isFavorite: !h.isFavorite } : h
    );
    storageService.saveHistory(newHistory);
  },

  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Speaking History
  getSpeakingHistory: (): SpeakingHistory[] => {
    const data = localStorage.getItem(SPEAKING_HISTORY_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse speaking history', e);
      return [];
    }
  },

  addSpeakingHistory: (item: SpeakingHistory) => {
    const history = storageService.getSpeakingHistory();
    const newHistory = [item, ...history].slice(0, 100); // Limit to 100 items
    localStorage.setItem(SPEAKING_HISTORY_KEY, JSON.stringify(newHistory));
  },

  deleteSpeakingHistory: (id: string) => {
    const history = storageService.getSpeakingHistory();
    const newHistory = history.filter(h => h.id !== id);
    localStorage.setItem(SPEAKING_HISTORY_KEY, JSON.stringify(newHistory));
  },

  toggleSpeakingFavorite: (id: string) => {
    const history = storageService.getSpeakingHistory() || [];
    const newHistory = history.map(h => 
      h.id === id ? { ...h, isFavorite: !h.isFavorite } : h
    );
    localStorage.setItem(SPEAKING_HISTORY_KEY, JSON.stringify(newHistory));
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch (e) {
      return defaultSettings;
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
