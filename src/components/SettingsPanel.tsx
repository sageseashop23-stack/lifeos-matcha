import React, { useState } from 'react';
import { APPS_SCRIPT_CODE } from '../utils/appsScriptCode';
import { SyncConfig, JournalEntry, ContentItem, SocialEvent, EvidenceDeliverable, PeriodLog, CycleSettings } from '../types';
import { 
  Settings, Database, HelpCircle, Copy, Check, Download, Upload, RefreshCw, 
  AlertCircle, Sparkles, Shield, ChevronDown, ChevronUp, FileSpreadsheet 
} from 'lucide-react';

interface SettingsPanelProps {
  syncConfig: SyncConfig;
  onUpdateConfig: (config: Partial<SyncConfig>) => void;
  journalEntries: JournalEntry[];
  contentItems: ContentItem[];
  socialEvents: SocialEvent[];
  evidenceDeliverables: EvidenceDeliverable[];
  periodLogs: PeriodLog[];
  cycleSettings: CycleSettings;
  onImportData: (data: {
    journal?: JournalEntry[];
    content?: ContentItem[];
    social?: SocialEvent[];
    evidence?: EvidenceDeliverable[];
    period?: PeriodLog[];
    cycleSettings?: CycleSettings;
  }) => void;
}

export default function SettingsPanel({
  syncConfig,
  onUpdateConfig,
  journalEntries,
  contentItems,
  socialEvents,
  evidenceDeliverables,
  periodLogs,
  cycleSettings,
  onImportData
}: SettingsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Real fetch sync to their Apps Script Endpoint
  const handlePushSync = async () => {
    if (!syncConfig.sheetUrl) {
      setSyncStatus({
        type: 'error',
        message: 'Please configure your Google Sheet Apps Script URL first.'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: 'idle', message: 'Sending data to your Google Sheet...' });

    try {
      const payload = {
        password: syncConfig.password || '',
        journal: journalEntries,
        content: contentItems,
        social: socialEvents,
        evidence: evidenceDeliverables,
        period: periodLogs,
        cycleSettings: [cycleSettings]
      };

      // Also append password as a query param in case of CORS redirect handling restrictions
      let targetUrl = syncConfig.sheetUrl;
      if (syncConfig.password) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}password=${encodeURIComponent(syncConfig.password)}`;
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors', // Standard cross-origin setting for Google Web Apps redirect
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Note: under no-cors, response.ok is false and we cannot inspect body.
      // We will assume success if no error is thrown, but we will warn the user about no-cors details.
      onUpdateConfig({ lastSyncedAt: new Date().toLocaleString() });
      setSyncStatus({
        type: 'success',
        message: 'Push request dispatched successfully! If you authorized the Web App correctly and configured the matching password, your Google Sheet has been updated.'
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: `Sync failed: ${err.message || 'Network error'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullSync = async () => {
    if (!syncConfig.sheetUrl) {
      setSyncStatus({
        type: 'error',
        message: 'Please configure your Google Sheet Apps Script URL first.'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: 'idle', message: 'Fetching data from your Google Sheet...' });

    try {
      // For pulling data, we fetch the GET endpoint
      let targetUrl = syncConfig.sheetUrl;
      if (syncConfig.password) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}password=${encodeURIComponent(syncConfig.password)}`;
      }

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();

      if (data && data.status === 'error') {
        throw new Error(data.message || 'Error reported by Google Sheet endpoint');
      }
      
      if (data && (data.journal || data.content || data.social || data.evidence || data.period || data.cycleSettings)) {
        onImportData({
          journal: data.journal || [],
          content: data.content || [],
          social: data.social || [],
          evidence: data.evidence || [],
          period: data.period || [],
          cycleSettings: data.cycleSettings && data.cycleSettings.length > 0 ? data.cycleSettings[0] : undefined
        });
        
        onUpdateConfig({ lastSyncedAt: new Date().toLocaleString() });
        setSyncStatus({
          type: 'success',
          message: 'Successfully pulled and loaded latest database records from your Google Sheet!'
        });
      } else {
        throw new Error('Invalid database format or wrong password returned by Google Sheet');
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: `Pull failed: ${err.message || 'Make sure your Apps Script Web App is deployed with Access set to "Anyone".'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Export local state as formatted JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify({
      journal: journalEntries,
      content: contentItems,
      social: socialEvents,
      evidence: evidenceDeliverables,
      period: periodLogs,
      cycleSettings: cycleSettings
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifeos_mini_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export specific table to CSV
  const handleExportCSV = (table: 'journal' | 'content' | 'social' | 'evidence' | 'period' | 'cycleSettings') => {
    let csvContent = '';
    let headers: string[] = [];
    let rows: any[] = [];

    if (table === 'journal') {
      headers = ['id', 'date', 'content', 'mood', 'tags', 'photos'];
      rows = journalEntries.map(e => [
        e.id, e.date, e.content, e.mood, JSON.stringify(e.tags), JSON.stringify(e.photos)
      ]);
    } else if (table === 'content') {
      headers = ['id', 'date', 'title', 'phase', 'status', 'notes'];
      rows = contentItems.map(c => [
        c.id, c.date, c.title, c.phase, c.status, c.notes
      ]);
    } else if (table === 'social') {
      headers = ['id', 'date', 'title', 'phase', 'status', 'notes'];
      rows = socialEvents.map(s => [
        s.id, s.date, s.title, s.phase, s.status, s.notes
      ]);
    } else if (table === 'evidence') {
      headers = ['id', 'date', 'title', 'capacityCount', 'impactValue', 'impactUnit', 'qualityScore', 'notes'];
      rows = evidenceDeliverables.map(e => [
        e.id, e.date, e.title, e.capacityCount, e.impactValue, e.impactUnit, e.qualityScore, e.notes
      ]);
    } else if (table === 'period') {
      headers = ['id', 'date', 'flow', 'symptoms', 'lhTest', 'basalBodyTemp', 'cervicalMucus', 'pcosSymptoms', 'notes'];
      rows = periodLogs.map(p => [
        p.id, p.date, p.flow, JSON.stringify(p.symptoms || []), p.lhTest || '', p.basalBodyTemp || '', p.cervicalMucus || '', JSON.stringify(p.pcosSymptoms || []), p.notes || ''
      ]);
    } else if (table === 'cycleSettings') {
      headers = ['cycleLength', 'periodLength', 'lastPeriodDate', 'isPCOSEnabled', 'isIrregular'];
      rows = [[
        cycleSettings.cycleLength, cycleSettings.periodLength, cycleSettings.lastPeriodDate, cycleSettings.isPCOSEnabled || false, cycleSettings.isIrregular || false
      ]];
    }

    // Combine headers and rows
    const csvRows = [
      headers.join(','),
      ...rows.map(r => r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ];
    csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifeos_mini_${table}_template_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-matcha-primary/20 rounded-2xl shadow-xs overflow-hidden text-[#5D524F]" id="settings-panel-container">
      {/* Header Banner */}
      <div className="bg-[#FAF0EC]/60 text-[#5D524F] p-5 flex items-center justify-between border-b border-matcha-primary/20">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-matcha-primary drop-shadow-[0_0_8px_rgba(168,198,159,0.5)]" />
          <div>
            <h2 className="text-sm font-bold tracking-tight font-sans text-[#5D524F]">Self-Hosted Sheets Cloud Sync</h2>
            <p className="text-[11px] text-[#5D524F]/70">Own your data. Fully local, zero subscription fees.</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Connection Setup Card */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5D524F]/70 block font-mono">Database URL Connection</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={syncConfig.sheetUrl}
                onChange={(e) => onUpdateConfig({ sheetUrl: e.target.value })}
                className="bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:ring-1 focus:ring-matcha-primary text-[#5D524F] font-mono placeholder-[#5D524F]/40"
              />
              <button
                onClick={() => onUpdateConfig({ enabled: !syncConfig.enabled })}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  syncConfig.enabled 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                    : 'bg-white border-matcha-primary/20 text-[#5D524F]/60 hover:bg-[#FAF0EC]/30'
                }`}
              >
                {syncConfig.enabled ? 'Connected' : 'Offline'}
              </button>
            </div>
            <p className="text-[10px] text-[#5D524F]/60 font-sans">
              Paste your Google Apps Script Web App URL to turn your personal spreadsheet into a private database.
            </p>
          </div>

          <div className="space-y-1.5 border-t border-matcha-primary/5 pt-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5D524F]/70 block font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Access Password (Optional security credential)</span>
            </label>
            <input
              type="password"
              placeholder="Enter password set in your Apps Script code"
              value={syncConfig.password || ''}
              onChange={(e) => onUpdateConfig({ password: e.target.value })}
              className="bg-[#FAF0EC]/20 border border-matcha-primary/20 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:ring-1 focus:ring-matcha-primary text-[#5D524F] font-mono placeholder-[#5D524F]/40"
            />
            <p className="text-[10px] text-[#5D524F]/60 font-sans">
              Protects your database from unauthorized reads or writes. Ensure this matches the <code className="font-mono bg-[#FAF0EC]/60 px-1 py-0.5 rounded text-[9px] text-[#5D524F] font-bold">ACCESS_PASSWORD</code> constant inside your Google Sheet Apps Script backend.
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="bg-[#FAF0EC]/30 border border-matcha-primary/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-matcha-primary" />
              <span className="text-xs font-bold text-[#5D524F] font-sans">Cloud Synchronization</span>
            </div>
            {syncConfig.lastSyncedAt && (
              <span className="text-[10px] font-mono text-[#5D524F]/70">
                Last synced: {syncConfig.lastSyncedAt}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Push Sync Button */}
            <button
              onClick={handlePushSync}
              disabled={isSyncing}
              className="bg-matcha-primary hover:bg-[#97b58e] text-white font-bold p-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Push Local to Cloud Sheet</span>
            </button>

            {/* Pull Sync Button */}
            <button
              onClick={handlePullSync}
              disabled={isSyncing}
              className="bg-white hover:bg-[#FAF0EC]/30 text-[#5D524F] border border-matcha-primary/20 font-bold p-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5 text-matcha-primary" />
              <span>Pull Sheet Data to Local</span>
            </button>
          </div>

          {/* Sync Status Logger feedback */}
          {syncStatus.type !== 'idle' && (
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
              syncStatus.type === 'success' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-750'
            }`}>
              <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${syncStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`} />
              <p>{syncStatus.message}</p>
            </div>
          )}
        </div>

        {/* Setup Guide Accordion */}
        <div className="border border-matcha-primary/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="w-full bg-[#FAF0EC]/30 p-4 flex items-center justify-between text-left focus:outline-none cursor-pointer hover:bg-[#FAF0EC]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-strawberry-accent" />
              <span className="text-xs font-bold text-[#5D524F] font-sans">120-Second Self-Host Setup Guide</span>
            </div>
            {showSetupGuide ? <ChevronUp className="w-4 h-4 text-[#5D524F]/60" /> : <ChevronDown className="w-4 h-4 text-[#5D524F]/60" />}
          </button>

          {showSetupGuide && (
            <div className="p-4 border-t border-matcha-primary/10 bg-[#FAF0EC]/10 space-y-4 text-xs text-[#5D524F] leading-relaxed">
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong className="text-matcha-primary font-bold">Copy the database backend script</strong> below to enable seamless bidirectional Google Sheet storage operations.
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={handleCopyScript}
                      className="px-3 py-1.5 bg-matcha-primary hover:bg-[#97b58e] text-white font-semibold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied script!' : 'Copy Connector Script'}</span>
                    </button>
                    <button
                      onClick={() => setShowScript(!showScript)}
                      className="px-3 py-1.5 bg-white hover:bg-[#FAF0EC]/30 text-[#5D524F] font-semibold rounded-lg text-[11px] border border-matcha-primary/20 cursor-pointer transition-all"
                    >
                      {showScript ? 'Hide Script Code' : 'View Script Code'}
                    </button>
                  </div>

                  {showScript && (
                    <pre className="mt-2 p-3 bg-[#FAF0EC]/40 border border-matcha-primary/10 rounded-lg font-mono text-[10px] text-[#5D524F] max-h-[180px] overflow-y-auto overflow-x-auto whitespace-pre">
                      {APPS_SCRIPT_CODE}
                    </pre>
                  )}
                </li>
                <li>
                  Create a new <strong className="text-matcha-primary font-bold">Google Sheet</strong>. At the top menu bar, click on <strong className="text-matcha-primary font-bold">Extensions &gt; Apps Script</strong>.
                </li>
                <li>
                  Delete any existing code in the editor, <strong className="text-matcha-primary font-bold">paste the copied script</strong> inside, and click the <strong className="text-matcha-primary font-bold">Save (floppy disk)</strong> icon.
                </li>
                <li>
                  Click the blue <strong className="text-matcha-primary font-bold">Deploy &gt; New Deployment</strong> button. 
                  <ul className="list-disc list-inside ml-4 mt-1 text-[11px] text-[#5D524F]/70 space-y-1">
                    <li>Select type: <strong className="text-[#5D524F]/90">Web App</strong></li>
                    <li>Execute as: <strong className="text-[#5D524F]/90">Me</strong></li>
                    <li>Who has access: <strong className="text-[#5D524F]/90">Anyone</strong></li>
                  </ul>
                </li>
                <li>
                  Click <strong className="text-matcha-primary font-bold">Deploy</strong>, grant authorizations if prompted by Google, and <strong className="text-matcha-primary font-bold">copy the Web App URL</strong>. Paste it into the "Database URL Connection" input box above to go live!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Local Storage Backups & CSV Exporters */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[#5D524F]/70 block font-mono">Spreadsheet Downloads & Local Backups</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <button
              onClick={() => handleExportCSV('journal')}
              className="p-2.5 bg-white hover:bg-[#FAF0EC]/40 border border-matcha-primary/20 rounded-xl text-center font-bold transition-all text-[10px] text-[#5D524F] flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#A8C69F]" />
              <span>Journal CSV</span>
            </button>
            <button
              onClick={() => handleExportCSV('content')}
              className="p-2.5 bg-white hover:bg-[#FAF0EC]/40 border border-matcha-primary/20 rounded-xl text-center font-bold transition-all text-[10px] text-[#5D524F] flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-500" />
              <span>Content CSV</span>
            </button>
            <button
              onClick={() => handleExportCSV('social')}
              className="p-2.5 bg-white hover:bg-[#FAF0EC]/40 border border-matcha-primary/20 rounded-xl text-center font-bold transition-all text-[10px] text-[#5D524F] flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-strawberry-accent" />
              <span>Social CSV</span>
            </button>
            <button
              onClick={() => handleExportCSV('evidence')}
              className="p-2.5 bg-white hover:bg-[#FAF0EC]/40 border border-matcha-primary/20 rounded-xl text-center font-bold transition-all text-[10px] text-[#5D524F] flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Evidence CSV</span>
            </button>
            <button
              onClick={() => handleExportCSV('period')}
              className="p-2.5 bg-white hover:bg-[#FAF0EC]/40 border border-matcha-primary/20 rounded-xl text-center font-bold transition-all text-[10px] text-[#5D524F] flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-rose-500" />
              <span>Period Logs CSV</span>
            </button>
            <button
              onClick={() => handleExportCSV('cycleSettings')}
              className="p-2.5 bg-white hover:bg-[#FAF0EC]/40 border border-matcha-primary/20 rounded-xl text-center font-bold transition-all text-[10px] text-[#5D524F] flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>Cycle Config CSV</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportJSON}
              className="w-full border border-matcha-primary/20 bg-white hover:bg-[#FAF0EC]/30 text-[#5D524F] font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#5D524F]/70" />
              <span>Backup All Data locally as JSON file</span>
            </button>
          </div>
        </div>

        {/* Security & Safety disclaimer */}
        <div className="flex gap-2 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/50 items-start text-[10.5px] text-[#5D524F] leading-normal shadow-xs">
          <Shield className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <p>
            <strong className="text-emerald-800 font-bold">Digital Sanctuary Security Guarantee:</strong> Your journal contents, tags, and photos remain entirely stored inside your own local browser cache or your private, self-hosted Google Sheet. No third-party servers ever touch your logs.
          </p>
        </div>
      </div>
    </div>
  );
}
