import React, { useState, useMemo } from 'react';
import { 
  Sparkles, TrendingUp, BarChart3, PieChart, Activity, 
  Heart, Calendar as CalendarIcon, CheckCircle2, Shield, ArrowUpRight,
  Flame, Zap, Grid, Award, Clock, Info, ChevronLeft, ChevronRight, Check,
  GripVertical, ArrowUp, ArrowDown, RotateCcw, SlidersHorizontal
} from 'lucide-react';
import { 
  JournalEntry, ContentItem, SocialEvent, EvidenceDeliverable, 
  PeriodLog, CycleSettings 
} from '../types';
import CycleHeatmapMatrix from './CycleHeatmapMatrix';

export type LookingBackWidgetId = 'contrib-grid' | 'weekly-rhythm' | 'mood-distribution' | 'three-lens-ratio' | 'cycle-heatmap';

export const LOOKINGBACK_WIDGET_META: Record<LookingBackWidgetId, { label: string; emoji: string; shortDesc: string }> = {
  'contrib-grid': { label: '52-Week Year in Review', emoji: '📅', shortDesc: 'Consistency & activity contribution grid' },
  'weekly-rhythm': { label: 'Weekly Rhythm Heatmap', emoji: '⚡', shortDesc: '7×5 Dimension heatmap by day of week' },
  'mood-distribution': { label: 'Mood Frequency & Distribution', emoji: '🎭', shortDesc: 'Overall mood spectrum breakdown' },
  'three-lens-ratio': { label: '3-Lens Life Ratio', emoji: '🎯', shortDesc: 'Content, Social & Deliverables balance' },
  'cycle-heatmap': { label: 'Cycle & Symptom Heatmap Matrix', emoji: '🩸', shortDesc: '28-35 day biological phase rhythm' },
};

const DEFAULT_LOOKINGBACK_ORDER: LookingBackWidgetId[] = [
  'contrib-grid',
  'weekly-rhythm',
  'mood-distribution',
  'three-lens-ratio',
  'cycle-heatmap'
];

