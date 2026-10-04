import {
  EventConfig,
  WeddingTitleFont,
  WeddingTitleWeight,
  WeddingTitleTransform,
  WeddingTitleSize,
  DustyBlueFloralBorder,
  BurgundyFloralBorder
} from '../types';

export interface DustyBlueBorderOption {
  id: DustyBlueFloralBorder;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  botanicals: string[];
}

export interface BurgundyBorderOption {
  id: BurgundyFloralBorder;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  botanicals: string[];
}

export const BURGUNDY_BORDER_OPTIONS: BurgundyBorderOption[] = [
  {
    id: 'velvet-rose-ranunculus',
    name: 'Velvet English Rose & Ranunculus',
    subtitle: 'Damask Cabbage Rose & Spiraled Petals',
    badge: 'Signature',
    description: 'Opulent watercolor English cabbage roses in velvet cabernet and deep wine, spiraled ranunculus petals, blush rosebud clusters, and gilded rose-gold leaf veins.',
    botanicals: ['Velvet English Rose', 'Crimson Ranunculus', 'Blush Rosebuds', 'Rose-Gold Foil Veins']
  },
  {
    id: 'baroque-pomegranate-flora',
    name: 'Baroque Pomegranate & Black Baccara',
    subtitle: 'Midnight Crimson Roses & Gilded Pomegranate',
    badge: 'Baroque',
    description: 'Sumptuous black baccara roses with deep plum undertones, jewel-toned pomegranates with seeded accents, and ornate baroque gilded foliage.',
    botanicals: ['Black Baccara Rose', 'Jeweled Pomegranates', 'Dark Plum Foliage', 'Baroque Gold Tendrils']
  },
  {
    id: 'candlelit-peony-ivy',
    name: 'Candlelit Burgundy Peony & English Ivy',
    subtitle: 'Lush Wine Peonies & Cascading Ivy Garland',
    badge: 'Romantic',
    description: 'Billowing watercolor peonies in rich merlot and dusty mauve, cascading English ivy vines, soft candlelight aura washes, and warm rose-gold stardust.',
    botanicals: ['Merlot Tree Peony', 'Dusty Mauve Florets', 'Cascading English Ivy', 'Rose-Gold Stardust']
  },
  {
    id: 'dahlia-black-calla',
    name: 'Burgundy Dahlia & Wild Blackberry Vine',
    subtitle: 'Geometric Petal Dahlias & Ripe Blackberry Clusters',
    badge: 'Whimsical',
    description: 'Intricate pointed burgundy dahlia blossoms, wild thornless bramble vines with ripe indigo-crimson blackberries, and delicate dusty rose tea buds.',
    botanicals: ['Café Burgundy Dahlia', 'Bramble Blackberries', 'Wild Rose Hips', 'Gilded Filigree']
  },
  {
    id: 'none',
    name: 'Classic Minimal Rule',
    subtitle: 'Clean Inset Rose-Gold Stationery Line',
    badge: 'Minimal',
    description: 'Traditional double-rule rose gold and cabernet border without botanical floral overlays.',
    botanicals: ['Rose-Gold Inlay', 'Clean Stationery']
  }
];

