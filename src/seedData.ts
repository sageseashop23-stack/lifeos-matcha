import { JournalEntry, ContentItem, SocialEvent, EvidenceDeliverable, PeriodLog, CycleSettings } from './types';

// Generator function to produce authentic, varied datasets from Jan 1, 2026 to Sept 26, 2026
function generateMassData() {
  const journalEntries: JournalEntry[] = [];
  const contentItems: ContentItem[] = [];
  const socialEvents: SocialEvent[] = [];
  const evidenceDeliverables: EvidenceDeliverable[] = [];
  const periodLogs: PeriodLog[] = [];

  const moods = [
    '🌸 Serene', '⚡ Focused', '🔋 Energetic', '📝 Grateful', 
    '😴 Tired', '💭 Reflective', '🌱 Growing'
  ];

  const journalTopics = [
    { title: 'Morning clarity & routine', text: 'Started early with deep breathing and green tea. Felt centered before checking notifications.', tags: ['Mindfulness', 'Habits'] },
    { title: 'Deep work sprint on architecture', text: 'Refactored backend data sync and modular components. Flow state achieved for 3 solid hours.', tags: ['Build', 'Engineering'] },
    { title: 'Strategy and revenue milestones', text: 'Reviewed pipeline targets. Focused on lean operations and delivering outsized customer value.', tags: ['Business', 'Strategy'] },
    { title: 'Evening reset and movement', text: 'Completed a 6km recovery run outdoors. Physical movement immediately untangled mental fatigue.', tags: ['Health', 'Fitness'] },
    { title: 'Digital sanctuary reflections', text: 'Gratitude for building tools that create quiet, peaceful leverage in daily life.', tags: ['Reflections', 'Spiritual'] },
    { title: 'Midweek review & priority check', text: 'Cut two low-priority tasks from the sprint. Saying no is the true productivity superpower.', tags: ['Productivity', 'Focus'] },
    { title: 'Creative session & visual polish', text: 'Tuned the palette contrast and subtle borders. Design harmony brings calm to daily usage.', tags: ['Design', 'Creative'] },
    { title: 'Mentorship and peer learning', text: 'Great exchange of ideas with fellow builders. Collective wisdom is invaluable.', tags: ['Community', 'Learning'] }
  ];

  const contentTitles = [
    { title: 'LifeOS Mini launch manifesto', platform: 'Substack', phase: 'Completion' as const, status: 'Published' },
    { title: 'Why local-first software wins', platform: 'X / Twitter', phase: 'Completion' as const, status: 'Published' },
    { title: '3-Lens productivity breakdown', platform: 'YouTube', phase: 'Production' as const, status: 'Editing' },
    { title: 'Building resilient Apps Script backends', platform: 'LinkedIn', phase: 'Planning' as const, status: 'Draft' },
    { title: 'Minimalist desktop aesthetic walkthrough', platform: 'Instagram Reels', phase: 'Completion' as const, status: 'Published' },
    { title: 'Hormonal cycle-aware task scheduling', platform: 'Newsletter', phase: 'Production' as const, status: 'In Review' },
    { title: 'From chaos to clarity: A Notion refugee story', platform: 'Blog', phase: 'Planning' as const, status: 'Outlined' },
    { title: 'How to build your own personal API', platform: 'Substack', phase: 'Completion' as const, status: 'Published' }
  ];

  const socialTitles = [
    { title: 'Coffee & product teardown', phase: 'Completed' as const, status: 'Attended', notes: 'Insightful discussion on offline database syncing.' },
    { title: 'Design founders mastermind', phase: 'Completed' as const, status: 'Attended', notes: 'Monthly founder sync on traction and product-market fit.' },
    { title: 'Weekend family gathering & cooking', phase: 'Completed' as const, status: 'Attended', notes: 'Unplugged Sunday lunch with family.' },
    { title: 'Virtual indie maker coffee chat', phase: 'Active' as const, status: 'Upcoming', notes: 'Chatting with makers about local storage resilience.' },
    { title: 'Evening acoustic concert outing', phase: 'Completed' as const, status: 'Attended', notes: 'Live jazz music reset after a heavy shipping week.' },
    { title: 'Quarterly board & mentor review', phase: 'Active' as const, status: 'Scheduled', notes: 'Reviewing progress and runway for Q4.' }
  ];

  const evidenceTitles: { title: string; capacity: number; val: number; unit: 'currency' | 'hours' | 'percent'; quality: number }[] = [
    { title: 'Shipped zero-latency client data cache', capacity: 2, val: 95, unit: 'percent', quality: 98 },
    { title: 'Published complete API sync guide', capacity: 1, val: 48, unit: 'hours', quality: 92 },
    { title: 'Closed Q1 architectural sprint deliverables', capacity: 3, val: 100, unit: 'percent', quality: 95 },
    { title: 'Designed high-density responsive calendar grid', capacity: 2, val: 99, unit: 'percent', quality: 96 },
    { title: 'Shipped bidirectional Google Sheets connector', capacity: 2, val: 100, unit: 'percent', quality: 99 },
    { title: 'Implemented cyclical health & energy correlation engine', capacity: 2, val: 32, unit: 'hours', quality: 94 },
    { title: 'Refactored state hydration for mass stress testing', capacity: 1, val: 260, unit: 'hours', quality: 100 }
  ];

  // Helper date formatter
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Loop through every day from Jan 1, 2026 to Sept 26, 2026 (269 days)
  const startDate = new Date(2026, 0, 1);
  const endDate = new Date(2026, 8, 26); // Sept 26, 2026

  let cycleDay = 1;
  const cycleLength = 28;
  const periodLength = 5;

  let current = new Date(startDate);
  let counter = 0;

  while (current <= endDate) {
    const dateStr = formatDate(current);
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday

    // 1. Journal entries (logged every 1-2 days)
    if (counter % 2 === 0 || dayOfWeek === 0 || dateStr === '2026-09-25' || dateStr === '2026-09-26') {
      const topic = journalTopics[(counter + current.getDate()) % journalTopics.length];
      const mood = moods[(counter * 3 + current.getDate()) % moods.length];
      journalEntries.push({
        id: `j-mass-${dateStr}`,
        date: dateStr,
        content: `**${topic.title}**\n${topic.text} (Recorded on ${dateStr} - LifeOS Sanctuary).`,
        mood: mood,
        tags: topic.tags,
        photos: []
      });
    }

    // 2. Content Pipeline Items (approx 2-3 per week)
    if (dayOfWeek === 2 || dayOfWeek === 5) {
      const c = contentTitles[(counter + current.getMonth()) % contentTitles.length];
      const isPast = current < new Date(2026, 8, 20);
      contentItems.push({
        id: `c-mass-${dateStr}`,
        date: dateStr,
        title: `${c.title} #${Math.floor(counter / 7) + 1}`,
        phase: isPast ? 'Completion' : c.phase,
        status: isPast ? 'Published' : c.status,
        notes: `Platform: ${c.platform}. Strategic distribution for Q${Math.floor(current.getMonth() / 3) + 1}.`
      });
    }

    // 3. Social Events (weekends and Thursdays)
    if (dayOfWeek === 4 || dayOfWeek === 6) {
      const s = socialTitles[(counter + current.getDate()) % socialTitles.length];
      const isPast = current < new Date(2026, 8, 24);
      socialEvents.push({
        id: `s-mass-${dateStr}`,
        date: dateStr,
        title: s.title,
        phase: isPast ? 'Completed' : s.phase,
        status: isPast ? 'Attended' : s.status,
        notes: s.notes
      });
    }

    // 4. Evidence Deliverables (every ~10 days)
    if (current.getDate() === 5 || current.getDate() === 15 || current.getDate() === 25) {
      const e = evidenceTitles[(counter + current.getMonth()) % evidenceTitles.length];
      evidenceDeliverables.push({
        id: `e-mass-${dateStr}`,
        date: dateStr,
        title: `${e.title}`,
        capacityCount: e.capacity,
        impactValue: e.val,
        impactUnit: e.unit,
        qualityScore: e.quality,
        notes: `Milestone verified for ${dateStr}. High impact delivery record.`
      });
    }

    // 5. Hormonal & Cycle Logs throughout the entire 9 months
    if (cycleDay <= periodLength) {
      periodLogs.push({
        id: `p-mass-${dateStr}`,
        date: dateStr,
        flow: cycleDay === 1 || cycleDay === 2 ? 'Heavy' : cycleDay === 3 ? 'Medium' : 'Light',
        symptoms: cycleDay <= 2 ? ['Cramping', 'Fatigue'] : ['Fatigue'],
        notes: `Cycle Day ${cycleDay}: Menstrual phase pacing. Warm hydration.`
      });
    } else if (cycleDay === 14) {
      periodLogs.push({
        id: `p-mass-${dateStr}`,
        date: dateStr,
        flow: 'None',
        symptoms: ['High Energy', 'Mental Clarity'],
        lhTest: 'Peak',
        cervicalMucus: 'Egg-white',
        notes: `Cycle Day 14: Ovulatory peak. Maximum physical & cognitive capacity.`
      });
    } else if (cycleDay === 26) {
      periodLogs.push({
        id: `p-mass-${dateStr}`,
        date: dateStr,
        flow: 'None',
        symptoms: ['Bloating', 'Sugar Cravings'],
        notes: `Cycle Day 26: Late luteal phase. Prioritized sleep and reduced high-strain meetings.`
      });
    }

    cycleDay = (cycleDay % cycleLength) + 1;
    current.setDate(current.getDate() + 1);
    counter++;
  }

  // Reverse so newest entries appear first where expected
  journalEntries.reverse();

  return {
    journalEntries,
    contentItems,
    socialEvents,
    evidenceDeliverables,
    periodLogs,
    cycleSettings: {
      cycleLength: 28,
      periodLength: 5,
      lastPeriodDate: '2026-09-18', // Recent cycle in September 2026
      isPCOSEnabled: false,
      isIrregular: false
    }
  };
}

export const MASS_STRESS_TEST_DATA = generateMassData();

export const INITIAL_JOURNAL_ENTRIES = MASS_STRESS_TEST_DATA.journalEntries;
export const INITIAL_CONTENT_ITEMS = MASS_STRESS_TEST_DATA.contentItems;
export const INITIAL_SOCIAL_EVENTS = MASS_STRESS_TEST_DATA.socialEvents;
export const INITIAL_EVIDENCE_DELIVERABLES = MASS_STRESS_TEST_DATA.evidenceDeliverables;
export const INITIAL_PERIOD_LOGS = MASS_STRESS_TEST_DATA.periodLogs;
export const INITIAL_CYCLE_SETTINGS = MASS_STRESS_TEST_DATA.cycleSettings;