const MOOD_INTENSITIES: Record<string, number> = {
  '🌸 Serene': 7,
  '⚡ Focused': 8,
  '🔋 Energetic': 10,
  '📝 Grateful': 8,
  '😴 Tired': 3,
  '💭 Reflective': 6,
  '🌱 Growing': 9,
};

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30days' | '90days' | 'all'>('all');

  // Dashboard Sections Reordering & Custom Layout State
  const [widgetOrder, setWidgetOrder] = useState<LookingBackWidgetId[]>(() => {
    try {
      const saved = localStorage.getItem('lifeos_lookingback_widget_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_LOOKINGBACK_ORDER.length && DEFAULT_LOOKINGBACK_ORDER.every(id => parsed.includes(id))) {
          return parsed as LookingBackWidgetId[];
        }
      }
    } catch (e) {}
    return DEFAULT_LOOKINGBACK_ORDER;
  });

  const [isCustomizeLayoutOpen, setIsCustomizeLayoutOpen] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<LookingBackWidgetId | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<LookingBackWidgetId | null>(null);

  const handleMoveWidget = (id: LookingBackWidgetId, direction: 'up' | 'down') => {
    setWidgetOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      try {
        localStorage.setItem('lifeos_lookingback_widget_order', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleMoveToPosition = (id: LookingBackWidgetId, targetIndex: number) => {
    setWidgetOrder(prev => {
      const fromIdx = prev.indexOf(id);
      if (fromIdx === -1 || targetIndex < 0 || targetIndex >= prev.length || fromIdx === targetIndex) return prev;
      const next = [...prev];
      next.splice(fromIdx, 1);
      next.splice(targetIndex, 0, id);
      try {
        localStorage.setItem('lifeos_lookingback_widget_order', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetOrder = () => {
    setWidgetOrder(DEFAULT_LOOKINGBACK_ORDER);
    try {
      localStorage.removeItem('lifeos_lookingback_widget_order');
    } catch (e) {}
  };

  const handleSetPresetOrder = (preset: 'default' | 'heatmaps' | 'health' | 'balance') => {
    let order: LookingBackWidgetId[];
    if (preset === 'heatmaps') {
      order = ['weekly-rhythm', 'cycle-heatmap', 'contrib-grid', 'mood-distribution', 'three-lens-ratio'];
    } else if (preset === 'health') {
      order = ['cycle-heatmap', 'mood-distribution', 'weekly-rhythm', 'contrib-grid', 'three-lens-ratio'];
    } else if (preset === 'balance') {
      order = ['three-lens-ratio', 'mood-distribution', 'contrib-grid', 'weekly-rhythm', 'cycle-heatmap'];
    } else {
      order = DEFAULT_LOOKINGBACK_ORDER;
    }
    setWidgetOrder(order);
    try {
      localStorage.setItem('lifeos_lookingback_widget_order', JSON.stringify(order));
    } catch (e) {}
  };

  const handleDragStart = (e: React.DragEvent, id: LookingBackWidgetId) => {
    setDraggedWidget(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: LookingBackWidgetId) => {
    e.preventDefault();
    if (draggedWidget && draggedWidget !== id) {
      setDragOverWidget(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: LookingBackWidgetId) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) {
      setDraggedWidget(null);
      setDragOverWidget(null);
      return;
    }
    setWidgetOrder(prev => {
      const fromIdx = prev.indexOf(draggedWidget);
      const toIdx = prev.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedWidget);
      try {
        localStorage.setItem('lifeos_lookingback_widget_order', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

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

  // --- Heatmap Option A1: GitHub-Style 52-Week Contribution Grid ---
  const [contribMetric, setContribMetric] = useState<'all' | 'journal' | 'deliverables' | 'mood'>('all');
  const [contribYear, setContribYear] = useState<number>(2026);
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    totalCount: number;
    journalCount: number;
    deliverableCount: number;
    contentCount: number;
    socialCount: number;
    moodEntries: string[];
    avgMood: number;
  } | null>(null);

  // 53-week matrix computation for the selected year
  const weeks = useMemo(() => {
    const result: Array<Array<{
      dateStr: string;
      dayOfMonth: number;
      month: number;
      inYear: boolean;
      dayOfWeek: number;
      journalCount: number;
      deliverableCount: number;
      contentCount: number;
      socialCount: number;
      totalCount: number;
      avgMood: number;
      hasEntries: boolean;
      moodEntries: string[];
    }>> = [];

    const jan1 = new Date(contribYear, 0, 1);
    const startDayOffset = jan1.getDay(); // 0 is Sun
    const startDate = new Date(contribYear, 0, 1 - startDayOffset);

    const curr = new Date(startDate);
    for (let w = 0; w < 53; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const y = curr.getFullYear();
        const m = curr.getMonth();
        const dt = curr.getDate();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dt).padStart(2, '0')}`;
        const inYear = y === contribYear;

        const jList = inYear ? journalEntries.filter(e => e.date === dateStr) : [];
        const dList = inYear ? evidenceDeliverables.filter(dev => dev.date === dateStr) : [];
        const cList = inYear ? contentItems.filter(c => c.date === dateStr) : [];
        const sList = inYear ? socialEvents.filter(s => s.date === dateStr) : [];

        const journalCount = jList.length;
        const deliverableCount = dList.length;
        const contentCount = cList.length;
        const socialCount = sList.length;
        const totalCount = journalCount + deliverableCount + contentCount + socialCount;

        const hasEntries = jList.length > 0;
        const avgMood = hasEntries 
          ? jList.reduce((sum, e) => sum + (MOOD_INTENSITIES[e.mood] || 6), 0) / jList.length 
          : 0;

        const moodEntries = jList.map(e => e.mood);

        weekDays.push({
          dateStr,
          dayOfMonth: dt,
          month: m,
          inYear,
          dayOfWeek: d,
          journalCount,
          deliverableCount,
          contentCount,
          socialCount,
          totalCount,
          avgMood,
          hasEntries,
          moodEntries
        });

        curr.setDate(curr.getDate() + 1);
      }
      result.push(weekDays);
    }
    return result;
  }, [contribYear, journalEntries, evidenceDeliverables, contentItems, socialEvents]);

  // Month header markers
  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; name: string }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;

    weeks.forEach((week, wIdx) => {
      const firstInMonth = week.find(d => d.inYear && (d.dayOfMonth === 1 || (wIdx === 0 && d.dayOfMonth <= 7)));
      if (firstInMonth && firstInMonth.month !== lastMonth) {
        labels.push({ weekIndex: wIdx, name: monthNames[firstInMonth.month] });
        lastMonth = firstInMonth.month;
      }
    });
    return labels;
  }, [weeks]);

  // Contribution stats & streaks
  const contribStats = useMemo(() => {
    let activeDays = 0;
    let totalVolume = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    let runningStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    weeks.forEach(week => {
      week.forEach(day => {
        if (!day.inYear) return;
        let count = 0;
        if (contribMetric === 'all') count = day.totalCount;
        else if (contribMetric === 'journal') count = day.journalCount;
        else if (contribMetric === 'deliverables') count = day.deliverableCount;
        else if (contribMetric === 'mood') count = day.hasEntries ? 1 : 0;

        if (count > 0) {
          activeDays++;
          totalVolume += (contribMetric === 'mood' ? 1 : count);
          runningStreak++;
          if (runningStreak > maxStreak) maxStreak = runningStreak;
        } else {
          runningStreak = 0;
        }

        if (day.dateStr === todayStr) {
          currentStreak = runningStreak;
        }
      });
    });

    const daysInYear = 365;
    const consistencyPct = Math.round((activeDays / daysInYear) * 100);

    return { activeDays, totalVolume, maxStreak, currentStreak, consistencyPct };
  }, [weeks, contribMetric]);

  const getContribCellColor = (day: { inYear: boolean; totalCount: number; journalCount: number; deliverableCount: number; avgMood: number; hasEntries: boolean }) => {
    if (!day.inYear) return 'bg-transparent border-transparent pointer-events-none opacity-0';

    if (contribMetric === 'all') {
      if (day.totalCount === 0) return 'bg-[#FAF0EC]/60 border-matcha-primary/5 hover:border-matcha-primary/30';
      if (day.totalCount === 1) return 'bg-[#d8eed4] border-[#c0e4bb]';
      if (day.totalCount === 2) return 'bg-[#aee0a4] border-[#91d185]';
      if (day.totalCount <= 4) return 'bg-[#70bf64] border-[#53a746]';
      return 'bg-[#409633] border-[#2f7824] shadow-2xs';
    } else if (contribMetric === 'journal') {
      if (day.journalCount === 0) return 'bg-[#FAF0EC]/60 border-matcha-primary/5 hover:border-amber-300';
      if (day.journalCount === 1) return 'bg-amber-100 border-amber-200';
      if (day.journalCount === 2) return 'bg-amber-200 border-amber-300';
      return 'bg-amber-400 border-amber-500';
    } else if (contribMetric === 'deliverables') {
      if (day.deliverableCount === 0) return 'bg-[#FAF0EC]/60 border-matcha-primary/5 hover:border-emerald-300';
      if (day.deliverableCount === 1) return 'bg-emerald-100 border-emerald-200';
      if (day.deliverableCount === 2) return 'bg-emerald-200 border-emerald-300';
      return 'bg-emerald-500 border-emerald-600';
    } else {
      // mood
      if (!day.hasEntries) return 'bg-[#FAF0EC]/60 border-matcha-primary/5';
      if (day.avgMood <= 3) return 'bg-[#E3E6E8] border-slate-300';
      if (day.avgMood <= 5) return 'bg-[#ECE2EB] border-purple-200';
      if (day.avgMood <= 7) return 'bg-[#E9F0E8] border-emerald-200';
      if (day.avgMood <= 8.5) return 'bg-[#F8EFE4] border-amber-200';
      return 'bg-[#FDECEB] border-rose-200';
    }
  };

  // --- Heatmap Option A2: Weekly Rhythm Matrix (7 Days x Dimensions) ---
  const weeklyRhythmData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      name: WEEKDAY_NAMES[i],
      short: WEEKDAY_SHORT[i],
      journals: 0,
      deliverables: 0,
      content: 0,
      social: 0,
      moodSum: 0,
      moodCount: 0,
    }));

    const getMonIdx = (dStr: string) => {
      const d = new Date(dStr + 'T12:00:00');
      const day = d.getDay();
      return day === 0 ? 6 : day - 1;
    };

    journalEntries.forEach(entry => {
      const idx = getMonIdx(entry.date);
      days[idx].journals++;
      if (entry.mood) {
        days[idx].moodSum += (MOOD_INTENSITIES[entry.mood] || 6);
        days[idx].moodCount++;
      }
    });

    evidenceDeliverables.forEach(dev => {
      const idx = getMonIdx(dev.date);
      days[idx].deliverables++;
    });

    contentItems.forEach(c => {
      const idx = getMonIdx(c.date);
      days[idx].content++;
    });

    socialEvents.forEach(s => {
      const idx = getMonIdx(s.date);
      days[idx].social++;
    });

    return days.map(d => ({
      ...d,
      avgMood: d.moodCount > 0 ? (d.moodSum / d.moodCount) : 0,
      totalWorkload: d.deliverables + d.content
    }));
  }, [journalEntries, evidenceDeliverables, contentItems, socialEvents]);

  const maxJournals = Math.max(...weeklyRhythmData.map(d => d.journals), 1);
  const maxDeliverables = Math.max(...weeklyRhythmData.map(d => d.deliverables), 1);
  const maxContent = Math.max(...weeklyRhythmData.map(d => d.content), 1);
  const maxSocial = Math.max(...weeklyRhythmData.map(d => d.social), 1);
  const maxMood = Math.max(...weeklyRhythmData.map(d => d.avgMood), 1);

  const peakProductiveDay = [...weeklyRhythmData].sort((a, b) => b.totalWorkload - a.totalWorkload)[0] || weeklyRhythmData[0];
  const peakMoodDay = [...weeklyRhythmData].filter(d => d.moodCount > 0).sort((a, b) => b.avgMood - a.avgMood)[0] || weeklyRhythmData[0];
  const peakSocialDay = [...weeklyRhythmData].sort((a, b) => b.social - a.social)[0] || weeklyRhythmData[0];
  const peakJournalDay = [...weeklyRhythmData].sort((a, b) => b.journals - a.journals)[0] || weeklyRhythmData[0];

  const renderCardReorderToolbar = (widgetId: LookingBackWidgetId, index: number) => {
    const meta = LOOKINGBACK_WIDGET_META[widgetId];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-matcha-primary/10 select-none">
        <div className="flex items-center gap-2">
          <div 
            draggable
            onDragStart={(e) => handleDragStart(e, widgetId)}
            className="p-1.5 rounded-xl bg-[#FAF0EC]/80 hover:bg-[#FAF0EC] text-[#5D524F]/90 border border-matcha-primary/20 cursor-grab active:cursor-grabbing flex items-center gap-1.5 shadow-2xs transition-all group"
            title="Click and drag this card to reposition anywhere anytime"
          >
            <GripVertical className="w-4 h-4 text-matcha-primary group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-mono font-bold text-[#5D524F]">
              Position #{index + 1} of {widgetOrder.length}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#5D524F]/70 hidden sm:inline flex items-center gap-1">
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick nudge buttons */}
          <div className="flex items-center bg-[#FAF0EC]/70 p-0.5 rounded-xl border border-matcha-primary/15">
            <button
              type="button"
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                handleMoveWidget(widgetId, 'up');
              }}
              className="px-2 py-1 rounded-lg text-[#5D524F]/70 hover:text-ink-dark hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer transition-all flex items-center gap-1 text-xs font-mono font-bold"
              title="Move section up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Up</span>
            </button>
            <button
              type="button"
              disabled={index === widgetOrder.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                handleMoveWidget(widgetId, 'down');
              }}
              className="px-2 py-1 rounded-lg text-[#5D524F]/70 hover:text-ink-dark hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer transition-all flex items-center gap-1 text-xs font-mono font-bold"
              title="Move section down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Down</span>
            </button>
          </div>

          {/* Direct Position Selector */}
          <select
            value={index}
            onChange={(e) => {
              e.stopPropagation();
              handleMoveToPosition(widgetId, Number(e.target.value));
            }}
            className="text-xs font-mono font-bold bg-[#FAF0EC]/70 hover:bg-white border border-matcha-primary/20 rounded-xl px-2.5 py-1 text-[#5D524F] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-matcha-primary transition-all"
            title="Move this section to a specific position"
          >
            {widgetOrder.map((_, i) => (
              <option key={i} value={i}>
                Position #{i + 1} {i === 0 ? '(Top)' : i === widgetOrder.length - 1 ? '(Bottom)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderWidget = (wId: LookingBackWidgetId, index: number) => {
    switch (wId) {
      case 'contrib-grid':
        return (
          <div className="bg-white border border-matcha-primary/20 rounded-3xl p-6 space-y-5 shadow-xs">
            {renderCardReorderToolbar('contrib-grid', index)}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-matcha-primary/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-matcha-primary" />
                  <h3 className="text-base font-bold text-ink-dark font-display">
                    Year in Review Contribution Grid
                  </h3>
                  <span className="text-[10px] font-mono bg-matcha-primary/10 text-matcha-primary px-2 py-0.5 rounded-full font-bold">
                    52 Weeks / 365 Days
                  </span>
                </div>
                <p className="text-xs text-[#5D524F]/70">
                  Interactive consistency matrix mapping your daily reflections, work output & emotional rhythms across the entire year.
                </p>
              </div>

              {/* Metric switcher tabs & year controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Mode Filter */}
                <div className="flex items-center bg-[#FAF0EC]/70 p-1 rounded-2xl border border-matcha-primary/10 text-xs font-mono">
                  <button
                    onClick={() => setContribMetric('all')}
                    className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer font-bold ${
                      contribMetric === 'all' ? 'bg-white text-matcha-primary shadow-xs' : 'text-[#5D524F]/70 hover:text-[#5D524F]'
                    }`}
                    title="All logged output combined"
                  >
                    🌟 All Output
                  </button>
                  <button
                    onClick={() => setContribMetric('journal')}
                    className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer font-bold ${
                      contribMetric === 'journal' ? 'bg-white text-amber-700 shadow-xs' : 'text-[#5D524F]/70 hover:text-[#5D524F]'
                    }`}
                    title="Journal reflections consistency"
                  >
                    📝 Journals
                  </button>
                  <button
                    onClick={() => setContribMetric('deliverables')}
                    className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer font-bold ${
                      contribMetric === 'deliverables' ? 'bg-white text-emerald-700 shadow-xs' : 'text-[#5D524F]/70 hover:text-[#5D524F]'
                    }`}
                    title="Evidence deliverables completed"
                  >
                    🎯 Deliverables
                  </button>
                  <button
                    onClick={() => setContribMetric('mood')}
                    className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer font-bold ${
                      contribMetric === 'mood' ? 'bg-white text-purple-700 shadow-xs' : 'text-[#5D524F]/70 hover:text-[#5D524F]'
                    }`}
                    title="Mood & emotional energy ratings"
                  >
                    💭 Mood
                  </button>
                </div>

                {/* Year Selector */}
                <div className="flex items-center gap-1 bg-[#FAF0EC]/70 p-1 rounded-2xl border border-matcha-primary/10 text-xs font-mono">
                  <button
                    onClick={() => setContribYear(y => y - 1)}
                    className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer text-[#5D524F]"
                    title="Previous year"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold px-2 text-[#5D524F]">{contribYear}</span>
                  <button
                    onClick={() => setContribYear(y => y + 1)}
                    className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer text-[#5D524F]"
                    title="Next year"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Matrix Container with Month Labels & Day Labels */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[760px]">
                {/* Month Headers */}
                <div className="flex text-[10px] font-mono font-semibold text-[#5D524F]/60 ml-8 mb-1.5">
                  {monthLabels.map((item, idx) => (
                    <span
                      key={idx}
                      style={{ marginLeft: idx === 0 ? `${item.weekIndex * 15}px` : undefined }}
                      className={idx > 0 ? 'flex-1' : ''}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  {/* Day-of-week labels (Mon, Wed, Fri) */}
                  <div className="flex flex-col justify-between text-[9px] font-mono text-[#5D524F]/50 h-[100px] py-0.5 select-none">
                    <span>Sun</span>
                    <span>Tue</span>
                    <span>Thu</span>
                    <span>Sat</span>
                  </div>

                  {/* 53-week columns */}
                  <div className="flex gap-1 flex-1">
                    {weeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1">
                        {week.map((day) => {
                          const cellColor = getContribCellColor(day);
                          return (
                            <div
                              key={day.dateStr}
                              onMouseEnter={() => {
                                if (day.inYear) {
                                  setHoveredCell({
                                    dateStr: day.dateStr,
                                    totalCount: day.totalCount,
                                    journalCount: day.journalCount,
                                    deliverableCount: day.deliverableCount,
                                    contentCount: day.contentCount,
                                    socialCount: day.socialCount,
                                    moodEntries: day.moodEntries,
                                    avgMood: day.avgMood
                                  });
                                }
                              }}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`w-3 h-3 rounded-[3px] border transition-transform duration-100 ${cellColor} ${
                                day.inYear ? 'cursor-pointer hover:scale-125 hover:z-20' : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Card Display / Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-matcha-primary/10 text-xs">
              {hoveredCell ? (
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="font-bold text-[#5D524F]">
                    {new Date(hoveredCell.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}:
                  </span>
                  <span className="bg-matcha-primary/15 text-matcha-primary font-bold px-2 py-0.5 rounded-full">
                    {hoveredCell.totalCount} {hoveredCell.totalCount === 1 ? 'item' : 'items'}
                  </span>
                  <span className="text-[#5D524F]/70 text-[11px]">
                    ({hoveredCell.journalCount} journal, {hoveredCell.deliverableCount} deliverables, {hoveredCell.contentCount} content, {hoveredCell.socialCount} social)
                  </span>
                  {hoveredCell.moodEntries.length > 0 && (
                    <span className="text-[11px] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md text-amber-900 font-semibold">
                      Mood: {hoveredCell.moodEntries.join(', ')} ({hoveredCell.avgMood.toFixed(1)}/10)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-[#5D524F]/50 font-mono italic">
                  Hover over any day square to inspect logged activity details
                </span>
              )}

              {/* Contribution Legend */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5D524F]/60 ml-auto">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FAF0EC]/60 border border-matcha-primary/10 inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#d8eed4] border border-[#c0e4bb] inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#aee0a4] border-[#91d185] inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#70bf64] border-[#53a746] inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#409633] border-[#2f7824] inline-block" />
                <span>More</span>
              </div>
            </div>
          </div>
        );

      case 'weekly-rhythm':
        return (
          <div className="bg-white border border-matcha-primary/20 rounded-3xl p-6 space-y-5 shadow-xs">
            {renderCardReorderToolbar('weekly-rhythm', index)}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-matcha-primary/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-matcha-primary" />
                  <h3 className="text-base font-bold text-ink-dark font-display">
                    Weekly Rhythm & Output Matrix
                  </h3>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    7 Days Breakdown
                  </span>
                </div>
                <p className="text-xs text-[#5D524F]/70">
                  Comparative intensity map uncovering which days of the week drive your highest focus, output, and emotional well-being.
                </p>
              </div>
            </div>

            {/* 7-Day Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-matcha-primary/15">
                    <th className="py-2.5 px-3 text-xs font-mono font-bold uppercase tracking-wider text-[#5D524F]/70 w-44">
                      Life Dimension
                    </th>
                    {WEEKDAY_SHORT.map((dayName, idx) => {
                      const isTopDay = weeklyRhythmData[idx].totalWorkload === peakProductiveDay.totalWorkload;
                      return (
                        <th key={dayName} className="py-2.5 px-2 text-center text-xs font-mono font-bold text-[#5D524F]">
                          <span className={`inline-block px-2 py-0.5 rounded-lg ${isTopDay ? 'bg-matcha-primary/15 text-matcha-primary font-black' : ''}`}>
                            {dayName}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-matcha-primary/10 text-xs">
                  {/* Row 1: Journal Reflections */}
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#5D524F] flex items-center gap-1.5">
                      <span>📝</span>
                      <span>Journal Reflections</span>
                    </td>
                    {weeklyRhythmData.map((d) => {
                      const ratio = maxJournals > 0 ? d.journals / maxJournals : 0;
                      const isPeak = d.journals === maxJournals && d.journals > 0;
                      return (
                        <td key={d.name} className="py-2 px-1.5 text-center">
                          <div
                            className={`py-2 px-1 rounded-xl font-mono text-xs font-bold transition-all relative ${
                              d.journals === 0 
                                ? 'bg-[#FAF0EC]/30 text-[#5D524F]/40' 
                                : ratio > 0.7 
                                  ? 'bg-amber-300 text-amber-950 shadow-2xs font-black' 
                                  : ratio > 0.35 
                                    ? 'bg-amber-100 text-amber-900 font-semibold' 
                                    : 'bg-amber-50 text-amber-800'
                            }`}
                            title={`${d.name}: ${d.journals} reflections logged`}
                          >
                            {d.journals}
                            {isPeak && <span className="absolute -top-1 -right-1 text-[9px]">★</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 2: Evidence Deliverables */}
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#5D524F] flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>Evidence Deliverables</span>
                    </td>
                    {weeklyRhythmData.map((d) => {
                      const ratio = maxDeliverables > 0 ? d.deliverables / maxDeliverables : 0;
                      const isPeak = d.deliverables === maxDeliverables && d.deliverables > 0;
                      return (
                        <td key={d.name} className="py-2 px-1.5 text-center">
                          <div
                            className={`py-2 px-1 rounded-xl font-mono text-xs font-bold transition-all relative ${
                              d.deliverables === 0 
                                ? 'bg-[#FAF0EC]/30 text-[#5D524F]/40' 
                                : ratio > 0.7 
                                  ? 'bg-emerald-400 text-emerald-950 shadow-2xs font-black' 
                                  : ratio > 0.35 
                                    ? 'bg-emerald-200/80 text-emerald-900 font-semibold' 
                                    : 'bg-emerald-50 text-emerald-800'
                            }`}
                            title={`${d.name}: ${d.deliverables} deliverables finished`}
                          >
                            {d.deliverables}
                            {isPeak && <span className="absolute -top-1 -right-1 text-[9px]">★</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 3: Content Creation */}
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#5D524F] flex items-center gap-1.5">
                      <span>📹</span>
                      <span>Content Pipeline</span>
                    </td>
                    {weeklyRhythmData.map((d) => {
                      const ratio = maxContent > 0 ? d.content / maxContent : 0;
                      const isPeak = d.content === maxContent && d.content > 0;
                      return (
                        <td key={d.name} className="py-2 px-1.5 text-center">
                          <div
                            className={`py-2 px-1 rounded-xl font-mono text-xs font-bold transition-all relative ${
                              d.content === 0 
                                ? 'bg-[#FAF0EC]/30 text-[#5D524F]/40' 
                                : ratio > 0.7 
                                  ? 'bg-purple-300 text-purple-950 shadow-2xs font-black' 
                                  : ratio > 0.35 
                                    ? 'bg-purple-100 text-purple-900 font-semibold' 
                                    : 'bg-purple-50 text-purple-800'
                            }`}
                            title={`${d.name}: ${d.content} content milestones scheduled`}
                          >
                            {d.content}
                            {isPeak && <span className="absolute -top-1 -right-1 text-[9px]">★</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 4: Social Commitments */}
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#5D524F] flex items-center gap-1.5">
                      <span>🤝</span>
                      <span>Social Events</span>
                    </td>
                    {weeklyRhythmData.map((d) => {
                      const ratio = maxSocial > 0 ? d.social / maxSocial : 0;
                      const isPeak = d.social === maxSocial && d.social > 0;
                      return (
                        <td key={d.name} className="py-2 px-1.5 text-center">
                          <div
                            className={`py-2 px-1 rounded-xl font-mono text-xs font-bold transition-all relative ${
                              d.social === 0 
                                ? 'bg-[#FAF0EC]/30 text-[#5D524F]/40' 
                                : ratio > 0.7 
                                  ? 'bg-[#f7a4a2] text-rose-950 shadow-2xs font-black' 
                                  : ratio > 0.35 
                                    ? 'bg-[#FCDBD9] text-strawberry-accent font-semibold' 
                                    : 'bg-[#FCDBD9]/40 text-strawberry-accent/90'
                            }`}
                            title={`${d.name}: ${d.social} social events logged`}
                          >
                            {d.social}
                            {isPeak && <span className="absolute -top-1 -right-1 text-[9px]">★</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 5: Mood & Energy */}
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#5D524F] flex items-center gap-1.5">
                      <span>🌸</span>
                      <span>Average Mood Rating</span>
                    </td>
                    {weeklyRhythmData.map((d) => {
                      const hasMood = d.moodCount > 0;
                      const isPeak = hasMood && d.avgMood === peakMoodDay.avgMood;
                      return (
                        <td key={d.name} className="py-2 px-1.5 text-center">
                          <div
                            className={`py-2 px-1 rounded-xl font-mono text-xs font-bold transition-all relative ${
                              !hasMood 
                                ? 'bg-[#FAF0EC]/30 text-[#5D524F]/40' 
                                : d.avgMood >= 8.5 
                                  ? 'bg-rose-200 text-rose-900 font-black' 
                                  : d.avgMood >= 7 
                                    ? 'bg-emerald-100 text-emerald-900 font-semibold' 
                                    : 'bg-[#FAF0EC] text-[#5D524F]'
                            }`}
                            title={`${d.name}: Avg mood intensity ${d.avgMood.toFixed(1)}/10 across ${d.moodCount} entries`}
                          >
                            {hasMood ? `${d.avgMood.toFixed(1)}` : '—'}
                            {isPeak && <span className="absolute -top-1 -right-1 text-[9px]">★</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4 Weekly Rhythm Insights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#FAF0EC]/50 border border-matcha-primary/10 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Peak Productivity
                </span>
                <p className="text-sm font-bold text-ink-dark font-display">{peakProductiveDay.name}</p>
                <p className="text-[11px] text-[#5D524F]/70">
                  Highest output with <strong>{peakProductiveDay.totalWorkload} total items</strong> ({peakProductiveDay.deliverables} deliverables & {peakProductiveDay.content} content).
                </p>
              </div>

              <div className="bg-[#FAF0EC]/50 border border-matcha-primary/10 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-rose-600 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> Best Emotional Mood
                </span>
                <p className="text-sm font-bold text-ink-dark font-display">{peakMoodDay.name}</p>
                <p className="text-[11px] text-[#5D524F]/70">
                  Peak emotional rating of <strong>{peakMoodDay.avgMood > 0 ? peakMoodDay.avgMood.toFixed(1) + '/10' : 'N/A'}</strong> from journal reflections.
                </p>
              </div>

              <div className="bg-[#FAF0EC]/50 border border-matcha-primary/10 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-strawberry-accent flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Most Social Rhythm
                </span>
                <p className="text-sm font-bold text-ink-dark font-display">{peakSocialDay.name}</p>
                <p className="text-[11px] text-[#5D524F]/70">
                  Most active social connection day with <strong>{peakSocialDay.social} gatherings</strong> and networking events.
                </p>
              </div>

              <div className="bg-[#FAF0EC]/50 border border-matcha-primary/10 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Most Reflective
                </span>
                <p className="text-sm font-bold text-ink-dark font-display">{peakJournalDay.name}</p>
                <p className="text-[11px] text-[#5D524F]/70">
                  Deepest introspection frequency with <strong>{peakJournalDay.journals} journal entries</strong> recorded.
                </p>
              </div>
            </div>
          </div>
        );

      case 'mood-distribution':
        return (
          <div className="bg-white border border-matcha-primary/20 rounded-3xl p-6 space-y-4 shadow-xs">
            {renderCardReorderToolbar('mood-distribution', index)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 pt-2">
              {moodDistribution.length === 0 ? (
                <p className="text-xs text-center py-6 text-[#5D524F]/50 font-mono col-span-2">No mood entries logged yet.</p>
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
        );

      case 'three-lens-ratio':
        return (
          <div className="bg-white border border-matcha-primary/20 rounded-3xl p-6 space-y-4 shadow-xs">
            {renderCardReorderToolbar('three-lens-ratio', index)}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
        );

      case 'cycle-heatmap':
        return (
          <div className="bg-white border border-matcha-primary/20 rounded-3xl p-6 shadow-xs space-y-4">
            {renderCardReorderToolbar('cycle-heatmap', index)}
            <CycleHeatmapMatrix
              periodLogs={periodLogs}
              cycleSettings={cycleSettings}
              journalEntries={journalEntries}
            />
          </div>
        );

      default:
        return null;
    }
  };

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

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF0EC]/60 border border-matcha-primary/10 rounded-2xl text-xs font-mono">
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
            <button
              onClick={() => setIsCustomizeLayoutOpen(!isCustomizeLayoutOpen)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isCustomizeLayoutOpen 
                  ? 'bg-matcha-primary text-white shadow-xs' 
                  : 'text-[#5D524F]/80 hover:bg-white bg-white/70 border border-matcha-primary/20'
              }`}
              title="Change positions and reorder sections"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Arrange Layout</span>
              <span className="text-[9px] bg-matcha-primary/20 text-matcha-primary px-1.5 py-0.2 rounded-full font-mono">
                5 Cards
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Customizable Layout Panel Drawer */}
      {isCustomizeLayoutOpen && (
        <div className="bg-white border border-matcha-primary/20 rounded-3xl p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-matcha-primary/10 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-ink-dark flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-matcha-primary" />
                <span>Dashboard Card Ordering</span>
              </h3>
              <p className="text-xs text-[#5D524F]/70">
                Drag cards or use arrows to change positions anytime. Your custom layout is saved automatically.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetOrder}
                className="px-2.5 py-1 text-xs font-mono font-semibold text-[#5D524F]/70 hover:text-rose-600 bg-[#FAF0EC]/60 hover:bg-rose-50 rounded-xl border border-matcha-primary/15 transition-colors cursor-pointer flex items-center gap-1"
                title="Reset to default order"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Order</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCustomizeLayoutOpen(false)}
                className="text-xs font-bold text-matcha-primary hover:underline cursor-pointer px-2"
              >
                Done
              </button>
            </div>
          </div>

          {/* Drag / Move Chips in Current Order */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {widgetOrder.map((wId, idx) => {
              const meta = LOOKINGBACK_WIDGET_META[wId];
              return (
                <div
                  key={wId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, wId)}
                  onDragOver={(e) => handleDragOver(e, wId)}
                  onDrop={(e) => handleDrop(e, wId)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between gap-2 shadow-2xs ${
                    draggedWidget === wId 
                      ? 'opacity-40 border-dashed border-matcha-primary bg-matcha-primary/5' 
                      : dragOverWidget === wId
                        ? 'border-matcha-primary bg-matcha-primary/10 ring-2 ring-matcha-primary'
                        : 'bg-[#FAF0EC]/40 border-matcha-primary/15 hover:border-matcha-primary/40 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold bg-matcha-primary/15 text-matcha-primary px-1.5 py-0.2 rounded-full">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveWidget(wId, 'up')}
                        className="p-0.5 text-[#5D524F]/60 hover:text-ink-dark disabled:opacity-20 cursor-pointer"
                        title="Move left/up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === widgetOrder.length - 1}
                        onClick={() => handleMoveWidget(wId, 'down')}
                        className="p-0.5 text-[#5D524F]/60 hover:text-ink-dark disabled:opacity-20 cursor-pointer"
                        title="Move right/down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#5D524F]">
                      <span>{meta.emoji}</span>
                      <span className="truncate">{meta.label}</span>
                    </div>
                    <p className="text-[10px] text-[#5D524F]/60 line-clamp-1 leading-tight">
                      {meta.shortDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Presets Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-[#5D524F]/70">
            <span className="text-[10px] uppercase font-bold text-[#5D524F]/50">Presets:</span>
            <button
              onClick={() => handleSetPresetOrder('default')}
              className="px-2 py-0.5 rounded-lg border border-matcha-primary/15 hover:bg-[#FAF0EC] cursor-pointer text-[11px]"
            >
              Default
            </button>
            <button
              onClick={() => handleSetPresetOrder('heatmaps')}
              className="px-2 py-0.5 rounded-lg border border-matcha-primary/15 hover:bg-[#FAF0EC] cursor-pointer text-[11px]"
            >
              🔥 Heatmaps First
            </button>
            <button
              onClick={() => handleSetPresetOrder('health')}
              className="px-2 py-0.5 rounded-lg border border-matcha-primary/15 hover:bg-[#FAF0EC] cursor-pointer text-[11px]"
            >
              🩸 Cycle & Health First
            </button>
            <button
              onClick={() => handleSetPresetOrder('balance')}
              className="px-2 py-0.5 rounded-lg border border-matcha-primary/15 hover:bg-[#FAF0EC] cursor-pointer text-[11px]"
            >
              🎯 3-Lens Balance First
            </button>
          </div>
        </div>
      )}

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

      {/* Dynamic Reorderable Dashboard Sections */}
      <div className="space-y-6">
        {widgetOrder.map((wId, idx) => (
          <div
            key={wId}
            id={`section-widget-${wId}`}
            draggable
            onDragStart={(e) => handleDragStart(e, wId)}
            onDragOver={(e) => handleDragOver(e, wId)}
            onDrop={(e) => handleDrop(e, wId)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-200 rounded-3xl ${
              draggedWidget === wId
                ? "opacity-40 scale-[0.99] border-2 border-dashed border-matcha-primary ring-4 ring-matcha-primary/20"
                : dragOverWidget === wId
                  ? "ring-4 ring-matcha-primary shadow-xl scale-[1.01] bg-matcha-primary/5"
                  : ""
            }`}
          >
            {renderWidget(wId, idx)}
          </div>
        ))}
      </div>
    </div>
  );
}
