import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Leaf, 
  Heart, 
  Gift, 
  ScrollText,
  Menu,
  X,
  Send
} from 'lucide-react';
import { EventConfig } from '../types';

interface HeaderProps {
  config: EventConfig;
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
  onOpenHtmlModal: () => void;
  onOpenGuestbookModal: () => void;
  onOpenGiftModal?: () => void;
  onSelectPreset: (presetKey: string) => void;
  currentPresetKey: string;
  leavesEnabled?: boolean;
  onToggleLeaves?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isPlayingAudio,
  onToggleAudio,
  onOpenHtmlModal,
  onOpenGuestbookModal,
  onOpenGiftModal,
  onSelectPreset,
  currentPresetKey,
  leavesEnabled = true,
  onToggleLeaves
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const sectionIds = ['hero', 'rsvp', 'invitation', 'seating', 'church', 'venue', 'schedule', 'guestbook', 'videos', 'gift'];
    const handleScroll = () => {
      const scrollY = window.scrollY + 140;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'rsvp', label: 'RSVP' },
    ...(config.invitationEnabled !== false ? [{ id: 'invitation', label: 'Invitation' }] : []),
    { id: 'seating', label: 'Find Seat' },
    ...(config.churchEnabled !== false ? [{ id: 'church', label: 'Church' }] : []),
    ...(config.venueEnabled !== false ? [{ id: 'venue', label: 'Venue' }] : []),
    { id: 'schedule', label: 'Schedule' },
    ...(config.guestbookEnabled !== false ? [{ id: 'guestbook', label: 'Guestbook' }] : []),
    ...(config.videoBlessingsEnabled !== false ? [{ id: 'videos', label: 'Keepsakes' }] : []),
    ...(config.giftEnabled !== false ? [{ id: 'gift', label: 'Gift' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff]/95 backdrop-blur-md border-b border-[#c8d7e3] px-3 sm:px-8 py-2.5 sm:py-3 shadow-[0_4px_20px_rgba(45,75,100,0.04)] transition-colors">
      <div className="flex items-center justify-between">
        <a 
          href="#hero" 
          className="flex items-center space-x-2.5 sm:space-x-3 group cursor-pointer transition hover:opacity-90"
        >
          <span className="text-xl sm:text-2xl text-[#3A5A74] select-none font-serif transition-transform duration-300 group-hover:scale-110">
            {config.logoIcon}
          </span>
          <span className="font-serif font-semibold text-base sm:text-lg tracking-widest text-[#18232c] truncate max-w-[140px] sm:max-w-xs">
            {config.logoText}
          </span>
        </a>

        {/* Primary Desktop Navigator with Active Scroll-Spy Indicator */}
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-xs font-serif uppercase tracking-widest">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`py-1 relative transition-colors duration-200 ${
                  isActive
                    ? 'text-[#3A5A74] font-bold'
                    : 'text-[#475569] font-medium hover:text-[#18232c]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1.5 inset-x-0 h-0.5 bg-[#3A5A74] rounded-full animate-in fade-in" />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Quick RSVP CTA button */}
          <a
            href="#rsvp"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-serif font-semibold bg-[#3A5A74] hover:bg-[#274155] text-white transition shadow-xs transform hover:-translate-y-0.5 active:scale-95 border border-[#274155]"
          >
            <Send className="w-3 h-3 text-sky-100" />
            <span>RSVP</span>
          </a>

          {/* GIFT Button for quick QR display */}
          {config.giftEnabled !== false && (
            <button
              id="header-gift-btn"
              onClick={onOpenGiftModal || (() => {
                const el = document.getElementById('gift');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              })}
              title="Wedding Gift: Scan or View QR Code"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] flex items-center space-x-1.5 transition border border-[#c8d7e3] shadow-xs cursor-pointer active:scale-95"
            >
              <Gift className="w-3.5 h-3.5 text-[#3A5A74]" />
              <span>GIFT</span>
            </button>
          )}

          {/* Guestbook Button for Wishes & Love */}
          <button
            id="header-guestbook-btn"
            onClick={onOpenGuestbookModal}
            title="Guestbook: Write Wishes & Love"
            className="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] flex items-center space-x-1.5 transition border border-[#c8d7e3] shadow-xs cursor-pointer active:scale-95"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            <span className="hidden xs:inline">Guestbook</span>
          </button>

          {/* Background Music Button */}
          <button
            id="header-music-btn"
            onClick={onToggleAudio}
            title={isPlayingAudio ? 'Pause Background Music' : 'Play Background Music'}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shadow-sm border cursor-pointer active:scale-95 ${
              isPlayingAudio 
                ? 'bg-[#3A5A74] text-white border-[#274155]' 
                : 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] hover:bg-[#ebf2f7]'
            }`}
          >
            <Music className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
          </button>

          {/* Falling Leaves Animation Toggle Button */}
          {onToggleLeaves && (
            <button
              id="header-leaves-btn"
              onClick={onToggleLeaves}
              title={leavesEnabled ? 'Pause Falling Wedding Leaves & Petals' : 'Enable Falling Wedding Leaves & Petals'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shadow-sm border cursor-pointer active:scale-95 ${
                leavesEnabled 
                  ? 'bg-[#3A5A74] text-white border-[#274155]' 
                  : 'bg-[#ffffff] text-[#475569] border-[#c8d7e3] hover:bg-[#ebf2f7]'
              }`}
            >
              <Leaf className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${leavesEnabled ? 'opacity-100' : 'opacity-40'}`} />
            </button>
          )}

          {/* Mobile Menu Navigator Toggle Button */}
          <button
            id="header-mobile-menu-btn"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle Navigator Menu"
            aria-label="Toggle Navigator Menu"
            className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shadow-xs border bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border-[#c8d7e3] cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigator */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#c8d7e3] mt-2.5 pt-3 pb-2 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1 font-serif text-xs font-semibold uppercase tracking-widest text-[#475569]">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-2.5 px-3.5 rounded-xl transition flex items-center justify-between ${
                    isActive
                      ? 'bg-[#ebf2f7] text-[#3A5A74] font-bold'
                      : 'hover:bg-[#ebf2f7]/60 hover:text-[#3A5A74]'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-[#3A5A74]' : 'text-[#94a3b8]'}`}>❦</span>
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
