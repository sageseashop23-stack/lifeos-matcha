import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalEntry, PeriodLog, CycleSettings, PeriodFlow } from '../types';
import { getCycleInfoForDate, calculateCycleCorrelation, CyclePhase } from '../utils/cycleUtils';
import { 
  BookOpen, Calendar as CalendarIcon, Search, Tag, Image, Smile, Trash2, Plus, Clock, BarChart3,
  HeartPulse, Sliders, Info, Activity, Moon, Sparkles, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  ReferenceArea, 
  LineChart, 
  Line, 
  ScatterChart, 
  Scatter,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-matcha-primary/20 p-2.5 rounded-xl shadow-md text-[10px] text-[#5D524F] space-y-1 max-w-[190px]">
        <p className="font-bold flex items-center justify-between gap-1.5 border-b border-matcha-primary/10 pb-1 mb-1 font-sans">
          <span>Cycle Day {data.cycleDay}</span>
          <span className="text-[8px] font-bold bg-matcha-primary/10 text-matcha-primary px-1.5 py-0.2 rounded-full uppercase">
            {data.phase}
          </span>
        </p>
        {data.mood && (
          <p className="font-semibold font-sans">
            Mood: <span className="text-[#5D524F] font-normal">{data.mood}</span>
          </p>
        )}
        {data.moodsText && (
          <p className="font-semibold font-sans">
            Moods: <span className="text-[#5D524F] font-normal">{data.moodsText}</span>
          </p>
        )}
        {data.intensity !== undefined && data.intensity !== null && (
          <p className="font-bold text-amber-600 font-sans">
            Energy Intensity: <span className="text-[#5D524F] font-normal font-mono">{data.intensity}/10</span>
          </p>
        )}
        {data.date && (
          <p className="text-[9px] text-[#5D524F]/60 font-mono">
            Date: {data.date}
          </p>
        )}
        {data.datesText && (
          <p className="text-[9px] text-[#5D524F]/60 font-mono">
            Dates: {data.datesText}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const TrendTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#EBB094]/30 p-2.5 rounded-xl shadow-md text-[10px] text-[#5D524F] space-y-1 max-w-[200px]">
        <p className="font-bold flex items-center justify-between gap-1 border-b border-[#EBB094]/15 pb-1 mb-1 font-sans">
          <span>{data.symptom}</span>
          {data.isPCOS && (
            <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full uppercase font-sans">
              PCOS
            </span>
          )}
        </p>
        <p className="font-semibold">
          Occurrences: <span className="font-normal font-mono">{data.occurrences}x</span>
        </p>
        <p className="font-semibold">
          Avg Emotional Energy: <span className="font-bold text-amber-600 font-mono">{data.avgMood}/10</span>
        </p>
        <p className="font-semibold">
          Impact on Wellbeing: <span className={`font-bold font-mono ${data.impact < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {data.impact > 0 ? `+${data.impact}` : data.impact} pts
          </span>
        </p>
        <p className="text-[9px] text-[#5D524F]/60">
          Peak Phase: <span className="font-medium">{data.peakPhase}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface JournalModuleProps {
  entries: JournalEntry[];
  onAddEntry: (content: string, mood: string, tags: string[], photos: string[], date: string) => void;
  onDeleteEntry: (id: string) => void;
  selectedDate: string; // YYYY-MM-DD format
  periodLogs: PeriodLog[];
  cycleSettings: CycleSettings;
  onSavePeriodLog: (log: Omit<PeriodLog, 'id'>) => void;
  onDeletePeriodLog: (date: string) => void;
  onUpdateCycleSettings: (settings: CycleSettings) => void;
}


const PRESET_MOODS = [
  '🌸 Serene',
  '⚡ Focused',
  '🔋 Energetic',
  '📝 Grateful',
  '😴 Tired',
  '💭 Reflective',
  '🌱 Growing'
];

const PRESET_TAGS = ['Spiritual', 'Business', 'Build', 'Health', 'Reflections', 'Fitness', 'Mindset'];

export default function JournalModule({ 
  entries, 
  onAddEntry, 
  onDeleteEntry, 
  selectedDate,
  periodLogs,
  cycleSettings,
  onSavePeriodLog,
  onDeletePeriodLog,
  onUpdateCycleSettings
}: JournalModuleProps) {
  const DEFAULT_MOODS = [
    '🌸 Serene',
    '⚡ Focused',
    '🔋 Energetic',
    '📝 Grateful',
    '😴 Tired',
    '💭 Reflective',
    '🌱 Growing'
  ];

  const [moodList, setMoodList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_user_moods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MOODS;
  });

  const [isMoodEditorOpen, setIsMoodEditorOpen] = useState(false);
  const [newMoodInput, setNewMoodInput] = useState('');

  const [content, setContent] = useState('');
  const [mood, setMood] = useState(moodList[0] || '🌸 Serene');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string | null>(null);

  // Sync moodList with localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('custom_user_moods', JSON.stringify(moodList));
    } catch (e) {}
  }, [moodList]);

  const handleAddCustomMood = () => {
    const trimmed = newMoodInput.trim();
    if (trimmed && !moodList.includes(trimmed)) {
      const updated = [...moodList, trimmed];
      setMoodList(updated);
      setMood(trimmed);
      setNewMoodInput('');
    }
  };

  const handleDeleteMood = (moodToDelete: string) => {
    if (moodList.length <= 1) return;
    const updated = moodList.filter(m => m !== moodToDelete);
    setMoodList(updated);
    if (mood === moodToDelete) {
      setMood(updated[0]);
    }
  };

  const handleResetDefaultMoods = () => {
    setMoodList(DEFAULT_MOODS);
    setMood(DEFAULT_MOODS[0]);
  };

  // Cycle & Period logging and tab states
  const [activeTab, setActiveTab] = useState<'mood' | 'cycle' | 'correlation' | 'trends'>('mood');
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [tempCycleLength, setTempCycleLength] = useState(cycleSettings.cycleLength);
  const [tempPeriodLength, setTempPeriodLength] = useState(cycleSettings.periodLength);
  const [tempLastPeriodDate, setTempLastPeriodDate] = useState(cycleSettings.lastPeriodDate);
  const [tempPCOSEnabled, setTempPCOSEnabled] = useState(!!cycleSettings.isPCOSEnabled);
  const [tempIrregular, setTempIrregular] = useState(!!cycleSettings.isIrregular);

  // Recharts custom states, mappings, and trend analysis logic
  const [chartType, setChartType] = useState<'line' | 'scatter'>('line');
  const [symptomCategoryFilter, setSymptomCategoryFilter] = useState<'all' | 'standard' | 'pcos'>('all');
  const [trendsChartMetric, setTrendsChartMetric] = useState<'occurrences' | 'wellbeing'>('occurrences');

  const MOOD_INTENSITIES: Record<string, number> = {
    '🌸 Serene': 7,
    '⚡ Focused': 8,
    '🔋 Energetic': 10,
    '📝 Grateful': 8,
    '😴 Tired': 3,
    '💭 Reflective': 6,
    '🌱 Growing': 9,
  };

  const getPhaseForCycleDay = (day: number, cLength: number, pLength: number): string => {
    const half = Math.floor(cLength / 2);
    if (day <= pLength) return 'Menstrual';
    if (day > cLength) return 'Extended Follicular';
    if (day <= half - 2) return 'Follicular';
    if (day <= half + 1) return 'Ovulatory';
    return 'Luteal';
  };

  const phaseRanges = {
    Menstrual: { start: null as number | null, end: null as number | null, color: 'rgba(252, 219, 217, 0.18)', stroke: '#F4B9B8', label: 'Menstrual 🩸' },
    Follicular: { start: null as number | null, end: null as number | null, color: 'rgba(226, 239, 224, 0.18)', stroke: '#A8C69F', label: 'Follicular 🌱' },
    Ovulatory: { start: null as number | null, end: null as number | null, color: 'rgba(253, 241, 235, 0.18)', stroke: '#EBB094', label: 'Ovulatory ✨' },
    Luteal: { start: null as number | null, end: null as number | null, color: 'rgba(242, 234, 240, 0.18)', stroke: '#C2A4B8', label: 'Luteal 🌙' },
    'Extended Follicular': { start: null as number | null, end: null as number | null, color: 'rgba(251, 191, 36, 0.12)', stroke: '#F59E0B', label: 'Extended Follicular ⏳' },
  };

  const scatterData = entries.map(entry => {
    const info = getCycleInfoForDate(entry.date, cycleSettings, periodLogs);
    const intensity = MOOD_INTENSITIES[entry.mood] || 5;
    return {
      cycleDay: info.cycleDay,
      intensity,
      mood: entry.mood,
      date: entry.date,
      phase: info.phase,
      content: entry.content
    };
  }).sort((a, b) => a.cycleDay - b.cycleDay);

  const maxCycleDay = Math.max(
    cycleSettings.cycleLength,
    scatterData.length > 0 ? Math.max(...scatterData.map(d => d.cycleDay)) : cycleSettings.cycleLength,
    getCycleInfoForDate(selectedDate, cycleSettings, periodLogs).cycleDay
  );

  for (let d = 1; d <= maxCycleDay; d++) {
    const phase = getPhaseForCycleDay(d, cycleSettings.cycleLength, cycleSettings.periodLength) as keyof typeof phaseRanges;
    if (phaseRanges[phase]) {
      if (phaseRanges[phase].start === null) {
        phaseRanges[phase].start = d;
      }
      phaseRanges[phase].end = d;
    }
  }

  const lineData = Array.from({ length: maxCycleDay }, (_, i) => {
    const day = i + 1;
    const phase = getPhaseForCycleDay(day, cycleSettings.cycleLength, cycleSettings.periodLength);
    const matchedEntries = scatterData.filter(d => d.cycleDay === day);
    
    if (matchedEntries.length > 0) {
      const avgIntensity = matchedEntries.reduce((sum, item) => sum + item.intensity, 0) / matchedEntries.length;
      const moodsText = matchedEntries.map(e => e.mood).join(', ');
      const datesText = matchedEntries.map(e => e.date).join(', ');
      return {
        cycleDay: day,
        intensity: Math.round(avgIntensity * 10) / 10,
        phase,
        moodsText,
        datesText,
        hasLog: true
      };
    } else {
      return {
        cycleDay: day,
        intensity: null,
        phase,
        hasLog: false
      };
    }
  });

  const getPatternInsight = () => {
    if (scatterData.length < 2) {
      return "Log a few more entries across different phases to view personal cycle-mood patterns!";
    }
    
    const activePhases = scatterData.filter(d => d.phase === 'Follicular' || d.phase === 'Ovulatory');
    const restingPhases = scatterData.filter(d => d.phase === 'Menstrual' || d.phase === 'Luteal' || d.phase === 'Extended Follicular');
    
    if (activePhases.length > 0 && restingPhases.length > 0) {
      const avgActive = activePhases.reduce((sum, d) => sum + d.intensity, 0) / activePhases.length;
      const avgResting = restingPhases.reduce((sum, d) => sum + d.intensity, 0) / restingPhases.length;
      const diff = avgActive - avgResting;
      
      if (Math.abs(diff) >= 0.5) {
        if (diff > 0) {
          return `Estrogen impact: Your emotional energy peaks about ${diff.toFixed(1)} points higher during Follicular & Ovulatory phases. Planning key projects/launches here leverages this peak energy!`;
        } else {
          return `Progesterone reflection: Your emotional energy is about ${Math.abs(diff).toFixed(1)} points higher during Luteal & Menstrual phases. This is an excellent time for inward focus, reflection, and refinement.`;
        }
      }
    }
    return "Balanced adaptiveness: Your emotional energy remains beautifully stable across both estrogen-dominant active phases and progesterone-dominant inward phases.";
  };

  const PRESET_SYMPTOMS = ['Cramping', 'Bloating', 'Headache', 'Fatigue', 'Mood swings', 'Acne', 'Breast tenderness', 'Backache'];

  const currentPeriodLog = periodLogs.find(p => p.date === selectedDate);
  const cycleInfo = getCycleInfoForDate(selectedDate, cycleSettings, periodLogs);
  const correlationData = calculateCycleCorrelation(entries, periodLogs, cycleSettings);

  // Calculate general mood baseline (average of all journal entries)
  const overallAvgMood = entries.length > 0
    ? entries.reduce((sum, e) => sum + (MOOD_INTENSITIES[e.mood] || 5), 0) / entries.length
    : 5;

  // Map all symptoms with their logged occurrences and mood values
  const symptomDataMap: Record<string, { 
    symptomName: string; 
    occurrences: number; 
    moodScores: number[]; 
    isPCOS: boolean;
    phaseCounts: Record<string, number>;
  }> = {};

  periodLogs.forEach(log => {
    // Determine the phase on this day
    const info = getCycleInfoForDate(log.date, cycleSettings, periodLogs);
    const phaseName = info.phase;

    // Journal entry on the exact same date
    const matchedEntry = entries.find(e => e.date === log.date);
    const moodVal = matchedEntry ? (MOOD_INTENSITIES[matchedEntry.mood] || 5) : null;

    // Standard symptoms
    if (log.symptoms) {
      log.symptoms.forEach(sym => {
        if (!symptomDataMap[sym]) {
          symptomDataMap[sym] = { 
            symptomName: sym, 
            occurrences: 0, 
            moodScores: [], 
            isPCOS: false,
            phaseCounts: { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0, 'Extended Follicular': 0 }
          };
        }
        symptomDataMap[sym].occurrences += 1;
        symptomDataMap[sym].phaseCounts[phaseName] = (symptomDataMap[sym].phaseCounts[phaseName] || 0) + 1;
        if (moodVal !== null) {
          symptomDataMap[sym].moodScores.push(moodVal);
        }
      });
    }

    // PCOS symptoms
    if (log.pcosSymptoms) {
      log.pcosSymptoms.forEach(sym => {
        const key = `PCOS: ${sym}`;
        if (!symptomDataMap[key]) {
          symptomDataMap[key] = { 
            symptomName: key, 
            occurrences: 0, 
            moodScores: [], 
            isPCOS: true,
            phaseCounts: { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0, 'Extended Follicular': 0 }
          };
        }
        symptomDataMap[key].occurrences += 1;
        symptomDataMap[key].phaseCounts[phaseName] = (symptomDataMap[key].phaseCounts[phaseName] || 0) + 1;
        if (moodVal !== null) {
          symptomDataMap[key].moodScores.push(moodVal);
        }
      });
    }
  });

  // Convert map to list and calculate averages
  const rawSymptomTrendsList = Object.values(symptomDataMap).map(item => {
    const avgMood = item.moodScores.length > 0 
      ? Math.round((item.moodScores.reduce((a, b) => a + b, 0) / item.moodScores.length) * 10) / 10
      : Math.round(overallAvgMood * 10) / 10; // default to baseline if no mood logged on symptom days
    
    // Find peak phase
    let peakPhase = 'None';
    let maxPhaseCount = 0;
    Object.entries(item.phaseCounts).forEach(([ph, count]) => {
      if (count > maxPhaseCount) {
        maxPhaseCount = count;
        peakPhase = ph;
      }
    });

    return {
      symptom: item.symptomName,
      occurrences: item.occurrences,
      avgMood,
      isPCOS: item.isPCOS,
      peakPhase: maxPhaseCount > 0 ? `${peakPhase}` : 'N/A',
      impact: Math.round((avgMood - overallAvgMood) * 10) / 10
    };
  });

  // Apply filters
  const filteredSymptomTrendsList = rawSymptomTrendsList.filter(item => {
    if (symptomCategoryFilter === 'standard') return !item.isPCOS;
    if (symptomCategoryFilter === 'pcos') return item.isPCOS;
    return true; // 'all'
  }).sort((a, b) => b.occurrences - a.occurrences); // sort by occurrence count

  const handleToggleSymptom = (symptom: string) => {
    const currentSymptoms = currentPeriodLog?.symptoms || [];
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter(s => s !== symptom)
      : [...currentSymptoms, symptom];
    
    onSavePeriodLog({
      date: selectedDate,
      flow: currentPeriodLog?.flow || 'None',
      symptoms: newSymptoms,
      notes: currentPeriodLog?.notes || '',
      lhTest: currentPeriodLog?.lhTest || 'Not Tested',
      basalBodyTemp: currentPeriodLog?.basalBodyTemp,
      cervicalMucus: currentPeriodLog?.cervicalMucus || 'None',
      pcosSymptoms: currentPeriodLog?.pcosSymptoms || []
    });
  };

  const handleFlowChange = (newFlow: PeriodFlow) => {
    onSavePeriodLog({
      date: selectedDate,
      flow: newFlow,
      symptoms: currentPeriodLog?.symptoms || [],
      notes: currentPeriodLog?.notes || '',
      lhTest: currentPeriodLog?.lhTest || 'Not Tested',
      basalBodyTemp: currentPeriodLog?.basalBodyTemp,
      cervicalMucus: currentPeriodLog?.cervicalMucus || 'None',
      pcosSymptoms: currentPeriodLog?.pcosSymptoms || []
    });
  };

  const handleNotesChange = (newNotes: string) => {
    onSavePeriodLog({
      date: selectedDate,
      flow: currentPeriodLog?.flow || 'None',
      symptoms: currentPeriodLog?.symptoms || [],
      notes: newNotes,
      lhTest: currentPeriodLog?.lhTest || 'Not Tested',
      basalBodyTemp: currentPeriodLog?.basalBodyTemp,
      cervicalMucus: currentPeriodLog?.cervicalMucus || 'None',
      pcosSymptoms: currentPeriodLog?.pcosSymptoms || []
    });
  };

  const handleTogglePCOSSymptom = (symptom: string) => {
    const currentPCOSSymptoms = currentPeriodLog?.pcosSymptoms || [];
    const newPCOSSymptoms = currentPCOSSymptoms.includes(symptom)
      ? currentPCOSSymptoms.filter(s => s !== symptom)
      : [...currentPCOSSymptoms, symptom];
    
    onSavePeriodLog({
      date: selectedDate,
      flow: currentPeriodLog?.flow || 'None',
      symptoms: currentPeriodLog?.symptoms || [],
      notes: currentPeriodLog?.notes || '',
      lhTest: currentPeriodLog?.lhTest || 'Not Tested',
      basalBodyTemp: currentPeriodLog?.basalBodyTemp,
      cervicalMucus: currentPeriodLog?.cervicalMucus || 'None',
      pcosSymptoms: newPCOSSymptoms
    });
  };

  const handleLHChange = (newLh: any) => {
    onSavePeriodLog({
      date: selectedDate,
      flow: currentPeriodLog?.flow || 'None',
      symptoms: currentPeriodLog?.symptoms || [],
      notes: currentPeriodLog?.notes || '',
      lhTest: newLh,
      basalBodyTemp: currentPeriodLog?.basalBodyTemp,
      cervicalMucus: currentPeriodLog?.cervicalMucus || 'None',
      pcosSymptoms: currentPeriodLog?.pcosSymptoms || []
    });
  };

  const handleBBTChange = (newBBT: number | undefined) => {
    onSavePeriodLog({
      date: selectedDate,
      flow: currentPeriodLog?.flow || 'None',
      symptoms: currentPeriodLog?.symptoms || [],
      notes: currentPeriodLog?.notes || '',
      lhTest: currentPeriodLog?.lhTest || 'Not Tested',
      basalBodyTemp: newBBT,
      cervicalMucus: currentPeriodLog?.cervicalMucus || 'None',
      pcosSymptoms: currentPeriodLog?.pcosSymptoms || []
    });
  };

  const handleMucusChange = (newMucus: any) => {
    onSavePeriodLog({
      date: selectedDate,
      flow: currentPeriodLog?.flow || 'None',
      symptoms: currentPeriodLog?.symptoms || [],
      notes: currentPeriodLog?.notes || '',
      lhTest: currentPeriodLog?.lhTest || 'Not Tested',
      basalBodyTemp: currentPeriodLog?.basalBodyTemp,
      cervicalMucus: newMucus,
      pcosSymptoms: currentPeriodLog?.pcosSymptoms || []
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCycleSettings({
      cycleLength: Number(tempCycleLength),
      periodLength: Number(tempPeriodLength),
      lastPeriodDate: tempLastPeriodDate,
      isPCOSEnabled: tempPCOSEnabled,
      isIrregular: tempIrregular
    });
    setShowSettingsForm(false);
  };

  const MOOD_META: Record<string, { bg: string; text: string; gradient: string; border: string }> = {
    '🌸 Serene': { bg: 'bg-[#F4B9B8]', text: 'text-[#5D524F]', gradient: 'from-[#F4B9B8] to-[#FCDBD9]', border: 'border-[#F4B9B8]/40' },
    '⚡ Focused': { bg: 'bg-[#A8C69F]', text: 'text-[#5D524F]', gradient: 'from-[#A8C69F] to-[#C8DEC3]', border: 'border-[#A8C69F]/40' },
    '🔋 Energetic': { bg: 'bg-[#EBB094]', text: 'text-[#5D524F]', gradient: 'from-[#EBB094] to-[#F5D1C3]', border: 'border-[#EBB094]/40' },
    '📝 Grateful': { bg: 'bg-[#D6C7A1]', text: 'text-[#5D524F]', gradient: 'from-[#D6C7A1] to-[#EBE2CD]', border: 'border-[#D6C7A1]/40' },
    '😴 Tired': { bg: 'bg-[#A6ADB5]', text: 'text-[#5D524F]', gradient: 'from-[#A6ADB5] to-[#CCD2D9]', border: 'border-[#A6ADB5]/40' },
    '💭 Reflective': { bg: 'bg-[#C2A4B8]', text: 'text-[#5D524F]', gradient: 'from-[#C2A4B8] to-[#E5D7E1]', border: 'border-[#C2A4B8]/40' },
    '🌱 Growing': { bg: 'bg-[#8FA89B]', text: 'text-[#5D524F]', gradient: 'from-[#8FA89B] to-[#BACBC2]', border: 'border-[#8FA89B]/40' },
  };

  const getMoodColor = (m: string) => {
    return MOOD_META[m] || { bg: 'bg-[#A8C69F]', text: 'text-[#5D524F]', gradient: 'from-[#A8C69F] to-[#C8DEC3]', border: 'border-[#A8C69F]/40' };
  };

  // Handle photo file selection (Base64 encoding)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleQuickAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddEntry(content, mood, tags, photos, selectedDate);
    setContent('');
    setTags([]);
    setPhotos([]);
  };

  // Base entries matching search & tag filter (for distribution calculation)
  const baseFilteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.date.includes(searchQuery);
    const matchesTag = filterTag ? entry.tags.includes(filterTag) : true;
    return matchesSearch && matchesTag;
  });

  // Fully filtered entries (also matching the selected mood filter)
  const filteredEntries = filterMood 
    ? baseFilteredEntries.filter(entry => entry.mood === filterMood)
    : baseFilteredEntries;

  // Calculate mood counts on current base selection
  const moodCounts: Record<string, number> = {};
  baseFilteredEntries.forEach(entry => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  const totalBaseCount = baseFilteredEntries.length;

  // Prepare distribution data list
  const moodDistribution = Object.entries(moodCounts)
    .map(([moodName, count]) => ({
      mood: moodName,
      count,
      percentage: totalBaseCount > 0 ? Math.round((count / totalBaseCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white border border-matcha-primary/20 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full text-[#5D524F]" id="journal-module-container">
      {/* Header Banner */}
      <div className="bg-[#FAF0EC]/60 border-b border-matcha-primary/20 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-strawberry-accent drop-shadow-[0_0_8px_rgba(244,185,184,0.5)]" />
          <div>
            <h2 className="text-lg font-bold tracking-tight font-sans text-[#5D524F]">Digital Sanctuary Journal</h2>
            <p className="text-xs text-[#5D524F]/70">Write freely, secure and private</p>
          </div>
        </div>
        <div className="text-xs bg-white text-[#5D524F]/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-matcha-primary/20 shadow-xs">
          <CalendarIcon className="w-3.5 h-3.5 text-matcha-primary" />
          <span className="font-medium">Journaling for {selectedDate}</span>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (5 cols): Analytics Tabs & New Entry Creation */}
          <div className="lg:col-span-5 space-y-6">
            {/* Analytics & Cycle Section Tabs */}
        <div className="bg-[#FAF0EC]/60 border border-matcha-primary/20 rounded-xl p-4 space-y-4 shadow-xs">
          {/* Tab Navigation */}
          <div className="flex border-b border-matcha-primary/10 pb-2 gap-2 text-xs font-semibold overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('mood')}
              className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeTab === 'mood'
                  ? 'border-matcha-primary text-matcha-primary font-bold'
                  : 'border-transparent text-[#5D524F]/60 hover:text-[#5D524F]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Moods</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cycle')}
              className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeTab === 'cycle'
                  ? 'border-matcha-primary text-matcha-primary font-bold'
                  : 'border-transparent text-[#5D524F]/60 hover:text-[#5D524F]'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
              <span>Cycle Tracker</span>
              {currentPeriodLog && currentPeriodLog.flow !== 'None' && (
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('correlation')}
              className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeTab === 'correlation'
                  ? 'border-matcha-primary text-matcha-primary font-bold'
                  : 'border-transparent text-[#5D524F]/60 hover:text-[#5D524F]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cycle Correlation</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeTab === 'trends'
                  ? 'border-matcha-primary text-matcha-primary font-bold'
                  : 'border-transparent text-[#5D524F]/60 hover:text-[#5D524F]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#EBB094]" />
              <span>Symptom Trends</span>
            </button>
          </div>

          {/* TAB CONTENT: Mood Distribution */}
          {activeTab === 'mood' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-matcha-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5D524F]">Mood Analytics</span>
                </div>
                {filterMood && (
                  <button
                    type="button"
                    onClick={() => setFilterMood(null)}
                    className="text-[10px] text-matcha-primary hover:text-[#97b58e] font-bold bg-white px-2 py-0.5 rounded-full border border-matcha-primary/20 shadow-xs cursor-pointer"
                  >
                    Clear Filter ({filterMood})
                  </button>
                )}
                {!filterMood && (
                  <span className="text-[10px] text-[#5D524F]/60 font-mono">
                    {totalBaseCount} matching
                  </span>
                )}
              </div>

              {totalBaseCount > 0 ? (
                <div className="space-y-3">
                  {/* Stacked Horizontal Progress Bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#EAE0DC] border border-matcha-primary/10 shadow-inner">
                    {moodDistribution.map(({ mood: m, percentage }) => {
                      const colors = getMoodColor(m);
                      return (
                        <div
                          key={m}
                          style={{ width: `${percentage}%` }}
                          className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                          title={`${m}: ${percentage}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Grid of moods with percentages */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {moodDistribution.map(({ mood: m, count, percentage }) => {
                      const colors = getMoodColor(m);
                      const isActive = filterMood === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFilterMood(isActive ? null : m)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] transition-all cursor-pointer ${
                            isActive
                              ? `bg-matcha-primary border-matcha-primary text-white shadow-sm ring-1 ring-matcha-primary/30`
                              : filterMood 
                                ? `opacity-40 hover:opacity-80 bg-white border-matcha-primary/10 text-[#5D524F]/50`
                                : `bg-white border-matcha-primary/20 text-[#5D524F] hover:bg-[#FAF0EC]/60 hover:border-matcha-primary/40`
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                          <span className="font-semibold">{m}</span>
                          <span className="text-[10px] font-mono opacity-80 bg-[#FAF0EC]/80 px-1 py-0.5 rounded-full text-[#5D524F]">
                            {count} ({percentage}%)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-white/40 border border-dashed border-matcha-primary/20 rounded-lg">
                  <p className="text-xs text-[#5D524F]/70">No entries match your filters to calculate analytics.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Cycle Tracker */}
          {activeTab === 'cycle' && (
            <div className="space-y-4">
              {/* Selected Day Status */}
              <div className="flex items-start justify-between gap-3 bg-white p-3 rounded-xl border border-matcha-primary/10 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-base">{cycleInfo.phaseEmoji}</span>
                    <span className="text-xs font-bold text-[#5D524F]">Cycle Day {cycleInfo.cycleDay}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${cycleInfo.phaseBg} ${cycleInfo.phaseColor} border ${cycleInfo.phaseBorder}`}>
                      {cycleInfo.phase} Phase
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5D524F]/80 leading-normal">
                    {cycleInfo.phaseDescription}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5 text-[10px] text-[#5D524F]/60">
                    <span className="font-mono">Conception Chance:</span>
                    <span className={`font-bold uppercase ${
                      cycleInfo.chanceOfConception === 'High' ? 'text-amber-600 font-bold' :
                      cycleInfo.chanceOfConception === 'Medium' ? 'text-emerald-600 font-bold' : 'text-[#5D524F]/60'
                    }`}>
                      {cycleInfo.chanceOfConception}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempCycleLength(cycleSettings.cycleLength);
                    setTempPeriodLength(cycleSettings.periodLength);
                    setTempLastPeriodDate(cycleSettings.lastPeriodDate);
                    setShowSettingsForm(!showSettingsForm);
                  }}
                  className="p-1.5 hover:bg-[#FAF0EC]/60 rounded-lg text-[#5D524F]/60 hover:text-matcha-primary transition-colors cursor-pointer shrink-0"
                  title="Configure Cycle Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              {/* Configure Settings Form (Collapsible) */}
              {showSettingsForm && (
                <form onSubmit={handleSaveSettings} className="bg-white p-3.5 rounded-xl border border-matcha-primary/10 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xs">
                  <div className="flex items-center justify-between border-b border-matcha-primary/10 pb-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#5D524F]">Cycle Calibration</span>
                    <button 
                      type="button" 
                      onClick={() => setShowSettingsForm(false)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-[#5D524F]/80 block font-bold">LMP Date</label>
                      <input
                        type="date"
                        value={tempLastPeriodDate}
                        onChange={(e) => setTempLastPeriodDate(e.target.value)}
                        className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-matcha-primary font-mono text-[10px]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#5D524F]/80 block font-bold">Expected Length</label>
                      <input
                        type="number"
                        min="20"
                        max="90"
                        value={tempCycleLength}
                        onChange={(e) => setTempCycleLength(Number(e.target.value))}
                        className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-matcha-primary font-mono text-[10px]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#5D524F]/80 block font-bold">Period Days</label>
                      <input
                        type="number"
                        min="2"
                        max="15"
                        value={tempPeriodLength}
                        onChange={(e) => setTempPeriodLength(Number(e.target.value))}
                        className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-matcha-primary font-mono text-[10px]"
                        required
                      />
                    </div>
                  </div>

                  {/* PCOS and Irregular Cycle Options */}
                  <div className="space-y-2 border-t border-matcha-primary/5 pt-2.5">
                    <label className="text-[10px] font-bold uppercase text-[#5D524F]/60 block tracking-wider font-mono">Specialized Algorithms</label>
                    
                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={tempPCOSEnabled}
                          onChange={(e) => setTempPCOSEnabled(e.target.checked)}
                          className="mt-0.5 rounded border-matcha-primary/25 text-matcha-primary focus:ring-matcha-primary"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#5D524F]">PCOS Adaptive Tracking</span>
                          <p className="text-[10px] text-[#5D524F]/70 leading-tight">
                            Enables continuous non-wrapping cycle days, custom ovulation markers (LH & BBT), and localized clinical symptom logs.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={tempIrregular}
                          onChange={(e) => setTempIrregular(e.target.checked)}
                          className="mt-0.5 rounded border-matcha-primary/25 text-matcha-primary focus:ring-matcha-primary"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#5D524F]">Highly Irregular Cycle Mode</span>
                          <p className="text-[10px] text-[#5D524F]/70 leading-tight">
                            Removes standard mathematical assumptions and maps ovulation indicators directly from physical logs.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-matcha-primary hover:bg-[#97b58e] text-white py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Save Calibration
                  </button>
                </form>
              )}

              {/* Interactive Period Logging */}
              <div className="space-y-3.5 border-t border-matcha-primary/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/80">Log cycle details ({selectedDate})</span>
                  {currentPeriodLog && (
                    <button
                      type="button"
                      onClick={() => onDeletePeriodLog(selectedDate)}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      Clear day details
                    </button>
                  )}
                </div>

                {/* Flow selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#5D524F]/60 font-bold">Menstrual Flow</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['None', 'Light', 'Medium', 'Heavy'] as PeriodFlow[]).map((f) => {
                      const isActive = (currentPeriodLog?.flow || 'None') === f;
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleFlowChange(f)}
                          className={`py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                            isActive
                              ? f === 'None'
                                ? 'bg-[#5D524F] text-white border-[#5D524F]'
                                : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                              : 'bg-white text-[#5D524F] border-matcha-primary/15 hover:bg-[#FAF0EC]/40'
                          }`}
                        >
                          {f === 'None' ? 'None' : f}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Symptoms toggles */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#5D524F]/60 font-bold">Symptoms Today</label>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_SYMPTOMS.map((sym) => {
                      const hasSymptom = currentPeriodLog?.symptoms.includes(sym) || false;
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleToggleSymptom(sym)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-all cursor-pointer ${
                            hasSymptom
                              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                              : 'bg-white border-matcha-primary/15 text-[#5D524F]/80 hover:bg-[#FAF0EC]/40'
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PCOS and Ovulation Biomarkers Tracker */}
                {(cycleSettings.isPCOSEnabled || cycleSettings.isIrregular) && (
                  <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-500/15 space-y-3.5 mt-2">
                    <div className="flex items-center gap-1.5 border-b border-amber-500/10 pb-1.5">
                      <span className="text-xs">🧬</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">PCOS & Ovulation Biomarkers</span>
                    </div>

                    {/* LH Test result */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-amber-900/70 font-bold">LH Ovulation Strip</label>
                        <span className="text-[9px] text-[#5D524F]/50">(detects surge)</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {['Not Tested', 'Negative', 'Positive', 'High', 'Peak'].map((lh) => {
                          const isActive = (currentPeriodLog?.lhTest || 'Not Tested') === lh;
                          const colors: Record<string, string> = {
                            'Not Tested': 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                            'Negative': 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
                            'Positive': 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                            'High': 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
                            'Peak': 'bg-purple-500 border-purple-500 text-white shadow-xs hover:bg-purple-600'
                          };
                          return (
                            <button
                              key={lh}
                              type="button"
                              onClick={() => handleLHChange(lh)}
                              className={`py-0.5 rounded text-[10px] font-semibold border text-center transition-all cursor-pointer ${
                                isActive 
                                  ? lh === 'Peak' ? colors['Peak'] : 'bg-white border-[#5D524F] font-bold text-ink-dark'
                                  : 'bg-white border-matcha-primary/10 text-[#5D524F]/70 hover:bg-amber-50/50'
                              }`}
                            >
                              {lh === 'Not Tested' ? 'None' : lh}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* BBT & Mucus Split Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Basal Body Temperature */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-amber-900/70 block font-bold">Basal Body Temp</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 36.6 or 97.8"
                            value={currentPeriodLog?.basalBodyTemp || ''}
                            onChange={(e) => handleBBTChange(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] placeholder-[#5D524F]/30 focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                          />
                          <span className="absolute right-2.5 top-2 text-[9px] font-mono text-[#5D524F]/40">°C / °F</span>
                        </div>
                      </div>

                      {/* Cervical Mucus */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-amber-900/70 block font-bold">Cervical Mucus</label>
                        <select
                          value={currentPeriodLog?.cervicalMucus || 'None'}
                          onChange={(e) => handleMucusChange(e.target.value as any)}
                          className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                        >
                          <option value="None">None</option>
                          <option value="Dry">Dry 🏜️</option>
                          <option value="Sticky">Sticky 🧴</option>
                          <option value="Creamy">Creamy 🧴</option>
                          <option value="Egg-white">Egg-white (Fertile) 🥚</option>
                          <option value="Watery">Watery (Fertile) 💧</option>
                        </select>
                      </div>
                    </div>

                    {/* PCOS Custom Symptoms Grid */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-amber-900/70 block font-bold">PCOS-Specific Symptoms</label>
                      <div className="flex flex-wrap gap-1">
                        {[
                          'Hirsutism',
                          'Hormonal Acne',
                          'Hair Thinning',
                          'Ovarian Pain',
                          'Sugar Cravings',
                          'Brain Fog'
                        ].map((sym) => {
                          const hasSymptom = currentPeriodLog?.pcosSymptoms?.includes(sym) || false;
                          return (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => handleTogglePCOSSymptom(sym)}
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all cursor-pointer ${
                                hasSymptom
                                  ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
                                  : 'bg-white border-matcha-primary/10 text-[#5D524F]/80 hover:bg-[#FAF0EC]/40'
                              }`}
                            >
                              {sym}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PCOS local helper */}
                    <p className="text-[9px] text-amber-800/80 leading-normal bg-amber-50 rounded-lg p-2 border border-amber-200/40">
                      💡 <strong>Clinical Tip:</strong> Tracking ovulation via Basal Body Temp (a ~0.3°C / 0.5°F thermal shift for 3+ days) and egg-white cervical fluid is highly recommended in irregular or PCOS cycles to verify if ovulation occurred.
                    </p>
                  </div>
                )}

                {/* Custom notes for period */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#5D524F]/60 font-bold block">Internal Cycle Notes</label>
                  <input
                    type="text"
                    value={currentPeriodLog?.notes || ''}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Energy levels, physical observations, or cravings..."
                    className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-[#5D524F] placeholder-[#5D524F]/40 focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Correlation Dashboard */}
          {activeTab === 'correlation' && (
            <div className="space-y-4">
              <div className="flex items-start gap-1.5 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-[#5D524F] leading-normal shadow-xs">
                <Info className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <p>
                  See how your emotional cycles correlate with your physical cycles. We calculate the mathematical occurrence of mood logs in each menstrual phase.
                </p>
              </div>

              {/* RECHARTS VISUALIZATION PANEL */}
              <div className="bg-white border border-matcha-primary/15 rounded-xl p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#5D524F] uppercase tracking-wide">
                      Cycle-Mood Intensity Mapping
                    </h4>
                    <p className="text-[10px] text-[#5D524F]/60">
                      Emotional energy rating (1-10) plotted over the {cycleSettings.cycleLength}-day cycle
                    </p>
                  </div>
                  {/* Selector Toggle */}
                  <div className="flex bg-[#FAF0EC]/60 border border-matcha-primary/10 rounded-lg p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setChartType('line')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        chartType === 'line'
                          ? 'bg-matcha-primary text-white shadow-xs'
                          : 'text-[#5D524F]/60 hover:text-[#5D524F]'
                      }`}
                    >
                      Line Trend
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartType('scatter')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        chartType === 'scatter'
                          ? 'bg-matcha-primary text-white shadow-xs'
                          : 'text-[#5D524F]/60 hover:text-[#5D524F]'
                      }`}
                    >
                      Scatter Logs
                    </button>
                  </div>
                </div>

                {/* THE GRAPH */}
                <div className="w-full h-[180px] text-[10px] select-none font-mono relative">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart
                        data={lineData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,198,159,0.15)" />
                        <XAxis 
                          dataKey="cycleDay" 
                          domain={[1, cycleSettings.cycleLength]} 
                          tickCount={8}
                          stroke="#5D524F"
                          opacity={0.6}
                        />
                        <YAxis 
                          domain={[1, 10]} 
                          tickCount={5}
                          stroke="#5D524F"
                          opacity={0.6}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        
                        {/* Shaded Phase Backgrounds */}
                        {Object.entries(phaseRanges).map(([phaseName, range]) => {
                          if (range.start === null || range.end === null) return null;
                          return (
                            <ReferenceArea
                              key={phaseName}
                              {...({
                                x1: range.start,
                                x2: range.end,
                                y1: 1,
                                y2: 10,
                                fill: range.color,
                                stroke: range.stroke,
                                strokeOpacity: 0.15
                              } as any)}
                            />
                          );
                        })}

                        <Line
                          type="monotone"
                          dataKey="intensity"
                          stroke="#8FA89B"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#5D524F', stroke: '#fff', strokeWidth: 1.5 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          connectNulls
                        />
                      </LineChart>
                    ) : (
                      <ScatterChart
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,198,159,0.15)" />
                        <XAxis 
                          type="number"
                          dataKey="cycleDay" 
                          name="Cycle Day"
                          domain={[1, cycleSettings.cycleLength]} 
                          tickCount={8}
                          stroke="#5D524F"
                          opacity={0.6}
                        />
                        <YAxis 
                          type="number"
                          dataKey="intensity" 
                          name="Intensity"
                          domain={[1, 10]} 
                          tickCount={5}
                          stroke="#5D524F"
                          opacity={0.6}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        
                        {/* Shaded Phase Backgrounds */}
                        {Object.entries(phaseRanges).map(([phaseName, range]) => {
                          if (range.start === null || range.end === null) return null;
                          return (
                            <ReferenceArea
                              key={phaseName}
                              {...({
                                x1: range.start,
                                x2: range.end,
                                y1: 1,
                                y2: 10,
                                fill: range.color,
                                stroke: range.stroke,
                                strokeOpacity: 0.15
                              } as any)}
                            />
                          );
                        })}

                        <Scatter 
                          name="Mood intensity logs" 
                          data={scatterData} 
                          fill="#EBB094"
                          line={false}
                          shape={(props: any) => {
                            const { cx, cy, payload } = props;
                            return (
                              <g transform={`translate(${cx - 8},${cy - 8})`}>
                                <circle cx="8" cy="8" r="6" fill="#8FA89B" stroke="#fff" strokeWidth="1.5" />
                                <text x="8" y="11" textAnchor="middle" fontSize="8px" fill="#fff" fontWeight="bold">
                                  {payload.mood ? payload.mood.charAt(0) : ''}
                                </text>
                              </g>
                            );
                          }}
                        />
                      </ScatterChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Micro-legend */}
                <div className="flex flex-wrap gap-2.5 justify-center text-[9px] pt-1 border-t border-matcha-primary/5">
                  {Object.entries(phaseRanges).map(([phaseName, range]) => (
                    <div key={phaseName} className="flex items-center gap-1.5 font-bold uppercase text-[#5D524F]/70">
                      <span className="w-2.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: range.stroke }} />
                      <span>{range.label} (Days {range.start}-{range.end})</span>
                    </div>
                  ))}
                </div>

                {/* Insight block */}
                <div className="bg-[#FAF0EC]/40 border border-matcha-primary/10 rounded-lg p-2 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-matcha-primary mt-0.5 shrink-0" />
                  <p className="text-[10px] text-[#5D524F] leading-normal font-semibold">
                    {getPatternInsight()}
                  </p>
                </div>
              </div>

              {/* List of phases and moods */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {correlationData.map((phase) => {
                  const hasMoodData = phase.moodCounts.length > 0;
                  const hasSymptomData = phase.symptomsCount.length > 0;
                  
                  // Phase style mappings
                  const phaseStyle = 
                    phase.phase === 'Menstrual' ? { color: 'text-rose-700', bg: 'bg-rose-50/70', border: 'border-rose-200/60', textBg: 'bg-rose-100/50' } :
                    phase.phase === 'Follicular' ? { color: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200/60', textBg: 'bg-emerald-100/50' } :
                    phase.phase === 'Ovulatory' ? { color: 'text-amber-700', bg: 'bg-amber-50/70', border: 'border-amber-200/60', textBg: 'bg-amber-100/50' } :
                    { color: 'text-purple-700', bg: 'bg-purple-50/70', border: 'border-purple-200/60', textBg: 'bg-purple-100/50' };

                  return (
                    <div 
                      key={phase.phase} 
                      className={`p-3 rounded-xl border ${phaseStyle.bg} ${phaseStyle.border} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{phase.emoji}</span>
                          <span className={`text-xs font-bold uppercase tracking-wide ${phaseStyle.color}`}>
                            {phase.phase} Phase
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#5D524F]/70">
                          {phase.entriesCount} logged {phase.entriesCount === 1 ? 'day' : 'days'}
                        </span>
                      </div>

                      {/* Mood Correlation */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#5D524F]/50 block">Dominant Moods</span>
                        {hasMoodData ? (
                          <div className="flex flex-wrap gap-1">
                            {phase.moodCounts.slice(0, 3).map((mc) => (
                              <span 
                                key={mc.mood} 
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#5D524F] ${phaseStyle.textBg}`}
                              >
                                {mc.mood}: <span className="font-bold ml-1">{mc.percentage}%</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#5D524F]/50 italic">No mood entries logged during this phase yet.</p>
                        )}
                      </div>

                      {/* Symptoms Correlation */}
                      <div className="space-y-1 pt-0.5">
                        <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#5D524F]/50 block">Common Symptoms</span>
                        {hasSymptomData ? (
                          <div className="flex flex-wrap gap-1">
                            {phase.symptomsCount.slice(0, 3).map((sc) => (
                              <span 
                                key={sc.symptom} 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-[#5D524F] border border-matcha-primary/10"
                              >
                                {sc.symptom} <span className="text-[9px] font-mono font-bold text-[#5D524F]/60 ml-1">({sc.count}x)</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#5D524F]/50 italic">No symptoms tracked in this phase.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Symptom Trends Dashboard */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="flex items-start gap-1.5 bg-[#FAF0EC]/60 p-2.5 rounded-lg border border-matcha-primary/20 text-[11px] text-[#5D524F] leading-normal shadow-xs">
                <Info className="w-3.5 h-3.5 text-strawberry-accent mt-0.5 shrink-0" />
                <p>
                  Explore how physical symptoms impact your daily emotional wellbeing. Identify cyclical triggers, track PCOS patterns, and verify how physical state correlates with your overall energy level.
                </p>
              </div>

              {/* Symptom categories selection and Chart Mode Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-matcha-primary/10 rounded-xl p-3 shadow-xs">
                {/* Category Filter */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#5D524F]/50 block">Symptom Type</span>
                  <div className="flex bg-[#FAF0EC]/60 border border-matcha-primary/10 rounded-lg p-0.5 text-[10px] font-bold">
                    {(['all', 'standard', 'pcos'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSymptomCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          symptomCategoryFilter === cat
                            ? 'bg-matcha-primary text-white shadow-xs'
                            : 'text-[#5D524F]/60 hover:text-[#5D524F]'
                        }`}
                      >
                        {cat === 'all' ? 'All' : cat === 'standard' ? 'Standard' : 'PCOS'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metric Selector */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#5D524F]/50 block">Chart Metric</span>
                  <div className="flex bg-[#FAF0EC]/60 border border-matcha-primary/10 rounded-lg p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTrendsChartMetric('occurrences')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        trendsChartMetric === 'occurrences'
                          ? 'bg-matcha-primary text-white shadow-xs'
                          : 'text-[#5D524F]/60 hover:text-[#5D524F]'
                      }`}
                    >
                      Log Frequency
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendsChartMetric('wellbeing')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        trendsChartMetric === 'wellbeing'
                          ? 'bg-matcha-primary text-white shadow-xs'
                          : 'text-[#5D524F]/60 hover:text-[#5D524F]'
                      }`}
                    >
                      Wellbeing Score
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Most Frequent Catalyst */}
                <div className="bg-white border border-matcha-primary/15 p-3 rounded-xl shadow-xs space-y-1.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#5D524F]/50 font-bold block">Most Frequent Physical Symptom</span>
                  {filteredSymptomTrendsList.length > 0 ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-[#5D524F]">{filteredSymptomTrendsList[0].symptom}</span>
                        <p className="text-[10px] text-[#5D524F]/60">Peaks in phase: <strong className="text-matcha-primary">{filteredSymptomTrendsList[0].peakPhase}</strong></p>
                      </div>
                      <span className="text-xs font-bold font-mono bg-strawberry-accent/10 text-strawberry-accent px-2 py-0.5 rounded-full">
                        {filteredSymptomTrendsList[0].occurrences}x logged
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#5D524F]/50 italic">No symptoms logged for this filter yet.</p>
                  )}
                </div>

                {/* Wellbeing Drop Leader */}
                <div className="bg-white border border-matcha-primary/15 p-3 rounded-xl shadow-xs space-y-1.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#5D524F]/50 font-bold block">Highest Mood/Wellbeing Impact</span>
                  {filteredSymptomTrendsList.length > 0 ? (
                    (() => {
                      // Find the one with the lowest avgMood (or the highest negative impact)
                      const impactLeader = [...filteredSymptomTrendsList].sort((a, b) => a.avgMood - b.avgMood)[0];
                      const isNegative = impactLeader.impact < 0;
                      return (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-[#5D524F]">{impactLeader.symptom}</span>
                            <p className="text-[10px] text-[#5D524F]/60">Avg energy score: <strong className="text-[#5D524F]">{impactLeader.avgMood}/10</strong></p>
                          </div>
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${isNegative ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {isNegative ? '' : '+'}{impactLeader.impact} mood shift
                          </span>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-[10px] text-[#5D524F]/50 italic">No symptoms logged for this filter yet.</p>
                  )}
                </div>
              </div>

              {/* RECHARTS SYMPTOM CORRELATION BAR CHART */}
              <div className="bg-white border border-matcha-primary/15 rounded-xl p-3.5 space-y-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-[#5D524F] uppercase tracking-wide">
                    {trendsChartMetric === 'occurrences' ? 'Symptom Occurrence Frequency' : 'Wellbeing Impact Comparison'}
                  </h4>
                  <p className="text-[10px] text-[#5D524F]/60">
                    {trendsChartMetric === 'occurrences' 
                      ? 'Count of logged occurrences to identify your primary cycle and PCOS indicators' 
                      : `Average emotional energy score compared to your overall baseline of ${overallAvgMood.toFixed(1)}/10`}
                  </p>
                </div>

                {/* THE GRAPH */}
                <div className="w-full h-[180px] text-[10px] select-none font-mono relative">
                  {filteredSymptomTrendsList.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredSymptomTrendsList}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,198,159,0.15)" />
                        <XAxis 
                          dataKey="symptom" 
                          stroke="#5D524F"
                          opacity={0.6}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={trendsChartMetric === 'occurrences' ? [0, 'auto'] : [1, 10]} 
                          stroke="#5D524F"
                          opacity={0.6}
                          tickLine={false}
                        />
                        <RechartsTooltip content={<TrendTooltip />} />
                        
                        {trendsChartMetric === 'occurrences' ? (
                          <Bar 
                            dataKey="occurrences" 
                            radius={[4, 4, 0, 0]}
                          >
                            {filteredSymptomTrendsList.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isPCOS ? '#F59E0B' : '#EBB094'} 
                                fillOpacity={0.85}
                              />
                            ))}
                          </Bar>
                        ) : (
                          <Bar 
                            dataKey="avgMood" 
                            radius={[4, 4, 0, 0]}
                          >
                            {filteredSymptomTrendsList.map((entry, index) => {
                              const isBelowBaseline = entry.avgMood < overallAvgMood;
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={isBelowBaseline ? '#F4B9B8' : '#A8C69F'} 
                                  fillOpacity={0.85}
                                />
                              );
                            })}
                          </Bar>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full border border-dashed border-matcha-primary/20 rounded-lg p-4 text-center">
                      <span className="text-xl mb-1">📊</span>
                      <p className="text-[10px] text-[#5D524F]/70 max-w-[200px]">
                        No symptom trend data found for this filter. Start logging flow or custom symptoms in the Cycle Tracker tab to see live analytics!
                      </p>
                    </div>
                  )}
                </div>

                {/* Legend and tips */}
                {filteredSymptomTrendsList.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-[9px] pt-1.5 border-t border-matcha-primary/5">
                    {trendsChartMetric === 'occurrences' ? (
                      <div className="flex gap-2.5">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-1.5 rounded-full inline-block bg-[#EBB094]" />
                          <span className="font-semibold text-[#5D524F]/70 uppercase">Standard Symptom</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-1.5 rounded-full inline-block bg-[#F59E0B]" />
                          <span className="font-semibold text-[#5D524F]/70 uppercase">PCOS Indicator</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-1.5 rounded-full inline-block bg-[#F4B9B8]" />
                          <span className="font-semibold text-[#5D524F]/70 uppercase">Below Baseline (Wellbeing Dip)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-1.5 rounded-full inline-block bg-[#A8C69F]" />
                          <span className="font-semibold text-[#5D524F]/70 uppercase">Above/Equal Baseline</span>
                        </div>
                      </div>
                    )}
                    
                    <span className="text-[9px] font-medium text-[#5D524F]/50 italic">
                      💡 Tip: Click standard/PCOS symptoms in the cycle tracker tab to customize logs.
                    </span>
                  </div>
                )}
              </div>

              {/* Detailed Breakdown Table */}
              {filteredSymptomTrendsList.length > 0 && (
                <div className="bg-white border border-matcha-primary/10 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-[#FAF0EC]/30 px-3 py-2 border-b border-matcha-primary/10 flex items-center justify-between">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-[#5D524F] font-bold">Dynamic Symptom Map</span>
                    <span className="text-[9px] text-[#5D524F]/60">Baseline Mood Score: <strong>{overallAvgMood.toFixed(1)}/10</strong></span>
                  </div>
                  <div className="divide-y divide-matcha-primary/5 max-h-[180px] overflow-y-auto font-sans">
                    {filteredSymptomTrendsList.map((item) => {
                      const isNegative = item.impact < 0;
                      return (
                        <div key={item.symptom} className="px-3 py-2 flex items-center justify-between hover:bg-[#FAF0EC]/20 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#5D524F]">{item.symptom}</span>
                              {item.isPCOS && (
                                <span className="text-[7px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-1 py-0.2 rounded-full font-mono">PCOS</span>
                              )}
                            </div>
                            <p className="text-[9px] text-[#5D524F]/60 font-sans">Peaks during: <strong>{item.peakPhase}</strong> • Logged {item.occurrences}x</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono block text-[#5D524F]">{item.avgMood}/10</span>
                            <span className={`text-[9px] font-semibold font-mono ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isNegative ? '' : '+'}{item.impact} pts from baseline
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Entry Creator Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-matcha-primary/25 rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5D524F]">Create New Entry</span>
            <span className="text-xs font-mono text-ink-dark/60 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-matcha-primary" /> {selectedDate}
            </span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Capture the wins, spiritual growth, business efforts, and lessons today..."
            className="w-full min-h-[110px] bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-matcha-primary focus:border-matcha-primary transition-all text-[#5D524F] placeholder-[#5D524F]/40"
            required
          />

          {/* Mood and Tag picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Mood picker with Custom Mood Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#5D524F]/80 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[10px]">
                  <Smile className="w-3.5 h-3.5 text-strawberry-accent" /> Mood
                </label>
                <button
                  type="button"
                  onClick={() => setIsMoodEditorOpen(!isMoodEditorOpen)}
                  className="text-[10px] font-bold text-matcha-primary hover:text-[#97b58e] underline cursor-pointer font-mono"
                >
                  {isMoodEditorOpen ? 'Done Editing' : '⚙️ Edit Custom Moods'}
                </button>
              </div>

              {/* Mood Editor Panel */}
              {isMoodEditorOpen && (
                <div className="bg-[#FAF0EC]/60 border border-matcha-primary/20 p-2.5 rounded-xl space-y-2 mb-2 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold uppercase font-mono text-[#5D524F]">Customize Your Moods</span>
                  
                  {/* Current Mood List Chips */}
                  <div className="flex flex-wrap gap-1">
                    {moodList.map(m => (
                      <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[#5D524F] text-[11px] border border-matcha-primary/20 shadow-xs font-medium">
                        {m}
                        <button
                          type="button"
                          onClick={() => handleDeleteMood(m)}
                          className="text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                          title="Delete mood"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add New Mood Input */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newMoodInput}
                      onChange={(e) => setNewMoodInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomMood())}
                      placeholder="e.g. 🥰 Joyful, 🔥 Motivated"
                      className="bg-white border border-matcha-primary/20 rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-matcha-primary text-[#5D524F]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMood}
                      className="px-2.5 py-1 bg-matcha-primary hover:bg-[#97b58e] text-white rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaultMoods}
                      className="px-2 py-1 bg-white hover:bg-[#FAF0EC] text-[#5D524F]/70 rounded-lg text-[10px] font-mono border border-matcha-primary/20 cursor-pointer shrink-0"
                      title="Reset to default preset moods"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Selectable Moods list */}
              <div className="flex flex-wrap gap-1">
                {moodList.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                      mood === m 
                        ? 'bg-matcha-primary text-white border-matcha-primary shadow-sm font-bold' 
                        : 'bg-white text-[#5D524F]/80 border-matcha-primary/20 hover:bg-[#FAF0EC]/40 hover:border-matcha-primary/40'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags section */}
            <div>
              <label className="text-xs font-bold text-[#5D524F]/80 flex items-center gap-1.5 mb-1.5 uppercase font-mono tracking-wider text-[10px]">
                <Tag className="w-3.5 h-3.5 text-strawberry-accent" /> Tags
              </label>
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add custom tag..."
                  className="bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-lg px-2.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-matcha-primary text-[#5D524F] placeholder-[#5D524F]/40"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3.5 py-1 bg-matcha-primary hover:bg-[#97b58e] text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  Add
                </button>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-strawberry-accent/10 text-[#5D524F] text-[11px] font-semibold border border-strawberry-accent/20">
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="text-strawberry-accent hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-[#5D524F]/50 py-0.5 font-mono">Quick:</span>
                    {PRESET_TAGS.filter(t => !tags.includes(t)).slice(0, 4).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleQuickAddTag(t)}
                        className="text-[10px] bg-[#FAF0EC]/30 text-[#5D524F]/80 hover:bg-[#FAF0EC] px-1.5 py-0.5 rounded transition-colors cursor-pointer border border-matcha-primary/15"
                      >
                        +{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photos list & Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#5D524F]/80 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[10px]">
              <Image className="w-3.5 h-3.5 text-matcha-primary" /> Photo Gallery
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer border border-dashed border-matcha-primary/20 hover:border-matcha-primary/45 bg-[#FAF0EC]/20 hover:bg-[#FAF0EC]/40 w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-matcha-primary" />
                <span className="text-[9px] font-semibold text-matcha-primary">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photos.map((photo, index) => (
                <div key={index} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-matcha-primary/20 bg-white">
                  <img
                    src={photo}
                    alt={`Attachment ${index}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-strawberry-accent hover:bg-[#e4a5a4] text-white rounded-full text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Save Entry for {selectedDate}
            </button>
          </div>
        </form>
          </div>

          {/* Right Column (7 cols): Journal History Side-by-Side */}
          <div className="lg:col-span-7 space-y-4 bg-[#FAF0EC]/30 p-4 border border-matcha-primary/15 rounded-2xl">
            {/* Filter & Search Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-matcha-primary" />
                <input
                  type="text"
                  placeholder="Search journals by text, mood, tags, or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-matcha-primary/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-matcha-primary text-[#5D524F] placeholder-[#5D524F]/40 shadow-xs"
                />
              </div>

              {/* Tag filters */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-[#5D524F]/60 mr-1.5 font-bold uppercase tracking-wider font-mono">Filter tag:</span>
                <button
                  onClick={() => setFilterTag(null)}
                  className={`px-2.5 py-0.5 text-[10px] rounded-full border transition-all cursor-pointer font-medium ${
                    filterTag === null ? 'bg-matcha-primary text-white border-matcha-primary' : 'bg-white text-[#5D524F] border-matcha-primary/20 hover:bg-[#FAF0EC]/60'
                  }`}
                >
                  All
                </button>
                {Array.from(new Set(entries.flatMap(e => e.tags))).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterTag(t)}
                    className={`px-2.5 py-0.5 text-[10px] rounded-full border transition-all cursor-pointer font-medium ${
                      filterTag === t ? 'bg-matcha-primary text-white border-matcha-primary' : 'bg-white text-[#5D524F] border-matcha-primary/20 hover:bg-[#FAF0EC]/60'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Entries list side-by-side grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5D524F] block">Journal History</span>
                <span className="text-[10px] font-mono text-[#5D524F]/60">Showing {filteredEntries.length} entries</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <AnimatePresence initial={false}>
                  {filteredEntries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-2xl border border-matcha-primary/15 bg-white hover:border-matcha-primary/35 transition-all space-y-3 relative group shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="absolute top-3 right-3 text-[#5D524F]/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#FAF0EC] rounded-full cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center justify-between pr-6 mb-2">
                          <span className="text-xs font-mono font-semibold text-[#5D524F]/80 bg-[#FAF0EC]/40 px-2 py-0.5 rounded-full border border-matcha-primary/10">
                            {entry.date}
                          </span>
                          <span className="text-[11px] bg-[#FAF0EC] px-2 py-0.5 rounded-full border border-matcha-primary/10 font-medium text-[#5D524F]">
                            {entry.mood}
                          </span>
                        </div>

                        <p className="text-xs text-[#5D524F] whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-matcha-primary/5">
                        {/* Attachment gallery */}
                        {entry.photos && entry.photos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {entry.photos.map((p, idx) => (
                              <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-matcha-primary/15 shadow-sm">
                                <img src={p} alt="Attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Entry tags */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 text-[9px] rounded-full bg-[#FAF0EC]/60 text-[#5D524F]/80 font-semibold border border-matcha-primary/15">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredEntries.length === 0 && (
                  <div className="col-span-full text-center py-8 bg-white border border-dashed border-matcha-primary/20 rounded-2xl">
                    <BookOpen className="w-8 h-8 text-matcha-primary/40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#5D524F]/80">No journal entries found</p>
                    <p className="text-[11px] text-[#5D524F]/50 mt-0.5">Try changing the search query or select a date to add an entry</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
