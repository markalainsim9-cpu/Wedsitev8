export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  attending: 'yes' | 'no';
  count: number;
  song?: string;
  table: string;
  seat: string;
  note?: string;
  createdAt: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  is_checked_in?: boolean;
  checked_in_at?: string;
  arrivedAt?: string;
  expectedArrivalTime?: string;
  expectedArrival?: string;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  relationship?: string;
  createdAt: string;
  timestamp?: number;
  imageUrl?: string;
  videoUrl?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  isFeatured?: boolean;
  featuredAt?: string | number;
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  desc: string;
}

export interface InvitationSlide {
  id: string;
  url: string;
  title?: string;
  caption?: string;
}

export interface GiftQrItem {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrImage: string;
  notes?: string;
}

export interface EventConfig {
  name: string;
  logoText: string;
  logoIcon: string;
  subHeader: string;
  subHeaderEnabled?: boolean;
  invitationLine?: string;
  title: string;
  description: string;
  countdownTitle?: string;
  timezone?: string;
  date: string;
  time: string;
  venue: string;
  venueEnabled?: boolean;
  venueEyebrow?: string;
  venueTitle?: string;
  venueSubtitle?: string;
  address: string;
  venueImg: string;
  mapLink: string;
  venueNotes?: string;
  deadline: string;
  rsvpDeadline?: string;
  targetDate: string;
  // Formal Invitation Slideshow Suite
  invitationEnabled?: boolean;
  invitationEyebrow?: string;
  invitationTitle?: string;
  invitationSubtitle?: string;
  invitationImages?: (string | InvitationSlide)[];
  // Wedding Church & Ceremony Venue Details
  churchEnabled?: boolean;
  churchEyebrow?: string;
  churchTitle?: string;
  churchSubtitle?: string;
  churchName?: string;
  churchTime?: string;
  churchAddress?: string;
  churchImg?: string;
  churchMapLink?: string;
  churchNotes?: string;

  // Romantic Keepsake Guestbook
  guestbookEnabled?: boolean;
  guestbookPostingEnabled?: boolean;
  guestbookEyebrow?: string;
  guestbookTitle?: string;
  guestbookSubtitle?: string;

  // Dedicated Video Blessings & Keepsakes Suite (Cloudflare R2)
  videoBlessingsEnabled?: boolean;
  videoBlessingsPostingEnabled?: boolean;
  videoBlessingsEyebrow?: string;
  videoBlessingsTitle?: string;
  videoBlessingsSubtitle?: string;

  // Gift & QR Display Registry Suite
  giftEnabled?: boolean;
  giftEyebrow?: string;
  giftTitle?: string;
  giftSubtitle?: string;
  giftQrImage?: string;
  giftBankName?: string;
  giftAccountName?: string;
  giftAccountNumber?: string;
  giftNotes?: string;
  giftQrList?: GiftQrItem[];

  // Host Dashboard Access Security
  hostPassword?: string;

  heroImage?: string;
  bgImage: string;
  audioUrl: string;
  themeColor: 'dusty-blue' | 'burgundy' | 'emerald' | 'navy' | 'champagne';
  timeline: TimelineItem[];
  totalTables: number;
  seatsPerTable: number;

  // Romantic Falling Leaves & Petals Animation & Atmosphere Studio
  leavesAnimationEnabled?: boolean;
  leavesStyle?: LeavesStyle;
  leavesDensity?: LeavesDensity;
  atmosphereLighting?: AtmosphereLighting;
  leavesWindDirection?: LeavesWindDirection;
  leavesScale?: LeavesScale;

  // Main Celebration Title Typography Customization for Wedding Theme
  titleFont?: WeddingTitleFont;
  titleWeight?: WeddingTitleWeight;
  titleItalic?: boolean;
  titleTransform?: WeddingTitleTransform;
  titleTracking?: 'normal' | 'wide' | 'wider' | 'widest';
  titleSize?: WeddingTitleSize;

  // Subtle Watercolor Floral Border Variations specifically for Dusty Blue Theme
  dustyBlueFloralBorder?: DustyBlueFloralBorder;

  // Subtle Watercolor Floral Border Variations specifically for Burgundy & Velvet Rose Theme
  burgundyFloralBorder?: BurgundyFloralBorder;
}

