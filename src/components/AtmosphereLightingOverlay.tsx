import React from 'react';
import { AtmosphereLighting } from '../types';

interface AtmosphereLightingOverlayProps {
  mode?: AtmosphereLighting;
}

export const AtmosphereLightingOverlay: React.FC<AtmosphereLightingOverlayProps> = ({
  mode = 'none'
}) => {
  if (!mode || mode === 'none') return null;

  return (
    <div
      id="atmosphere-ambient-overlay"
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden transition-all duration-700"
      aria-hidden="true"
    >
      {/* Warm Candlelight Glow: intimate amber aura, candlelit floor & perimeter glow */}
      {mode === 'candlelight' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(251,191,36,0.18)_0%,rgba(217,119,6,0.08)_50%,transparent_80%)] animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_55%,rgba(180,83,9,0.08)_100%)]" />
          <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-amber-500/10 to-transparent" />
        </>
      )}

      {/* Golden Hour Sunset: radiant honey-peach warmth casting from top-right like a sunset ceremony */}
      {mode === 'golden-hour' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(251,146,60,0.16)_0%,rgba(245,158,11,0.08)_45%,transparent_80%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_90%,rgba(244,114,182,0.06)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.04] via-transparent to-rose-500/[0.05]" />
        </>
      )}

      {/* Twilight & Fairy Lights: evening sapphire, lavender halo and soft mystical starlight glow */}
      {mode === 'twilight-fairy' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.14)_0%,rgba(30,58,138,0.08)_50%,transparent_85%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(168,85,247,0.09)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(15,23,42,0.08)_100%)]" />
        </>
      )}

      {/* Romantic Rose Quartz: French blush veil with delicate rose-gold luminescence */}
      {mode === 'rose-quartz' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(253,242,244,0.35)_0%,rgba(244,114,182,0.09)_65%,rgba(225,29,72,0.06)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-rose-400/[0.04] via-transparent to-rose-600/[0.06]" />
        </>
      )}

      {/* Enchanted Morning Mist: ethereal soft-focus haze with opalescent morning dew luminescence */}
      {mode === 'enchanted-mist' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.38)_0%,rgba(226,232,240,0.18)_65%,transparent_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-200/25 to-transparent" />
        </>
      )}
    </div>
  );
};
