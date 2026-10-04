import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface AudioPlayerDockProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  volume: number;
  onVolumeChange: (newVol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  trackTitle?: string;
}

export const AudioPlayerDock: React.FC<AudioPlayerDockProps> = ({
  isPlaying,
  onTogglePlay,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  trackTitle = 'Canon in D · Wedding Romance'
}) => {
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  return (
    <div
      className="fixed bottom-4 left-4 z-40 group bg-[#ffffff]/95 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-[0_6px_24px_rgba(58,90,116,0.18)] border border-[#c8d7e3] flex items-center space-x-2 text-xs transition-all duration-300 hover:shadow-[0_8px_30px_rgba(58,90,116,0.25)] max-w-[calc(100vw-32px)]"
      title={isPlaying ? `Now Playing: ${trackTitle}` : `Background Music (Paused): ${trackTitle}`}
    >
      {/* Play / Pause Toggle Button */}
      <button
        id="audio-dock-play-pause-btn"
        onClick={onTogglePlay}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3A5A74] hover:bg-[#274155] text-white flex items-center justify-center shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        title={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
        aria-label={isPlaying ? 'Pause Audio' : 'Play Audio'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
        )}
      </button>

      {/* Discrete Animated Equalizer Waves & Track Name */}
      <div
        className="flex items-center space-x-2 px-1 cursor-pointer select-none"
        onClick={onTogglePlay}
        title={isPlaying ? `Playing: ${trackTitle}` : 'Click to play background music'}
      >
        <div className="flex items-center space-x-0.5 h-3.5">
          <div
            className={`w-0.5 rounded-full bg-[#c5a059] transition-all duration-300 ${
              isPlaying ? 'equalizer-bar' : 'h-1.5 opacity-40'
            }`}
            style={{ maxHeight: '14px' }}
          />
          <div
            className={`w-0.5 rounded-full bg-[#3A5A74] transition-all duration-300 ${
              isPlaying ? 'equalizer-bar' : 'h-2.5 opacity-60'
            }`}
            style={{ maxHeight: '14px' }}
          />
          <div
            className={`w-0.5 rounded-full bg-[#c5a059] transition-all duration-300 ${
              isPlaying ? 'equalizer-bar' : 'h-1 opacity-40'
            }`}
            style={{ maxHeight: '14px' }}
          />
        </div>

        <span className="hidden sm:inline-block font-serif text-[11px] text-[#475569] group-hover:text-[#18232c] max-w-[150px] truncate transition-colors">
          {trackTitle}
        </span>
      </div>

      {/* Volume Icon Button & Expandable Slider */}
      <div className="flex items-center pl-1 border-l border-[#c8d7e3]/70">
        <button
          onClick={() => {
            if (isMuted) {
              onToggleMute();
            } else {
              setIsVolumeOpen((prev) => !prev);
            }
          }}
          className="p-1 text-[#3A5A74] hover:text-[#274155] transition rounded-full hover:bg-[#ebf2f7] cursor-pointer"
          title={isMuted || volume === 0 ? 'Unmute' : isVolumeOpen ? 'Hide volume slider' : 'Adjust volume'}
          aria-label="Volume settings"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-500/80" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Expandable Slider on Hover or Tap */}
        <div
          className={`transition-all duration-300 ease-out overflow-hidden flex items-center ${
            isVolumeOpen
              ? 'max-w-[76px] opacity-100 ml-1'
              : 'max-w-0 opacity-0 group-hover:max-w-[76px] group-hover:opacity-100 group-hover:ml-1'
          }`}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[#c8d7e3] rounded-lg appearance-none cursor-pointer accent-[#3A5A74]"
            title="Adjust volume level"
          />
        </div>
      </div>
    </div>
  );
};