export const DUSTY_BLUE_BORDER_OPTIONS: DustyBlueBorderOption[] = [
  {
    id: 'wisteria-hydrangea',
    name: 'Coastal Hydrangea & Wisteria',
    subtitle: 'Cascading Wisteria & French Hydrangea',
    badge: 'Signature',
    description: 'Layered slate blue hydrangea florets, cascading wisteria vines, and silvery sage foliage.',
    botanicals: ['French Hydrangea', 'Cascading Wisteria', 'Silver Sage', 'Gold Stardust']
  },
  {
    id: 'chateau-rose',
    name: 'Chateau Garden Rose & Olive',
    subtitle: 'English Garden Rose & Olive Foliage',
    badge: 'Romantic',
    description: 'Romantic watercolor tea roses, delicate olive branch sprigs, and French chateau corner scrolls.',
    botanicals: ['English Tea Roses', 'Olive Sprigs', 'Chateau Filigree', 'Dewdrops']
  },
  {
    id: 'ethereal-botanical',
    name: 'Ethereal Botanical Spray & Gold Crest',
    subtitle: 'Forget-Me-Nots & Gilded Filigree',
    badge: 'Heirloom',
    description: 'Delicate forget-me-nots, baby’s breath clusters, and an heirloom gold filigree floral crest.',
    botanicals: ['Forget-Me-Nots', "Baby's Breath", 'Gilded Crest', 'Fine Vines']
  },
  {
    id: 'anemone-eucalyptus',
    name: 'French Anemone & Silver Eucalyptus',
    subtitle: 'Porcelain Anemone & Silver Dollar Sprigs',
    badge: 'Botanical',
    description: 'Bespoke watercolor anemones with indigo centers, rounded silver dollar eucalyptus branches, and gilded stardust tendrils.',
    botanicals: ['French Anemone', 'Silver Dollar Eucalyptus', 'Sapphire Center', 'Gilded Tendrils']
  },
  {
    id: 'wildflower-delphinium',
    name: 'Meadow Delphinium & Bluebell Garland',
    subtitle: 'Spire Delphiniums & Drooping Bluebells',
    badge: 'Whimsical',
    description: 'Graceful spire blossoms of French delphinium, delicate bluebells, feathery meadow foliage, and gossamer watercolor washes.',
    botanicals: ['Spire Delphiniums', 'Meadow Bluebells', 'Feather Grass', 'Morning Dewdrops']
  },
  {
    id: 'none',
    name: 'Classic Minimal Rule',
    subtitle: 'Clean Inset Gold Stationery Line',
    badge: 'Minimal',
    description: 'Traditional double-rule gold border without botanical floral overlays.',
    botanicals: ['Double Gold Inlay', 'Clean Stationery']
  }
];

export interface WeddingThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryFaint: string;
  accent: string;
  accentLight: string;
  border: string;
  background: string;
  waxSealFrom: string;
  waxSealTo: string;
  waxSealBorder: string;
  textMuted: string;
  badgeBg: string;
}

export interface WeddingTheme {
  id: 'dusty-blue' | 'burgundy' | 'emerald' | 'navy' | 'champagne';
  key: string;
  name: string;
  subtitle: string;
  aesthetic: string;
  description: string;
  moodTags: string[];
  colors: WeddingThemeColors;
  typography: {
    font: WeddingTitleFont;
    fontName: string;
    weight: WeddingTitleWeight;
    transform: WeddingTitleTransform;
    tracking: 'normal' | 'wide' | 'wider' | 'widest';
    size: WeddingTitleSize;
    italic: boolean;
    pairingDescription: string;
  };
  atmosphere: {
    leavesStyle: 'gilded' | 'petals' | 'botanical' | 'mixed';
    leavesDensity: 'gentle' | 'medium' | 'lush';
    effectLabel: string;
    effectDescription: string;
  };
  imagery: {
    heroImage: string;
    bgImage: string;
    venueImg: string;
    churchImg: string;
  };
  audio: {
    title: string;
    url: string;
    notes: string;
  };
  details: {
    subHeader: string;
    invitationLine: string;
    venueEyebrow: string;
    venueTitle: string;
    venueSubtitle: string;
    churchEyebrow: string;
    churchTitle: string;
    churchSubtitle: string;
    giftSubtitle: string;
  };
}

