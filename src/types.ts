export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood: string; // Emoji + text, e.g., "🌸 Serene"
  tags: string[];
  photos: string[]; // base64 strings or URLs
}

export type ContentPhase = 'Planning' | 'Production' | 'Completion';

export interface ContentItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  phase: ContentPhase;
  status: string; // "Idea" | "Planned" | "Briefed" | "In Progress" | "Draft" | "Review" | "Scheduled" | "Published" | "Archived" | "On Hold" | "Cancelled" | "Needs Revision" | "Final Approval"
  notes: string;
}

export type SocialPhase = 'Planning' | 'Active' | 'Completed';

export interface SocialEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  phase: SocialPhase;
  status: string; // "Proposed" | "Invited" | "Confirmed" | "Upcoming" | "This Week" | "Today" | "Attended" | "Cancelled" | "Missed"
  notes: string;
}

export interface EvidenceDeliverable {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  capacityCount: number; // raw count of completed work
  impactValue: number; // numeric value
  impactUnit: 'currency' | 'hours' | 'percent'; // $, hours, %
  qualityScore: number; // 0 to 100 representing accuracy/completeness
  notes: string;
}

export interface SyncConfig {
  sheetUrl: string; // Apps Script Web App URL
  password?: string; // Optional security credential token
  name?: string; // User's name
  enabled: boolean;
  lastSyncedAt?: string;
}

export type PeriodFlow = 'None' | 'Light' | 'Medium' | 'Heavy';

export interface PeriodLog {
  id: string;
  date: string; // YYYY-MM-DD
  flow: PeriodFlow;
  symptoms: string[]; // e.g. ["Cramping", "Bloating", "Headache", "Fatigue", "Mood swings"]
  notes?: string;
  
  // PCOS / Fertility Tracking Parameters
  lhTest?: 'Negative' | 'Positive' | 'High' | 'Peak' | 'Not Tested'; // Luteinizing Hormone strip results
  basalBodyTemp?: number; // Basal Body Temperature in Celsius or Fahrenheit
  cervicalMucus?: 'Dry' | 'Sticky' | 'Creamy' | 'Egg-white' | 'Watery' | 'None';
  pcosSymptoms?: string[]; // e.g. ["Hirsutism", "Hormonal Acne", "Hair Thinning", "Sugar Cravings", "Ovarian Pain", "Fatigue/Brain Fog"]
}

export interface LensMeta {
  name: string;
  emoji: string;
  description: string;
}

export interface LensConfig {
  content: LensMeta;
  social: LensMeta;
  evidence: LensMeta;
}

export interface CycleSettings {
  cycleLength: number;
  periodLength: number;
  lastPeriodDate: string;
  isPCOSEnabled?: boolean;
  isIrregular?: boolean;
}

