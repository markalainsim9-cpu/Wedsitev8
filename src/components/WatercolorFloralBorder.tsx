import React from 'react';
import { DustyBlueFloralBorder } from '../types';

interface WatercolorFloralBorderProps {
  variation?: DustyBlueFloralBorder;
  className?: string;
  showCardWash?: boolean;
  opacity?: number;
}

export const WatercolorFloralBorder: React.FC<WatercolorFloralBorderProps> = ({
  variation = 'wisteria-hydrangea',
  className = '',
  showCardWash = true,
  opacity = 0.95
}) => {
  if (variation === 'none') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl border border-[#c5a059]/35 ${className}`}
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(58, 90, 116, 0.08)'
        }}
      >
        <div className="absolute inset-2 sm:inset-3 border border-[#c5a059]/25 rounded-xl sm:rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
      style={{ opacity }}
    >
      {/* Soft atmospheric watercolor wash vignette */}
      {showCardWash && (
        <div
          className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              variation === 'wisteria-hydrangea'
                ? 'radial-gradient(circle at 10% 10%, rgba(224, 236, 245, 0.35) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(214, 228, 239, 0.3) 0%, transparent 45%), radial-gradient(circle at 50% 100%, rgba(235, 242, 247, 0.3) 0%, transparent 50%)'
                : variation === 'chateau-rose'
                ? 'radial-gradient(circle at 15% 15%, rgba(219, 233, 244, 0.35) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(225, 237, 247, 0.3) 0%, transparent 40%), radial-gradient(circle at 50% 95%, rgba(247, 241, 228, 0.3) 0%, transparent 45%)'
                : variation === 'anemone-eucalyptus'
                ? 'radial-gradient(circle at 8% 8%, rgba(210, 228, 242, 0.4) 0%, transparent 48%), radial-gradient(circle at 92% 12%, rgba(220, 236, 232, 0.35) 0%, transparent 45%), radial-gradient(circle at 50% 98%, rgba(230, 240, 248, 0.3) 0%, transparent 50%)'
                : variation === 'wildflower-delphinium'
                ? 'radial-gradient(circle at 12% 12%, rgba(215, 232, 246, 0.4) 0%, transparent 45%), radial-gradient(circle at 88% 8%, rgba(205, 226, 242, 0.38) 0%, transparent 45%), radial-gradient(circle at 50% 90%, rgba(238, 245, 250, 0.35) 0%, transparent 45%)'
                : 'radial-gradient(circle at 50% 5%, rgba(224, 236, 245, 0.4) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(230, 240, 248, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(230, 240, 248, 0.3) 0%, transparent 40%)'
          }}
        />
      )}

      {/* Double-rule stationery inner line with corner filigree */}
      <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/35 rounded-2xl pointer-events-none" />
      <div className="absolute inset-4 sm:inset-5 border border-[#3A5A74]/15 rounded-xl pointer-events-none" />

      {/* VARIATION 1: COASTAL HYDRANGEA & CASCADING WISTERIA */}
      {variation === 'wisteria-hydrangea' && (
        <>
          {/* Top-Left Cluster: Layered Hydrangeas & Cascading Wisteria */}
          <svg
            className="absolute top-0 left-0 w-32 h-32 sm:w-44 sm:h-44 text-[#3A5A74]"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hydrangea-petal-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#84A7C2" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3A5A74" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="hydrangea-petal-2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B4C9DA" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#557B9A" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="wisteria-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9AB8D1" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#5B81A0" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3A5A74" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="sage-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B5C8BC" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#6C8775" stopOpacity="0.9" />
              </linearGradient>
              <radialGradient id="gold-shimmer" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5E4BE" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#C5A059" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#967735" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Sage Botanical Leaves */}
            <path
              d="M15 65 C 20 40, 50 25, 75 35 C 60 55, 35 70, 15 65 Z"
              fill="url(#sage-leaf)"
              stroke="#526B5A"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
            <path d="M22 60 Q 45 45 68 38" stroke="#3F5547" strokeWidth="0.7" strokeOpacity="0.5" />
            <path
              d="M50 15 C 65 30, 85 20, 95 10 C 85 2, 60 5, 50 15 Z"
              fill="url(#sage-leaf)"
              opacity="0.8"
            />
            <path
              d="M8 85 C 25 80, 45 95, 40 115 C 25 110, 10 100, 8 85 Z"
              fill="url(#sage-leaf)"
              opacity="0.75"
            />

            {/* Gold Filigree Tendril */}
            <path
              d="M5 25 Q 40 15 65 35 T 100 45 Q 120 45 135 60"
              stroke="#C5A059"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="1.5 2"
              fill="none"
              opacity="0.7"
            />
            <circle cx="135" cy="60" r="2" fill="#C5A059" opacity="0.9" />

            {/* Hydrangea Cluster 1 */}
            <g transform="translate(32, 28)">
              {/* 4-petaled florets */}
              <ellipse cx="0" cy="-7" rx="6" ry="8" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="0" cy="7" rx="6" ry="8" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="-7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-1)" />
              <circle cx="0" cy="0" r="2.5" fill="url(#gold-shimmer)" />
            </g>

            {/* Hydrangea Cluster 2 */}
            <g transform="translate(52, 42) scale(0.85)">
              <ellipse cx="0" cy="-7" rx="6" ry="8" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="0" cy="7" rx="6" ry="8" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="-7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-2)" />
              <circle cx="0" cy="0" r="2.5" fill="url(#gold-shimmer)" />
            </g>

            {/* Hydrangea Cluster 3 */}
            <g transform="translate(20, 48) scale(0.75)">
              <ellipse cx="0" cy="-7" rx="6" ry="8" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="0" cy="7" rx="6" ry="8" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="-7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-1)" />
              <circle cx="0" cy="0" r="2" fill="url(#gold-shimmer)" />
            </g>

            {/* Cascading Wisteria Garland Hanging Down */}
            <g transform="translate(18, 55)">
              <path d="M5 0 Q 8 30 12 60 Q 15 90 20 110" stroke="#7B9BB5" strokeWidth="0.8" fill="none" opacity="0.6" />
              {/* Teardrop wisteria petals */}
              <path d="M3 15 Q 10 22 5 28 Q 0 22 3 15 Z" fill="url(#wisteria-gradient)" />
              <path d="M8 26 Q 16 34 11 40 Q 4 34 8 26 Z" fill="url(#wisteria-gradient)" />
              <path d="M4 38 Q 12 47 7 53 Q -1 47 4 38 Z" fill="url(#wisteria-gradient)" />
              <path d="M9 50 Q 17 60 11 66 Q 3 60 9 50 Z" fill="url(#wisteria-gradient)" />
              <path d="M6 64 Q 13 74 8 80 Q 1 74 6 64 Z" fill="url(#wisteria-gradient)" opacity="0.85" />
              <path d="M10 78 Q 16 88 11 93 Q 5 88 10 78 Z" fill="url(#wisteria-gradient)" opacity="0.75" />
              <path d="M12 92 Q 17 100 13 105 Q 8 100 12 92 Z" fill="url(#wisteria-gradient)" opacity="0.6" />
            </g>

            {/* Second Wisteria Strand */}
            <g transform="translate(42, 50) scale(0.8)">
              <path d="M5 0 Q 10 25 15 50 Q 20 75 22 95" stroke="#7B9BB5" strokeWidth="0.8" fill="none" opacity="0.5" />
              <path d="M5 12 Q 13 20 8 26 Q 1 20 5 12 Z" fill="url(#wisteria-gradient)" />
              <path d="M9 25 Q 17 34 11 40 Q 3 34 9 25 Z" fill="url(#wisteria-gradient)" />
              <path d="M7 40 Q 15 50 9 56 Q 1 50 7 40 Z" fill="url(#wisteria-gradient)" />
              <path d="M11 54 Q 18 64 12 70 Q 5 64 11 54 Z" fill="url(#wisteria-gradient)" opacity="0.8" />
              <path d="M13 70 Q 19 80 14 85 Q 8 80 13 70 Z" fill="url(#wisteria-gradient)" opacity="0.65" />
            </g>
          </svg>

          {/* Top-Right Cluster: Mirrored Wisteria & Hydrangea */}
          <svg
            className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 text-[#3A5A74] -scale-x-100"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Sage Botanical Leaves */}
            <path
              d="M15 65 C 20 40, 50 25, 75 35 C 60 55, 35 70, 15 65 Z"
              fill="url(#sage-leaf)"
              stroke="#526B5A"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
            <path d="M22 60 Q 45 45 68 38" stroke="#3F5547" strokeWidth="0.7" strokeOpacity="0.5" />
            <path
              d="M50 15 C 65 30, 85 20, 95 10 C 85 2, 60 5, 50 15 Z"
              fill="url(#sage-leaf)"
              opacity="0.8"
            />

            {/* Gold Filigree Tendril */}
            <path
              d="M5 25 Q 40 15 65 35 T 100 45 Q 120 45 135 60"
              stroke="#C5A059"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="1.5 2"
              fill="none"
              opacity="0.7"
            />
            <circle cx="135" cy="60" r="2" fill="#C5A059" opacity="0.9" />

            {/* Hydrangea Cluster 1 */}
            <g transform="translate(32, 28)">
              <ellipse cx="0" cy="-7" rx="6" ry="8" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="0" cy="7" rx="6" ry="8" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="-7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-1)" />
              <circle cx="0" cy="0" r="2.5" fill="url(#gold-shimmer)" />
            </g>

            {/* Hydrangea Cluster 2 */}
            <g transform="translate(52, 42) scale(0.85)">
              <ellipse cx="0" cy="-7" rx="6" ry="8" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="0" cy="7" rx="6" ry="8" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="-7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="7" cy="0" rx="8" ry="6" fill="url(#hydrangea-petal-2)" />
              <circle cx="0" cy="0" r="2.5" fill="url(#gold-shimmer)" />
            </g>

            {/* Cascading Wisteria */}
            <g transform="translate(18, 55)">
              <path d="M5 0 Q 8 30 12 60 Q 15 90 20 110" stroke="#7B9BB5" strokeWidth="0.8" fill="none" opacity="0.6" />
              <path d="M3 15 Q 10 22 5 28 Q 0 22 3 15 Z" fill="url(#wisteria-gradient)" />
              <path d="M8 26 Q 16 34 11 40 Q 4 34 8 26 Z" fill="url(#wisteria-gradient)" />
              <path d="M4 38 Q 12 47 7 53 Q -1 47 4 38 Z" fill="url(#wisteria-gradient)" />
              <path d="M9 50 Q 17 60 11 66 Q 3 60 9 50 Z" fill="url(#wisteria-gradient)" />
              <path d="M6 64 Q 13 74 8 80 Q 1 74 6 64 Z" fill="url(#wisteria-gradient)" opacity="0.85" />
            </g>
          </svg>

          {/* Bottom-Left & Bottom-Right Sprigs */}
          <svg
            className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 text-[#3A5A74] -scale-y-100"
            viewBox="0 0 140 140"
            fill="none"
          >
            <path d="M10 50 C 15 30, 40 15, 60 25 C 45 40, 25 55, 10 50 Z" fill="url(#sage-leaf)" opacity="0.7" />
            <g transform="translate(25, 25) scale(0.7)">
              <ellipse cx="0" cy="-6" rx="5" ry="7" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="0" cy="6" rx="5" ry="7" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="-6" cy="0" rx="7" ry="5" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="6" cy="0" rx="7" ry="5" fill="url(#hydrangea-petal-1)" />
              <circle cx="0" cy="0" r="2" fill="url(#gold-shimmer)" />
            </g>
          </svg>

          <svg
            className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 text-[#3A5A74] -scale-x-100 -scale-y-100"
            viewBox="0 0 140 140"
            fill="none"
          >
            <path d="M10 50 C 15 30, 40 15, 60 25 C 45 40, 25 55, 10 50 Z" fill="url(#sage-leaf)" opacity="0.7" />
            <g transform="translate(25, 25) scale(0.7)">
              <ellipse cx="0" cy="-6" rx="5" ry="7" fill="url(#hydrangea-petal-1)" />
              <ellipse cx="0" cy="6" rx="5" ry="7" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="-6" cy="0" rx="7" ry="5" fill="url(#hydrangea-petal-2)" />
              <ellipse cx="6" cy="0" rx="7" ry="5" fill="url(#hydrangea-petal-1)" />
              <circle cx="0" cy="0" r="2" fill="url(#gold-shimmer)" />
            </g>
          </svg>

          {/* Top Center Delicate Garland Flourish */}
          <div className="absolute top-2 inset-x-0 flex items-center justify-center space-x-2 pointer-events-none opacity-80">
            <span className="text-[#C5A059] text-xs font-serif select-none">❦</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.3em] text-[#3A5A74]/70">
              • French Chateau Hydrangea Suite •
            </span>
            <span className="text-[#C5A059] text-xs font-serif select-none">❦</span>
          </div>
        </>
      )}

      {/* VARIATION 2: CHATEAU GARDEN ROSE & OLIVE SPRIGS */}
      {variation === 'chateau-rose' && (
        <>
          <svg
            className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#3A5A74]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="rose-petal-outer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C4D7E6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#7B9BB5" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="rose-petal-inner" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3A5A74" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#243C50" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="olive-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A8BCAE" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#5B7664" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Olive Branch Stem */}
            <path
              d="M10 80 Q 40 50 70 30 T 130 15"
              stroke="#5B7664"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.75"
            />
            {/* Olive Leaves along stem */}
            <path d="M25 65 Q 15 45 35 48 Q 40 60 25 65 Z" fill="url(#olive-leaf)" />
            <path d="M45 50 Q 40 30 60 35 Q 60 48 45 50 Z" fill="url(#olive-leaf)" />
            <path d="M72 32 Q 75 12 92 20 Q 88 32 72 32 Z" fill="url(#olive-leaf)" />
            <path d="M105 20 Q 115 5 130 14 Q 122 25 105 20 Z" fill="url(#olive-leaf)" />

            {/* Chateau Vintage Corner Filigree Scroll */}
            <path
              d="M12 12 L 50 12 Q 25 25 12 50 Z"
              fill="#C5A059"
              fillOpacity="0.18"
              stroke="#C5A059"
              strokeWidth="0.8"
            />
            <circle cx="16" cy="16" r="3" fill="#C5A059" opacity="0.8" />

            {/* English Tea Rose (Watercolor layered petals) */}
            <g transform="translate(48, 48)">
              {/* Outer Petals */}
              <circle cx="0" cy="0" r="22" fill="url(#rose-petal-outer)" opacity="0.85" />
              <path
                d="M -16 -8 C -22 -20, 5 -25, 14 -12 C 22 2, 8 20, -6 18 C -20 16, -10 4, -16 -8 Z"
                fill="#8CAECA"
                opacity="0.7"
              />
              {/* Mid Layer Petals */}
              <path
                d="M -10 -4 C -15 -14, 8 -16, 12 -6 C 16 4, 4 14, -4 12 C -12 10, -5 2, -10 -4 Z"
                fill="#547B9A"
                opacity="0.85"
              />
              {/* Inner Rose Core */}
              <ellipse cx="0" cy="-2" rx="7" ry="5" fill="url(#rose-petal-inner)" />
              <path
                d="M -3 -3 Q 0 -6 3 -3 Q 0 0 -3 -3"
                stroke="#C5A059"
                strokeWidth="1.2"
                fill="none"
                opacity="0.9"
              />
              <circle cx="0" cy="-2" r="1.5" fill="#E8CF9A" />
            </g>

            {/* Accompanying Small Rosebud */}
            <g transform="translate(85, 26) scale(0.6)">
              <ellipse cx="0" cy="0" rx="12" ry="15" fill="url(#rose-petal-outer)" />
              <ellipse cx="0" cy="0" rx="7" ry="10" fill="url(#rose-petal-inner)" />
              <path d="M-3 10 Q 0 18 3 10" stroke="#5B7664" strokeWidth="2" />
            </g>
          </svg>

          {/* Top-Right Mirrored Rose Cluster */}
          <svg
            className="absolute top-0 right-0 w-36 h-36 sm:w-48 sm:h-48 text-[#3A5A74] -scale-x-100"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 80 Q 40 50 70 30 T 130 15"
              stroke="#5B7664"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path d="M25 65 Q 15 45 35 48 Q 40 60 25 65 Z" fill="url(#olive-leaf)" />
            <path d="M45 50 Q 40 30 60 35 Q 60 48 45 50 Z" fill="url(#olive-leaf)" />
            <path d="M72 32 Q 75 12 92 20 Q 88 32 72 32 Z" fill="url(#olive-leaf)" />

            <path
              d="M12 12 L 50 12 Q 25 25 12 50 Z"
              fill="#C5A059"
              fillOpacity="0.18"
              stroke="#C5A059"
              strokeWidth="0.8"
            />
            <circle cx="16" cy="16" r="3" fill="#C5A059" opacity="0.8" />

            <g transform="translate(48, 48)">
              <circle cx="0" cy="0" r="22" fill="url(#rose-petal-outer)" opacity="0.85" />
              <path
                d="M -10 -4 C -15 -14, 8 -16, 12 -6 C 16 4, 4 14, -4 12 C -12 10, -5 2, -10 -4 Z"
                fill="#547B9A"
                opacity="0.85"
              />
              <ellipse cx="0" cy="-2" rx="7" ry="5" fill="url(#rose-petal-inner)" />
              <circle cx="0" cy="-2" r="1.5" fill="#E8CF9A" />
            </g>
          </svg>

          {/* Bottom Rose & Olive Accents */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-80">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C5A059]/60" />
            <span className="text-[#3A5A74] text-xs font-serif">❦ Chateau Garden Rose & Olive ❦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C5A059]/60" />
          </div>
        </>
      )}

      {/* VARIATION 3: ETHEREAL BOTANICAL SPRAY & GOLD FILIGREE CREST */}
      {variation === 'ethereal-botanical' && (
        <>
          {/* Symmetrical Top Arched Floral Garland */}
          <svg
            className="absolute top-0 inset-x-0 w-full h-20 sm:h-24 pointer-events-none"
            viewBox="0 0 800 90"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="crest-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3A5A74" stopOpacity="0" />
                <stop offset="35%" stopColor="#557B9A" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#243C50" stopOpacity="1" />
                <stop offset="65%" stopColor="#557B9A" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3A5A74" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gold Filigree Arch Line */}
            <path
              d="M 50 18 Q 400 42 750 18"
              stroke="#C5A059"
              strokeWidth="1"
              strokeDasharray="2 3"
              fill="none"
              opacity="0.85"
            />
            <path
              d="M 100 24 Q 400 48 700 24"
              stroke="#3A5A74"
              strokeWidth="0.6"
              fill="none"
              opacity="0.4"
            />

            {/* Central Heirloom Botanical Crest */}
            <g transform="translate(400, 38)">
              <circle cx="0" cy="0" r="14" fill="#EBF2F7" stroke="#C5A059" strokeWidth="1" />
              <text x="0" y="5" textAnchor="middle" fill="#3A5A74" fontSize="13" fontFamily="serif">❦</text>
              {/* Radiating forget-me-not florets */}
              <circle cx="-25" cy="-2" r="3.5" fill="#6B8EA8" />
              <circle cx="-25" cy="-2" r="1" fill="#DFC896" />
              <circle cx="25" cy="-2" r="3.5" fill="#6B8EA8" />
              <circle cx="25" cy="-2" r="1" fill="#DFC896" />
              <circle cx="-42" cy="-6" r="2.5" fill="#84A7C2" opacity="0.8" />
              <circle cx="42" cy="-6" r="2.5" fill="#84A7C2" opacity="0.8" />
            </g>
          </svg>

          {/* 4 Corner Botanical Sprays (Forget-me-nots & Gold vines) */}
          <svg
            className="absolute top-0 left-0 w-28 h-28 sm:w-36 sm:h-36 text-[#3A5A74]"
            viewBox="0 0 120 120"
            fill="none"
          >
            {/* Corner Gold Knot */}
            <path
              d="M 12 45 L 12 12 L 45 12"
              stroke="#C5A059"
              strokeWidth="1.5"
              fill="none"
              opacity="0.8"
            />
            <circle cx="12" cy="12" r="2.5" fill="#C5A059" />

            {/* Botanical Leaf Sprays */}
            <path d="M 20 40 Q 40 30 65 35" stroke="#6F8877" strokeWidth="1" fill="none" opacity="0.7" />
            <ellipse cx="35" cy="31" rx="6" ry="3" transform="rotate(-20 35 31)" fill="#8FA998" opacity="0.8" />
            <ellipse cx="50" cy="31" rx="6" ry="3" transform="rotate(20 50 31)" fill="#8FA998" opacity="0.8" />

            {/* Forget-Me-Not Flowers (5-petaled soft blue) */}
            <g transform="translate(30, 20) scale(0.9)">
              {[0, 72, 144, 216, 288].map((angle, idx) => (
                <circle
                  key={idx}
                  cx={Math.cos((angle * Math.PI) / 180) * 4}
                  cy={Math.sin((angle * Math.PI) / 180) * 4}
                  r="2.8"
                  fill="#547B9A"
                  opacity="0.9"
                />
              ))}
              <circle cx="0" cy="0" r="1.5" fill="#F0DCAC" />
            </g>

            <g transform="translate(20, 32) scale(0.75)">
              {[0, 72, 144, 216, 288].map((angle, idx) => (
                <circle
                  key={idx}
                  cx={Math.cos((angle * Math.PI) / 180) * 4}
                  cy={Math.sin((angle * Math.PI) / 180) * 4}
                  r="2.8"
                  fill="#7A9EB8"
                  opacity="0.85"
                />
              ))}
              <circle cx="0" cy="0" r="1.5" fill="#F0DCAC" />
            </g>
          </svg>

          {/* Top-Right Corner */}
          <svg
            className="absolute top-0 right-0 w-28 h-28 sm:w-36 sm:h-36 text-[#3A5A74] -scale-x-100"
            viewBox="0 0 120 120"
            fill="none"
          >
            <path
              d="M 12 45 L 12 12 L 45 12"
              stroke="#C5A059"
              strokeWidth="1.5"
              fill="none"
              opacity="0.8"
            />
            <circle cx="12" cy="12" r="2.5" fill="#C5A059" />
            <path d="M 20 40 Q 40 30 65 35" stroke="#6F8877" strokeWidth="1" fill="none" opacity="0.7" />
            <ellipse cx="35" cy="31" rx="6" ry="3" transform="rotate(-20 35 31)" fill="#8FA998" opacity="0.8" />
            <g transform="translate(30, 20) scale(0.9)">
              {[0, 72, 144, 216, 288].map((angle, idx) => (
                <circle
                  key={idx}
                  cx={Math.cos((angle * Math.PI) / 180) * 4}
                  cy={Math.sin((angle * Math.PI) / 180) * 4}
                  r="2.8"
                  fill="#547B9A"
                  opacity="0.9"
                />
              ))}
              <circle cx="0" cy="0" r="1.5" fill="#F0DCAC" />
            </g>
          </svg>

          {/* Bottom Laurel Arc */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-85">
            <span className="text-[#C5A059] text-xs font-serif select-none">⚜</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-[#3A5A74]/80">
              Ethereal Botanical Filigree Crest
            </span>
            <span className="text-[#C5A059] text-xs font-serif select-none">⚜</span>
          </div>
        </>
      )}

      {/* VARIATION 4: FRENCH ANEMONE & SILVER DOLLAR EUCALYPTUS */}
      {variation === 'anemone-eucalyptus' && (
        <>
          {/* Top-Left Cluster: French Anemone & Rounded Eucalyptus Discs */}
          <svg
            className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#3A5A74]"
            viewBox="0 0 190 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="anemone-petal-a" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C2D6E7" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#81A5C1" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#4A7191" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="anemone-petal-b" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#DEECF7" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#9AB8D2" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#5E83A1" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="eucalyptus-disc-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BDD2C6" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#6C8D7A" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="eucalyptus-disc-2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CFDFD5" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#86A392" stopOpacity="0.85" />
              </linearGradient>
              <radialGradient id="anemone-eye-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E3141" stopOpacity="1" />
                <stop offset="75%" stopColor="#12202C" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#284459" stopOpacity="0.9" />
              </radialGradient>
            </defs>

            {/* Eucalyptus Branch Stems */}
            <path
              d="M 10 95 Q 35 70 70 50 T 130 35 T 175 30"
              stroke="#547160"
              strokeWidth="1.2"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 45 65 Q 25 40 18 15"
              stroke="#547160"
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 90 45 Q 95 20 85 5"
              stroke="#547160"
              strokeWidth="0.8"
              fill="none"
              opacity="0.55"
            />

            {/* Silver Dollar Eucalyptus Rounded Leaves */}
            <circle cx="18" cy="22" r="14" fill="url(#eucalyptus-disc-2)" opacity="0.85" />
            <circle cx="18" cy="22" r="14" stroke="#526E5D" strokeWidth="0.5" opacity="0.4" fill="none" />
            
            <circle cx="38" cy="46" r="16" fill="url(#eucalyptus-disc-1)" opacity="0.85" />
            <circle cx="38" cy="46" r="16" stroke="#526E5D" strokeWidth="0.5" opacity="0.4" fill="none" />

            <circle cx="75" cy="35" r="15" fill="url(#eucalyptus-disc-2)" opacity="0.8" />
            <circle cx="75" cy="35" r="15" stroke="#526E5D" strokeWidth="0.5" opacity="0.4" fill="none" />

            <circle cx="115" cy="28" r="13" fill="url(#eucalyptus-disc-1)" opacity="0.8" />
            <circle cx="150" cy="24" r="11" fill="url(#eucalyptus-disc-2)" opacity="0.75" />
            <circle cx="172" cy="28" r="8" fill="url(#eucalyptus-disc-1)" opacity="0.7" />

            {/* Gold Tendril & Stardust Sprinkles */}
            <path
              d="M 5 35 Q 20 20 50 25 T 100 20 T 140 15"
              stroke="#C5A059"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 3"
              opacity="0.75"
            />
            <circle cx="140" cy="15" r="2" fill="#C5A059" opacity="0.9" />
            <circle cx="100" cy="20" r="1.5" fill="#C5A059" opacity="0.8" />
            <circle cx="50" cy="25" r="1.5" fill="#C5A059" opacity="0.8" />

            {/* Main French Anemone Blossom (Bottom of Corner Cluster) */}
            <g transform="translate(68, 76)">
              {/* Petal Layer 1 (Outer soft rounded petals) */}
              <ellipse cx="-22" cy="0" rx="20" ry="14" transform="rotate(-15 -22 0)" fill="url(#anemone-petal-a)" />
              <ellipse cx="22" cy="0" rx="20" ry="14" transform="rotate(15 22 0)" fill="url(#anemone-petal-a)" />
              <ellipse cx="0" cy="-22" rx="14" ry="20" transform="rotate(-5 0 -22)" fill="url(#anemone-petal-b)" />
              <ellipse cx="0" cy="22" rx="14" ry="20" transform="rotate(5 0 22)" fill="url(#anemone-petal-b)" />
              <ellipse cx="-16" cy="-16" rx="18" ry="14" transform="rotate(45 -16 -16)" fill="url(#anemone-petal-a)" />
              <ellipse cx="16" cy="16" rx="18" ry="14" transform="rotate(45 16 16)" fill="url(#anemone-petal-a)" />
              <ellipse cx="16" cy="-16" rx="18" ry="14" transform="rotate(-45 16 -16)" fill="url(#anemone-petal-b)" />
              <ellipse cx="-16" cy="16" rx="18" ry="14" transform="rotate(-45 -16 16)" fill="url(#anemone-petal-b)" />

              {/* Anemone Deep Indigo Center Eye */}
              <circle cx="0" cy="0" r="12" fill="url(#anemone-eye-grad)" />
              
              {/* Radiating Stamens with Golden Tips */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const x1 = Math.cos(rad) * 11;
                const y1 = Math.sin(rad) * 11;
                const x2 = Math.cos(rad) * 16;
                const y2 = Math.sin(rad) * 16;
                return (
                  <g key={deg}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1A2B38" strokeWidth="0.8" opacity="0.9" />
                    <circle cx={x2} cy={y2} r="1.3" fill="#D9BA6A" />
                  </g>
                );
              })}
              <circle cx="0" cy="0" r="4.5" fill="#314B5F" opacity="0.9" />
            </g>

            {/* Small Anemone Bud Blossom */}
            <g transform="translate(132, 58) scale(0.62)">
              <circle cx="0" cy="0" r="16" fill="url(#anemone-petal-b)" opacity="0.9" />
              <ellipse cx="-7" cy="-5" rx="12" ry="9" fill="url(#anemone-petal-a)" opacity="0.9" />
              <circle cx="2" cy="1" r="6.5" fill="url(#anemone-eye-grad)" />
              {[0, 60, 120, 180, 240, 300].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <circle
                    key={deg}
                    cx={2 + Math.cos(rad) * 9}
                    cy={1 + Math.sin(rad) * 9}
                    r="1.2"
                    fill="#D9BA6A"
                  />
                );
              })}
            </g>
          </svg>

          {/* Top-Right Cluster: Trailing Eucalyptus & Anemone Blossom */}
          <svg
            className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 text-[#3A5A74] -scale-x-100"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 12 80 Q 30 55 65 40 T 120 28 T 160 22"
              stroke="#547160"
              strokeWidth="1.1"
              fill="none"
              opacity="0.65"
            />
            <circle cx="20" cy="30" r="13" fill="#BDD2C6" opacity="0.85" />
            <circle cx="45" cy="45" r="15" fill="#CFDFD5" opacity="0.85" />
            <circle cx="85" cy="32" r="14" fill="#BDD2C6" opacity="0.8" />
            <circle cx="125" cy="26" r="11" fill="#CFDFD5" opacity="0.75" />

            <path
              d="M 5 25 Q 35 15 75 20 T 130 15"
              stroke="#C5A059"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 3"
              opacity="0.7"
            />
            <circle cx="130" cy="15" r="2" fill="#C5A059" opacity="0.85" />

            <g transform="translate(60, 68) scale(0.85)">
              <ellipse cx="-18" cy="0" rx="18" ry="12" fill="#81A5C1" opacity="0.85" />
              <ellipse cx="18" cy="0" rx="18" ry="12" fill="#81A5C1" opacity="0.85" />
              <ellipse cx="0" cy="-18" rx="12" ry="18" fill="#9AB8D2" opacity="0.9" />
              <ellipse cx="0" cy="18" rx="12" ry="18" fill="#9AB8D2" opacity="0.9" />
              <ellipse cx="-13" cy="-13" rx="15" ry="11" transform="rotate(45 -13 -13)" fill="#81A5C1" />
              <ellipse cx="13" cy="13" rx="15" ry="11" transform="rotate(45 13 13)" fill="#81A5C1" />
              <circle cx="0" cy="0" r="10" fill="#1E3141" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <circle
                    key={deg}
                    cx={Math.cos(rad) * 14}
                    cy={Math.sin(rad) * 14}
                    r="1.2"
                    fill="#D9BA6A"
                  />
                );
              })}
            </g>
          </svg>

          {/* Bottom Accent Ribbon */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-85">
            <span className="text-[#C5A059] text-xs font-serif select-none">❧</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.22em] text-[#3A5A74]/80">
              French Anemone & Silver Dollar Eucalyptus
            </span>
            <span className="text-[#C5A059] text-xs font-serif select-none">❧</span>
          </div>
        </>
      )}

      {/* VARIATION 5: MEADOW DELPHINIUM & BLUEBELL GARLAND */}
      {variation === 'wildflower-delphinium' && (
        <>
          {/* Top-Left Cluster: Spire Delphiniums, Hanging Bluebells & Meadow Grass */}
          <svg
            className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#3A5A74]"
            viewBox="0 0 190 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="delph-petal-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#89ACCA" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3C6485" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="delph-petal-2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B3CDDF" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#5D85A5" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="bluebell-petal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A8C5DE" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#678FAة" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3C6485" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="meadow-foliage" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B4C7B8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#67846F" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Feathery Meadow Foliage & Stems */}
            <path
              d="M 12 110 Q 30 70 50 40 T 80 15"
              stroke="#53725C"
              strokeWidth="1.2"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 28 85 Q 45 65 75 55 T 135 30 T 170 18"
              stroke="#53725C"
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
            
            {/* Feathery leaves */}
            <path d="M 20 80 Q 10 65 15 50" stroke="#6C8A74" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M 36 60 Q 30 45 42 35" stroke="#6C8A74" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M 52 42 Q 62 28 72 25" stroke="#6C8A74" strokeWidth="1" fill="none" opacity="0.6" />

            {/* Golden Dew Trails */}
            <path
              d="M 8 30 Q 30 15 65 25 T 120 15 T 160 12"
              stroke="#C5A059"
              strokeWidth="1"
              fill="none"
              strokeDasharray="1.5 2.5"
              opacity="0.75"
            />
            <circle cx="160" cy="12" r="2" fill="#C5A059" opacity="0.9" />
            <circle cx="120" cy="15" r="1.5" fill="#C5A059" opacity="0.8" />
            <circle cx="65" cy="25" r="1.5" fill="#C5A059" opacity="0.8" />

            {/* Spire Delphinium Florets along Stem (Vertical Ascension) */}
            <g transform="translate(48, 42) scale(0.9)">
              {/* Lower full floret */}
              <g transform="translate(0, 30)">
                {[0, 72, 144, 216, 288].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <circle
                      key={idx}
                      cx={Math.cos(rad) * 7.5}
                      cy={Math.sin(rad) * 7.5}
                      r="5.5"
                      fill="url(#delph-petal-1)"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="3.2" fill="#E8F1F7" opacity="0.95" />
                <circle cx="0" cy="0" r="1.5" fill="#C5A059" />
              </g>

              {/* Mid floret */}
              <g transform="translate(10, 10) scale(0.85)">
                {[0, 72, 144, 216, 288].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <circle
                      key={idx}
                      cx={Math.cos(rad) * 7}
                      cy={Math.sin(rad) * 7}
                      r="5"
                      fill="url(#delph-petal-2)"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="2.8" fill="#E8F1F7" opacity="0.9" />
                <circle cx="0" cy="0" r="1.2" fill="#C5A059" />
              </g>

              {/* Upper floret */}
              <g transform="translate(18, -10) scale(0.7)">
                {[0, 72, 144, 216, 288].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <circle
                      key={idx}
                      cx={Math.cos(rad) * 6}
                      cy={Math.sin(rad) * 6}
                      r="4.5"
                      fill="url(#delph-petal-1)"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="2.2" fill="#E8F1F7" opacity="0.9" />
                <circle cx="0" cy="0" r="1" fill="#C5A059" />
              </g>

              {/* Top bud */}
              <circle cx="24" cy="-24" r="3.8" fill="url(#delph-petal-2)" />
              <circle cx="28" cy="-32" r="2.8" fill="#A8C5DE" />
            </g>

            {/* Drooping Bell-Shaped Bluebells */}
            <g transform="translate(22, 60)">
              {/* Petiole */}
              <path d="M 0 0 Q -10 12 -6 24" stroke="#53725C" strokeWidth="1" fill="none" />
              {/* Bell 1 */}
              <path
                d="M -12 24 C -16 28 -14 36 -6 38 C 2 36 4 28 0 24 Z"
                fill="url(#delph-petal-1)"
                opacity="0.9"
              />
              <path d="M -9 38 L -6 41 L -3 38" stroke="#E8F1F7" strokeWidth="0.8" fill="none" opacity="0.85" />
            </g>

            <g transform="translate(95, 36) scale(0.85)">
              <path d="M 0 0 Q -8 10 -4 20" stroke="#53725C" strokeWidth="1" fill="none" />
              <path
                d="M -9 20 C -13 24 -11 31 -4 32 C 3 31 5 24 1 20 Z"
                fill="url(#delph-petal-2)"
                opacity="0.9"
              />
              <path d="M -7 32 L -4 35 L -1 32" stroke="#E8F1F7" strokeWidth="0.8" fill="none" opacity="0.85" />
            </g>
          </svg>

          {/* Top-Right Cluster: Mirrored Spire Delphiniums */}
          <svg
            className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 text-[#3A5A74] -scale-x-100"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 12 90 Q 30 60 55 35 T 95 18 T 150 12"
              stroke="#53725C"
              strokeWidth="1.1"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 5 25 Q 35 15 75 22 T 130 12"
              stroke="#C5A059"
              strokeWidth="1"
              fill="none"
              strokeDasharray="1.5 2.5"
              opacity="0.75"
            />
            <circle cx="130" cy="12" r="2" fill="#C5A059" opacity="0.85" />

            {/* Delphinium Florets */}
            <g transform="translate(50, 42) scale(0.85)">
              <g transform="translate(0, 25)">
                {[0, 72, 144, 216, 288].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <circle
                      key={idx}
                      cx={Math.cos(rad) * 7}
                      cy={Math.sin(rad) * 7}
                      r="5"
                      fill="#5D85A5"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="2.8" fill="#E8F1F7" opacity="0.9" />
                <circle cx="0" cy="0" r="1.2" fill="#C5A059" />
              </g>
              <g transform="translate(14, 0) scale(0.75)">
                {[0, 72, 144, 216, 288].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <circle
                      key={idx}
                      cx={Math.cos(rad) * 6}
                      cy={Math.sin(rad) * 6}
                      r="4.5"
                      fill="#89ACCA"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="2.2" fill="#E8F1F7" opacity="0.9" />
              </g>
              <circle cx="24" cy="-16" r="3.5" fill="#B3CDDF" />
            </g>

            {/* Drooping Bluebell */}
            <g transform="translate(20, 50)">
              <path d="M 0 0 Q -8 10 -4 20" stroke="#53725C" strokeWidth="1" fill="none" />
              <path
                d="M -9 20 C -13 24 -11 31 -4 32 C 3 31 5 24 1 20 Z"
                fill="#4A7191"
                opacity="0.9"
              />
            </g>
          </svg>

          {/* Bottom Accent Ribbon */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-85">
            <span className="text-[#C5A059] text-xs font-serif select-none">✦</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.22em] text-[#3A5A74]/80">
              Meadow Delphinium & Bluebell Garland
            </span>
            <span className="text-[#C5A059] text-xs font-serif select-none">✦</span>
          </div>
        </>
      )}
    </div>
  );
};
