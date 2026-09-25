import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ContentItem, SocialEvent, EvidenceDeliverable, ContentPhase, SocialPhase, 
  PeriodLog, CycleSettings, JournalEntry, LensConfig, LensMeta, HeatmapMetricMode 
} from '../types';
import { getCycleInfoForDate } from '../utils/cycleUtils';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, 
  Layers, Users, ShieldAlert, Award, Star, Activity, BarChart, Plus, Trash2, Edit,
  Settings, RotateCcw, Save, Sparkles, X, Check
} from 'lucide-react';

interface CalendarModuleProps {
  contentItems: ContentItem[];
  socialEvents: SocialEvent[];
  evidenceDeliverables: EvidenceDeliverable[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onAddContentItem: (item: Omit<ContentItem, 'id'>) => void;
  onAddSocialEvent: (item: Omit<SocialEvent, 'id'>) => void;
  onAddEvidenceDeliverable: (item: Omit<EvidenceDeliverable, 'id'>) => void;
  onUpdateContentItem?: (item: ContentItem) => void;
  onUpdateSocialEvent?: (item: SocialEvent) => void;
  onUpdateEvidenceDeliverable?: (item: EvidenceDeliverable) => void;
  onDeleteContentItem: (id: string) => void;
  onDeleteSocialEvent: (id: string) => void;
  onDeleteEvidenceDeliverable: (id: string) => void;
  periodLogs?: PeriodLog[];
  cycleSettings?: CycleSettings;
  journalEntries?: JournalEntry[];
}

const DEFAULT_LENS_CONFIG: LensConfig = {
  content: { name: 'Content Lens', emoji: '🎬', description: 'Pipeline, media & content milestones' },
  social: { name: 'Social Lens', emoji: '🥂', description: 'Events, networking & personal commitments' },
  evidence: { name: 'Evidence Lens', emoji: '🎯', description: 'Deliverables, capacity & proof of work' },
};

const MOOD_INTENSITIES: Record<string, number> = {
  '🌸 Serene': 7,
  '⚡ Focused': 8,
  '🔋 Energetic': 10,
  '📝 Grateful': 8,
  '😴 Tired': 3,
  '💭 Reflective': 6,
  '🌱 Growing': 9,
};

export const HEATMAP_MODES: { id: HeatmapMetricMode; label: string; emoji: string; description: string }[] = [
  { id: 'mood', label: 'Mood Energy', emoji: '💭', description: 'Avg daily emotional energy from journal logs' },
  { id: 'productivity', label: 'Workload Density', emoji: '⚡', description: 'Volume of tasks, content & deliverables scheduled' },
  { id: 'quality', label: 'Quality Score', emoji: '🎯', description: 'Deliverable completion & quality accuracy (0-100%)' },
  { id: 'cycle', label: 'Cycle & Symptoms', emoji: '🩸', description: 'Menstrual flow, ovulation surge & symptom load' },
];

const getCycleHeatmapColorClass = (phase: string, flow: string, symptomCount: number, hasLH: boolean) => {
  if (flow === 'Heavy') return 'bg-[#FAD9D6] hover:bg-[#F7B5AF] border-rose-300 text-rose-950 font-bold';
  if (flow === 'Medium' || flow === 'Light') return 'bg-rose-100/90 hover:bg-rose-200/80 border-rose-200 text-rose-900 font-semibold';
  if (hasLH || phase === 'Ovulatory') return 'bg-[#FEF3C7] hover:bg-[#FDE68A] border-amber-300 text-amber-950 font-semibold';
  if (phase === 'Menstrual') return 'bg-rose-50/80 hover:bg-rose-100/70 border-rose-200/70 text-rose-800';
  if (phase === 'Follicular') return 'bg-[#E9F0E8] hover:bg-[#DBE7DA] border-emerald-200 text-emerald-800';
  if (symptomCount > 0) return 'bg-[#EDE9FE] hover:bg-[#DDD6FE] border-purple-200 text-purple-900 font-semibold';
  return 'bg-[#F5F3FF]/70 hover:bg-[#EDE9FE] border-purple-100 text-purple-800';
};

const getMoodHeatmapColorClass = (intensity: number) => {
  if (intensity <= 3) return 'bg-[#E3E6E8] hover:bg-[#D5D9DC] border-slate-300 text-slate-800';
  if (intensity <= 5) return 'bg-[#ECE2EB] hover:bg-[#DFD3E1] border-purple-200 text-purple-800';
  if (intensity <= 7) return 'bg-[#E9F0E8] hover:bg-[#DBE7DA] border-emerald-200 text-emerald-800';
  if (intensity <= 8.5) return 'bg-[#F8EFE4] hover:bg-[#F2E3CD] border-amber-200 text-amber-800';
  return 'bg-[#FDECEB] hover:bg-[#FAD9D6] border-rose-200 text-rose-800';
};

const getProductivityHeatmapColorClass = (count: number) => {
  if (count <= 0) return '';
  if (count === 1) return 'bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800';
  if (count === 2) return 'bg-emerald-100/85 hover:bg-emerald-200/80 border-emerald-300 text-emerald-900';
  if (count === 3) return 'bg-[#d5eed1] hover:bg-[#c6e6bf] border-[#97c790] text-[#2c5324] font-medium';
  if (count === 4) return 'bg-[#b7e2af] hover:bg-[#a5daa0] border-[#74b56b] text-[#1c3e16] font-semibold';
  return 'bg-[#9cd394] hover:bg-[#8bc983] border-[#559b4c] text-[#13300f] font-bold shadow-2xs';
};

const getQualityHeatmapColorClass = (score: number) => {
  if (score < 70) return 'bg-rose-100/80 hover:bg-rose-200/80 border-rose-300 text-rose-900';
  if (score < 80) return 'bg-amber-100/80 hover:bg-amber-200/80 border-amber-300 text-amber-900';
  if (score < 90) return 'bg-[#e2f0dd] hover:bg-[#d4e9ce] border-matcha-primary/60 text-[#3d5e38] font-medium';
  return 'bg-[#bce6b9] hover:bg-[#abddab] border-emerald-500 text-emerald-950 font-bold';
};

const getHeatmapColorClass = getMoodHeatmapColorClass;


const CONTENT_STATUS_MAP: Record<ContentPhase, string[]> = {
  Planning: ['Idea', 'Planned', 'Briefed'],
  Production: ['In Progress', 'Draft', 'Review'],
  Completion: ['Scheduled', 'Published', 'Archived']
};

const CONTENT_MODIFIERS = ['On Hold', 'Cancelled', 'Needs Revision', 'Final Approval'];

const SOCIAL_STATUS_MAP: Record<SocialPhase, string[]> = {
  Planning: ['Proposed', 'Invited', 'Confirmed'],
  Active: ['Upcoming', 'This Week', 'Today'],
  Completed: ['Attended', 'Cancelled', 'Missed']
};

export default function CalendarModule({
  contentItems,
  socialEvents,
  evidenceDeliverables,
  selectedDate,
  onSelectDate,
  onAddContentItem,
  onAddSocialEvent,
  onAddEvidenceDeliverable,
  onUpdateContentItem,
  onUpdateSocialEvent,
  onUpdateEvidenceDeliverable,
  onDeleteContentItem,
  onDeleteSocialEvent,
  onDeleteEvidenceDeliverable,
  periodLogs = [],
  cycleSettings,
  journalEntries = []
}: CalendarModuleProps) {
  // Customizable 3-Lens Config state
  const [lensConfig, setLensConfig] = useState<LensConfig>(() => {
    try {
      const saved = localStorage.getItem('lifeos_lens_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LENS_CONFIG;
  });

  const [isLensEditorOpen, setIsLensEditorOpen] = useState(false);

  // Local state for editing Lens Metadata
  const [editContentName, setEditContentName] = useState(lensConfig.content.name);
  const [editContentEmoji, setEditContentEmoji] = useState(lensConfig.content.emoji);
  const [editSocialName, setEditSocialName] = useState(lensConfig.social.name);
  const [editSocialEmoji, setEditSocialEmoji] = useState(lensConfig.social.emoji);
  const [editEvidenceName, setEditEvidenceName] = useState(lensConfig.evidence.name);
  const [editEvidenceEmoji, setEditEvidenceEmoji] = useState(lensConfig.evidence.emoji);

  const handleSaveLensConfig = () => {
    const updated: LensConfig = {
      content: { ...lensConfig.content, name: editContentName.trim() || 'Content Lens', emoji: editContentEmoji.trim() || '🎬' },
      social: { ...lensConfig.social, name: editSocialName.trim() || 'Social Lens', emoji: editSocialEmoji.trim() || '🥂' },
      evidence: { ...lensConfig.evidence, name: editEvidenceName.trim() || 'Evidence Lens', emoji: editEvidenceEmoji.trim() || '🎯' },
    };
    setLensConfig(updated);
    localStorage.setItem('lifeos_lens_config', JSON.stringify(updated));
    setIsLensEditorOpen(false);
  };

  const handleResetLensConfig = () => {
    setLensConfig(DEFAULT_LENS_CONFIG);
    setEditContentName(DEFAULT_LENS_CONFIG.content.name);
    setEditContentEmoji(DEFAULT_LENS_CONFIG.content.emoji);
    setEditSocialName(DEFAULT_LENS_CONFIG.social.name);
    setEditSocialEmoji(DEFAULT_LENS_CONFIG.social.emoji);
    setEditEvidenceName(DEFAULT_LENS_CONFIG.evidence.name);
    setEditEvidenceEmoji(DEFAULT_LENS_CONFIG.evidence.emoji);
    localStorage.removeItem('lifeos_lens_config');
  };

  const handlePresetLens = (presetKey: 'creator' | 'projects' | 'personal' | 'tech') => {
    let cfg: LensConfig;
    if (presetKey === 'projects') {
      cfg = {
        content: { name: 'Projects & Work', emoji: '💼', description: 'Work deliverables & milestones' },
        social: { name: 'Meetings & Team', emoji: '👥', description: '1:1s, syncs & networking' },
        evidence: { name: 'KPIs & Impact', emoji: '📈', description: 'Metrics & business results' }
      };
    } else if (presetKey === 'personal') {
      cfg = {
        content: { name: 'Learning & Skills', emoji: '📚', description: 'Reading, courses & practice' },
        social: { name: 'Family & Friends', emoji: '❤️', description: 'Gatherings, dates & social time' },
        evidence: { name: 'Health & Fitness', emoji: '💪', description: 'Workouts, habits & wellness' }
      };
    } else if (presetKey === 'tech') {
      cfg = {
        content: { name: 'Code & Releases', emoji: '💻', description: 'Features, refactors & deployments' },
        social: { name: 'Clients & Office', emoji: '🤝', description: 'Client calls & networking' },
        evidence: { name: 'Proof & Tests', emoji: '🏆', description: 'Audits & performance scores' }
      };
    } else {
      cfg = DEFAULT_LENS_CONFIG;
    }
    setLensConfig(cfg);
    setEditContentName(cfg.content.name);
    setEditContentEmoji(cfg.content.emoji);
    setEditSocialName(cfg.social.name);
    setEditSocialEmoji(cfg.social.emoji);
    setEditEvidenceName(cfg.evidence.name);
    setEditEvidenceEmoji(cfg.evidence.emoji);
    localStorage.setItem('lifeos_lens_config', JSON.stringify(cfg));
  };

  // Lenses Toggles
  const [lensContent, setLensContent] = useState(true);
  const [lensSocial, setLensSocial] = useState(true);
  const [lensEvidence, setLensEvidence] = useState(true);
  const [lensHeatmap, setLensHeatmap] = useState(true);

  // Heatmap Metric Mode ('mood' | 'productivity' | 'quality')
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMetricMode>(() => {
    try {
      const saved = localStorage.getItem('lifeos_heatmap_mode') as HeatmapMetricMode;
      if (saved && (saved === 'mood' || saved === 'productivity' || saved === 'quality' || saved === 'cycle')) {
        return saved;
      }
    } catch (e) {}
    return 'mood';
  });

  const handleSetHeatmapMode = (mode: HeatmapMetricMode) => {
    setHeatmapMode(mode);
    try {
      localStorage.setItem('lifeos_heatmap_mode', mode);
    } catch (e) {}
  };

  // Mini Year Overview Strip state
  const [showYearStrip, setShowYearStrip] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lifeos_show_year_strip');
      return saved !== 'false';
    } catch (e) {}
    return true;
  });

