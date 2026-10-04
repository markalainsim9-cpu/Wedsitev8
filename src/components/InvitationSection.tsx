import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Play, 
  Pause, 
  Sparkles, 
  ScrollText, 
  Layers, 
  Check,
  ZoomIn,
  Calendar
} from 'lucide-react';
import { EventConfig, InvitationSlide } from '../types';

interface InvitationSectionProps {
  config: EventConfig;
}

export const InvitationSection: React.FC<InvitationSectionProps> = ({ config }) => {
  const rawSlides = config.invitationImages && config.invitationImages.length > 0 
    ? config.invitationImages 
    : [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
          title: 'Formal Invitation Suite & Monogram',
          caption: 'Heirloom letterpress calligraphy on handmade deckle-edge paper with dusty blue silk ribbon and wax seal.'
        }
      ];

  // Normalize slide items so strings become objects
  const slides: InvitationSlide[] = rawSlides.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `slide-${index}`,
        url: item,
        title: `Invitation Card ${index + 1}`,
        caption: 'Formal wedding invitation stationery suite'
      };
    }
    return item;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Keep index within bounds if slide count changes
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Autoplay slideshow effect
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Touch Swipe Handlers for mobile phones
  const minSwipeDistance = 45;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape' && isLightboxOpen) setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, slides.length]);

  if (config.invitationEnabled === false) {
    return null;
  }

  const currentSlide = slides[currentIndex] || slides[0];
  const rsvpDeadline = config.rsvpDeadline || config.deadline || '';

  return (
    <section id="invitation" className="relative scroll-mt-24">
      {/* Outer Classic Stationery Framing matching ChurchSection */}
      <div className="romantic-stationery-card rounded-3xl p-6 sm:p-12 relative overflow-hidden">
        {/* Delicate Inner Stationery Border */}
        <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

        {/* Section Header matching ChurchSection typography */}
        <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
          <div className="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1.5">
            <span>❦</span>
            <span>{config.invitationEyebrow || 'Formal Suite & Stationery'}</span>
            <span>❦</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif text-[#18232c] tracking-wide font-normal text-balance">
            {config.invitationTitle || 'The Wedding Invitation Suite'}
          </h2>

          {config.invitationSubtitle && (
            <p className="text-[#475569] font-serif italic text-sm sm:text-base mt-2 text-balance">
              "{config.invitationSubtitle}"
            </p>
          )}
        </div>

        {/* Slideshow Display Container */}
        <div className="relative max-w-2xl mx-auto z-10">
          {/* Main Card Viewport */}
          <div 
            className="relative rounded-2xl overflow-hidden bg-[#18232c]/5 border-2 border-[#c8d7e3] shadow-md group cursor-pointer aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] max-h-[620px] flex items-center justify-center select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={() => setIsLightboxOpen(true)}
            title="Click to view full-size invitation"
          >
            {/* Slide Image */}
            <img
              src={currentSlide.url}
              alt={currentSlide.title || 'Formal Wedding Invitation'}
              className="w-full h-full object-contain sm:object-cover bg-[#f8fafc] transition-transform duration-500 group-hover:scale-[1.02]"
              loading="eager"
            />

            {/* Inner Border Deckle Frame */}
            <div className="absolute inset-2 sm:inset-3 border border-white/40 pointer-events-none rounded-xl shadow-inner"></div>

            {/* Subtle Gradient Vignette at Bottom for Text Contrast */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-16 pb-4 px-4 sm:px-6 text-white pointer-events-none flex flex-col justify-end">
              <span className="text-[10px] uppercase tracking-widest font-serif text-amber-200/90 font-semibold mb-1">
                Card {currentIndex + 1} of {slides.length}
              </span>
              {currentSlide.title && (
                <h3 className="text-base sm:text-xl font-serif font-bold text-white tracking-wide drop-shadow-sm">
                  {currentSlide.title}
                </h3>
              )}
              {currentSlide.caption && (
                <p className="text-xs sm:text-sm text-slate-200 font-serif italic line-clamp-2 mt-0.5 opacity-90">
                  {currentSlide.caption}
                </p>
              )}
              {rsvpDeadline && (
                <div className="mt-2.5 pt-2 border-t border-white/20 flex flex-wrap items-center justify-between gap-1.5 text-xs font-serif">
                  <span className="inline-flex items-center space-x-1.5 text-amber-200">
                    <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Please submit responses on or before <strong className="text-white underline decoration-amber-300 font-semibold">{rsvpDeadline}</strong></span>
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-300 font-sans">Formal RSVP</span>
                </div>
              )}
            </div>

            {/* Top Toolbar on Invitation Card: Counter + RSVP Deadline & Zoom In */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10 gap-2">
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-sans font-medium border border-white/20 shadow-md shrink-0">
                  <span className="text-amber-200 font-bold">{currentIndex + 1}</span> / {slides.length}
                </div>

                {rsvpDeadline && (
                  <div 
                    className="bg-white/95 backdrop-blur-md text-[#18232c] px-3 py-1 rounded-full text-[11px] font-serif border border-[#c5a059]/50 shadow-md flex items-center space-x-1.5 transition truncate max-w-[190px] sm:max-w-none"
                    title={`RSVP Deadline: ${rsvpDeadline}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#3A5A74] shrink-0" />
                    <span className="text-[#506173] hidden sm:inline font-sans uppercase tracking-wider text-[10px] font-semibold">RSVP by</span>
                    <span className="font-bold text-[#3A5A74] truncate">{rsvpDeadline}</span>
                  </div>
                )}
              </div>

              <div className="pointer-events-auto shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-full text-xs flex items-center space-x-1.5 px-3 border border-white/20 shadow-md transition"
                  title="Zoom Fullscreen"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-sans font-medium">Zoom In</span>
                </button>
              </div>
            </div>
          </div>

          {/* Previous / Next Arrow Controls */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Invitation Card"
                className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ffffff]/90 hover:bg-[#ffffff] text-[#3A5A74] border border-[#c8d7e3] shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95 z-20"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Invitation Card"
                className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ffffff]/90 hover:bg-[#ffffff] text-[#3A5A74] border border-[#c8d7e3] shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95 z-20"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Navigation Controls Bar: Thumbnails / Dots / Autoplay */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
            {/* Dot Indicator Bar */}
            <div className="flex items-center space-x-2">
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx 
                      ? 'w-8 bg-[#3A5A74]' 
                      : 'w-2.5 bg-[#c8d7e3] hover:bg-[#3A5A74]/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                  title={slide.title || `Card ${idx + 1}`}
                />
              ))}
            </div>

            {/* Quick Actions: Autoplay, Deadline & RSVP Anchor */}
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {rsvpDeadline && (
                <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#ebf2f7] border border-[#c8d7e3] text-xs font-serif text-[#18232c] shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span className="text-[#506173]">RSVP Deadline:</span>
                  <span className="font-bold text-[#3A5A74]">{rsvpDeadline}</span>
                </div>
              )}

              {slides.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1.5 rounded-full text-xs font-serif font-medium border flex items-center space-x-1.5 transition ${
                    isPlaying 
                      ? 'bg-[#3A5A74] text-white border-[#274155]' 
                      : 'bg-[#ffffff] text-[#506173] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlaying ? 'Pause Slideshow' : 'Auto Slide'}</span>
                </button>
              )}

              <a
                href="#rsvp"
                className="px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold bg-[#3A5A74] text-white hover:bg-[#274155] transition shadow-sm flex items-center space-x-1"
              >
                <span>Respond to RSVP</span>
                <span className="text-[10px]">→</span>
              </a>
            </div>
          </div>

          {/* Thumbnail Strip (if multiple slides) */}
          {slides.length > 1 && (
            <div className="mt-4 pt-3 border-t border-[#c8d7e3]/60 flex items-center justify-center gap-2 overflow-x-auto py-1">
              {slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                    currentIndex === idx 
                      ? 'border-[#3A5A74] ring-2 ring-[#3A5A74]/20 scale-105 shadow-md' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={s.url} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-mono text-center">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-serif">
                  Formal Invitation Card {currentIndex + 1} of {slides.length}
                </span>
                {currentSlide.title && (
                  <span className="text-sm font-serif hidden sm:inline text-white/80">
                    — {currentSlide.title}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {rsvpDeadline && (
                  <div className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-serif text-amber-200">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    <span>RSVP by: <strong className="text-white font-semibold">{rsvpDeadline}</strong></span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                  title="Close Lightbox (Esc)"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* High-Resolution Zoom Image */}
            <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-white/20">
              <img
                src={currentSlide.url}
                alt={currentSlide.title || 'Formal Invitation'}
                className="max-h-[78vh] w-auto object-contain rounded-xl shadow-2xl"
              />

              {/* Lightbox Navigation Buttons */}
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Caption in Lightbox */}
            {currentSlide.caption && (
              <p className="text-center text-xs sm:text-sm text-slate-300 font-serif italic pt-3 px-4">
                "{currentSlide.caption}"
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