export const WEDDING_THEMES: WeddingTheme[] = [
  {
    id: 'dusty-blue',
    key: 'wedding',
    name: 'Romantic Dusty Blue',
    subtitle: 'Coastal Slate & Heirloom Gold Filigree',
    aesthetic: 'French Chateau & Coastal Romance',
    description: 'Serene coastal grace featuring soft slate blue, delicate French wisteria, and refined gold filigree. Evokes the tranquil elegance of historic seaside estates and sunlit glasshouses.',
    moodTags: ['French Chateau', 'Coastal Slate', 'Gold Filigree', 'Serene Breeze'],
    colors: {
      primary: '#3A5A74',
      primaryDark: '#243C50',
      primaryLight: '#EBF2F7',
      primaryFaint: '#F4F8FA',
      accent: '#C5A059',
      accentLight: '#F7F1E4',
      border: '#C8D7E3',
      background: '#F0F4F8',
      waxSealFrom: '#5D7E98',
      waxSealTo: '#1E3447',
      waxSealBorder: '#243C50',
      textMuted: '#506173',
      badgeBg: '#3A5A74'
    },
    typography: {
      font: 'great-vibes',
      fontName: 'Great Vibes Script',
      weight: 'light',
      transform: 'none',
      tracking: 'normal',
      size: 'majestic',
      italic: false,
      pairingDescription: 'Great Vibes Calligraphy paired with Cormorant Garamond Serif'
    },
    atmosphere: {
      leavesStyle: 'gilded',
      leavesDensity: 'lush',
      effectLabel: 'Gilded Gold Leaves & Wisteria Petals',
      effectDescription: 'Floating golden leaves and gentle coastal wisteria petals drifting across the screen.'
    },
    imagery: {
      heroImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
      bgImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=80',
      venueImg: 'https://iili.io/nKVZvxp.jpg',
      churchImg: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80'
    },
    audio: {
      title: 'Romantic Harp & Classical Strings Prelude',
      url: 'https://mp3tourl.com/audio/1788958851227-5e1cfd51-4a86-4f84-87e3-dbfb9e2c57b9.mp3',
      notes: 'Gentle harp prelude and string serenade for the ceremonial welcome.'
    },
    details: {
      subHeader: 'Together with their families',
      invitationLine: 'Invite you to share in the joy of the marriage of',
      venueEyebrow: 'The Celebration Grounds',
      venueTitle: "Cai's Garden & Events",
      venueSubtitle: 'Join us amid timeless coastal gardens and candlelit historic halls.',
      churchEyebrow: 'The Holy Matrimony',
      churchTitle: 'The Church Ceremony',
      churchSubtitle: 'Join us as we exchange sacred vows and unite in holy matrimony.',
      giftSubtitle: 'Your presence and love on our special day are the greatest gifts of all. Should you wish to honor us with a gift, a monetary blessing is warmly appreciated.'
    }
  },
  {
    id: 'burgundy',
    key: 'burgundy',
    name: 'Royal Burgundy & Velvet Rose',
    subtitle: 'Deep Cabernet, Rose Gold & Candlelit Manor',
    aesthetic: 'Baroque Warmth & Evening Passion',
    description: 'Lavish candlelit warmth capturing rich Cabernet Sauvignon tones, deep scarlet rose petals, and shimmering rose gold accents. Perfect for romantic evening galas and historic ballrooms.',
    moodTags: ['Baroque Warmth', 'Velvet Crimson', 'Candlelit Manor', 'Rose Gold'],
    colors: {
      primary: '#7B1E34',
      primaryDark: '#521221',
      primaryLight: '#F5E5E8',
      primaryFaint: '#FAF0F2',
      accent: '#D4A373',
      accentLight: '#FBF4EC',
      border: '#DEC2C7',
      background: '#FBF3F4',
      waxSealFrom: '#9E2A44',
      waxSealTo: '#420A16',
      waxSealBorder: '#4A0E1A',
      textMuted: '#6D434B',
      badgeBg: '#7B1E34'
    },
    typography: {
      font: 'pinyon',
      fontName: 'Pinyon Script',
      weight: 'normal',
      transform: 'none',
      tracking: 'wide',
      size: 'majestic',
      italic: false,
      pairingDescription: 'Pinyon Royal Script paired with Playfair Display High-Contrast Serif'
    },
    atmosphere: {
      leavesStyle: 'petals',
      leavesDensity: 'lush',
      effectLabel: 'Falling Velvet Crimson Rose Petals',
      effectDescription: 'Romantic deep red and blush rose petals gracefully tumbling in the candlelight.'
    },
    imagery: {
      heroImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
      bgImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80',
      venueImg: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80',
      churchImg: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80'
    },
    audio: {
      title: 'Acoustic Cello & Piano Nocturne Prelude',
      url: 'https://mp3tourl.com/audio/1788958851227-5e1cfd51-4a86-4f84-87e3-dbfb9e2c57b9.mp3',
      notes: 'Warm, resonant cello and grand piano for a richly romantic evening celebration.'
    },
    details: {
      subHeader: 'In the presence of God and their cherished families',
      invitationLine: 'Joyfully request the honour of your presence at the nuptials of',
      venueEyebrow: 'The Candlelit Reception',
      venueTitle: 'The Grand Manor Ballroom',
      venueSubtitle: 'An evening of vintage champagne toasts, candlelit dining, and waltzing under chandeliers.',
      churchEyebrow: 'The Sacred Nuptials',
      churchTitle: 'The Chapel Ceremony',
      churchSubtitle: 'Where two souls pledge everlasting devotion under sacred candlelight and blessing.',
      giftSubtitle: 'Having you celebrate our love with us is the greatest blessing. Should you wish to bestow a gift, monetary blessings will help us build our new home.'
    }
  },
  {
    id: 'emerald',
    key: 'emerald',
    name: 'Botanical Emerald & Eucalyptus',
    subtitle: 'Verdant Garden, Wild Sage & Antique Brass',
    aesthetic: 'Glasshouse Conservatory & Organic Luxury',
    description: 'Fresh, organic elegance inspired by Victorian glasshouses and botanical gardens. Lush forest emeralds, soft sage leaves, and antique brass details bring the serenity of nature into your invitation.',
    moodTags: ['Botanical Garden', 'Eucalyptus Flora', 'Conservatory', 'Organic Gold'],
    colors: {
      primary: '#26533E',
      primaryDark: '#173627',
      primaryLight: '#E3ECE6',
      primaryFaint: '#F0F6F2',
      accent: '#B89758',
      accentLight: '#F7F3E9',
      border: '#C2D6CA',
      background: '#F0F5F2',
      waxSealFrom: '#3C775C',
      waxSealTo: '#163325',
      waxSealBorder: '#142E21',
      textMuted: '#486354',
      badgeBg: '#26533E'
    },
    typography: {
      font: 'alex-brush',
      fontName: 'Alex Brush Script',
      weight: 'normal',
      transform: 'none',
      tracking: 'normal',
      size: 'majestic',
      italic: false,
      pairingDescription: 'Alex Brush Natural Calligraphy paired with Cormorant Garamond Serif'
    },
    atmosphere: {
      leavesStyle: 'botanical',
      leavesDensity: 'lush',
      effectLabel: 'Drifting Eucalyptus & Sage Leaves',
      effectDescription: 'Organic silver dollar eucalyptus, olive branch foliage, and fresh botanical sprigs.'
    },
    imagery: {
      heroImage: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
      bgImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1920&q=80',
      venueImg: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
      churchImg: 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80'
    },
    audio: {
      title: 'Woodland Harp & Acoustic Pastoral Prelude',
      url: 'https://mp3tourl.com/audio/1788958851227-5e1cfd51-4a86-4f84-87e3-dbfb9e2c57b9.mp3',
      notes: 'Airy acoustic strings and pastoral melodies evocative of blooming outdoor gardens.'
    },
    details: {
      subHeader: 'Under the canopy of God’s grace and surrounded by nature',
      invitationLine: 'Cordially invite you to celebrate the holy union of',
      venueEyebrow: 'The Botanical Conservatory',
      venueTitle: 'The Glasshouse Orangery',
      venueSubtitle: 'Feast and celebrate amid fragrant wisteria, olive trees, and hanging botanical flora.',
      churchEyebrow: 'The Holy Matrimony',
      churchTitle: 'The Church Sanctuary',
      churchSubtitle: 'Surrounded by sacred blessings, organic greenery, and joyous prayers of loved ones.',
      giftSubtitle: 'Your love and presence in our lives are our deepest joy. Monetary gifts toward our future adventures together are warmly and gratefully received.'
    }
  },
  {
    id: 'navy',
    key: 'navy',
    name: 'Midnight Navy & Celestial Gold',
    subtitle: 'Starlit Gala, Deep Indigo & Shimmering Gold',
    aesthetic: 'Black-Tie Splendor & Starlit Luxury',
    description: 'Dramatic black-tie magnificence tailored for twilight ceremonies and evening grand galas. Deep midnight navy meets glistening celestial gold for a truly unforgettable celebration.',
    moodTags: ['Starlit Gala', 'Midnight Indigo', 'Celestial Gold', 'Black-Tie Luxury'],
    colors: {
      primary: '#1E2B4A',
      primaryDark: '#101728',
      primaryLight: '#E2E7F2',
      primaryFaint: '#F0F3F9',
      accent: '#DFB251',
      accentLight: '#FDF7E7',
      border: '#BDC8DD',
      background: '#EEF1F7',
      waxSealFrom: '#2C3E6B',
      waxSealTo: '#0F1729',
      waxSealBorder: '#0D1525',
      textMuted: '#4A5B7D',
      badgeBg: '#1E2B4A'
    },
    typography: {
      font: 'cinzel',
      fontName: 'Cinzel Roman Display',
      weight: 'medium',
      transform: 'uppercase',
      tracking: 'wider',
      size: 'classic',
      italic: false,
      pairingDescription: 'Cinzel Classical Roman Capitals paired with Bodoni Moda Modern Serif'
    },
    atmosphere: {
      leavesStyle: 'gilded',
      leavesDensity: 'lush',
      effectLabel: 'Celestial Stardust & Gold Flakes',
      effectDescription: 'Shimmering metallic gold leaf particles and starlight confetti falling through the night.'
    },
    imagery: {
      heroImage: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=800&q=80',
      bgImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1920&q=80',
      venueImg: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80',
      churchImg: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80'
    },
    audio: {
      title: 'Grand Chamber Orchestra & Starlight Waltz',
      url: 'https://mp3tourl.com/audio/1788958851227-5e1cfd51-4a86-4f84-87e3-dbfb9e2c57b9.mp3',
      notes: 'Majestic classical waltz orchestrations for a regal evening grand banquet.'
    },
    details: {
      subHeader: 'Under a canopy of starlight and eternal devotion',
      invitationLine: 'Request the honour of your presence at the black-tie celebration of',
      venueEyebrow: 'The Starlight Pavilion',
      venueTitle: 'The Imperial Grand Ballroom',
      venueSubtitle: 'An evening of starlit waltzes, midnight toasts, and luminous memories under chandeliers.',
      churchEyebrow: 'The Cathedral Nuptials',
      churchTitle: 'The Cathedral Sanctuary',
      churchSubtitle: 'A majestic cathedral procession under stained glass, organ hymns, and solemn vows.',
      giftSubtitle: 'Your fellowship and prayers are treasured above all. If you wish to bless us with a monetary gift, we receive it with heartfelt gratitude.'
    }
  },
  {
    id: 'champagne',
    key: 'champagne',
    name: 'Timeless Champagne & Rose Gold',
    subtitle: 'Tuscan Sunlight, Warm Cashmere & Heirloom Ivory',
    aesthetic: 'Tuscan Sun & Heirloom Quiet Luxury',
    description: 'Warm minimalist romance inspired by golden hour in Tuscany. Soft champagne bronze, blush ivory, and subtle rose gold create an heirloom, quiet luxury atmosphere brimming with warmth.',
    moodTags: ['Tuscan Sun', 'Champagne Glow', 'Heirloom Ivory', 'Quiet Luxury'],
    colors: {
      primary: '#8C6D4F',
      primaryDark: '#5E4731',
      primaryLight: '#F3EDE2',
      primaryFaint: '#FBF8F3',
      accent: '#C49A78',
      accentLight: '#F9F2EB',
      border: '#E0D4C3',
      background: '#F9F6F0',
      waxSealFrom: '#B89371',
      waxSealTo: '#61442B',
      waxSealBorder: '#523821',
      textMuted: '#6B5441',
      badgeBg: '#8C6D4F'
    },
    typography: {
      font: 'parisienne',
      fontName: 'Parisienne French Script',
      weight: 'normal',
      transform: 'none',
      tracking: 'normal',
      size: 'majestic',
      italic: false,
      pairingDescription: 'Parisienne French Romance Script paired with Cormorant Garamond Serif'
    },
    atmosphere: {
      leavesStyle: 'mixed',
      leavesDensity: 'medium',
      effectLabel: 'Champagne Silk Petals & Sunlit Gold',
      effectDescription: 'Warm ivory rose petals, blush peony leaves, and golden sunlight dust.'
    },
    imagery: {
      heroImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
      bgImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1920&q=80',
      venueImg: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=1200&q=80',
      churchImg: 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80'
    },
    audio: {
      title: 'Golden Hour Acoustic Romance & Jazz Prelude',
      url: 'https://mp3tourl.com/audio/1788958851227-5e1cfd51-4a86-4f84-87e3-dbfb9e2c57b9.mp3',
      notes: 'Warm acoustic fingerpicking and delicate romantic harmonies inspired by golden sunsets.'
    },
    details: {
      subHeader: 'With joyful hearts and the blessings of their families',
      invitationLine: 'Invite you to celebrate their union and the exchange of sacred vows',
      venueEyebrow: 'The Vineyard Villa',
      venueTitle: 'The Tuscan Olive Groves & Terrace',
      venueSubtitle: 'Celebrate with vintage wines, artisan delicacies, and golden sunset vistas over rolling hills.',
      churchEyebrow: 'The Chapel Benediction',
      churchTitle: 'The Sunlit Chapel',
      churchSubtitle: 'A sunlit chapel ceremony surrounded by family blessings, floral wreaths, and joyous hymns.',
      giftSubtitle: 'Your love, presence, and laughter are the most cherished gifts of all. Should you wish to bestow a monetary gift, we express our heartfelt thanks.'
    }
  }
];

