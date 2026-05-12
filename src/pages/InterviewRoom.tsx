import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { interviewService } from '../services/interviewService';
import { InterviewRoomData, Message, InterviewFeedback } from '../types';
import { 
  Send, 
  ArrowLeftRight, 
  Flag, 
  LogOut, 
  CheckCircle2, 
  MessageSquare, 
  Shield, 
  Cpu,
  History,
  Info,
  XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  roomId: string;
  onLeave: () => void;
}

export const InterviewRoom: React.FC<Props> = ({ roomId, onLeave }) => {
  const { user, profile } = useAuth();
  const [room, setRoom] = useState<InterviewRoomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubRoom = interviewService.listenToRoom(roomId, setRoom);
    const unsubMsgs = interviewService.listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      unsubRoom();
      unsubMsgs();
    };
  }, [roomId]);

  useEffect(() => {
    if (room && questions.length === 0) {
      interviewService.generateQuestions(room.targetRole, 'N3', room.topic)
        .then(setQuestions);
    }
  }, [room]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;
    await interviewService.sendMessage(roomId, user.uid, inputText);
    setInputText('');
  };

  const handleEndSession = async () => {
    if (confirm('End this interview session?')) {
      setIsEnding(true);
      await interviewService.endSession(roomId);
      setIsEnding(false);
    }
  };

  const handleGetAIResult = async () => {
    setIsGettingFeedback(true);
    try {
      const transcript = messages.map(m => m.text).join('\n');
      const result = await interviewService.getFeedback(transcript);
      setFeedback(result);
      
      // Save to history
      await interviewService.saveInterviewHistory({
        userId: user?.uid,
        partnerDisplayName: 'Partner', // Should fetch partner name properly
        targetRole: room?.targetRole,
        topic: room?.topic,
        transcript,
        aiFeedback: result
      });
    } catch (e) {
      console.error(e);
      alert('Feedback generation failed.');
    } finally {
      setIsGettingFeedback(false);
    }
  };

  if (!room) return null;

  const isInterviewer = room.interviewerId === user?.uid;
  const partnerId = room.userA === user?.uid ? room.userB : room.userA;

  return (
    <div className="grid h-[calc(100vh-180px)] gap-px bg-neutral-800 lg:grid-cols-4">
      {/* Sidebar: Info & Questions */}
      <div className="hidden flex-col gap-px bg-neutral-800 lg:flex">
        <div className="bg-black p-6 space-y-6">
          <label className="label-caps !text-neutral-500">Session Specs</label>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-neutral-600">Role</span>
              <Badge color={isInterviewer ? 'orange' : 'blue'}>{isInterviewer ? 'INTERVIEWER' : 'CANDIDATE'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-neutral-600">Topic</span>
              <span className="text-xs font-bold text-white">{room.topic}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-neutral-600">Status</span>
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black p-6 space-y-6 overflow-y-auto">
          <label className="label-caps !text-neutral-500">Suggested Prompts</label>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="group cursor-pointer bg-neutral-900 border border-neutral-800 p-4 transition-colors hover:border-white" onClick={() => setInputText(q)}>
                <p className="text-xs text-neutral-400 leading-relaxed group-hover:text-white">{q}</p>
              </div>
            ))}
            {questions.length === 0 && <div className="text-[10px] uppercase font-black text-neutral-700 animate-pulse">Calculating vectors...</div>}
          </div>
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="flex flex-col bg-black lg:col-span-3">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 p-6 px-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-neutral-800 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Secure Terminal</h3>
              <p className="text-[10px] text-neutral-500">Encrypted Communication Layer</p>
            </div>
          </div>

          <div className="flex gap-2">
            {room.status === 'active' ? (
              <Button variant="ghost" size="sm" onClick={handleEndSession}>End Protocol</Button>
            ) : (
              <Button size="sm" onClick={handleGetAIResult} isLoading={isGettingFeedback}>
                Initialize Feedback
              </Button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {messages.map((msg, i) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col space-y-2",
                msg.senderId === user?.uid ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black uppercase text-neutral-700">
                  {msg.senderId === user?.uid ? 'ME' : 'PARTNER'}
                </span>
                <span className="text-[8px] text-neutral-800 font-mono">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div 
                className={cn(
                  "max-w-[80%] p-5 text-sm md:text-base selection:bg-white selection:text-black",
                  msg.senderId === user?.uid 
                    ? "bg-white text-black font-medium" 
                    : "bg-neutral-900 text-white border border-neutral-800"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Layer */}
        {room.status === 'active' && (
          <div className="border-t border-neutral-900 p-6 px-8 bg-neutral-950/50">
            <div className="flex gap-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Transmission details..."
                className="flex-1 bg-transparent border-b border-neutral-800 py-2 text-lg font-medium focus:border-white focus:outline-none resize-none overflow-hidden h-10"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="bg-white text-black p-4 flex items-center justify-center hover:bg-emerald-500 transition-colors disabled:opacity-20 translate-y-1"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute inset-y-0 right-0 z-50 w-full max-w-xl bg-black border-l border-neutral-800 shadow-2xl overflow-y-auto"
            >
              <div className="p-8 space-y-12 pb-32">
                <header className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">AI Feedback</h2>
                    <p className="label-caps text-neutral-500">Neural Performance Analysis</p>
                  </div>
                  <Button variant="ghost" onClick={() => setFeedback(null)}>Dismiss</Button>
                </header>

                <div className="grid gap-px bg-neutral-800">
                  <Stat label="Fluency" value={feedback.fluencyScore} color="emerald" />
                  <Stat label="Grammar" value={feedback.grammarScore} color="blue" />
                  <Stat label="Lexicon" value={feedback.vocabularyScore} color="orange" />
                  <Stat label="Professional" value={feedback.professionalismScore} color="purple" />
                </div>

                <div className="space-y-6">
                  <label className="label-caps">Strategic Review</label>
                  <p className="text-lg font-medium text-neutral-300 leading-relaxed italic border-l-2 border-emerald-500 pl-6">
                    {feedback.overallComment}
                  </p>
                </div>

                <div className="space-y-6">
                  <label className="label-caps text-emerald-500">Assets & Strengths</label>
                  <div className="space-y-3">
                    {feedback.strengths?.map((s, i) => (
                      <div key={i} className="bg-neutral-900 border border-neutral-800 p-4 text-sm font-bold text-white flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="label-caps text-red-500">Vulnerabilities</label>
                  <div className="space-y-3">
                    {feedback.weakPoints?.map((w, i) => (
                      <div key={i} className="bg-neutral-900 border border-neutral-800 p-4 text-sm font-bold text-white flex items-center gap-3">
                        <XCircle size={16} className="text-red-500" />
                        {w}
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full py-6" onClick={onLeave}>Terminate Session</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400'
  };
  return (
    <div className="bg-black p-6 flex items-end justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{label}</span>
      <span className={cn("text-3xl font-black", colors[color])}>{value}%</span>
    </div>
  );
};