  const handleToggleYearStrip = () => {
    setShowYearStrip(prev => {
      const next = !prev;
      try {
        localStorage.setItem('lifeos_show_year_strip', String(next));
      } catch (e) {}
      return next;
    });
  };

  // View toggle
  const [isAgendaView, setIsAgendaView] = useState(false);

  // Month and Year navigation - automatically initialized from selectedDate
  const [currentYear, setCurrentYear] = useState(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return parseInt(selectedDate.split('-')[0], 10);
    }
    return 2026;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return parseInt(selectedDate.split('-')[1], 10) - 1;
    }
    return 8; // September (0-indexed: 8)
  });

  // Keep month view aligned when a date in another month is selected elsewhere
  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const parts = selectedDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentYear(y);
        setCurrentMonth(m);
      }
    }
  }, [selectedDate]);

  // Quick Add states
  const [activeTab, setActiveTab] = useState<'content' | 'social' | 'evidence'>('content');
  const [showAddForm, setShowAddForm] = useState(false);

  // Item inline editing states for Day Inspector
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);

  // Edit fields - Content
  const [ecTitle, setEcTitle] = useState('');
  const [ecPhase, setEcPhase] = useState<ContentPhase>('Planning');
  const [ecStatus, setEcStatus] = useState('Idea');
  const [ecNotes, setEcNotes] = useState('');

  // Edit fields - Social
  const [esTitle, setEsTitle] = useState('');
  const [esPhase, setEsPhase] = useState<SocialPhase>('Planning');
  const [esStatus, setEsStatus] = useState('Proposed');
  const [esNotes, setEsNotes] = useState('');

  // Edit fields - Evidence
  const [eeTitle, setEeTitle] = useState('');
  const [eeCapacity, setEeCapacity] = useState(1);
  const [eeImpactValue, setEeImpactValue] = useState(1);
  const [eeImpactUnit, setEeImpactUnit] = useState<'currency' | 'hours' | 'percent'>('hours');
  const [eeQualityScore, setEeQualityScore] = useState(100);
  const [eeNotes, setEeNotes] = useState('');

  const handleStartEditContent = (item: ContentItem) => {
    setEditingContentId(item.id);
    setEcTitle(item.title);
    setEcPhase(item.phase);
    setEcStatus(item.status);
    setEcNotes(item.notes);
  };

  const handleSaveEditContent = (id: string, date: string) => {
    if (!ecTitle.trim()) return;
    if (onUpdateContentItem) {
      onUpdateContentItem({ id, date, title: ecTitle, phase: ecPhase, status: ecStatus, notes: ecNotes });
    }
    setEditingContentId(null);
  };

  const handleStartEditSocial = (event: SocialEvent) => {
    setEditingSocialId(event.id);
    setEsTitle(event.title);
    setEsPhase(event.phase);
    setEsStatus(event.status);
    setEsNotes(event.notes);
  };

  const handleSaveEditSocial = (id: string, date: string) => {
    if (!esTitle.trim()) return;
    if (onUpdateSocialEvent) {
      onUpdateSocialEvent({ id, date, title: esTitle, phase: esPhase, status: esStatus, notes: esNotes });
    }
    setEditingSocialId(null);
  };

  const handleStartEditEvidence = (dev: EvidenceDeliverable) => {
    setEditingEvidenceId(dev.id);
    setEeTitle(dev.title);
    setEeCapacity(dev.capacityCount);
    setEeImpactValue(dev.impactValue);
    setEeImpactUnit(dev.impactUnit);
    setEeQualityScore(dev.qualityScore);
    setEeNotes(dev.notes);
  };

  const handleSaveEditEvidence = (id: string, date: string) => {
    if (!eeTitle.trim()) return;
    if (onUpdateEvidenceDeliverable) {
      onUpdateEvidenceDeliverable({ id, date, title: eeTitle, capacityCount: eeCapacity, impactValue: eeImpactValue, impactUnit: eeImpactUnit, qualityScore: eeQualityScore, notes: eeNotes });
    }
    setEditingEvidenceId(null);
  };

  // Form states - Content
  const [cTitle, setCTitle] = useState('');
  const [cPhase, setCPhase] = useState<ContentPhase>('Planning');
  const [cStatus, setCStatus] = useState('Idea');
  const [cNotes, setCNotes] = useState('');

  // Form states - Social
  const [sTitle, setSTitle] = useState('');
  const [sPhase, setSPhase] = useState<SocialPhase>('Planning');
  const [sStatus, setSStatus] = useState('Proposed');
  const [sNotes, setSNotes] = useState('');

  // Form states - Evidence
  const [eTitle, setETitle] = useState('');
  const [eCapacity, setECapacity] = useState(1);
  const [eImpactValue, setEImpactValue] = useState(1);
  const [eImpactUnit, setEImpactUnit] = useState<'currency' | 'hours' | 'percent'>('hours');
  const [eQualityScore, setEQualityScore] = useState(100);
  const [eNotes, setENotes] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const startDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    
    setCurrentYear(year);
    setCurrentMonth(month);
    
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(date).padStart(2, '0');
    onSelectDate(`${year}-${mm}-${dd}`);
  };

  const getFormattedDate = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const handleCellClick = (day: number) => {
    onSelectDate(getFormattedDate(day));
  };

  // Add Item actions
  const handleAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim()) return;
    onAddContentItem({
      date: selectedDate,
      title: cTitle,
      phase: cPhase,
      status: cStatus,
      notes: cNotes
    });
    setCTitle('');
    setCNotes('');
    setShowAddForm(false);
  };

  const handleAddSocial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sTitle.trim()) return;
    onAddSocialEvent({
      date: selectedDate,
      title: sTitle,
      phase: sPhase,
      status: sStatus,
      notes: sNotes
    });
    setSTitle('');
    setSNotes('');
    setShowAddForm(false);
  };

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eTitle.trim()) return;
    onAddEvidenceDeliverable({
      date: selectedDate,
      title: eTitle,
      capacityCount: eCapacity,
      impactValue: eImpactValue,
      impactUnit: eImpactUnit,
      qualityScore: eQualityScore,
      notes: eNotes
    });
    setETitle('');
    setENotes('');
    setShowAddForm(false);
  };

  // Fetch lists for day inspector
  const dayContentItems = contentItems.filter(item => item.date === selectedDate);
  const daySocialEvents = socialEvents.filter(event => event.date === selectedDate);
  const dayEvidenceDeliverables = evidenceDeliverables.filter(dev => dev.date === selectedDate);

  // Render variables for calendar grid
  const totalDays = daysInMonth(currentYear, currentMonth);
  const startDay = startDayOfWeek(currentYear, currentMonth);
  const gridCells = [];

  // Padding cells for previous month
  for (let i = 0; i < startDay; i++) {
    gridCells.push(<div key={`empty-${i}`} className="h-14 sm:h-24 bg-[#FAF0EC]/30 border border-matcha-primary/5 opacity-50 rounded-xl"></div>);
  }

  // Active month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = getFormattedDate(day);
    const isSelected = dateStr === selectedDate;
    
    const dayContent = contentItems.filter(item => item.date === dateStr);
    const daySocial = socialEvents.filter(item => item.date === dateStr);
    const dayEvidence = evidenceDeliverables.filter(item => item.date === dateStr);
    const dayEntries = (journalEntries || []).filter(entry => entry.date === dateStr);

    const isPeriodDay = periodLogs?.some(p => p.date === dateStr && p.flow !== 'None');
    const cycleDayInfo = cycleSettings ? getCycleInfoForDate(dateStr, cycleSettings, periodLogs) : null;
    const isMenstrualPhase = cycleDayInfo?.phase === 'Menstrual';

    const hasEntries = dayEntries.length > 0;
    const avgIntensity = hasEntries
      ? dayEntries.reduce((sum, entry) => sum + (MOOD_INTENSITIES[entry.mood] || 5), 0) / dayEntries.length
      : 0;

    const itemCount = dayContent.length + daySocial.length + dayEvidence.length;
    const scoredDeliverables = dayEvidence.filter(dev => typeof dev.qualityScore === 'number');
    const hasQualityData = scoredDeliverables.length > 0;
    const avgQuality = hasQualityData
      ? scoredDeliverables.reduce((sum, dev) => sum + (dev.qualityScore || 100), 0) / scoredDeliverables.length
      : 0;

    let hasHeatmapData = false;
    let heatmapBgClass = '';
    let heatmapBadge = '';
    let heatmapBadgeTitle = '';

    if (lensHeatmap) {
      if (heatmapMode === 'mood' && hasEntries) {
        hasHeatmapData = true;
        heatmapBgClass = getMoodHeatmapColorClass(avgIntensity);
        heatmapBadge = avgIntensity.toFixed(1);
        heatmapBadgeTitle = `Avg Mood Energy: ${avgIntensity.toFixed(1)}/10 (${dayEntries.length} entries)`;
      } else if (heatmapMode === 'productivity' && itemCount > 0) {
        hasHeatmapData = true;
        heatmapBgClass = getProductivityHeatmapColorClass(itemCount);
        heatmapBadge = `${itemCount}x`;
        heatmapBadgeTitle = `Workload Density: ${itemCount} items scheduled (${dayContent.length} content, ${daySocial.length} social, ${dayEvidence.length} deliverables)`;
      } else if (heatmapMode === 'quality' && hasQualityData) {
        hasHeatmapData = true;
        heatmapBgClass = getQualityHeatmapColorClass(avgQuality);
        heatmapBadge = `★${Math.round(avgQuality)}%`;
        heatmapBadgeTitle = `Avg Deliverable Quality: ${Math.round(avgQuality)}% across ${scoredDeliverables.length} items`;
      } else if (heatmapMode === 'cycle' && cycleDayInfo) {
        const dayPeriodLog = periodLogs?.find(p => p.date === dateStr);
        const symptomCount = (dayPeriodLog?.symptoms?.length || 0) + (dayPeriodLog?.pcosSymptoms?.length || 0);
        const hasLH = dayPeriodLog?.lhTest === 'Peak' || dayPeriodLog?.lhTest === 'High' || dayPeriodLog?.lhTest === 'Positive';
        hasHeatmapData = true;
        heatmapBgClass = getCycleHeatmapColorClass(cycleDayInfo.phase, dayPeriodLog?.flow || 'None', symptomCount, hasLH);
        heatmapBadge = `CD${cycleDayInfo.cycleDay}`;
        heatmapBadgeTitle = `Cycle Day ${cycleDayInfo.cycleDay} (${cycleDayInfo.phase} Phase) • Flow: ${dayPeriodLog?.flow || 'None'}${symptomCount > 0 ? ` • ${symptomCount} symptoms` : ''}${hasLH ? ' • LH Peak' : ''}`;
      }
    }

    const gridIndex = startDay + day - 1;
    const isTopRows = gridIndex < 14;

    gridCells.push(
      <button
        key={`day-${day}`}
        onClick={() => handleCellClick(day)}
        className={`h-14 sm:h-24 p-1 sm:p-2 border text-left flex flex-col justify-between transition-all rounded-xl relative focus:outline-none cursor-pointer group ${
          isSelected 
            ? 'bg-matcha-primary text-white border-matcha-primary ring-2 ring-matcha-primary/30 z-10 shadow-sm hover:bg-[#97b58e]' 
            : (lensHeatmap && hasHeatmapData)
              ? heatmapBgClass
              : isPeriodDay
                ? 'bg-rose-50/85 border-rose-200/80 hover:bg-rose-100/60 text-[#5D524F]'
                : isMenstrualPhase
                  ? 'bg-[#FCDBD9]/20 border-rose-100 hover:bg-[#FCDBD9]/40 text-[#5D524F]'
                  : 'bg-white border-matcha-primary/10 hover:bg-[#FAF0EC]/40 text-[#5D524F]'
        }`}
      >
        <span className="flex items-center justify-between w-full">
          <span className={`text-[10px] sm:text-xs font-mono font-bold ${isSelected ? 'text-white' : (lensHeatmap && hasHeatmapData) ? '' : 'text-[#5D524F]/70'}`}>
            {day}
          </span>
          {lensHeatmap && hasHeatmapData && !isSelected ? (
            <span className="text-[8px] sm:text-[9px] font-bold bg-[#5D524F]/10 text-[#5D524F]/85 px-1 py-0.2 rounded-md font-mono" title={heatmapBadgeTitle}>
              {heatmapBadge}
            </span>
          ) : !isSelected && (isPeriodDay || isMenstrualPhase) ? (
            <span className="text-[9px] sm:text-[10px]" title={`${cycleDayInfo?.phase} Phase`}>
              {isPeriodDay ? '🩸' : '🌸'}
            </span>
          ) : null}
        </span>

        {/* Mobile-only dot indicators */}
        <div className="flex sm:hidden justify-center gap-0.5 w-full mt-auto">
          {lensContent && dayContent.length > 0 && (
            <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`}></span>
          )}
          {lensSocial && daySocial.length > 0 && (
            <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-strawberry-accent'}`}></span>
          )}
          {lensEvidence && dayEvidence.length > 0 && (
            <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></span>
          )}
          {lensHeatmap && hasHeatmapData && (
            <span className={`w-1 h-1 rounded-full ${
              isSelected ? 'bg-white' : 
              heatmapMode === 'mood' ? 'bg-amber-500' :
              heatmapMode === 'productivity' ? 'bg-emerald-600' : 'bg-matcha-primary'
            }`}></span>
          )}
        </div>


        {/* Lenses Overlays on the grid cell (Desktop Only) */}
        <div className="hidden sm:block space-y-1 w-full overflow-hidden mt-1">
          {lensHeatmap && heatmapMode === 'mood' && dayEntries.map((entry) => (
            <div 
              key={entry.id} 
              className={`text-[9px] truncate px-1 rounded-sm border ${
                isSelected 
                  ? 'bg-amber-950/40 border-amber-800 text-amber-100 font-medium' 
                  : 'bg-amber-50/50 border-amber-100 text-[#5D524F] font-semibold'
              }`}
              title={`${entry.mood}: ${entry.content}`}
            >
              💭 {entry.mood}
            </div>
          ))}

          {lensHeatmap && heatmapMode === 'quality' && hasQualityData && (
            <div 
              className={`text-[9px] truncate px-1 rounded-sm border ${
                isSelected 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100 font-medium' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-800 font-bold'
              }`}
              title={`Deliverable Quality: ${Math.round(avgQuality)}%`}
            >
              🎯 Quality: {Math.round(avgQuality)}%
            </div>
          )}

          {lensContent && dayContent.map((item) => (
            <div 
              key={item.id} 
              className={`text-[9px] truncate px-1 rounded-sm border ${
                isSelected 
                  ? 'bg-purple-950/40 border-purple-800 text-purple-100 font-medium' 
                  : 'bg-purple-50 border-purple-100 text-purple-600 font-semibold'
              }`}
              title={item.title}
            >
              {lensConfig.content.emoji} {item.title}
            </div>
          ))}

          {lensSocial && daySocial.map((event) => (
            <div 
              key={event.id} 
              className={`text-[9px] truncate px-1 rounded-sm border ${
                isSelected 
                  ? 'bg-[#b38180] border-[#915e5d] text-white font-medium' 
                  : 'bg-[#FCDBD9]/50 border-strawberry-accent/20 text-strawberry-accent font-semibold'
              }`}
              title={event.title}
            >
              {lensConfig.social.emoji} {event.title}
            </div>
          ))}

          {lensEvidence && dayEvidence.map((dev) => (
            <div 
              key={dev.id} 
              className={`text-[9px] truncate px-1.5 rounded-sm border font-bold ${
                isSelected 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100' 
                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}
              title={`${dev.title} (${dev.capacityCount} - ${dev.impactValue}${dev.impactUnit === 'currency' ? '$' : dev.impactUnit})`}
            >
              {lensConfig.evidence.emoji} {dev.title}
            </div>
          ))}
        </div>

        {/* Interactive Hover Tooltip */}
        <div className={`absolute left-1/2 -translate-x-1/2 w-64 sm:w-72 bg-white border border-matcha-primary/20 text-[#5D524F] p-3.5 rounded-2xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50 select-none ${
          isTopRows 
            ? 'top-full mt-2.5 origin-top' 
            : 'bottom-full mb-2.5 origin-bottom'
        }`}>
          {/* Tooltip Header */}
          <div className="flex items-center justify-between border-b border-matcha-primary/10 pb-2 mb-2">
            <span className="font-mono text-[10px] font-bold text-matcha-primary">
              {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {cycleDayInfo && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                cycleDayInfo.phase === 'Menstrual' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                cycleDayInfo.phase === 'Follicular' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                cycleDayInfo.phase === 'Ovulatory' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                cycleDayInfo.phase === 'Extended Follicular' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                'bg-purple-50 text-purple-600 border border-purple-100'
              }`}>
                Day {cycleDayInfo.cycleDay} • {cycleDayInfo.phase}
              </span>
            )}
          </div>

          {/* Productivity Density Mode Tooltip Panel */}
          {lensHeatmap && heatmapMode === 'productivity' && (
            <div className="space-y-2 mb-2.5 pb-2.5 border-b border-matcha-primary/10">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-[#5D524F]/70 flex items-center gap-1">⚡ Workload Density</span>
                <span className="text-emerald-700 font-mono font-bold">{itemCount} items scheduled</span>
              </div>
              <div className="w-full bg-[#FAF0EC] h-1.5 rounded-full overflow-hidden flex">
                {itemCount > 0 ? (
                  <>
                    <div style={{ width: `${(dayContent.length / itemCount) * 100}%` }} className="h-full bg-purple-500" title="Content" />
                    <div style={{ width: `${(daySocial.length / itemCount) * 100}%` }} className="h-full bg-strawberry-accent" title="Social" />
                    <div style={{ width: `${(dayEvidence.length / itemCount) * 100}%` }} className="h-full bg-emerald-500" title="Evidence" />
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-200" />
                )}
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-center pt-1 font-mono">
                <div className="bg-purple-50 border border-purple-100 rounded px-1 py-0.5 text-purple-700 font-semibold">
                  {dayContent.length} {lensConfig.content.emoji}
                </div>
                <div className="bg-[#FCDBD9]/40 border border-strawberry-accent/20 rounded px-1 py-0.5 text-strawberry-accent font-semibold">
                  {daySocial.length} {lensConfig.social.emoji}
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded px-1 py-0.5 text-emerald-700 font-semibold">
                  {dayEvidence.length} {lensConfig.evidence.emoji}
                </div>
              </div>
            </div>
          )}

          {/* Quality Mode Tooltip Panel */}
          {lensHeatmap && heatmapMode === 'quality' && (
            <div className="space-y-2 mb-2.5 pb-2.5 border-b border-matcha-primary/10">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-[#5D524F]/70 flex items-center gap-1">🎯 Deliverable Quality</span>
                <span className="text-emerald-700 font-mono font-bold">
                  {hasQualityData ? `★ ${Math.round(avgQuality)}%` : 'No deliverables'}
                </span>
              </div>
              {hasQualityData ? (
                <div className="space-y-1 pt-1">
                  {scoredDeliverables.map(dev => (
                    <div key={dev.id} className="flex items-center justify-between text-[9px] bg-emerald-50/60 border border-emerald-200/50 p-1 rounded">
                      <span className="truncate max-w-[140px] font-semibold">{dev.title}</span>
                      <span className="font-mono font-bold text-emerald-800">{dev.qualityScore}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] text-[#5D524F]/50 italic">No evidence deliverables logged on this day</p>
              )}
            </div>
          )}

          {/* Mood Section */}
          {(heatmapMode === 'mood' || (!lensHeatmap && hasEntries)) && (
            hasEntries ? (
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                    <span className="text-[#5D524F]/70">Daily Mood Energy</span>
                    <span className="text-amber-600 font-mono font-bold">{avgIntensity.toFixed(1)}/10</span>
                  </div>
                  <div className="w-full bg-[#FAF0EC] h-1.5 rounded-full overflow-hidden border border-matcha-primary/5">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${avgIntensity * 10}%`,
                        backgroundColor: avgIntensity <= 3 ? '#94a3b8' :
                                        avgIntensity <= 5 ? '#a78bfa' :
                                        avgIntensity <= 7 ? '#10b981' :
                                        avgIntensity <= 8.5 ? '#f59e0b' : '#f43f5e'
                      }}
                    />
                  </div>
                </div>

                {/* Logged Moods list */}
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] font-bold text-[#5D524F]/50 uppercase tracking-wider">Moods:</span>
                  {dayEntries.map((entry, idx) => (
                    <span key={entry.id || idx} className="bg-amber-50/70 border border-amber-200/50 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#5D524F]/85 inline-block">
                      {entry.mood}
                    </span>
                  ))}
                </div>

                {/* Tag Highlights */}
                {dayEntries.some(entry => entry.tags && entry.tags.length > 0) ? (
                  <div className="pt-2 border-t border-matcha-primary/5">
                    <div className="text-[9px] font-bold text-[#5D524F]/50 uppercase tracking-wider mb-1">Tag Highlights</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(dayEntries.flatMap(entry => entry.tags || []))).map((tag, tagIdx) => (
                        <span key={tagIdx} className="bg-matcha-primary/10 text-matcha-primary border border-matcha-primary/20 px-2 py-0.5 rounded-full text-[9px] font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-[#5D524F]/40 italic pt-1.5 border-t border-matcha-primary/5">
                    No custom tags logged for this day
                  </div>
                )}

                {/* First Entry Preview snippet */}
                {dayEntries[0]?.content && (
                  <div className="pt-2 border-t border-matcha-primary/5 text-[9px] text-[#5D524F]/75 italic line-clamp-2 leading-relaxed bg-[#FAF0EC]/30 p-1.5 rounded-lg border border-matcha-primary/5">
                    "{dayEntries[0].content}"
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2 space-y-1">
                <p className="text-[10px] text-[#5D524F]/60">No journal logs for this day</p>
                <p className="text-[8px] text-matcha-primary/80 font-bold uppercase tracking-wider">Click cell to add journal entry</p>
              </div>
            )
          )}

          {/* Quick summary of other events/deliverables on that day */}
          {(dayContent.length > 0 || daySocial.length > 0 || dayEvidence.length > 0) && (
            <div className="mt-2.5 pt-2.5 border-t border-matcha-primary/10 text-[9px] text-[#5D524F]/60 space-y-1">
              {dayContent.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span>{lensConfig.content.emoji}</span>
                  <span className="font-semibold">{dayContent.length} {lensConfig.content.name}</span>
                </div>
              )}
              {daySocial.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span>{lensConfig.social.emoji}</span>
                  <span className="font-semibold">{daySocial.length} {lensConfig.social.name}</span>
                </div>
              )}
              {dayEvidence.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span>{lensConfig.evidence.emoji}</span>
                  <span className="font-semibold">{dayEvidence.length} {lensConfig.evidence.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Little tooltip pointer arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
            isTopRows 
              ? 'bottom-full -mb-1 border-b-white' 
              : 'top-full -mt-1 border-t-white'
          }`} />
        </div>
      </button>
    );
  }

  // Pre-calculate agenda items
  const agendaItems = [];
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = getFormattedDate(day);
    const dayContent = contentItems.filter(item => item.date === dateStr);
    const daySocial = socialEvents.filter(item => item.date === dateStr);
    const dayEvidence = evidenceDeliverables.filter(item => item.date === dateStr);
    const dayEntries = (journalEntries || []).filter(entry => entry.date === dateStr);
    
    if (dayContent.length > 0 || daySocial.length > 0 || dayEvidence.length > 0 || dayEntries.length > 0) {
      agendaItems.push({
        day,
        dateStr,
        dayContent,
        daySocial,
        dayEvidence,
        dayEntries
      });
    }
  }

  return (
    <div className="bg-white border border-matcha-primary/20 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full text-[#5D524F]" id="calendar-module-container">
      {/* Header Panel */}
      <div className="bg-[#FAF0EC]/60 border-b border-matcha-primary/20 p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-matcha-primary drop-shadow-[0_0_8px_rgba(168,198,159,0.5)]" />
            <div>
              <h2 className="text-lg font-bold tracking-tight font-sans text-[#5D524F]">3-Lens Life Calendar</h2>
              <p className="text-xs text-[#5D524F]/70">Integrated personal, professional & evidence layers</p>
            </div>
          </div>

          {/* Month Navigator and View Toggle */}
          <div className="flex items-center gap-2 self-stretch md:self-auto">
            {/* View Toggle */}
            <div className="flex items-center bg-[#FAF0EC]/60 p-1 rounded-full border border-matcha-primary/20 shadow-xs h-full">
              <button
                onClick={() => setIsAgendaView(false)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all h-full flex items-center ${!isAgendaView ? 'bg-white text-matcha-primary shadow-sm border border-matcha-primary/10' : 'text-[#5D524F]/60 hover:text-[#5D524F]'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setIsAgendaView(true)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all h-full flex items-center ${isAgendaView ? 'bg-white text-matcha-primary shadow-sm border border-matcha-primary/10' : 'text-[#5D524F]/60 hover:text-[#5D524F]'}`}
              >
                Agenda
              </button>
            </div>
            
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 h-full rounded-full bg-white border border-matcha-primary/20 text-xs font-bold text-[#5D524F] hover:bg-[#FAF0EC] hover:text-matcha-primary transition-all shadow-xs flex items-center cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-full border border-matcha-primary/20 shadow-xs justify-between">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-[#FAF0EC] rounded-full transition-colors text-[#5D524F] cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold tracking-wide min-w-[110px] text-center text-[#5D524F]">
                {months[currentMonth]} {currentYear}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-[#FAF0EC] rounded-full transition-colors text-[#5D524F] cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lenses Filters Controllers */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-matcha-primary/20">
          <span className="text-[10px] uppercase font-bold text-[#5D524F]/70 tracking-wider font-mono">Active Lenses:</span>
          
          {/* Content Lens Toggle */}
          <button
            onClick={() => setLensContent(!lensContent)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              lensContent 
                ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-xs' 
                : 'bg-white border-matcha-primary/20 text-[#5D524F]/50 hover:bg-[#FAF0EC]/40'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${lensContent ? 'bg-purple-500 animate-pulse' : 'bg-matcha-primary/20'}`}></span>
            <span>{lensConfig.content.emoji} {lensConfig.content.name}</span>
          </button>

          {/* Social Lens Toggle */}
          <button
            onClick={() => setLensSocial(!lensSocial)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              lensSocial 
                ? 'bg-[#FCDBD9]/40 border-strawberry-accent/50 text-strawberry-accent shadow-xs' 
                : 'bg-white border-matcha-primary/20 text-[#5D524F]/50 hover:bg-[#FAF0EC]/40'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${lensSocial ? 'bg-strawberry-accent animate-pulse' : 'bg-matcha-primary/20'}`}></span>
            <span>{lensConfig.social.emoji} {lensConfig.social.name}</span>
          </button>

          {/* Evidence Portfolio Toggle */}
          <button
            onClick={() => setLensEvidence(!lensEvidence)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              lensEvidence 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                : 'bg-white border-matcha-primary/20 text-[#5D524F]/50 hover:bg-[#FAF0EC]/40'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${lensEvidence ? 'bg-emerald-500 animate-pulse' : 'bg-matcha-primary/20'}`}></span>
            <span>{lensConfig.evidence.emoji} {lensConfig.evidence.name}</span>
          </button>

          {/* Heatmap Layer Toggle */}
          <button
            onClick={() => setLensHeatmap(!lensHeatmap)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              lensHeatmap 
                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs ring-1 ring-amber-300/40' 
                : 'bg-white border-matcha-primary/20 text-[#5D524F]/50 hover:bg-[#FAF0EC]/40'
            }`}
            title="Toggle calendar heatmap tinting layer"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${lensHeatmap ? 'bg-amber-500 animate-pulse' : 'bg-matcha-primary/20'}`}></span>
            <span>Heatmap</span>
          </button>

          {/* Heatmap Metric Mode Selector (visible when Heatmap is active) */}
          {lensHeatmap && (
            <div className="flex items-center bg-[#FAF0EC]/80 p-0.5 rounded-full border border-matcha-primary/20 shadow-2xs">
              {HEATMAP_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleSetHeatmapMode(mode.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    heatmapMode === mode.id
                      ? 'bg-white text-matcha-primary shadow-xs border border-matcha-primary/20 font-bold'
                      : 'text-[#5D524F]/70 hover:text-[#5D524F]'
                  }`}
                  title={mode.description}
                >
                  <span>{mode.emoji}</span>
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* 12-Month Year Strip Toggle Button */}
          <button
            onClick={handleToggleYearStrip}
            className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showYearStrip
                ? 'bg-matcha-primary/10 border-matcha-primary/40 text-matcha-primary font-bold shadow-2xs'
                : 'bg-white border-matcha-primary/20 text-[#5D524F]/60 hover:bg-[#FAF0EC]/40'
            }`}
            title="Toggle 12-Month Year Overview Heatmap Strip"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Year Strip</span>
            <span className="sm:hidden">Year</span>
          </button>

          {/* Customize Lenses Button */}
          <button
            onClick={() => setIsLensEditorOpen(!isLensEditorOpen)}
            className="px-2.5 py-1.5 rounded-full text-xs font-semibold border bg-white border-matcha-primary/30 text-matcha-primary hover:bg-matcha-primary hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ml-auto"
            title="Edit Lens names, emojis & presets"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isLensEditorOpen ? 'Close Editor' : 'Edit 3 Lenses'}</span>
          </button>
        </div>

        {/* Customizable 3-Lens Editor Drawer */}
        {isLensEditorOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-white border border-matcha-primary/30 rounded-2xl space-y-4 shadow-xs mt-3"
          >
            <div className="flex items-center justify-between border-b border-matcha-primary/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-matcha-primary" />
                <h3 className="text-xs font-bold font-mono text-[#5D524F] uppercase tracking-wider">
                  Customize Your 3 Lenses
                </h3>
              </div>
              <button
                onClick={() => setIsLensEditorOpen(false)}
                className="text-[#5D524F]/50 hover:text-[#5D524F] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Bar */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#5D524F]/70 font-mono uppercase tracking-wider">Quick Preset Archetypes:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePresetLens('creator')}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-[#FAF0EC] hover:bg-matcha-primary/15 border border-matcha-primary/20 text-[#5D524F] font-medium cursor-pointer transition-colors"
                >
                  🎬 Creator Default
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetLens('projects')}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-[#FAF0EC] hover:bg-matcha-primary/15 border border-matcha-primary/20 text-[#5D524F] font-medium cursor-pointer transition-colors"
                >
                  💼 Professional & Work
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetLens('personal')}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-[#FAF0EC] hover:bg-matcha-primary/15 border border-matcha-primary/20 text-[#5D524F] font-medium cursor-pointer transition-colors"
                >
                  📚 Learning & Personal
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetLens('tech')}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-[#FAF0EC] hover:bg-matcha-primary/15 border border-matcha-primary/20 text-[#5D524F] font-medium cursor-pointer transition-colors"
                >
                  💻 Engineering & Tech
                </button>
              </div>
            </div>

            {/* Lens Editor Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-matcha-primary/10">
              {/* Lens 1 Customizer */}
              <div className="p-3 bg-purple-50/40 border border-purple-200/60 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-purple-700 font-mono uppercase block">Lens 1 (Purple Layer)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editContentEmoji}
                    onChange={(e) => setEditContentEmoji(e.target.value)}
                    className="w-10 text-center bg-white border border-purple-200 rounded-lg py-1 text-sm"
                    title="Emoji Icon"
                  />
                  <input
                    type="text"
                    value={editContentName}
                    onChange={(e) => setEditContentName(e.target.value)}
                    className="flex-1 bg-white border border-purple-200 rounded-lg px-2 py-1 text-xs text-[#5D524F] font-semibold"
                    placeholder="Lens Name"
                  />
                </div>
              </div>

              {/* Lens 2 Customizer */}
              <div className="p-3 bg-[#FCDBD9]/30 border border-[#F4B9B8]/50 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-strawberry-accent font-mono uppercase block">Lens 2 (Strawberry Layer)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editSocialEmoji}
                    onChange={(e) => setEditSocialEmoji(e.target.value)}
                    className="w-10 text-center bg-white border border-[#F4B9B8]/50 rounded-lg py-1 text-sm"
                    title="Emoji Icon"
                  />
                  <input
                    type="text"
                    value={editSocialName}
                    onChange={(e) => setEditSocialName(e.target.value)}
                    className="flex-1 bg-white border border-[#F4B9B8]/50 rounded-lg px-2 py-1 text-xs text-[#5D524F] font-semibold"
                    placeholder="Lens Name"
                  />
                </div>
              </div>

              {/* Lens 3 Customizer */}
              <div className="p-3 bg-emerald-50/40 border border-emerald-200/60 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 font-mono uppercase block">Lens 3 (Emerald Layer)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editEvidenceEmoji}
                    onChange={(e) => setEditEvidenceEmoji(e.target.value)}
                    className="w-10 text-center bg-white border border-emerald-200 rounded-lg py-1 text-sm"
                    title="Emoji Icon"
                  />
                  <input
                    type="text"
                    value={editEvidenceName}
                    onChange={(e) => setEditEvidenceName(e.target.value)}
                    className="flex-1 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs text-[#5D524F] font-semibold"
                    placeholder="Lens Name"
                  />
                </div>
              </div>
            </div>

            {/* Save & Reset Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-matcha-primary/10">
              <button
                type="button"
                onClick={handleResetLensConfig}
                className="px-3 py-1.5 rounded-full text-xs text-[#5D524F]/70 hover:text-[#5D524F] border border-matcha-primary/20 hover:bg-[#FAF0EC] transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleSaveLensConfig}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-matcha-primary hover:bg-[#97b58e] transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save Lens Settings
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Shared Grid or Agenda View */}
      <div className="p-4 bg-transparent border-b border-matcha-primary/10 flex-1 overflow-y-auto">
        {!isAgendaView ? (
          <>
            {/* 12-Month Mini Year Overview Strip */}
            {showYearStrip && (
              <div className="mb-4 bg-linear-to-r from-[#FAF0EC]/80 via-white to-[#FAF0EC]/50 border border-matcha-primary/20 rounded-2xl p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-matcha-primary" />
                    <span className="text-xs font-bold font-mono text-[#5D524F] uppercase tracking-wider">
                      {currentYear} Year-at-a-Glance Heatmap
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-matcha-primary/20 text-[#5D524F]/80 font-medium">
                      {HEATMAP_MODES.find(m => m.id === heatmapMode)?.emoji} {HEATMAP_MODES.find(m => m.id === heatmapMode)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#5D524F]/60 font-mono">
                    <span className="hidden sm:inline">Click any month to navigate</span>
                    <button
                      onClick={() => setShowYearStrip(false)}
                      className="p-1 rounded-full hover:bg-[#FAF0EC] text-[#5D524F]/60 hover:text-[#5D524F] transition-colors cursor-pointer"
                      title="Hide Year Strip"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 12 Month Grid Ribbon */}
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                  {months.map((mName, mIdx) => {
                    const mPrefix = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
                    const mContent = contentItems.filter(c => c.date.startsWith(mPrefix));
                    const mSocial = socialEvents.filter(s => s.date.startsWith(mPrefix));
                    const mEvidence = evidenceDeliverables.filter(e => e.date.startsWith(mPrefix));
                    const mEntries = (journalEntries || []).filter(j => j.date.startsWith(mPrefix));
                    const totalMonthItems = mContent.length + mSocial.length + mEvidence.length;

                    let monthBadge = '—';
                    let monthBgClass = 'bg-white border-matcha-primary/10 text-[#5D524F]';
                    let monthTooltipDesc = `${mName} ${currentYear}: `;

                    if (heatmapMode === 'mood') {
                      if (mEntries.length > 0) {
                        const avg = mEntries.reduce((sum, e) => sum + (MOOD_INTENSITIES[e.mood] || 5), 0) / mEntries.length;
                        monthBadge = avg.toFixed(1);
                        monthBgClass = getMoodHeatmapColorClass(avg);
                        monthTooltipDesc += `Avg Mood ${avg.toFixed(1)}/10 (${mEntries.length} entries)`;
                      } else {
                        monthTooltipDesc += 'No journal logs';
                      }
                    } else if (heatmapMode === 'productivity') {
                      monthBadge = `${totalMonthItems}`;
                      monthBgClass = totalMonthItems > 0 ? getProductivityHeatmapColorClass(Math.min(Math.ceil(totalMonthItems / 3), 5)) : 'bg-white/70 border-matcha-primary/10 text-[#5D524F]/50';
                      monthTooltipDesc += `${totalMonthItems} scheduled items (${mContent.length} content, ${mSocial.length} social, ${mEvidence.length} deliverables)`;
                    } else if (heatmapMode === 'quality') {
                      const scored = mEvidence.filter(e => typeof e.qualityScore === 'number');
                      if (scored.length > 0) {
                        const avg = scored.reduce((sum, e) => sum + (e.qualityScore || 100), 0) / scored.length;
                        monthBadge = `★${Math.round(avg)}%`;
                        monthBgClass = getQualityHeatmapColorClass(avg);
                        monthTooltipDesc += `Avg Deliverable Quality: ${Math.round(avg)}% (${scored.length} items)`;
                      } else {
                        monthTooltipDesc += 'No evidence deliverables';
                      }
                    }

                    const isCurrentActive = currentMonth === mIdx;

                    return (
                      <button
                        key={mName}
                        onClick={() => setCurrentMonth(mIdx)}
                        title={monthTooltipDesc}
                        className={`p-1.5 sm:p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center relative ${
                          isCurrentActive 
                            ? 'ring-2 ring-matcha-primary border-matcha-primary shadow-xs scale-102 ' + monthBgClass
                            : 'hover:border-matcha-primary/40 hover:shadow-2xs ' + monthBgClass
                        }`}
                      >
                        <span className={`text-[10px] font-mono font-bold ${isCurrentActive ? 'text-matcha-primary font-black' : 'text-[#5D524F]/80'}`}>
                          {mName.slice(0, 3)}
                        </span>
                        <span className="text-[10px] font-mono font-semibold mt-1">
                          {monthBadge}
                        </span>
                        {isCurrentActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-matcha-primary absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-mono font-bold text-[#5D524F]/60 uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-1">
              {gridCells}
            </div>

            {/* Dynamic Multi-Metric Heatmap Legend */}
            {lensHeatmap && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF0EC]/50 rounded-2xl border border-matcha-primary/15 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#5D524F] uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <span>{HEATMAP_MODES.find(m => m.id === heatmapMode)?.emoji}</span>
                    <span>{HEATMAP_MODES.find(m => m.id === heatmapMode)?.label} Legend:</span>
                  </span>
                  <span className="text-[#5D524F]/60 hidden md:inline">({HEATMAP_MODES.find(m => m.id === heatmapMode)?.description})</span>
                </div>

                {/* Swatches according to mode */}
                {heatmapMode === 'mood' && (
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#E3E6E8] border border-slate-300 inline-block"></span>
                      <span>Low (≤3)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#ECE2EB] border border-purple-200 inline-block"></span>
                      <span>Muted (3.1-5)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#E9F0E8] border border-emerald-200 inline-block"></span>
                      <span>Balanced (5.1-7)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#F8EFE4] border border-amber-200 inline-block"></span>
                      <span>Active (7.1-8.5)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#FDECEB] border border-rose-200 inline-block"></span>
                      <span>Peak (8.5-10)</span>
                    </span>
                  </div>
                )}

                {heatmapMode === 'productivity' && (
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-white border border-matcha-primary/20 inline-block"></span>
                      <span>0 (Rest)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-50 border border-emerald-200 inline-block"></span>
                      <span>1 (Light)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300 inline-block"></span>
                      <span>2 (Moderate)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#d5eed1] border border-[#97c790] inline-block"></span>
                      <span>3 (Active)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#b7e2af] border border-[#74b56b] inline-block"></span>
                      <span>4 (High)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#9cd394] border border-[#559b4c] inline-block"></span>
                      <span>5+ (Peak Load)</span>
                    </span>
                  </div>
                )}

                {heatmapMode === 'quality' && (
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300 inline-block"></span>
                      <span>&lt;70% (Polish)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300 inline-block"></span>
                      <span>70-79% (Good)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#e2f0dd] border border-matcha-primary/60 inline-block"></span>
                      <span>80-89% (Solid)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#bce6b9] border border-emerald-500 inline-block"></span>
                      <span>90-100% (High Impact ★)</span>
                    </span>
                  </div>
                )}

                {heatmapMode === 'cycle' && (
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#FAD9D6] border border-rose-300 inline-block"></span>
                      <span>Menstrual Flow (Heavy/Med)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#E9F0E8] border border-emerald-200 inline-block"></span>
                      <span>Follicular (Rest/Focus)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#FEF3C7] border border-amber-300 inline-block"></span>
                      <span>Ovulatory (Surge ✨)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#EDE9FE] border border-purple-200 inline-block"></span>
                      <span>Luteal (PMS Symptoms 🌙)</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto pb-4">
            {agendaItems.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-[#5D524F]/60">No logged events for this month.</p>
              </div>
            ) : (
              agendaItems.map(({ day, dateStr, dayContent, daySocial, dayEvidence, dayEntries }) => {
                const hasVisibleContent = (lensContent && dayContent.length > 0) || 
                                          (lensSocial && daySocial.length > 0) || 
                                          (lensEvidence && dayEvidence.length > 0) || 
                                          (lensHeatmap && dayEntries.length > 0);
                
                if (!hasVisibleContent) return null;

                const isSelected = dateStr === selectedDate;
                
                return (
                  <div 
                    key={dateStr}
                    onClick={() => onSelectDate(dateStr)}
                    className={`flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-matcha-primary/10 border-matcha-primary/50 shadow-sm'
                        : 'bg-white border-matcha-primary/20 hover:border-matcha-primary/40 hover:shadow-xs'
                    }`}
                  >
                    <div className="sm:w-24 shrink-0">
                      <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0">
                        <span className={`text-2xl font-bold font-mono leading-none ${isSelected ? 'text-matcha-primary' : 'text-[#5D524F]'}`}>
                          {day}
                        </span>
                        <span className="text-xs text-[#5D524F]/60 font-medium uppercase tracking-widest">
                          {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      {lensHeatmap && dayEntries.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {dayEntries.map(entry => (
                            <span key={entry.id} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-md font-semibold" title={entry.content}>
                              💭 {entry.mood}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {lensContent && dayContent.length > 0 && (
                        <div className="space-y-1.5">
                          {dayContent.map(item => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <span className="w-5 text-center">{lensConfig.content.emoji}</span>
                              <span className="font-semibold text-purple-700">{item.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 rounded text-purple-600 font-mono">{item.phase}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {lensSocial && daySocial.length > 0 && (
                        <div className="space-y-1.5">
                          {daySocial.map(event => (
                            <div key={event.id} className="flex items-center gap-2 text-xs">
                              <span className="w-5 text-center">{lensConfig.social.emoji}</span>
                              <span className="font-semibold text-strawberry-accent">{event.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#FCDBD9]/50 rounded text-strawberry-accent font-mono">{event.phase}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {lensEvidence && dayEvidence.length > 0 && (
                        <div className="space-y-1.5">
                          {dayEvidence.map(dev => (
                            <div key={dev.id} className="flex items-center gap-2 text-xs">
                              <span className="w-5 text-center">{lensConfig.evidence.emoji}</span>
                              <span className="font-semibold text-emerald-700">{dev.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-600 font-mono">Score: {dev.qualityScore}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Date Inspector & Operations Section */}
      <div className="p-5 border-t border-matcha-primary/10 space-y-4 bg-[#FAF0EC]/30">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5D524F]/70 tracking-wider font-mono">Inspecting Date</span>
            <h3 className="text-sm font-bold text-[#5D524F] flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-matcha-primary" /> {selectedDate}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setUTCDate(d.getUTCDate() - 1);
                onSelectDate(d.toISOString().split('T')[0]);
              }}
              className="p-1.5 rounded bg-white border border-matcha-primary/20 text-[#5D524F]/70 hover:bg-[#FAF0EC] hover:text-[#5D524F] transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setUTCDate(d.getUTCDate() + 1);
                onSelectDate(d.toISOString().split('T')[0]);
              }}
              className="p-1.5 rounded bg-white border border-matcha-primary/20 text-[#5D524F]/70 hover:bg-[#FAF0EC] hover:text-[#5D524F] transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-matcha-primary hover:bg-[#97b58e] text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> {showAddForm ? 'Close Creator' : 'Add Item'}
          </button>
        </div>

        {/* Add Entry Form Expansion */}
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border border-matcha-primary/20 rounded-2xl p-4 bg-white space-y-4 shadow-sm"
          >
            {/* Tab selection for layout creation */}
            <div className="flex border-b border-matcha-primary/10">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'content' ? 'border-purple-500 text-purple-700 font-bold' : 'border-transparent text-[#5D524F]/60 hover:text-[#5D524F]'
                }`}
              >
                {lensConfig.content.emoji} {lensConfig.content.name}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'social' ? 'border-strawberry-accent text-strawberry-accent font-bold' : 'border-transparent text-[#5D524F]/60 hover:text-[#5D524F]'
                }`}
              >
                {lensConfig.social.emoji} {lensConfig.social.name}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'evidence' ? 'border-emerald-500 text-emerald-700 font-bold' : 'border-transparent text-[#5D524F]/60 hover:text-[#5D524F]'
                }`}
              >
                {lensConfig.evidence.emoji} {lensConfig.evidence.name}
              </button>
            </div>

            {/* Content pipeline form */}
            {activeTab === 'content' && (
              <form onSubmit={handleAddContent} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Content Title / Deliverable</label>
                    <input
                      type="text"
                      value={cTitle}
                      onChange={(e) => setCTitle(e.target.value)}
                      placeholder="e.g., Draft LifeOS launch copy"
                      className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-[#5D524F]/40"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Pipeline Phase</label>
                      <select
                        value={cPhase}
                        onChange={(e) => {
                          const phase = e.target.value as ContentPhase;
                          setCPhase(phase);
                          setCStatus(CONTENT_STATUS_MAP[phase][0]);
                        }}
                        className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Production">Production</option>
                        <option value="Completion">Completion</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Current Status</label>
                      <select
                        value={cStatus}
                        onChange={(e) => setCStatus(e.target.value)}
                        className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {CONTENT_STATUS_MAP[cPhase].map(s => <option key={s} value={s}>{s}</option>)}
                        <option disabled>── Modifiers ──</option>
                        {CONTENT_MODIFIERS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Notes / Details</label>
                  <input
                    type="text"
                    value={cNotes}
                    onChange={(e) => setCNotes(e.target.value)}
                    placeholder="Brief notes, link references or distribution plans..."
                    className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-[#5D524F]/40"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs">
                    Save Content Item
                  </button>
                </div>
              </form>
            )}

            {/* Social pipeline form */}
            {activeTab === 'social' && (
              <form onSubmit={handleAddSocial} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Commitment / Event</label>
                    <input
                      type="text"
                      value={sTitle}
                      onChange={(e) => setSTitle(e.target.value)}
                      placeholder="e.g., Dinner with mentors"
                      className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-strawberry-accent placeholder-[#5D524F]/40"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Commitment Phase</label>
                      <select
                        value={sPhase}
                        onChange={(e) => {
                          const phase = e.target.value as SocialPhase;
                          setSPhase(phase);
                          setSStatus(SOCIAL_STATUS_MAP[phase][0]);
                        }}
                        className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-strawberry-accent"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Status</label>
                      <select
                        value={sStatus}
                        onChange={(e) => setSStatus(e.target.value)}
                        className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-strawberry-accent"
                      >
                        {SOCIAL_STATUS_MAP[sPhase].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Notes / Details</label>
                  <input
                    type="text"
                    value={sNotes}
                    onChange={(e) => setSNotes(e.target.value)}
                    placeholder="Location, agenda, attendees, follow-ups..."
                    className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-strawberry-accent placeholder-[#5D524F]/40"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-[#F4B9B8] hover:bg-[#e4a5a4] text-white rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs">
                    Save Social Event
                  </button>
                </div>
              </form>
            )}

            {/* Evidence Portfolio form */}
            {activeTab === 'evidence' && (
              <form onSubmit={handleAddEvidence} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Proof of Work / Completed Deliverable</label>
                    <input
                      type="text"
                      value={eTitle}
                      onChange={(e) => setETitle(e.target.value)}
                      placeholder="e.g., Built room database interface"
                      className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary placeholder-[#5D524F]/40"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1 truncate" title="Raw capacity of completed projects/reports">Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={eCapacity}
                        onChange={(e) => setECapacity(Number(e.target.value))}
                        className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1 truncate" title="Business ROI delta (revenue, cost or time saved)">Impact</label>
                      <input
                        type="number"
                        min="0"
                        value={eImpactValue}
                        onChange={(e) => setEImpactValue(Number(e.target.value))}
                        className="w-full bg-white border border-matcha-primary/20 rounded-lg px-2 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1 truncate">Unit</label>
                      <select
                        value={eImpactUnit}
                        onChange={(e) => setEImpactUnit(e.target.value as any)}
                        className="w-full bg-white border border-matcha-primary/20 rounded-lg px-1.5 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                      >
                        <option value="hours">Hours Saved</option>
                        <option value="currency">Currency ($)</option>
                        <option value="percent">Percent (%)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#5D524F]/80 font-semibold flex items-center justify-between mb-1">
                      <span>Reliability & Accuracy Score</span>
                      <span className="font-mono font-bold text-matcha-primary">{eQualityScore}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={eQualityScore}
                      onChange={(e) => setEQualityScore(Number(e.target.value))}
                      className="w-full h-1 bg-[#EAE0DC] rounded-lg appearance-none cursor-pointer accent-matcha-primary my-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#5D524F]/80 font-semibold block mb-1">Proof Details / Metrics Source</label>
                    <input
                      type="text"
                      value={eNotes}
                      onChange={(e) => setENotes(e.target.value)}
                      placeholder="Audit sign-off, client feedback, error-free completion logs..."
                      className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary placeholder-[#5D524F]/40"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-matcha-primary hover:bg-[#97b58e] text-white rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs">
                    Log Proof of Work
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* Day Items Grid representation */}
        <div className="space-y-4">
          {/* Content layer entries */}
          {lensContent && dayContentItems.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1 font-mono">
                {lensConfig.content.emoji} {lensConfig.content.name} Items ({dayContentItems.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dayContentItems.map(item => (
                  <div key={item.id} className="p-3 bg-purple-50/50 border border-purple-200/60 rounded-xl flex flex-col justify-between gap-2 hover:bg-purple-100/30 transition-all">
                    {editingContentId === item.id ? (
                      /* Inline Editing Mode for Content Item */
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-purple-800 text-[11px] font-mono flex items-center gap-1">
                          ✏️ Editing {lensConfig.content.name} Item
                        </div>
                        <input
                          type="text"
                          value={ecTitle}
                          onChange={(e) => setEcTitle(e.target.value)}
                          className="w-full bg-white border border-purple-300 rounded px-2 py-1 text-xs text-[#5D524F]"
                          placeholder="Title"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={ecPhase}
                            onChange={(e) => {
                              const phase = e.target.value as ContentPhase;
                              setEcPhase(phase);
                              setEcStatus(CONTENT_STATUS_MAP[phase][0]);
                            }}
                            className="bg-white border border-purple-300 rounded px-1.5 py-1 text-xs"
                          >
                            <option value="Planning">Planning</option>
                            <option value="Production">Production</option>
                            <option value="Completion">Completion</option>
                          </select>
                          <select
                            value={ecStatus}
                            onChange={(e) => setEcStatus(e.target.value)}
                            className="bg-white border border-purple-300 rounded px-1.5 py-1 text-xs"
                          >
                            {CONTENT_STATUS_MAP[ecPhase].map(s => <option key={s} value={s}>{s}</option>)}
                            <option disabled>── Modifiers ──</option>
                            {CONTENT_MODIFIERS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={ecNotes}
                          onChange={(e) => setEcNotes(e.target.value)}
                          className="w-full bg-white border border-purple-300 rounded px-2 py-1 text-xs text-[#5D524F]"
                          placeholder="Notes"
                        />
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingContentId(null)}
                            className="px-2.5 py-1 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-[#5D524F]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditContent}
                            className="px-3 py-1 text-[11px] font-bold rounded bg-purple-600 text-white hover:bg-purple-700"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read Display Mode */
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border border-purple-200/40 font-sans">
                              {item.phase}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-purple-200/50 text-purple-800 rounded-full border border-purple-200/30">
                              {item.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-[#5D524F] leading-tight">{item.title}</h4>
                          {item.notes && <p className="text-[11px] text-[#5D524F]/70 truncate">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 self-start">
                          <button
                            onClick={() => handleStartEditContent(item)}
                            className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-100/50 rounded transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteContentItem(item.id)}
                            className="text-purple-400 hover:text-red-500 p-1 hover:bg-purple-100/50 rounded transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social layer entries */}
          {lensSocial && daySocialEvents.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-strawberry-accent uppercase tracking-wider flex items-center gap-1 font-mono">
                {lensConfig.social.emoji} {lensConfig.social.name} Commitments ({daySocialEvents.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {daySocialEvents.map(event => (
                  <div key={event.id} className="p-3 bg-[#FCDBD9]/30 border border-[#F4B9B8]/40 rounded-xl flex flex-col justify-between gap-2 hover:bg-[#FCDBD9]/50 transition-all">
                    {editingSocialId === event.id ? (
                      /* Inline Editing Mode for Social Event */
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-strawberry-accent text-[11px] font-mono flex items-center gap-1">
                          ✏️ Editing {lensConfig.social.name} Event
                        </div>
                        <input
                          type="text"
                          value={esTitle}
                          onChange={(e) => setEsTitle(e.target.value)}
                          className="w-full bg-white border border-[#F4B9B8] rounded px-2 py-1 text-xs text-[#5D524F]"
                          placeholder="Event Title"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={esPhase}
                            onChange={(e) => {
                              const phase = e.target.value as SocialPhase;
                              setEsPhase(phase);
                              setEsStatus(SOCIAL_STATUS_MAP[phase][0]);
                            }}
                            className="bg-white border border-[#F4B9B8] rounded px-1.5 py-1 text-xs"
                          >
                            <option value="Planning">Planning</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <select
                            value={esStatus}
                            onChange={(e) => setEsStatus(e.target.value)}
                            className="bg-white border border-[#F4B9B8] rounded px-1.5 py-1 text-xs"
                          >
                            {SOCIAL_STATUS_MAP[esPhase].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={esNotes}
                          onChange={(e) => setEsNotes(e.target.value)}
                          className="w-full bg-white border border-[#F4B9B8] rounded px-2 py-1 text-xs text-[#5D524F]"
                          placeholder="Notes"
                        />
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingSocialId(null)}
                            className="px-2.5 py-1 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-[#5D524F]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditSocial}
                            className="px-3 py-1 text-[11px] font-bold rounded bg-strawberry-accent text-white hover:bg-[#d85e5c]"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read Display Mode */
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#FCDBD9] text-strawberry-accent rounded border border-[#F4B9B8]/20 font-sans">
                              {event.phase}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-white text-strawberry-accent rounded-full border border-[#F4B9B8]/20">
                              {event.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-[#5D524F] leading-tight">{event.title}</h4>
                          {event.notes && <p className="text-[11px] text-[#5D524F]/70 truncate">{event.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 self-start">
                          <button
                            onClick={() => handleStartEditSocial(event)}
                            className="text-strawberry-accent hover:text-rose-800 p-1 hover:bg-[#FCDBD9]/40 rounded transition-colors cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteSocialEvent(event.id)}
                            className="text-strawberry-accent/80 hover:text-red-500 p-1 hover:bg-[#FCDBD9]/40 rounded transition-colors cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence layer entries */}
          {lensEvidence && dayEvidenceDeliverables.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 font-mono">
                {lensConfig.evidence.emoji} {lensConfig.evidence.name} Portfolio ({dayEvidenceDeliverables.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayEvidenceDeliverables.map(dev => (
                  <div key={dev.id} className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex flex-col justify-between gap-2.5 hover:bg-emerald-100/30 transition-all">
                    {editingEvidenceId === dev.id ? (
                      /* Inline Editing Mode for Evidence Deliverable */
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-emerald-800 text-[11px] font-mono flex items-center gap-1">
                          ✏️ Editing {lensConfig.evidence.name} Proof
                        </div>
                        <input
                          type="text"
                          value={eeTitle}
                          onChange={(e) => setEeTitle(e.target.value)}
                          className="w-full bg-white border border-emerald-300 rounded px-2 py-1 text-xs text-[#5D524F]"
                          placeholder="Deliverable Title"
                        />
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="text-[10px] text-[#5D524F]/70 font-semibold block">Capacity</label>
                            <input
                              type="number"
                              min="1"
                              value={eeCapacity}
                              onChange={(e) => setEeCapacity(Number(e.target.value))}
                              className="w-full bg-white border border-emerald-300 rounded px-1.5 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#5D524F]/70 font-semibold block">Impact</label>
                            <input
                              type="number"
                              min="0"
                              value={eeImpactValue}
                              onChange={(e) => setEeImpactValue(Number(e.target.value))}
                              className="w-full bg-white border border-emerald-300 rounded px-1.5 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#5D524F]/70 font-semibold block">Unit</label>
                            <select
                              value={eeImpactUnit}
                              onChange={(e) => setEeImpactUnit(e.target.value as any)}
                              className="w-full bg-white border border-emerald-300 rounded px-1 py-1 text-xs"
                            >
                              <option value="hours">Hours</option>
                              <option value="currency">$</option>
                              <option value="percent">%</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#5D524F]/70 font-semibold flex justify-between">
                            <span>Quality Score</span>
                            <span>{eeQualityScore}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={eeQualityScore}
                            onChange={(e) => setEeQualityScore(Number(e.target.value))}
                            className="w-full h-1 bg-emerald-200 rounded accent-emerald-600"
                          />
                        </div>
                        <input
                          type="text"
                          value={eeNotes}
                          onChange={(e) => setEeNotes(e.target.value)}
                          className="w-full bg-white border border-emerald-300 rounded px-2 py-1 text-xs text-[#5D524F]"
                          placeholder="Proof Details"
                        />
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingEvidenceId(null)}
                            className="px-2.5 py-1 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-[#5D524F]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditEvidence}
                            className="px-3 py-1 text-[11px] font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read Display Mode */
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-[#5D524F] leading-tight">{dev.title}</h4>
                            {dev.notes && <p className="text-[11px] text-[#5D524F]/80 leading-normal">{dev.notes}</p>}
                          </div>
                          <div className="flex items-center gap-1 self-start">
                            <button
                              onClick={() => handleStartEditEvidence(dev)}
                              className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100/50 rounded transition-colors cursor-pointer"
                              title="Edit Deliverable Proof"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteEvidenceDeliverable(dev.id)}
                              className="text-emerald-500 hover:text-red-500 p-1 hover:bg-emerald-100/50 rounded transition-colors cursor-pointer"
                              title="Delete Deliverable Proof"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Deliverable scoring presentation */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-matcha-primary/10 text-center">
                          <div className="bg-white p-1.5 rounded-lg border border-matcha-primary/15">
                            <span className="text-[8px] uppercase text-[#5D524F]/60 font-bold block">Capacity</span>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 flex items-center justify-center gap-0.5">
                              <Activity className="w-3 h-3 text-emerald-600" /> {dev.capacityCount}x
                            </span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-matcha-primary/15">
                            <span className="text-[8px] uppercase text-[#5D524F]/60 font-bold block">Impact</span>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 truncate block">
                              {dev.impactUnit === 'currency' ? `$${dev.impactValue}` : `${dev.impactValue}${dev.impactUnit === 'hours' ? 'h' : '%'}`}
                            </span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-matcha-primary/15">
                            <span className="text-[8px] uppercase text-[#5D524F]/60 font-bold block">Quality</span>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 flex items-center justify-center gap-0.5">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> {dev.qualityScore}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty fallback for current selections */}
          {(!lensContent || dayContentItems.length === 0) && 
           (!lensSocial || daySocialEvents.length === 0) && 
           (!lensEvidence || dayEvidenceDeliverables.length === 0) && (
            <div className="text-center py-6 bg-white border border-dashed border-matcha-primary/20 rounded-2xl">
              <p className="text-xs font-semibold text-[#5D524F]/80">No active lens entries recorded on this date.</p>
              <p className="text-[10px] text-[#5D524F]/50 mt-1">Click "Add Item" above to create calendar events or proof logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
