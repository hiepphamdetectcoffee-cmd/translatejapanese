import React, { useState, useEffect, useMemo } from 'react';
import { PracticeHistory, TranslationDirection, Topic, Difficulty } from '../types';
import { storageService } from '../services/storageService';
import { DIRECTIONS, TOPICS, DIFFICULTIES } from '../constants';
import { Card, Button, Badge } from '../components/UI';
import { Search, Filter, Heart, Trash2, ChevronRight, Calendar, Bookmark, SortAsc, SortDesc, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AIResultCard } from '../components/AIResultCard';

export const LibraryPage: React.FC = () => {
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterSourceType, setFilterSourceType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PracticeHistory | null>(null);

  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

  const batches = useMemo(() => {
    const batchMap = new Map<string, { id: string; timestamp: number; items: PracticeHistory[]; avgScore: number }>();
    history.forEach(item => {
      if (item.sourceType === 'batch' && item.batchId) {
        if (!batchMap.has(item.batchId)) {
          batchMap.set(item.batchId, { id: item.batchId, timestamp: item.timestamp, items: [], avgScore: 0 });
        }
        batchMap.get(item.batchId)!.items.push(item);
      }
    });

    batchMap.forEach(batch => {
      batch.avgScore = Math.round(batch.items.reduce((acc, curr) => acc + curr.evaluation.score, 0) / batch.items.length);
    });

    return Array.from(batchMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (filterSourceType === 'batch') return []; // We handle batches separately

    return history.filter(item => {
      const matchesSearch = 
        item.sourceSentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userTranslation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDirection = filterDirection === 'all' || item.direction === filterDirection;
      const matchesTopic = filterTopic === 'all' || item.topic === filterTopic;
      const matchesDifficulty = filterDifficulty === 'all' || item.difficulty === filterDifficulty;
      
      let matchesSourceType = true;
      if (filterSourceType === 'single') {
        matchesSourceType = item.sourceType === 'ai' || item.sourceType === 'manual' || !item.sourceType;
      } else if (filterSourceType === 'image') {
        matchesSourceType = item.sourceType === 'image';
      } else if (filterSourceType !== 'all') {
        matchesSourceType = item.sourceType === filterSourceType;
      }

      // If viewing "all", we might want to hide internal batch items to avoid clutter? 
      // The user said "filter", so if 'all' is selected, show everything.
      
      return matchesSearch && matchesDirection && matchesTopic && matchesDifficulty && matchesSourceType;
    });
  }, [history, searchTerm, filterDirection, filterTopic, filterDifficulty, filterSourceType]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this translation?')) {
      storageService.deleteHistoryItem(id);
      setHistory(storageService.getHistory());
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.toggleFavorite(id);
    setHistory(storageService.getHistory());
  };

  if (selectedItem) {
    return (
      <div className="space-y-12">
        <div className="flex items-center space-x-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)} className="h-10 w-10 !p-0">
            <ChevronRight size={20} className="rotate-180" />
          </Button>
          <div className="space-y-1">
            <label className="label-caps">Archives</label>
            <h1 className="text-4xl font-black text-white">Entry Analysis</h1>
          </div>
        </div>
        
        <Card className="bg-neutral-900/50">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-3">
              <Badge color="orange">{selectedItem.direction === 'JA_TO_VI' ? '🇯🇵 ➔ 🇻🇳' : '🇻🇳 ➔ 🇯🇵'}</Badge>
              <Badge color="blue">{selectedItem.topic}</Badge>
              <Badge color="neutral">{selectedItem.difficulty}</Badge>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="label-caps text-neutral-600">Stimulus</label>
                <p className="text-2xl font-bold leading-tight text-white">{selectedItem.sourceSentence}</p>
              </div>
              <div className="space-y-3">
                <label className="label-caps text-neutral-600">User Input</label>
                <p className="text-2xl font-bold leading-tight text-neutral-400">{selectedItem.userTranslation}</p>
              </div>
            </div>
          </div>
        </Card>

        <AIResultCard evaluation={selectedItem.evaluation} onContinue={() => setSelectedItem(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-2 border-b border-neutral-800 pb-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter">Library</h1>
        <p className="label-caps text-neutral-500">Historical Translation Records</p>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-600" size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-b border-neutral-800 bg-transparent py-4 pl-12 text-sm font-bold placeholder:text-neutral-700 focus:border-white focus:outline-none"
          />
        </div>

        <select
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
          className="border-b border-neutral-800 bg-transparent py-4 text-[10px] font-black uppercase tracking-widest focus:border-white focus:outline-none"
        >
          <option value="all" className="bg-neutral-900">All Directions</option>
          {DIRECTIONS.map(d => <option key={d.value} value={d.value} className="bg-neutral-900">{d.label}</option>)}
        </select>
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="border-b border-neutral-800 bg-transparent py-4 text-[10px] font-black uppercase tracking-widest focus:border-white focus:outline-none"
        >
          <option value="all" className="bg-neutral-900">All Topics</option>
          {TOPICS.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="border-b border-neutral-800 bg-transparent py-4 text-[10px] font-black uppercase tracking-widest focus:border-white focus:outline-none"
        >
          <option value="all" className="bg-neutral-900">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-neutral-900">{d}</option>)}
        </select>
        <select
          value={filterSourceType}
          onChange={(e) => setFilterSourceType(e.target.value)}
          className="border-b border-neutral-800 bg-transparent py-4 text-[10px] font-black uppercase tracking-widest focus:border-white focus:outline-none"
        >
          <option value="all" className="bg-neutral-900">All Sources</option>
          <option value="single" className="bg-neutral-900">Single Practice</option>
          <option value="batch" className="bg-neutral-900">Batch Practice</option>
          <option value="image" className="bg-neutral-900">Image Scan</option>
        </select>
      </div>

      <div className="grid gap-px bg-neutral-800">
        <AnimatePresence>
          {filterSourceType === 'batch' ? (
            batches.length > 0 ? (
              batches.map((batch) => (
                <motion.div
                  key={batch.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-neutral-950 p-8 transition-colors hover:bg-neutral-900"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex w-24 shrink-0 flex-col md:items-center">
                      <span className={cn(
                        "text-4xl font-black tracking-tighter",
                        batch.avgScore >= 80 ? 'text-emerald-400' : batch.avgScore >= 50 ? 'text-orange-400' : 'text-red-500'
                      )}>
                        {batch.avgScore}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600">Avg Score</span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-3">
                        <Badge color="emerald">BATCH</Badge>
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{format(batch.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <p className="text-xl font-bold text-white">Batch Practiced: {batch.items.length} sentences</p>
                      <div className="flex gap-2">
                        {batch.items?.map((item, idx) => (
                           <div key={item.id} className="h-1 w-8 bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all",
                                  item.evaluation.score >= 80 ? 'bg-emerald-500' : item.evaluation.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                )} 
                                style={{ width: `${item.evaluation.score}%` }} 
                              />
                           </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-black uppercase"
                        onClick={() => {
                          setFilterSourceType('all');
                          setSearchTerm(batch.id); // Search by ID to show all items in this batch
                        }}
                      >
                        View All
                      </Button>
                      <button 
                         onClick={(e) => {
                           if (confirm('Delete entire batch?')) {
                             batch.items.forEach(item => storageService.deleteHistoryItem(item.id));
                             setHistory(storageService.getHistory());
                           }
                         }}
                         className="text-neutral-700 transition-colors hover:text-white"
                      >
                        <Trash2 size={20} />
                      </button>
                      <ChevronRight className="text-neutral-800" size={24} />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-32 bg-neutral-950 text-neutral-700">
                <Layers size={64} strokeWidth={1} />
                <p className="label-caps">No Batches Found</p>
              </div>
            )
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(item)}
                className="group relative cursor-pointer bg-neutral-950 p-8 transition-colors hover:bg-neutral-900"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex w-24 shrink-0 flex-col md:items-center">
                    <span className={cn(
                      "text-4xl font-black tracking-tighter",
                      item.evaluation.score >= 80 ? 'text-emerald-400' : item.evaluation.score >= 50 ? 'text-orange-400' : 'text-red-500'
                    )}>
                      {item.evaluation.score}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600">Points</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-3">
                      <Badge color="neutral">{item.topic}</Badge>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{format(item.timestamp, 'MMM dd')}</span>
                    </div>
                    <p className="line-clamp-1 text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{item.sourceSentence}</p>
                    <p className="line-clamp-1 text-sm text-neutral-500 italic">"{item.userTranslation}"</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      className={cn(
                        "transition-all duration-300",
                        item.isFavorite ? "text-red-500 scale-125" : "text-neutral-700 hover:text-red-500"
                      )}
                    >
                      <Heart size={20} fill={item.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button 
                       onClick={(e) => handleDelete(item.id, e)}
                       className="text-neutral-700 transition-colors hover:text-white"
                    >
                      <Trash2 size={20} />
                    </button>
                    <ChevronRight className="text-neutral-800" size={24} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-32 bg-neutral-950 text-neutral-700">
              <Bookmark size={64} strokeWidth={1} />
              <p className="label-caps">Database Empty</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