export type LeavesStyle =
  | 'mixed'
  | 'botanical'
  | 'petals'
  | 'gilded'
  | 'cherry-blossom'
  | 'celestial-stardust'
  | 'candlelit-lantern'
  | 'lavender-wildflower'
  | 'autumn-maple'
  | 'snow-crystal';

export type LeavesDensity = 'whisper' | 'gentle' | 'medium' | 'lush' | 'blizzard';

export type AtmosphereLighting =
  | 'none'
  | 'candlelight'
  | 'golden-hour'
  | 'twilight-fairy'
  | 'rose-quartz'
  | 'enchanted-mist';

export type LeavesWindDirection = 'calm' | 'breeze-right' | 'breeze-left' | 'swirling';
export type LeavesScale = 'delicate' | 'natural' | 'statement';

export type DustyBlueFloralBorder =
  | 'wisteria-hydrangea'
  | 'chateau-rose'
  | 'ethereal-botanical'
  | 'anemone-eucalyptus'
  | 'wildflower-delphinium'
  | 'none';

export type BurgundyFloralBorder =
  | 'velvet-rose-ranunculus'
  | 'baroque-pomegranate-flora'
  | 'candlelit-peony-ivy'
  | 'dahlia-black-calla'
  | 'none';

export type WeddingTitleFont =
  | 'cormorant'
  | 'great-vibes'
  | 'pinyon'
  | 'alex-brush'
  | 'parisienne'
  | 'italianno'
  | 'playfair'
  | 'cinzel'
  | 'bodoni'
  | 'montserrat';

export type WeddingTitleWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
export type WeddingTitleTransform = 'none' | 'uppercase' | 'capitalize';
export type WeddingTitleSize = 'compact' | 'classic' | 'grand' | 'majestic';

export type SupabaseRedundancyMode = 'disabled' | 'failover' | 'mirror';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  mode: SupabaseRedundancyMode;
  autoFailover: boolean;
  lastSyncTime?: string;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
}

export interface FirebaseAccountDetails {
  projectId: string;
  firestoreDatabaseId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  oAuthClientId?: string;
  plan: string;
  consoleUrl: string;
  databaseMode: string;
}

export interface SupabaseRedundancyPolicy {
  mode: SupabaseRedundancyMode;
  autoFailover: boolean;
  projectRef?: string;
  policyDescription: string;
  failoverTriggers: string[];
  synchronizedTables: string[];
  syncStrategy: string;
}

export interface SupabaseAccountSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  mode: SupabaseRedundancyMode;
  autoFailover: boolean;
  redundancyPolicy: SupabaseRedundancyPolicy;
  lastSyncTime?: string;
}

export interface ImageKitAccountSettings {
  publicKey: string;
  urlEndpoint: string;
  privateKey?: string;
  configured: boolean;
  uploadFolder: string;
  cdnOptimization: string;
}

export interface R2AccountSettings {
  accountId: string;
  accessKeyId: string;
  secretAccessKey?: string;
  bucketName: string;
  publicUrl?: string;
  configured: boolean;
  uploadFolder: string;
  deliveryType: string;
}

export interface CloudAccountSettings {
  version?: string;
  exportedAt?: string;
  firebase: FirebaseAccountDetails;
  supabase: SupabaseAccountSettings;
  imagekit: ImageKitAccountSettings;
  r2?: R2AccountSettings;
}

/**
 * Normalizes gift QR items from config, supporting both multiple QR codes
 * and legacy single-QR configurations seamlessly.
 */
export function getNormalizedGiftQrList(config: Partial<EventConfig>): GiftQrItem[] {
  if (Array.isArray(config.giftQrList) && config.giftQrList.length > 0) {
    return config.giftQrList;
  }

  // Fallback to single QR legacy properties
  const defaultBank = config.giftBankName || 'GCash';
  const defaultAccount = config.giftAccountName || 'Mark Alain Sim & Karla';
  const defaultNumber = config.giftAccountNumber || '0917-888-2027';
  const defaultImage =
    config.giftQrImage ||
    'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80';
  const defaultNotes =
    config.giftNotes ||
    'Kindly include your name in the payment reference or message so we can express our deepest gratitude!';

  return [
    {
      id: 'qr_primary',
      bankName: defaultBank,
      accountName: defaultAccount,
      accountNumber: defaultNumber,
      qrImage: defaultImage,
      notes: defaultNotes,
    },
  ];
}
