# Looking Back Analytics Architecture & Backend Documentation

## Overview

The **Looking Back** tab is the analytical core of **LifeOS Mini**. It synthesizes multi-dimensional personal data—private journal logs, custom mood tags, life-balance activity vectors (Content, Social, Deliverables), and physiological cycle logs—into holistic retrospective insights and trends.

---

## Data Schema & Data Structures

All data points in LifeOS Mini are strongly typed in TypeScript (`/src/types.ts`) and persisted across client storage (`localStorage`) and cloud sync targets (Google Drive / Sheets API).

### 1. Primary Data Collections

```typescript
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: string; // e.g. "🌸 Serene", "⚡ Focused", or user-customized mood
  content: string;
  tags: string[];
  photos?: string[];
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  channel: string;
  date: string; // YYYY-MM-DD
  type: 'Video' | 'Article' | 'Post' | 'Newsletter' | 'Podcast';
  status: 'Idea' | 'Drafting' | 'Scheduled' | 'Published';
  link?: string;
}

export interface SocialEvent {
  id: string;
  title: string;
  category: 'Family' | 'Friends' | 'Networking' | 'Community' | 'Date';
  date: string; // YYYY-MM-DD
  attendees?: string;
  memoryNotes?: string;
}

export interface EvidenceDeliverable {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  impactCategory: 'Career' | 'Health' | 'Finance' | 'Creative' | 'Personal';
  qualityScore: number; // 0 - 100%
  proofUrl?: string;
}

export interface PeriodLog {
  id: string;
  date: string; // YYYY-MM-DD
  flow: 'Light' | 'Medium' | 'Heavy' | 'Spotting';
  symptoms: string[];
  mood?: string;
  notes?: string;
}
```

---

## Analytics Processing Engine

The **Looking Back** component (`/src/components/LookingBackModule.tsx`) processes all historical data in real-time without backend latency using client-side reactive dynamic filtering.

### 1. Dynamic Timeframe Filtering

Users can filter historical analytics across **Last 30 Days**, **Last 90 Days**, or **All Time**:

```typescript
// Computes ISO cutoff date relative to current day
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

// Filters collections instantly
const filteredJournalEntries = journalEntries.filter(item => item.date >= cutoffDate);
const filteredContentItems = contentItems.filter(item => item.date >= cutoffDate);
const filteredSocialEvents = socialEvents.filter(item => item.date >= cutoffDate);
const filteredEvidenceDeliverables = evidenceDeliverables.filter(item => item.date >= cutoffDate);
const filteredPeriodLogs = periodLogs.filter(item => item.date >= cutoffDate);
```

### 2. Mood Frequency & Distribution

Calculates mood occurrence totals and normalizes them into percentage metrics:

```typescript
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
```

### 3. 3-Lens Life Balance Triad

Measures activity allocation between output creation (Content), social connections (Social), and high-impact proof (Deliverables):

$$\text{Content \%} = \left(\frac{\text{Content Items}}{\text{Total Events}}\right) \times 100$$
$$\text{Social \%} = \left(\frac{\text{Social Events}}{\text{Total Events}}\right) \times 100$$
$$\text{Capacity \%} = \left(\frac{\text{Deliverables}}{\text{Total Events}}\right) \times 100$$

### 4. Quality Standard Index

Averages quality scores across deliverables within the active window:

```typescript
const averageQuality = filteredEvidenceDeliverables.length > 0
  ? Math.round(
      filteredEvidenceDeliverables.reduce((acc, curr) => acc + curr.qualityScore, 0) / 
      filteredEvidenceDeliverables.length
    )
  : 100;
```

---

## Backend & Persistence Integration

LifeOS Mini is designed for **100% user data sovereignty and privacy**:

```
+-------------------------------------------------------------+
|                      React Frontend                         |
|  (Journal, Calendar, Looking Back Analytics, Custom Moods)  |
+------------------------------+------------------------------+
                               |
                   +-----------v-----------+
                   |  Browser localStorage  |
                   | (Instant Local Read)  |
                   +-----------+-----------+
                               |
             +-----------------v-----------------+
             |     Google Drive / Sheets API     |
             |  (Self-hosted cloud spreadsheet)  |
             +-----------------------------------+
```

1. **Immediate Local Persistence**: All entry additions, edits, custom mood presets, and cycle logs are immediately saved to `localStorage`. This ensures zero lag and full offline capability.
2. **Google Drive Cloud Sync**: When configured in the Settings menu, data is synchronized as structured rows to a personal Google Sheet on your Google Drive.
3. **Resilience & Fault Tolerance**: If network connection drops, analytics run seamlessly off the local cache. When re-connected, data reconciles automatically without losing entry timestamps or scores.
