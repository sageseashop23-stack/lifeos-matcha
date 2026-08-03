import React, { useState } from 'react';
import { 
  Sparkles, TrendingUp, BarChart3, PieChart, Activity, 
  Heart, Calendar as CalendarIcon, CheckCircle2, Shield, ArrowUpRight 
} from 'lucide-react';
import { 
  JournalEntry, ContentItem, SocialEvent, EvidenceDeliverable, 
  PeriodLog, CycleSettings 
} from '../types';

interface LookingBackModuleProps {
  journalEntries: JournalEntry[];
  contentItems: ContentItem[];
  socialEvents: SocialEvent[];
  evidenceDeliverables: EvidenceDeliverable[];
  periodLogs: PeriodLog[];
  cycleSettings: CycleSettings;
}

export default function LookingBackModule({
  journalEntries,
  contentItems,
  socialEvents,
  evidenceDeliverables,
  periodLogs,
  cycleSettings
}: LookingBackModuleProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30days' | '90days' | 'all'>('30days');

  // Dynamic date cutoff for timeframe selection
  const getCutoffDate = (days: number) => {
    const today = new Date();
    today.setDate(today.getDate() - days);
    return today.toISOString().split('T')[0];
  };

  const cutoffDate = selectedTimeframe === '30days' 
    ? getCutoffDate(30) 
    : selectedTimeframe === '90days' 
      ? getCutoffDate(90) 
      : '0000-00-00';

  const filteredJournalEntries = journalEntries.filter(item => item.date >= cutoffDate);
  const filteredContentItems = contentItems.filter(item => item.date >= cutoffDate);
  const filteredSocialEvents = socialEvents.filter(item => item.date >= cutoffDate);
  const filteredEvidenceDeliverables = evidenceDeliverables.filter(item => item.date >= cutoffDate);
  const filteredPeriodLogs = periodLogs.filter(item => item.date >= cutoffDate);

  // Mood Frequency Analysis
  const moodCounts: Record<string, number> = {};
  filteredJournalEntries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });

  const totalMoods = filteredJournalEntries.length || 1;
  const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
    mood,
    count,
    percentage: Math.round((count / totalMoods) * 100)
  })).sort((a, b) => b.count - a.count);

  // 3-Lens Life Distribution (Content, Social, Deliverables)
  const totalContent = filteredContentItems.length;
  const totalSocial = filteredSocialEvents.length;
  const totalCapacity = filteredEvidenceDeliverables.length;
  const totalEvents = (totalContent + totalSocial + totalCapacity) || 1;

  const contentPct = Math.round((totalContent / totalEvents) * 100);
  const socialPct = Math.round((totalSocial / totalEvents) * 100);
  const capacityPct = Math.round((totalCapacity / totalEvents) * 100);

  // Quality Standard Average
  const averageQuality = filteredEvidenceDeliverables.length > 0
    ? Math.round(filteredEvidenceDeliverables.reduce((acc, curr) => acc + curr.qualityScore, 0) / filteredEvidenceDeliverables.length)
    : 100;

  // Symptoms Frequency
  const symptomCounts: Record<string, number> = {};
  filteredPeriodLogs.forEach(log => {
    (log.symptoms || []).forEach(sym => {
      symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
    });
  });

  const sortedSymptoms = Object.entries(symptomCounts)
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-matcha-primary/20 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-matcha-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-matcha-primary text-white font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                Looking Back
              </span>
              <span className="text-xs text-[#5D524F]/60 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-matcha-primary animate-pulse" /> Interactive Analytics & Graphs
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-ink-dark font-display tracking-tight">
              Self-Reflection & Graph Analytics
            </h2>
            <p className="text-xs text-[#5D524F]/70">
              Correlate your moods, cycle health, social presence, and work capacity over time.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#FAF0EC]/60 border border-matcha-primary/10 rounded-2xl text-xs font-mono">
            <button
              onClick={() => setSelectedTimeframe('30days')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedTimeframe === '30days' ? 'bg-matcha-primary text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe('90days')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedTimeframe === '90days' ? 'bg-matcha-primary text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
              }`}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedTimeframe === 'all' ? 'bg-matcha-primary text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-matcha-primary/15 rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#5D524F]/70 text-xs font-mono">
            <span>Journal Reflections</span>
            <BarChart3 className="w-4 h-4 text-matcha-primary" />
          </div>
          <p className="text-2xl font-bold text-ink-dark font-display">{journalEntries.length}</p>
          <p className="text-[10px] text-matcha-primary font-mono flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Total logs recorded
          </p>
        </div>

        <div className="bg-white border border-matcha-primary/15 rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#5D524F]/70 text-xs font-mono">
            <span>Quality Standard</span>
            <Shield className="w-4 h-4 text-strawberry-accent" />
          </div>
          <p className="text-2xl font-bold text-strawberry-accent font-display">{averageQuality}%</p>
          <p className="text-[10px] text-[#5D524F]/60 font-mono">Average work reliability score</p>
        </div>

        <div className="bg-white border border-matcha-primary/15 rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#5D524F]/70 text-xs font-mono">
            <span>Capacity Built</span>
            <CheckCircle2 className="w-4 h-4 text-matcha-primary" />
          </div>
          <p className="text-2xl font-bold text-matcha-primary font-display">{totalCapacity} items</p>
          <p className="text-[10px] text-[#5D524F]/60 font-mono">Completed deliverables</p>
        </div>

        <div className="bg-white border border-matcha-primary/15 rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#5D524F]/70 text-xs font-mono">
            <span>Cycle Logs</span>
            <Heart className="w-4 h-4 text-strawberry-accent" />
          </div>
          <p className="text-2xl font-bold text-ink-dark font-display">{periodLogs.length}</p>
          <p className="text-[10px] text-[#5D524F]/60 font-mono">Hormonal & symptom points</p>
        </div>
      </div>

      {/* Main Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph 1: Mood Frequency Distribution */}
        <div className="lg:col-span-7 bg-white border border-matcha-primary/20 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-matcha-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-matcha-primary" />
              <h3 className="text-base font-bold text-ink-dark font-display">Mood Frequency & Distribution</h3>
            </div>
            <span className="text-[10px] font-mono bg-[#FAF0EC] px-2.5 py-1 rounded-full text-[#5D524F]">
              {journalEntries.length} total entries
            </span>
          </div>

          {/* Stacked Percentage Bar Graph */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-[#5D524F]/70">
              <span>Overall Mood Spectrum</span>
              <span>100% Total</span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-[#EAE0DC] border border-matcha-primary/10 shadow-inner">
              {moodDistribution.map(({ mood, percentage }, idx) => (
                <div
                  key={mood}
                  style={{ width: `${percentage}%` }}
                  className={`h-full ${
                    idx % 3 === 0 ? 'bg-matcha-primary' : idx % 3 === 1 ? 'bg-strawberry-accent' : 'bg-amber-400'
                  } border-r border-white/20 transition-all duration-500`}
                  title={`${mood}: ${percentage}%`}
                />
              ))}
            </div>
          </div>

          {/* Detailed Bar Breakdown */}
          <div className="space-y-2.5 pt-2">
            {moodDistribution.length === 0 ? (
              <p className="text-xs text-center py-6 text-[#5D524F]/50 font-mono">No mood entries logged yet.</p>
            ) : (
              moodDistribution.map(({ mood, count, percentage }) => (
                <div key={mood} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#5D524F]">{mood}</span>
                    <span className="font-mono text-xs text-[#5D524F]/80 font-bold">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-[#FAF0EC] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-matcha-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Graph 2: 3-Lens Life Balance Distribution */}
        <div className="lg:col-span-5 bg-white border border-matcha-primary/20 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-matcha-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4.5 h-4.5 text-matcha-primary" />
              <h3 className="text-base font-bold text-ink-dark font-display">3-Lens Life Ratio</h3>
            </div>
            <span className="text-[10px] font-mono bg-[#FAF0EC] px-2.5 py-1 rounded-full text-[#5D524F]">
              {totalEvents} total items
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {/* Visual Balance Bar */}
            <div className="w-full h-5 rounded-2xl overflow-hidden flex shadow-inner border border-matcha-primary/10">
              <div style={{ width: `${contentPct}%` }} className="bg-matcha-primary h-full" title={`Content: ${contentPct}%`} />
              <div style={{ width: `${socialPct}%` }} className="bg-strawberry-accent h-full" title={`Social: ${socialPct}%`} />
              <div style={{ width: `${capacityPct}%` }} className="bg-amber-400 h-full" title={`Capacity: ${capacityPct}%`} />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-[#FAF0EC]/30 rounded-2xl border border-matcha-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-matcha-primary" />
                  <span className="text-xs font-semibold text-[#5D524F]">📹 Content Creation</span>
                </div>
                <span className="text-xs font-mono font-bold text-matcha-primary">{totalContent} items ({contentPct}%)</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FAF0EC]/30 rounded-2xl border border-matcha-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-strawberry-accent" />
                  <span className="text-xs font-semibold text-[#5D524F]">🤝 Social Connections</span>
                </div>
                <span className="text-xs font-mono font-bold text-strawberry-accent">{totalSocial} items ({socialPct}%)</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FAF0EC]/30 rounded-2xl border border-matcha-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-xs font-semibold text-[#5D524F]">📈 Work Capacity</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600">{totalCapacity} items ({capacityPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graph 3: Cycle & Symptom Health Correlation */}
        <div className="lg:col-span-12 bg-white border border-matcha-primary/20 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-matcha-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-strawberry-accent" />
              <h3 className="text-base font-bold text-ink-dark font-display">Cycle & Symptom Correlation Graph</h3>
            </div>
            <span className="text-[10px] font-mono bg-strawberry-accent/10 text-strawberry-accent px-2.5 py-1 rounded-full font-bold">
              {periodLogs.length} cycle logs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D524F]/70">
                Most Frequent Symptoms
              </h4>
              {sortedSymptoms.length === 0 ? (
                <p className="text-xs text-[#5D524F]/50 font-mono">No symptom data logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {sortedSymptoms.slice(0, 5).map(({ symptom, count }) => {
                    const pct = Math.round((count / (periodLogs.length || 1)) * 100);
                    return (
                      <div key={symptom} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#5D524F]">{symptom}</span>
                          <span className="font-mono text-[#5D524F]/70">{count} times ({pct}%)</span>
                        </div>
                        <div className="w-full bg-[#FAF0EC] h-2 rounded-full overflow-hidden">
                          <div className="bg-strawberry-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#FAF0EC]/30 border border-matcha-primary/10 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-matcha-primary">Cycle Parameters</span>
                <p className="text-sm font-bold text-ink-dark font-display">Estimated Cycle Summary</p>
                <p className="text-xs text-[#5D524F]/70 leading-relaxed">
                  Average Cycle Length: <strong className="text-ink-dark">{cycleSettings.cycleLength} days</strong>.
                  Average Period Length: <strong className="text-ink-dark">{cycleSettings.periodLength} days</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-matcha-primary/10 flex justify-between items-center text-xs font-mono text-[#5D524F]/70">
                <span>Last Period Start:</span>
                <span className="font-bold text-matcha-primary">{cycleSettings.lastPeriodDate || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
