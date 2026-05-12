import { TranslationDirection, Difficulty, Topic } from './types';

export const DIRECTIONS: { value: TranslationDirection; label: string }[] = [
  { value: 'JA_TO_VI', label: 'Japanese → Vietnamese' },
  { value: 'VI_TO_JA', label: 'Vietnamese → Japanese' },
];

export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export const TOPICS: Topic[] = [
  'Daily conversation',
  'Work',
  'IT',
  'Interview',
  'Email',
  'Travel',
  'Business',
  'Random',
];

export const STORAGE_KEY = 'jp_vi_practice_history';
export const SETTINGS_KEY = 'jp_vi_practice_settings';

export const DEV_TEST_MODE = true; // Set to false to disable performance testing features
