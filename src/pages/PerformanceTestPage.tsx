import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Users, Clock, AlertCircle, Play, 
  Square, Download, Trash2, CheckCircle2, 
  BarChart3, TrendingUp, ShieldAlert, Database,
  ArrowRight
} from 'lucide-react';
import { testService } from '../services/testService';
import { storageService } from '../services/storageService';
import { PerformanceMetrics, LatencyMetric, SimulationOptions, SpeakingPrompt } from '../types';
import { cn } from '../lib/utils';
import { Button, Card, Badge } from '../components/UI';

export const PerformanceTestPage = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [logs, setLogs] = useState<LatencyMetric[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [simulationOptions, setSimulationOptions] = useState<SimulationOptions>({
    virtualUsers: 50,
    durationSeconds: 60,
    actions: ['generatePrompt', 'mockSpeechToText', 'mockAIFeedback', 'saveHistory', 'openHistory'],
    useMockAI: true,
  });
  const [testPrompts, setTestPrompts] = useState<SpeakingPrompt[]>([]);
  const [realApiWarning, setRealApiWarning] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleStartTest = () => {
    if (!simulationOptions.useMockAI) {
      if (!realApiWarning) {
        setRealApiWarning(true);
        return;
      }
    }
    
    setLogs([]);
    setIsTestRunning(true);
    testService.runUserSimulation(
        simulationOptions,
        (updatedMetrics) => setMetrics(updatedMetrics),
        (log) => setLogs(prev => [...prev.slice(-49), log]) // Keep last 50 logs for performance
    );
  };

  const handleStopTest = () => {
    setIsTestRunning(false);
    // Note: The actual simulation stop is handled by the timeout or external flag in testService
    // but we update UI immediately.
  };

  const handleGeneratePrompts = () => {
    const prompts = testService.generateTestSpeakingPrompts(100);
    setTestPrompts(prompts);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all speaking history and test logs?')) {
      storageService.clearHistory(); // This will clear ALL, maybe we need a dedicated speaking clear
      // Actually storageService.clearHistory clears STORAGE_KEY, not SPEAKING_HISTORY_KEY.
      // Let's assume we want to clear speaking too.
      localStorage.removeItem('speaking_history');
      setLogs([]);
      setMetrics(null);
      setTestPrompts([]);
    }
  };

  const handleExportReport = () => {
    if (!metrics) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `performance_report_${metrics.testId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getPromptStats = () => {
    const total = testPrompts.length;
    if (total === 0) return null;
    
    const viToJp = testPrompts.filter(p => p.mode === 'VI_TO_JP_SPEAKING').length;
    const jpToJp = testPrompts.filter(p => p.mode === 'JP_TO_JP_SHADOWING').length;
    
    const byTopic = testPrompts.reduce((acc, p) => {
        acc[p.topic] = (acc[p.topic] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const byDifficulty = testPrompts.reduce((acc, p) => {
        acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return { total, viToJp, jpToJp, byTopic, byDifficulty };
  };

  const stats = getPromptStats();

  return (
    <div className="min-h-screen bg-[#FFF8EF] text-[#263238] space-y-12 pb-24 font-sans">
      <header className="space-y-4 border-b border-[#F0E6DA] pb-8 px-4 sm:px-8 pt-8 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-[#263238] flex items-center gap-3">
              <ShieldAlert className="text-[#FF8A80]" size={40} />
              Performance Laboratory
            </h1>
            <p className="label-caps !text-[#607D8B]">Developer Mode / Stress Testing & Metrics</p>
          </div>
          <div className="flex gap-3">
             <Button 
               variant="ghost" 
               className="!text-[#90A4AE] hover:!text-[#263238]"
               onClick={handleClearData}
             >
                <Trash2 size={18} className="mr-2" /> Clear All Data
             </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-8">
            {/* Control Panel */}
            <div className="lg:col-span-4 space-y-8">
                <Card className="bg-white p-8 border-[#F0E6DA] shadow-sm rounded-2xl space-y-6">
                    <h2 className="label-caps !text-[#263238] border-b border-[#F0E6DA] pb-2">Simulation Configuration</h2>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-[#90A4AE] flex items-center justify-between">
                                Virtual Users
                                <span className="text-[#4CAF8F]">{simulationOptions.virtualUsers}</span>
                            </label>
                            <input 
                                type="range" 
                                min="1" max="1000" step="10"
                                value={simulationOptions.virtualUsers}
                                onChange={(e) => setSimulationOptions(prev => ({ ...prev, virtualUsers: parseInt(e.target.value) }))}
                                className="w-full accent-[#4CAF8F]"
                            />
                            <div className="flex justify-between text-[10px] text-[#B0BEC5] font-bold">
                                <span>1</span>
                                <span>1000+</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-[#90A4AE] flex items-center justify-between">
                                Duration (Seconds)
                                <span className="text-[#4CAF8F]">{simulationOptions.durationSeconds}s</span>
                            </label>
                            <input 
                                type="range" 
                                min="30" max="600" step="30"
                                value={simulationOptions.durationSeconds}
                                onChange={(e) => setSimulationOptions(prev => ({ ...prev, durationSeconds: parseInt(e.target.value) }))}
                                className="w-full accent-[#4CAF8F]"
                            />
                        </div>

                        <div className="pt-4 space-y-4">
                             <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="mockAi"
                                    checked={simulationOptions.useMockAI}
                                    onChange={(e) => {
                                        setSimulationOptions(prev => ({ ...prev, useMockAI: e.target.checked }));
                                        setRealApiWarning(false);
                                    }}
                                    className="w-4 h-4 accent-[#4CAF8F]"
                                />
                                <label htmlFor="mockAi" className="text-sm font-bold text-[#263238] cursor-pointer">
                                    Simulate Mock AI Results
                                </label>
                             </div>
                             
                             <AnimatePresence>
                                {realApiWarning && !simulationOptions.useMockAI && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-[#FFF0F0] border border-[#FF8A80]/20 p-4 rounded-xl text-xs text-[#FF8A80] font-medium"
                                    >
                                        <AlertCircle className="inline-block mr-2" size={14} />
                                        Warning: Real API mode will consume credits and may trigger rate limits under high load.
                                        <button 
                                            onClick={handleStartTest}
                                            className="block mt-2 font-black underline hover:text-[#FF5252]"
                                        >
                                            Confirm and Proceed with Real API
                                        </button>
                                    </motion.div>
                                )}
                             </AnimatePresence>
                        </div>
                    </div>

                    <div className="pt-6">
                        {!isTestRunning ? (
                            <Button 
                                className="w-full py-4 !bg-[#4CAF8F] !text-white hover:!bg-[#3E9B7D] !rounded-full shadow-lg"
                                onClick={handleStartTest}
                            >
                                <Play className="mr-2" size={18} /> Start Simulation
                            </Button>
                        ) : (
                            <Button 
                                className="w-full py-4 !bg-[#FF8A80] !text-white hover:!bg-[#FF5252] !rounded-full shadow-lg"
                                onClick={handleStopTest}
                            >
                                <Square className="mr-2" size={18} /> Stop Simulation
                            </Button>
                        )}
                    </div>
                </Card>

                <Card className="bg-white p-8 border-[#F0E6DA] shadow-sm rounded-2xl space-y-6">
                    <h2 className="label-caps !text-[#263238] border-b border-[#F0E6DA] pb-2">Test Data Management</h2>
                    
                    <div className="space-y-4">
                        <Button 
                            variant="ghost" 
                            className="w-full !bg-[#EAF4FF] !text-[#6FA8DC] hover:!bg-[#D0E5F8] !rounded-xl"
                            onClick={handleGeneratePrompts}
                        >
                            Generate 100 Test Prompts
                        </Button>

                        {stats && (
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#F8FAF5] p-3 rounded-xl border border-[#F0E6DA]">
                                        <p className="text-[10px] font-black uppercase text-[#90A4AE]">Prompts</p>
                                        <p className="text-xl font-black text-[#4CAF8F]">{stats.total}</p>
                                    </div>
                                    <div className="bg-[#F8FAF5] p-3 rounded-xl border border-[#F0E6DA]">
                                        <p className="text-[10px] font-black uppercase text-[#90A4AE]">Translate</p>
                                        <p className="text-xl font-black text-[#4CAF8F]">{stats.viToJp}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-[#90A4AE] mb-1">By Topic</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(stats.byTopic).map(([topic, count]) => (
                                            <Badge key={topic} color="neutral" className="text-[9px] !bg-white !border-[#F0E6DA]">
                                                {topic}: {count}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-[#90A4AE] mb-1">By Difficulty</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(stats.byDifficulty).map(([level, count]) => (
                                            <Badge key={level} color="neutral" className="text-[9px] !bg-white !border-[#F0E6DA]">
                                                {level}: {count}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Dashboard Content */}
            <div className="lg:col-span-8 space-y-8">
                {/* Real-time Metrics Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard 
                        icon={<Activity className="text-[#4CAF8F]" />} 
                        label="Total Actions" 
                        value={metrics?.totalActions || 0} 
                        subLabel="Completed"
                    />
                    <MetricCard 
                        icon={<TrendingUp className="text-[#6FA8DC]" />} 
                        label="Avg Latency" 
                        value={metrics?.averageLatencyMs.toFixed(0) || 0} 
                        unit="ms"
                        subLabel="Network/Service"
                    />
                    <MetricCard 
                        icon={<Clock className="text-[#FFB86B]" />} 
                        label="P95 Latency" 
                        value={metrics?.p95LatencyMs.toFixed(0) || 0} 
                        unit="ms"
                        subLabel="Tail Latency"
                    />
                    <MetricCard 
                        icon={<CheckCircle2 className="text-[#8BC34A]" />} 
                        label="Success Rate" 
                        value={metrics ? ((metrics.successfulActions / metrics.totalActions) * 100 || 0).toFixed(1) : 0} 
                        unit="%"
                        subLabel="Availability"
                    />
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Live Stream / Logs */}
                    <Card className="lg:col-span-12 bg-white p-8 border-[#F0E6DA] shadow-sm rounded-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="label-caps !text-[#263238] flex items-center gap-2">
                                <Database size={16} /> Virtual Session Stream
                            </h2>
                            <div className="flex items-center gap-2">
                                {isTestRunning && <span className="flex h-2 w-2 rounded-full bg-[#FF8A80] animate-pulse" />}
                                <span className="text-[10px] font-black uppercase text-[#90A4AE]">
                                    {isTestRunning ? 'Live Activity' : 'History Log'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#F8FAF5] rounded-xl overflow-hidden border border-[#F0E6DA]">
                            <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
                                {logs.length === 0 ? (
                                    <div className="text-[#B0BEC5] italic text-center py-10">
                                        Waiting for simulation event data...
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-[#F0E6DA]/50 pb-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[#90A4AE]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                <span className="font-bold text-[#263238] uppercase min-w-[120px]">{log.action}</span>
                                                <Badge className={cn(
                                                    "!text-[9px] px-2",
                                                    log.success ? "!bg-[#E7F6F0] !text-[#4CAF8F]" : "!bg-[#FFF0F0] !text-[#FF8A80]"
                                                )}>
                                                    {log.success ? 'SUCCESS' : 'FAILED'}
                                                </Badge>
                                            </div>
                                            <div className="font-bold text-[#607D8B]">
                                                {log.latency}ms
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={logEndRef} />
                            </div>
                        </div>
                    </Card>

                    {/* Recommendations & Detailed Stats */}
                    {metrics && (
                        <Card className="lg:col-span-12 bg-white p-8 border-[#F0E6DA] shadow-sm rounded-2xl space-y-8">
                            <div className="flex items-center justify-between border-b border-[#F0E6DA] pb-4">
                                <h3 className="label-caps !text-[#263238] flex items-center gap-2">
                                    <BarChart3 size={18} /> Performance Analysis Report
                                </h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="!bg-[#EAF4FF] !text-[#6FA8DC] !rounded-xl"
                                    onClick={handleExportReport}
                                >
                                    <Download size={14} className="mr-2" /> Export JSON
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase text-[#90A4AE]">Metrics breakdown</h4>
                                    <div className="grid gap-4">
                                        <StatRow label="P99 Latency" value={`${metrics.p99LatencyMs.toFixed(0)} ms`} />
                                        <StatRow label="Max Latency" value={`${metrics.maxLatencyMs.toFixed(0)} ms`} />
                                        <StatRow label="Simulated Duration" value={`${(metrics.durationSeconds / 60).toFixed(1)} min`} />
                                        <StatRow label="Active Virtual Users" value={metrics.virtualUsers.toString()} />
                                        <StatRow label="Requests Per Sec (Avg)" value={(metrics.totalActions / simulationOptions.durationSeconds).toFixed(2)} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase text-[#90A4AE]">Recommendations</h4>
                                    <div className="space-y-3">
                                        {metrics.recommendations?.length > 0 ? (
                                            metrics.recommendations.map((rec, i) => (
                                                <div key={i} className="flex gap-3 bg-[#FFF8EF] p-4 rounded-xl border border-[#FFB86B]/20 text-xs font-medium text-[#263238]">
                                                    <ArrowRight size={14} className="text-[#FFB86B] shrink-0 mt-0.5" />
                                                    {rec}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-[#E7F6F0] p-4 rounded-xl text-xs text-[#4CAF8F] font-bold flex items-center gap-2">
                                                <CheckCircle2 size={16} />
                                                All systems performing within nominal parameters.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {metrics.errors?.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase text-[#FF8A80]">Incident Log (Last 10 Errors)</h4>
                                    <div className="space-y-2">
                                        {metrics.errors.slice(-10).map((err, i) => (
                                            <div key={i} className="p-3 bg-[#FFF0F0] text-[#FF8A80] text-[10px] font-mono rounded-lg border border-[#FF8A80]/10">
                                                {err}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, unit = '', subLabel }: { icon: React.ReactNode; label: string; value: string | number; unit?: string; subLabel: string }) => (
    <Card className="bg-white p-6 border-[#F0E6DA] shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-[#F8FAF5] rounded-xl border border-[#F0E6DA]">
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase text-[#B0BEC5]">{unit}</span>
        </div>
        <p className="text-[10px] font-black uppercase text-[#90A4AE] tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-[#263238] tracking-tighter">
            {value}
        </p>
        <p className="text-[8px] font-bold text-[#B0BEC5] uppercase mt-2">{subLabel}</p>
    </Card>
);

const StatRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-[#F0E6DA]/50">
        <span className="text-xs font-bold text-[#607D8B]">{label}</span>
        <span className="text-sm font-black text-[#263238]">{value}</span>
    </div>
);
