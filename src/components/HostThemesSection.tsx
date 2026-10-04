import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  Music,
  ImageIcon,
  Leaf,
  Type,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  Volume2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Crown,
  Heart,
  Wind,
  Sun,
  Flame,
  Moon,
  CloudSun,
  Maximize2
} from 'lucide-react';
import {
  EventConfig,
  DustyBlueFloralBorder,
  BurgundyFloralBorder as BurgundyFloralBorderType,
  LeavesStyle,
  LeavesDensity,
  AtmosphereLighting,
  LeavesWindDirection,
  LeavesScale
} from '../types';
import {
  WEDDING_THEMES,
  WeddingTheme,
  getWeddingTheme,
  applyThemeToConfig,
  DUSTY_BLUE_BORDER_OPTIONS,
  DustyBlueBorderOption,
  BURGUNDY_BORDER_OPTIONS,
  BurgundyBorderOption
} from '../data/weddingThemes';
import { WatercolorFloralBorder } from './WatercolorFloralBorder';
import { BurgundyFloralBorder } from './BurgundyFloralBorder';

interface HostThemesSectionProps {
  config: EventConfig;
  onSaveConfig: (updatedConfig: EventConfig) => void;
  onClose?: () => void;
}

export const HostThemesSection: React.FC<HostThemesSectionProps> = ({
  config,
  onSaveConfig,
  onClose
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<string>(config.themeColor || 'dusty-blue');
  const [selectedDustyBorder, setSelectedDustyBorder] = useState<DustyBlueFloralBorder>(
    config.dustyBlueFloralBorder || 'wisteria-hydrangea'
  );
  const [selectedBurgundyBorder, setSelectedBurgundyBorder] = useState<BurgundyFloralBorderType>(
    config.burgundyFloralBorder || 'velvet-rose-ranunculus'
  );
  const [atelierTheme, setAtelierTheme] = useState<'dusty-blue' | 'burgundy'>(
    config.themeColor === 'burgundy' ? 'burgundy' : 'dusty-blue'
  );
  const [activeTab, setActiveTab] = useState<'gallery' | 'customize'>('gallery');

  const currentTheme = getWeddingTheme(config.themeColor);
  const previewTheme = getWeddingTheme(previewThemeId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleApplyTheme = (theme: WeddingTheme, mode: 'style-only' | 'full') => {
    const updated = applyThemeToConfig(config, theme, mode);
    onSaveConfig(updated);
    setPreviewThemeId(theme.id);
    if (mode === 'full') {
      showToast(`Applied full "${theme.name}" theme (colors, typography, imagery & audio).`);
    } else {
      showToast(`Applied "${theme.name}" colors & typography styling. Personal photos & copy preserved.`);
    }
  };

  const handleSelectDustyBorder = (borderId: DustyBlueFloralBorder) => {
    setSelectedDustyBorder(borderId);
    const updated: EventConfig = {
      ...config,
      dustyBlueFloralBorder: borderId
    };
    onSaveConfig(updated);
    const opt = DUSTY_BLUE_BORDER_OPTIONS.find((o) => o.id === borderId);
    showToast(`Watercolor floral border updated to "${opt?.name || borderId}".`);
  };

  const handleSelectBurgundyBorder = (borderId: BurgundyFloralBorderType) => {
    setSelectedBurgundyBorder(borderId);
    const updated: EventConfig = {
      ...config,
      burgundyFloralBorder: borderId
    };
    onSaveConfig(updated);
    const opt = BURGUNDY_BORDER_OPTIONS.find((o) => o.id === borderId);
    showToast(`Watercolor floral border updated to "${opt?.name || borderId}".`);
  };

  const handleUpdateLeavesStyle = (style: LeavesStyle) => {
    const updated: EventConfig = {
      ...config,
      leavesStyle: style,
      leavesAnimationEnabled: true
    };
    onSaveConfig(updated);
    showToast(`Atmospheric particles updated to ${style}.`);
  };

  const handleUpdateLeavesDensity = (density: LeavesDensity) => {
    const updated: EventConfig = {
      ...config,
      leavesDensity: density
    };
    onSaveConfig(updated);
    showToast(`Particle density set to ${density}.`);
  };

  const handleUpdateAtmosphereLighting = (lighting: AtmosphereLighting) => {
    const updated: EventConfig = {
      ...config,
      atmosphereLighting: lighting
    };
    onSaveConfig(updated);
    showToast(`Atmospheric ambient lighting set to ${lighting.replace('-', ' ')}.`);
  };

  const handleUpdateLeavesWindDirection = (wind: LeavesWindDirection) => {
    const updated: EventConfig = {
      ...config,
      leavesWindDirection: wind
    };
    onSaveConfig(updated);
    showToast(`Particle wind motion set to ${wind.replace('-', ' ')}.`);
  };

  const handleUpdateLeavesScale = (scale: LeavesScale) => {
    const updated: EventConfig = {
      ...config,
      leavesScale: scale
    };
    onSaveConfig(updated);
    showToast(`Particle scale set to ${scale}.`);
  };

  const handleToggleLeavesAnimation = () => {
    const nextState = config.leavesAnimationEnabled === false;
    const updated: EventConfig = {
      ...config,
      leavesAnimationEnabled: nextState
    };
    onSaveConfig(updated);
    showToast(`Atmospheric particle animation ${nextState ? 'enabled' : 'paused'}.`);
  };

  const handleApplyThemeImagery = (theme: WeddingTheme) => {
    const updated: EventConfig = {
      ...config,
      bgImage: theme.imagery.bgImage,
      heroImage: theme.imagery.heroImage
    };
    onSaveConfig(updated);
    showToast(`Applied curated high-resolution photography for ${theme.name}.`);
  };

  const handleApplyThemeAudio = (theme: WeddingTheme) => {
    const updated: EventConfig = {
      ...config,
      audioUrl: theme.audio.url
    };
    onSaveConfig(updated);
    showToast(`Applied ceremonial prelude: ${theme.audio.title}.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-serif text-sm font-semibold">{toastMessage}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs font-semibold underline text-emerald-700 hover:text-emerald-900 ml-4 shrink-0"
            >
              View on Website →
            </button>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#ebf2f7] via-[#f7f9fa] to-white p-5 sm:p-6 lg:p-7 rounded-3xl border border-[#c8d7e3] shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white text-[#3A5A74] border border-[#c8d7e3] text-xs font-semibold uppercase tracking-wider shadow-2xs max-w-full">
              <Palette className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span className="truncate">Theme Studio & Aesthetics</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] shrink-0"></span>
              <span className="truncate">5 Curated Presets</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#18232c] tracking-tight break-words">
              Curated Wedding Design Themes
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-serif max-w-2xl">
              Transform the entire aesthetic of your wedding invitation with a single click. Each theme includes harmonious color tokens, bespoke typography pairings, coordinated wax seals, tailored atmospheric petal effects, and ceremonial prelude music.
            </p>
          </div>

          {/* Active Theme Highlight Card */}
          <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-[#c8d7e3] shadow-xs flex flex-col space-y-2.5 w-full sm:w-auto sm:min-w-[240px] xl:w-72 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-sans font-bold tracking-wider uppercase text-[#475569]">
                Active Theme
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <Check className="w-3 h-3" />
                <span>Live on Site</span>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl shadow-inner border border-black/10 shrink-0 flex items-center justify-center text-white"
                style={{ backgroundColor: currentTheme.colors.primary }}
              >
                <Crown className="w-5 h-5 text-amber-200" />
              </div>
              <div className="min-w-0">
                <div className="font-serif font-bold text-[#18232c] truncate text-base">
                  {currentTheme.name}
                </div>
                <div className="text-xs text-[#506173] truncate font-serif">
                  {currentTheme.subtitle}
                </div>
              </div>
            </div>

            {/* Quick Palette Preview Bar */}
            <div className="flex items-center space-x-1.5 pt-1">
              {[
                currentTheme.colors.primary,
                currentTheme.colors.primaryDark,
                currentTheme.colors.primaryLight,
                currentTheme.colors.accent,
                currentTheme.colors.border
              ].map((c, i) => (
                <div
                  key={i}
                  className="h-3 flex-1 rounded-sm border border-black/10 shadow-2xs"
                  style={{ backgroundColor: c }}
                  title={`Color: ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Theme Gallery vs Fine-Tuning */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c8d7e3] pb-2.5">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-[#3A5A74] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#18232c] hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Theme Showcase (5 Presets)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customize')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'customize'
                ? 'bg-[#3A5A74] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#18232c] hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Atmosphere & Particle Studio</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-serif font-semibold text-[#3A5A74] hover:underline flex items-center space-x-1 shrink-0 self-start sm:self-auto"
          >
            <span>Preview on Live Invitation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* VIEW 1: THEME SHOWCASE (5 PRESETS) */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {WEDDING_THEMES.map((theme) => {
              const isSelected = (config.themeColor || 'dusty-blue') === theme.id;

              return (
                <div
                  key={theme.id}
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between bg-white relative ${
                    isSelected
                      ? 'border-2 ring-4 shadow-xl'
                      : 'border-[#c8d7e3] hover:border-slate-400 shadow-sm hover:shadow-md'
                  }`}
                  style={{
                    borderColor: isSelected ? theme.colors.primary : undefined,
                    boxShadow: isSelected ? `0 20px 35px -10px ${theme.colors.primary}33` : undefined
                  }}
                >
                  {/* Top Bar with Accent Pill */}
                  <div
                    className="h-2.5 w-full"
                    style={{
                      background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent}, ${theme.colors.primaryDark})`
                    }}
                  />

                  <div className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between">
                    {/* Theme Header Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#18232c]">
                              {theme.name}
                            </h3>
                            {isSelected && (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs inline-flex items-center space-x-1 shrink-0"
                                style={{ backgroundColor: theme.colors.primary }}
                              >
                                <Check className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[#506173] font-serif font-medium mt-0.5">
                            {theme.subtitle}
                          </p>
                        </div>

                        {/* Theme Monogram Mini Seal */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-serif font-bold shadow-md shrink-0 border-2"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${theme.colors.waxSealFrom} 0%, ${theme.colors.primary} 60%, ${theme.colors.waxSealTo} 100%)`,
                            borderColor: theme.colors.waxSealBorder
                          }}
                        >
                          ❦
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#475569] font-serif leading-relaxed">
                        {theme.description}
                      </p>

                      {/* Mood Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {theme.moodTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg text-[11px] font-sans font-medium"
                            style={{
                              backgroundColor: theme.colors.primaryLight,
                              color: theme.colors.primaryDark
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Color Swatch Palette Strip */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-[#506173]">
                        <span>Harmonious Palette</span>
                        <span>Primary · Accent · Background · Seal</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5 h-7 rounded-xl p-1 bg-slate-100 border border-slate-200">
                        <div
                          className="rounded-lg shadow-2xs"
                          style={{ backgroundColor: theme.colors.primary }}
                          title={`Primary: ${theme.colors.primary}`}
                        />
                        <div
                          className="rounded-lg shadow-2xs"
                          style={{ backgroundColor: theme.colors.primaryDark }}
                          title={`Dark: ${theme.colors.primaryDark}`}
                        />
                        <div
                          className="rounded-lg shadow-2xs"
                          style={{ backgroundColor: theme.colors.primaryLight }}
                          title={`Light: ${theme.colors.primaryLight}`}
                        />
                        <div
                          className="rounded-lg shadow-2xs"
                          style={{ backgroundColor: theme.colors.accent }}
                          title={`Accent: ${theme.colors.accent}`}
                        />
                        <div
                          className="rounded-lg shadow-2xs"
                          style={{ backgroundColor: theme.colors.border }}
                          title={`Border: ${theme.colors.border}`}
                        />
                        <div
                          className="rounded-lg shadow-2xs"
                          style={{ backgroundColor: theme.colors.waxSealFrom }}
                          title={`Wax Seal: ${theme.colors.waxSealFrom}`}
                        />
                      </div>
                    </div>

                    {/* Live Typography Specimen Card */}
                    <div
                      className="p-5 rounded-2xl border space-y-1 text-center relative overflow-hidden transition"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border
                      }}
                    >
                      {theme.id === 'dusty-blue' && (
                        <WatercolorFloralBorder
                          variation={selectedDustyBorder}
                          className="rounded-2xl"
                        />
                      )}
                      {theme.id === 'burgundy' && (
                        <BurgundyFloralBorder
                          variation={selectedBurgundyBorder}
                          className="rounded-2xl"
                        />
                      )}
                      <div
                        className="relative z-10 text-[11px] font-sans font-semibold tracking-wider uppercase"
                        style={{ color: theme.colors.accent }}
                      >
                        {theme.details.subHeader}
                      </div>
                      <div
                        className={`relative z-10 text-2xl sm:text-3xl transition font-wedding-${theme.typography.font}`}
                        style={{ color: theme.colors.primaryDark }}
                      >
                        {config.title || 'Mark & Karla'}
                      </div>
                      <div className="relative z-10 text-[11px] font-serif italic text-slate-500">
                        {theme.id === 'dusty-blue'
                          ? `Framed with ${DUSTY_BLUE_BORDER_OPTIONS.find((o) => o.id === selectedDustyBorder)?.name || 'Watercolor Floral Border'}`
                          : theme.id === 'burgundy'
                          ? `Framed with ${BURGUNDY_BORDER_OPTIONS.find((o) => o.id === selectedBurgundyBorder)?.name || 'Watercolor Floral Border'}`
                          : theme.typography.pairingDescription}
                      </div>
                    </div>

                    {/* BESPOKE WATERCOLOR FLORAL BORDER VARIATIONS SELECTOR (FOR DUSTY BLUE ONLY) */}
                    {theme.id === 'dusty-blue' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ebf2f7]/95 via-[#f2f7fa]/80 to-[#e4eff6]/95 border border-[#c8d7e3] space-y-3 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#c8d7e3]/70 pb-2.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <Sparkles className="w-4 h-4 text-[#C5A059]" />
                              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#18232c]">
                                Watercolor Floral Border Variations
                              </h4>
                            </div>
                            <p className="text-[11px] text-[#506173] font-serif leading-snug">
                              Exclusive hand-painted botanical borders crafted for the Dusty Blue theme:
                            </p>
                          </div>

                          <span className="self-start sm:self-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans tracking-wide bg-white text-[#3A5A74] border border-[#c8d7e3] shadow-2xs shrink-0">
                            🌸 {DUSTY_BLUE_BORDER_OPTIONS.filter((o) => o.id !== 'none').length} Bespoke Artworks
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {DUSTY_BLUE_BORDER_OPTIONS.map((opt) => {
                            const isBorderActive = selectedDustyBorder === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                id={`dusty-border-btn-${opt.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectDustyBorder(opt.id);
                                }}
                                className={`p-3 rounded-xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                                  isBorderActive
                                    ? 'bg-white border-[#3A5A74] ring-2 ring-[#3A5A74]/25 shadow-xs'
                                    : 'bg-white/75 hover:bg-white border-[#c8d7e3] hover:border-slate-400'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-serif font-bold text-xs text-[#18232c]">
                                      {opt.name}
                                    </span>
                                    {isBorderActive ? (
                                      <span className="w-4 h-4 rounded-full bg-[#3A5A74] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#475569] bg-[#ebf2f7] px-1.5 py-0.5 rounded shrink-0">
                                        {opt.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#506173] font-serif mt-0.5 line-clamp-1">
                                    {opt.subtitle}
                                  </div>
                                  <p className="text-[11px] text-[#64748b] font-serif mt-1 leading-snug">
                                    {opt.description}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-slate-100">
                                  {opt.botanicals.map((bot, bIdx) => (
                                    <span
                                      key={bIdx}
                                      className="text-[9px] px-1.5 py-0.5 rounded-sm bg-[#ebf2f7] text-[#3A5A74] font-medium"
                                    >
                                      {bot}
                                    </span>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* BESPOKE WATERCOLOR FLORAL BORDER VARIATIONS SELECTOR (FOR BURGUNDY ONLY) */}
                    {theme.id === 'burgundy' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fbf4f5]/95 via-[#f8edf0]/80 to-[#f6e9ec]/95 border border-[#e4cbd0] space-y-3 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#e4cbd0]/70 pb-2.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <Sparkles className="w-4 h-4 text-[#7B1E34]" />
                              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#4A0E1A]">
                                Watercolor Floral Border Variations
                              </h4>
                            </div>
                            <p className="text-[11px] text-[#7A3E48] font-serif leading-snug">
                              Exclusive hand-painted botanical borders crafted for the Burgundy & Velvet Rose theme:
                            </p>
                          </div>

                          <span className="self-start sm:self-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans tracking-wide bg-white text-[#7B1E34] border border-[#e4cbd0] shadow-2xs shrink-0">
                            🌹 {BURGUNDY_BORDER_OPTIONS.filter((o) => o.id !== 'none').length} Bespoke Artworks
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {BURGUNDY_BORDER_OPTIONS.map((opt) => {
                            const isBorderActive = selectedBurgundyBorder === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                id={`burgundy-border-btn-${opt.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectBurgundyBorder(opt.id);
                                }}
                                className={`p-3 rounded-xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                                  isBorderActive
                                    ? 'bg-white border-[#7B1E34] ring-2 ring-[#7B1E34]/25 shadow-xs'
                                    : 'bg-white/75 hover:bg-white border-[#e4cbd0] hover:border-[#b87d88]'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-serif font-bold text-xs text-[#2A0810]">
                                      {opt.name}
                                    </span>
                                    {isBorderActive ? (
                                      <span className="w-4 h-4 rounded-full bg-[#7B1E34] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#7A3E48] bg-[#fbf2f4] px-1.5 py-0.5 rounded shrink-0">
                                        {opt.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#7A3E48] font-serif mt-0.5 line-clamp-1">
                                    {opt.subtitle}
                                  </div>
                                  <p className="text-[11px] text-[#5c3b42] font-serif mt-1 leading-snug">
                                    {opt.description}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-rose-100">
                                  {opt.botanicals.map((bot, bIdx) => (
                                    <span
                                      key={bIdx}
                                      className="text-[9px] px-1.5 py-0.5 rounded-sm bg-[#fbf2f4] text-[#7B1E34] font-medium"
                                    >
                                      {bot}
                                    </span>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Atmospheric Petals & Audio Badge */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-serif">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                        <Leaf className="w-4 h-4 shrink-0 text-amber-600" />
                        <div className="min-w-0">
                          <div className="font-bold text-[#18232c] truncate">
                            {theme.atmosphere.effectLabel}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize">
                            {theme.atmosphere.leavesStyle} · {theme.atmosphere.leavesDensity}
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                        <Music className="w-4 h-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <div className="font-bold text-[#18232c] truncate">
                            Ceremonial Prelude
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {theme.audio.title}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        id={`btn-apply-style-${theme.id}`}
                        onClick={() => handleApplyTheme(theme, 'style-only')}
                        className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-serif font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200'
                            : 'text-white shadow-xs hover:opacity-95'
                        }`}
                        style={{
                          backgroundColor: isSelected ? undefined : theme.colors.primary
                        }}
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSelected ? 'Re-Apply Styling' : 'Apply Theme Styling'}</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-apply-full-${theme.id}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Apply the complete "${theme.name}" preset? This updates colors, typography, curated backgrounds, hero imagery, and ceremonial music.`
                            )
                          ) {
                            handleApplyTheme(theme, 'full');
                          }
                        }}
                        className="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-serif font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                        title="Applies all preset images, copy, and audio"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Full Preset</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DEDICATED WATERCOLOR FLORAL ATELIER SHOWCASE */}
          <div
            className={`mt-8 rounded-3xl p-6 sm:p-8 border shadow-sm relative overflow-hidden transition-all duration-300 ${
              atelierTheme === 'burgundy'
                ? 'bg-gradient-to-br from-[#fcf5f6] via-[#f7ebed] to-white border-[#e4cbd0]'
                : 'bg-gradient-to-br from-[#ebf2f7] via-[#f7f9fa] to-white border-[#c8d7e3]'
            }`}
          >
            <div className="relative z-10 space-y-6">
              <div
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5"
                style={{
                  borderColor:
                    atelierTheme === 'burgundy'
                      ? 'rgba(228, 203, 208, 0.7)'
                      : 'rgba(200, 215, 227, 0.7)'
                }}
              >
                <div className="space-y-2.5 max-w-2xl">
                  {/* Atelier Theme Switcher Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex p-1 bg-white/95 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <button
                        type="button"
                        id="atelier-tab-dusty-blue"
                        onClick={() => setAtelierTheme('dusty-blue')}
                        className={`px-3 py-1 rounded-xl text-xs font-serif font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                          atelierTheme === 'dusty-blue'
                            ? 'bg-[#3A5A74] text-white shadow-2xs'
                            : 'text-[#506173] hover:text-[#18232c]'
                        }`}
                      >
                        <span>🌸</span>
                        <span>Dusty Blue Atelier</span>
                      </button>
                      <button
                        type="button"
                        id="atelier-tab-burgundy"
                        onClick={() => setAtelierTheme('burgundy')}
                        className={`px-3 py-1 rounded-xl text-xs font-serif font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                          atelierTheme === 'burgundy'
                            ? 'bg-[#7B1E34] text-white shadow-2xs'
                            : 'text-[#506173] hover:text-[#18232c]'
                        }`}
                      >
                        <span>🌹</span>
                        <span>Burgundy & Velvet Rose Atelier</span>
                      </button>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans tracking-wide uppercase border shadow-2xs ${
                        atelierTheme === 'burgundy'
                          ? 'bg-rose-50 text-[#7B1E34] border-[#e4cbd0]'
                          : 'bg-sky-50 text-[#3A5A74] border-[#c8d7e3]'
                      }`}
                    >
                      {atelierTheme === 'burgundy'
                        ? 'Burgundy & Velvet Rose Exclusive'
                        : 'Dusty Blue Exclusive'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#18232c]">
                    {atelierTheme === 'burgundy'
                      ? 'Subtle Velvet Rose & Botanical Border Variations'
                      : 'Subtle Watercolor Floral Border Variations'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] font-serif leading-relaxed">
                    {atelierTheme === 'burgundy'
                      ? 'Designed exclusively for our signature Burgundy & Velvet Rose theme. Each bespoke border variation features organic watercolor transparency, velvet English cabbage roses, rich cabernet washes, jeweled pomegranates, and warm rose-gold filigree.'
                      : 'Designed exclusively for our signature Romantic Dusty Blue & Gold theme. Each bespoke border variation features organic watercolor transparency, layered petal washes, and hand-drawn French garden botanical accents.'}
                  </p>
                </div>

                <div
                  className="self-start md:self-auto flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border shadow-2xs"
                  style={{
                    borderColor: atelierTheme === 'burgundy' ? '#e4cbd0' : '#c8d7e3'
                  }}
                >
                  <span className="text-xs font-serif text-[#506173]">Active Border:</span>
                  <span
                    className={`font-serif font-bold text-xs sm:text-sm ${
                      atelierTheme === 'burgundy' ? 'text-[#7B1E34]' : 'text-[#3A5A74]'
                    }`}
                  >
                    {atelierTheme === 'burgundy'
                      ? BURGUNDY_BORDER_OPTIONS.find((o) => o.id === selectedBurgundyBorder)?.name
                      : DUSTY_BLUE_BORDER_OPTIONS.find((o) => o.id === selectedDustyBorder)?.name}
                  </span>
                </div>
              </div>

              {/* DUSTY BLUE BORDER SHOWCASE */}
              {atelierTheme === 'dusty-blue' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {DUSTY_BLUE_BORDER_OPTIONS.map((opt) => {
                    const isActive = selectedDustyBorder === opt.id;
                    const isCurrentThemeDustyBlue = (config.themeColor || 'dusty-blue') === 'dusty-blue';

                    return (
                      <div
                        key={opt.id}
                        className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white relative ${
                          isActive
                            ? 'border-[#3A5A74] ring-2 ring-[#3A5A74]/25 shadow-md'
                            : 'border-[#c8d7e3] hover:border-slate-400 shadow-2xs hover:shadow-sm'
                        }`}
                      >
                        {/* Miniature Stationery Specimen with Live Border Artwork */}
                        <div className="p-4 sm:p-5 pb-3 relative min-h-[190px] flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-b border-slate-100 overflow-hidden">
                          <WatercolorFloralBorder
                            variation={opt.id}
                            className="rounded-xl"
                          />
                          <div className="relative z-10 text-center space-y-1 pointer-events-none px-2 py-3 bg-white/85 backdrop-blur-[2px] rounded-xl border border-white/80 shadow-2xs max-w-[200px] w-full">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#3A5A74] block">
                              Save the Date
                            </span>
                            <div className="font-serif font-bold text-sm sm:text-base text-[#18232c] leading-tight">
                              {config.title || 'Mark & Karla'}
                            </div>
                            <span className="text-[10px] text-[#506173] font-serif block">
                              {config.date || 'Saturday, October 24, 2026'}
                            </span>
                          </div>
                        </div>

                        {/* Card Details & Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-serif font-bold text-base text-[#18232c]">
                                  {opt.name}
                                </h4>
                                <p className="text-xs text-[#3A5A74] font-serif font-medium">
                                  {opt.subtitle}
                                </p>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-[#475569] bg-[#ebf2f7] px-2 py-0.5 rounded-full shrink-0">
                                {opt.badge}
                              </span>
                            </div>

                            <p className="text-xs text-[#475569] font-serif leading-relaxed">
                              {opt.description}
                            </p>

                            {/* Botanical Elements Tags */}
                            <div className="pt-1">
                              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#64748b] block mb-1">
                                Hand-Painted Botanicals
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {opt.botanicals.map((bot, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#ebf2f7] text-[#3A5A74] font-medium"
                                  >
                                    {bot}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Selection Button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              id={`atelier-select-border-${opt.id}`}
                              onClick={() => {
                                handleSelectDustyBorder(opt.id);
                                if (!isCurrentThemeDustyBlue) {
                                  const dustyTheme = WEDDING_THEMES.find((t) => t.id === 'dusty-blue');
                                  if (dustyTheme) {
                                    handleApplyTheme(dustyTheme, 'style-only');
                                  }
                                }
                              }}
                              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-serif font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                                isActive && isCurrentThemeDustyBlue
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : 'bg-[#3A5A74] hover:bg-[#274155] text-white shadow-xs'
                              }`}
                            >
                              {isActive && isCurrentThemeDustyBlue ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-700" />
                                  <span>Active Live Border</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                                  <span>
                                    {isCurrentThemeDustyBlue
                                      ? 'Select This Border'
                                      : 'Apply Border & Dusty Blue Theme'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BURGUNDY & VELVET ROSE BORDER SHOWCASE */}
              {atelierTheme === 'burgundy' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {BURGUNDY_BORDER_OPTIONS.map((opt) => {
                    const isActive = selectedBurgundyBorder === opt.id;
                    const isCurrentThemeBurgundy = (config.themeColor || 'dusty-blue') === 'burgundy';

                    return (
                      <div
                        key={opt.id}
                        className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white relative ${
                          isActive
                            ? 'border-[#7B1E34] ring-2 ring-[#7B1E34]/25 shadow-md'
                            : 'border-[#e4cbd0] hover:border-[#b87d88] shadow-2xs hover:shadow-sm'
                        }`}
                      >
                        {/* Miniature Stationery Specimen with Live Border Artwork */}
                        <div className="p-4 sm:p-5 pb-3 relative min-h-[190px] flex flex-col items-center justify-center bg-gradient-to-b from-[#fdf8f9] to-[#f7edf0] border-b border-rose-100 overflow-hidden">
                          <BurgundyFloralBorder
                            variation={opt.id}
                            className="rounded-xl"
                          />
                          <div className="relative z-10 text-center space-y-1 pointer-events-none px-2 py-3 bg-white/90 backdrop-blur-[2px] rounded-xl border border-white/80 shadow-2xs max-w-[200px] w-full">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7B1E34] block">
                              Save the Date
                            </span>
                            <div className="font-serif font-bold text-sm sm:text-base text-[#2A0810] leading-tight">
                              {config.title || 'Mark & Karla'}
                            </div>
                            <span className="text-[10px] text-[#7A3E48] font-serif block">
                              {config.date || 'Saturday, October 24, 2026'}
                            </span>
                          </div>
                        </div>

                        {/* Card Details & Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-serif font-bold text-base text-[#2A0810]">
                                  {opt.name}
                                </h4>
                                <p className="text-xs text-[#7B1E34] font-serif font-medium">
                                  {opt.subtitle}
                                </p>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A3E48] bg-[#fbf2f4] px-2 py-0.5 rounded-full shrink-0">
                                {opt.badge}
                              </span>
                            </div>

                            <p className="text-xs text-[#5c3b42] font-serif leading-relaxed">
                              {opt.description}
                            </p>

                            {/* Botanical Elements Tags */}
                            <div className="pt-1">
                              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#7A3E48] block mb-1">
                                Hand-Painted Botanicals
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {opt.botanicals.map((bot, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#fbf2f4] text-[#7B1E34] font-medium"
                                  >
                                    {bot}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Selection Button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              id={`atelier-select-burgundy-border-${opt.id}`}
                              onClick={() => {
                                handleSelectBurgundyBorder(opt.id);
                                if (!isCurrentThemeBurgundy) {
                                  const burgundyTheme = WEDDING_THEMES.find((t) => t.id === 'burgundy');
                                  if (burgundyTheme) {
                                    handleApplyTheme(burgundyTheme, 'style-only');
                                  }
                                }
                              }}
                              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-serif font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                                isActive && isCurrentThemeBurgundy
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : 'bg-[#7B1E34] hover:bg-[#521221] text-white shadow-xs'
                              }`}
                            >
                              {isActive && isCurrentThemeBurgundy ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-700" />
                                  <span>Active Live Border</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                                  <span>
                                    {isCurrentThemeBurgundy
                                      ? 'Select This Border'
                                      : 'Apply Border & Burgundy Theme'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ATMOSPHERE & PARTICLE STUDIO */}
      {activeTab === 'customize' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#c8d7e3] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18232c] flex items-center space-x-2">
                  <Leaf className="w-5 h-5 text-amber-600" />
                  <span>Atmosphere & Particle Studio</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] font-serif mt-0.5">
                  Design magical real-time floating flora, stardust, candlelit embers, and ambient lighting for your wedding invitation.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleToggleLeavesAnimation}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center space-x-2 cursor-pointer ${
                    config.leavesAnimationEnabled !== false
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  <span>Particles:</span>
                  <span className="font-bold">
                    {config.leavesAnimationEnabled !== false ? 'Active' : 'Paused'}
                  </span>
                </button>
              </div>
            </div>

            {/* Ambient Lighting & Glow Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-serif font-bold text-[#18232c] flex items-center space-x-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Ambient Lighting & Atmospheric Filter</span>
                </label>
                <span className="text-[11px] font-serif text-slate-500">
                  Current: <strong className="text-[#3A5A74] capitalize">{(config.atmosphereLighting || 'none').replace('-', ' ')}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  {
                    id: 'none',
                    name: 'Natural Daylight',
                    badge: 'Pure',
                    desc: 'Clean & transparent natural ambient daylight'
                  },
                  {
                    id: 'candlelight',
                    name: 'Candlelight Glow',
                    badge: 'Intimate',
                    desc: 'Warm amber glow radiating from the floor & perimeter'
                  },
                  {
                    id: 'golden-hour',
                    name: 'Golden Hour Sunset',
                    badge: 'Radiant',
                    desc: 'Honey-peach warmth casting like a sunset ceremony'
                  },
                  {
                    id: 'twilight-fairy',
                    name: 'Twilight & Fairies',
                    badge: 'Mystical',
                    desc: 'Evening sapphire, lavender halo & magical evening starlight'
                  },
                  {
                    id: 'rose-quartz',
                    name: 'Rose Quartz Blush',
                    badge: 'Romantic',
                    desc: 'Delicate French blush veil with rose-gold luminescence'
                  },
                  {
                    id: 'enchanted-mist',
                    name: 'Enchanted Mist',
                    badge: 'Ethereal',
                    desc: 'Opalescent morning dew haze & soft-focus clarity'
                  }
                ].map((item) => {
                  const isSelected = (config.atmosphereLighting || 'none') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleUpdateAtmosphereLighting(item.id as AtmosphereLighting)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#3A5A74] bg-[#ebf2f7] ring-2 ring-[#3A5A74]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-serif uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#3A5A74]" />}
                        </div>
                        <div className="font-serif font-bold text-xs text-[#18232c] leading-snug">
                          {item.name}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-serif leading-tight mt-1.5">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Particle Flora & Foil Style Selector (10 Options) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-serif font-bold text-[#18232c] flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Particle Flora & Atmospheric Elements (10 Styles)</span>
                </label>
                <span className="text-[11px] font-serif text-slate-500">
                  {config.leavesAnimationEnabled !== false ? 'Live Floating' : 'Paused'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  {
                    id: 'cherry-blossom',
                    name: 'Cherry Blossom (Sakura)',
                    tag: 'Spring Romance',
                    desc: 'Fluttering pink sakura petals with delicate notched clefts & spring buds'
                  },
                  {
                    id: 'celestial-stardust',
                    name: 'Celestial Stardust',
                    tag: 'Starry Evening',
                    desc: 'Four-point twinkling diamond stars & glowing stardust motes'
                  },
                  {
                    id: 'candlelit-lantern',
                    name: 'Candlelight & Embers',
                    tag: 'Upward Drift',
                    desc: 'Buoyant floating candle lantern flames & glowing warm firefly embers'
                  },
                  {
                    id: 'lavender-wildflower',
                    name: 'Lavender & Wildflowers',
                    tag: 'Cottage Meadow',
                    desc: 'Delicate purple lavender sprigs, golden buttercups & meadow petals'
                  },
                  {
                    id: 'autumn-maple',
                    name: 'Autumn Maple & Vineyard',
                    tag: 'Harvest Season',
                    desc: 'Crisp 5-lobed scarlet maple leaves & rustic golden grape leaves'
                  },
                  {
                    id: 'snow-crystal',
                    name: 'Winter Frost & Crystals',
                    tag: 'Winter Wonderland',
                    desc: 'Geometric 6-point crystalline snowflakes & shimmering ice shards'
                  },
                  {
                    id: 'gilded',
                    name: 'Gilded Gold Foil',
                    tag: 'Luxury Glamour',
                    desc: 'Metallic champagne gold leaflets & celestial stardust confetti'
                  },
                  {
                    id: 'petals',
                    name: 'Romantic Rose Petals',
                    tag: 'Timeless Classic',
                    desc: 'Falling crimson velvet, blush & soft ivory garden rose petals'
                  },
                  {
                    id: 'botanical',
                    name: 'Botanical Foliage',
                    tag: 'Eucalyptus & Sage',
                    desc: 'Fresh silver-dollar eucalyptus, olive sprigs & slender willow leaves'
                  },
                  {
                    id: 'mixed',
                    name: 'Heirloom Mixed Suite',
                    tag: 'Signature Blend',
                    desc: 'Harmonious blend of eucalyptus, delicate rose petals & gold leaf dust'
                  }
                ].map((item) => {
                  const isSelected = (config.leavesStyle || 'mixed') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleUpdateLeavesStyle(item.id as LeavesStyle)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#3A5A74] bg-[#ebf2f7] ring-2 ring-[#3A5A74]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-serif uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                            {item.tag}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#3A5A74]" />}
                        </div>
                        <div className="font-serif font-bold text-xs sm:text-sm text-[#18232c] leading-snug">
                          {item.name}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-serif leading-snug mt-2">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wind Motion & Drift Dynamics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Wind Direction */}
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm font-serif font-bold text-[#18232c] flex items-center space-x-1.5">
                  <Wind className="w-4 h-4 text-sky-600" />
                  <span>Wind & Motion Direction</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'calm', name: 'Calm Vertical', desc: 'Serene graceful vertical drift' },
                    { id: 'breeze-right', name: 'Gentle East Breeze', desc: 'Drifting naturally toward right' },
                    { id: 'breeze-left', name: 'Gentle West Breeze', desc: 'Drifting naturally toward left' },
                    { id: 'swirling', name: 'Swirling Whirlwind', desc: 'Rhythmic poetic eddy currents' }
                  ].map((w) => {
                    const isSelected = (config.leavesWindDirection || 'calm') === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleUpdateLeavesWindDirection(w.id as LeavesWindDirection)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-[#3A5A74] bg-[#ebf2f7] ring-2 ring-[#3A5A74]/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-[#18232c]">{w.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#3A5A74]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 font-serif mt-1">{w.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Particle Scale */}
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm font-serif font-bold text-[#18232c] flex items-center space-x-1.5">
                  <Maximize2 className="w-4 h-4 text-emerald-600" />
                  <span>Particle Scale & Size</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'delicate', name: 'Delicate', desc: 'Featherweight subtle scale' },
                    { id: 'natural', name: 'Natural', desc: 'Standard balanced size' },
                    { id: 'statement', name: 'Statement', desc: 'Bold, prominent celebration' }
                  ].map((s) => {
                    const isSelected = (config.leavesScale || 'natural') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdateLeavesScale(s.id as LeavesScale)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-[#3A5A74] bg-[#ebf2f7] ring-2 ring-[#3A5A74]/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-[#18232c]">{s.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#3A5A74]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 font-serif mt-1">{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Density Selector (5 Presets) */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs sm:text-sm font-serif font-bold text-[#18232c]">
                Particle Density & Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {[
                  { id: 'whisper', name: 'Whisper', desc: '12 particles subtle presence' },
                  { id: 'gentle', name: 'Gentle', desc: '20 particles drifting gracefully' },
                  { id: 'medium', name: 'Medium', desc: '32 particles balanced elegance' },
                  { id: 'lush', name: 'Lush', desc: '50 particles celebratory flourish' },
                  { id: 'blizzard', name: 'Blizzard / Gala', desc: '72 particles festive burst' }
                ].map((item) => {
                  const isSelected = (config.leavesDensity || 'medium') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleUpdateLeavesDensity(item.id as LeavesDensity)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-[#3A5A74] bg-[#ebf2f7] ring-2 ring-[#3A5A74]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs sm:text-sm text-[#18232c]">
                          {item.name}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#3A5A74]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 font-serif mt-1">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Assets Harmonizer */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#c8d7e3] shadow-xs space-y-4">
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18232c] flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-[#3A5A74]" />
              <span>Theme Matched Background & Music Library</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] font-serif">
              Quickly apply high-definition background textures or ceremonial preludes curated for each theme:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              {WEDDING_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="w-full h-16 rounded-xl bg-cover bg-center border border-black/10 shadow-2xs mb-2"
                      style={{ backgroundImage: `url('${theme.imagery.bgImage}')` }}
                    />
                    <div className="font-serif font-bold text-xs text-[#18232c] truncate">
                      {theme.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {theme.audio.title}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyThemeImagery(theme)}
                      className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-serif font-semibold transition cursor-pointer"
                    >
                      Use Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyThemeAudio(theme)}
                      className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-serif font-semibold transition cursor-pointer"
                    >
                      Use Prelude
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
