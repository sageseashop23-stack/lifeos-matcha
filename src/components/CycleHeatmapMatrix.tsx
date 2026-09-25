import React, { useState, useMemo } from 'react';
import { PeriodLog, CycleSettings, JournalEntry } from '../types';
import { getCycleInfoForDate, CyclePhase } from '../utils/cycleUtils';
import { 
  Heart, Flame, Activity, Sparkles, SlidersHorizontal, Info, 
  Calendar as CalendarIcon, Filter, Layers, Maximize2, Minimize2, 
  CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp
} from 'lucide-react';

interface CycleHeatmapMatrixProps {
  periodLogs: PeriodLog[];
  cycleSettings: CycleSettings;
  journalEntries: JournalEntry[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  compact?: boolean;
}

interface SymptomDef {
  id: string;
  label: string;
  emoji: string;
  category: 'menstrual' | 'symptom' | 'pcos' | 'fertility';
  description: string;
  recommendation?: string;
}

const SYMPTOM_CATALOG: SymptomDef[] = [
  // Menstrual Flow
  { 
    id: 'flow-heavy', 
    label: 'Heavy Flow', 
    emoji: '🩸', 
    category: 'menstrual', 
    description: 'Peak menstrual blood volume requiring frequent changes',
    recommendation: 'Rest, hydration, warm bone broth or iron-rich foods.'
  },
  { 
    id: 'flow-medium-light', 
    label: 'Med/Light Flow', 
    emoji: '💧', 
    category: 'menstrual', 
    description: 'Moderate to tapering menstrual bleeding',
    recommendation: 'Gentle walking and warm herbal teas.'
  },
  // Standard Physical Symptoms
  { 
    id: 'Cramping', 
    label: 'Cramping', 
    emoji: '⚡', 
    category: 'symptom', 
    description: 'Uterine contractions from localized prostaglandins',
    recommendation: 'Magnesium glycinate, warm castor oil packs or heating pad.'
  },
  { 
    id: 'Fatigue', 
    label: 'Fatigue', 
    emoji: '😴', 
    category: 'symptom', 
    description: 'Physical or cognitive tiredness, low stamina',
    recommendation: 'Honor the low-energy signal. Avoid high-intensity cardio.'
  },
  { 
    id: 'Headache', 
    label: 'Headache', 
    emoji: '🤕', 
    category: 'symptom', 
    description: 'Hormonal vascular tension or estrogen withdrawal',
    recommendation: 'Electrolytes, peppermint oil on temples, dim lighting.'
  },
  { 
    id: 'Bloating', 
    label: 'Bloating', 
    emoji: '🎈', 
    category: 'symptom', 
    description: 'Fluid retention and digestive slowing from progesterone',
    recommendation: 'Potassium-rich foods, dandelion root tea, dandelion greens.'
  },
  { 
    id: 'Mood swings', 
    label: 'Mood Swings', 
    emoji: '🎭', 
    category: 'symptom', 
    description: 'Emotional volatility, sensitivity, or irritability',
    recommendation: 'Reduce caffeine, journaling, restorative slow breathwork.'
  },
  { 
    id: 'Backache', 
    label: 'Backache', 
    emoji: '🪵', 
    category: 'symptom', 
    description: 'Referred lower sacral discomfort or pelvic congestion',
    recommendation: 'Child\'s pose, cat-cow stretches, gentle lumbar heat.'
  },
  { 
    id: 'Breast tenderness', 
    label: 'Breast Tenderness', 
    emoji: '🍒', 
    category: 'symptom', 
    description: 'Fibrocystic sensitivity from estrogen and progesterone peaks',
    recommendation: 'Supportive wire-free bralette, evening primrose oil.'
  },
  { 
    id: 'Acne', 
    label: 'Skin Sensitivity', 
    emoji: '🫧', 
    category: 'symptom', 
    description: 'Sebum shifts caused by androgen ratio fluctuation',
    recommendation: 'Gentle salicylic acid cleansing, zinc, avoid dairy.'
  },
  // PCOS & Hormonal Markers
  { 
    id: 'Sugar Cravings', 
    label: 'Sugar Cravings', 
    emoji: '🍫', 
    category: 'pcos', 
    description: 'Insulin sensitivity dips and dopamine cravings before period',
    recommendation: 'Pair carbs with protein & healthy fats, 85% dark chocolate.'
  },
  { 
    id: 'Brain Fog', 
    label: 'Brain Fog', 
    emoji: '🌫️', 
    category: 'pcos', 
    description: 'Cognitive haze, difficulty focusing or finding words',
    recommendation: 'B-complex vitamins, cold splash, take tasks in 20-min blocks.'
  },
  { 
    id: 'Hormonal Acne', 
    label: 'Hormonal Acne', 
    emoji: '🔴', 
    category: 'pcos', 
    description: 'Deep jawline/chin cystic blemishes triggered by androgens',
    recommendation: 'Spearmint tea, inositol, gentle barrier-protecting moisturizer.'
  },
  { 
    id: 'Ovarian Pain', 
    label: 'Ovarian Discomfort', 
    emoji: '📍', 
    category: 'pcos', 
    description: 'Localized unilateral twinges or dull pelvic ache (Mittelschmerz)',
    recommendation: 'Warm pelvic compress, anti-inflammatory curcumin.'
  },
  { 
    id: 'Hirsutism', 
    label: 'Hirsutism Tendency', 
    emoji: '🪒', 
    category: 'pcos', 
    description: 'Androgen-driven follicular changes',
    recommendation: 'Spearmint infusion, zinc, metabolic insulin management.'
  },
  { 
    id: 'Hair Thinning', 
    label: 'Hair Shedding', 
    emoji: '🪮', 
    category: 'pcos', 
    description: 'Telogen shedding linked to hormonal shifts',
    recommendation: 'Scalp massage, biotin, iron/ferritin level check.'
  },
  // Ovulation Biomarkers
  { 
    id: 'lh-peak', 
    label: 'LH Peak / Surge', 
    emoji: '🧬', 
    category: 'fertility', 
    description: 'Positive or Peak Luteinizing Hormone strip detection',
    recommendation: 'Ovulation occurs 24-36 hrs after LH surge. Peak conception.'
  },
  { 
    id: 'fertile-mucus', 
    label: 'Fertile Mucus', 
    emoji: '💧', 
    category: 'fertility', 
    description: 'Egg-white or watery high-estrogen cervical fluid',
    recommendation: 'Natural biological indicator of opening fertile window.'
  }
];

const MOOD_INTENSITY_VALUES: Record<string, number> = {
  '🌸 Serene': 7,
  '⚡ Focused': 8,
  '🔋 Energetic': 10,
  '📝 Grateful': 8,
  '😴 Tired': 3,
  '💭 Reflective': 6,
  '🌱 Growing': 9,
};

export default function CycleHeatmapMatrix({
  periodLogs,
  cycleSettings,
  journalEntries,
  selectedDate,
  onSelectDate,
  compact = false
}: CycleHeatmapMatrixProps) {
  // Metric Mode: 'occurrences' | 'energy' | 'activeCycle'
  const [metricMode, setMetricMode] = useState<'occurrences' | 'energy' | 'activeCycle'>('occurrences');
  
  // Category Filter: 'all' | 'menstrual' | 'pcos'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'menstrual' | 'pcos'>('all');

  // Cycle Scope: 'all' | 'current' | 'previous'
  const [cycleScope, setCycleScope] = useState<'all' | 'current' | 'previous'>('all');

  // Hovered Cell detail
  const [hoveredCell, setHoveredCell] = useState<{
    dayNum: number;
    phaseName: string;
    phaseEmoji: string;
    symptomDef: SymptomDef;
    count: number;
    totalCyclesLogged: number;
    percentage: number;
    avgMood: number | null;
    dates: string[];
    isLoggedToday: boolean;
  } | null>(null);

  // Fullscreen expansion modal toggle
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Identify all cycle start dates from periodLogs
  const cycleStarts = useMemo(() => {
    const flowLogs = periodLogs
      .filter(p => p.flow && p.flow !== 'None')
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const flowDates = flowLogs.map(p => p.date);
    const starts: string[] = [];
    
    flowDates.forEach(d => {
      const dDate = new Date(d + 'T00:00:00');
      const prevDateStr = new Date(dDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (!flowDates.includes(prevDateStr)) {
        starts.push(d);
      }
    });

    if (cycleSettings.lastPeriodDate && !starts.includes(cycleSettings.lastPeriodDate)) {
      starts.push(cycleSettings.lastPeriodDate);
      starts.sort((a, b) => a.localeCompare(b));
    }

    return starts;
  }, [periodLogs, cycleSettings.lastPeriodDate]);

  // Current Cycle start vs Previous Cycle start
  const currentCycleStart = cycleStarts.length > 0 ? cycleStarts[cycleStarts.length - 1] : cycleSettings.lastPeriodDate;
  const previousCycleStart = cycleStarts.length > 1 ? cycleStarts[cycleStarts.length - 2] : null;

  // Filter logs by selected cycle scope
  const scopedLogs = useMemo(() => {
    if (cycleScope === 'current' && currentCycleStart) {
      return periodLogs.filter(p => p.date >= currentCycleStart);
    }
    if (cycleScope === 'previous' && previousCycleStart && currentCycleStart) {
      return periodLogs.filter(p => p.date >= previousCycleStart && p.date < currentCycleStart);
    }
    return periodLogs;
  }, [periodLogs, cycleScope, currentCycleStart, previousCycleStart]);

  // Total cycle days to represent in columns
  const cycleDaysTotal = useMemo(() => {
    let maxDay = Math.max(28, cycleSettings.cycleLength || 28);
    // Scan all scoped logs to see if any cycle day exceeds maxDay
    scopedLogs.forEach(log => {
      const info = getCycleInfoForDate(log.date, cycleSettings, periodLogs);
      if (info.cycleDay > maxDay) {
        maxDay = info.cycleDay;
      }
    });
    // Cap at 35 or 42 for neat grid visualization
    return Math.min(Math.max(28, maxDay), 35);
  }, [scopedLogs, cycleSettings, periodLogs]);

  const cycleDaysList = useMemo(() => {
    return Array.from({ length: cycleDaysTotal }, (_, i) => i + 1);
  }, [cycleDaysTotal]);

  // Get Phase for Day Number
  const getCyclePhaseForDayNumber = (dayNum: number): { name: string; emoji: string; color: string; bg: string; border: string } => {
    const periodDays = cycleSettings.periodLength || 5;
    const halfCycle = Math.floor(cycleDaysTotal / 2);

    if (dayNum <= periodDays) {
      return { name: 'Menstrual', emoji: '🩸', color: 'text-rose-700', bg: 'bg-rose-50/80', border: 'border-rose-200' };
    }
    if (cycleSettings.isPCOSEnabled && dayNum > (cycleSettings.cycleLength || 28)) {
      return { name: 'Extended Follicular', emoji: '⏳', color: 'text-amber-700', bg: 'bg-amber-50/80', border: 'border-amber-200' };
    }
    if (dayNum <= halfCycle - 2) {
      return { name: 'Follicular', emoji: '🌱', color: 'text-emerald-700', bg: 'bg-emerald-50/80', border: 'border-emerald-200' };
    }
    if (dayNum <= halfCycle + 1) {
      return { name: 'Ovulatory', emoji: '✨', color: 'text-orange-700', bg: 'bg-orange-50/80', border: 'border-orange-200' };
    }
    return { name: 'Luteal', emoji: '🌙', color: 'text-purple-700', bg: 'bg-purple-50/80', border: 'border-purple-200' };
  };

  // 2. Pre-index Journal Moods by Date
  const journalMoodByDate = useMemo(() => {
    const map = new Map<string, number>();
    journalEntries.forEach(entry => {
      if (entry.mood) {
        const val = MOOD_INTENSITY_VALUES[entry.mood] || 5;
        map.set(entry.date, val);
      }
    });
    return map;
  }, [journalEntries]);

  // Current Cycle Day for Selected Date
  const currentSelectedCycleInfo = useMemo(() => {
    if (!selectedDate) return null;
    return getCycleInfoForDate(selectedDate, cycleSettings, periodLogs);
  }, [selectedDate, cycleSettings, periodLogs]);

  // 3. Compute Symptom × CycleDay Matrix
  const matrixData = useMemo(() => {
    // dayNum -> Map of symptomId -> { count: number, dates: string[], moods: number[] }
    const dayMap = new Map<number, {
      cycleCount: number;
      symptoms: Map<string, { count: number; dates: string[]; moods: number[] }>;
    }>();

    cycleDaysList.forEach(day => {
      dayMap.set(day, {
        cycleCount: 0,
        symptoms: new Map()
      });
    });

    scopedLogs.forEach(log => {
      const info = getCycleInfoForDate(log.date, cycleSettings, periodLogs);
      const dayNum = info.cycleDay;
      const dayBucket = dayMap.get(dayNum);
      if (!dayBucket) return;

      dayBucket.cycleCount++;
      const moodVal = journalMoodByDate.get(log.date);

      const recordSymptom = (symId: string) => {
        let symEntry = dayBucket.symptoms.get(symId);
        if (!symEntry) {
          symEntry = { count: 0, dates: [], moods: [] };
          dayBucket.symptoms.set(symId, symEntry);
        }
        symEntry.count++;
        symEntry.dates.push(log.date);
        if (moodVal !== undefined) {
          symEntry.moods.push(moodVal);
        }
      };

      // Flow
      if (log.flow === 'Heavy') {
        recordSymptom('flow-heavy');
      } else if (log.flow === 'Medium' || log.flow === 'Light') {
        recordSymptom('flow-medium-light');
      }

      // Standard Symptoms
      (log.symptoms || []).forEach(sym => {
        recordSymptom(sym);
      });

      // PCOS custom symptoms
      (log.pcosSymptoms || []).forEach(sym => {
        recordSymptom(sym);
      });

      // LH strip
      if (log.lhTest === 'Peak' || log.lhTest === 'High' || log.lhTest === 'Positive') {
        recordSymptom('lh-peak');
      }

      // Fertile mucus
      if (log.cervicalMucus === 'Egg-white' || log.cervicalMucus === 'Watery') {
        recordSymptom('fertile-mucus');
      }
    });

    return dayMap;
  }, [scopedLogs, cycleDaysList, cycleSettings, periodLogs, journalMoodByDate]);

  // Filter symptoms by category
  const filteredSymptoms = useMemo(() => {
    return SYMPTOM_CATALOG.filter(sym => {
      if (categoryFilter === 'menstrual') {
        return sym.category === 'menstrual' || sym.category === 'symptom';
      }
      if (categoryFilter === 'pcos') {
        return sym.category === 'pcos' || sym.category === 'fertility';
      }
      return true; // all
    });
  }, [categoryFilter]);

  // Calculate highest count for color scaling
  const maxSymptomCount = useMemo(() => {
    let max = 1;
    matrixData.forEach(day => {
      day.symptoms.forEach(entry => {
        if (entry.count > max) max = entry.count;
      });
    });
    return max;
  }, [matrixData]);

  // Overall Baseline Mood
  const overallAvgMood = useMemo(() => {
    if (journalEntries.length === 0) return 5;
    return journalEntries.reduce((acc, curr) => acc + (MOOD_INTENSITY_VALUES[curr.mood] || 5), 0) / journalEntries.length;
  }, [journalEntries]);

  // Key Phase Insights computed from matrix data
  const phaseInsights = useMemo(() => {
    const summary: Record<CyclePhase, { totalSymptoms: number; topSymptoms: Record<string, number>; moods: number[] }> = {
      Menstrual: { totalSymptoms: 0, topSymptoms: {}, moods: [] },
      Follicular: { totalSymptoms: 0, topSymptoms: {}, moods: [] },
      Ovulatory: { totalSymptoms: 0, topSymptoms: {}, moods: [] },
      Luteal: { totalSymptoms: 0, topSymptoms: {}, moods: [] },
      'Extended Follicular': { totalSymptoms: 0, topSymptoms: {}, moods: [] },
    };

    cycleDaysList.forEach(day => {
      const phaseInfo = getCyclePhaseForDayNumber(day);
      const phase = phaseInfo.name as CyclePhase;
      const dayData = matrixData.get(day);
      if (!dayData || !summary[phase]) return;

      dayData.symptoms.forEach((entry, symId) => {
        summary[phase].totalSymptoms += entry.count;
        summary[phase].topSymptoms[symId] = (summary[phase].topSymptoms[symId] || 0) + entry.count;
        summary[phase].moods.push(...entry.moods);
      });
    });

    const getTopSymptom = (phase: CyclePhase) => {
      const pairs = Object.entries(summary[phase].topSymptoms).sort((a, b) => b[1] - a[1]);
      return pairs.length > 0 ? pairs[0] : null;
    };

    return {
      menstrualTop: getTopSymptom('Menstrual'),
      ovulatoryTop: getTopSymptom('Ovulatory'),
      lutealTop: getTopSymptom('Luteal'),
      menstrualAvgMood: summary.Menstrual.moods.length > 0 
        ? (summary.Menstrual.moods.reduce((a, b) => a + b, 0) / summary.Menstrual.moods.length).toFixed(1)
        : null,
      lutealAvgMood: summary.Luteal.moods.length > 0
        ? (summary.Luteal.moods.reduce((a, b) => a + b, 0) / summary.Luteal.moods.length).toFixed(1)
        : null,
    };
  }, [matrixData, cycleDaysList]);

  return (
    <div className={`bg-white border border-matcha-primary/20 rounded-2xl shadow-xs transition-all ${
      isExpanded ? 'fixed inset-4 z-50 overflow-y-auto p-6 bg-white ring-4 ring-black/10' : 'p-4 sm:p-5 space-y-4'
    }`}>
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-matcha-primary/10 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-200">
              <Flame className="w-4 h-4 text-rose-500" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-ink-dark font-display flex items-center gap-2">
              Symptom-by-Cycle-Day Heatmap Matrix
            </h3>
            <span className="text-[10px] font-mono font-bold bg-matcha-primary/15 text-matcha-primary px-2 py-0.5 rounded-full">
              Phase Rhythm Lens
            </span>
            {currentSelectedCycleInfo && (
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Today: Day {currentSelectedCycleInfo.cycleDay} ({currentSelectedCycleInfo.phase})
              </span>
            )}
          </div>
          <p className="text-xs text-[#5D524F]/70">
            Reveals which specific cycle phases (Menstrual, Follicular, Ovulatory, Luteal) trigger physical symptoms, energy dips, and PCOS markers.
          </p>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter Pills */}
          <div className="flex items-center bg-[#FAF0EC]/60 p-0.5 rounded-xl border border-matcha-primary/15 text-[11px] font-mono">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-matcha-primary text-white shadow-2xs'
                  : 'text-[#5D524F]/70 hover:text-ink-dark'
              }`}
            >
              All ({SYMPTOM_CATALOG.length})
            </button>
            <button
              onClick={() => setCategoryFilter('menstrual')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                categoryFilter === 'menstrual'
                  ? 'bg-matcha-primary text-white shadow-2xs'
                  : 'text-[#5D524F]/70 hover:text-ink-dark'
              }`}
            >
              Physical & Flow
            </button>
            <button
              onClick={() => setCategoryFilter('pcos')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                categoryFilter === 'pcos'
                  ? 'bg-matcha-primary text-white shadow-2xs'
                  : 'text-[#5D524F]/70 hover:text-ink-dark'
              }`}
            >
              PCOS & Biomarkers
            </button>
          </div>

          {/* Metric Mode Switcher */}
          <div className="flex items-center bg-[#FAF0EC]/60 p-0.5 rounded-xl border border-matcha-primary/15 text-[11px] font-mono">
            <button
              onClick={() => setMetricMode('occurrences')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                metricMode === 'occurrences'
                  ? 'bg-white text-rose-700 font-bold border border-rose-200 shadow-2xs'
                  : 'text-[#5D524F]/70 hover:text-ink-dark'
              }`}
              title="Tint cells by how many cycles experienced this symptom on this cycle day"
            >
              <span>🔥 Frequency</span>
            </button>
            <button
              onClick={() => setMetricMode('energy')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                metricMode === 'energy'
                  ? 'bg-white text-matcha-primary font-bold border border-matcha-primary/30 shadow-2xs'
                  : 'text-[#5D524F]/70 hover:text-ink-dark'
              }`}
              title="Tint cells by average emotional energy (mood) logged on that cycle day"
            >
              <span>⚡ Mood Energy</span>
            </button>
          </div>

          {/* Expand / Minimize Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-matcha-primary/20 text-[#5D524F]/60 hover:text-matcha-primary hover:bg-[#FAF0EC] transition-colors cursor-pointer"
            title={isExpanded ? 'Minimize View' : 'Expand Fullscreen Matrix'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Cycle Scope Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono bg-[#FAF0EC]/30 p-2.5 rounded-xl border border-matcha-primary/10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-[#5D524F]/60">Cycle History Scope:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCycleScope('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                cycleScope === 'all' ? 'bg-white text-ink-dark border border-matcha-primary/30 shadow-2xs' : 'text-[#5D524F]/60 hover:text-[#5D524F]'
              }`}
            >
              All Historic Cycles ({cycleStarts.length})
            </button>
            <button
              onClick={() => setCycleScope('current')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                cycleScope === 'current' ? 'bg-white text-ink-dark border border-matcha-primary/30 shadow-2xs' : 'text-[#5D524F]/60 hover:text-[#5D524F]'
              }`}
            >
              Current Active Cycle (Since {currentCycleStart.slice(5)})
            </button>
            {previousCycleStart && (
              <button
                onClick={() => setCycleScope('previous')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  cycleScope === 'previous' ? 'bg-white text-ink-dark border border-matcha-primary/30 shadow-2xs' : 'text-[#5D524F]/60 hover:text-[#5D524F]'
                }`}
              >
                Previous Cycle ({previousCycleStart.slice(5)})
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-[#5D524F]/70 flex items-center gap-2">
          <span>Logged logs: <strong className="text-ink-dark font-mono">{scopedLogs.length}</strong></span>
          <span>•</span>
          <span>Baseline Mood: <strong className="text-matcha-primary font-mono">{overallAvgMood.toFixed(1)}/10</strong></span>
        </div>
      </div>

      {/* HEATMAP MATRIX CONTAINER */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[780px] space-y-2">
          
          {/* Phase Header Banners spanning the days */}
          <div className="flex text-[10px] font-mono font-bold tracking-wider uppercase pl-36 gap-1 text-center select-none">
            <div 
              style={{ width: `${(Math.min(cycleSettings.periodLength || 5, cycleDaysTotal) / cycleDaysTotal) * 100}%` }}
              className="bg-rose-100/90 text-rose-800 border border-rose-200/90 rounded-lg py-1 px-1 truncate shadow-2xs"
            >
              🩸 Menstrual (1–{cycleSettings.periodLength || 5})
            </div>
            <div 
              style={{ width: `${((Math.min(12, cycleDaysTotal) - (cycleSettings.periodLength || 5)) / cycleDaysTotal) * 100}%` }}
              className="bg-emerald-100/90 text-emerald-800 border border-emerald-200/90 rounded-lg py-1 px-1 truncate shadow-2xs"
            >
              🌱 Follicular ({(cycleSettings.periodLength || 5) + 1}–12)
            </div>
            <div 
              style={{ width: `${(4 / cycleDaysTotal) * 100}%` }}
              className="bg-orange-100/90 text-orange-900 border border-orange-200/90 rounded-lg py-1 px-1 truncate shadow-2xs"
            >
              ✨ Ovulatory (13–16)
            </div>
            <div 
              style={{ width: `${((cycleDaysTotal - 16) / cycleDaysTotal) * 100}%` }}
              className="bg-purple-100/90 text-purple-900 border border-purple-200/90 rounded-lg py-1 px-1 truncate shadow-2xs"
            >
              🌙 Luteal (17–{cycleDaysTotal})
            </div>
          </div>

          {/* Cycle Day Numbers Row */}
          <div className="flex text-[9px] font-mono text-[#5D524F]/70 pl-36 gap-1 text-center select-none">
            {cycleDaysList.map(dayNum => {
              const phase = getCyclePhaseForDayNumber(dayNum);
              const isToday = currentSelectedCycleInfo?.cycleDay === dayNum;
              return (
                <div 
                  key={`day-header-${dayNum}`} 
                  className={`flex-1 py-0.5 rounded font-bold transition-all ${
                    isToday ? 'bg-amber-400 text-ink-dark font-black ring-2 ring-amber-300 shadow-xs' : 'hover:bg-[#FAF0EC]'
                  }`} 
                  title={`Cycle Day ${dayNum} • ${phase.name} Phase${isToday ? ' (Today)' : ''}`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>

          {/* Matrix Rows (One per symptom) */}
          <div className="space-y-1 pt-1">
            {filteredSymptoms.map(sym => {
              return (
                <div key={sym.id} className="flex items-center gap-1 group hover:bg-[#FAF0EC]/30 rounded-lg p-0.5 transition-colors">
                  {/* Row Label */}
                  <div 
                    className="w-36 text-xs font-semibold text-[#5D524F] flex items-center gap-1.5 shrink-0 pr-2 cursor-help"
                    title={`${sym.label}: ${sym.description}`}
                  >
                    <span className="text-sm shrink-0">{sym.emoji}</span>
                    <span className="truncate text-[11px]">{sym.label}</span>
                    {sym.category === 'pcos' && (
                      <span className="text-[7px] font-mono bg-amber-100 text-amber-800 px-1 py-0.2 rounded-full font-bold uppercase ml-auto shrink-0">
                        PCOS
                      </span>
                    )}
                  </div>

                  {/* Day Cells */}
                  <div className="flex-1 flex gap-1">
                    {cycleDaysList.map(dayNum => {
                      const dayBucket = matrixData.get(dayNum);
                      const symData = dayBucket?.symptoms.get(sym.id);
                      const count = symData?.count || 0;
                      const phase = getCyclePhaseForDayNumber(dayNum);
                      const isToday = currentSelectedCycleInfo?.cycleDay === dayNum;
                      
                      const avgMood = symData && symData.moods.length > 0
                        ? symData.moods.reduce((a, b) => a + b, 0) / symData.moods.length
                        : null;

                      // Color calculation based on active metric
                      let cellClass = 'bg-[#FAF0EC]/20 border-matcha-primary/5 text-transparent';

                      if (count > 0) {
                        if (metricMode === 'occurrences') {
                          const ratio = maxSymptomCount > 0 ? count / maxSymptomCount : 0;
                          if (sym.category === 'pcos' || sym.category === 'fertility') {
                            // Amber / Orange heat for PCOS & fertility
                            cellClass = ratio > 0.6
                              ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-bold'
                              : ratio > 0.3
                                ? 'bg-amber-300 text-amber-950 border-amber-400 font-semibold'
                                : 'bg-amber-100 text-amber-900 border-amber-200';
                          } else {
                            // Rose heat for standard symptoms
                            cellClass = ratio > 0.6
                              ? 'bg-rose-500 text-white border-rose-600 shadow-2xs font-bold'
                              : ratio > 0.3
                                ? 'bg-rose-300 text-rose-950 border-rose-400 font-semibold'
                                : 'bg-rose-100 text-rose-900 border-rose-200';
                          }
                        } else {
                          // Energy / Mood tint
                          if (avgMood !== null) {
                            if (avgMood < overallAvgMood - 0.5) {
                              cellClass = 'bg-rose-200 text-rose-900 border-rose-300 font-bold';
                            } else if (avgMood > overallAvgMood + 0.5) {
                              cellClass = 'bg-emerald-200 text-emerald-900 border-emerald-300 font-bold';
                            } else {
                              cellClass = 'bg-[#FAF0EC] text-[#5D524F] border-matcha-primary/20 font-medium';
                            }
                          } else {
                            cellClass = 'bg-rose-100 text-rose-900 border-rose-200';
                          }
                        }
                      }

                      return (
                        <button
                          key={`sym-${sym.id}-day-${dayNum}`}
                          type="button"
                          onMouseEnter={() => setHoveredCell({
                            dayNum,
                            phaseName: phase.name,
                            phaseEmoji: phase.emoji,
                            symptomDef: sym,
                            count,
                            totalCyclesLogged: dayBucket?.cycleCount || 0,
                            percentage: dayBucket && dayBucket.cycleCount > 0 ? Math.round((count / dayBucket.cycleCount) * 100) : 0,
                            avgMood,
                            dates: symData?.dates || [],
                            isLoggedToday: isToday && count > 0
                          })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => {
                            if (symData?.dates && symData.dates.length > 0 && onSelectDate) {
                              onSelectDate(symData.dates[symData.dates.length - 1]);
                            }
                          }}
                          className={`flex-1 h-6 sm:h-7 rounded-md border flex items-center justify-center text-[10px] font-mono transition-all cursor-pointer hover:scale-120 hover:z-30 relative ${
                            isToday ? 'ring-1 ring-amber-400' : ''
                          } ${cellClass}`}
                        >
                          {count > 0 && (
                            metricMode === 'occurrences' 
                              ? count 
                              : avgMood ? avgMood.toFixed(0) : '•'
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Interactive Tooltip & Legend Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-matcha-primary/10 text-xs">
        {/* Dynamic Cell Inspector Callout */}
        <div className="flex-1 min-h-[38px] flex items-center">
          {hoveredCell ? (
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] animate-in fade-in duration-150">
              <span className="font-bold text-ink-dark flex items-center gap-1">
                <span>{hoveredCell.phaseEmoji}</span>
                <span>Day {hoveredCell.dayNum} ({hoveredCell.phaseName} Phase):</span>
              </span>
              
              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                {hoveredCell.symptomDef.label}: {hoveredCell.count}x
                {hoveredCell.count > 0 && ` (${hoveredCell.percentage}% of tracked cycles)`}
              </span>

              {hoveredCell.avgMood !== null && (
                <span className="bg-matcha-primary/10 text-matcha-primary font-bold px-2 py-0.5 rounded-full">
                  Avg Energy: {hoveredCell.avgMood.toFixed(1)}/10
                </span>
              )}

              {hoveredCell.symptomDef.recommendation && (
                <span className="text-[#5D524F]/70 text-[10px] font-sans italic truncate max-w-[280px]">
                  💡 {hoveredCell.symptomDef.recommendation}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-[#5D524F]/50 font-mono italic">
              Hover over any cell across the {cycleDaysTotal}-day grid to view occurrence frequency, dates, and phase insights
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#5D524F]/70 shrink-0">
          <span>{metricMode === 'occurrences' ? 'Frequency:' : 'Mood Energy:'}</span>
          {metricMode === 'occurrences' ? (
            <>
              <span className="w-3 h-3 rounded-[3px] bg-[#FAF0EC]/30 border border-matcha-primary/10 inline-block" />
              <span>0</span>
              <span className="w-3 h-3 rounded-[3px] bg-rose-100 border border-rose-200 inline-block" />
              <span>1</span>
              <span className="w-3 h-3 rounded-[3px] bg-rose-300 border border-rose-400 inline-block" />
              <span>2</span>
              <span className="w-3 h-3 rounded-[3px] bg-rose-500 border border-rose-600 inline-block" />
              <span>3+</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-[3px] bg-rose-200 border border-rose-300 inline-block" />
              <span>Low (&lt;{overallAvgMood.toFixed(1)})</span>
              <span className="w-3 h-3 rounded-[3px] bg-[#FAF0EC] border border-matcha-primary/20 inline-block" />
              <span>Neutral</span>
              <span className="w-3 h-3 rounded-[3px] bg-emerald-200 border border-emerald-300 inline-block" />
              <span>High (&gt;{overallAvgMood.toFixed(1)})</span>
            </>
          )}
        </div>
      </div>

      {/* 4 Biological Phase Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-rose-700 flex items-center gap-1">
              🩸 Menstrual (Days 1–{cycleSettings.periodLength || 5})
            </span>
            {phaseInsights.menstrualTop && (
              <span className="text-[9px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                Top: {phaseInsights.menstrualTop[0]}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-[#5D524F]">Recovery & Low Prostaglandins</p>
          <p className="text-[11px] text-[#5D524F]/70 leading-relaxed">
            Hormones at biological baseline. Cramping & fatigue concentrate in Days 1–3. Prioritize warmth, magnesium, and gentle restorative work.
          </p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 flex items-center gap-1">
              🌿 Follicular (Days {(cycleSettings.periodLength || 5) + 1}–12)
            </span>
            <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
              Lowest Symptoms
            </span>
          </div>
          <p className="text-xs font-semibold text-[#5D524F]">Estrogen Climbing & Focus</p>
          <p className="text-[11px] text-[#5D524F]/70 leading-relaxed">
            Estrogen stimulates neuroplasticity and dopamine. Minimal physical symptoms. Prime window for content creation, deep planning, and heavy lifting.
          </p>
        </div>

        <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-orange-900 flex items-center gap-1">
              ⚡ Ovulatory (Days 13–16)
            </span>
            {phaseInsights.ovulatoryTop && (
              <span className="text-[9px] font-mono bg-orange-100 text-orange-900 px-1.5 py-0.2 rounded font-bold">
                Top: {phaseInsights.ovulatoryTop[0]}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-[#5D524F]">LH Surge & High Vitality</p>
          <p className="text-[11px] text-[#5D524F]/70 leading-relaxed">
            Peak biological fertility window. High social energy, communicative ease, and occasional Mittelschmerz or mild sugar cravings around Day 14.
          </p>
        </div>

        <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-3 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-purple-700 flex items-center gap-1">
              🌙 Luteal (Days 17–{cycleDaysTotal})
            </span>
            {phaseInsights.lutealTop && (
              <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">
                Top: {phaseInsights.lutealTop[0]}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-[#5D524F]">Progesterone & Pre-Menstrual Care</p>
          <p className="text-[11px] text-[#5D524F]/70 leading-relaxed">
            Progesterone dominant. Late luteal (Days 23–27) triggers sugar cravings and mood sensitivity. Support with stable protein, chromium, and calm boundaries.
          </p>
        </div>
      </div>
    </div>
  );
}
