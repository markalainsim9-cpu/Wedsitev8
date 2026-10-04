import { WeddingTitleFont, WeddingTitleWeight, WeddingTitleTransform, WeddingTitleSize } from '../types';

export interface WeddingFontOption {
  id: WeddingTitleFont;
  name: string;
  category: 'Calligraphy Script' | 'Classical Serif' | 'Editorial & Vogue' | 'Imperial & Architectural' | 'Modern Minimalist';
  description: string;
  cssClass: string;
  previewText: string;
  isScript: boolean;
  recommendedSize: WeddingTitleSize;
  tagline: string;
}

export const WEDDING_TITLE_FONTS: WeddingFontOption[] = [
  {
    id: 'great-vibes',
    name: 'Great Vibes',
    category: 'Calligraphy Script',
    description: 'Breathtaking, flowing romantic calligraphy with ornate flourishes. Perfect for fairy-tale and luxury garden weddings.',
    cssClass: 'font-wedding-great-vibes',
    previewText: 'Victoria & Alexander',
    isScript: true,
    recommendedSize: 'grand',
    tagline: 'Romantic Cursive Calligraphy'
  },
  {
    id: 'pinyon',
    name: 'Pinyon Script',
    category: 'Calligraphy Script',
    description: 'High-society aristocratic cursive with delicate, sweeping strokes. Ideal for historic estate and cathedral celebrations.',
    cssClass: 'font-wedding-pinyon',
    previewText: 'Victoria & Alexander',
    isScript: true,
    recommendedSize: 'majestic',
    tagline: 'Aristocratic Regal Flourish'
  },
  {
    id: 'alex-brush',
    name: 'Alex Brush',
    category: 'Calligraphy Script',
    description: 'Smooth, graceful brush cursive with exceptional legibility and warm romantic rhythm.',
    cssClass: 'font-wedding-alex-brush',
    previewText: 'Victoria & Alexander',
    isScript: true,
    recommendedSize: 'grand',
    tagline: 'Flowing Contemporary Cursive'
  },
  {
    id: 'parisienne',
    name: 'Parisienne',
    category: 'Calligraphy Script',
    description: 'Whimsical French calligraphy inspired by 1920s Parisian couture typography.',
    cssClass: 'font-wedding-parisienne',
    previewText: 'Victoria & Alexander',
    isScript: true,
    recommendedSize: 'grand',
    tagline: 'French Romantic Charm'
  },
  {
    id: 'italianno',
    name: 'Italianno',
    category: 'Calligraphy Script',
    description: 'Slender, refined calligraphy reminiscent of hand-penned Tuscan parchment invitations.',
    cssClass: 'font-wedding-italianno',
    previewText: 'Victoria & Alexander',
    isScript: true,
    recommendedSize: 'majestic',
    tagline: 'Slender Tuscan Penmanship'
  },
  {
    id: 'cormorant',
    name: 'Cormorant Garamond',
    category: 'Classical Serif',
    description: 'The definitive heirloom stationery serif. High-contrast, timeless, and impeccably balanced.',
    cssClass: 'font-wedding-cormorant',
    previewText: 'VICTORIA & ALEXANDER',
    isScript: false,
    recommendedSize: 'classic',
    tagline: 'Timeless Heirloom Serif'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'Editorial & Vogue',
    description: 'Modern editorial luxury serif with dramatic curves and romantic ligatures. Beautiful in title case or italics.',
    cssClass: 'font-wedding-playfair',
    previewText: 'Victoria & Alexander',
    isScript: false,
    recommendedSize: 'classic',
    tagline: 'Vogue Editorial Luxury'
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    category: 'Imperial & Architectural',
    description: 'Classical Roman-inscribed antiqua capitals inspired by first-century epigraphy.',
    cssClass: 'font-wedding-cinzel',
    previewText: 'VICTORIA & ALEXANDER',
    isScript: false,
    recommendedSize: 'classic',
    tagline: 'Imperial Roman Chiseled'
  },
  {
    id: 'bodoni',
    name: 'Bodoni Moda',
    category: 'Editorial & Vogue',
    description: 'Dramatic Didone high-contrast serif favored by high fashion houses and luxury ateliers.',
    cssClass: 'font-wedding-bodoni',
    previewText: 'Victoria & Alexander',
    isScript: false,
    recommendedSize: 'classic',
    tagline: 'High-Contrast Haute Couture'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    category: 'Modern Minimalist',
    description: 'Clean, geometric, contemporary sans-serif with spacious tracking for sleek modern weddings.',
    cssClass: 'font-wedding-montserrat',
    previewText: 'VICTORIA & ALEXANDER',
    isScript: false,
    recommendedSize: 'compact',
    tagline: 'Geometric Contemporary'
  }
];

