import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { interviewService } from '../services/interviewService';
import { InterviewProfile } from './InterviewProfile';
import { InterviewRoom } from './InterviewRoom';
import { 
  Users, 
  Cpu, 
  Search, 
  MessageSquare, 
  Clock, 
  UserPlus, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type ViewState = 'lobby' | 'matching' | 'room' | 'history';

export const InterviewPage: React.FC = () => {
  const { user, profile, loading, signIn } = useAuth();
  const [view, setView] = useState<ViewState>('lobby');
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [topic, setTopic] = useState('General Interview');

  useEffect(() => {
    if (activeQueueId) {
      const unsub = onSnapshot(doc(db, 'matchingQueue', activeQueueId), (doc) => {
        if (doc.exists() && doc.data().status === 'matched') {
          setActiveRoomId(doc.data().roomId);
          setView('room');
          setActiveQueueId(null);
        }
      });
      return unsub;
    }
  }, [activeQueueId]);

  const handleStartPeerMatch = async () => {
    if (!profile) return;
    setView('matching');
    const id = await interviewService.joinQueue(profile, topic);
    if (id.length > 20) { // It's a roomId
      setActiveRoomId(id);
      setView('room');
    } else {
      setActiveQueueId(id);
    }
  };

  const cancelMatching = async () => {
    if (activeQueueId) {
      await interviewService.leaveQueue(activeQueueId);
      setActiveQueueId(null);
    }
    setView('lobby');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-neutral-700" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-12">
        <header className="space-y-4">
          <h1 className="text-7xl font-black uppercase tracking-tighter">Identity Required</h1>
          <p className="label-caps text-neutral-500">Access Global Interview Network</p>
        </header>
        <Card className="bg-neutral-900 border-neutral-800 p-12 space-y-8">
          <p className="text-xl text-neutral-400">Join the elite translation-focused interview circle. Peer practice requires authorized identity.</p>
          <Button onClick={signIn} className="w-full py-6">Sign in with Google</Button>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return <InterviewProfile />;
  }

  if (view === 'room' && activeRoomId) {
    return <InterviewRoom roomId={activeRoomId} onLeave={() => setView('lobby')} />;
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col justify-between border-b border-neutral-800 pb-8 md:flex-row md:items-end">
        <div>
          <h1 className="text-6xl font-black uppercase leading-none md:text-7xl">
            Interview<br/>Nexus
          </h1>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">Peer Matching & AI Simulation Terminal</p>
        </div>
        <div className="mt-8 flex gap-8 md:mt-0">
          <div className="text-right">
            <div className="text-4xl font-black tracking-tighter text-emerald-400">ONLINE</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-neutral-600">Status</div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-8 lg:grid-cols-2"
          >
            <Card className="flex flex-col justify-between space-y-8 bg-black hover:bg-neutral-900/40 transition-colors border-neutral-800">
              <div className="space-y-6">
                <div className="flex h-16 w-16 items-center justify-center bg-white text-black">
                  <Users size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Peer Protocol</h2>
                  <p className="label-caps !text-neutral-500 mt-2">Practice with another Human Candidate</p>
                </div>
                <p className="text-sm leading-relaxed text-neutral-400">
                  Enter the global pool to find partners with similar roles and Japanese proficiency. 
                  Live interaction, real-time feedback, binary growth.
                </p>
              </div>
              <Button onClick={handleStartPeerMatch} className="w-full">Initialize Matching</Button>
            </Card>

            <Card className="flex flex-col justify-between space-y-8 bg-neutral-900 border-none">
              <div className="space-y-6">
                <div className="flex h-16 w-16 items-center justify-center bg-emerald-500 text-black">
                  <Cpu size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">AI Simulation</h2>
                  <p className="label-caps !text-neutral-500 mt-2">Practice with Synthetic Interviewer</p>
                </div>
                <p className="text-sm leading-relaxed text-neutral-600 italic">
                  Currently offline. Deep Neural Integration scheduled for next patch. 
                  Please use Peer Protocol for active training.
                </p>
              </div>
              <Button disabled className="w-full opacity-30">Simulation Offline</Button>
            </Card>
          </motion.div>
        )}

        {view === 'matching' && (
          <motion.div 
            key="matching"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 space-y-12"
          >
            <div className="relative">
              <div className="h-48 w-48 border-[12px] border-neutral-900 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search size={48} className="text-neutral-700 animate-pulse" />
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black uppercase tracking-tighter">Scanning...</h2>
              <p className="label-caps !text-emerald-400">Searching for {profile.targetRole} Candidates ({profile.japaneseLevel})</p>
              
              <div className="flex justify-center gap-4 mt-8">
                <div className="flex flex-col items-center p-4 bg-neutral-900 min-w-[120px]">
                  <span className="text-lg font-black">{profile.japaneseLevel}</span>
                  <span className="label-caps !text-neutral-600 !tracking-widest">Level</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-neutral-900 min-w-[120px]">
                  <span className="text-lg font-black">{profile.targetRole}</span>
                  <span className="label-caps !text-neutral-600 !tracking-widest">Role</span>
                </div>
              </div>
            </div>

            <Button variant="danger" size="sm" onClick={cancelMatching}>
              Terminate Discovery
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-6 pt-12 border-t border-neutral-800">
        <label className="label-caps">Network Statistics</label>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-neutral-900/30 p-6 space-y-1">
            <p className="text-3xl font-black">24ms</p>
            <p className="label-caps !text-neutral-600">Latency</p>
          </div>
          <div className="bg-neutral-900/30 p-6 space-y-1">
            <p className="text-3xl font-black">1.2k</p>
            <p className="label-caps !text-neutral-600">Active Nodes</p>
          </div>
          <div className="bg-neutral-900/30 p-6 space-y-1 text-emerald-400">
            <p className="text-3xl font-black">Secure</p>
            <p className="label-caps !text-neutral-600">Protocol</p>
          </div>
        </div>
      </section>
    </div>
  );
};
