import React, { useState } from 'react';
import { 
  X, BookOpen, Calendar as CalendarIcon, HeartHandshake, Video, 
  CheckCircle2, Sparkles, Plus, Activity, Heart, Clock 
} from 'lucide-react';
import { 
  JournalEntry, ContentItem, SocialEvent, EvidenceDeliverable, 
  PeriodLog, PeriodFlow, ContentPhase, SocialPhase 
} from '../types';

interface CreateEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onAddJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onAddContentItem: (item: Omit<ContentItem, 'id' | 'createdAt'>) => void;
  onAddSocialEvent: (event: Omit<SocialEvent, 'id' | 'createdAt'>) => void;
  onAddEvidenceDeliverable: (deliverable: Omit<EvidenceDeliverable, 'id' | 'createdAt'>) => void;
  onSavePeriodLog: (log: PeriodLog) => void;
}

const getPresetMoods = () => {
  try {
    const saved = localStorage.getItem('custom_user_moods');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return ['🌸 Serene', '⚡ Focused', '🔋 Energetic', '📝 Grateful', '😴 Tired', '💭 Reflective', '🌱 Growing'];
};

export default function CreateEntryModal({
  isOpen,
  onClose,
  selectedDate,
  onAddJournalEntry,
  onAddContentItem,
  onAddSocialEvent,
  onAddEvidenceDeliverable,
  onSavePeriodLog
}: CreateEntryModalProps) {
  const [entryType, setEntryType] = useState<'journal' | 'period' | 'content' | 'social' | 'deliverable'>('journal');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  // Mood options loaded from custom local storage
  const [moodOptions] = useState<string[]>(getPresetMoods);

  // Journal State
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState(moodOptions[0] || '🌸 Serene');
  const [journalTags, setJournalTags] = useState('');

  // Period State
  const [flow, setFlow] = useState<PeriodFlow>('Medium');
  const [periodSymptoms, setPeriodSymptoms] = useState<string[]>([]);
  const [lhTest, setLhTest] = useState<'Negative' | 'Positive' | 'High' | 'Peak' | 'Not Tested'>('Not Tested');

  // Content State
  const [contentTitle, setContentTitle] = useState('');
  const [contentPhase, setContentPhase] = useState<ContentPhase>('Planning');
  const [contentStatus, setContentStatus] = useState('Draft');
  const [contentNotes, setContentNotes] = useState('');

  // Social State
  const [socialTitle, setSocialTitle] = useState('');
  const [socialPhase, setSocialPhase] = useState<SocialPhase>('Planning');
  const [socialStatus, setSocialStatus] = useState('Upcoming');
  const [socialNotes, setSocialNotes] = useState('');

  // Deliverable State
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [capacityCount, setCapacityCount] = useState(1);
  const [impactValue, setImpactValue] = useState(100);
  const [impactUnit, setImpactUnit] = useState<'currency' | 'hours' | 'percent'>('hours');
  const [qualityScore, setQualityScore] = useState(95);
  const [deliverableNotes, setDeliverableNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entryType === 'journal') {
      if (!journalContent.trim()) return;
      onAddJournalEntry({
        date,
        content: journalContent,
        mood: journalMood,
        tags: journalTags.split(',').map(t => t.trim()).filter(Boolean),
        photos: []
      });
      setJournalContent('');
    } else if (entryType === 'period') {
      onSavePeriodLog({
        id: `period-${date}`,
        date,
        flow,
        symptoms: periodSymptoms,
        lhTest
      });
    } else if (entryType === 'content') {
      if (!contentTitle.trim()) return;
      onAddContentItem({
        date,
        title: contentTitle,
        phase: contentPhase,
        status: contentStatus,
        notes: contentNotes
      });
      setContentTitle('');
      setContentNotes('');
    } else if (entryType === 'social') {
      if (!socialTitle.trim()) return;
      onAddSocialEvent({
        date,
        title: socialTitle,
        phase: socialPhase,
        status: socialStatus,
        notes: socialNotes
      });
      setSocialTitle('');
      setSocialNotes('');
    } else if (entryType === 'deliverable') {
      if (!deliverableTitle.trim()) return;
      onAddEvidenceDeliverable({
        date,
        title: deliverableTitle,
        capacityCount,
        impactValue,
        impactUnit,
        qualityScore,
        notes: deliverableNotes
      });
      setDeliverableTitle('');
      setDeliverableNotes('');
    }

    onClose();
  };

  const SYMPTOM_CHOICES = ['Cramping', 'Bloating', 'Fatigue', 'Headache', 'Mood Swings', 'Acne', 'Cravings'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-matcha-primary/20 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-matcha-primary/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-matcha-primary/10 rounded-xl text-matcha-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-dark font-display">Create New Entry</h2>
              <p className="text-xs text-[#5D524F]/70">Add data to your Journal or 3-Lens Calendar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5D524F]/60 hover:text-ink-dark hover:bg-[#FAF0EC] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entry Type Switcher */}
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#FAF0EC]/60 border border-matcha-primary/10 rounded-2xl mb-4 text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setEntryType('journal')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
              entryType === 'journal' ? 'bg-matcha-primary text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px]">Journal</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryType('period')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
              entryType === 'period' ? 'bg-strawberry-accent text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="text-[10px]">Cycle</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryType('content')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
              entryType === 'content' ? 'bg-matcha-primary text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-[10px]">Content</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryType('social')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
              entryType === 'social' ? 'bg-matcha-primary text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span className="text-[10px]">Social</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryType('deliverable')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
              entryType === 'deliverable' ? 'bg-matcha-primary text-white shadow-xs' : 'text-[#5D524F]/70 hover:bg-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px]">Capacity</span>
          </button>
        </div>

        {/* Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Shared Date Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
              Target Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] font-mono focus:outline-none focus:ring-1 focus:ring-matcha-primary"
            />
          </div>

          {/* 1. Journal Form */}
          {entryType === 'journal' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Current Mood
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {moodOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setJournalMood(m)}
                      className={`py-1.5 px-2 rounded-xl text-xs border text-left truncate transition-all cursor-pointer ${
                        journalMood === m
                          ? 'bg-matcha-primary text-white border-matcha-primary font-bold shadow-xs'
                          : 'bg-[#FAF0EC]/20 border-matcha-primary/10 text-[#5D524F] hover:bg-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Reflection & Journal Notes
                </label>
                <textarea
                  rows={4}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Write your thoughts, daily reflections, or gratitude..."
                  className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-xl p-3 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={journalTags}
                  onChange={(e) => setJournalTags(e.target.value)}
                  placeholder="e.g. mindfulness, work, gratitude"
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                />
              </div>
            </div>
          )}

          {/* 2. Period / Cycle Form */}
          {entryType === 'period' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Period Flow Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['None', 'Light', 'Medium', 'Heavy'] as PeriodFlow[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFlow(f)}
                      className={`py-2 px-2 rounded-xl text-xs border font-bold transition-all cursor-pointer text-center ${
                        flow === f
                          ? 'bg-strawberry-accent text-white border-strawberry-accent shadow-xs'
                          : 'bg-[#FAF0EC]/20 border-matcha-primary/10 text-[#5D524F] hover:bg-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Symptoms Experienced
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SYMPTOM_CHOICES.map((sym) => {
                    const active = periodSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => {
                          if (active) setPeriodSymptoms(periodSymptoms.filter(s => s !== sym));
                          else setPeriodSymptoms([...periodSymptoms, sym]);
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer ${
                          active
                            ? 'bg-strawberry-accent text-white border-strawberry-accent font-bold'
                            : 'bg-white border-matcha-primary/20 text-[#5D524F]'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  LH Test Strip Result
                </label>
                <select
                  value={lhTest}
                  onChange={(e) => setLhTest(e.target.value as any)}
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary font-mono"
                >
                  <option value="Not Tested">Not Tested</option>
                  <option value="Negative">Negative</option>
                  <option value="Positive">Positive</option>
                  <option value="High">High</option>
                  <option value="Peak">Peak</option>
                </select>
              </div>
            </div>
          )}

          {/* 3. Content Form */}
          {entryType === 'content' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Content Title
                </label>
                <input
                  type="text"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="e.g. Weekly Vlog Edit, Substack Post..."
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                    Phase
                  </label>
                  <select
                    value={contentPhase}
                    onChange={(e) => setContentPhase(e.target.value as ContentPhase)}
                    className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] font-mono"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Production">Production</option>
                    <option value="Completion">Completion</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                    Status
                  </label>
                  <input
                    type="text"
                    value={contentStatus}
                    onChange={(e) => setContentStatus(e.target.value)}
                    placeholder="e.g. Draft, Scheduled"
                    className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={contentNotes}
                  onChange={(e) => setContentNotes(e.target.value)}
                  placeholder="Script outline, links, ideas..."
                  className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-xl p-2.5 text-xs text-[#5D524F]"
                />
              </div>
            </div>
          )}

          {/* 4. Social Form */}
          {entryType === 'social' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Event / Connection Title
                </label>
                <input
                  type="text"
                  value={socialTitle}
                  onChange={(e) => setSocialTitle(e.target.value)}
                  placeholder="e.g. Coffee with Sarah, Team Dinner..."
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                    Phase
                  </label>
                  <select
                    value={socialPhase}
                    onChange={(e) => setSocialPhase(e.target.value as SocialPhase)}
                    className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] font-mono"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                    Status
                  </label>
                  <input
                    type="text"
                    value={socialStatus}
                    onChange={(e) => setSocialStatus(e.target.value)}
                    placeholder="e.g. Confirmed, Attended"
                    className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={socialNotes}
                  onChange={(e) => setSocialNotes(e.target.value)}
                  placeholder="Location, details, reminders..."
                  className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-xl p-2.5 text-xs text-[#5D524F]"
                />
              </div>
            </div>
          )}

          {/* 5. Deliverable Form */}
          {entryType === 'deliverable' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Deliverable Title
                </label>
                <input
                  type="text"
                  value={deliverableTitle}
                  onChange={(e) => setDeliverableTitle(e.target.value)}
                  placeholder="e.g. Q3 Design System Audit, Client Deck..."
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] focus:outline-none focus:ring-1 focus:ring-matcha-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                    Capacity Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={capacityCount}
                    onChange={(e) => setCapacityCount(Number(e.target.value))}
                    className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                    Quality %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={qualityScore}
                    onChange={(e) => setQualityScore(Number(e.target.value))}
                    className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-3 py-2 text-xs text-[#5D524F] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                    Impact Unit
                  </label>
                  <select
                    value={impactUnit}
                    onChange={(e) => setImpactUnit(e.target.value as any)}
                    className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/20 rounded-xl px-2 py-2 text-xs text-[#5D524F] font-mono"
                  >
                    <option value="hours">Hours</option>
                    <option value="currency">Currency ($)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder="Deliverable outcomes, links, evidence..."
                  className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-xl p-2.5 text-xs text-[#5D524F]"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 border-t border-matcha-primary/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5D524F]/70 hover:bg-[#FAF0EC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-matcha-primary hover:bg-matcha-primary/90 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
