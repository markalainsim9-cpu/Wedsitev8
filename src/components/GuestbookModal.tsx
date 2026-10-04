import React, { useState, useMemo } from 'react';
import { X, Heart, Send, Check, Sparkles, MessageCircle, User, Users, Lock, BookOpen, Pin } from 'lucide-react';
import { EventConfig, GuestbookEntry } from '../types';

interface GuestbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
  entries: GuestbookEntry[];
  onSubmitEntry: (entry: Omit<GuestbookEntry, 'id'>) => Promise<void> | void;
}

export const GuestbookModal: React.FC<GuestbookModalProps> = ({
  isOpen,
  onClose,
  config,
  entries,
  onSubmitEntry
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'view'>('write');

  // Guarantee unique keys for React rendering and sort featured entries first
  const uniqueEntries = useMemo(() => {
    const map = new Map<string, GuestbookEntry>();
    for (const item of entries) {
      if (item && item.id) map.set(item.id, item);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aF = Boolean(a.isFeatured);
      const bF = Boolean(b.isFeatured);
      if (aF !== bF) return aF ? -1 : 1;
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [entries]);

  if (!isOpen) return null;

  const relationshipOptions = [
    'Family of the Bride',
    'Family of the Groom',
    'Bridal Party',
    'Groomsman',
    'Lifelong Friend',
    'College Friend',
    'Colleague',
    'Guest & Well-Wisher'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const entryPayload: Omit<GuestbookEntry, 'id'> = {
        name: name.trim(),
        relationship: relationship.trim() || 'Well-Wisher',
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };

      await onSubmitEntry(entryPayload);

      setSubmittedSuccess(true);
      setName('');
      setRelationship('');
      setMessage('');
      setTimeout(() => {
        setSubmittedSuccess(false);
        setActiveTab('view');
      }, 1500);
    } catch (err) {
      console.error('Failed to post guestbook wish:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="guestbook-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="guestbook-modal-container"
        className="relative w-full max-w-2xl bg-[#ffffff] border border-[#c8d7e3] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Delicate Inner Stationery Border */}
        <div className="absolute inset-2 sm:inset-3 border border-[#c5a059]/30 rounded-2xl pointer-events-none z-10" />

        {/* Modal Header */}
        <div className="relative z-20 px-6 pt-6 pb-4 border-b border-[#e2ecf4] bg-gradient-to-b from-[#f7fafc] to-[#ffffff]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-bold uppercase tracking-widest">
              <span>❦</span>
              <span>Keepsake Guestbook</span>
              <span>❦</span>
            </div>
            <button
              id="close-guestbook-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] flex items-center justify-center transition border border-[#cbd5e1]"
              title="Close Guestbook"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#18232c] font-normal mt-2 tracking-wide">
            Wishes & Love
          </h2>
          <p className="font-serif italic text-xs sm:text-sm text-[#475569] mt-1">
            Leave your warmest blessings, joyful memories, and heartfelt congratulations for {config.title}.
          </p>

          {/* Tab Selector */}
          <div className="flex items-center space-x-2 mt-4">
            <button
              type="button"
              id="tab-write-wish"
              onClick={() => setActiveTab('write')}
              className={`px-4 py-1.5 rounded-full text-xs font-serif font-semibold transition flex items-center space-x-1.5 border ${
                activeTab === 'write'
                  ? 'bg-[#3A5A74] text-white border-[#274155] shadow-xs'
                  : 'bg-white text-[#475569] border-[#c8d7e3] hover:bg-[#ebf2f7]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-300" />
              <span>Write Wishes & Love</span>
            </button>

            <button
              type="button"
              id="tab-view-wishes"
              onClick={() => setActiveTab('view')}
              className={`px-4 py-1.5 rounded-full text-xs font-serif font-semibold transition flex items-center space-x-1.5 border ${
                activeTab === 'view'
                  ? 'bg-[#3A5A74] text-white border-[#274155] shadow-xs'
                  : 'bg-white text-[#475569] border-[#c8d7e3] hover:bg-[#ebf2f7]'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Read Keepsake Messages ({entries.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="relative z-20 flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 space-y-6 overscroll-contain">
          {activeTab === 'write' ? (
            <div>
              {config.guestbookPostingEnabled === false ? (
                <div className="py-12 px-6 text-center space-y-3 bg-[#f8fafc] rounded-2xl border border-[#c8d7e3]">
                  <div className="w-12 h-12 bg-[#ebf2f7] text-[#3A5A74] rounded-full flex items-center justify-center mx-auto border border-[#c8d7e3] shadow-xs">
                    <Lock className="w-5 h-5 text-[#3A5A74]" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#18232c] font-normal">Guestbook Submissions Closed</h3>
                  <p className="font-serif italic text-xs sm:text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
                    New guestbook submissions are currently closed by the hosts. You are warmly welcome to browse all heartfelt blessings and keepsake notes shared by loved ones!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('view')}
                    className="mt-3 inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Browse All Messages ({entries.length})</span>
                  </button>
                </div>
              ) : submittedSuccess ? (
                <div className="py-10 text-center space-y-3 animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#18232c]">Thank You with All Our Love!</h3>
                  <p className="font-serif italic text-sm text-[#475569] max-w-md mx-auto">
                    Your beautiful wish has been recorded into the keepsake guestbook. Switching to view your blessing...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-[#3A5A74]" />
                      <span>Your Full Name(s) *</span>
                    </label>
                    <input
                      type="text"
                      id="guestbook-input-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Charlotte & Henry Davis"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c8d7e3] bg-[#fbfdfd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] font-serif text-sm text-[#18232c] placeholder:text-[#94a3b8] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-[#3A5A74]" />
                      <span>Relationship or Connection (Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="guestbook-input-relationship"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder="e.g. Lifelong Friend, College Roommate, Cousin"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c8d7e3] bg-[#fbfdfd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] font-serif text-sm text-[#18232c] placeholder:text-[#94a3b8] transition"
                    />

                    {/* Quick suggestion pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {relationshipOptions.slice(0, 5).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setRelationship(opt)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-serif bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] border border-[#cbd5e1] transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span>Your Wishes & Love *</span>
                      </span>
                      <span className="text-[11px] text-[#94a3b8] font-mono">
                        {message.length} characters
                      </span>
                    </label>
                    <textarea
                      id="guestbook-input-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your heartfelt message, cherished memories, sacred blessings, or words of wisdom for the couple..."
                      className="w-full px-4 py-3 rounded-xl border border-[#c8d7e3] bg-[#fbfdfd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] font-serif text-sm text-[#18232c] placeholder:text-[#94a3b8] leading-relaxed resize-none transition"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs font-serif italic text-[#64748b]">
                      ❦ All messages are preserved as a forever keepsake for the newlyweds.
                    </p>

                    <button
                      type="submit"
                      id="guestbook-submit-btn"
                      disabled={isSubmitting || !name.trim() || !message.trim()}
                      className="w-full sm:w-auto px-7 py-3 bg-[#3A5A74] hover:bg-[#274155] disabled:opacity-50 text-white rounded-2xl text-xs font-serif font-semibold tracking-wider transition shadow-sm flex items-center justify-center space-x-2 border border-[#4D708E] cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-rose-300" />
                      <span>{isSubmitting ? 'Posting Wish...' : 'Post Wishes & Love'}</span>
                      <Send className="w-3.5 h-3.5 text-sky-200" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueEntries.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="font-serif italic text-sm text-[#64748b]">
                    The guestbook is waiting for its first blessing! Be the first to post wishes & love.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className="mt-2 px-5 py-2 bg-[#3A5A74] text-white rounded-xl text-xs font-serif font-semibold"
                  >
                    Write the First Wish
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {uniqueEntries.map((item) => {
                    const isPinned = Boolean(item.isFeatured);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 sm:p-5 rounded-2xl relative space-y-2.5 transition ${
                          isPinned
                            ? 'bg-gradient-to-br from-[#fffdfa] via-white to-[#fbf7ee] border-2 border-[#c5a059] shadow-sm ring-1 ring-[#c5a059]/20'
                            : 'bg-[#fbfdfd] border border-[#dce7ee] shadow-xs hover:border-[#b8cddc]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center flex-wrap gap-2">
                            {isPinned ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-serif font-bold tracking-wider uppercase bg-[#fbf5e6] text-[#8a6417] border border-[#e5d4a6] shadow-2xs">
                                <Pin className="w-3 h-3 fill-[#c5a059] text-[#8a6417] -rotate-45" />
                                <span>Featured Keepsake</span>
                              </span>
                            ) : (
                              <span className="text-[#3A5A74] text-xs">❦</span>
                            )}
                            <span className="font-serif font-bold text-sm text-[#18232c]">
                              {item.name}
                            </span>
                            {item.relationship && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-serif font-semibold border ${
                                  isPinned
                                    ? 'bg-[#fbf5e6]/80 text-[#8a6417] border-[#e5d4a6]'
                                    : 'bg-[#ebf2f7] text-[#3A5A74] border-[#c8d7e3]'
                                }`}
                              >
                                {item.relationship}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-serif text-[#64748b]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </span>
                        </div>

                        <p
                          className={`font-serif text-[#334155] text-xs sm:text-sm leading-relaxed whitespace-pre-line italic pl-3 border-l-2 ${
                            isPinned ? 'border-[#c5a059]' : 'border-[#3A5A74]/25'
                          }`}
                        >
                          "{item.message}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
