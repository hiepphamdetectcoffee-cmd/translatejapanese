import React, { useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Card, Badge } from '../components/UI';
import { LayoutDashboard, TrendingUp, Target, Award, Clock, Star, Languages, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const DashboardPage: React.FC = () => {
  const history = useMemo(() => storageService.getHistory(), []);

  const stats = useMemo(() => {
    const total = history.length;
    if (total === 0) return null;

    const avgScore = Math.round(history.reduce((acc, curr) => acc + curr.evaluation.score, 0) / total);
    const jaToVi = history.filter(h => h.direction === 'JA_TO_VI').length;
    const viToJa = history.filter(h => h.direction === 'VI_TO_JA').length;
    const favorites = history.filter(h => h.isFavorite).length;

    const topicStats = history.reduce((acc: any, curr) => {
      acc[curr.topic] = (acc[curr.topic] || 0) + 1;
      return acc;
    }, {});

    const topicChartData = Object.keys(topicStats).map(topic => ({
      name: topic,
      count: topicStats[topic]
    })).sort((a, b) => b.count - a.count);

    return { total, avgScore, jaToVi, viToJa, favorites, topicChartData };
  }, [history]);

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="bg-neutral-900 border border-neutral-800 p-8">
          <LayoutDashboard size={48} className="text-neutral-700" />
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Initialize Practice</h2>
        <p className="label-caps !text-neutral-600">Phase 0: No binary history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-2 border-b border-neutral-800 pb-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter">Performance</h1>
        <p className="label-caps text-neutral-500">Real-time Analytics & Growth</p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Target} color="white" label="Evaluations" value={stats.total} />
        <StatCard icon={Award} color="emerald" label="Avg Accuracy" value={`${stats.avgScore}%`} />
        <StatCard icon={Star} color="orange" label="Starred" value={stats.favorites} />
        <StatCard icon={BarChart2} color="blue" label="Sessions" value={Math.ceil(stats.total / 5)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="space-y-8 bg-neutral-900/30 border-neutral-800">
          <div className="flex items-center justify-between">
            <label className="label-caps">Topic Distribution</label>
            <BarChart2 size={16} className="text-neutral-700" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topicChartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#171717" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252', fontWeight: 900, textTransform: 'uppercase' }} />
                <Tooltip 
                  cursor={{ fill: '#171717' }} 
                  contentStyle={{ backgroundColor: '#000', borderRadius: '0px', border: '1px solid #262626', color: '#fff' }} 
                />
                <Bar dataKey="count" radius={[0, 0, 0, 0]} barSize={16}>
                  {stats.topicChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#262626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col justify-between bg-neutral-900/30 border-neutral-800">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <label className="label-caps">Directional Load</label>
              <Languages size={16} className="text-neutral-700" />
            </div>
            
            <div className="space-y-8 py-4">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-neutral-400">JP ➔ VI</span>
                  <span className="text-2xl font-black text-white">{stats.jaToVi}</span>
                </div>
                <div className="h-1 w-full bg-neutral-800">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-1000" 
                    style={{ width: `${(stats.jaToVi / stats.total) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-neutral-400">VI ➔ JP</span>
                  <span className="text-2xl font-black text-neutral-500">{stats.viToJa}</span>
                </div>
                <div className="h-1 w-full bg-neutral-800">
                  <div 
                    className="h-full bg-neutral-600 transition-all duration-1000" 
                    style={{ width: `${(stats.viToJa / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-neutral-800 pt-6 text-center">
            <p className="label-caps !text-neutral-600 mb-1 leading-none">Primary Focus</p>
            <p className="text-2xl font-black text-white uppercase tracking-tighter">{stats.topicChartData[0]?.name || 'N/A'}</p>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <label className="label-caps">Recent Operations</label>
        <div className="grid gap-px bg-neutral-800 border border-neutral-800">
          {history.slice(0, 3).map(item => (
            <div key={item.id} className="bg-neutral-950 p-6 flex items-center justify-between hover:bg-neutral-900 transition-colors">
              <div className="flex items-center space-x-6">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center text-xl font-black",
                  item.evaluation.score >= 80 ? "bg-emerald-400 text-black" : "bg-neutral-800 text-white"
                )}>
                  {item.evaluation.score}
                </div>
                <div>
                  <p className="line-clamp-1 text-lg font-bold text-white">{item.sourceSentence}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{format(item.timestamp, 'MMM d, HH:mm')}</p>
                </div>
              </div>
              <Badge color="neutral">{item.topic}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, color, label, value }: any) => {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    white: 'text-white',
  };
  return (
    <Card className="flex flex-col items-center justify-center space-y-2 py-8 bg-neutral-900/20 border-neutral-800 transition-transform active:scale-95">
      <span className="label-caps !text-neutral-600">{label}</span>
      <span className={cn("text-4xl font-black tracking-tighter leading-none", colors[color] || 'text-white')}>{value}</span>
    </Card>
  );
};
