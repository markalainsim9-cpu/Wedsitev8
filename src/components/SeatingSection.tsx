import React, { useState, useMemo } from 'react';
import { Search, Map, Ticket, AlertCircle, Send, Users, X, Check, Copy, Sparkles } from 'lucide-react';
import { Guest } from '../types';

interface SeatingSectionProps {
  guests: Guest[];
  onSelectGuestForPass: (guest: Guest) => void;
  onOpenSeatingPlanModal: () => void;
}

export const SeatingSection: React.FC<SeatingSectionProps> = ({
  guests,
  onSelectGuestForPass,
  onOpenSeatingPlanModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedGuest, setSearchedGuest] = useState<Guest | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'declined' | 'not_found'>('idle');
  const [copiedSeat, setCopiedSeat] = useState(false);

  // Live suggestions when typing (filtered by name)
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2 || searchedGuest) return [];
    return guests
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchQuery, guests, searchedGuest]);

  const selectGuest = (guest: Guest) => {
    setSearchedGuest(guest);
    setSearchQuery(guest.name);
    if (guest.attending === 'yes') {
      setSearchStatus('found');
    } else {
      setSearchStatus('declined');
    }
  };

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchStatus('idle');
      setSearchedGuest(null);
      return;
    }

    const found = guests.find(g => g.name.toLowerCase().includes(q));

    if (found) {
      selectGuest(found);
    } else {
      setSearchedGuest(null);
      setSearchStatus('not_found');
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchedGuest(null);
    setSearchStatus('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCopySeatInfo = () => {
    if (!searchedGuest) return;
    const text = `${searchedGuest.name} - ${searchedGuest.table || 'Table 1'}, ${searchedGuest.seat || 'Seat 1'}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedSeat(true);
      setTimeout(() => setCopiedSeat(false), 2000);
    }
  };

  return (
    <section id="seating" className="romantic-stationery-card rounded-3xl p-6 sm:p-12 relative overflow-hidden">
      {/* Delicate Inner Stationery Border */}
      <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

      <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
        <div className="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1.5">
          <span>❦</span>
          <span>Table & Place Setting Directory</span>
          <span>❦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-[#18232c] tracking-wide font-normal">
          Find Your Seat
        </h2>
        <p className="text-[#475569] text-sm sm:text-base mt-2.5 font-serif italic font-normal text-balance">
          "Kindly enter your name below to discover your designated table and seat for our evening celebration."
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-6 relative z-10">
        {/* Search Bar Container */}
        <div className="relative">
          <div className="relative flex items-center shadow-sm rounded-2xl border border-[#c8d7e3] bg-[#ffffff] focus-within:border-[#3A5A74] focus-within:ring-2 focus-within:ring-[#3A5A74]/15 transition">
            <span className="pl-4 pr-1 text-[#3A5A74]">
              <Search className="w-5 h-5 text-[#3A5A74]" />
            </span>
            <input
              id="seat-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchedGuest) setSearchedGuest(null);
                if (searchStatus !== 'idle') setSearchStatus('idle');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your full name (e.g. Emily Watson)..."
              className="w-full py-3.5 sm:py-4 pl-3 pr-28 sm:pr-32 bg-[#ffffff] text-xs sm:text-sm outline-none text-[#18232c] font-medium placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-24 sm:right-28 p-1.5 text-slate-400 hover:text-slate-600 transition rounded-full hover:bg-slate-100 cursor-pointer"
                title="Clear search"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="seat-search-btn"
              onClick={handleSearch}
              className="absolute right-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-[11px] sm:text-xs font-serif font-semibold uppercase tracking-wider shadow-sm transition transform active:scale-95 border border-[#4D708E] cursor-pointer whitespace-nowrap"
            >
              Find Seat
            </button>
          </div>

          {/* Instant Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 inset-x-0 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-1 divide-y divide-[#ebf2f7]">
              <div className="px-4 py-2 bg-[#f8fafc] text-[11px] font-serif uppercase tracking-wider text-[#506173] font-semibold flex items-center justify-between">
                <span>Matching Guests</span>
                <span>Select your name</span>
              </div>
              {suggestions.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => selectGuest(g)}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#ebf2f7] transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <span className="font-serif font-medium text-sm text-[#18232c] group-hover:text-[#3A5A74] block">
                      {g.name}
                    </span>
                    <span className="text-[11px] text-[#506173] font-sans">
                      {g.attending === 'yes' ? 'Confirmed Guest' : 'Response Pending/Declined'}
                    </span>
                  </div>
                  <span className="text-xs font-serif text-[#3A5A74] font-semibold bg-[#ebf2f7] px-2.5 py-1 rounded-md border border-[#c8d7e3]">
                    {g.table || 'Table 1'} · {g.seat || 'Seat 1'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Help & View Master Seating Plan Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#506173] font-serif px-1 gap-2">
          <span>Search by first or last name for instant seat lookup.</span>
          <button
            id="open-master-seating-plan-btn"
            onClick={onOpenSeatingPlanModal}
            className="text-[#3A5A74] font-semibold hover:underline flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Map className="w-4 h-4 text-[#3A5A74]" />
            <span>View Grand Seating Chart</span>
          </button>
        </div>

        {/* Search Result Box - Confirmed */}
        {searchStatus === 'found' && searchedGuest && (
          <div className="p-7 rounded-3xl bg-[#ffffff] border border-[#c8d7e3] shadow-lg text-center space-y-4 relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#ebf2f7] text-[#3A5A74] text-[11px] font-serif font-bold uppercase tracking-widest border border-[#c8d7e3]">
              <Sparkles className="w-3 h-3 text-[#c5a059]" />
              <span>Confirmed Place Setting</span>
              <Sparkles className="w-3 h-3 text-[#c5a059]" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-[#506173] font-serif font-semibold">
                Honoured Guest
              </div>
              <div className="text-3xl font-serif text-[#18232c] mt-1 font-normal">
                {searchedGuest.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 px-6 bg-[#f8fafc] rounded-2xl border border-[#c8d7e3] max-w-xs mx-auto shadow-sm">
              <div className="text-center border-r border-[#c5a059]/40 pr-2">
                <span className="text-[11px] text-[#3A5A74] uppercase font-serif font-bold tracking-wider block">
                  Assigned Table
                </span>
                <span className="text-2xl font-serif text-[#18232c] font-normal">
                  {searchedGuest.table || 'Table 1'}
                </span>
              </div>
              <div className="text-center pl-2">
                <span className="text-[11px] text-[#3A5A74] uppercase font-serif font-bold tracking-wider block">
                  Assigned Seat
                </span>
                <span className="text-2xl font-serif text-[#18232c] font-normal">
                  {searchedGuest.seat || 'Seat 1'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                id="view-guest-pass-btn"
                onClick={() => onSelectGuestForPass(searchedGuest)}
                className="px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold shadow-sm transition flex items-center space-x-2 border border-[#4D708E] transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-sky-100" />
                <span>View Digital Place Card</span>
              </button>

              <button
                type="button"
                onClick={handleCopySeatInfo}
                className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#18232c] border border-[#c8d7e3] rounded-xl text-xs font-serif font-semibold transition flex items-center space-x-1.5 shadow-sm transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                title="Copy Table and Seat details"
              >
                {copiedSeat ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#3A5A74]" />
                    <span>Copy Table Info</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenSeatingPlanModal}
                className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#18232c] border border-[#c8d7e3] rounded-xl text-xs font-serif font-semibold transition flex items-center space-x-1.5 shadow-sm transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#3A5A74]" />
                <span>Ballroom Map</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Result Box - Declined */}
        {searchStatus === 'declined' && searchedGuest && (
          <div className="p-6 rounded-3xl bg-[#ffffff] border border-[#c8d7e3] text-center space-y-3 shadow-md animate-in fade-in">
            <div className="flex items-center justify-center space-x-2 text-[#3A5A74] font-serif font-semibold text-sm">
              <AlertCircle className="w-5 h-5 text-[#3A5A74]" />
              <span>RSVP Status: Regretfully Declined</span>
            </div>
            <p className="text-sm text-[#475569] leading-relaxed font-serif">
              We found a record for "{searchedGuest.name}", but attendance was marked as declined. Would you like to update your response?
            </p>
            <div className="pt-2 flex items-center justify-center space-x-3">
              <a
                href="#rsvp"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition shadow-sm border border-[#4D708E]"
              >
                <Send className="w-3.5 h-3.5 text-sky-100" />
                <span>Update RSVP Response</span>
              </a>
            </div>
          </div>
        )}

        {/* Search Result Box - Not Found */}
        {searchStatus === 'not_found' && (
          <div className="p-6 rounded-3xl bg-[#ffffff] border border-[#c8d7e3] text-center space-y-3 shadow-md animate-in fade-in">
            <div className="flex items-center justify-center space-x-2 text-[#3A5A74] font-serif font-semibold text-sm">
              <AlertCircle className="w-5 h-5 text-[#3A5A74]" />
              <span>Guest Not Yet Listed</span>
            </div>
            <p className="text-sm text-[#475569] leading-relaxed font-serif">
              We couldn't find a seat reservation for "{searchQuery}". Please check spelling or submit your reply card below.
            </p>
            <div className="pt-2 flex items-center justify-center space-x-3">
              <a
                href="#rsvp"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition shadow-sm border border-[#4D708E]"
              >
                <Send className="w-3.5 h-3.5 text-sky-100" />
                <span>Submit RSVP Card</span>
              </a>
              <button
                onClick={onOpenSeatingPlanModal}
                className="px-5 py-2.5 bg-[#ffffff] text-[#18232c] border border-[#c8d7e3] rounded-xl text-xs font-serif font-semibold transition hover:bg-[#ebf2f7]"
              >
                Browse All Tables
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
