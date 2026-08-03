import { CycleSettings, PeriodFlow, PeriodLog, JournalEntry } from '../types';

export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal' | 'Extended Follicular';

export interface CycleInfo {
  cycleDay: number;
  phase: CyclePhase;
  phaseColor: string;
  phaseBg: string;
  phaseBorder: string;
  phaseEmoji: string;
  phaseDescription: string;
  chanceOfConception: 'Low' | 'Medium' | 'High';
}

/**
 * Calculates cycle information for a given date based on cycle settings and actual period history.
 */
export function getCycleInfoForDate(
  dateStr: string, 
  settings: CycleSettings, 
  periodLogs: PeriodLog[] = []
): CycleInfo {
  const { cycleLength, periodLength, lastPeriodDate, isPCOSEnabled, isIrregular } = settings;
  
  // 1. Find the actual last period start date before or equal to the target date.
  // A period start is defined as a logged flow day ('Light'|'Medium'|'Heavy') that does not have a flow day immediately preceding it.
  const flowLogs = periodLogs
    .filter(p => p.flow && p.flow !== 'None')
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const flowDates = flowLogs.map(p => p.date);
  const cycleStartDates: string[] = [];
  
  flowDates.forEach(d => {
    const dDate = new Date(d + 'T00:00:00');
    const prevDateStr = new Date(dDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (!flowDates.includes(prevDateStr)) {
      cycleStartDates.push(d);
    }
  });

  const targetDate = new Date(dateStr + 'T00:00:00');
  const targetTime = targetDate.getTime();

  // Find the most recent cycle start that is before or on targetDate
  const pastStarts = cycleStartDates
    .filter(d => new Date(d + 'T00:00:00').getTime() <= targetTime)
    .sort((a, b) => b.localeCompare(a)); // sorting descending

  const actualLmpDateStr = pastStarts.length > 0 ? pastStarts[0] : lastPeriodDate;
  const lmpDate = new Date(actualLmpDateStr + 'T00:00:00');
  
  const diffTime = targetDate.getTime() - lmpDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let cycleDay = 1;
  const isLongCycle = isPCOSEnabled || isIrregular;

  if (diffDays >= 0) {
    if (isLongCycle) {
      // In PCOS or Irregular mode, let the cycle day count up continuously without wrapping
      cycleDay = diffDays + 1;
    } else {
      // Standard regular wrapping
      cycleDay = (diffDays % cycleLength) + 1;
    }
  } else {
    // Handle target dates prior to LMP by wrapping backwards stable
    cycleDay = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
  }
  
  let phase: CyclePhase = 'Luteal';
  let phaseColor = 'text-purple-750';
  let phaseBg = 'bg-purple-50/70';
  let phaseBorder = 'border-purple-250/30';
  let phaseEmoji = '🌙';
  let phaseDescription = 'Progesterone peaks, winding down. Nesting, self-reflection.';
  let chanceOfConception: 'Low' | 'Medium' | 'High' = 'Low';

  const halfCycle = Math.floor(cycleLength / 2);

  // Check if target day has LH Peak or Fertile Cervical Mucus in logged symptoms
  const currentDayLog = periodLogs.find(p => p.date === dateStr);
  const hasLHPeak = currentDayLog?.lhTest === 'Peak' || currentDayLog?.lhTest === 'Positive';
  const hasFertileMucus = currentDayLog?.cervicalMucus === 'Egg-white' || currentDayLog?.cervicalMucus === 'Watery';

  if (cycleDay <= periodLength) {
    phase = 'Menstrual';
    phaseColor = 'text-rose-700';
    phaseBg = 'bg-rose-50/75';
    phaseBorder = 'border-rose-200/50';
    phaseEmoji = '🩸';
    phaseDescription = 'Hormones low. Rest, gentle movement, inward focus and recovery.';
    chanceOfConception = 'Low';
  } else if (isLongCycle && cycleDay > cycleLength) {
    // Extended Follicular Phase typical of PCOS (delayed ovulation / unpredictable cycle)
    phase = 'Extended Follicular';
    phaseColor = 'text-amber-750';
    phaseBg = 'bg-amber-50/80';
    phaseBorder = 'border-amber-250/40';
    phaseEmoji = '⏳';
    phaseDescription = 'Extended cycle day. Follicles are developing slowly. Focus on insulin-sensitivity, stress reduction, and checking LH/mucus markers.';
    chanceOfConception = (hasLHPeak || hasFertileMucus) ? 'High' : 'Medium';
  } else if (cycleDay <= halfCycle - 2) {
    phase = 'Follicular';
    phaseColor = 'text-emerald-750';
    phaseBg = 'bg-emerald-50/70';
    phaseBorder = 'border-emerald-250/30';
    phaseEmoji = '🌱';
    phaseDescription = 'Estrogen rises. Energetic build-up, planning, and focused creativity.';
    chanceOfConception = hasFertileMucus ? 'High' : 'Medium';
  } else if (cycleDay <= halfCycle + 1 || hasLHPeak) {
    phase = 'Ovulatory';
    phaseColor = 'text-orange-700';
    phaseBg = 'bg-orange-50/70';
    phaseBorder = 'border-orange-250/35';
    phaseEmoji = '✨';
    phaseDescription = 'Estrogen peaks. High physical energy, social confidence, and biological fertility peak.';
    chanceOfConception = 'High';
  } else {
    phase = 'Luteal';
    phaseColor = 'text-purple-700';
    phaseBg = 'bg-purple-50/70';
    phaseBorder = 'border-purple-200/40';
    phaseEmoji = '🌙';
    phaseDescription = 'Progesterone rises. Slower biological pacing, detail-oriented work, and self-care.';
    chanceOfConception = 'Low';
  }

  return {
    cycleDay,
    phase,
    phaseColor,
    phaseBg,
    phaseBorder,
    phaseEmoji,
    phaseDescription,
    chanceOfConception,
  };
}

export interface PhaseCorrelation {
  phase: CyclePhase;
  emoji: string;
  color: string;
  entriesCount: number;
  moodCounts: { mood: string; count: number; percentage: number }[];
  symptomsCount: { symptom: string; count: number }[];
}

/**
 * Calculates correlation stats between moods, symptoms, and cycle phases.
 */
export function calculateCycleCorrelation(
  entries: JournalEntry[],
  periodLogs: PeriodLog[],
  settings: CycleSettings
): PhaseCorrelation[] {
  const phases: CyclePhase[] = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal', 'Extended Follicular'];
  const emojis: Record<CyclePhase, string> = {
    Menstrual: '🩸',
    Follicular: '🌱',
    Ovulatory: '✨',
    Luteal: '🌙',
    'Extended Follicular': '⏳',
  };
  const colors: Record<CyclePhase, string> = {
    Menstrual: 'rose',
    Follicular: 'emerald',
    Ovulatory: 'orange',
    Luteal: 'purple',
    'Extended Follicular': 'amber',
  };

  // Group entries and period log symptoms by cycle phase
  const groupedData = phases.reduce((acc, phase) => {
    acc[phase] = {
      entries: [] as JournalEntry[],
      symptoms: {} as Record<string, number>,
      moods: {} as Record<string, number>,
    };
    return acc;
  }, {} as Record<CyclePhase, { entries: JournalEntry[]; symptoms: Record<string, number>; moods: Record<string, number> }>);

  // Map entries to their phase on that day
  entries.forEach(entry => {
    const info = getCycleInfoForDate(entry.date, settings, periodLogs);
    groupedData[info.phase].entries.push(entry);
    groupedData[info.phase].moods[entry.mood] = (groupedData[info.phase].moods[entry.mood] || 0) + 1;
  });

  // Map period log symptoms to their phase on that day
  periodLogs.forEach(log => {
    const info = getCycleInfoForDate(log.date, settings, periodLogs);
    
    // Regular menstrual symptoms
    log.symptoms.forEach(sym => {
      groupedData[info.phase].symptoms[sym] = (groupedData[info.phase].symptoms[sym] || 0) + 1;
    });
    
    // PCOS custom symptoms
    if (log.pcosSymptoms) {
      log.pcosSymptoms.forEach(sym => {
        groupedData[info.phase].symptoms[`PCOS: ${sym}`] = (groupedData[info.phase].symptoms[`PCOS: ${sym}`] || 0) + 1;
      });
    }
  });

  return phases.map(phase => {
    const data = groupedData[phase];
    const totalEntries = data.entries.length;
    
    // Convert mood counts to sorted array with percentages
    const moodCounts = Object.entries(data.moods)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Convert symptoms counts to sorted array
    const symptomsCount = Object.entries(data.symptoms)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count);

    return {
      phase,
      emoji: emojis[phase],
      color: colors[phase],
      entriesCount: totalEntries,
      moodCounts,
      symptomsCount,
    };
  });
}

