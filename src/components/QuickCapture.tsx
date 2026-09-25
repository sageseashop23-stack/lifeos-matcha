import React, { useState, useEffect, useRef } from 'react';
import { PenLine, X, Sparkles, Check, ArrowUpRight, Calendar as CalendarIcon } from 'lucide-react';

interface QuickCaptureProps {
  selectedDate: string;
  onSaveQuickNote: (content: string, mood: string, tags: string[], date: string) => void;
  onOpenFullModal: () => void;
}

const PRESET_MOODS = [
  '🌸 Serene',
  '⚡ Focused',
  '🔋 Energetic',
  '📝 Grateful',
  '💭 Reflective',
  '🌱 Growing',
  '😴 Tired'
];

const PRESET_TAGS = ['#thought', '#idea', '#win', '#reflection', '#gratitude', '#quick-note'];

export default function QuickCapture({
  selectedDate,
  onSaveQuickNote,
  onOpenFullModal
}: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(PRESET_MOODS[0]);
  const [activeTags, setActiveTags] = useState<string[]>(['#quick-note']);
  const todayStr = new Date().toISOString().split('T')[0];
  const [noteDate, setNoteDate] = useState(selectedDate || todayStr);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync date when selectedDate changes outside and overlay is closed
  useEffect(() => {
    if (!isOpen) {
      setNoteDate(selectedDate || todayStr);
    }
  }, [selectedDate, isOpen, todayStr]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K to toggle quick capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is already typing in an input/textarea and overlay is NOT open
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = noteContent.trim();
    if (!trimmed) return;

    onSaveQuickNote(trimmed, selectedMood, activeTags, noteDate);

    // Reset and close
    setNoteContent('');
    setActiveTags(['#quick-note']);
    setIsOpen(false);

    // Show temporary confirmation toast
    setToastMessage('Note captured to journal');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2400);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <aside 
        aria-label="Quick capture shortcuts and notifications"
        className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8 flex flex-col items-end gap-3 pointer-events-none"
      >
        {/* Toast Notification */}
        {showToast && (
          <div 
            role="status"
            aria-live="polite"
            className="pointer-events-auto bg-[#5D524F] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="w-4 h-4 rounded-full bg-[#A8C69F] flex items-center justify-center text-[#5D524F]">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* FAB Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto group relative flex items-center justify-center gap-2.5 h-13 px-4 rounded-full bg-[#A8C69F] hover:bg-[#97B58E] text-white shadow-lg hover:shadow-xl shadow-[#A8C69F]/35 hover:shadow-[#A8C69F]/45 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20"
          aria-label="Quick capture note"
          title="Quick capture note (⌘K)"
          id="fab-quick-capture"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <PenLine className="w-5 h-5 group-hover:rotate-6 transition-transform duration-200" />
          </div>
          <span className="text-xs font-semibold tracking-wide whitespace-nowrap hidden sm:inline">
            Quick Note
          </span>
          <span className="hidden md:inline-flex items-center text-[10px] font-mono opacity-80 bg-white/20 px-1.5 py-0.5 rounded border border-white/25">
            ⌘K
          </span>
        </button>
      </aside>

      {/* Minimal Overlay Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-[#5D524F]/35 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-capture-title"
        >
          <div 
            className="w-full max-w-lg bg-[#FDF9F7] border border-[#A8C69F]/35 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4.5 pb-3 border-b border-[#A8C69F]/15 bg-white/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#A8C69F]/15 border border-[#A8C69F]/25 flex items-center justify-center text-[#5D524F]">
                  <PenLine className="w-4 h-4 text-[#5D524F]" />
                </div>
                <div>
                  <h2 id="quick-capture-title" className="text-sm font-semibold text-[#5D524F] tracking-tight">
                    Quick Capture
                  </h2>
                  <p className="text-[11px] text-[#5D524F]/60">
                    Jot a fleeting thought or daily reflection
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Date Switcher */}
                <div className="flex items-center gap-1.5 text-xs text-[#5D524F]/80 bg-[#FAF0EC] px-2.5 py-1 rounded-lg border border-[#A8C69F]/20">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#5D524F]/60" />
                  <input
                    type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="bg-transparent text-[11px] font-mono text-[#5D524F] focus:outline-none cursor-pointer"
                    title="Change entry date"
                  />
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 text-[#5D524F]/60 hover:text-[#5D524F] transition-colors cursor-pointer"
                  aria-label="Close quick capture"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Input Body */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <textarea
                  ref={textareaRef}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="What's on your mind right now? Jot a reflection, win, or quick thought..."
                  rows={4}
                  className="w-full bg-white border border-[#A8C69F]/25 rounded-xl p-3.5 text-sm text-[#5D524F] placeholder-[#5D524F]/40 leading-relaxed focus:outline-none focus:border-[#A8C69F] focus:ring-2 focus:ring-[#A8C69F]/20 transition-all resize-none font-sans"
                />
              </div>

              {/* Mood Quick Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#5D524F]/60 block font-mono">
                  Mood
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_MOODS.map(mood => {
                    const isSelected = selectedMood === mood;
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setSelectedMood(mood)}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#A8C69F] text-white font-medium shadow-xs'
                            : 'bg-white hover:bg-[#FAF0EC] text-[#5D524F]/75 border border-[#A8C69F]/15'
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Tags Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#5D524F]/60 block font-mono">
                  Quick Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map(tag => {
                    const isTagged = activeTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-0.5 text-[11px] rounded-md transition-all cursor-pointer font-mono whitespace-nowrap ${
                          isTagged
                            ? 'bg-[#5D524F] text-white font-semibold'
                            : 'bg-white hover:bg-[#FAF0EC] text-[#5D524F]/65 border border-[#A8C69F]/15'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-[#A8C69F]/15 flex items-center justify-between gap-3">
                {/* Switch to Full Modal option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullModal();
                  }}
                  className="text-[11px] text-[#5D524F]/70 hover:text-[#5D524F] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <span>Open Full Modal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[10px] font-mono text-[#5D524F]/50 mr-1">
                    ⌘+Enter to save
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-[#5D524F]/70 hover:text-[#5D524F] rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!noteContent.trim()}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      noteContent.trim()
                        ? 'bg-[#A8C69F] hover:bg-[#97B58E] text-white shadow-[#A8C69F]/20 active:scale-95'
                        : 'bg-[#A8C69F]/40 text-white/70 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
