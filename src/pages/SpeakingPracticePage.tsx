import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { TOPICS, DIFFICULTIES } from '../constants';
import { 
  Mic, 
  Square, 
  RotateCcw, 
  Play, 
  Volume2, 
  CheckCircle2, 
  MessageSquare, 
  Settings2, 
  History, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Clock,
  Waves
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SpeakingMode, SpeakingPrompt, Topic, Difficulty, SpeakingFeedback, SpeakingHistory } from '../types';

export const SpeakingPracticePage: React.FC = () => {
  const [mode, setMode] = useState<SpeakingMode>('VI_TO_JP_SPEAKING');
  const [topic, setTopic] = useState<Topic>('Daily conversation');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [prompt, setPrompt] = useState<SpeakingPrompt | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ttsSpeed, setTtsSpeed] = useState(1);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ja-JP';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setRecognizedText(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setError('Micro chưa được cấp quyền. Vui lòng cho phép truy cập micro để luyện nói.');
        }
      };
    }
  }, []);

  const generatePrompt = async () => {
    setIsProcessing(true);
    setError(null);
    setFeedback(null);
    setRecognizedText('');
    setAudioUrl(null);
    try {
      const newPrompt = await aiService.generateSpeakingPrompt(mode, topic, difficulty);
      setPrompt(newPrompt);
    } catch (e: any) {
      setError(e.message || 'Không thể tạo câu luyện. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start();
      recognitionRef.current?.start();
      setIsRecording(true);
      setRecordTime(0);
      setRecognizedText('');
      
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } catch (e) {
      setError('Micro chưa được cấp quyền. Vui lòng cho phép truy cập micro.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const playTTS = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = ttsSpeed;
    window.speechSynthesis.speak(utterance);
  };

  const submitForEvaluation = async () => {
    if (!prompt || !recognizedText.trim()) {
      setError('Vui lòng ghi âm trước khi chấm điểm.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const evaluation = await aiService.evaluateSpeaking(mode, prompt, recognizedText);
      setFeedback(evaluation);

      // Save to history
      const historyItem: SpeakingHistory = {
        id: crypto.randomUUID(),
        practiceType: 'speaking',
        mode,
        topic,
        difficulty,
        promptText: prompt.promptText,
        targetJapaneseText: prompt.targetJapaneseText,
        vietnameseMeaning: prompt.vietnameseMeaning,
        recognizedJapaneseText: recognizedText,
        scores: {
          overall: evaluation.overallScore,
          meaning: (evaluation as any).meaningScore,
          grammar: (evaluation as any).grammarScore,
          vocabulary: (evaluation as any).vocabularyScore,
          naturalness: (evaluation as any).naturalnessScore,
          pronunciation: evaluation.pronunciationScore,
          fluency: evaluation.fluencyScore,
          rhythm: (evaluation as any).rhythmScore,
          intonation: (evaluation as any).intonationScore,
          completeness: (evaluation as any).completenessScore,
        },
        feedback: evaluation,
        isFavorite: false,
        createdAt: Date.now(),
      };
      storageService.addSpeakingHistory(historyItem);
    } catch (e: any) {
      setError(e.message || 'AI đang gặp lỗi. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EF] text-[#263238] space-y-12 pb-24 font-sans">
      <header className="space-y-4 border-b border-[#F0E6DA] pb-8 px-4 sm:px-8 pt-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="space-y-1">
            <h1 className="text-6xl font-black uppercase tracking-tighter italic text-[#263238]">Voice Coach</h1>
            <p className="label-caps !text-[#607D8B]">Nurturing Your Japanese Potential</p>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="flex bg-[#F8FAF5] p-1 rounded-full border border-[#F0E6DA] overflow-hidden">
                <button 
                  onClick={() => setMode('VI_TO_JP_SPEAKING')}
                  className={cn(
                    "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full",
                    mode === 'VI_TO_JP_SPEAKING' ? "bg-[#4CAF8F] text-white" : "text-[#607D8B] hover:text-[#263238]"
                  )}
                >
                  Translate
                </button>
                <button 
                  onClick={() => setMode('JP_TO_JP_SHADOWING')}
                  className={cn(
                    "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full",
                    mode === 'JP_TO_JP_SHADOWING' ? "bg-[#6FA8DC] text-white" : "text-[#607D8B] hover:text-[#263238]"
                  )}
                >
                  Shadow
                </button>
             </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-12 px-4 sm:px-8">
        {/* Controls Section */}
        <Card className="bg-white p-8 border-[#F0E6DA] shadow-sm rounded-2xl">
           <div className="flex flex-wrap gap-8 items-end">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="label-caps !text-[#90A4AE]">Choose Topic</label>
                <select 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as Topic)}
                  className="w-full border-b border-[#F0E6DA] bg-transparent py-2 font-bold text-lg text-[#263238] focus:border-[#4CAF8F] focus:outline-none"
                >
                  {TOPICS.map(t => <option key={t} value={t} className="bg-white">{t}</option>)}
                </select>
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="label-caps !text-[#90A4AE]">Level</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full border-b border-[#F0E6DA] bg-transparent py-2 font-bold text-lg text-[#263238] focus:border-[#4CAF8F] focus:outline-none"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-white">{d}</option>)}
                </select>
              </div>
              <Button 
                variant="primary" 
                onClick={generatePrompt} 
                isLoading={isProcessing}
                className="px-12 py-4 !bg-[#4CAF8F] !text-white hover:!bg-[#3E9B7D] !rounded-full !tracking-wider"
              >
                Start Practice
              </Button>
           </div>
        </Card>

        {/* Prompt Section */}
        <AnimatePresence mode="wait">
          {prompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="grid gap-px bg-[#F0E6DA] lg:grid-cols-2 shadow-xl rounded-2xl overflow-hidden border border-[#F0E6DA]">
                <div className="bg-white p-12 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="label-caps !text-[#90A4AE]">Target Phrase</label>
                    <Badge color="neutral" className="!bg-[#EAF4FF] !text-[#6FA8DC] !border-[#6FA8DC]/20">{mode === 'VI_TO_JP_SPEAKING' ? 'Vietnamese ➔ Japanese' : 'Shadowing Mode'}</Badge>
                  </div>
                  <p className="text-4xl font-black leading-tight text-[#263238] tracking-tight">
                    {prompt.promptText}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prompt.vocabularyFocus?.map(v => (
                       <span key={v} className="text-[10px] font-black uppercase tracking-widest text-[#4CAF8F] bg-[#E7F6F0] px-3 py-1 rounded-full">
                         {v}
                       </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FAFBFC] p-12 flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <label className="label-caps !text-[#90A4AE]">Guided Audio</label>
                    {mode === 'JP_TO_JP_SHADOWING' ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => playTTS(prompt.promptText)}
                             className="!bg-[#EAF4FF] !text-[#6FA8DC] hover:!bg-[#D0E5F8] !rounded-full !border-none"
                           >
                             <Volume2 className="mr-2" size={16} /> Play Lesson
                           </Button>
                           <div className="flex bg-[#EAF4FF] p-1 rounded-full">
                              {[0.75, 1, 1.25].map(s => (
                                <button 
                                  key={s} 
                                  onClick={() => setTtsSpeed(s)}
                                  className={cn(
                                    "px-3 py-1 text-[8px] font-black uppercase transition-all rounded-full",
                                    ttsSpeed === s ? "bg-[#6FA8DC] text-white" : "text-[#6FA8DC] hover:text-[#263238]"
                                  )}
                                >
                                  {s}x
                                </button>
                              ))}
                           </div>
                        </div>
                        <div className="bg-[#FFF8EF] p-4 rounded-xl border border-[#F0E6DA]">
                          <p className="text-sm text-[#607D8B] leading-relaxed italic">{prompt.vietnameseMeaning}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#90A4AE] italic">
                         <Clock size={16} />
                         <p className="text-[10px] font-black uppercase tracking-widest">Listening context established</p>
                      </div>
                    )}
                  </div>

                  {/* Recording Interface */}
                  <div className="space-y-6">
                    <div className="flex items-end justify-between">
                       <div className="space-y-1">
                         <p className={cn(
                           "text-2xl font-black tracking-tighter transition-colors",
                           isRecording ? "text-[#FF8A80]" : "text-[#263238]"
                         )}>
                            00:{recordTime.toString().padStart(2, '0')}
                         </p>
                         <p className="label-caps !text-[#90A4AE] !text-[8px]">Time Elapsed</p>
                       </div>
                       {isRecording && (
                         <div className="flex gap-1 items-end">
                            {[1,2,3,4,5].map(i => (
                              <motion.div 
                                key={i}
                                animate={{ height: [4, 18, 4] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                className="w-1.5 bg-[#FF8A80] rounded-full"
                              />
                            ))}
                         </div>
                       )}
                    </div>

                    <div className="flex gap-4">
                      {!isRecording ? (
                        <button 
                          onClick={startRecording}
                          className="flex-1 group flex items-center justify-center gap-3 bg-[#FFB86B] hover:bg-[#FFA340] p-6 transition-all rounded-2xl shadow-md"
                        >
                          <Mic className="text-white" />
                          <span className="text-white font-black uppercase tracking-tighter">Start Recording</span>
                        </button>
                      ) : (
                        <button 
                          onClick={stopRecording}
                          className="flex-1 flex items-center justify-center gap-3 bg-[#FF8A80] p-6 animate-pulse rounded-2xl shadow-md"
                        >
                          <Square className="text-white fill-current" />
                          <span className="text-white font-black uppercase tracking-tighter">Stop Early</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtitles / Recognized Text */}
              <AnimatePresence>
                {(recognizedText || isProcessing) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-12 bg-white border border-[#F0E6DA] rounded-2xl shadow-sm space-y-6"
                  >
                    <div className="flex items-center justify-between">
                       <label className="label-caps !text-[#90A4AE]">Vocal Recognition</label>
                       {isProcessing && <Loader2 className="animate-spin text-[#4CAF8F]" size={20} />}
                    </div>
                    <p className="text-3xl font-bold leading-tight text-[#263238] min-h-[4rem]">
                      {recognizedText || <span className="text-[#B0BEC5]">Processing voice signals...</span>}
                    </p>
                    
                    {!isRecording && recognizedText && !feedback && (
                      <div className="flex gap-4 pt-6 border-t border-[#F0E6DA]">
                        <Button 
                          variant="primary" 
                          className="flex-1 py-4 !bg-[#4CAF8F] !text-white hover:!bg-[#3E9B7D] !rounded-full !tracking-wider" 
                          onClick={submitForEvaluation}
                          isLoading={isProcessing}
                        >
                          Analyze My Speech
                        </Button>
                        {audioUrl && (
                          <Button 
                            variant="ghost" 
                            className="!bg-[#EAF4FF] !text-[#6FA8DC] hover:!bg-[#D0E5F8] !rounded-full !border-none"
                            onClick={() => {
                              const audio = new Audio(audioUrl);
                              audio.play();
                            }}
                          >
                            <Play size={18} className="mr-2" /> Listen Back
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          className="!text-[#90A4AE] hover:!text-[#263238] !rounded-full"
                          onClick={() => {
                            setRecognizedText('');
                            setAudioUrl(null);
                          }}
                        >
                          <RotateCcw size={18} className="mr-2" /> Redo
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feedback Section */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    <div className="grid gap-px bg-[#F0E6DA] sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden shadow-lg border border-[#F0E6DA]">
                       <ScoreBox label="Overall" value={feedback.overallScore} />
                       <ScoreBox label="Pronunciation" value={feedback.pronunciationScore} />
                       <ScoreBox label="Fluency" value={feedback.fluencyScore} />
                       <ScoreBox label="Expression" value={(feedback as any).naturalnessScore || (feedback as any).rhythmScore || 0} />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-12">
                      <div className="lg:col-span-8 space-y-8">
                         <div className="bg-white p-12 space-y-6 border border-[#F0E6DA] rounded-2xl shadow-sm">
                           <label className="label-caps !text-[#90A4AE]">Expert Feedback</label>
                           <p className="text-xl font-medium leading-relaxed italic border-l-4 border-[#4CAF8F] pl-8 text-[#263238]">
                             {feedback.overallComment}
                           </p>
                         </div>

                         {feedback.suggestedBetterAnswer && (
                           <div className="bg-white p-12 border border-[#F0E6DA] rounded-2xl shadow-sm space-y-6">
                             <div className="flex items-center justify-between">
                               <label className="label-caps !text-[#4CAF8F]">Suggested Expression</label>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 onClick={() => playTTS(feedback.suggestedBetterAnswer!)}
                                 className="!bg-[#EAF4FF] !text-[#6FA8DC] hover:!bg-[#D0E5F8] !rounded-full !border-none"
                               >
                                 <Volume2 size={16} />
                               </Button>
                             </div>
                             <p className="text-3xl font-black tracking-tight text-[#263238]">
                               {feedback.suggestedBetterAnswer}
                             </p>
                           </div>
                         )}
                      </div>

                      <div className="lg:col-span-4 space-y-8">
                         <div className="space-y-4">
                           <label className="label-caps">Coaching Tips</label>
                           {feedback.practiceTips?.map((tip, i) => (
                             <div key={i} className="flex items-start gap-4 bg-[#FFF0DD] p-5 rounded-xl text-xs font-bold text-[#263238] border border-[#FFB86B]/20 shadow-sm">
                               <CheckCircle2 size={18} className="text-[#FFB86B] shrink-0" />
                               {tip}
                             </div>
                           ))}
                         </div>

                         {feedback.usefulPhrases && (
                           <div className="space-y-4">
                             <label className="label-caps">Key Vocabulary</label>
                             <div className="grid gap-3">
                               {feedback.usefulPhrases?.map((p, i) => (
                                 <div key={i} className="bg-white p-5 border border-[#F0E6DA] rounded-xl group transition-all hover:border-[#4CAF8F] shadow-sm">
                                   <p className="font-bold text-[#263238] mb-1">{p.japanese}</p>
                                   <p className="text-[10px] uppercase font-black text-[#607D8B]">{p.vietnamese}</p>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-[#F0E6DA] flex justify-center">
                       <Button 
                        variant="primary" 
                        className="px-20 py-6 !bg-[#FFB86B] !text-white hover:!bg-[#FFA340] !rounded-full !tracking-widest !text-sm" 
                        onClick={generatePrompt}
                       >
                         Next Challenge
                       </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-6 border border-[#FF8A80]/20 bg-[#FFF0F0] p-8 rounded-2xl shadow-sm">
            <AlertCircle className="text-[#FF8A80]" size={32} />
            <div className="space-y-1">
              <p className="label-caps !text-[#FF8A80]">Instruction Notice</p>
              <p className="text-sm text-[#263238] font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ScoreBox = ({ label, value }: { label: string; value: number }) => {
  const getScoreColor = (val: number) => {
    if (val >= 90) return 'text-[#4CAF8F]';
    if (val >= 75) return 'text-[#8BC34A]';
    if (val >= 60) return 'text-[#FFB86B]';
    return 'text-[#FF8A80]';
  };

  return (
    <div className="bg-white p-8 flex flex-col justify-between h-44 shadow-sm border border-[#F0E6DA]">
       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#90A4AE]">{label}</span>
       <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-7xl font-black tracking-tighter", getScoreColor(value))}>{value}</span>
            <span className="text-[10px] font-bold text-[#B0BEC5] uppercase">pts</span>
          </div>
          <div className="h-1.5 w-full bg-[#FAFBFC] rounded-full mt-4 overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${value}%` }}
               className={cn("h-full", getScoreColor(value).replace('text-', 'bg-'))}
             />
          </div>
       </div>
    </div>
  );
};
