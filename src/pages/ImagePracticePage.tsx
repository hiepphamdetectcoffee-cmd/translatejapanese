import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { AIResultCard } from '../components/AIResultCard';
import { Image as ImageIcon, Camera, Upload, ChevronRight, Check, Trash2, Edit3, Globe, AlertCircle, RefreshCw, Layers, CheckSquare, Square } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { EvaluationResult, TranslationDirection, PracticeHistory, BatchItem, BatchEvaluationResponse } from '../types';

type Step = 'upload' | 'extract' | 'select' | 'translate' | 'result';

interface ExtractedSentence {
  id: string;
  text: string;
  lang: 'JA' | 'VI';
  suggestedDirection: TranslationDirection;
  userTranslation?: string;
  evaluation?: EvaluationResult;
}

export const ImagePracticePage: React.FC = () => {
  const settings = storageService.getSettings();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [extractedText, setExtractedText] = useState('');
  const [sentences, setSentences] = useState<ExtractedSentence[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<BatchEvaluationResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage(reader.result as string);
      setImageMimeType(file.type);
      setCurrentStep('extract');
      handleExtract(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async (base64: string, mime: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const text = await aiService.extractTextFromImage(base64, mime);
      if (!text) {
        setError('Không tìm thấy chữ trong ảnh. Vui lòng thử ảnh rõ hơn.');
        setCurrentStep('upload');
        return;
      }
      setExtractedText(text);
      processExtractedText(text);
      setCurrentStep('select');
    } catch (e: any) {
      setError(e.message || 'Không thể trích xuất nội dung. Vui lòng thử lại.');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const processExtractedText = (text: string) => {
    const lines = text.split(/[。\.\n!？\?!]/).map(s => s.trim()).filter(s => s.length > 5);
    
    const processed: ExtractedSentence[] = lines.map(s => {
      const isJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(s);
      return {
        id: crypto.randomUUID(),
        text: s,
        lang: isJapanese ? 'JA' : 'VI',
        suggestedDirection: isJapanese ? 'JA_TO_VI' : 'VI_TO_JA',
        userTranslation: ''
      };
    });
    setSentences(processed);
  };

  const toggleSentenceSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= settings.maxBatchSize) {
        setError(`Bạn có thể chấm tối đa ${settings.maxBatchSize} câu mỗi lượt.`);
        return;
      }
      newSelected.add(id);
      setError(null);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === Math.min(sentences.length, settings.maxBatchSize)) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(sentences.slice(0, settings.maxBatchSize).map(s => s.id));
      setSelectedIds(newSelected);
    }
  };

  const handleUpdateTranslation = (id: string, text: string) => {
    setSentences(prev => prev.map(s => s.id === id ? { ...s, userTranslation: text } : s));
  };

  const handleSubmitBatch = async () => {
    const selectedSentences = sentences.filter(s => selectedIds.has(s.id));
    
    if (selectedSentences.length === 0) {
      setError('Vui lòng chọn ít nhất 1 câu để luyện dịch.');
      return;
    }

    if (selectedSentences.some(s => !s.userTranslation?.trim())) {
      setError('Vui lòng nhập bản dịch cho các câu đã chọn.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const batchId = crypto.randomUUID();
      const items: BatchItem[] = selectedSentences.map(s => ({
        id: s.id,
        sourceText: s.text,
        userTranslation: s.userTranslation!,
        direction: s.suggestedDirection,
        detectedLanguage: s.lang === 'JA' ? 'Japanese' : 'Vietnamese'
      }));

      const response = await aiService.evaluateBatchTranslations(items);
      setBatchResults(response);

      // Save each to history
      response.results.forEach(res => {
        const sourceItem = selectedSentences.find(s => s.id === res.id)!;
        const historyItem: PracticeHistory = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          direction: sourceItem.suggestedDirection,
          topic: 'Random',
          difficulty: 'Intermediate',
          sourceSentence: sourceItem.text,
          userTranslation: sourceItem.userTranslation!,
          isManualInput: false,
          sourceType: 'batch',
          batchId,
          evaluation: {
            ...res,
            explanation: res.overallComment
          },
          isFavorite: false,
        };
        storageService.addHistoryItem(historyItem);
      });

      setCurrentStep('result');
    } catch (e: any) {
      setError(e.message || 'Chấm hàng loạt thất bại. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setExtractedText('');
    setSentences([]);
    setSelectedIds(new Set());
    setBatchResults(null);
    setCurrentStep('upload');
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4 border-b border-neutral-800 pb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-6xl font-black uppercase tracking-tighter">Batch Scan</h1>
            <p className="label-caps !text-neutral-500">Image Intelligence Pipeline</p>
          </div>
          {currentStep !== 'upload' && (
            <Button variant="ghost" size="sm" onClick={reset}>Reset Pipeline</Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center space-y-6 border-4 border-dashed border-neutral-800 bg-neutral-900/10 py-32 transition-all hover:border-emerald-500 hover:bg-neutral-900/30 cursor-pointer"
              >
                <div className="bg-neutral-800 p-8 text-neutral-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <Camera size={48} strokeWidth={1} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black uppercase tracking-tighter text-white">Ingest Raw Image</p>
                  <p className="label-caps !text-neutral-600 mt-2">Maximum Throughput: {settings.maxBatchSize} items/batch</p>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
              />
              {error && (
                <div className="border border-red-900 bg-red-950/20 p-4 text-center">
                  <p className="label-caps !text-red-500">{error}</p>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 'extract' && (
            <motion.div
              key="extract"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 space-y-8"
            >
              <div className="relative">
                <div className="h-24 w-24 border-8 border-neutral-800 border-t-emerald-500 animate-spin" />
                <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-500" size={32} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black uppercase tracking-tighter text-white">Decoupling Data Vectors</p>
                <p className="label-caps !text-neutral-600 animate-pulse mt-2">Running OCR Subsystem...</p>
              </div>
            </motion.div>
          )}

          {currentStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="grid gap-12 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-4">
                  <label className="label-caps">Visual Manifest</label>
                  <div className="group relative border border-neutral-800 overflow-hidden">
                    <img src={selectedImage!} alt="Source" className="w-full object-contain grayscale transition-all group-hover:grayscale-0" />
                  </div>
                </div>

                <div className="space-y-8 lg:col-span-8">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                    <div className="space-y-1">
                      <label className="label-caps">Extracted Particles</label>
                      <p className="text-[10px] font-black uppercase text-neutral-600">
                        Selected: <span className="text-emerald-500">{selectedIds.size}</span> / {settings.maxBatchSize}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                      {selectedIds.size > 0 ? 'Deselect Items' : 'Auto Fill Batch'}
                    </Button>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4">
                      <p className="label-caps !text-red-500 !tracking-tight">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {sentences.map(s => (
                      <Card 
                        key={s.id} 
                        className={cn(
                          "group relative transition-all cursor-pointer p-6 border-neutral-800",
                          selectedIds.has(s.id) ? "bg-neutral-900 border-white/20" : "bg-neutral-900/20 hover:bg-neutral-900/40"
                        )}
                        onClick={() => toggleSentenceSelection(s.id)}
                      >
                        <div className="flex gap-6 items-start">
                          <div className={cn(
                            "mt-1 shrink-0 transition-colors",
                            selectedIds.has(s.id) ? "text-emerald-500" : "text-neutral-700"
                          )}>
                            {selectedIds.has(s.id) ? <CheckSquare size={24} /> : <Square size={24} />}
                          </div>
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center justify-between">
                              <Badge color={s.lang === 'JA' ? 'orange' : 'blue'}>{s.lang}</Badge>
                              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{s.suggestedDirection === 'JA_TO_VI' ? 'JA ➔ VI' : 'VI ➔ JA'}</span>
                            </div>
                            <p className="text-lg font-bold leading-tight text-white">{s.text}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full py-6 text-base" 
                    disabled={selectedIds.size === 0}
                    onClick={() => setCurrentStep('translate')}
                  >
                    Initialize Translation Phase
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'translate' && (
            <motion.div
              key="translate"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Translation Stack</h2>
                  <p className="label-caps !text-neutral-500 mt-1">Processing {selectedIds.size} concurrent streams</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('select')}>
                  Back to Manifest
                </Button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4">
                  <p className="label-caps !text-red-500 !tracking-tight">{error}</p>
                </div>
              )}

              <div className="space-y-12">
                {sentences.filter(s => selectedIds.has(s.id)).map((s, idx) => (
                  <div key={s.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center bg-white text-black font-black">{idx + 1}</span>
                      <Badge color="neutral">{s.suggestedDirection === 'JA_TO_VI' ? '🇯🇵 ➔ 🇻🇳' : '🇻🇳 ➔ 🇯🇵'}</Badge>
                    </div>
                    
                    <div className="grid gap-px bg-neutral-800 md:grid-cols-2">
                      <div className="bg-neutral-900 p-8">
                        <label className="label-caps !text-neutral-600 mb-4 block">Source</label>
                        <p className="text-2xl font-black leading-tight text-white">{s.text}</p>
                      </div>
                      <div className="bg-neutral-950 p-8">
                        <label className="label-caps !text-neutral-600 mb-4 block">Translation Target</label>
                        <textarea
                          placeholder="Type input data..."
                          value={s.userTranslation}
                          onChange={(e) => handleUpdateTranslation(s.id, e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xl font-medium focus:ring-0 focus:outline-none min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-8 pt-12">
                <Button 
                  className="w-full py-8 text-lg font-black uppercase tracking-tighter" 
                  onClick={handleSubmitBatch} 
                  isLoading={isProcessing}
                >
                  {isProcessing ? 'Synchronizing Neural Feedback...' : 'Commit Batch for Evaluation'}
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 'result' && batchResults && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-8">
                <div>
                  <h1 className="text-6xl font-black uppercase tracking-tighter italic">Batch Finalized</h1>
                  <p className="label-caps text-neutral-500 mt-2">Aggregate Score Analysis</p>
                </div>
                <Button variant="primary" onClick={reset}>Start New Pipeline</Button>
              </div>

              <div className="space-y-16">
                {batchResults.results?.map((res, i) => {
                  const sourceItem = sentences.find(s => s.id === res.id)!;
                  return (
                    <div key={res.id} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center bg-emerald-500 text-black font-black text-xl">{i + 1}</span>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Result Trace</h3>
                      </div>
                      <AIResultCard 
                        evaluation={{
                          ...res,
                          explanation: res.overallComment
                        }} 
                        className="border-neutral-800 bg-neutral-900/20"
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
