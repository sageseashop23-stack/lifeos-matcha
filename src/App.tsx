import React, { useState, useEffect } from 'react';
import { JournalEntry, ContentItem, SocialEvent, EvidenceDeliverable, SyncConfig, PeriodLog, CycleSettings } from './types';
import { 
  INITIAL_JOURNAL_ENTRIES, 
  INITIAL_CONTENT_ITEMS, 
  INITIAL_SOCIAL_EVENTS, 
  INITIAL_EVIDENCE_DELIVERABLES,
  INITIAL_PERIOD_LOGS,
  INITIAL_CYCLE_SETTINGS
} from './seedData';
import JournalModule from './components/JournalModule';
import CalendarModule from './components/CalendarModule';
import SettingsPanel from './components/SettingsPanel';
import CreateEntryModal from './components/CreateEntryModal';
import LookingBackModule from './components/LookingBackModule';
import { 
  Sparkles, Shield, Database, Calendar as CalendarIcon, 
  BookOpen, Star, HelpCircle, Heart, CheckCircle2, CloudLightning,
  Lock, Unlock, Key, Eye, EyeOff, AlertCircle, Plus, TrendingUp
} from 'lucide-react';

export default function App() {
  // Load data from localStorage or fallback to default seeds
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('lifeos_journal');
    return saved ? JSON.parse(saved) : INITIAL_JOURNAL_ENTRIES;
  });

  const [contentItems, setContentItems] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem('lifeos_content');
    return saved ? JSON.parse(saved) : INITIAL_CONTENT_ITEMS;
  });

  const [socialEvents, setSocialEvents] = useState<SocialEvent[]>(() => {
    const saved = localStorage.getItem('lifeos_social');
    return saved ? JSON.parse(saved) : INITIAL_SOCIAL_EVENTS;
  });

  const [evidenceDeliverables, setEvidenceDeliverables] = useState<EvidenceDeliverable[]>(() => {
    const saved = localStorage.getItem('lifeos_evidence');
    return saved ? JSON.parse(saved) : INITIAL_EVIDENCE_DELIVERABLES;
  });

  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>(() => {
    const saved = localStorage.getItem('lifeos_period');
    return saved ? JSON.parse(saved) : INITIAL_PERIOD_LOGS;
  });

  const [cycleSettings, setCycleSettings] = useState<CycleSettings>(() => {
    const saved = localStorage.getItem('lifeos_cycle_settings');
    return saved ? JSON.parse(saved) : INITIAL_CYCLE_SETTINGS;
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    const saved = localStorage.getItem('lifeos_sync_config');
    return saved ? JSON.parse(saved) : { sheetUrl: '', enabled: false };
  });

  // Check if first-time setup is completed
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    return localStorage.getItem('lifeos_setup_complete') === 'true';
  });

  const [setupData, setSetupData] = useState({
    name: '',
    sheetUrl: '',
    password: ''
  });

  const handleCompleteSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: SyncConfig = {
      sheetUrl: setupData.sheetUrl,
      password: setupData.password || undefined,
      name: setupData.name || 'Pretty XX', // Default if empty
      enabled: !!setupData.sheetUrl,
    };
    setSyncConfig(newConfig);
    localStorage.setItem('lifeos_sync_config', JSON.stringify(newConfig));
    localStorage.setItem('lifeos_setup_complete', 'true');
    setIsSetupComplete(true);
    if (newConfig.password) {
      sessionStorage.setItem('lifeos_session_authenticated', 'true');
      setIsAuthenticated(true);
    }
  };

  // Password Authentication Layer States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('lifeos_sync_config');
    const parsed = saved ? JSON.parse(saved) : null;
    if (!parsed || !parsed.password) {
      return true;
    }
    return sessionStorage.getItem('lifeos_session_authenticated') === 'true';
  });
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordMask, setShowPasswordMask] = useState(false);

  // Auto-authenticate if password is removed from the settings panel
  useEffect(() => {
    if (!syncConfig.password) {
      setIsAuthenticated(true);
      sessionStorage.removeItem('lifeos_session_authenticated');
    }
  }, [syncConfig.password]);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!syncConfig.password) {
      setIsAuthenticated(true);
      return;
    }
    if (enteredPassword === syncConfig.password) {
      setIsAuthenticated(true);
      setPasswordError('');
      sessionStorage.setItem('lifeos_session_authenticated', 'true');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  // Default selected date to 2026-07-19 (the seed data hub)
  const [selectedDate, setSelectedDate] = useState('2026-07-19');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'journal' | 'calendar' | 'looking_back'>('journal');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Customizable sub-headline state
  const [subHeadline, setSubHeadline] = useState<string>(() => {
    return localStorage.getItem('lifeos_sub_headline') || 'JOURNAL + 3-LENS LIFE CALENDAR';
  });
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [tempSub, setTempSub] = useState(subHeadline);

  const saveSubHeadline = (newSub: string) => {
    const cleanSub = newSub.trim() || 'JOURNAL + 3-LENS LIFE CALENDAR';
    setSubHeadline(cleanSub);
    localStorage.setItem('lifeos_sub_headline', cleanSub);
    setIsEditingSub(false);
  };

  // Auto-adapt default view based on screen width
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setActiveTab('journal');
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('lifeos_journal', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('lifeos_content', JSON.stringify(contentItems));
  }, [contentItems]);

  useEffect(() => {
    localStorage.setItem('lifeos_social', JSON.stringify(socialEvents));
  }, [socialEvents]);

  useEffect(() => {
    localStorage.setItem('lifeos_evidence', JSON.stringify(evidenceDeliverables));
  }, [evidenceDeliverables]);

  useEffect(() => {
    localStorage.setItem('lifeos_period', JSON.stringify(periodLogs));
  }, [periodLogs]);

  useEffect(() => {
    localStorage.setItem('lifeos_cycle_settings', JSON.stringify(cycleSettings));
  }, [cycleSettings]);


  useEffect(() => {
    localStorage.setItem('lifeos_sync_config', JSON.stringify(syncConfig));
  }, [syncConfig]);

  // Operations - Journal
  const handleAddJournalEntry = (content: string, mood: string, tags: string[], photos: string[], date: string) => {
    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      date,
      content,
      mood,
      tags,
      photos
    };
    setJournalEntries(prev => [newEntry, ...prev]);
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  // Operations - Content
  const handleAddContentItem = (item: Omit<ContentItem, 'id'>) => {
    const newItem: ContentItem = {
      ...item,
      id: `c-${Date.now()}`
    };
    setContentItems(prev => [newItem, ...prev]);
  };

  const handleUpdateContentItem = (updated: ContentItem) => {
    setContentItems(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteContentItem = (id: string) => {
    setContentItems(prev => prev.filter(c => c.id !== id));
  };

  // Operations - Social
  const handleAddSocialEvent = (event: Omit<SocialEvent, 'id'>) => {
    const newEvent: SocialEvent = {
      ...event,
      id: `s-${Date.now()}`
    };
    setSocialEvents(prev => [newEvent, ...prev]);
  };

  const handleUpdateSocialEvent = (updated: SocialEvent) => {
    setSocialEvents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteSocialEvent = (id: string) => {
    setSocialEvents(prev => prev.filter(s => s.id !== id));
  };

  // Operations - Evidence
  const handleAddEvidenceDeliverable = (dev: Omit<EvidenceDeliverable, 'id'>) => {
    const newDev: EvidenceDeliverable = {
      ...dev,
      id: `e-${Date.now()}`
    };
    setEvidenceDeliverables(prev => [newDev, ...prev]);
  };

  const handleUpdateEvidenceDeliverable = (updated: EvidenceDeliverable) => {
    setEvidenceDeliverables(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteEvidenceDeliverable = (id: string) => {
    setEvidenceDeliverables(prev => prev.filter(e => e.id !== id));
  };

  // Operations - Period & Cycle
  const handleSavePeriodLog = (log: Omit<PeriodLog, 'id'>) => {
    setPeriodLogs(prev => {
      const existingIdx = prev.findIndex(p => p.date === log.date);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...log, id: prev[existingIdx].id };
        return updated;
      } else {
        return [{ ...log, id: `p-${Date.now()}` }, ...prev];
      }
    });
  };

  const handleDeletePeriodLog = (date: string) => {
    setPeriodLogs(prev => prev.filter(p => p.date !== date));
  };

  // Sync / Import Trigger from Sheets
  const handleImportData = (data: {
    journal?: JournalEntry[];
    content?: ContentItem[];
    social?: SocialEvent[];
    evidence?: EvidenceDeliverable[];
    period?: PeriodLog[];
    cycleSettings?: CycleSettings;
  }) => {
    if (data.journal) setJournalEntries(data.journal);
    if (data.content) setContentItems(data.content);
    if (data.social) setSocialEvents(data.social);
    if (data.evidence) setEvidenceDeliverables(data.evidence);
    if (data.period) setPeriodLogs(data.period);
    if (data.cycleSettings) setCycleSettings(data.cycleSettings);
  };

  // Calculations for KPI dashboard indicators
  const totalCompletedDeliverables = evidenceDeliverables.reduce((acc, curr) => acc + curr.capacityCount, 0);
  const averageQualityScore = evidenceDeliverables.length > 0 
    ? Math.round(evidenceDeliverables.reduce((acc, curr) => acc + curr.qualityScore, 0) / evidenceDeliverables.length) 
    : 100;

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#FAF0EC]/30 relative overflow-hidden" id="setup-container">
        {/* Decorative light elements in the background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-strawberry-accent/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-matcha-primary/15 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
          <div className="w-full max-w-md bg-white border border-matcha-primary/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
            {/* Top design strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-matcha-primary via-strawberry-accent to-matcha-primary" />
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 bg-matcha-primary/10 rounded-2xl flex items-center justify-center text-matcha-primary shadow-inner border border-matcha-primary/10 relative">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#5D524F] font-display tracking-tight">Welcome to LifeOS</h2>
                <p className="text-xs text-[#5D524F]/70">Let's set up your personal sanctuary.</p>
              </div>
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono block">
                  Your Name
                </label>
                <input
                  type="text"
                  value={setupData.name}
                  onChange={(e) => setSetupData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-matcha-primary/50 text-[#5D524F] transition-all"
                  placeholder="e.g. Liyana"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono block">
                  Google Sheet Link (Optional)
                </label>
                <input
                  type="url"
                  value={setupData.sheetUrl}
                  onChange={(e) => setSetupData(prev => ({ ...prev, sheetUrl: e.target.value }))}
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-matcha-primary/50 text-[#5D524F] transition-all"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono block">
                  Setup Password (Optional)
                </label>
                <input
                  type="password"
                  value={setupData.password}
                  onChange={(e) => setSetupData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-[#FAF0EC]/30 border border-matcha-primary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-matcha-primary/50 text-[#5D524F] transition-all"
                  placeholder="Leave empty for no password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-matcha-primary hover:bg-[#97b58e] text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-matcha-primary/20 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Enter Sanctuary
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#FAF0EC]/30 relative overflow-hidden" id="password-gate-container">
        {/* Decorative light elements in the background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-strawberry-accent/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-matcha-primary/15 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
          <div className="w-full max-w-md bg-white border border-matcha-primary/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
            {/* Top design strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-matcha-primary via-strawberry-accent to-matcha-primary" />
            
            {/* Lock Header */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 bg-matcha-primary/10 rounded-2xl flex items-center justify-center text-matcha-primary shadow-inner border border-matcha-primary/10 relative">
                <Lock className="w-6 h-6 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-strawberry-accent rounded-full border-2 border-white animate-bounce" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#5D524F] font-display tracking-tight">LifeOS Secure Sanctuary</h2>
                <p className="text-xs text-[#5D524F]/70">This personal ecosystem is password-protected.</p>
              </div>
            </div>

            {/* Error Notification */}
            {passwordError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-semibold">{passwordError}</span>
              </div>
            )}

            {/* Password Input Form */}
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/60 font-mono block">
                  Sanctuary Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswordMask ? 'text' : 'password'}
                    placeholder="Enter pre-defined access key"
                    value={enteredPassword}
                    onChange={(e) => {
                      setEnteredPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    autoFocus
                    className="w-full bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-xl pl-3.5 pr-11 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-matcha-primary text-[#5D524F] font-mono placeholder-[#5D524F]/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordMask(!showPasswordMask)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5D524F]/50 hover:text-matcha-primary p-1 rounded-md transition-colors cursor-pointer"
                  >
                    {showPasswordMask ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-matcha-primary hover:bg-matcha-primary/90 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10"
              >
                <Key className="w-4 h-4" />
                <span>Unlock Sanctuary</span>
              </button>
            </form>

            {/* Helpful Hint Footer */}
            <div className="border-t border-matcha-primary/10 pt-4 text-center">
              <p className="text-[10px] text-[#5D524F]/50 leading-relaxed font-mono">
                💡 Access key is stored in your Sync Config settings and corresponds to the <code className="font-bold bg-[#FAF0EC] text-[#5D524F]/80 px-1 py-0.5 rounded border border-matcha-primary/5">ACCESS_PASSWORD</code> inside your Google Sheet Apps Script backend.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-[10px] font-mono text-[#5D524F]/50 z-10">
          LifeOS Mini • High-Contrast Private Workspace Sanctuary
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-strawberry-accent selection:text-white relative overflow-x-hidden" id="main-application-container">
      {/* Decorative light elements in the background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-strawberry-accent/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-matcha-primary/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-strawberry-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Premium Header Bar */}
      <header className="bg-white/70 backdrop-blur-md border-b border-matcha-primary/20 py-4 px-6 md:px-8 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] bg-matcha-primary text-white font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/20 shadow-xs">
                HELLO {syncConfig.name ? syncConfig.name.toUpperCase() : 'PRETTY XX'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-dark tracking-widest font-display uppercase flex items-center gap-1.5" id="moonlog-branding-title">
              <span className="text-matcha-primary font-light">MOON</span>
              <span className="font-bold">LOG</span>
            </h1>
            
            {isEditingSub ? (
              <div className="flex items-center gap-1.5 mt-1" id="sub-headline-editor">
                <input
                  type="text"
                  value={tempSub}
                  onChange={(e) => setTempSub(e.target.value)}
                  onBlur={() => saveSubHeadline(tempSub)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveSubHeadline(tempSub);
                    if (e.key === 'Escape') {
                      setTempSub(subHeadline);
                      setIsEditingSub(false);
                    }
                  }}
                  className="bg-[#FAF0EC]/60 border border-matcha-primary/30 rounded-lg px-2.5 py-1 text-xs text-[#5D524F] font-mono focus:outline-none focus:ring-1 focus:ring-matcha-primary w-64 uppercase"
                  autoFocus
                />
                <button 
                  onClick={() => saveSubHeadline(tempSub)}
                  className="text-[10px] bg-matcha-primary text-white font-mono font-bold uppercase px-2 py-1 rounded-lg hover:bg-matcha-primary/90 transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/sub mt-0.5" id="sub-headline-display">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-dark/60 font-mono">
                  {subHeadline}
                </p>
                <button
                  onClick={() => {
                    setTempSub(subHeadline);
                    setIsEditingSub(true);
                  }}
                  className="opacity-0 group-hover/sub:opacity-100 p-1 text-[#5D524F]/50 hover:text-matcha-primary transition-all rounded hover:bg-[#FAF0EC]/40 cursor-pointer"
                  title="Edit Sub-Headline"
                >
                  <Sparkles className="w-3 h-3 text-matcha-primary animate-pulse" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Header KPIs & Actions */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <div className="hidden sm:flex items-center gap-5 text-xs font-mono border-r border-matcha-primary/20 pr-5">
              <div className="text-right">
                <span className="text-ink-dark/60 block text-[9px] uppercase font-bold tracking-wider">Journals Logged</span>
                <span className="text-ink-dark font-bold">{journalEntries.length} entries</span>
              </div>
              <div className="text-right">
                <span className="text-ink-dark/60 block text-[9px] uppercase font-bold tracking-wider">Capacity Built</span>
                <span className="text-matcha-primary font-bold">{totalCompletedDeliverables} deliverables</span>
              </div>
              <div className="text-right">
                <span className="text-ink-dark/60 block text-[9px] uppercase font-bold tracking-wider">Quality Standard</span>
                <span className="text-strawberry-accent font-bold">{averageQualityScore}% reliability</span>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto items-center">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-full bg-matcha-primary hover:bg-matcha-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
                id="top-create-entry-btn"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Entry</span>
              </button>

              {syncConfig.password && (
                <button
                  onClick={() => {
                    sessionStorage.removeItem('lifeos_session_authenticated');
                    setIsAuthenticated(false);
                    setEnteredPassword('');
                    setPasswordError('');
                  }}
                  className="p-2 rounded-full border border-strawberry-accent/20 bg-rose-50/50 hover:bg-rose-50 text-rose-600 hover:text-rose-700 hover:border-rose-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Lock Sanctuary"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  if (!showSettings) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showSettings 
                    ? 'bg-matcha-primary text-white border-matcha-primary shadow-xs' 
                    : 'bg-[#FAF0EC]/30 text-ink-dark/70 border-matcha-primary/20 hover:bg-matcha-primary hover:text-white hover:border-matcha-primary'
                }`}
                title="Configure Cloud database link"
              >
                <Database className="w-3 h-3" />
                <span>{syncConfig.sheetUrl ? 'Database Connected' : 'Setup Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Sync Panel Expandable */}
        {showSettings && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-200">
            <SettingsPanel
              syncConfig={syncConfig}
              onUpdateConfig={(cfg) => {
                setSyncConfig(prev => {
                  const updated = { ...prev, ...cfg };
                  if (cfg.password) {
                    sessionStorage.setItem('lifeos_session_authenticated', 'true');
                    setIsAuthenticated(true);
                  }
                  return updated;
                });
              }}
              journalEntries={journalEntries}
              contentItems={contentItems}
              socialEvents={socialEvents}
              evidenceDeliverables={evidenceDeliverables}
              periodLogs={periodLogs}
              cycleSettings={cycleSettings}
              onImportData={handleImportData}
            />
          </div>
        )}

        {/* Dynamic Responsive Tab Viewport Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start relative w-full">
          
          {/* Pinned Vertical Navigation Tabs on the Left */}
          <div className="w-full lg:w-16 flex lg:flex-col gap-2.5 p-2 bg-white/75 border border-matcha-primary/15 rounded-2xl shadow-xs backdrop-blur-md sticky top-20 lg:top-24 z-40 shrink-0">
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex-1 lg:flex-initial py-2.5 px-3 rounded-xl flex flex-row lg:flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group ${
                activeTab === 'journal'
                  ? 'bg-matcha-primary text-white shadow-md shadow-matcha-primary/25 font-bold'
                  : 'bg-white hover:bg-[#FAF0EC]/60 text-[#5D524F]/70 border border-matcha-primary/5 font-medium'
              } xl:hidden`}
            >
              <BookOpen className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[11px] lg:text-[9px] font-bold font-mono uppercase tracking-tight">Journal</span>
              <span className="absolute left-full ml-3 px-2 py-1 bg-ink-dark text-white text-[10px] font-semibold rounded-md opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                Journal History & Reflection Logs
              </span>
            </button>
            
            {/* Desktop Dashboard Tab (replaces Journal/Calendar on XL) */}
            <button
              onClick={() => setActiveTab('journal')}
              className={`hidden xl:flex flex-1 lg:flex-initial py-2.5 px-3 rounded-xl flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group ${
                activeTab !== 'looking_back'
                  ? 'bg-matcha-primary text-white shadow-md shadow-matcha-primary/25 font-bold'
                  : 'bg-white hover:bg-[#FAF0EC]/60 text-[#5D524F]/70 border border-matcha-primary/5 font-medium'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9px] font-bold font-mono uppercase tracking-tight text-center leading-tight">Workspace</span>
              <span className="absolute left-full ml-3 px-2 py-1 bg-ink-dark text-white text-[10px] font-semibold rounded-md opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                Dual-Pane Dashboard
              </span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 lg:flex-initial py-2.5 px-3 rounded-xl flex flex-row lg:flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group ${
                activeTab === 'calendar'
                  ? 'bg-matcha-primary text-white shadow-md shadow-matcha-primary/25 font-bold'
                  : 'bg-white hover:bg-[#FAF0EC]/60 text-[#5D524F]/70 border border-matcha-primary/5 font-medium'
              } xl:hidden`}
            >
              <CalendarIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[11px] lg:text-[9px] font-bold font-mono uppercase tracking-tight">Calendar</span>
              <span className="absolute left-full ml-3 px-2 py-1 bg-ink-dark text-white text-[10px] font-semibold rounded-md opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                3-Lens Calendar & Schedule
              </span>
            </button>

            <button
              onClick={() => setActiveTab('looking_back')}
              className={`flex-1 lg:flex-initial py-2.5 px-3 rounded-xl flex flex-row lg:flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group ${
                activeTab === 'looking_back'
                  ? 'bg-matcha-primary text-white shadow-md shadow-matcha-primary/25 font-bold'
                  : 'bg-white hover:bg-[#FAF0EC]/60 text-[#5D524F]/70 border border-matcha-primary/5 font-medium'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[11px] lg:text-[9px] font-bold font-mono uppercase tracking-tight">Looking Back</span>
              <span className="absolute left-full ml-3 px-2 py-1 bg-ink-dark text-white text-[10px] font-semibold rounded-md opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                Graphs, Trends & Analytics
              </span>
            </button>
          </div>

          {/* Main Content Workspace Panes */}
          <div className="flex-1 w-full min-w-0">
            {activeTab === 'looking_back' ? (
              <LookingBackModule
                journalEntries={journalEntries}
                contentItems={contentItems}
                socialEvents={socialEvents}
                evidenceDeliverables={evidenceDeliverables}
                periodLogs={periodLogs}
                cycleSettings={cycleSettings}
              />
            ) : (
              <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start w-full">
                {/* Calendar Pane (Left side on Desktop, 1st block) */}
                <div className={`flex-1 w-full min-w-0 ${activeTab !== 'calendar' ? 'hidden xl:block' : ''}`}>
                  <CalendarModule
                    contentItems={contentItems}
                    socialEvents={socialEvents}
                    evidenceDeliverables={evidenceDeliverables}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onAddContentItem={handleAddContentItem}
                    onAddSocialEvent={handleAddSocialEvent}
                    onAddEvidenceDeliverable={handleAddEvidenceDeliverable}
                    onUpdateContentItem={handleUpdateContentItem}
                    onUpdateSocialEvent={handleUpdateSocialEvent}
                    onUpdateEvidenceDeliverable={handleUpdateEvidenceDeliverable}
                    onDeleteContentItem={handleDeleteContentItem}
                    onDeleteSocialEvent={handleDeleteSocialEvent}
                    onDeleteEvidenceDeliverable={handleDeleteEvidenceDeliverable}
                    periodLogs={periodLogs}
                    cycleSettings={cycleSettings}
                    journalEntries={journalEntries}
                  />
                </div>

                {/* Journal Pane (Right side on Desktop, 2nd block) */}
                <div className={`w-full xl:w-[420px] 2xl:w-[480px] shrink-0 ${activeTab !== 'journal' ? 'hidden xl:block' : ''}`}>
                  <JournalModule
                    entries={journalEntries}
                    onAddEntry={handleAddJournalEntry}
                    onDeleteEntry={handleDeleteJournalEntry}
                    selectedDate={selectedDate}
                    periodLogs={periodLogs}
                    cycleSettings={cycleSettings}
                    onSavePeriodLog={handleSavePeriodLog}
                    onDeletePeriodLog={handleDeletePeriodLog}
                    onUpdateCycleSettings={setCycleSettings}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick Create Entry Modal */}
      <CreateEntryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        selectedDate={selectedDate}
        onAddJournalEntry={(entry) => handleAddJournalEntry(entry.content, entry.mood, entry.tags, entry.photos, entry.date)}
        onAddContentItem={handleAddContentItem}
        onAddSocialEvent={handleAddSocialEvent}
        onAddEvidenceDeliverable={handleAddEvidenceDeliverable}
        onSavePeriodLog={handleSavePeriodLog}
      />

      {/* Minimal Footer */}
      <footer className="bg-[#FAF0EC]/60 border-t border-matcha-primary/20 py-6 px-6 text-center text-xs text-ink-dark/80 mt-auto" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-ink-dark/50">
            Created for personal sanctuary, self-hosted on your private Google Drive spreadsheet.
          </p>
          <button
            onClick={() => {
              setShowSettings(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5D524F]/70 border border-[#5D524F]/20 hover:border-matcha-primary hover:text-matcha-primary bg-white/50 rounded-md transition-all cursor-pointer flex items-center gap-1 font-mono"
            id="footer-edit-sync-btn"
          >
            <Database className="w-3 h-3" />
            <span>Configure Cloud Sync</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
