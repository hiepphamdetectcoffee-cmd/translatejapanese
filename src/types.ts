/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TranslationDirection = 'JA_TO_VI' | 'VI_TO_JA';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type JapaneseLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'Business';

export type TargetRole = 
  | 'BrSE' 
  | 'Tester' 
  | 'Developer' 
  | 'BA' 
  | 'Project Assistant' 
  | 'Sale Support Japanese' 
  | 'Office Worker' 
  | 'Other';

export type Topic = 
  | 'Daily conversation'
  | 'Work'
  | 'IT'
  | 'Interview'
  | 'Email'
  | 'Travel'
  | 'Business'
  | 'Random';

export interface Correction {
  userPhrase: string;
  betterPhrase: string;
  explanation: string;
}

export interface EvaluationResult {
  score: number;
  overallComment: string;
  accuracyFeedback: string;
  grammarFeedback: string;
  vocabularyFeedback: string;
  naturalnessFeedback: string;
  suggestedTranslation: string;
  corrections: Correction[];
  explanation?: string;
}

export interface PracticeHistory {
  id: string;
  timestamp: number;
  direction: TranslationDirection;
  topic: Topic;
  difficulty: Difficulty;
  sourceSentence: string;
  userTranslation: string;
  isManualInput: boolean;
  sourceType?: 'ai' | 'manual' | 'image' | 'batch';
  batchId?: string;
  evaluation: EvaluationResult;
  isFavorite: boolean;
}

export interface AppSettings {
  defaultDirection: TranslationDirection;
  defaultDifficulty: Difficulty;
  defaultTopic: Topic;
  itemsPerPage: number;
  maxBatchSize: number;
}

export interface BatchSummary {
  id: string;
  timestamp: number;
  totalSentences: number;
  averageScore: number;
  sourceType: 'image';
}

export interface BatchItem {
  id: string;
  sourceText: string;
  userTranslation: string;
  direction: TranslationDirection;
  detectedLanguage: string;
}

export interface BatchEvaluationResponse {
  results: {
    id: string;
    score: number;
    overallComment: string;
    accuracyFeedback: string;
    grammarFeedback: string;
    vocabularyFeedback: string;
    naturalnessFeedback: string;
    suggestedTranslation: string;
    corrections: Correction[];
  }[];
}

// Interview Types
export interface UserProfile {
  uid: string;
  displayName: string;
  japaneseLevel: JapaneseLevel;
  targetRole: TargetRole;
  interviewGoal: string;
  availableStatus: 'available' | 'busy' | 'invisible';
  createdAt: number;
}

export interface InterviewFeedback {
  overallScore: number;
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  interviewContentScore: number;
  professionalismScore: number;
  overallComment: string;
  strengths: string[];
  weakPoints: string[];
  improvedAnswers: {
    originalAnswer: string;
    betterAnswer: string;
    explanationInVietnamese: string;
  }[];
  usefulPhrases: {
    japanese: string;
    vietnamese: string;
  }[];
  nextPracticeSuggestions: string[];
}

export interface InterviewSession {
  id: string;
  partnerDisplayName: string;
  targetRole: TargetRole;
  topic: string;
  transcript: string;
  aiFeedback: InterviewFeedback;
  createdAt: number;
  isFavorite: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface InterviewRoomData {
  id: string;
  userA: string;
  userB: string;
  interviewerId: string;
  candidateId: string;
  topic: string;
  targetRole: TargetRole;
  status: 'active' | 'ended';
  createdAt: number;
  endedAt?: number;
}

// Performance Test Types
export interface SimulationOptions {
  virtualUsers: number;
  durationSeconds: number;
  actions: string[];
  useMockAI: boolean;
}

export interface PerformanceMetrics {
  testId: string;
  startedAt: number;
  endedAt?: number;
  virtualUsers: number;
  durationSeconds: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  errors: string[];
  recommendations: string[];
}

export interface LatencyMetric {
  action: string;
  latency: number;
  timestamp: number;
  success: boolean;
}

// Speaking Types
export type SpeakingMode = 'VI_TO_JP_SPEAKING' | 'JP_TO_JP_SHADOWING';

export interface SpeakingPrompt {
  mode: SpeakingMode;
  promptText: string;
  targetJapaneseText: string;
  vietnameseMeaning: string;
  topic: Topic;
  difficulty: Difficulty;
  grammarFocus: string;
  vocabularyFocus: string[];
}

export interface SpeakingScore {
  overall: number;
  meaning?: number;
  grammar?: number;
  vocabulary?: number;
  naturalness?: number;
  pronunciation: number;
  fluency: number;
  rhythm?: number;
  intonation?: number;
  completeness?: number;
}

export interface SpeakingFeedback {
  overallScore: number;
  overallComment: string;
  meaningFeedback?: string;
  grammarFeedback?: string;
  vocabularyFeedback?: string;
  naturalnessFeedback?: string;
  pronunciationFeedback: string;
  fluencyFeedback: string;
  pronunciationScore: number;
  fluencyScore: number;
  rhythmFeedback?: string;
  suggestedBetterAnswer?: string;
  usefulPhrases?: { japanese: string; vietnamese: string }[];
  practiceTips: string[];
  wordFeedback?: { word: string; reading: string; issue: string; suggestion: string }[];
}

export interface SpeakingHistory {
  id: string;
  practiceType: 'speaking';
  mode: SpeakingMode;
  topic: Topic;
  difficulty: Difficulty;
  promptText: string;
  targetJapaneseText: string;
  vietnameseMeaning: string;
  recognizedJapaneseText: string;
  scores: SpeakingScore;
  feedback: SpeakingFeedback;
  isFavorite: boolean;
  createdAt: number;
}
