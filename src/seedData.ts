import { JournalEntry, ContentItem, SocialEvent, EvidenceDeliverable } from './types';

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'j-1',
    date: '2026-07-15',
    content: 'Reflecting on the progress of Q3 goals. The habit of daily reflection is grounding me. Feeling a bit fatigued but clear-headed and focused on consistency.',
    mood: '🌸 Serene',
    tags: ['Reflections', 'Spiritual'],
    photos: []
  },
  {
    id: 'j-2',
    date: '2026-07-17',
    content: 'Began drafting the design spec for LifeOS Mini. The tiered pricing model (Lite vs Complete) is definitely the right move. Complete version will include the full 3 lenses. Keeps the core offering highly valuable and easy to maintain.',
    mood: '⚡ Focused',
    tags: ['Business', 'Build'],
    photos: []
  },
  {
    id: 'j-3',
    date: '2026-07-18',
    content: 'Finished a solid 5km trail run today. Muscle soreness is real, but mentally I feel completely restored. Consistency is starting to compound.',
    mood: '🔋 Energetic',
    tags: ['Health', 'Fitness'],
    photos: []
  },
  {
    id: 'j-4',
    date: '2026-07-19',
    content: 'Sunday morning clarity. Writing the setup documentation for the self-hosted Google Sheet model. Standardized JSON-to-Sheet Apps Script allows buyers to own their database entirely.',
    mood: '📝 Grateful',
    tags: ['Writing', 'Productivity'],
    photos: []
  }
];

export const INITIAL_CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'c-1',
    date: '2026-07-12',
    title: 'Write LifeOS Mini announcement thread',
    phase: 'Completion',
    status: 'Published',
    notes: 'Shared on Threads and Twitter. Focus on single-view simplicity.'
  },
  {
    id: 'c-2',
    date: '2026-07-17',
    title: 'Record Loom setup video for Sheets integration',
    phase: 'Production',
    status: 'Draft',
    notes: 'Keep it under 3 minutes. Focus on Apps Script copy-pasting.'
  },
  {
    id: 'c-3',
    date: '2026-07-20',
    title: 'Design Gumroad launch banners',
    phase: 'Planning',
    status: 'Planned',
    notes: 'Clean minimalist design with a sleek cosmic slate look.'
  },
  {
    id: 'c-4',
    date: '2026-07-24',
    title: 'Pre-launch email to early buyers list',
    phase: 'Planning',
    status: 'Idea',
    notes: 'Highlight the 3-lens calendar complexity and pricing tiers.'
  }
];

export const INITIAL_SOCIAL_EVENTS: SocialEvent[] = [
  {
    id: 's-1',
    date: '2026-07-15',
    title: 'Weekly Spiritual Study Class (Online)',
    phase: 'Completed',
    status: 'Attended',
    notes: 'Discussed sincerity and consistency in daily practices.'
  },
  {
    id: 's-2',
    date: '2026-07-19',
    title: 'Sunday Dinner with Family',
    phase: 'Active',
    status: 'Today',
    notes: 'Bringing local desserts. Rest and connection night.'
  },
  {
    id: 's-3',
    date: '2026-07-22',
    title: 'Monthly Professional Therapy Session',
    phase: 'Planning',
    status: 'Confirmed',
    notes: 'Trauma processing and mental resilience check-in.'
  },
  {
    id: 's-4',
    date: '2026-07-26',
    title: 'Morning 5km Community Run',
    phase: 'Planning',
    status: 'Invited',
    notes: 'Gathering at the park at 7 AM. Friendly group pace.'
  }
];

export const INITIAL_EVIDENCE_DELIVERABLES: EvidenceDeliverable[] = [
  {
    id: 'e-1',
    date: '2026-07-14',
    title: 'Built and verified the Sheets Sync Core Integration',
    capacityCount: 1,
    impactValue: 8,
    impactUnit: 'hours',
    qualityScore: 100,
    notes: 'Saved 8 hours of manual backup time. Full JSON integration with robust field verification.'
  },
  {
    id: 'e-2',
    date: '2026-07-16',
    title: 'Refined Gumroad sales copy using 70/20/10 structure',
    capacityCount: 1,
    impactValue: 250,
    impactUnit: 'currency',
    qualityScore: 95,
    notes: 'Generated RM250 in direct pre-order sales. High-contrast layout converts exceptionally well.'
  },
  {
    id: 'e-3',
    date: '2026-07-18',
    title: 'Completed 5km trail run under 32 minutes',
    capacityCount: 1,
    impactValue: 15,
    impactUnit: 'percent',
    qualityScore: 100,
    notes: '15% improvement in cardiovascular endurance and pacing consistency compared to June.'
  }
];

export const INITIAL_PERIOD_LOGS: any[] = [
  {
    id: 'p-1',
    date: '2026-07-10',
    flow: 'Heavy',
    symptoms: ['Cramping', 'Fatigue'],
    notes: 'First day of cycle. Felt tired but stayed warm.'
  },
  {
    id: 'p-2',
    date: '2026-07-11',
    flow: 'Medium',
    symptoms: ['Cramping', 'Bloating'],
    notes: 'Bloating began in the afternoon. Drank warm chamomile tea.'
  },
  {
    id: 'p-3',
    date: '2026-07-12',
    flow: 'Light',
    symptoms: ['Fatigue'],
    notes: 'Period flow decreasing, but still lower energy.'
  },
  {
    id: 'p-4',
    date: '2026-07-13',
    flow: 'Light',
    symptoms: ['Headache'],
    notes: 'Mild headache. Rested early.'
  }
];

export const INITIAL_CYCLE_SETTINGS = {
  cycleLength: 28,
  periodLength: 5,
  lastPeriodDate: '2026-07-10'
};

