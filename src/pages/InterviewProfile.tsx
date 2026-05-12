import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { JapaneseLevel, TargetRole } from '../types';
import { User, ShieldCheck } from 'lucide-react';

export const InterviewProfile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [japaneseLevel, setJapaneseLevel] = useState<JapaneseLevel>(profile?.japaneseLevel || 'N3');
  const [targetRole, setTargetRole] = useState<TargetRole>(profile?.targetRole || 'BrSE');
  const [interviewGoal, setInterviewGoal] = useState(profile?.interviewGoal || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    await userService.createUserProfile({
      uid: user.uid,
      displayName,
      japaneseLevel,
      targetRole,
      interviewGoal,
      availableStatus: 'available'
    });
    await refreshProfile();
    setIsSaving(false);
  };

  const LEVELS: JapaneseLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'Business'];
  const ROLES: TargetRole[] = ['BrSE', 'Tester', 'Developer', 'BA', 'Project Assistant', 'Sale Support Japanese', 'Office Worker', 'Other'];

  return (
    <div className="mx-auto max-w-2xl space-y-12 py-12">
      <header className="space-y-4 border-b border-neutral-800 pb-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center bg-white text-black">
          <User size={40} />
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter">Candidate Profile</h1>
        <p className="label-caps text-neutral-500">Initialize Identity for Peer Matching</p>
      </header>

      <Card className="bg-neutral-900/30">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="label-caps">Display Name (Visible to others)</label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border-b border-neutral-800 bg-transparent py-4 text-xl font-bold text-white focus:border-white focus:outline-none"
              placeholder="Enter name..."
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <label className="label-caps">Japanese Level</label>
              <select
                value={japaneseLevel}
                onChange={(e) => setJapaneseLevel(e.target.value as JapaneseLevel)}
                className="w-full border-b border-neutral-800 bg-transparent py-4 font-bold text-white focus:border-white focus:outline-none"
              >
                {LEVELS.map(l => <option key={l} value={l} className="bg-neutral-900">{l}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="label-caps">Target Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as TargetRole)}
                className="w-full border-b border-neutral-800 bg-transparent py-4 font-bold text-white focus:border-white focus:outline-none"
              >
                {ROLES.map(r => <option key={r} value={r} className="bg-neutral-900">{r}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="label-caps">Interview Focus / Goal</label>
            <textarea
              value={interviewGoal}
              onChange={(e) => setInterviewGoal(e.target.value)}
              className="min-h-[100px] w-full border-b border-neutral-800 bg-transparent py-4 font-medium text-white focus:border-white focus:outline-none"
              placeholder="e.g. Self-introduction, project experience..."
            />
          </div>

          <div className="flex items-start space-x-3 bg-neutral-900/50 p-4 border border-neutral-800">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-1" />
            <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500 leading-tight">
              YOUR DATA WILL ONLY BE USED FOR MATCHING PURPOSES. REAL IDENTITY IS PROTECTED BY PSEUDONYMIZATION.
            </p>
          </div>

          <Button type="submit" className="w-full py-6" isLoading={isSaving}>
            Initialize Profile
          </Button>
        </form>
      </Card>
    </div>
  );
};
