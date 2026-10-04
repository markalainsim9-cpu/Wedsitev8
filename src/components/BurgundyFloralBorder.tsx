import React from 'react';
import { BurgundyFloralBorder as BurgundyFloralBorderType } from '../types';

interface BurgundyFloralBorderProps {
  variation?: BurgundyFloralBorderType;
  className?: string;
  showCardWash?: boolean;
  opacity?: number;
}

export const BurgundyFloralBorder: React.FC<BurgundyFloralBorderProps> = ({
  variation = 'velvet-rose-ranunculus',
  className = '',
  showCardWash = true,
  opacity = 0.95
}) => {
  if (variation === 'none') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl border border-[#D4A373]/40 ${className}`}
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(123, 30, 52, 0.1)'
        }}
      >
        <div className="absolute inset-2 sm:inset-3 border border-[#7B1E34]/25 rounded-xl sm:rounded-2xl flex items-center justify-between pointer-events-none p-1.5">
          <div className="w-1.5 h-1.5 bg-[#D4A373] rotate-45 opacity-60 m-1" />
          <div className="w-1.5 h-1.5 bg-[#D4A373] rotate-45 opacity-60 m-1" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
      style={{ opacity }}
    >
      {/* Atmospheric Watercolor Wash Vignette */}
      {showCardWash && (
        <div
          className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              variation === 'velvet-rose-ranunculus'
                ? 'radial-gradient(circle at 12% 12%, rgba(245, 229, 232, 0.45) 0%, transparent 45%), radial-gradient(circle at 88% 10%, rgba(251, 244, 236, 0.4) 0%, transparent 42%), radial-gradient(circle at 50% 98%, rgba(248, 234, 236, 0.38) 0%, transparent 48%)'
                : variation === 'baroque-pomegranate-flora'
                ? 'radial-gradient(circle at 10% 10%, rgba(240, 218, 223, 0.5) 0%, transparent 48%), radial-gradient(circle at 90% 15%, rgba(248, 238, 225, 0.45) 0%, transparent 44%), radial-gradient(circle at 50% 95%, rgba(245, 225, 229, 0.4) 0%, transparent 50%)'
                : variation === 'candlelit-peony-ivy'
                ? 'radial-gradient(circle at 15% 12%, rgba(247, 232, 235, 0.48) 0%, transparent 45%), radial-gradient(circle at 85% 12%, rgba(244, 235, 240, 0.42) 0%, transparent 42%), radial-gradient(circle at 50% 92%, rgba(253, 246, 238, 0.45) 0%, transparent 45%)'
                : variation === 'dahlia-black-calla'
                ? 'radial-gradient(circle at 10% 14%, rgba(242, 226, 232, 0.46) 0%, transparent 46%), radial-gradient(circle at 90% 8%, rgba(235, 242, 236, 0.38) 0%, transparent 42%), radial-gradient(circle at 50% 98%, rgba(247, 233, 237, 0.4) 0%, transparent 48%)'
                : 'radial-gradient(circle at 50% 5%, rgba(245, 229, 232, 0.4) 0%, transparent 45%)'
          }}
        />
      )}

      {/* Double-rule stationery inner line with warm rose-gold filigree */}
      <div className="absolute inset-3 sm:inset-4 border border-[#D4A373]/35 rounded-2xl pointer-events-none" />
      <div className="absolute inset-4 sm:inset-5 border border-[#7B1E34]/15 rounded-xl pointer-events-none" />

      {/* VARIATION 1: VELVET ENGLISH ROSE & RANUNCULUS */}
      {variation === 'velvet-rose-ranunculus' && (
        <>
          {/* Top-Left Cluster: Multi-petal Damask Rose, Spiraled Ranunculus & Gilded Veins */}
          <svg
            className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#7B1E34]"
            viewBox="0 0 190 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="rose-velvet-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9E2A44" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#7B1E34" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#4A0E1A" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="rose-petal-inner" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C45A6D" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#8C2138" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#541221" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="ranunculus-curl" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DF7B8D" stopOpacity="0.92" />
                <stop offset="50%" stopColor="#A8324A" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#691628" stopOpacity="0.96" />
              </linearGradient>
              <linearGradient id="burgundy-foliage" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#869988" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#4D6051" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2E3D31" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="rose-gold-foil" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5D8BA" stopOpacity="1" />
                <stop offset="50%" stopColor="#D4A373" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#9F6D3F" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Botanical Foliage & Gilded Sprigs */}
            <path
              d="M 10 95 Q 35 65 75 48 T 135 32 T 175 24"
              stroke="#4D6051"
              strokeWidth="1.2"
              fill="none"
              opacity="0.65"
            />
            {/* Deep Green Rose Leaves */}
            <path
              d="M 28 82 C 14 74 12 55 24 45 C 38 52 40 70 28 82 Z"
              fill="url(#burgundy-foliage)"
              opacity="0.85"
            />
            <path
              d="M 24 45 Q 26 64 28 82"
              stroke="url(#rose-gold-foil)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.8"
            />

            <path
              d="M 85 45 C 75 30 85 15 102 18 C 112 30 102 46 85 45 Z"
              fill="url(#burgundy-foliage)"
              opacity="0.8"
            />
            <path
              d="M 102 18 Q 93 32 85 45"
              stroke="url(#rose-gold-foil)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.75"
            />

            {/* Gilded Rose-Gold Tendrils & Stardust */}
            <path
              d="M 8 38 Q 28 20 62 26 T 120 20 T 160 14"
              stroke="#D4A373"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 3"
              opacity="0.75"
            />
            <circle cx="160" cy="14" r="2" fill="#D4A373" opacity="0.9" />
            <circle cx="120" cy="20" r="1.5" fill="#D4A373" opacity="0.85" />
            <circle cx="62" cy="26" r="1.5" fill="#D4A373" opacity="0.85" />

            {/* Main Velvet Cabbage Rose Blossom */}
            <g transform="translate(64, 76)">
              {/* Outer Velvet Petals Ring */}
              <path
                d="M -28 -10 C -36 5 -30 26 -12 32 C 8 36 32 26 36 6 C 38 -14 20 -30 0 -30 C -18 -30 -24 -22 -28 -10 Z"
                fill="url(#rose-velvet-dark)"
              />
              {/* Mid Layer Overlapping Petal Cups */}
              <path
                d="M -20 -6 C -28 4 -22 20 -8 24 C 6 27 24 19 26 4 C 27 -10 14 -22 0 -22 C -14 -22 -17 -15 -20 -6 Z"
                fill="url(#rose-petal-inner)"
                opacity="0.95"
              />
              {/* Rose Heart Swirls */}
              <ellipse cx="-4" cy="2" rx="14" ry="11" fill="url(#rose-velvet-dark)" />
              <path
                d="M -12 0 C -10 -8 4 -12 10 -4 C 14 2 10 10 0 10 C -8 10 -13 6 -12 0 Z"
                fill="url(#ranunculus-curl)"
                opacity="0.9"
              />
              <path
                d="M -6 1 C -4 -4 4 -6 7 -2 C 9 1 6 5 1 5 C -3 5 -5 4 -6 1 Z"
                fill="#F5E5E8"
                opacity="0.75"
              />
              {/* Gilded Dewdrop Sparkle */}
              <circle cx="12" cy="-6" r="1.3" fill="#D4A373" opacity="0.95" />
            </g>

            {/* Clustered Ranunculus Blossom */}
            <g transform="translate(126, 52) scale(0.72)">
              <circle cx="0" cy="0" r="22" fill="url(#ranunculus-curl)" />
              {/* Concentric Tight Petal Ripples */}
              <ellipse cx="0" cy="0" rx="17" ry="15" stroke="#F5E5E8" strokeWidth="0.8" fill="url(#rose-petal-inner)" opacity="0.9" />
              <ellipse cx="-1" cy="1" rx="12" ry="10" stroke="#F5E5E8" strokeWidth="0.7" fill="url(#rose-velvet-dark)" opacity="0.9" />
              <ellipse cx="-1" cy="1" rx="7" ry="6" stroke="#D4A373" strokeWidth="0.8" fill="#4A0E1A" />
              <circle cx="-1" cy="1" r="2.5" fill="#D4A373" opacity="0.95" />
            </g>

            {/* Delicate Blush Rosebud */}
            <g transform="translate(24, 30) scale(0.6)">
              <path
                d="M 0 16 C -8 10 -10 -4 0 -14 C 10 -4 8 10 0 16 Z"
                fill="url(#ranunculus-curl)"
              />
              <path
                d="M -4 14 C -12 8 -8 -2 -2 -8"
                stroke="#4D6051"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="0" cy="-6" r="1.5" fill="#F5E5E8" opacity="0.8" />
            </g>
          </svg>

          {/* Top-Right Cluster: Mirrored Damask Rose & Trailing Buds */}
          <svg
            className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 text-[#7B1E34] -scale-x-100"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 12 85 Q 32 58 68 42 T 125 28 T 160 20"
              stroke="#4D6051"
              strokeWidth="1.1"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 6 30 Q 35 18 75 22 T 130 15"
              stroke="#D4A373"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 3"
              opacity="0.75"
            />
            <circle cx="130" cy="15" r="2" fill="#D4A373" opacity="0.85" />

            {/* Rose Blossom */}
            <g transform="translate(60, 68) scale(0.85)">
              <circle cx="0" cy="0" r="26" fill="#7B1E34" opacity="0.95" />
              <ellipse cx="-2" cy="2" rx="20" ry="18" fill="#9E2A44" opacity="0.9" />
              <ellipse cx="-2" cy="2" rx="14" ry="12" fill="#C45A6D" opacity="0.9" />
              <ellipse cx="-2" cy="2" rx="8" ry="7" fill="#521221" />
              <circle cx="-2" cy="2" r="2.5" fill="#D4A373" />
            </g>

            {/* Foliage */}
            <path
              d="M 22 45 C 10 35 15 20 28 22 C 38 32 30 46 22 45 Z"
              fill="#4D6051"
              opacity="0.8"
            />
          </svg>

          {/* Bottom Accent Ribbon */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-85">
            <span className="text-[#D4A373] text-xs font-serif select-none">❧</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.22em] text-[#7B1E34]/85">
              Velvet English Rose & Ranunculus
            </span>
            <span className="text-[#D4A373] text-xs font-serif select-none">❧</span>
          </div>
        </>
      )}

      {/* VARIATION 2: BAROQUE POMEGRANATE & BLACK BACCARA */}
      {variation === 'baroque-pomegranate-flora' && (
        <>
          {/* Top-Left Cluster: Black Baccara Rose, Jewel Pomegranate & Baroque Gold Tendrils */}
          <svg
            className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#521221]"
            viewBox="0 0 190 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="baccara-petal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B1E34" stopOpacity="0.98" />
                <stop offset="60%" stopColor="#4A0E1A" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#25050C" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="pomegranate-rind" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B83A4F" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#8C2138" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#541221" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="pomegranate-arils" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F75A77" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#85162D" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="baroque-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F9E2C7" stopOpacity="1" />
                <stop offset="50%" stopColor="#D4A373" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#966133" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Baroque Gilded Flourish Tendril */}
            <path
              d="M 12 110 C 25 75 45 45 85 35 C 120 25 155 28 178 16"
              stroke="url(#baroque-gold)"
              strokeWidth="1.4"
              fill="none"
              opacity="0.8"
            />
            {/* Ornate Baroque Leaf Curls */}
            <path
              d="M 50 48 C 38 32 46 16 64 22 C 70 32 62 48 50 48 Z"
              fill="url(#baroque-gold)"
              opacity="0.85"
            />
            <path
              d="M 115 30 C 125 18 140 18 145 28 C 138 38 122 36 115 30 Z"
              fill="url(#baroque-gold)"
              opacity="0.8"
            />

            {/* Jeweled Ripe Pomegranate Slice */}
            <g transform="translate(132, 56) rotate(-15)">
              {/* Outer Rind Arc */}
              <path
                d="M -16 -12 C 4 -24 22 -14 26 4 C 28 18 16 28 0 26 C -14 24 -24 10 -22 -2 Z"
                fill="url(#pomegranate-rind)"
              />
              {/* Inner White Pith Cavity */}
              <path
                d="M -12 -6 C 2 -16 16 -8 20 4 C 22 14 12 22 0 20 C -10 18 -18 8 -16 0 Z"
                fill="#FAF0F2"
                opacity="0.9"
              />
              {/* Glistening Ruby Arils (Pomegranate Seeds) */}
              <ellipse cx="2" cy="0" rx="3.5" ry="4.5" fill="url(#pomegranate-arils)" />
              <ellipse cx="10" cy="5" rx="3.2" ry="4" fill="url(#pomegranate-arils)" />
              <ellipse cx="-4" cy="6" rx="3.5" ry="4.2" fill="url(#pomegranate-arils)" />
              <ellipse cx="4" cy="11" rx="3.2" ry="3.8" fill="url(#pomegranate-arils)" />
              <ellipse cx="6" cy="-6" rx="3" ry="3.8" fill="url(#pomegranate-arils)" />
              {/* Seed Facet Highlights */}
              <circle cx="3" cy="-1" r="0.8" fill="#FFFFFF" opacity="0.9" />
              <circle cx="11" cy="4" r="0.8" fill="#FFFFFF" opacity="0.9" />
              <circle cx="-3" cy="5" r="0.8" fill="#FFFFFF" opacity="0.9" />
              {/* Crown Sepals */}
              <path d="M 24 2 L 31 1 L 28 7 Z" fill="url(#pomegranate-rind)" />
              <path d="M 23 8 L 29 11 L 24 14 Z" fill="url(#pomegranate-rind)" />
            </g>

            {/* Main Black Baccara Rose Blossom */}
            <g transform="translate(68, 78)">
              {/* Darkest Outer Petals */}
              <ellipse cx="-20" cy="0" rx="18" ry="13" fill="url(#baccara-petal)" />
              <ellipse cx="20" cy="0" rx="18" ry="13" fill="url(#baccara-petal)" />
              <ellipse cx="0" cy="-20" rx="13" ry="18" fill="url(#baccara-petal)" />
              <ellipse cx="0" cy="20" rx="13" ry="18" fill="url(#baccara-petal)" />
              <ellipse cx="-15" cy="-15" rx="16" ry="13" transform="rotate(45 -15 -15)" fill="url(#baccara-petal)" />
              <ellipse cx="15" cy="15" rx="16" ry="13" transform="rotate(45 15 15)" fill="url(#baccara-petal)" />
              <ellipse cx="15" cy="-15" rx="16" ry="13" transform="rotate(-45 15 -15)" fill="url(#baccara-petal)" />
              <ellipse cx="-15" cy="15" rx="16" ry="13" transform="rotate(-45 -15 15)" fill="url(#baccara-petal)" />

              {/* Inner Velvet Rose Core */}
              <circle cx="0" cy="0" r="14" fill="#601122" />
              <path
                d="M -9 0 C -7 -7 3 -10 9 -3 C 12 2 8 9 -1 9 C -7 9 -11 6 -9 0 Z"
                fill="#9E2A44"
                opacity="0.95"
              />
              <ellipse cx="0" cy="0" rx="5" ry="4" fill="#2E070F" />
              <circle cx="0" cy="0" r="1.8" fill="#D4A373" />
            </g>

            {/* Dark Plum Botanical Leaf */}
            <path
              d="M 22 85 C 10 75 14 55 26 50 C 38 60 34 80 22 85 Z"
              fill="#3A1224"
              opacity="0.85"
            />
            <path d="M 26 50 Q 24 67 22 85" stroke="#D4A373" strokeWidth="0.8" opacity="0.6" fill="none" />
          </svg>

          {/* Top-Right Cluster: Mirrored Pomegranate on Branch */}
          <svg
            className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 text-[#521221] -scale-x-100"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 12 85 C 25 55 55 35 95 25 T 160 18"
              stroke="#D4A373"
              strokeWidth="1.2"
              fill="none"
              opacity="0.75"
            />
            <circle cx="160" cy="18" r="2" fill="#D4A373" opacity="0.85" />

            {/* Mini Whole Pomegranate */}
            <g transform="translate(115, 38)">
              <circle cx="0" cy="0" r="14" fill="#8C2138" />
              <circle cx="-2" cy="-2" r="10" fill="#B83A4F" opacity="0.8" />
              <path d="M 12 -4 L 18 -7 L 16 0 Z" fill="#541221" />
              <path d="M 13 2 L 18 5 L 14 8 Z" fill="#541221" />
              <circle cx="-4" cy="-4" r="2" fill="#F75A77" opacity="0.7" />
            </g>

            {/* Rose Blossom */}
            <g transform="translate(56, 68) scale(0.8)">
              <circle cx="0" cy="0" r="24" fill="#4A0E1A" />
              <ellipse cx="0" cy="0" rx="17" ry="15" fill="#7B1E34" opacity="0.9" />
              <ellipse cx="0" cy="0" rx="10" ry="8" fill="#9E2A44" />
              <circle cx="0" cy="0" r="2" fill="#D4A373" />
            </g>
          </svg>

          {/* Bottom Accent Ribbon */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-85">
            <span className="text-[#D4A373] text-xs font-serif select-none">✦</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.22em] text-[#7B1E34]/85">
              Baroque Pomegranate & Black Baccara
            </span>
            <span className="text-[#D4A373] text-xs font-serif select-none">✦</span>
          </div>
        </>
      )}

      {/* VARIATION 3: CANDLELIT BURGUNDY PEONY & ENGLISH IVY */}
      {variation === 'candlelit-peony-ivy' && (
        <>
          {/* Top-Left Cluster: Ruffled Merlot Peonies, English Ivy Trails & Stardust */}
          <svg
            className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#7B1E34]"
            viewBox="0 0 190 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="peony-merlot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A8324A" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#7B1E34" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#4A0E1A" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="peony-mauve-ruffle" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D97A8E" stopOpacity="0.92" />
                <stop offset="60%" stopColor="#8C2138" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#541221" stopOpacity="0.96" />
              </linearGradient>
              <linearGradient id="ivy-green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6C8570" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#304234" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Cascading English Ivy Vines */}
            <path
              d="M 8 115 Q 22 75 48 55 T 105 38 T 165 25"
              stroke="#304234"
              strokeWidth="1.3"
              fill="none"
              opacity="0.7"
            />
            {/* Ivy Heart-Shaped 3-Point Leaves */}
            {/* Ivy Leaf 1 */}
            <g transform="translate(18, 92) rotate(-20) scale(0.75)">
              <path
                d="M 0 -16 L 8 -4 L 16 4 L 4 12 L 0 8 L -4 12 L -16 4 L -8 -4 Z"
                fill="url(#ivy-green)"
                opacity="0.88"
              />
              <path d="M 0 -16 L 0 8" stroke="#D4A373" strokeWidth="0.7" opacity="0.65" />
            </g>
            {/* Ivy Leaf 2 */}
            <g transform="translate(36, 68) rotate(15) scale(0.8)">
              <path
                d="M 0 -16 L 8 -4 L 16 4 L 4 12 L 0 8 L -4 12 L -16 4 L -8 -4 Z"
                fill="url(#ivy-green)"
                opacity="0.88"
              />
              <path d="M 0 -16 L 0 8" stroke="#D4A373" strokeWidth="0.7" opacity="0.65" />
            </g>
            {/* Ivy Leaf 3 */}
            <g transform="translate(90, 42) rotate(-10) scale(0.7)">
              <path
                d="M 0 -16 L 8 -4 L 16 4 L 4 12 L 0 8 L -4 12 L -16 4 L -8 -4 Z"
                fill="url(#ivy-green)"
                opacity="0.85"
              />
            </g>
            {/* Ivy Leaf 4 */}
            <g transform="translate(142, 28) rotate(25) scale(0.6)">
              <path
                d="M 0 -16 L 8 -4 L 16 4 L 4 12 L 0 8 L -4 12 L -16 4 L -8 -4 Z"
                fill="url(#ivy-green)"
                opacity="0.8"
              />
            </g>

            {/* Candlelight Aura Glow Tendrils */}
            <path
              d="M 5 35 Q 28 15 65 24 T 125 18 T 168 12"
              stroke="#D4A373"
              strokeWidth="1"
              fill="none"
              strokeDasharray="1.5 2.5"
              opacity="0.75"
            />
            <circle cx="168" cy="12" r="2" fill="#D4A373" opacity="0.9" />
            <circle cx="125" cy="18" r="1.5" fill="#D4A373" opacity="0.85" />
            <circle cx="65" cy="24" r="1.5" fill="#D4A373" opacity="0.85" />

            {/* Large Billowing Merlot Tree Peony */}
            <g transform="translate(68, 76)">
              {/* Outer Ruffled Peony Petals */}
              <path
                d="M -32 -8 C -40 8 -32 28 -14 36 C 8 40 34 30 40 10 C 44 -12 24 -32 2 -34 C -18 -34 -26 -24 -32 -8 Z"
                fill="url(#peony-merlot)"
              />
              {/* Notched Ruffle Petal Edges */}
              <path
                d="M -24 -6 C -30 6 -24 22 -8 28 C 6 32 26 22 30 6 C 32 -10 16 -24 0 -26 C -14 -26 -20 -18 -24 -6 Z"
                fill="url(#peony-mauve-ruffle)"
                opacity="0.95"
              />
              {/* Inner Petal Swirls */}
              <ellipse cx="-2" cy="2" rx="16" ry="13" fill="url(#peony-merlot)" />
              <path
                d="M -10 2 C -8 -6 6 -10 12 -2 C 16 4 12 12 2 12 C -6 12 -12 8 -10 2 Z"
                fill="#C45A6D"
                opacity="0.9"
              />
              <circle cx="0" cy="2" r="5" fill="#4A0E1A" />
              {/* Golden Peony Stamens */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <circle
                    key={deg}
                    cx={Math.cos(rad) * 6.5}
                    cy={2 + Math.sin(rad) * 6.5}
                    r="1.2"
                    fill="#F2D399"
                  />
                );
              })}
            </g>

            {/* Secondary Mauve Peony Floret */}
            <g transform="translate(128, 54) scale(0.68)">
              <circle cx="0" cy="0" r="20" fill="url(#peony-mauve-ruffle)" />
              <ellipse cx="0" cy="0" rx="14" ry="12" fill="url(#peony-merlot)" opacity="0.9" />
              <circle cx="0" cy="0" r="4" fill="#4A0E1A" />
              <circle cx="0" cy="0" r="1.5" fill="#F2D399" />
            </g>
          </svg>

          {/* Top-Right Cluster: Mirrored Peony & Ivy Garland */}
          <svg
            className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 text-[#7B1E34] -scale-x-100"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 12 90 Q 28 60 58 40 T 115 28 T 160 18"
              stroke="#304234"
              strokeWidth="1.1"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 6 30 Q 35 18 75 22 T 130 15"
              stroke="#D4A373"
              strokeWidth="1"
              fill="none"
              strokeDasharray="1.5 2.5"
              opacity="0.75"
            />
            <circle cx="130" cy="15" r="2" fill="#D4A373" opacity="0.85" />

            {/* Peony Blossom */}
            <g transform="translate(60, 66) scale(0.82)">
              <circle cx="0" cy="0" r="25" fill="#7B1E34" opacity="0.95" />
              <ellipse cx="0" cy="0" rx="18" ry="16" fill="#A8324A" opacity="0.9" />
              <ellipse cx="0" cy="0" rx="11" ry="9" fill="#D97A8E" opacity="0.85" />
              <circle cx="0" cy="0" r="3" fill="#F2D399" />
            </g>

            {/* Trailing Ivy */}
            <g transform="translate(110, 30) scale(0.65)">
              <path
                d="M 0 -16 L 8 -4 L 16 4 L 4 12 L 0 8 L -4 12 L -16 4 L -8 -4 Z"
                fill="#304234"
                opacity="0.8"
              />
            </g>
          </svg>

          {/* Bottom Accent Ribbon */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-85">
            <span className="text-[#D4A373] text-xs font-serif select-none">❦</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.22em] text-[#7B1E34]/85">
              Candlelit Burgundy Peony & Trailing Ivy
            </span>
            <span className="text-[#D4A373] text-xs font-serif select-none">❦</span>
          </div>
        </>
      )}

      {/* VARIATION 4: BURGUNDY DAHLIA & WILD BLACKBERRY VINE */}
      {variation === 'dahlia-black-calla' && (
        <>
          {/* Top-Left Cluster: Geometric Petal Dahlia, Wild Blackberries & Bramble Tendrils */}
          <svg
            className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#7B1E34]"
            viewBox="0 0 190 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="dahlia-petal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9E2A44" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#691628" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#360812" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="blackberry-drupe" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A102A" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#250516" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#14020B" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="bramble-green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7E9684" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3E5243" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Bramble Vine Stem */}
            <path
              d="M 10 110 Q 30 75 55 52 T 115 36 T 172 25"
              stroke="#3E5243"
              strokeWidth="1.2"
              fill="none"
              opacity="0.7"
            />
            {/* Toothed Bramble Leaves */}
            <path
              d="M 22 80 C 12 70 14 52 28 46 C 38 56 34 74 22 80 Z"
              fill="url(#bramble-green)"
              opacity="0.85"
            />
            <path
              d="M 85 45 C 75 32 82 18 98 22 C 105 32 98 46 85 45 Z"
              fill="url(#bramble-green)"
              opacity="0.8"
            />

            {/* Golden Tendrils */}
            <path
              d="M 8 35 Q 30 18 68 25 T 125 18 T 165 14"
              stroke="#D4A373"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 3"
              opacity="0.75"
            />
            <circle cx="165" cy="14" r="2" fill="#D4A373" opacity="0.9" />
            <circle cx="125" cy="18" r="1.5" fill="#D4A373" opacity="0.85" />

            {/* Cluster of Ripe Wild Blackberries */}
            <g transform="translate(132, 54)">
              {/* Individual Drupelets */}
              <circle cx="0" cy="-6" r="4.2" fill="url(#blackberry-drupe)" />
              <circle cx="-5" cy="-2" r="4.2" fill="url(#blackberry-drupe)" />
              <circle cx="5" cy="-2" r="4.2" fill="url(#blackberry-drupe)" />
              <circle cx="-7" cy="4" r="4.2" fill="url(#blackberry-drupe)" />
              <circle cx="0" cy="3" r="4.5" fill="url(#blackberry-drupe)" />
              <circle cx="7" cy="4" r="4.2" fill="url(#blackberry-drupe)" />
              <circle cx="-4" cy="9" r="4" fill="url(#blackberry-drupe)" />
              <circle cx="4" cy="9" r="4" fill="url(#blackberry-drupe)" />
              <circle cx="0" cy="14" r="3.6" fill="url(#blackberry-drupe)" />
              {/* Specular Drupelet Highlights */}
              <circle cx="-1" cy="-7" r="1" fill="#C45A6D" opacity="0.7" />
              <circle cx="-6" cy="-3" r="1" fill="#C45A6D" opacity="0.7" />
              <circle cx="4" cy="-3" r="1" fill="#C45A6D" opacity="0.7" />
              <circle cx="-1" cy="2" r="1.1" fill="#C45A6D" opacity="0.8" />
              <circle cx="6" cy="3" r="1" fill="#C45A6D" opacity="0.7" />
              <circle cx="-1" cy="13" r="0.8" fill="#C45A6D" opacity="0.7" />
              {/* Green Calyx Star */}
              <path d="M 0 -11 L 3 -6 L -3 -6 Z" fill="#3E5243" />
            </g>

            {/* Geometric Burgundy Dinnerplate Dahlia Blossom */}
            <g transform="translate(66, 76)">
              {/* Radiating Pointed Petals (Outer Tier: 12 petals) */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 22;
                const y = Math.sin(rad) * 22;
                return (
                  <ellipse
                    key={`outer-${idx}`}
                    cx={x}
                    cy={y}
                    rx="8.5"
                    ry="5"
                    transform={`rotate(${angle} ${x} ${y})`}
                    fill="url(#dahlia-petal-grad)"
                  />
                );
              })}
              {/* Radiating Pointed Petals (Middle Tier: 12 petals offset by 15 deg) */}
              {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 14;
                const y = Math.sin(rad) * 14;
                return (
                  <ellipse
                    key={`mid-${idx}`}
                    cx={x}
                    cy={y}
                    rx="7"
                    ry="4.2"
                    transform={`rotate(${angle} ${x} ${y})`}
                    fill="#9E2A44"
                    opacity="0.95"
                  />
                );
              })}
              {/* Inner Tight Dahlia Center Core */}
              <circle cx="0" cy="0" r="9" fill="#4A0E1A" />
              <circle cx="0" cy="0" r="5" fill="#D4A373" />
              <circle cx="0" cy="0" r="2.2" fill="#25050C" />
            </g>
          </svg>

          {/* Top-Right Cluster: Mirrored Dahlia Bud & Blackberry Sprig */}
          <svg
            className="absolute top-0 right-0 w-32 h-32 sm:w-44 sm:h-44 text-[#7B1E34] -scale-x-100"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 12 85 Q 30 58 65 40 T 120 28 T 160 18"
              stroke="#3E5243"
              strokeWidth="1.1"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M 6 28 Q 35 18 75 22 T 130 15"
              stroke="#D4A373"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 3"
              opacity="0.75"
            />
            <circle cx="130" cy="15" r="2" fill="#D4A373" opacity="0.85" />

            {/* Dahlia Blossom */}
            <g transform="translate(60, 68) scale(0.8)">
              <circle cx="0" cy="0" r="24" fill="#691628" />
              <circle cx="0" cy="0" r="16" fill="#9E2A44" opacity="0.9" />
              <circle cx="0" cy="0" r="7" fill="#D4A373" />
            </g>

            {/* Mini Blackberry */}
            <g transform="translate(120, 36) scale(0.7)">
              <circle cx="0" cy="0" r="4" fill="#250516" />
              <circle cx="-4" cy="4" r="3.5" fill="#250516" />
              <circle cx="4" cy="4" r="3.5" fill="#250516" />
              <circle cx="0" cy="8" r="3.5" fill="#250516" />
            </g>
          </svg>

          {/* Bottom Accent Ribbon */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-3 pointer-events-none opacity-85">
            <span className="text-[#D4A373] text-xs font-serif select-none">❖</span>
            <span className="text-[10px] uppercase font-serif tracking-[0.22em] text-[#7B1E34]/85">
              Burgundy Dahlia & Wild Blackberry Vine
            </span>
            <span className="text-[#D4A373] text-xs font-serif select-none">❖</span>
          </div>
        </>
      )}
    </div>
  );
};
