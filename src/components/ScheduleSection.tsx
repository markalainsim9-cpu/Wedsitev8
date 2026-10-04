import React from 'react';
import { Church, Wine, Clock, Sparkles, Heart, Utensils, Music, Camera, Car } from 'lucide-react';
import { TimelineItem, EventConfig } from '../types';

interface ScheduleSectionProps {
  timeline: TimelineItem[];
  config?: EventConfig;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ timeline, config }) => {
  // Helper to pick a thematic icon based on event title
  const getTimelineIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('church') || t.includes('ceremony') || t.includes('matrimony') || t.includes('vow')) {
      return <Church className="w-3.5 h-3.5 text-white" />;
    }
    if (t.includes('dinner') || t.includes('banquet') || t.includes('feast') || t.includes('cocktail') || t.includes('toast')) {
      return <Wine className="w-3.5 h-3.5 text-white" />;
    }
    if (t.includes('dance') || t.includes('party') || t.includes('music')) {
      return <Music className="w-3.5 h-3.5 text-white" />;
    }
    if (t.includes('photo') || t.includes('portrait')) {
      return <Camera className="w-3.5 h-3.5 text-white" />;
    }
    if (t.includes('send') || t.includes('departure') || t.includes('farewell')) {
      return <Car className="w-3.5 h-3.5 text-white" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-white" />;
  };

  return (
    <section id="schedule" className="romantic-stationery-card rounded-3xl p-6 sm:p-12 relative overflow-hidden">
      {/* Delicate Inner Stationery Border */}
      <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

      <div className="text-center max-w-xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1.5">
          <span>❦</span>
          <span>Order of the Day</span>
          <span>❦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-[#18232c] tracking-wide font-normal">
          Schedule of Celebrations
        </h2>
        <p className="text-[#475569] font-serif italic text-sm sm:text-base mt-2 text-balance">
          "A timeline of vows, joyous toasts, and dancing under the starlit canopy."
        </p>

        {config && (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4 text-xs font-serif">
            {config.churchTime && (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#ebf2f7] border border-[#c8d7e3] text-[#3A5A74] font-semibold shadow-2xs">
                <Church className="w-3.5 h-3.5 text-[#3A5A74]" />
                <span>Church Ceremony:</span>
                <span className="font-bold text-[#18232c]">{config.churchTime}</span>
              </span>
            )}
            {config.time && (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#ffffff] border border-[#c8d7e3] text-[#3A5A74] font-semibold shadow-2xs">
                <Wine className="w-3.5 h-3.5 text-[#3A5A74]" />
                <span>Reception Gala:</span>
                <span className="font-bold text-[#18232c]">{config.time}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto relative border-l-2 border-[#c5a059]/40 ml-4 sm:ml-auto space-y-6 pl-7 sm:pl-10 relative z-10">
        {timeline.map((item) => (
          <div 
            key={item.id} 
            className="relative group p-3.5 -ml-3.5 rounded-2xl hover:bg-[#ebf2f7]/60 transition-all duration-300 border border-transparent hover:border-[#c8d7e3]/60 cursor-default"
          >
            {/* Themed Icon Node */}
            <div className="absolute -left-[39px] sm:-left-[51px] top-3.5 w-6 h-6 rounded-full bg-[#3A5A74] ring-4 ring-[#ffffff] shadow-sm transition-transform duration-300 group-hover:scale-110 flex items-center justify-center border border-sky-200">
              {getTimelineIcon(item.title)}
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-xs uppercase text-[#3A5A74] tracking-widest bg-[#ebf2f7] px-2.5 py-0.5 rounded-md border border-[#c8d7e3]">
                {item.time}
              </span>
            </div>

            <h3 className="text-xl font-serif text-[#18232c] mt-1.5 font-normal tracking-wide group-hover:text-[#3A5A74] transition-colors">
              {item.title}
            </h3>

            <p className="text-sm text-[#475569] font-normal mt-1 leading-relaxed font-serif text-balance">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
