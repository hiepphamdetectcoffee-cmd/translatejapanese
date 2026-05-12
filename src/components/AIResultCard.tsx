import React from 'react';
import { EvaluationResult } from '../types';
import { Card, Badge, Button } from './UI';
import { CheckCircle2, ChevronRight, Info, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AIResultCardProps {
  evaluation: EvaluationResult;
  onContinue: () => void;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({ evaluation, onContinue }) => {
  const scoreColor = evaluation.score >= 80 ? 'text-emerald-400' : evaluation.score >= 50 ? 'text-orange-400' : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col items-start justify-between border-b border-neutral-800 pb-8 md:flex-row md:items-end">
        <div className="space-y-2">
          <label className="label-caps">AI Feedback</label>
          <h2 className="text-4xl font-black text-white">{evaluation.overallComment}</h2>
        </div>
        <div className="mt-6 flex flex-col items-center md:mt-0">
          <span className={cn("text-8xl font-black leading-none tracking-tighter", scoreColor)}>{evaluation.score}</span>
          <span className="label-caps !tracking-[0.5em] opacity-30">Analysis Score</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4 border-none bg-neutral-900/40">
          <label className="label-caps text-blue-500">Logical Structure</label>
          <div className="space-y-4 text-sm leading-relaxed text-neutral-300">
            <p><span className="font-black uppercase tracking-tighter text-white">Accuracy:</span> {evaluation.accuracyFeedback}</p>
            <p><span className="font-black uppercase tracking-tighter text-white">Grammar:</span> {evaluation.grammarFeedback}</p>
          </div>
        </Card>

        <Card className="space-y-4 border-none bg-neutral-900/40">
          <label className="label-caps text-emerald-500">Stylistic Purity</label>
          <div className="space-y-4 text-sm leading-relaxed text-neutral-300">
            <p><span className="font-black uppercase tracking-tighter text-white">Vocab:</span> {evaluation.vocabularyFeedback}</p>
            <p><span className="font-black uppercase tracking-tighter text-white">Naturalness:</span> {evaluation.naturalnessFeedback}</p>
          </div>
        </Card>
      </div>

      <div className="border-l-4 border-emerald-500 bg-neutral-900/80 p-8">
        <label className="label-caps mb-4 block text-emerald-500">Suggested Improvement</label>
        <p className="text-2xl font-bold leading-tight italic text-white">
          "{evaluation.suggestedTranslation}"
        </p>
      </div>

      {evaluation.corrections?.length > 0 && (
        <div className="space-y-4">
          <label className="label-caps">Phase Breakdown</label>
          <div className="grid gap-4 md:grid-cols-2">
            {evaluation.corrections.map((correction, idx) => (
              <Card key={idx} className="space-y-3 bg-neutral-900/20">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-red-950/40 px-2 py-1 text-[10px] font-black text-red-500 line-through">
                    {correction.userPhrase}
                  </span>
                  <ChevronRight size={14} className="text-neutral-700" />
                  <span className="bg-emerald-950/40 px-2 py-1 text-[10px] font-black text-emerald-400">
                    {correction.betterPhrase}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-400">{correction.explanation}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {evaluation.explanation && (
        <div className="p-6 border border-neutral-800 bg-neutral-900/10">
          <label className="label-caps mb-2 block">Technical Analysis</label>
          <p className="text-sm leading-relaxed text-neutral-400">{evaluation.explanation}</p>
        </div>
      )}

      <div className="flex justify-center pt-8">
        <Button onClick={onContinue} size="lg" className="w-full">
          Proceed to Next Iteration
        </Button>
      </div>
    </motion.div>
  );
};
