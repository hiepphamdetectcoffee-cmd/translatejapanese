import { 
  SpeakingPrompt, 
  SpeakingFeedback, 
  Topic, 
  Difficulty, 
  SimulationOptions, 
  PerformanceMetrics, 
  LatencyMetric, 
  SpeakingHistory,
  SpeakingMode,
  SpeakingScore
} from '../types';
import { TOPICS, DIFFICULTIES } from '../constants';
import { storageService } from './storageService';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const testService = {
  // 1. Generate 100 test prompts
  generateTestSpeakingPrompts: (count: number = 100): SpeakingPrompt[] => {
    const prompts: SpeakingPrompt[] = [];
    const modes: SpeakingMode[] = ['VI_TO_JP_SPEAKING', 'JP_TO_JP_SHADOWING'];
    
    for (let i = 0; i < count; i++) {
      const mode = modes[i % 2];
      const topic = TOPICS[i % TOPICS.length];
      const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];
      
      if (mode === 'VI_TO_JP_SPEAKING') {
        prompts.push({
          mode,
          topic,
          difficulty,
          promptText: `Vietnamese prompt for ${topic} at ${difficulty} level - Case ${i}`,
          targetJapaneseText: `Japanese response for ${topic} at ${difficulty} level - Case ${i}`,
          vietnameseMeaning: `Meaning of response for ${topic} - Case ${i}`,
          grammarFocus: 'Grammar point A',
          vocabularyFocus: ['word1', 'word2']
        });
      } else {
        prompts.push({
          mode,
          topic,
          difficulty,
          promptText: `Japanese sentence to shadow for ${topic} at ${difficulty} level - Case ${i}`,
          targetJapaneseText: '', // Not used in shadowing mode usually?
          vietnameseMeaning: `Vietnamese meaning for shadowing ${topic} - Case ${i}`,
          grammarFocus: 'Punctuation and Rhythm',
          vocabularyFocus: ['vocal1', 'vocal2']
        });
      }
    }
    return prompts;
  },

  // 3. Mock AI and STT with realistic delays
  mockDelay: (min: number, max: number) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  mockGenerateSpeakingPrompt: async (topic: Topic, difficulty: Difficulty, mode: SpeakingMode): Promise<SpeakingPrompt> => {
    await testService.mockDelay(300, 800);
    return {
      mode,
      topic,
      difficulty,
      promptText: mode === 'VI_TO_JP_SPEAKING' ? 'Mẫu câu tiếng Việt mô phỏng' : '日本語のシャドーイング模擬文',
      targetJapaneseText: mode === 'VI_TO_JP_SPEAKING' ? '日本語の模擬回答' : '',
      vietnameseMeaning: 'Ý nghĩa mô phỏng của câu tiếng Nhật',
      grammarFocus: 'Mẫu ngữ pháp mô phỏng',
      vocabularyFocus: ['từ vựng 1', 'từ vựng 2']
    };
  },

  mockSpeechToText: async (): Promise<string> => {
    await testService.mockDelay(500, 1500);
    return '私は日本語を勉強しています。';
  },

  mockEvaluateSpeaking: async (mode: SpeakingMode): Promise<SpeakingFeedback> => {
    await testService.mockDelay(1000, 3000);
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    return {
      overallScore: score,
      overallComment: 'Đây là nhận xét mô phỏng dựa trên phần thể hiện của bạn. Bạn đã làm rất tốt, tuy nhiên cần chú ý hơn về trường âm.',
      pronunciationFeedback: 'Phát âm khá chuẩn, âm "tsu" cần dứt khoát hơn.',
      fluencyFeedback: 'Tốc độ nói ổn định, ngắt nghỉ đúng chỗ.',
      pronunciationScore: score - 5,
      fluencyScore: score - 2,
      suggestedBetterAnswer: mode === 'VI_TO_JP_SPEAKING' ? 'もっと自然な日本語の表現はこちらです。' : undefined,
      practiceTips: ['Luyện tập thêm về âm gắt', 'Nghe nhiều hơn để bắt chước ngữ điệu'],
      usefulPhrases: [
        { japanese: '勉強になる', vietnamese: 'Học hỏi được nhiều' },
        { japanese: 'お世話になる', vietnamese: 'Được giúp đỡ' }
      ]
    };
  },

  mockSaveSpeakingHistory: async (history: SpeakingHistory): Promise<void> => {
    await testService.mockDelay(100, 500);
    storageService.addSpeakingHistory(history);
  },

  // 2. Simulation Engine
  runUserSimulation: async (
    options: SimulationOptions, 
    onProgress: (metrics: PerformanceMetrics) => void,
    onLog: (metric: LatencyMetric) => void
  ) => {
    const startTime = Date.now();
    const metrics: PerformanceMetrics = {
      testId: `test_${generateId()}`,
      startedAt: startTime,
      virtualUsers: options.virtualUsers,
      durationSeconds: options.durationSeconds,
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      averageLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      maxLatencyMs: 0,
      errors: [],
      recommendations: []
    };

    const latencies: number[] = [];
    let isRunning = true;

    const stopSimulation = () => {
      isRunning = false;
      metrics.endedAt = Date.now();
      metrics.recommendations = testService.generateRecommendations(metrics);
      onProgress({ ...metrics });
    };

    setTimeout(stopSimulation, options.durationSeconds * 1000);

    const simulateUser = async () => {
      while (isRunning) {
        // Random interval between actions: 3-10 seconds
        const waitTime = Math.floor(Math.random() * (10000 - 3000 + 1) + 3000);
        await new Promise(r => setTimeout(r, waitTime));
        if (!isRunning) break;

        const actionStartTime = Date.now();
        const actionType = options.actions[Math.floor(Math.random() * options.actions.length)];
        let success = true;

        try {
          switch (actionType) {
            case 'generatePrompt':
              await testService.mockGenerateSpeakingPrompt('Daily conversation', 'Beginner', 'VI_TO_JP_SPEAKING');
              break;
            case 'mockSpeechToText':
              await testService.mockSpeechToText();
              break;
            case 'mockAIFeedback':
              await testService.mockEvaluateSpeaking('VI_TO_JP_SPEAKING');
              break;
            case 'saveHistory':
              const mockHistory: SpeakingHistory = {
                id: generateId(),
                practiceType: 'speaking',
                mode: 'VI_TO_JP_SPEAKING',
                topic: 'Daily conversation',
                difficulty: 'Beginner',
                promptText: 'Xin chào',
                targetJapaneseText: 'こんにちは',
                vietnameseMeaning: 'Hello',
                recognizedJapaneseText: 'こんにちは',
                scores: { overall: 90, pronunciation: 85, fluency: 95 },
                feedback: { 
                  overallScore: 90, 
                  overallComment: 'Good', 
                  pronunciationFeedback: 'Good', 
                  fluencyFeedback: 'Good', 
                  pronunciationScore: 85,
                  fluencyScore: 95,
                  practiceTips: [] 
                },
                isFavorite: false,
                createdAt: Date.now()
              };
              await testService.mockSaveSpeakingHistory(mockHistory);
              break;
            case 'openHistory':
              await testService.mockDelay(100, 300);
              storageService.getSpeakingHistory();
              break;
          }
        } catch (error) {
          success = false;
          metrics.errors.push(String(error));
        }

        const latency = Date.now() - actionStartTime;
        latencies.push(latency);
        
        metrics.totalActions++;
        if (success) metrics.successfulActions++;
        else metrics.failedActions++;

        // Update latency metrics
        metrics.averageLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        metrics.maxLatencyMs = Math.max(metrics.maxLatencyMs, latency);
        
        // P95, P99
        const sorted = [...latencies].sort((a, b) => a - b);
        metrics.p95LatencyMs = sorted[Math.floor(sorted.length * 0.95)] || 0;
        metrics.p99LatencyMs = sorted[Math.floor(sorted.length * 0.99)] || 0;

        onProgress({ ...metrics });
        onLog({ action: actionType, latency, timestamp: Date.now(), success });
      }
    };

    // Start virtual users
    // Distribute starts over the first 5 seconds to avoid initial spike
    for (let i = 0; i < options.virtualUsers; i++) {
        setTimeout(simulateUser, Math.random() * 5000);
    }
  },

  generateRecommendations: (metrics: PerformanceMetrics): string[] => {
    const recs: string[] = [];
    if (metrics.averageLatencyMs > 2000) {
      recs.push('Average latency is high (>2s). Consider optimizing AI response time or using a background processing queue.');
    }
    if (metrics.p99LatencyMs > 5000) {
      recs.push('High tail latency (P99 > 5s). Investigate occasional hanging requests or database locks.');
    }
    if (metrics.failedActions / metrics.totalActions > 0.05) {
      recs.push('Error rate is above 5%. Implement retry logic with exponential backoff and verify service stability.');
    }
    if (metrics.totalActions > 500 && metrics.averageLatencyMs > 500) {
       recs.push('Consider adding server-side caching for frequently generated prompts to reduce load.');
    }
    return recs;
  }
};