export function getWeddingTheme(idOrKey?: string): WeddingTheme {
  const match = WEDDING_THEMES.find(
    (t) => t.id === idOrKey || t.key === idOrKey
  );
  return match || WEDDING_THEMES[0];
}

/**
 * Builds an updated EventConfig by applying a selected WeddingTheme
 * with option to apply full preset or preserve user's personal texts & images.
 */
export function applyThemeToConfig(
  currentConfig: EventConfig,
  theme: WeddingTheme,
  applyMode: 'full' | 'style-only' = 'style-only'
): EventConfig {
  const updated: EventConfig = {
    ...currentConfig,
    themeColor: theme.id,
    titleFont: theme.typography.font,
    titleWeight: theme.typography.weight,
    titleItalic: theme.typography.italic,
    titleTransform: theme.typography.transform,
    titleTracking: theme.typography.tracking,
    titleSize: theme.typography.size,
    leavesStyle: theme.atmosphere.leavesStyle,
    leavesDensity: theme.atmosphere.leavesDensity,
    leavesAnimationEnabled: currentConfig.leavesAnimationEnabled !== false,
    dustyBlueFloralBorder:
      theme.id === 'dusty-blue'
        ? (currentConfig.dustyBlueFloralBorder || 'wisteria-hydrangea')
        : currentConfig.dustyBlueFloralBorder,
    burgundyFloralBorder:
      theme.id === 'burgundy'
        ? (currentConfig.burgundyFloralBorder || 'velvet-rose-ranunculus')
        : currentConfig.burgundyFloralBorder
  };

  if (applyMode === 'full') {
    updated.name = `${theme.name} Wedding`;
    updated.bgImage = theme.imagery.bgImage;
    if (theme.imagery.heroImage) {
      updated.heroImage = theme.imagery.heroImage;
    }
    if (theme.audio.url) {
      updated.audioUrl = theme.audio.url;
    }
    updated.subHeader = theme.details.subHeader;
    updated.invitationLine = theme.details.invitationLine;
    updated.venueEyebrow = theme.details.venueEyebrow;
    updated.venueSubtitle = theme.details.venueSubtitle;
    updated.churchEyebrow = theme.details.churchEyebrow;
    updated.churchSubtitle = theme.details.churchSubtitle;
    updated.giftSubtitle = theme.details.giftSubtitle;
  }

  return updated;
}
