import React, { useState } from 'react';
import { X, Ticket, Sparkles, Check, Printer, Copy, CheckCircle2 } from 'lucide-react';
import { Guest, EventConfig } from '../types';

interface GuestPassModalProps {
  guest: Guest | null;
  config: EventConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const GuestPassModal: React.FC<GuestPassModalProps> = ({
  guest,
  config,
  isOpen,
  onClose
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !guest) return null;

  const passCode = `PASS-#${Math.abs(guest.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 10000))}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${guest.name} · ${guest.table || 'Table 1'}, ${guest.seat || 'Seat 1'} (${passCode})`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="romantic-stationery-card rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative space-y-4 text-center overflow-hidden">
        {/* Subtle Double Gold-Foil Inset Frame */}
        <div className="absolute inset-2.5 sm:inset-3 border border-[#c5a059]/45 rounded-[22px] pointer-events-none"></div>
        <div className="absolute inset-3.5 sm:inset-4 border border-[#faeec7]/80 rounded-[18px] pointer-events-none"></div>

        {/* Subtle Corner Flourishes */}
        <div className="absolute top-4 left-4 text-[#c5a059]/50 text-xs pointer-events-none select-none font-serif">❦</div>
        <div className="absolute top-4 right-10 text-[#c5a059]/50 text-xs pointer-events-none select-none font-serif">❦</div>
        <div className="absolute bottom-4 left-4 text-[#c5a059]/50 text-xs pointer-events-none select-none font-serif">❦</div>
        <div className="absolute bottom-4 right-4 text-[#c5a059]/50 text-xs pointer-events-none select-none font-serif">❦</div>

        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-[#3A5A74] hover:text-[#274155] transition z-20 p-1.5 rounded-full hover:bg-[#ebf2f7] cursor-pointer"
          title="Close pass"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 pt-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#fdfbf7] via-[#f7f0e0] to-[#fdfbf7] text-[#8a6e38] text-[10px] font-serif font-bold uppercase tracking-widest border border-[#c5a059]/40 shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#c5a059]" />
            <span>Honoured Guest Place Card</span>
            <Sparkles className="w-3 h-3 text-[#c5a059]" />
          </div>
          <h3 className="text-2xl font-serif text-[#18232c] mt-1.5 font-normal tracking-wide">
            Digital Admission Pass
          </h3>
        </div>

        {/* Place Card with Subtle Gold-Foil Border */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#ffffff] border border-[#c5a059]/40 gold-foil-glow shadow-sm space-y-3.5 text-xs relative z-10">
          {/* Guest Name Calligraphy Cartouche with Gold-Foil Frame */}
          <div className="gold-foil-border-card p-3 sm:p-3.5 bg-gradient-to-b from-[#fdfbf7] via-[#ffffff] to-[#faf6ee] text-center relative overflow-hidden">
            {/* Subtle inner gold foil border line */}
            <div className="absolute inset-1 border border-[#c5a059]/35 rounded-[13px] pointer-events-none"></div>

            <div className="relative z-10">
              <span className="text-[9.5px] uppercase font-serif font-bold tracking-[0.25em] text-[#8a6e38] block mb-0.5 flex items-center justify-center space-x-1.5">
                <span className="text-[#c5a059] text-xs">❦</span>
                <span>Admit Honoured Guest</span>
                <span className="text-[#c5a059] text-xs">❦</span>
              </span>
              <div
                className="font-wedding-pinyon text-3xl sm:text-4xl text-[#18232c] font-normal leading-relaxed tracking-wide px-2 py-0.5 select-all drop-shadow-[0_1px_1px_rgba(197,160,89,0.25)]"
                style={{
                  fontFamily: "'Pinyon Script', 'Alex Brush', 'Great Vibes', cursive",
                }}
              >
                {guest.name}
              </div>
            </div>
          </div>

          <div className="text-[#3A5A74] text-xs font-serif italic tracking-wide">
            {config.title}
          </div>

          {/* Table & Seating Details with Gilded Rules */}
          <div className="flex justify-around py-2.5 border-y border-[#c5a059]/35 my-2 bg-gradient-to-b from-[#fdfbf7]/70 to-[#faf6ee]/50 rounded-xl px-1">
            <div>
              <span className="text-[10px] text-[#506173] uppercase font-serif font-bold tracking-widest block">Table</span>
              <span className="font-serif text-base text-[#18232c] font-semibold">
                {guest.table || 'Table 1'}
              </span>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#c5a059]/40 to-transparent self-center"></div>
            <div>
              <span className="text-[10px] text-[#506173] uppercase font-serif font-bold tracking-widest block">Seat</span>
              <span className="font-serif text-base text-[#18232c] font-semibold">
                {guest.seat || 'Seat 1'}
              </span>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#c5a059]/40 to-transparent self-center"></div>
            <div>
              <span className="text-[10px] text-[#506173] uppercase font-serif font-bold tracking-widest block">Party</span>
              <span className="font-serif text-base text-[#18232c] font-semibold">
                {guest.count || 1}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#475569] font-serif px-1">
            <span className="text-slate-500 italic">
              {guest.phone ? `Mobile: ${guest.phone}` : 'Confirmed Reservation'}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="font-mono text-[10px] text-[#3A5A74] font-bold hover:underline cursor-pointer flex items-center gap-1"
              title="Click to copy pass code"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{passCode}</span>
            </button>
          </div>

          {(guest.checkedIn || guest.is_checked_in) && (
            <div className="flex items-center justify-center space-x-1.5 py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-sans font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Verified Arrived
                {(guest.arrivedAt || guest.checkedInAt || guest.checked_in_at)
                  ? ` (${new Date(guest.arrivedAt || guest.checkedInAt || guest.checked_in_at!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })})`
                  : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1 relative z-10">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#18232c] text-xs font-serif font-semibold rounded-xl transition border border-[#c8d7e3] flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Print or Save PDF Place Card"
          >
            <Printer className="w-3.5 h-3.5 text-[#3A5A74]" />
            <span>Print Place Card</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white text-xs font-serif font-semibold tracking-wider rounded-xl transition shadow-sm border border-[#4D708E] cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
