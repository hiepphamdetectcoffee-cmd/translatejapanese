import React, { useState, useEffect } from 'react';
import { TranslationDirection, Topic, Difficulty, PracticeHistory, EvaluationResult } from '../types';
import { DIRECTIONS, TOPICS, DIFFICULTIES } from '../constants';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { Card, Button, Badge } from '../components/UI';
import { AIResultCard } from '../components/AIResultCard';
import { Sparkles, Languages, Edit3, Send, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const PracticePage: React.FC = () => {
  const [direction, setDirection] = useState<TranslationDirection>('JA_TO_VI');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [topic, setTopic] = useState<Topic>('Daily conversation');
  const [isManualInput, setIsManualInput] = useState(false);
  
  const [sourceSentence, setSourceSentence] = useState('');
  const [userTranslation, setUserTranslation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settings = storageService.getSettings();
    setDirection(settings.defaultDirection);
    setDifficulty(settings.defaultDifficulty);
    setTopic(settings.defaultTopic);
  }, []);

  const handleGenerateSentence = async () => {
    setIsGenerating(true);
    setError(null);
    setEvaluation(null);
    setUserTranslation('');
    try {
      const sentence = await aiService.generateSentence(direction, topic, difficulty);
      setSourceSentence(sentence);
    } catch (e) {
      setError('Could not generate sentence. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!sourceSentence.trim() || !userTranslation.trim()) return;

    setIsEvaluating(true);
    setError(null);
    try {
      const result = await aiService.evaluateTranslation(sourceSentence, userTranslation, direction);
      setEvaluation(result);

      const historyItem: PracticeHistory = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction,
        topic,
        difficulty,
        sourceSentence,
        userTranslation,
        isManualInput,
        sourceType: isManualInput ? 'manual' : 'ai',
        evaluation: result,
        isFavorite: false,
      };
      storageService.addHistoryItem(historyItem);
    } catch (e: any) {
      setError(e.message || 'Evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    setEvaluation(null);
    setUserTranslation('');
    if (!isManualInput) {
      handleGenerateSentence();
    } else {
      setSourceSentence('');
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col justify-between border-b border-neutral-800 pb-8 md:flex-row md:items-end">
        <div>
          <h1 className="text-6xl font-black uppercase leading-none md:text-7xl">
            JP-VI<br/>PRACTICE
          </h1>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">Translation Mastery Interface v1.0</p>
        </div>
        <div className="mt-8 flex gap-8 md:mt-0">
          <div className="text-right">
            <div className="text-4xl font-black tracking-tighter text-white">PRO</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-neutral-600">License</div>
          </div>
        </div>
      </header>

      {!evaluation ? (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Controls */}
          <div className="space-y-6 lg:col-span-4">
            <Card className="space-y-6 border-none bg-neutral-900/50">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="label-caps">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as TranslationDirection)}
                    className="w-full border-b border-neutral-800 bg-transparent py-2 text-sm font-bold text-white focus:border-white focus:outline-none"
                  >
                    {DIRECTIONS.map(d => <option key={d.value} value={d.value} className="bg-neutral-900">{d.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-caps">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full border-b border-neutral-800 bg-transparent py-2 text-sm font-bold text-white focus:border-white focus:outline-none"
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-neutral-900">{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-caps">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as Topic)}
                    className="w-full border-b border-neutral-800 bg-transparent py-2 text-sm font-bold text-white focus:border-white focus:outline-none"
                  >
                    {TOPICS.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-caps">Source Mode</label>
                  <div className="grid grid-cols-2 border border-neutral-800">
                    <button
                      onClick={() => setIsManualInput(false)}
                      className={cn(
                        "py-2 text-[10px] font-black uppercase tracking-widest",
                        !isManualInput ? "bg-white text-black" : "text-neutral-500 hover:text-white"
                      )}
                    >
                      AI Core
                    </button>
                    <button
                      onClick={() => setIsManualInput(true)}
                      className={cn(
                        "py-2 text-[10px] font-black uppercase tracking-widest border-l border-neutral-800",
                        isManualInput ? "bg-white text-black" : "text-neutral-500 hover:text-white"
                      )}
                    >
                      Manual
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Editor */}
          <div className="space-y-6 lg:col-span-8">
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label-caps">Source Sentence</label>
                  {!isManualInput && (
                    <button 
                      onClick={handleGenerateSentence} 
                      disabled={isGenerating}
                      className="text-[8px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 disabled:opacity-30"
                    >
                      {isGenerating ? 'Synthesizing...' : 'Re-Generate'}
                    </button>
                  )}
                </div>
                
                {isManualInput ? (
                  <textarea
                    value={sourceSentence}
                    onChange={(e) => setSourceSentence(e.target.value)}
                    placeholder="Enter source text here..."
                    className="w-full border-2 border-neutral-800 bg-neutral-900/30 p-6 text-2xl font-bold leading-tight placeholder:opacity-20 focus:border-white focus:outline-none"
                    rows={3}
                  />
                ) : (
                  <div className="min-h-[120px] border-2 border-neutral-800 bg-neutral-900 p-8 text-3xl font-black leading-tight tracking-tight text-white">
                    {isGenerating ? (
                      <div className="animate-pulse text-neutral-700">Synthesizing stimulus...</div>
                    ) : sourceSentence ? (
                      sourceSentence
                    ) : (
                      <button 
                        onClick={handleGenerateSentence}
                        className="flex w-full items-center justify-center space-x-2 text-neutral-700 hover:text-white"
                      >
                        <Sparkles size={24} />
                        <span className="text-xl">Generate Stimulus</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="label-caps">Your Translation</label>
                <textarea
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  placeholder={direction === 'JA_TO_VI' ? "Enter Vietnamese translation..." : "日本語に翻訳してください..."}
                  className="flex-1 min-h-[180px] w-full border-2 border-white/10 bg-transparent p-6 text-2xl font-medium placeholder:opacity-10 focus:border-white focus:outline-none"
                />
              </div>

              {error && (
                <div className="border border-red-900 bg-red-950/20 p-4 text-[10px] font-black uppercase tracking-widest text-red-500">
                  CRITICAL: {error}
                </div>
              )}

              <Button 
                className="w-full py-6 text-base" 
                onClick={handleSubmit} 
                isLoading={isEvaluating}
                disabled={!sourceSentence || !userTranslation}
              >
                Evaluate Translation
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <AIResultCard evaluation={evaluation} onContinue={handleNext} />
      )}
    </div>
  );
};
