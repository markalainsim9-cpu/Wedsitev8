import React, { useState } from 'react';
import { MapPin, Navigation, Copy, Check, Info, Clock } from 'lucide-react';
import { EventConfig } from '../types';

interface VenueSectionProps {
  config: EventConfig;
}

export const VenueSection: React.FC<VenueSectionProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);

  // If venue section is explicitly disabled, do not render
  if (config.venueEnabled === false) {
    return null;
  }

  const venueNotes = config.venueNotes || "Valet and guest parking are available on-site at the estate entrance. Shuttle vans operate continuously between the sanctuary and celebration grounds.";

  const handleCopyAddress = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${config.venue}, ${config.address}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section id="venue" className="romantic-stationery-card rounded-3xl p-6 sm:p-12 relative overflow-hidden">
      {/* Delicate Inner Stationery Border */}
      <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

      <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
        {config.venueEyebrow !== '' && (
          <div className="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1.5">
            <span>❦</span>
            <span>{config.venueEyebrow || 'The Celebration Grounds'}</span>
            <span>❦</span>
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl font-serif text-[#18232c] tracking-wide font-normal">
          {config.venueTitle || 'The Estate & Glasshouse'}
        </h2>
        {config.venueSubtitle !== '' && (
          <p className="text-[#475569] font-serif italic text-sm sm:text-base mt-2">
            "{config.venueSubtitle || 'Join us amid timeless coastal gardens and candlelit historic halls.'}"
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch relative z-10">
        {/* Prominent Large Venue Photo Card (No Click to Enlarge button) */}
        <div className="lg:col-span-7 relative group overflow-hidden rounded-2xl shadow-md border border-[#c8d7e3] min-h-[360px] sm:min-h-[440px] md:min-h-[500px] lg:min-h-[540px] flex flex-col justify-end bg-slate-900">
          <img
            src={config.venueImg || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'}
            alt={config.venue}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          {/* Subtle Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#152330]/95 via-[#152330]/35 to-transparent pointer-events-none" />

          {/* Bottom Caption Overlay */}
          <div className="relative z-10 p-5 sm:p-6 text-white space-y-1">
            <div className="flex items-center space-x-2 text-xs text-sky-200 font-serif tracking-wider mb-1">
              <MapPin className="w-4 h-4 text-sky-300 shrink-0" />
              <span className="uppercase tracking-widest text-[11px] font-semibold">Reception & Celebration Grounds</span>
            </div>
            <span className="font-serif text-xl sm:text-2xl tracking-wide font-normal block text-white drop-shadow-sm">
              {config.venue}
            </span>
            <a
              href={config.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-100 hover:text-white font-serif tracking-wider underline flex items-center space-x-1.5 pt-1 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Explore Grounds on Google Maps</span>
            </a>
          </div>
        </div>

        {/* Details & Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-sm space-y-4 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2ecf4] pb-3">
              <div className="flex items-center space-x-2 text-[#3A5A74] font-serif font-bold text-xs uppercase tracking-widest">
                <MapPin className="w-4 h-4 text-[#3A5A74]" />
                <span>Estate Location</span>
              </div>
              {config.time && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#ebf2f7] border border-[#c8d7e3] rounded-full text-xs font-serif font-semibold text-[#3A5A74]">
                  <Clock className="w-3 h-3 text-[#3A5A74]" />
                  <span>Reception Gala: {config.time}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-serif text-[#18232c] text-xl sm:text-2xl font-normal leading-snug">
                {config.venue}
              </h3>
              <p className="text-[#475569] font-serif text-sm sm:text-base leading-relaxed mt-2">
                {config.address}
              </p>
            </div>

            {/* Parking, Transportation & Guest Arrival Notes */}
            {venueNotes && (
              <div className="pt-3 border-t border-[#e2ecf4] flex items-start space-x-2.5 text-xs text-[#506173] font-serif leading-relaxed">
                <Info className="w-4 h-4 text-[#3A5A74] shrink-0 mt-0.5" />
                <span>{venueNotes}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              id="venue-directions-btn"
              href={config.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-2xl text-xs font-serif font-semibold tracking-wider transition text-center shadow-sm flex items-center justify-center space-x-2 border border-[#4D708E] transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-sky-100" />
              <span>Get Directions to Grounds</span>
            </a>

            <button
              id="venue-copy-address-btn"
              onClick={handleCopyAddress}
              className="py-3.5 px-5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#18232c] border border-[#c8d7e3] rounded-2xl text-xs font-serif font-semibold tracking-wider transition flex items-center justify-center space-x-2 shadow-sm transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Address Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#3A5A74]" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