export interface WeddingFontPreset {
  name: string;
  desc: string;
  font: WeddingTitleFont;
  weight: WeddingTitleWeight;
  italic: boolean;
  transform: WeddingTitleTransform;
  tracking: 'normal' | 'wide' | 'wider' | 'widest';
  size: WeddingTitleSize;
}

export const WEDDING_TYPOGRAPHY_PRESETS: WeddingFontPreset[] = [
  {
    name: 'Fairytale Calligraphy',
    desc: 'Flowing romantic script with majestic scale',
    font: 'great-vibes',
    weight: 'normal',
    italic: false,
    transform: 'none',
    tracking: 'normal',
    size: 'majestic'
  },
  {
    name: 'Aristocratic Society',
    desc: 'Delicate Pinyon cursive with grand presence',
    font: 'pinyon',
    weight: 'normal',
    italic: false,
    transform: 'none',
    tracking: 'normal',
    size: 'majestic'
  },
  {
    name: 'Editorial Vogue',
    desc: 'Italic Playfair serif with romantic warmth',
    font: 'playfair',
    weight: 'normal',
    italic: true,
    transform: 'none',
    tracking: 'wide',
    size: 'classic'
  },
  {
    name: 'Imperial Roman Estate',
    desc: 'Cinzel capitals with spacious letter tracking',
    font: 'cinzel',
    weight: 'normal',
    italic: false,
    transform: 'uppercase',
    tracking: 'widest',
    size: 'classic'
  },
  {
    name: 'Traditional Fine Art',
    desc: 'Cormorant Garamond timeless stationery balance',
    font: 'cormorant',
    weight: 'normal',
    italic: false,
    transform: 'none',
    tracking: 'wide',
    size: 'classic'
  },
  {
    name: 'Parisian Couture',
    desc: 'Chic Parisienne script with soft romantic rhythm',
    font: 'parisienne',
    weight: 'normal',
    italic: false,
    transform: 'none',
    tracking: 'normal',
    size: 'grand'
  }
];

/**
 * Returns Tailwind/CSS classes for the title based on settings
 */
export function getWeddingTitleClasses(options?: {
  font?: WeddingTitleFont;
  weight?: WeddingTitleWeight;
  italic?: boolean;
  transform?: WeddingTitleTransform;
  tracking?: 'normal' | 'wide' | 'wider' | 'widest';
  size?: WeddingTitleSize;
}): string {
  const font = options?.font || 'cormorant';
  const weight = options?.weight || 'normal';
  const italic = options?.italic ?? false;
  const transform = options?.transform || 'none';
  const tracking = options?.tracking || (font === 'cinzel' ? 'wide' : 'normal');
  const size = options?.size || (isScriptFont(font) ? 'grand' : 'classic');

  // Font family
  let fontClass = 'font-wedding-cormorant';
  const found = WEDDING_TITLE_FONTS.find((f) => f.id === font);
  if (found) {
    fontClass = found.cssClass;
  }

  // Weight
  const weightClass =
    weight === 'light'
      ? 'font-light'
      : weight === 'medium'
      ? 'font-medium'
      : weight === 'semibold'
      ? 'font-semibold'
      : weight === 'bold'
      ? 'font-bold'
      : 'font-normal';

  // Italic (note: scripts are already cursive, italic is mainly for serifs)
  const italicClass = italic ? 'italic' : '';

  // Transform (uppercase is not recommended for cursive scripts)
  const isScript = isScriptFont(font);
  const transformClass =
    !isScript && transform === 'uppercase'
      ? 'uppercase'
      : !isScript && transform === 'capitalize'
      ? 'capitalize'
      : '';

  // Tracking
  const trackingClass =
    isScript
      ? 'tracking-normal'
      : tracking === 'widest'
      ? 'tracking-[0.25em]'
      : tracking === 'wider'
      ? 'tracking-[0.15em]'
      : tracking === 'wide'
      ? 'tracking-wider'
      : 'tracking-normal';

  // Size
  let sizeClass = 'text-4xl sm:text-6xl';
  if (size === 'compact') {
    sizeClass = isScript ? 'text-3xl sm:text-5xl' : 'text-3xl sm:text-5xl';
  } else if (size === 'classic') {
    sizeClass = isScript ? 'text-4xl sm:text-6xl' : 'text-4xl sm:text-6xl';
  } else if (size === 'grand') {
    sizeClass = isScript ? 'text-5xl sm:text-7xl leading-snug' : 'text-5xl sm:text-7xl leading-tight';
  } else if (size === 'majestic') {
    sizeClass = isScript ? 'text-6xl sm:text-8xl leading-tight' : 'text-5xl sm:text-7xl leading-tight';
  }

  return `${fontClass} ${weightClass} ${italicClass} ${transformClass} ${trackingClass} ${sizeClass}`.trim();
}

export function isScriptFont(fontKey?: WeddingTitleFont): boolean {
  return ['great-vibes', 'pinyon', 'alex-brush', 'parisienne', 'italianno'].includes(fontKey || '');
}
