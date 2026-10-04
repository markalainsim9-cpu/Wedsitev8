import React, { useState } from 'react';
import { Send, HeartHandshake, CheckCircle2, MessageSquare, Phone } from 'lucide-react';
import { EventConfig, Guest } from '../types';

interface RsvpSectionProps {
  config: EventConfig;
  onSubmitRsvp: (guestData: Omit<Guest, 'id' | 'createdAt'>) => void;
}

export const RsvpSection: React.FC<RsvpSectionProps> = ({ config, onSubmitRsvp }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [count, setCount] = useState<number>(1);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmitRsvp({
      name: name.trim(),
      phone: phone.trim(),
      attending,
      count: attending === 'yes' ? count : 0,
      song: '',
      note: note.trim(),
      table: '',
      seat: ''
    });

    setSubmitted(true);
    setTimeout(() => {
      const el = document.getElementById('rsvp');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <section id="rsvp" className="romantic-stationery-card rounded-3xl p-6 sm:p-12 relative overflow-hidden">
      {/* Delicate Inner Stationery Border */}
      <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

      <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
        <div className="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1.5">
          <span>❦</span>
          <span>The Favor of Your Reply</span>
          <span>❦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-[#18232c] tracking-wide font-normal">
          Formal Reply Card
        </h2>
        <p className="text-[#475569] font-serif italic text-sm sm:text-base mt-2">
          Kindly respond on or before{' '}
          <span className="font-semibold text-[#3A5A74] not-italic underline decoration-[#c5a059]">
            {config.rsvpDeadline || config.deadline}
          </span>
        </p>
      </div>

      {submitted ? (
        <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-[#ffffff] rounded-3xl border border-[#c8d7e3] shadow-lg animate-in fade-in zoom-in-95 relative z-10">
          <div className="w-14 h-14 rounded-full bg-[#ebf2f7] text-[#3A5A74] flex items-center justify-center mx-auto text-2xl border border-[#c5a059]/50 shadow-sm animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-[#3A5A74]" />
          </div>
          <h3 className="text-2xl font-serif text-[#18232c] font-normal">
            Thank You, {name}
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] font-serif leading-relaxed text-balance">
            {attending === 'yes'
              ? 'Your response has been warmly received and your seat reservation is registered. We look forward to celebrating with you!'
              : 'Thank you for letting us know. You will be held dearly in our hearts.'}
          </p>

          {phone && (
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#ebf2f7] text-[#3A5A74] text-xs font-serif border border-[#c8d7e3]">
              <Phone className="w-3.5 h-3.5 text-[#3A5A74]" />
              <span>
                Mobile on file: <strong className="font-mono text-[#18232c]">{phone}</strong>
              </span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#seating"
              className="px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition shadow-sm border border-[#4D708E]"
            >
              Look Up Seating Assignment
            </a>
            <button
              onClick={() => {
                setName('');
                setPhone('');
                setNote('');
                setAttending('yes');
                setCount(1);
                setSubmitted(false);
              }}
              className="px-5 py-2.5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#18232c] rounded-xl text-xs font-serif font-semibold transition border border-[#c8d7e3]"
            >
              Submit Another RSVP
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rsvp-name-input" className="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">
                Full Name *
              </label>
              <input
                id="rsvp-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emily Watson"
                className="w-full px-4 py-3 rounded-2xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#3A5A74]/20 focus:border-[#3A5A74] text-[#18232c] font-medium placeholder-slate-400 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="rsvp-phone-input" className="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c]">
                  Phone Number *
                </label>
                <span className="text-[10px] font-serif font-semibold text-[#3A5A74] uppercase tracking-wider bg-[#ebf2f7] px-2 py-0.5 rounded-md border border-[#c8d7e3]">
                  Mobile Contact
                </span>
              </div>
              <div className="relative">
                <input
                  id="rsvp-phone-input"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0917 123 4567"
                  maxLength={11}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#3A5A74]/20 focus:border-[#3A5A74] text-[#18232c] font-medium placeholder-slate-400 transition"
                />
                <Phone className="w-4 h-4 text-[#3A5A74] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-2">
              Will you attend? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center p-3.5 rounded-2xl border cursor-pointer transition font-serif ${
                  attending === 'yes'
                    ? 'border-[#3A5A74] bg-[#ebf2f7] text-[#3A5A74] font-semibold shadow-sm ring-2 ring-[#3A5A74]/20'
                    : 'border-[#c8d7e3] bg-[#ffffff] text-[#475569] hover:bg-[#ebf2f7]'
                }`}
              >
                <input
                  type="radio"
                  name="attending"
                  value="yes"
                  checked={attending === 'yes'}
                  onChange={() => setAttending('yes')}
                  className="hidden"
                />
                <span className="text-xs sm:text-sm">Joyfully Accepts ❦</span>
              </label>
              <label
                className={`flex items-center justify-center p-3.5 rounded-2xl border cursor-pointer transition font-serif ${
                  attending === 'no'
                    ? 'border-[#3A5A74] bg-[#ebf2f7] text-[#3A5A74] font-semibold shadow-sm ring-2 ring-[#3A5A74]/20'
                    : 'border-[#c8d7e3] bg-[#ffffff] text-[#475569] hover:bg-[#ebf2f7]'
                }`}
              >
                <input
                  type="radio"
                  name="attending"
                  value="no"
                  checked={attending === 'no'}
                  onChange={() => setAttending('no')}
                  className="hidden"
                />
                <span className="text-xs sm:text-sm">Regretfully Declines</span>
              </label>
            </div>
          </div>

          {attending === 'yes' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">
                  Number of Guests in Party
                </label>
                <select
                  id="rsvp-guest-count"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#3A5A74]/20 focus:border-[#3A5A74] text-[#18232c] font-medium"
                >
                  <option value={1}>1 Guest (Solo)</option>
                  <option value={2}>2 Guests (+1 Plus One)</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">
              Warm Wishes or Dietary Notes
            </label>
            <div className="relative">
              <textarea
                id="rsvp-message-input"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Share your heartfelt blessing or dietary requirements..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#3A5A74]/20 focus:border-[#3A5A74] text-[#18232c] font-medium placeholder-slate-400 transition"
              />
              <MessageSquare className="w-4 h-4 text-[#3A5A74] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            id="rsvp-submit-btn"
            type="submit"
            className="w-full py-4 bg-[#3A5A74] hover:bg-[#274155] text-white font-serif font-semibold text-sm tracking-widest uppercase rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98] border border-[#4D708E] cursor-pointer flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4 text-sky-100" />
            <span>Send Formal Response</span>
          </button>
        </form>
      )}
    </section>
  );
};
