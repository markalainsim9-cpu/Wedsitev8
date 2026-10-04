import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Church, Send, CalendarPlus } from 'lucide-react';
import { EventConfig } from '../types';
import { downloadCalendarIcs } from '../utils/calendar';
import { getWeddingTitleClasses } from '../utils/weddingFonts';
import { getEventTargetTimestamp } from '../utils/timezone';
import { WatercolorFloralBorder } from './WatercolorFloralBorder';
import { BurgundyFloralBorder } from './BurgundyFloralBorder';

interface HeroSectionProps {
  config: EventConfig;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ config }) => {
  const [imgError, setImgError] = useState(false);
  const fallbackHero = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=500&q=80";

  useEffect(() => {
    setImgError(false);
  }, [config.heroImage]);

  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    mins: '00',
    secs: '00'
  });

  useEffect(() => {
    function calculateCountdown() {
      const target = getEventTargetTimestamp(
        config.targetDate,
        config.date,
        config.churchTime || '2:00 PM PST',
        config.timezone || 'PST'
      );

      if (isNaN(target)) {
        setTimeLeft({ days: '00', hours: '00', mins: '00', secs: '00' });
        return;
      }

      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: '00', hours: '00', mins: '00', secs: '00' });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: days < 10 ? `0${days}` : `${days}`,
        hours: hours < 10 ? `0${hours}` : `${hours}`,
        mins: mins < 10 ? `0${mins}` : `${mins}`,
        secs: secs < 10 ? `0${secs}` : `${secs}`
      });
    }

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config.targetDate, config.date, config.churchTime, config.time, config.timezone]);

  return (
    <section id="hero" className="romantic-stationery-card rounded-3xl p-6 sm:p-14 text-center relative overflow-hidden group">
      {/* Subtle Watercolor Floral Border for Dusty Blue Theme */}
      {(config.themeColor || 'dusty-blue') === 'dusty-blue' ? (
        <WatercolorFloralBorder
          variation={config.dustyBlueFloralBorder || 'wisteria-hydrangea'}
          className="rounded-3xl"
        />
      ) : config.themeColor === 'burgundy' ? (
        <BurgundyFloralBorder
          variation={config.burgundyFloralBorder || 'velvet-rose-ranunculus'}
          className="rounded-3xl"
        />
      ) : (
        /* Delicate Inner Stationery Border for other themes */
        <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/40 rounded-2xl pointer-events-none"></div>
      )}

      {/* Couple / Celebration Hero Image */}
      <div className="relative z-10 mb-5 flex justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 border-2 border-[#c5a059]/60 shadow-md bg-[#ffffff] overflow-hidden">
          <img
            id="hero-header-image"
            key={config.heroImage}
            src={(!imgError && config.heroImage && config.heroImage.trim().length > 0) ? config.heroImage : fallbackHero}
            alt={config.title || "Celebration"}
            className="w-full h-full object-cover rounded-full transition-transform duration-500 hover:scale-105"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      </div>

      {/* Romantic Calligraphic Subheader */}
      <div className="relative z-10">
        {config.subHeaderEnabled !== false && (config.subHeader || '').trim() !== '' && (
          <p className="font-script text-3xl sm:text-4xl text-[#3A5A74] leading-snug mb-1">
            {config.subHeader}
          </p>
        )}

        {(config.invitationLine !== undefined ? config.invitationLine : 'Request the honour of your presence at the marriage of').trim() !== '' && (
          <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#506173] block mb-3 font-serif">
            {config.invitationLine !== undefined ? config.invitationLine : 'Request the honour of your presence at the marriage of'}
          </span>
        )}
        
        <h1
          id="hero-celebration-title"
          className={`${getWeddingTitleClasses({
            font: config.titleFont,
            weight: config.titleWeight,
            italic: config.titleItalic,
            transform: config.titleTransform,
            tracking: config.titleTracking,
            size: config.titleSize
          })} text-[#18232c] my-1 sm:my-2 text-balance`}
        >
          {config.title}
        </h1>

        {/* Delicate Floral Ornament Divider */}
        <div className="flex items-center justify-center space-x-3 my-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c5a059]/60"></div>
          <span className="text-[#3A5A74] text-base select-none">❦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c5a059]/60"></div>
        </div>

        {(config.description || '').trim() !== '' && (
          <p className="text-[#334155] text-base sm:text-xl max-w-xl mx-auto font-normal leading-relaxed font-serif italic text-balance">
            {config.description}
          </p>
        )}
      </div>

      {/* Date, Time & Venue Plaque */}
      <div className="relative z-10 mt-8 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-5 bg-[#ffffff] px-5 py-3.5 rounded-2xl shadow-sm border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c] transition hover:shadow-md">
        <div className="flex items-center space-x-2 px-1 font-serif font-medium text-[#18232c]">
          <Calendar className="w-4 h-4 text-[#3A5A74]" />
          <span>{config.date}</span>
        </div>
        <div className="h-4 w-px bg-[#c5a059]/40 hidden sm:block"></div>
        <div className="flex items-center space-x-2 px-1 font-serif font-medium text-[#18232c]">
          <Clock className="w-4 h-4 text-[#3A5A74]" />
          <span>{config.churchTime || '2:00 PM PST'}</span>
        </div>
        <div className="h-4 w-px bg-[#c5a059]/40 hidden sm:block"></div>
        <div className="flex items-center space-x-2 px-1 font-serif font-medium text-[#18232c]">
          <Church className="w-4 h-4 text-[#3A5A74]" />
          <span>{config.churchName || 'Holy Cross Parish Church'}</span>
        </div>
      </div>

      {/* Classical Countdown Timer */}
      <div className="relative z-10 mt-10">
        <div className="flex flex-col items-center justify-center space-y-1.5 mb-4">
          <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#506173] font-serif">
            {config.countdownTitle || 'Countdown to the Sacred Celebration'}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xs sm:max-w-md mx-auto">
          <div className="p-3 sm:p-4 bg-[#ffffff] rounded-2xl shadow-sm border border-[#c8d7e3] transition hover:shadow-md">
            <span className="block text-2xl sm:text-4xl font-serif text-[#18232c] font-normal tabular-nums">
              {timeLeft.days}
            </span>
            <span className="text-[10px] font-bold text-[#3A5A74] uppercase tracking-widest font-serif">Days</span>
          </div>
          <div className="p-3 sm:p-4 bg-[#ffffff] rounded-2xl shadow-sm border border-[#c8d7e3] transition hover:shadow-md">
            <span className="block text-2xl sm:text-4xl font-serif text-[#18232c] font-normal tabular-nums">
              {timeLeft.hours}
            </span>
            <span className="text-[10px] font-bold text-[#3A5A74] uppercase tracking-widest font-serif">Hours</span>
          </div>
          <div className="p-3 sm:p-4 bg-[#ffffff] rounded-2xl shadow-sm border border-[#c8d7e3] transition hover:shadow-md">
            <span className="block text-2xl sm:text-4xl font-serif text-[#18232c] font-normal tabular-nums">
              {timeLeft.mins}
            </span>
            <span className="text-[10px] font-bold text-[#3A5A74] uppercase tracking-widest font-serif">Mins</span>
          </div>
          <div className="p-3 sm:p-4 bg-[#ffffff] rounded-2xl shadow-sm border border-[#c8d7e3] transition hover:shadow-md">
            <span className="block text-2xl sm:text-4xl font-serif text-[#18232c] font-normal tabular-nums">
              {timeLeft.secs}
            </span>
            <span className="text-[10px] font-bold text-[#3A5A74] uppercase tracking-widest font-serif">Secs</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 mt-8 flex flex-col items-center justify-center space-y-2.5">
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <a
            id="hero-rsvp-btn"
            href="#rsvp"
            className="px-8 py-3.5 bg-[#3A5A74] hover:bg-[#274155] text-white font-serif text-sm tracking-wider font-semibold rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center space-x-2.5 transform hover:-translate-y-0.5 active:scale-95 border border-[#4D708E] group/btn cursor-pointer"
          >
            <Send className="w-4 h-4 text-sky-100 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
            <span>RSVP With Pleasure</span>
          </a>
          <button
            id="hero-calendar-btn"
            onClick={() => downloadCalendarIcs(config)}
            className="px-7 py-3.5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#18232c] font-serif text-sm tracking-wider font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-2 border border-[#c8d7e3] transform hover:-translate-y-0.5 active:scale-95"
          >
            <CalendarPlus className="w-4 h-4 text-[#3A5A74]" />
            <span>Add to Calendar</span>
          </button>
        </div>
        {(config.rsvpDeadline || config.deadline) && (
          <p className="text-xs font-serif text-[#506173] italic pt-1 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#3A5A74] inline shrink-0" />
            <span>Kindly submit your RSVP on or before <strong className="font-semibold text-[#3A5A74] not-italic">{config.rsvpDeadline || config.deadline}</strong></span>
          </p>
        )}
      </div>
    </section>
  );
};
