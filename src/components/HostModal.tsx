import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Lock, 
  List, 
  Armchair as ChairIcon, 
  Upload, 
  Download, 
  LogOut, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Clock,
  MapPin,
  Music,
  Save,
  Check,
  HelpCircle,
  Volume2,
  Type,
  Timer,
  RefreshCw,
  Church,
  Info,
  Copy,
  Globe,
  Code,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ExternalLink,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  ScrollText,
  Cloud,
  CloudUpload,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Settings,
  Search,
  CheckSquare,
  Square,
  MinusSquare,
  ArrowUpDown,
  Filter,
  Users,
  UserX,
  Leaf,
  BookOpen,
  Heart,
  Pin,
  MessageSquare,
  ArrowRightLeft,
  Layers,
  QrCode,
  Gift,
  Phone,
  Mail,
  Smartphone,
  CreditCard,
  Film,
  Camera,
  Maximize2,
  Palette,
  UserCheck,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Guest, EventConfig, TimelineItem, InvitationSlide, WeddingTitleFont, WeddingTitleWeight, WeddingTitleTransform, WeddingTitleSize, GuestbookEntry, CloudAccountSettings, GiftQrItem, getNormalizedGiftQrList } from '../types';
import { exportGuestsToCsv, exportPendingGuestsToCsv, exportGuestbookToCsv, exportMediaKeepsakesToCsv, downloadSampleCsvTemplate, parseGuestCsv } from '../utils/csv';
import { CloudSettingsModal } from './CloudSettingsModal';
import { HostThemesSection } from './HostThemesSection';
import { parseBackupData, applyRestoreData } from '../utils/backupRestore';
import { VideoBlessingPlayer } from './VideoBlessingPlayer';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { testFirestoreConnection, firebaseConfig, firebaseAppletConfigRaw } from '../lib/firebase';
import { EVENT_PRESETS, INITIAL_CLOUD_SETTINGS } from '../data/presets';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, saveSupabaseCredentials } from '../lib/supabase';
import { saveImageKitCredentials } from '../lib/imagekitClient';
import { checkImageKitStatus as fetchSafeImageKitStatus, uploadImageToImageKit, ImageKitStatus } from '../lib/imagekitClient';
import { 
  WEDDING_TITLE_FONTS, 
  WEDDING_TYPOGRAPHY_PRESETS, 
  getWeddingTitleClasses, 
  isScriptFont,
  WeddingFontPreset
} from '../utils/weddingFonts';
import { SUPPORTED_TIMEZONES, getEventTargetTimestamp, formatInEventTimezone } from '../utils/timezone';
import { 
  getTableOccupiedSeats, 
  getTableAvailableSeats, 
  getAvailableSeatOptions, 
  getFirstAvailableSeat 
} from '../utils/seating';

interface HostModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  onUpdateGuest: (updatedGuest: Guest) => void;
  onDeleteGuest: (guestId: string) => void;
  onDeleteGuests?: (guestIds: string[]) => void;
  onAddGuest: (newGuest: Omit<Guest, 'id' | 'createdAt'>) => void;
  onImportGuests: (imported: Partial<Guest>[]) => void;
  config: EventConfig;
  onSaveConfig: (newConfig: EventConfig) => void;
  onSaveGuests?: (newGuests: Guest[]) => void;
  onResetToDefaults?: () => void;
  isCloudConnected?: boolean;
  guestbookEntries?: GuestbookEntry[];
  onDeleteGuestbookEntry?: (id: string, entryData?: Partial<GuestbookEntry>) => Promise<void> | void;
  onAddGuestbookEntry?: (entry: Omit<GuestbookEntry, 'id'>) => Promise<void> | void;
  onToggleFeatureGuestbookEntry?: (id: string, isFeatured: boolean) => Promise<void> | void;
}

const SAMPLE_HERO_PHOTOS = [
  {
    label: 'Romantic Garden Couple',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80'
  },
  {
    label: 'Ceremony Elegance',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
  },
  {
    label: 'Holding Hands & Rings',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80'
  },
  {
    label: 'Evening Twilight Gala',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80'
  }
];

const SAMPLE_CHURCH_PHOTOS = [
  {
    label: "St. Mary's Sanctuary",
    url: 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Cathedral Nave',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Stone Country Chapel',
    url: 'https://images.unsplash.com/photo-1543872084-c7bd3822856f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Historic Church Facade',
    url: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80'
  }
];

const SAMPLE_VENUE_PHOTOS = [
  {
    label: 'Glasshouse Orangery',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Coastal Rosewood Manor',
    url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Garden Pavilion',
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Estate Ballroom',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80'
  }
];

const SAMPLE_SUBHEADERS = [
  'Together with their families',
  'With joyful hearts',
  'Mr. & Mrs. Sim invite you',
  'In the presence of God & loved ones'
];

const SAMPLE_INVITATION_LINES = [
  'Request the honour of your presence at the marriage of',
  'Cordially invite you to celebrate the wedding of',
  'Invite you to share in the joy of the marriage of',
  'Request the pleasure of your company at the celebration of'
];

const SAMPLE_DESCRIPTIONS = [
  'Request the honour of your presence at their marriage and to celebrate the beginning of their forever under the starlit glasshouse.',
  'Join us as we exchange sacred vows and celebrate our love surrounded by our dearest family and friends.',
  'We invite you to celebrate our wedding day with laughter, dining, and dancing under the stars.'
];

const SAMPLE_COUNTDOWN_TITLES = [
  'Countdown to the Sacred Celebration',
  'Counting Down to Forever',
  'Until We Say I Do',
  'Days Until The Celebration'
];

export const HostModal: React.FC<HostModalProps> = ({
  isOpen,
  onClose,
  guests,
  onUpdateGuest,
  onDeleteGuest,
  onDeleteGuests,
  onAddGuest,
  onImportGuests,
  config,
  onSaveConfig,
  onSaveGuests,
  onResetToDefaults,
  isCloudConnected = true,
  guestbookEntries = [],
  onDeleteGuestbookEntry,
  onAddGuestbookEntry,
  onToggleFeatureGuestbookEntry
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('rsvp_host_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Password Changer State for Host Management & Control
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<string | null>(null);

  const [view, setView] = useState<'list' | 'summary' | 'seating' | 'operations' | 'invitation' | 'slideshow' | 'qr-display' | 'guestbook' | 'media' | 'themes'>('list');
  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState(false);
  const [cloudSettingsInitialTab, setCloudSettingsInitialTab] = useState<'firebase' | 'supabase' | 'imagekit' | 'r2' | 'backup'>('firebase');

  // Categorize entries into Written Wishes vs. Media Keepsakes (Videos & Images)
  const writtenGuestbookEntries = useMemo(() => {
    return guestbookEntries.filter((e) => e && e.id && !e.videoUrl && !e.imageUrl);
  }, [guestbookEntries]);

  const mediaKeepsakeEntries = useMemo(() => {
    return guestbookEntries.filter((e) => e && e.id && (Boolean(e.videoUrl) || Boolean(e.imageUrl)));
  }, [guestbookEntries]);

  const mediaVideoEntries = useMemo(() => {
    return mediaKeepsakeEntries.filter((e) => Boolean(e.videoUrl));
  }, [mediaKeepsakeEntries]);

  const mediaPhotoEntries = useMemo(() => {
    return mediaKeepsakeEntries.filter((e) => Boolean(e.imageUrl));
  }, [mediaKeepsakeEntries]);

  // Media Keepsakes Management State (Videos in R2, Photos in ImageKit)
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [mediaRelationshipFilter, setMediaRelationshipFilter] = useState('all');
  const [selectedMediaLightboxPhoto, setSelectedMediaLightboxPhoto] = useState<{
    url: string;
    authorName?: string;
    relationship?: string;
    caption?: string;
    createdAt?: string;
  } | null>(null);
  const [copiedMediaId, setCopiedMediaId] = useState<string | null>(null);

  const handleToggleVideoBlessingsPosting = () => {
    const nextPosting = config.videoBlessingsPostingEnabled === false ? true : false;
    const updated = {
      ...config,
      videoBlessingsPostingEnabled: nextPosting
    };
    onSaveConfig(updated);
    setFormData((prev) => ({ ...prev, videoBlessingsPostingEnabled: nextPosting }));
  };

  const handleToggleVideoBlessingsSection = () => {
    const nextEnabled = config.videoBlessingsEnabled === false ? true : false;
    const updated = {
      ...config,
      videoBlessingsEnabled: nextEnabled
    };
    onSaveConfig(updated);
    setFormData((prev) => ({ ...prev, videoBlessingsEnabled: nextEnabled }));
  };

  // Keepsake Video & Photo Blessings Section Header Customization State
  const [mediaHeaderEyebrow, setMediaHeaderEyebrow] = useState<string>(
    config.videoBlessingsEyebrow || 'Cinematic & Photographic Keepsakes'
  );
  const [mediaHeaderTitle, setMediaHeaderTitle] = useState<string>(
    config.videoBlessingsTitle || 'Video & Photo Blessings'
  );
  const [mediaHeaderSubtitle, setMediaHeaderSubtitle] = useState<string>(
    config.videoBlessingsSubtitle ||
    'Record a live toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla.'
  );
  const [isMediaHeaderCustomizerOpen, setIsMediaHeaderCustomizerOpen] = useState(false);
  const [mediaHeaderSavedToast, setMediaHeaderSavedToast] = useState(false);

  // Synchronize media header state with external config updates
  useEffect(() => {
    if (config.videoBlessingsEyebrow !== undefined) {
      setMediaHeaderEyebrow(config.videoBlessingsEyebrow || 'Cinematic & Photographic Keepsakes');
    }
    if (config.videoBlessingsTitle !== undefined) {
      setMediaHeaderTitle(config.videoBlessingsTitle || 'Video & Photo Blessings');
    }
    if (config.videoBlessingsSubtitle !== undefined) {
      setMediaHeaderSubtitle(
        config.videoBlessingsSubtitle ||
        'Record a live toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla.'
      );
    }
  }, [config.videoBlessingsEyebrow, config.videoBlessingsTitle, config.videoBlessingsSubtitle]);

  const handleSaveMediaHeader = (customEyebrow?: string, customTitle?: string, customSubtitle?: string) => {
    const finalEyebrow = (customEyebrow !== undefined ? customEyebrow : mediaHeaderEyebrow).trim() || 'Cinematic & Photographic Keepsakes';
    const finalTitle = (customTitle !== undefined ? customTitle : mediaHeaderTitle).trim() || 'Video & Photo Blessings';
    const finalSubtitle = (customSubtitle !== undefined ? customSubtitle : mediaHeaderSubtitle).trim() || 'Record a live toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla.';

    const updated: EventConfig = {
      ...config,
      ...formData,
      videoBlessingsEyebrow: finalEyebrow,
      videoBlessingsTitle: finalTitle,
      videoBlessingsSubtitle: finalSubtitle
    };

    onSaveConfig(updated);
    setFormData((prev) => ({
      ...prev,
      videoBlessingsEyebrow: finalEyebrow,
      videoBlessingsTitle: finalTitle,
      videoBlessingsSubtitle: finalSubtitle
    }));
    setMediaHeaderEyebrow(finalEyebrow);
    setMediaHeaderTitle(finalTitle);
    setMediaHeaderSubtitle(finalSubtitle);

    setMediaHeaderSavedToast(true);
    setTimeout(() => setMediaHeaderSavedToast(false), 3500);
  };

  const handleResetMediaHeader = () => {
    const defaultEyebrow = 'Cinematic & Photographic Keepsakes';
    const defaultTitle = 'Video & Photo Blessings';
    const defaultSubtitle = 'Record a live toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla.';
    handleSaveMediaHeader(defaultEyebrow, defaultTitle, defaultSubtitle);
  };

  // Guestbook Management State
  const [guestbookSearch, setGuestbookSearch] = useState('');
  const [guestbookFilter, setGuestbookFilter] = useState('all');
  const [deleteWishConfirm, setDeleteWishConfirm] = useState<GuestbookEntry | null>(null);
  const [isDeletingWish, setIsDeletingWish] = useState(false);
  const [isAddWishModalOpen, setIsAddWishModalOpen] = useState(false);
  const [newWishName, setNewWishName] = useState('');
  const [newWishRelationship, setNewWishRelationship] = useState('');
  const [newWishMessage, setNewWishMessage] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [copiedWishId, setCopiedWishId] = useState<string | null>(null);

  const handleToggleGuestbookPosting = () => {
    const nextPosting = config.guestbookPostingEnabled === false ? true : false;
    const updated = {
      ...config,
      guestbookPostingEnabled: nextPosting
    };
    onSaveConfig(updated);
    setFormData((prev) => ({ ...prev, guestbookPostingEnabled: nextPosting }));
  };

  const handleToggleGuestbookSection = () => {
    const nextEnabled = config.guestbookEnabled === false ? true : false;
    const updated = {
      ...config,
      guestbookEnabled: nextEnabled
    };
    onSaveConfig(updated);
    setFormData((prev) => ({ ...prev, guestbookEnabled: nextEnabled }));
  };

  const handleConfirmDeleteWish = async () => {
    if (!deleteWishConfirm || !onDeleteGuestbookEntry) return;
    setIsDeletingWish(true);
    try {
      await onDeleteGuestbookEntry(deleteWishConfirm.id, deleteWishConfirm);
      setDeleteWishConfirm(null);
    } catch (err) {
      console.error('Failed to delete guestbook wish:', err);
    } finally {
      setIsDeletingWish(false);
    }
  };

  const handleCreateHostWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishName.trim() || !newWishMessage.trim() || !onAddGuestbookEntry) return;
    setIsSubmittingWish(true);
    try {
      await onAddGuestbookEntry({
        name: newWishName.trim(),
        relationship: newWishRelationship.trim() || 'Host / Newlywed',
        message: newWishMessage.trim(),
        createdAt: new Date().toISOString()
      });
      setNewWishName('');
      setNewWishRelationship('');
      setNewWishMessage('');
      setIsAddWishModalOpen(false);
    } catch (err) {
      console.error('Failed to add wish:', err);
    } finally {
      setIsSubmittingWish(false);
    }
  };

  const handleCopyWish = (wish: GuestbookEntry) => {
    navigator.clipboard.writeText(`"${wish.message}" — ${wish.name} (${wish.relationship || 'Well-Wisher'})`);
    setCopiedWishId(wish.id);
    setTimeout(() => setCopiedWishId(null), 2500);
  };

  const [togglingWishId, setTogglingWishId] = useState<string | null>(null);

  const handleToggleFeatureWish = async (wish: GuestbookEntry) => {
    if (!onToggleFeatureGuestbookEntry) return;
    const nextStatus = !wish.isFeatured;
    setTogglingWishId(wish.id);
    try {
      await onToggleFeatureGuestbookEntry(wish.id, nextStatus);
    } catch (err) {
      console.error('Failed to toggle featured status of wish:', err);
    } finally {
      setTogglingWishId(null);
    }
  };

  // Text size preference for enhanced reading comfort
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    try {
      const saved = localStorage.getItem('rsvp_host_text_size');
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'large'; // Default to large so text is immediately easy to read
  });

  const handleTextSizeChange = (size: 'normal' | 'large' | 'xlarge') => {
    setTextSize(size);
    try {
      localStorage.setItem('rsvp_host_text_size', size);
    } catch (e) {
      // ignore
    }
  };

  // Edit single guest state
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Add new guest modal state
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [newGuestData, setNewGuestData] = useState<Omit<Guest, 'id' | 'createdAt'>>({
    name: '',
    phone: '',
    email: '',
    attending: 'yes',
    count: 1,
    table: 'Table 1',
    seat: 'Seat 1',
    song: '',
    note: ''
  });

  // Invitation Customization Form Data (Synchronized with config)
  const [formData, setFormData] = useState<EventConfig>({ ...config });
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedPresetCode, setCopiedPresetCode] = useState(false);
  const [copiedPresetsFile, setCopiedPresetsFile] = useState(false);
  const [downloadedPresetsFile, setDownloadedPresetsFile] = useState(false);
  const [downloadedJsonBackup, setDownloadedJsonBackup] = useState(false);
  const [isTestingLiveDb, setIsTestingLiveDb] = useState(false);
  const [liveDbStatus, setLiveDbStatus] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null);
  const [showBackupPreview, setShowBackupPreview] = useState(false);

  // Reset to Defaults Security Safeguard State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  const handleOpenResetModal = () => {
    setResetPasswordInput('');
    setResetPasswordError('');
    setShowResetPassword(false);
    setIsResetConfirmOpen(true);
  };

  const getActiveHostPassword = (): string => {
    try {
      const localPass = typeof window !== 'undefined' ? localStorage.getItem('rsvp_host_password') : null;
      if (localPass) return localPass;
    } catch {
      // ignore
    }
    return config.hostPassword || 'admin123';
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    const activePass = getActiveHostPassword();
    // Verify security password against active host password only
    if (resetPasswordInput !== activePass) {
      setResetPasswordError('Incorrect security password. Reset operation blocked to protect your database.');
      return;
    }

    if (onResetToDefaults) {
      onResetToDefaults();
      setIsResetConfirmOpen(false);
      setResetPasswordInput('');
      setResetPasswordError('');
      setResetSuccessToast(true);
      setTimeout(() => setResetSuccessToast(false), 6000);
    }
  };

  // Build authoritative Cloud & Account Settings covering:
  // 1.) Firebase Provisioned Project & Account Details
  // 2.) Supabase Credentials & Redundancy Policy
  // 3.) ImageKit Credentials
  const buildCloudAccountSettings = (): CloudAccountSettings => {
    const supa = getStoredSupabaseConfig();
    const effectiveMode = supa.mode || 'failover';
    const effectiveAutoFailover = supa.autoFailover ?? true;

    return {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      // 1.) Firebase Provisioned Project & Account Details
      firebase: {
        projectId: firebaseConfig.projectId,
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
        appId: firebaseConfig.appId,
        apiKey: firebaseConfig.apiKey || '',
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        oAuthClientId: firebaseConfig.oAuthClientId || (firebaseAppletConfigRaw as any)?.oAuthClientId || '',
        plan: 'Spark Plan (Free Tier)',
        consoleUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`,
        databaseMode: 'Firestore Native (Authoritative Server-Sent Events + Live Web SDK Sync)'
      },
      // 2.) Supabase Credentials & Redundancy Policy
      supabase: {
        supabaseUrl: supa.supabaseUrl || '',
        supabaseAnonKey: supa.supabaseAnonKey || '',
        mode: effectiveMode,
        autoFailover: effectiveAutoFailover,
        lastSyncTime: supa.lastSyncTime,
        redundancyPolicy: {
          mode: effectiveMode,
          autoFailover: effectiveAutoFailover,
          projectRef: supa.supabaseUrl ? supa.supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] : 'unconfigured',
          policyDescription: effectiveMode === 'mirror'
            ? 'Dual-Write Realtime Mirror Active: Every change is dual-written atomically to Cloud Firestore and Supabase PostgreSQL.'
            : 'Warm Standby High-Availability Failover Active: Firestore is the primary authoritative source with automatic failover to Supabase.',
          failoverTriggers: [
            'Firestore Spark free-tier daily quotas reached (50,000 reads / 20,000 writes per day)',
            'Network partition or unhandled client disconnection exceeding 10 seconds',
            'Backend server HTTP 503 / 504 gateway degradation or cold restart'
          ],
          synchronizedTables: ['wedding_config', 'guests', 'guestbook_entries'],
          syncStrategy: 'Last-Write-Wins (LWW) with ISO-8601 timestamps and atomic batch upserts'
        }
      },
      // 3.) ImageKit Credentials
      imagekit: {
        publicKey: 'public_vie7nQLXXCidvyqXsEkC9qnkwWk=',
        urlEndpoint: 'https://ik.imagekit.io/9abzbu5ke/',
        privateKey: '',
        configured: true,
        uploadFolder: '/wedding-invitations',
        cdnOptimization: 'Global Tier-1 CDN with automatic WebP/AVIF transformation, progressive JPEG loading, lossless compression, and signed client upload authentication'
      }
    };
  };

  // Generate the complete /src/data/presets.ts file content
  const generateFullPresetsCode = (): string => {
    const weddingPreset = { ...formData };
    const galaPreset = EVENT_PRESETS?.gala || {};
    const guestsList = guests && guests.length > 0 ? guests : [];
    const gbList = guestbookEntries && guestbookEntries.length > 0 ? guestbookEntries : [];
    const cloudSettings = buildCloudAccountSettings();

    return `import { EventConfig, Guest, GuestbookEntry, CloudAccountSettings } from '../types';

export const EVENT_PRESETS: Record<string, EventConfig> = {
  wedding: ${JSON.stringify(weddingPreset, null, 2)},
  gala: ${JSON.stringify(galaPreset, null, 2)}
};

export const INITIAL_GUESTS: Guest[] = ${JSON.stringify(guestsList, null, 2)};

export const INITIAL_GUESTBOOK: GuestbookEntry[] = ${JSON.stringify(gbList, null, 2)};

export const INITIAL_CLOUD_SETTINGS: CloudAccountSettings = ${JSON.stringify(cloudSettings, null, 2)};
`;
  };

  const handleCopyFullPresetsFile = () => {
    const code = generateFullPresetsCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedPresetsFile(true);
      setTimeout(() => setCopiedPresetsFile(false), 3500);
    }
  };

  const handleDownloadPresetsFile = () => {
    const code = generateFullPresetsCode();
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'presets.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedPresetsFile(true);
    setTimeout(() => setDownloadedPresetsFile(false), 3500);
  };

  const handleDownloadJsonBackup = () => {
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      eventConfig: formData,
      guests: guests || [],
      guestbookEntries: guestbookEntries || [],
      cloudSettings: buildCloudAccountSettings()
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (formData.title || 'wedding').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `${safeTitle}_full_backup_with_cloud_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedJsonBackup(true);
    setTimeout(() => setDownloadedJsonBackup(false), 3500);
  };

  const handleCopyPresetCode = () => {
    const code = `  wedding: ${JSON.stringify(formData, null, 2)},`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedPresetCode(true);
      setTimeout(() => setCopiedPresetCode(false), 3000);
    }
  };

  const handleRestoreBackup = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseBackupData(text);
        if (!parsed.isValid) {
          alert(`Invalid backup file: ${parsed.errors.join(' ')}`);
          return;
        }

        const res = await applyRestoreData(parsed, {
          onSaveConfig: async (cfg) => {
            await onSaveConfig(cfg);
          },
          onSaveGuests: async (gst) => {
            if (onSaveGuests) await onSaveGuests(gst);
          }
        });

        alert(`✓ ${res.message}\n\n${res.details.join('\n')}\n\nLive state refreshed!`);
      } catch (err: any) {
        alert("Restore failed: " + (err?.message || 'Unknown error during restore'));
      }
    };
    reader.readAsText(file);
  };

  const handleTestLiveDbConnection = async () => {
    setIsTestingLiveDb(true);
    setLiveDbStatus(null);
    try {
      const res = await testFirestoreConnection();
      setLiveDbStatus(res);
    } catch (err: any) {
      setLiveDbStatus({ success: false, error: err?.message || 'Connection check failed' });
    } finally {
      setIsTestingLiveDb(false);
    }
  };

  // Helper to optimize / scale uploaded invitation photos so they don't exceed storage limits
  const optimizeImageFile = (file: File, maxWidth = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Preset Sample Formal Invitation Slides
  const SAMPLE_INVITATION_SLIDES: InvitationSlide[] = [
    {
      id: 'sample-1',
      url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
      title: 'Formal Invitation Suite & Monogram',
      caption: 'Heirloom letterpress calligraphy on handmade deckle-edge paper with dusty blue silk ribbon and wax seal.'
    },
    {
      id: 'sample-2',
      url: 'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&w=1200&q=80',
      title: 'The Holy Matrimony & Order of Service',
      caption: 'Sacred ceremony liturgy, scriptures, and processional order at St. Mary’s Catholic Sanctuary.'
    },
    {
      id: 'sample-3',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      title: 'Celebration Grounds & Reception Banquet',
      caption: 'Evening gala under the starlit glasshouse, dress code guidelines, and celebration timeline.'
    }
  ];

  // Slideshow Image Uploader State
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideCaption, setNewSlideCaption] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const slideshowFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);
  const navTabsRef = useRef<HTMLDivElement>(null);
  const [replaceTargetSlideId, setReplaceTargetSlideId] = useState<string | null>(null);

  // Auto-scroll active navigation tab smoothly into view if needed
  useEffect(() => {
    if (navTabsRef.current) {
      const activeBtn = navTabsRef.current.querySelector<HTMLElement>(`[data-tab-id="${view}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }
  }, [view]);

  // ImageKit configuration status state
  const [imageKitStatus, setImageKitStatus] = useState<ImageKitStatus | null>(null);
  const [isCheckingImageKit, setIsCheckingImageKit] = useState(false);

  const checkImageKitStatus = async () => {
    try {
      setIsCheckingImageKit(true);
      const data = await fetchSafeImageKitStatus();
      setImageKitStatus(data);
    } catch (err) {
      console.warn('ImageKit status check fallback:', err);
    } finally {
      setIsCheckingImageKit(false);
    }
  };

  useEffect(() => {
    if (isOpen && (view === 'slideshow' || view === 'invitation' || view === 'qr-display')) {
      checkImageKitStatus();
    }
  }, [isOpen, view]);

  // QR Display & Monetary Gift Registry State
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [qrUploadStatus, setQrUploadStatus] = useState<string | null>(null);
  const [qrTestCopied, setQrTestCopied] = useState(false);
  const [selectedQrTab, setSelectedQrTab] = useState(0);

  // Normalize current QR list from formData
  const getNormalizedQrList = (): GiftQrItem[] => {
    return getNormalizedGiftQrList(formData);
  };

  // Add new QR Code payment channel
  const handleAddQrCode = () => {
    const currentList = getNormalizedQrList();
    const newQr: GiftQrItem = {
      id: `qr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      bankName: currentList.some(q => q.bankName === 'Maya' || q.bankName.includes('Maya')) ? 'BDO / Bank Transfer' : 'Maya',
      accountName: formData.giftAccountName || 'Mark Alain Sim & Karla',
      accountNumber: '',
      qrImage: '',
      notes: ''
    };
    const updated = [...currentList, newQr];
    setFormData(prev => ({
      ...prev,
      giftQrList: updated,
      giftBankName: updated[0]?.bankName,
      giftAccountName: updated[0]?.accountName,
      giftAccountNumber: updated[0]?.accountNumber,
      giftQrImage: updated[0]?.qrImage,
      giftNotes: updated[0]?.notes,
    }));
    setSelectedQrTab(updated.length - 1);
    setQrUploadStatus('✓ Added new QR Code payment channel!');
    setTimeout(() => setQrUploadStatus(null), 3000);
  };

  // Remove a QR Code channel
  const handleRemoveQrCode = (id: string) => {
    const currentList = getNormalizedQrList();
    if (currentList.length <= 1) {
      alert('You must maintain at least one QR code / payment option for your wedding registry.');
      return;
    }
    const updated = currentList.filter(item => item.id !== id);
    setFormData(prev => ({
      ...prev,
      giftQrList: updated,
      giftBankName: updated[0]?.bankName,
      giftAccountName: updated[0]?.accountName,
      giftAccountNumber: updated[0]?.accountNumber,
      giftQrImage: updated[0]?.qrImage,
      giftNotes: updated[0]?.notes,
    }));
    setSelectedQrTab(prev => Math.min(prev, updated.length - 1));
    setQrUploadStatus('✓ Removed QR Code option.');
    setTimeout(() => setQrUploadStatus(null), 2500);
  };

  // Update a specific QR item
  const handleUpdateQrItem = (id: string, updates: Partial<GiftQrItem>) => {
    const currentList = getNormalizedQrList();
    const updated = currentList.map(item => item.id === id ? { ...item, ...updates } : item);
    setFormData(prev => ({
      ...prev,
      giftQrList: updated,
      giftBankName: updated[0]?.bankName,
      giftAccountName: updated[0]?.accountName,
      giftAccountNumber: updated[0]?.accountNumber,
      giftQrImage: updated[0]?.qrImage,
      giftNotes: updated[0]?.notes,
    }));
  };

  // Reorder QR options
  const handleMoveQr = (index: number, direction: 'up' | 'down') => {
    const currentList = [...getNormalizedQrList()];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentList.length) return;
    const temp = currentList[index];
    currentList[index] = currentList[target];
    currentList[target] = temp;
    setFormData(prev => ({
      ...prev,
      giftQrList: currentList,
      giftBankName: currentList[0]?.bankName,
      giftAccountName: currentList[0]?.accountName,
      giftAccountNumber: currentList[0]?.accountNumber,
      giftQrImage: currentList[0]?.qrImage,
      giftNotes: currentList[0]?.notes,
    }));
    setSelectedQrTab(target);
  };

  // Upload or replace QR image file for the currently selected or targeted QR item
  const handleQrFileUpload = async (files: FileList | File[] | null, targetQrId?: string) => {
    if (!files || files.length === 0) return;
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) {
      alert('Please select a valid image file (.png, .jpg, .webp).');
      return;
    }

    setIsUploadingQr(true);
    setQrUploadStatus('Uploading QR code image...');

    try {
      let finalQrUrl = '';
      try {
        const base64Data = await readFileAsDataUrl(file);
        const res = await fetch('/api/imagekit/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64Data,
            fileName: `gift-qr-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
            folder: '/wedding-registry'
          })
        });
        const resData = await res.json();
        if (res.ok && resData.success && resData.url) {
          finalQrUrl = resData.url;
        } else {
          finalQrUrl = await optimizeImageFile(file, 800, 0.92);
        }
      } catch {
        finalQrUrl = await optimizeImageFile(file, 800, 0.92);
      }

      const activeList = getNormalizedQrList();
      const targetId = targetQrId || activeList[selectedQrTab]?.id || activeList[0]?.id;
      if (targetId) {
        handleUpdateQrItem(targetId, { qrImage: finalQrUrl });
      } else {
        handleFieldChange('giftQrImage', finalQrUrl);
      }
      setQrUploadStatus('✓ QR code image uploaded successfully!');
      setTimeout(() => setQrUploadStatus(null), 3500);
    } catch (err: any) {
      console.error('Failed to upload QR code:', err);
      alert('Could not upload QR image: ' + (err?.message || 'Unknown error'));
      setQrUploadStatus(null);
    } finally {
      setIsUploadingQr(false);
      if (qrFileInputRef.current) {
        qrFileInputRef.current.value = '';
      }
    }
  };

  const handleLoadSampleQr = () => {
    const samples: GiftQrItem[] = [
      {
        id: `qr_gcash_${Date.now()}`,
        bankName: 'GCash',
        accountName: 'Mark Alain Sim & Karla',
        accountNumber: '0917-888-2027',
        qrImage: 'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80',
        notes: 'GCash express send or scan. Please include your name in the payment reference!'
      },
      {
        id: `qr_maya_${Date.now() + 1}`,
        bankName: 'Maya / PayMaya',
        accountName: 'Karla & Mark Alain',
        accountNumber: '0917-555-1428',
        qrImage: 'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80',
        notes: 'Maya / PayMaya wallet or bank transfer.'
      }
    ];
    setFormData(prev => ({
      ...prev,
      giftQrList: samples,
      giftBankName: samples[0].bankName,
      giftAccountName: samples[0].accountName,
      giftAccountNumber: samples[0].accountNumber,
      giftQrImage: samples[0].qrImage,
      giftNotes: samples[0].notes,
    }));
    setSelectedQrTab(0);
    setQrUploadStatus('✓ Sample Multiple QR Codes (GCash & Maya) loaded!');
    setTimeout(() => setQrUploadStatus(null), 3000);
  };

  // Read file as Base64 Data URL for API transmission
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Normalize current slides from formData
  const getNormalizedSlides = (): InvitationSlide[] => {
    const raw = formData.invitationImages && formData.invitationImages.length > 0 
      ? formData.invitationImages 
      : [];
    return raw.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `slide-${idx}`,
          url: item,
          title: `Card ${idx + 1}`,
          caption: 'Formal wedding invitation suite'
        };
      }
      return item;
    });
  };

  // Upload local images via file picker or drag-and-drop to ImageKit.io API
  const handleAddSlideFromFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    setUploadError('');
    setUploadStatusMessage('');

    try {
      const newSlides: InvitationSlide[] = [];
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        setUploadError('Please select valid image files (.jpg, .png, .webp).');
        setIsUploadingImages(false);
        return;
      }

      let usedImageKitCount = 0;
      let fallbackUsed = false;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadStatusMessage(`Uploading card ${i + 1} of ${imageFiles.length} to ImageKit...`);

        let slideUrl = '';
        let uploadedId: string | undefined = undefined;

        // Upload via safe ImageKit helper (supports backend Express proxy & direct client upload)
        try {
          const result = await uploadImageToImageKit(file, file.name, '/wedding-invitations');
          if (result.success && result.url) {
            slideUrl = result.url;
            uploadedId = result.fileId;
            usedImageKitCount++;
          } else {
            // Graceful fallback to client-side optimized compression
            slideUrl = await optimizeImageFile(file);
            fallbackUsed = true;
            if (result.missingConfig) {
              setUploadError('ImageKit credentials are not yet configured. Card was saved using local optimization fallback. Open Cloud & Account Settings to activate ImageKit CDN.');
            } else if (result.error) {
              setUploadError(`ImageKit note: ${result.error}. Switched to local optimization fallback.`);
            }
          }
        } catch (uploadErr) {
          console.warn('Network error uploading to ImageKit, using local optimization fallback:', uploadErr);
          slideUrl = await optimizeImageFile(file);
          fallbackUsed = true;
        }

        newSlides.push({
          id: uploadedId || `slide-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          url: slideUrl,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          caption: usedImageKitCount > 0 && !fallbackUsed ? 'Uploaded via ImageKit.io CDN' : 'Uploaded invitation card'
        });
      }

      if (newSlides.length > 0) {
        const current = getNormalizedSlides();
        const updated = [...current, ...newSlides];
        setFormData(prev => ({
          ...prev,
          invitationImages: updated
        }));

        if (usedImageKitCount > 0 && !fallbackUsed) {
          setUploadStatusMessage(`✓ Successfully uploaded ${newSlides.length} card(s) to ImageKit.io CDN!`);
          setTimeout(() => setUploadStatusMessage(''), 6000);
        }
      }
    } catch (err: any) {
      console.error(err);
      setUploadError('Failed to process one or more images. Please try smaller files or image URLs.');
    } finally {
      setIsUploadingImages(false);
      if (slideshowFileInputRef.current) {
        slideshowFileInputRef.current.value = '';
      }
    }
  };

  // Add slide via image URL
  const handleAddSlideFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideUrl.trim()) return;
    const current = getNormalizedSlides();
    const newSlide: InvitationSlide = {
      id: `slide-${Date.now()}`,
      url: newSlideUrl.trim(),
      title: newSlideTitle.trim() || `Card ${current.length + 1}`,
      caption: newSlideCaption.trim() || 'Formal wedding invitation card'
    };
    setFormData(prev => ({
      ...prev,
      invitationImages: [...current, newSlide]
    }));
    setNewSlideUrl('');
    setNewSlideTitle('');
    setNewSlideCaption('');
  };

  // Update a specific slide's metadata
  const handleUpdateSlide = (id: string, updates: Partial<InvitationSlide>) => {
    const current = getNormalizedSlides();
    const updated = current.map(s => s.id === id ? { ...s, ...updates } : s);
    setFormData(prev => ({
      ...prev,
      invitationImages: updated
    }));
  };

  // Remove a slide
  const handleRemoveSlide = (id: string) => {
    const current = getNormalizedSlides();
    const updated = current.filter(s => s.id !== id);
    setFormData(prev => ({
      ...prev,
      invitationImages: updated
    }));
    if (previewSlideIndex >= updated.length && updated.length > 0) {
      setPreviewSlideIndex(updated.length - 1);
    }
  };

  // Reorder slide up or down
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const current = [...getNormalizedSlides()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;
    setFormData(prev => ({
      ...prev,
      invitationImages: current
    }));
    setPreviewSlideIndex(targetIndex);
  };

  // Replace a slide's image file
  const handleTriggerReplaceSlide = (id: string) => {
    setReplaceTargetSlideId(id);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  const handleExecuteReplaceSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetSlideId) return;
    try {
      setIsUploadingImages(true);
      setUploadStatusMessage('Uploading replacement card to ImageKit...');
      let finalUrl = '';
      try {
        const base64Data = await readFileAsDataUrl(file);
        const res = await fetch('/api/imagekit/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64Data,
            fileName: file.name,
            folder: '/wedding-invitations'
          })
        });
        const resData = await res.json();
        if (res.ok && resData.success && resData.url) {
          finalUrl = resData.url;
        } else {
          finalUrl = await optimizeImageFile(file);
        }
      } catch {
        finalUrl = await optimizeImageFile(file);
      }
      handleUpdateSlide(replaceTargetSlideId, { url: finalUrl });
    } catch (err) {
      console.error(err);
      setUploadError('Failed to replace slide image.');
    } finally {
      setIsUploadingImages(false);
      setUploadStatusMessage('');
      setReplaceTargetSlideId(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  // Load sample slides
  const handleLoadSampleSlides = () => {
    setFormData(prev => ({
      ...prev,
      invitationImages: SAMPLE_INVITATION_SLIDES
    }));
    setPreviewSlideIndex(0);
  };

  // Photo URL live validation state
  const [heroImgStatus, setHeroImgStatus] = useState<'valid' | 'error' | 'loading'>('valid');
  const [venueImgStatus, setVenueImgStatus] = useState<'valid' | 'error' | 'loading'>('valid');
  const [churchImgStatus, setChurchImgStatus] = useState<'valid' | 'error' | 'loading'>('valid');

  // Sync formData whenever config updates or modal opens
  useEffect(() => {
    setFormData({ ...config });
  }, [config, isOpen]);

  // Helper to convert targetDate to YYYY-MM-DDTHH:mm for datetime-local
  const toDatetimeLocalString = (targetDateStr?: string) => {
    if (!targetDateStr) return '';
    try {
      const d = new Date(targetDateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  // Live countdown ticker inside Host Dashboard
  const [dashboardCountdown, setDashboardCountdown] = useState({
    days: '00',
    hours: '00',
    mins: '00',
    secs: '00',
    isExpired: false
  });

  useEffect(() => {
    function tick() {
      const target = getEventTargetTimestamp(
        formData.targetDate,
        formData.date,
        formData.churchTime || '2:00 PM PST',
        formData.timezone || 'PST'
      );
      if (isNaN(target)) {
        setDashboardCountdown({ days: '00', hours: '00', mins: '00', secs: '00', isExpired: false });
        return;
      }
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setDashboardCountdown({ days: '00', hours: '00', mins: '00', secs: '00', isExpired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setDashboardCountdown({
        days: days < 10 ? `0${days}` : `${days}`,
        hours: hours < 10 ? `0${hours}` : `${hours}`,
        mins: mins < 10 ? `0${mins}` : `${mins}`,
        secs: secs < 10 ? `0${secs}` : `${secs}`,
        isExpired: false
      });
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [formData.targetDate, formData.date, formData.churchTime, formData.time, formData.timezone]);

  // Sync display date/time from targetDate (Targets Church Ceremony 2:00 PM)
  const handleSyncDisplayFromTarget = () => {
    if (!formData.targetDate) return;
    try {
      const d = new Date(formData.targetDate);
      if (!isNaN(d.getTime())) {
        const tz = formData.timezone || 'PST';
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = d.toLocaleDateString('en-US', options);
        let hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm} ${tz}`;
        setFormData(prev => ({
          ...prev,
          date: formattedDate,
          churchTime: formattedTime
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync targetDate from Church Ceremony date/time (Targets Church Ceremony 2:00 PM)
  const handleSyncTargetFromDisplay = () => {
    if (!formData.date) return;
    try {
      const ceremonyTime = formData.churchTime || '2:00 PM PST';
      let hours = 14;
      let minutes = 0;
      const timeMatch = ceremonyTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[4]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
      const d = new Date(formData.date);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}:00`;
        setFormData(prev => ({ ...prev, targetDate: iso }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Test Hero Photo URL whenever it changes
  useEffect(() => {
    const url = formData.heroImage?.trim();
    if (!url) {
      setHeroImgStatus('valid');
      return;
    }
    setHeroImgStatus('loading');
    const img = new Image();
    img.src = url;
    img.referrerPolicy = 'no-referrer';
    img.onload = () => setHeroImgStatus('valid');
    img.onerror = () => setHeroImgStatus('error');
  }, [formData.heroImage]);

  // Test Venue Image URL whenever it changes
  useEffect(() => {
    const url = formData.venueImg?.trim();
    if (!url) {
      setVenueImgStatus('valid');
      return;
    }
    setVenueImgStatus('loading');
    const img = new Image();
    img.src = url;
    img.onload = () => setVenueImgStatus('valid');
    img.onerror = () => setVenueImgStatus('error');
  }, [formData.venueImg]);

  // Test Church Image URL whenever it changes
  useEffect(() => {
    const url = formData.churchImg?.trim();
    if (!url) {
      setChurchImgStatus('valid');
      return;
    }
    setChurchImgStatus('loading');
    const img = new Image();
    img.src = url;
    img.onload = () => setChurchImgStatus('valid');
    img.onerror = () => setChurchImgStatus('error');
  }, [formData.churchImg]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const activePass = getActiveHostPassword();

    // Check credentials strictly against active host password only
    if (cleanUser === 'admin' && cleanPass === activePass) {
      setIsLoggedIn(true);
      setLoginError('');
      try {
        sessionStorage.setItem('rsvp_host_logged_in', 'true');
      } catch {
        // ignore
      }
    } else {
      setLoginError('Invalid username or password. Please verify your credentials.');
    }
  };

  const handleOpenChangePassword = () => {
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setChangePasswordError('');
    setChangePasswordSuccess(false);
    setIsChangePasswordOpen(true);
  };

  const handleCloseChangePassword = () => {
    setIsChangePasswordOpen(false);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setChangePasswordError('');
    setChangePasswordSuccess(false);
  };

  const handleSubmitChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');

    const activePass = getActiveHostPassword();

    // 1. Verify current password matches active password only
    if (currentPasswordInput !== activePass) {
      setChangePasswordError('The current password entered is incorrect.');
      return;
    }

    // 2. Validate new password length
    const trimmedNew = newPasswordInput.trim();
    if (!trimmedNew || trimmedNew.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long.');
      return;
    }

    // 3. Prevent using identical password
    if (trimmedNew === activePass) {
      setChangePasswordError('The new password must be different from your current password.');
      return;
    }

    // 4. Verify confirmation match
    if (trimmedNew !== confirmPasswordInput.trim()) {
      setChangePasswordError('The new password and confirmation password do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Save in config (which syncs to state, localStorage, Firestore, and Supabase)
      const updatedConfig: EventConfig = {
        ...config,
        hostPassword: trimmedNew
      };
      onSaveConfig(updatedConfig);
      setFormData(prev => ({ ...prev, hostPassword: trimmedNew }));

      // Also persist explicitly in localStorage
      try {
        localStorage.setItem('rsvp_host_password', trimmedNew);
      } catch (err) {
        console.warn('Failed to save rsvp_host_password to localStorage', err);
      }

      setChangePasswordSuccess(true);
      setPasswordToast('Host Dashboard password successfully updated!');
      setTimeout(() => setPasswordToast(null), 6000);

      // Auto-close modal after brief visual confirmation
      setTimeout(() => {
        handleCloseChangePassword();
      }, 1600);
    } catch (err: any) {
      setChangePasswordError(err?.message || 'Failed to update host password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    try {
      sessionStorage.removeItem('rsvp_host_logged_in');
    } catch {
      // ignore
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseGuestCsv(text);
        onImportGuests(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleFieldChange = (field: keyof EventConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Timeline handlers
  const handleTimelineChange = (index: number, field: keyof TimelineItem, value: string) => {
    const updated = [...formData.timeline];
    updated[index] = { ...updated[index], [field]: value };
    handleFieldChange('timeline', updated);
  };

  const handleAddTimelineItem = () => {
    const newItem: TimelineItem = {
      id: Date.now().toString(),
      time: '7:00 PM',
      title: 'New Program Event',
      desc: 'Description of event proceedings.'
    };
    handleFieldChange('timeline', [...formData.timeline, newItem]);
  };

  const handleRemoveTimelineItem = (index: number) => {
    const updated = formData.timeline.filter((_, idx) => idx !== index);
    handleFieldChange('timeline', updated);
  };

  // Single unified Save function
  const handleSaveInvitation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveConfig({
      ...formData,
      logoText: formData.title.toUpperCase()
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Add Guest submit
  const handleCreateGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestData.name.trim()) return;
    onAddGuest(newGuestData);
    setIsAddGuestModalOpen(false);
    setNewGuestData({
      name: '',
      phone: '',
      email: '',
      attending: 'yes',
      count: 1,
      table: 'Table 1',
      seat: 'Seat 1',
      song: '',
      note: '',
      expectedArrivalTime: '',
      expectedArrival: ''
    });
  };

  // Stats calculation
  const attendingGuests = guests.filter((g) => g.attending === 'yes');
  const declinedGuests = guests.filter((g) => g.attending === 'no');
  const totalHeadcount = attendingGuests.reduce((acc, g) => acc + (g.count || 1), 0);

  // Guest List Search, Filter, Sort & Bulk Selection State
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [guestTableFilter, setGuestTableFilter] = useState<string>('all');
  const [guestSortField, setGuestSortField] = useState<'name' | 'status' | 'table'>('name');
  const [guestSortDirection, setGuestSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    ids: string[];
    names: string[];
  } | null>(null);

  // Check-In & Quick Actions State & Handlers
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checked-in' | 'pending'>('all');

  const checkedInGuestsCount = useMemo(() => {
    return guests.filter(g => g.attending === 'yes' && (g.checkedIn || g.is_checked_in)).length;
  }, [guests]);

  const formatArrivalTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const handleToggleGuestCheckIn = (guest: Guest) => {
    const nextCheckedIn = !(guest.checkedIn || guest.is_checked_in);
    const now = new Date().toISOString();
    const updatedGuest: Guest = {
      ...guest,
      checkedIn: nextCheckedIn,
      is_checked_in: nextCheckedIn,
      arrivedAt: nextCheckedIn ? (guest.arrivedAt || guest.checkedInAt || guest.checked_in_at || now) : undefined,
      checkedInAt: nextCheckedIn ? (guest.checkedInAt || guest.arrivedAt || guest.checked_in_at || now) : undefined,
      checked_in_at: nextCheckedIn ? (guest.checked_in_at || guest.arrivedAt || guest.checkedInAt || now) : undefined
    };
    onUpdateGuest(updatedGuest);
  };

  const handleBatchCheckIn = (checkedIn: boolean) => {
    if (selectedGuestIds.length === 0) return;
    const now = new Date().toISOString();
    selectedGuestIds.forEach((id) => {
      const g = guests.find(item => item.id === id);
      if (g && g.attending === 'yes') {
        const updated: Guest = {
          ...g,
          checkedIn,
          is_checked_in: checkedIn,
          arrivedAt: checkedIn ? (g.arrivedAt || g.checkedInAt || g.checked_in_at || now) : undefined,
          checkedInAt: checkedIn ? (g.checkedInAt || g.arrivedAt || g.checked_in_at || now) : undefined,
          checked_in_at: checkedIn ? (g.checked_in_at || g.arrivedAt || g.checkedInAt || now) : undefined
        };
        onUpdateGuest(updated);
      }
    });
  };

  const handleCheckInAllAttending = () => {
    const now = new Date().toISOString();
    attendingGuests.forEach((g) => {
      if (!(g.checkedIn || g.is_checked_in)) {
        const updated: Guest = {
          ...g,
          checkedIn: true,
          is_checked_in: true,
          arrivedAt: g.arrivedAt || g.checkedInAt || g.checked_in_at || now,
          checkedInAt: g.checkedInAt || g.arrivedAt || g.checked_in_at || now,
          checked_in_at: g.checked_in_at || g.arrivedAt || g.checkedInAt || now
        };
        onUpdateGuest(updated);
      }
    });
  };

  const handleResetAllCheckIns = () => {
    guests.forEach((g) => {
      if (g.checkedIn || g.is_checked_in) {
        const updated: Guest = {
          ...g,
          checkedIn: false,
          is_checked_in: false,
          arrivedAt: undefined,
          checkedInAt: undefined,
          checked_in_at: undefined
        };
        onUpdateGuest(updated);
      }
    });
  };

  // Arrivals & Check-In Summary Calculations
  const checkInPercentage = attendingGuests.length > 0 
    ? Math.round((checkedInGuestsCount / attendingGuests.length) * 100) 
    : 0;

  const checkedInHeadcount = useMemo(() => {
    return attendingGuests
      .filter(g => g.checkedIn || g.is_checked_in)
      .reduce((sum, g) => sum + Math.max(1, g.count || 1), 0);
  }, [attendingGuests]);

  const pendingGuests = useMemo(() => {
    return attendingGuests.filter(g => !(g.checkedIn || g.is_checked_in));
  }, [attendingGuests]);

  const pendingHeadcount = useMemo(() => {
    return pendingGuests.reduce((sum, g) => sum + Math.max(1, g.count || 1), 0);
  }, [pendingGuests]);

  // Summary View State (Search, Sort by Expected Arrival Time / Name, Selection)
  const [summarySearchQuery, setSummarySearchQuery] = useState('');
  const [summarySortBy, setSummarySortBy] = useState<'time' | 'name' | 'table'>('time');
  const [summarySortDirection, setSummarySortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [editingArrivalGuestId, setEditingArrivalGuestId] = useState<string | null>(null);
  const [editingArrivalTimeValue, setEditingArrivalTimeValue] = useState<string>('');

  const parseTimeToMinutes = (timeStr?: string, defaultFallback = '2:00 PM'): number => {
    const str = (timeStr && timeStr.trim().length > 0 ? timeStr : defaultFallback).trim();
    if (str.includes('T') || (str.includes('-') && str.length > 8)) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.getHours() * 60 + d.getMinutes();
      }
    }
    const match12 = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
      const isPm = match12[3].toLowerCase() === 'pm';
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const match24 = str.match(/(\d{1,2}):(\d{2})/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      return hours * 60 + minutes;
    }
    return 14 * 60; // 2:00 PM default (840 mins)
  };

  const filteredAndSortedPendingGuests = useMemo(() => {
    let list = pendingGuests;
    const q = summarySearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.toLowerCase().includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.table && g.table.toLowerCase().includes(q)) ||
        (g.seat && g.seat.toLowerCase().includes(q)) ||
        (g.note && g.note.toLowerCase().includes(q)) ||
        ((g.expectedArrivalTime || g.expectedArrival) && (g.expectedArrivalTime || g.expectedArrival)!.toLowerCase().includes(q))
      );
    }

    const defaultEventTime = formData.churchTime || formData.time || '2:00 PM';

    return [...list].sort((a, b) => {
      if (summarySortBy === 'time') {
        const timeA = parseTimeToMinutes(a.expectedArrivalTime || a.expectedArrival, defaultEventTime);
        const timeB = parseTimeToMinutes(b.expectedArrivalTime || b.expectedArrival, defaultEventTime);
        if (timeA !== timeB) {
          return summarySortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }
        return a.name.localeCompare(b.name);
      } else if (summarySortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return summarySortDirection === 'asc' ? cmp : -cmp;
      } else if (summarySortBy === 'table') {
        const tableA = a.table || 'ZZZ';
        const tableB = b.table || 'ZZZ';
        const cmp = tableA.localeCompare(tableB, undefined, { numeric: true });
        if (cmp !== 0) return summarySortDirection === 'asc' ? cmp : -cmp;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [pendingGuests, summarySearchQuery, summarySortBy, summarySortDirection, formData.churchTime, formData.time]);

  const handleSaveExpectedArrivalTime = (guest: Guest, time: string) => {
    const clean = time.trim();
    const updated: Guest = {
      ...guest,
      expectedArrivalTime: clean || undefined,
      expectedArrival: clean || undefined,
    };
    onUpdateGuest(updated);
    setEditingArrivalGuestId(null);
    setEditingArrivalTimeValue('');
  };

  const handleBatchCheckInPending = (ids: string[]) => {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    ids.forEach(id => {
      const g = guests.find(item => item.id === id);
      if (g && g.attending === 'yes') {
        const updated: Guest = {
          ...g,
          checkedIn: true,
          is_checked_in: true,
          checkedInAt: g.checkedInAt || g.arrivedAt || g.checked_in_at || now,
          checked_in_at: g.checked_in_at || g.arrivedAt || g.checkedInAt || now,
          arrivedAt: g.arrivedAt || g.checkedInAt || g.checked_in_at || now
        };
        onUpdateGuest(updated);
      }
    });
    setSelectedPendingIds([]);
  };

  const toggleSelectAllPending = () => {
    if (selectedPendingIds.length === filteredAndSortedPendingGuests.length && filteredAndSortedPendingGuests.length > 0) {
      setSelectedPendingIds([]);
    } else {
      setSelectedPendingIds(filteredAndSortedPendingGuests.map(g => g.id));
    }
  };

  const toggleSelectPendingGuest = (id: string) => {
    setSelectedPendingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Distinct tables available for filtering
  const availableTables = useMemo(() => {
    const set = new Set<string>();
    guests.forEach(g => {
      if (g.table && g.table.trim()) set.add(g.table.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [guests]);

  // Seating Arrangement View State & Helpers
  const [seatingSearch, setSeatingSearch] = useState('');
  const [seatingFilter, setSeatingFilter] = useState<'all' | 'vacant' | 'full' | 'overcapacity' | 'unassigned'>('all');
  const [seatingCapacityNotice, setSeatingCapacityNotice] = useState<string | null>(null);

  const activeTotalTables = Math.max(1, Math.min(100, Math.floor(Number(formData.totalTables || config.totalTables || 10))));
  const activeSeatsPerTable = Math.max(1, Math.min(50, Math.floor(Number(formData.seatsPerTable || config.seatsPerTable || 12))));

  const handleUpdateSeatingCapacity = (newTables: number, newSeats: number) => {
    const safeTables = Math.max(1, Math.min(100, Math.floor(newTables)));
    const safeSeats = Math.max(1, Math.min(50, Math.floor(newSeats)));
    const updated: EventConfig = {
      ...config,
      ...formData,
      totalTables: safeTables,
      seatsPerTable: safeSeats
    };
    setFormData(prev => ({
      ...prev,
      totalTables: safeTables,
      seatsPerTable: safeSeats
    }));
    onSaveConfig(updated);
    setSeatingCapacityNotice(`Layout updated: ${safeTables} Tables with ${safeSeats} Chairs each (${safeTables * safeSeats} total ballroom seats).`);
    setTimeout(() => setSeatingCapacityNotice(null), 3500);
  };

  // Comprehensive table list including Table 1..N and any custom named tables
  const allSeatingTables = useMemo(() => {
    const tableMap = new Map<string, Guest[]>();
    const total = activeTotalTables;

    for (let i = 1; i <= total; i++) {
      tableMap.set(`Table ${i}`, []);
    }

    // Distribute attending guests
    attendingGuests.forEach(g => {
      const t = (g.table && g.table.trim() && g.table !== '-') ? g.table.trim() : null;
      if (t) {
        if (!tableMap.has(t)) {
          tableMap.set(t, []);
        }
        tableMap.get(t)!.push(g);
      }
    });

    return Array.from(tableMap.entries()).sort(([a], [b]) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      const isNumA = !isNaN(numA) && a.toLowerCase().startsWith('table');
      const isNumB = !isNaN(numB) && b.toLowerCase().startsWith('table');
      if (isNumA && isNumB) return numA - numB;
      if (isNumA) return -1;
      if (isNumB) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [activeTotalTables, attendingGuests]);

  const seatedAttendingGuests = useMemo(() => attendingGuests.filter(g => g.table && g.table.trim() && g.table !== '-'), [attendingGuests]);
  const unassignedAttendingGuests = useMemo(() => attendingGuests.filter(g => !g.table || !g.table.trim() || g.table === '-'), [attendingGuests]);
  const totalBallroomSeats = activeTotalTables * activeSeatsPerTable;

  // Party size-adjusted seat calculations: each attending guest occupies Math.max(1, count) chairs
  const totalSeatedChairs = useMemo(() => {
    return seatedAttendingGuests.reduce((sum, g) => sum + Math.max(1, typeof g.count === 'number' ? g.count : 1), 0);
  }, [seatedAttendingGuests]);

  const totalUnassignedChairs = useMemo(() => {
    return unassignedAttendingGuests.reduce((sum, g) => sum + Math.max(1, typeof g.count === 'number' ? g.count : 1), 0);
  }, [unassignedAttendingGuests]);

  // Seating Quick-Reassign inline state for interactive table/seat dropdowns
  const [reassignGuestId, setReassignGuestId] = useState<string | null>(null);
  const [reassignTable, setReassignTable] = useState<string>('');
  const [reassignSeat, setReassignSeat] = useState<string>('');
  const [reassignCustomSeat, setReassignCustomSeat] = useState<boolean>(false);
  const [reassignFeedback, setReassignFeedback] = useState<string | null>(null);

  // Filter and sort guests
  const filteredAndSortedGuests = useMemo(() => {
    return guests
      .filter((g) => {
        // Status filter
        if (guestStatusFilter !== 'all' && g.attending !== guestStatusFilter) {
          return false;
        }
        // Table filter
        if (guestTableFilter !== 'all') {
          const guestTable = g.table || 'Unassigned';
          if (guestTable !== guestTableFilter) {
            return false;
          }
        }
        // Check-in filter
        if (checkInFilter === 'checked-in' && (!(g.checkedIn || g.is_checked_in) || g.attending !== 'yes')) {
          return false;
        }
        if (checkInFilter === 'pending' && ((g.checkedIn || g.is_checked_in) || g.attending !== 'yes')) {
          return false;
        }
        // Search query filter (matches name, email, table, seat, song, note)
        if (guestSearchQuery.trim()) {
          const q = guestSearchQuery.toLowerCase().trim();
          const matchName = g.name.toLowerCase().includes(q);
          const matchPhone = (g.phone || '').toLowerCase().includes(q);
          const matchEmail = (g.email || '').toLowerCase().includes(q);
          const matchTable = (g.table || '').toLowerCase().includes(q);
          const matchSeat = (g.seat || '').toLowerCase().includes(q);
          const matchSong = (g.song || '').toLowerCase().includes(q);
          const matchNote = (g.note || '').toLowerCase().includes(q);
          return matchName || matchPhone || matchEmail || matchTable || matchSeat || matchSong || matchNote;
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (guestSortField === 'name') {
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        } else if (guestSortField === 'status') {
          comparison = (a.attending || '').localeCompare(b.attending || '');
        } else if (guestSortField === 'table') {
          const tableA = a.table || '';
          const tableB = b.table || '';
          comparison = tableA.localeCompare(tableB, undefined, { numeric: true });
        }
        return guestSortDirection === 'asc' ? comparison : -comparison;
      });
  }, [guests, guestSearchQuery, guestStatusFilter, guestTableFilter, guestSortField, guestSortDirection]);

  // Handle header sorting click
  const handleSortClick = (field: 'name' | 'status' | 'table') => {
    if (guestSortField === field) {
      setGuestSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setGuestSortField(field);
      setGuestSortDirection('asc');
    }
  };

  // Toggle selection for a single guest
  const toggleSelectGuest = (guestId: string) => {
    setSelectedGuestIds((prev) => 
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId]
    );
  };

  // Select all or deselect all currently filtered guests
  const isAllFilteredSelected = filteredAndSortedGuests.length > 0 && 
    filteredAndSortedGuests.every((g) => selectedGuestIds.includes(g.id));
  const isSomeFilteredSelected = filteredAndSortedGuests.some((g) => selectedGuestIds.includes(g.id)) && !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered guests
      const filteredIds = new Set(filteredAndSortedGuests.map((g) => g.id));
      setSelectedGuestIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered guests
      const combined = new Set([...selectedGuestIds, ...filteredAndSortedGuests.map((g) => g.id)]);
      setSelectedGuestIds(Array.from(combined));
    }
  };

  const handleDeselectAll = () => {
    setSelectedGuestIds([]);
  };

  // Open batch delete confirmation dialog
  const handleOpenBulkDeleteConfirm = () => {
    if (selectedGuestIds.length === 0) return;
    const names = guests
      .filter((g) => selectedGuestIds.includes(g.id))
      .map((g) => g.name);
    setDeleteConfirmState({
      ids: [...selectedGuestIds],
      names
    });
  };

  // Open single direct delete confirmation dialog
  const handleOpenSingleDeleteConfirm = (guest: Guest) => {
    setDeleteConfirmState({
      ids: [guest.id],
      names: [guest.name]
    });
  };

  // Execute confirmed deletion without window.confirm (safe inside iframes)
  const handleExecuteConfirmedDelete = () => {
    if (!deleteConfirmState || deleteConfirmState.ids.length === 0) return;
    const idsToDelete = deleteConfirmState.ids;
    try {
      setIsBulkDeleting(true);
      if (onDeleteGuests) {
        onDeleteGuests(idsToDelete);
      } else {
        idsToDelete.forEach((id) => onDeleteGuest(id));
      }
      setSelectedGuestIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      setDeleteConfirmState(null);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 md:p-5 lg:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-[#fffdfa] rounded-3xl max-w-[98vw] xl:max-w-7xl 2xl:max-w-[1680px] w-full p-4 sm:p-6 lg:p-8 shadow-2xl border border-[#d8cab7] relative h-[96vh] sm:h-[95vh] max-h-[97vh] flex flex-col font-serif"
        style={{
          fontSize: textSize === 'xlarge' ? '17px' : textSize === 'large' ? '15.5px' : '14px'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-full hover:bg-[#ebf2f7] text-[#475569] hover:text-[#18232c] transition cursor-pointer z-10"
          title="Close host modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Login Screen if not logged in */}
        {!isLoggedIn ? (
          <div className="py-8 text-center space-y-5 max-w-md mx-auto my-auto animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7 text-[#3A5A74]" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#18232c]">
              Host Dashboard Portal
            </h3>
            <p className="text-sm sm:text-base text-[#475569] font-serif leading-relaxed">
              Enter host credentials to manage RSVPs, view guest responses, adjust seating, and edit invitation details & photos.
            </p>

            {loginError && (
              <div className="p-3 bg-rose-50 text-[#3A5A74] rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-[#3A5A74]/30 font-medium">
                <AlertCircle className="w-4 h-4 text-[#3A5A74]" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-serif font-bold text-[#18232c] mb-1">
                  Host Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Username (admin)"
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-serif placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-[#18232c] mb-1">
                  Host Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Enter host password"
                    required
                    autoComplete="current-password"
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-serif placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#506173] hover:text-[#18232c] cursor-pointer"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#3A5A74] hover:bg-[#274155] text-white text-sm sm:text-base font-serif font-semibold tracking-wider uppercase rounded-xl transition shadow-md border border-[#4D708E] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Unlock Host Dashboard</span>
                </button>
              </div>
            </form>
            {getActiveHostPassword() === 'admin123' && (
              <div className="text-xs text-[#506173] font-serif pt-1">
                <span>
                  Default credentials: Username <code className="bg-[#ebf2f7] border border-[#c8d7e3] px-2 py-0.5 rounded text-[#3A5A74] font-bold font-mono">admin</code> | Password <code className="bg-[#ebf2f7] border border-[#c8d7e3] px-2 py-0.5 rounded text-[#3A5A74] font-bold font-mono">admin123</code>
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Host Dashboard Content */
          <div className="space-y-3.5 flex-1 min-h-0 overflow-hidden flex flex-col animate-in fade-in">
            {/* Tier 1: Header Top Bar & Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-[#c8d7e3] pb-3 shrink-0">
              <div>
                <span className="text-[11px] uppercase font-bold text-[#3A5A74] tracking-widest font-serif">
                  Host Management & Control
                </span>
                <div className="flex items-center space-x-2.5 mt-0.5">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#18232c]">
                    Host Dashboard
                  </h3>
                  {isCloudConnected ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCloudSettingsInitialTab('firebase');
                        setIsCloudSettingsOpen(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs transition cursor-pointer"
                      title="Click to view Firebase live cloud sync status, latency & database details"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Cloud Sync Active</span>
                      <Settings className="w-3 h-3 text-emerald-700 ml-0.5 opacity-80" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCloudSettingsInitialTab('firebase');
                        setIsCloudSettingsOpen(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-xs transition cursor-pointer"
                      title="Click to configure Firebase cloud connection"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Local Mode</span>
                      <Settings className="w-3 h-3 text-amber-700 ml-0.5 opacity-80" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Actions Toolbar */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1.5 lg:justify-end">
                {/* Supabase Alternate Database & Redundancy Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCloudSettingsInitialTab('supabase');
                    setIsCloudSettingsOpen(true);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-serif font-semibold bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3] shadow-xs transition cursor-pointer"
                  title="Configure Supabase Alternate Database, Dual-Write Mirroring & Automatic Failover"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span className="hidden sm:inline">Failover</span>
                </button>

                {/* Presets & Unified Cloud Backup Suite Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCloudSettingsInitialTab('backup');
                    setIsCloudSettingsOpen(true);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-serif font-semibold bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3] shadow-xs transition cursor-pointer"
                  title="Open Codebase Presets & Backup Suite with Cloud & Account Settings"
                >
                  <Layers className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span className="hidden sm:inline">Backup</span>
                </button>

                {/* Text Size Accessibility Controls */}
                <div className="bg-[#ebf2f7] p-0.5 sm:p-1 rounded-xl flex items-center border border-[#c8d7e3] shadow-xs">
                  <span className="px-1.5 text-[11px] font-serif font-bold text-[#506173] hidden sm:inline-flex items-center gap-1">
                    <Type className="w-3 h-3 text-[#3A5A74]" />
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTextSizeChange('normal')}
                    className={`px-2 py-1 rounded-lg text-xs font-serif font-semibold transition ${
                      textSize === 'normal'
                        ? 'bg-[#3A5A74] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#18232c] hover:bg-[#dbe7f0]'
                    }`}
                    title="Standard text size"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextSizeChange('large')}
                    className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-serif font-bold transition ${
                      textSize === 'large'
                        ? 'bg-[#3A5A74] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#18232c] hover:bg-[#dbe7f0]'
                    }`}
                    title="Large readable text size (Default)"
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextSizeChange('xlarge')}
                    className={`px-2 py-1 rounded-lg text-xs sm:text-base font-serif font-extrabold transition ${
                      textSize === 'xlarge'
                        ? 'bg-[#3A5A74] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#18232c] hover:bg-[#dbe7f0]'
                    }`}
                    title="Extra large text size for high legibility"
                  >
                    A++
                  </button>
                </div>

                {/* Cloud & Account Settings Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCloudSettingsInitialTab('firebase');
                    setIsCloudSettingsOpen(true);
                  }}
                  title="Firebase Real-Time Sync & ImageKit Cloud Storage Settings"
                  className="px-2.5 sm:px-3 py-1.5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs font-serif font-bold transition border border-[#c8d7e3] flex items-center space-x-1 shadow-xs cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span className="hidden sm:inline">Settings</span>
                </button>

                {/* Password Changer Button */}
                <button
                  type="button"
                  id="host-change-password-btn"
                  onClick={handleOpenChangePassword}
                  title="Change Host Dashboard Access Password"
                  className="px-2.5 sm:px-3 py-1.5 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs font-serif font-bold transition border border-[#c8d7e3] flex items-center space-x-1 shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span className="hidden sm:inline">Password</span>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Sign out of Host Portal"
                  className="px-2.5 sm:px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#475569] hover:text-[#18232c] rounded-xl text-xs font-serif font-semibold transition border border-[#c8d7e3] flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>

            {/* Tier 2: Dedicated Navigation Section (Primary Guest Dashboard & Operation Settings) */}
            <div className="w-full bg-[#ebf2f7]/95 p-1.5 rounded-2xl border border-[#c8d7e3] shadow-xs shrink-0 flex items-center justify-between gap-2 overflow-x-auto">
              {/* Primary Views: Guest List, Arrivals Summary & Seating Plan */}
              <nav
                ref={navTabsRef}
                className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5"
              >
                <button
                  type="button"
                  id="host-tab-list"
                  data-tab-id="list"
                  onClick={() => setView('list')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-serif font-semibold transition flex items-center space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    view === 'list'
                      ? 'bg-[#ffffff] text-[#3A5A74] shadow-xs border border-[#c8d7e3] font-bold'
                      : 'text-[#475569] hover:text-[#18232c] hover:bg-white/60'
                  }`}
                >
                  <List className="w-4 h-4 text-[#3A5A74]" />
                  <span>Guest List</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                    {guests.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="host-tab-summary"
                  data-tab-id="summary"
                  onClick={() => setView('summary')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-serif font-semibold transition flex items-center space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    view === 'summary'
                      ? 'bg-[#ffffff] text-[#3A5A74] shadow-xs border border-[#c8d7e3] font-bold'
                      : 'text-[#475569] hover:text-[#18232c] hover:bg-white/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#3c6b4e]" />
                  <span>Arrivals Summary</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                    checkInPercentage === 100 
                      ? 'bg-[#3c6b4e] text-white' 
                      : checkInPercentage > 0 
                      ? 'bg-[#3A5A74] text-white' 
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {checkInPercentage}%
                  </span>
                </button>

                <button
                  type="button"
                  id="host-tab-seating"
                  data-tab-id="seating"
                  onClick={() => setView('seating')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-serif font-semibold transition flex items-center space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    view === 'seating'
                      ? 'bg-[#ffffff] text-[#3A5A74] shadow-xs border border-[#c8d7e3] font-bold'
                      : 'text-[#475569] hover:text-[#18232c] hover:bg-white/60'
                  }`}
                >
                  <ChairIcon className="w-4 h-4 text-[#3A5A74]" />
                  <span>Seating Plan</span>
                </button>
              </nav>

              {/* Dedicated Operation Settings Tab */}
              <div className="flex items-center space-x-1.5 shrink-0 border-l border-[#c8d7e3] pl-2 sm:pl-3">
                <button
                  type="button"
                  id="host-tab-operations"
                  data-tab-id="operations"
                  onClick={() => setView('operations')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    view === 'operations' || ['slideshow', 'invitation', 'qr-display', 'guestbook', 'media', 'themes'].includes(view)
                      ? 'bg-[#3A5A74] text-white shadow-sm border border-[#274155]'
                      : 'bg-white/90 hover:bg-white text-[#3A5A74] hover:text-[#274155] border border-[#c8d7e3]'
                  }`}
                  title="Open Operation Settings for Invitation Slideshow, Wedding Details, QR Display, Guestbook, Media & Themes"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Operation Settings</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                    view === 'operations' || ['slideshow', 'invitation', 'qr-display', 'guestbook', 'media', 'themes'].includes(view)
                      ? 'bg-white/20 text-white'
                      : 'bg-[#3A5A74] text-white'
                  }`}>
                    6
                  </span>
                </button>
              </div>
            </div>

            {/* Password Update Toast */}
            {passwordToast && (
              <div className="p-3.5 bg-emerald-50 text-emerald-950 rounded-2xl text-xs sm:text-sm font-serif font-semibold border border-emerald-300 flex items-center justify-between animate-in fade-in shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{passwordToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordToast(null)}
                  className="text-emerald-700 hover:text-emerald-950 p-1"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* View 1: Guest List */}
            {view === 'list' && (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col xl:flex-row gap-4 pr-1 sm:pr-2 overscroll-contain touch-pan-y">
                {/* Main Left Section: Metrics, Toolbar, Search, Table */}
                <div className="flex-1 min-w-0 space-y-3 flex flex-col">
                  {/* Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                      <div className="text-xs sm:text-sm font-serif font-bold text-[#506173] uppercase tracking-wider">
                        Total Responses
                      </div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#18232c] mt-1">
                        {guests.length}
                      </div>
                    </div>
                    <div className="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                      <div className="text-xs sm:text-sm font-serif font-bold text-[#3c6b4e] uppercase tracking-wider">
                        Attending
                      </div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#3c6b4e] mt-1">
                        {attendingGuests.length}
                      </div>
                    </div>
                    <div className="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                      <div className="text-xs sm:text-sm font-serif font-bold text-[#a83232] uppercase tracking-wider">
                        Declined
                      </div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#a83232] mt-1">
                        {declinedGuests.length}
                      </div>
                    </div>
                    <div className="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                      <div className="text-xs sm:text-sm font-serif font-bold text-[#3A5A74] uppercase tracking-wider">
                        Total Headcount
                      </div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#3A5A74] mt-1">
                        {totalHeadcount}
                      </div>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="p-3 bg-[#ebf2f7] rounded-xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                      <button
                        onClick={() => setIsAddGuestModalOpen(true)}
                        className="px-3.5 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition border border-[#4D708E]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Guest</span>
                      </button>

                      <label
                        title="Import guests from CSV"
                        className="px-3.5 py-2 bg-[#506173] hover:bg-[#3d4b5a] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 cursor-pointer transition shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Import CSV</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvFileChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={() => exportGuestsToCsv(filteredAndSortedGuests.length > 0 ? filteredAndSortedGuests : guests)}
                        title="Export guest list to CSV"
                        className="px-3.5 py-2 bg-[#3c6b4e] hover:bg-[#2c533c] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV ({filteredAndSortedGuests.length})</span>
                      </button>

                      {/* Quick Select All / Deselect All button */}
                      {filteredAndSortedGuests.length > 0 && (
                        <button
                          onClick={toggleSelectAllFiltered}
                          title={isAllFilteredSelected ? "Deselect all filtered guests" : "Select all filtered guests"}
                          className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition border ${
                            isAllFilteredSelected
                              ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                              : 'bg-white text-[#3A5A74] hover:bg-[#e2edf6] border-[#c8d7e3]'
                          }`}
                        >
                          {isAllFilteredSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : isSomeFilteredSelected ? (
                            <MinusSquare className="w-4 h-4 text-[#3A5A74]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#506173]" />
                          )}
                          <span>{isAllFilteredSelected ? 'Deselect All' : `Select All (${filteredAndSortedGuests.length})`}</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={downloadSampleCsvTemplate}
                      className="text-[#3A5A74] font-serif font-bold hover:underline text-xs sm:text-sm flex items-center space-x-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#506173]" />
                      <span>Sample CSV Template</span>
                    </button>
                  </div>

                  {/* Search & Organize Filter Bar */}
                  <div className="p-3 bg-[#f6fafc] rounded-2xl border border-[#c8d7e3] space-y-2.5">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      {/* Search Bar for Guest Name, Email, Table, etc */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#506173]" />
                        <input
                          type="text"
                          value={guestSearchQuery}
                          onChange={(e) => setGuestSearchQuery(e.target.value)}
                          placeholder="Search guest by name, email, table, or note..."
                          className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-[#c8d7e3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3A5A74] text-[#18232c] placeholder:text-slate-400"
                        />
                        {guestSearchQuery && (
                          <button
                            onClick={() => setGuestSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#18232c] p-0.5 rounded-full"
                            title="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Table Dropdown Filter */}
                      {availableTables.length > 0 && (
                        <div className="sm:w-44">
                          <select
                            value={guestTableFilter}
                            onChange={(e) => setGuestTableFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#c8d7e3] rounded-xl text-xs sm:text-sm text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                          >
                            <option value="all">All Tables ({guests.length})</option>
                            {availableTables.map((tbl) => (
                              <option key={tbl} value={tbl}>
                                {tbl} ({guests.filter(g => g.table === tbl).length})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Filter Status Chips and Count Summary */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#c8d7e3]/60 text-xs sm:text-sm">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-[#506173] font-semibold flex items-center mr-1">
                          <Filter className="w-3.5 h-3.5 mr-1" />
                          Filter:
                        </span>
                        <button
                          onClick={() => setGuestStatusFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            guestStatusFilter === 'all'
                              ? 'bg-[#3A5A74] text-white shadow-xs'
                              : 'bg-white text-[#506173] hover:bg-[#ebf2f7] border border-[#c8d7e3]'
                          }`}
                        >
                          All ({guests.length})
                        </button>
                        <button
                          onClick={() => setGuestStatusFilter('yes')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            guestStatusFilter === 'yes'
                              ? 'bg-[#3c6b4e] text-white shadow-xs'
                              : 'bg-white text-[#3c6b4e] hover:bg-emerald-50 border border-[#c8d7e3]'
                          }`}
                        >
                          Attending ({attendingGuests.length})
                        </button>
                        <button
                          onClick={() => setGuestStatusFilter('no')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            guestStatusFilter === 'no'
                              ? 'bg-[#a83232] text-white shadow-xs'
                              : 'bg-white text-[#a83232] hover:bg-rose-50 border border-[#c8d7e3]'
                          }`}
                        >
                          Declined ({declinedGuests.length})
                        </button>

                        {(guestSearchQuery || guestStatusFilter !== 'all' || guestTableFilter !== 'all' || checkInFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setGuestSearchQuery('');
                              setGuestStatusFilter('all');
                              setGuestTableFilter('all');
                              setCheckInFilter('all');
                            }}
                            className="text-[#3A5A74] hover:underline text-xs font-semibold ml-2 flex items-center"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset Filters
                          </button>
                        )}
                      </div>

                      <div className="text-[#506173] text-xs font-semibold">
                        Showing <span className="text-[#18232c] font-bold">{filteredAndSortedGuests.length}</span> of {guests.length} guest{guests.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions Bar when 1 or more guests are selected */}
                  {selectedGuestIds.length > 0 && (
                    <div className="p-3 bg-[#e8f1f8] rounded-xl border border-[#96b8d4] flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-[#18232c] font-semibold">
                        <span className="w-7 h-7 rounded-lg bg-[#3A5A74] text-white flex items-center justify-center font-bold text-xs">
                          {selectedGuestIds.length}
                        </span>
                        <span>
                          guest{selectedGuestIds.length > 1 ? 's' : ''} selected
                          {isAllFilteredSelected && filteredAndSortedGuests.length === guests.length && ' (all guests)'}
                        </span>
                        <button
                          onClick={handleDeselectAll}
                          className="text-[#3A5A74] hover:underline text-xs ml-2 font-medium"
                        >
                          Deselect All
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleBatchCheckIn(true)}
                          className="px-3 py-1.5 bg-[#3c6b4e] hover:bg-[#2c533c] text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Check-In Selected</span>
                        </button>
                        <button
                          onClick={handleOpenBulkDeleteConfirm}
                          disabled={isBulkDeleting}
                          className="px-3 py-1.5 bg-[#a83232] hover:bg-[#8b2222] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                          title="Delete all selected guests"
                        >
                          {isBulkDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Delete ({selectedGuestIds.length})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Guest List Table */}
                  <div className="border border-[#c8d7e3] rounded-2xl bg-[#ffffff] relative overflow-x-auto shadow-xs flex-1">
                    <table className="w-full text-left font-serif min-w-[620px]">
                      <thead className="bg-[#ebf2f7] text-[#3A5A74] uppercase font-bold sticky top-0 backdrop-blur-sm border-b border-[#c8d7e3] text-xs sm:text-sm z-10">
                        <tr>
                          {/* Select All Checkbox Column */}
                          <th className="p-3.5 w-12 text-center">
                            <button
                              type="button"
                              onClick={toggleSelectAllFiltered}
                              title={isAllFilteredSelected ? "Deselect all" : "Select all filtered"}
                              className="p-1 rounded hover:bg-[#dbe7f0] text-[#3A5A74] transition inline-flex items-center justify-center"
                            >
                              {isAllFilteredSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#3A5A74]" />
                              ) : isSomeFilteredSelected ? (
                                <MinusSquare className="w-4 h-4 text-[#3A5A74]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </th>

                          {/* Guest Name Header with Sort */}
                          <th className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleSortClick('name')}
                              className="flex items-center space-x-1.5 hover:text-[#18232c] transition uppercase font-bold"
                            >
                              <span>Guest Name</span>
                              {guestSortField === 'name' ? (
                                guestSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </th>

                          {/* Status Header with Sort */}
                          <th className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleSortClick('status')}
                              className="flex items-center space-x-1.5 hover:text-[#18232c] transition uppercase font-bold"
                            >
                              <span>Status</span>
                              {guestSortField === 'status' ? (
                                guestSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </th>

                          {/* Check-In Column Header */}
                          <th className="p-3.5">
                            <span className="uppercase font-bold">Check-In / Arrived</span>
                          </th>

                          {/* Table / Seat Header with Sort */}
                          <th className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleSortClick('table')}
                              className="flex items-center space-x-1.5 hover:text-[#18232c] transition uppercase font-bold"
                            >
                              <span>Table / Seat</span>
                              {guestSortField === 'table' ? (
                                guestSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </th>

                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c8d7e3] text-[#18232c] text-xs sm:text-sm md:text-base">
                        {filteredAndSortedGuests.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 font-serif">
                              {guestSearchQuery ? (
                                <div className="space-y-3 py-4">
                                  <Search className="w-8 h-8 text-slate-300 mx-auto" />
                                  <div className="text-base font-bold text-[#18232c]">
                                    No guests matching "{guestSearchQuery}"
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-500">
                                    Try checking for spelling errors or clear the search query.
                                  </p>
                                  <button
                                    onClick={() => setGuestSearchQuery('')}
                                    className="px-3.5 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs font-semibold border border-[#c8d7e3]"
                                  >
                                    Clear Search
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-3 py-4">
                                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                                  <div className="text-base font-bold text-[#18232c]">
                                    No guests found
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-500">
                                    No guests match the selected filter criteria.
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredAndSortedGuests.map((g) => {
                            const isSelected = selectedGuestIds.includes(g.id);
                            const isArrived = Boolean(g.checkedIn || g.is_checked_in);
                            const arrivalTimestamp = g.arrivedAt || g.checkedInAt || g.checked_in_at;
                            return (
                              <tr 
                                key={g.id} 
                                className={`transition ${
                                  isSelected 
                                    ? 'bg-[#ebf4fa] hover:bg-[#e1edf6]' 
                                    : 'hover:bg-[#f0f6fa]'
                                }`}
                              >
                                {/* Row Checkbox */}
                                <td className="p-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectGuest(g.id)}
                                    title={isSelected ? `Deselect ${g.name}` : `Select ${g.name}`}
                                    className="p-1 rounded hover:bg-[#dbe7f0] text-[#3A5A74] transition inline-flex items-center justify-center"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-[#3A5A74]" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-400" />
                                    )}
                                  </button>
                                </td>

                                {/* Guest Name & Info */}
                                <td className="p-3.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-sm sm:text-base md:text-lg text-[#18232c]">{g.name}</span>
                                    {g.count && g.count > 1 && (
                                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                                        Party of {g.count}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-x-2">
                                    {g.phone && (
                                      <span className="inline-flex items-center gap-1 font-mono text-[#3A5A74]">
                                        <Phone className="w-3 h-3 text-[#506173]" />
                                        <span>{g.phone}</span>
                                      </span>
                                    )}
                                    {g.phone && g.email && <span className="text-slate-300">•</span>}
                                    {g.email && <span>{g.email}</span>}
                                    {!g.phone && !g.email && <span className="text-slate-400 italic">No contact info</span>}
                                  </div>
                                  {g.note && <div className="text-xs sm:text-sm text-[#3A5A74] italic mt-1 font-medium">"{g.note}"</div>}
                                </td>

                                {/* Status */}
                                <td className="p-3.5">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                                      g.attending === 'yes'
                                        ? 'bg-emerald-100 text-[#245237]'
                                        : 'bg-slate-200 text-[#475569]'
                                    }`}
                                  >
                                    {g.attending === 'yes' ? 'Attending' : 'Declined'}
                                  </span>
                                </td>

                                {/* Check-In Toggle & Arrival Time Column */}
                                <td className="p-3.5">
                                  {g.attending === 'yes' ? (
                                    <div className="flex flex-col items-start gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleGuestCheckIn(g)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                                          isArrived
                                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                            : 'bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3]'
                                        }`}
                                        title={isArrived ? 'Mark as not arrived' : 'Mark guest as checked-in'}
                                      >
                                        <CheckCircle2 className={`w-3.5 h-3.5 ${isArrived ? 'text-emerald-700' : 'text-[#3A5A74]'}`} />
                                        <span>{isArrived ? 'Arrived' : 'Check In'}</span>
                                      </button>
                                      {isArrived && arrivalTimestamp && (
                                        <div 
                                          className="inline-flex items-center text-[10.5px] font-sans font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80"
                                          title={`Arrived: ${new Date(arrivalTimestamp).toLocaleString()}`}
                                        >
                                          <Clock className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                                          <span>{formatArrivalTime(arrivalTimestamp)}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">Declined</span>
                                  )}
                                </td>

                                {/* Table / Seat */}
                                <td className="p-3.5 font-medium">
                                  <span className="inline-flex items-center space-x-1 bg-[#ebf2f7] text-[#3A5A74] px-2.5 py-1 rounded-lg border border-[#c8d7e3] text-xs sm:text-sm font-semibold">
                                    <span>{g.table || '-'} / {g.seat || '-'}</span>
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="p-3.5 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center space-x-1.5">
                                    <button
                                      onClick={() => setEditingGuest(g)}
                                      className="px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#3A5A74] hover:text-white text-[#3A5A74] rounded-xl transition font-semibold text-xs sm:text-sm border border-[#c8d7e3]"
                                      title={`Edit seating & details for ${g.name}`}
                                    >
                                      <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleOpenSingleDeleteConfirm(g)}
                                      className="p-1.5 bg-[#ebf2f7] hover:bg-[#a83232] text-[#a83232] hover:text-white rounded-xl transition border border-[#c8d7e3]"
                                      title={`Delete ${g.name}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Section: Quick Actions & Check-In Sidebar */}
                <div className="w-full xl:w-80 shrink-0 space-y-4">
                  <div className="bg-[#ffffff] rounded-2xl border border-[#c8d7e3] p-4 shadow-sm space-y-4 sticky top-0">
                    <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-3">
                      <h4 className="font-serif font-bold text-[#18232c] text-base flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-[#3c6b4e]" />
                        <span>Quick Actions & Check-In</span>
                      </h4>
                      <span className="text-xs font-serif font-bold bg-[#ebf2f7] text-[#3A5A74] px-2.5 py-0.5 rounded-full border border-[#c8d7e3]">
                        Live Desk
                      </span>
                    </div>

                    {/* Attendance Check-In Progress */}
                    <div className="space-y-2 bg-[#f6fafc] p-3 rounded-xl border border-[#c8d7e3]">
                      <div className="flex items-center justify-between text-xs font-serif font-semibold text-[#506173]">
                        <span>Check-In Progress</span>
                        <span className="text-[#18232c] font-bold">
                          {checkedInGuestsCount} / {attendingGuests.length} Checked-In
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#3c6b4e] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((checkedInGuestsCount / (attendingGuests.length || 1)) * 100))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>{Math.round((checkedInGuestsCount / (attendingGuests.length || 1)) * 100)}% Arrived</span>
                        <span>{attendingGuests.length - checkedInGuestsCount} Pending</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setView('summary')}
                        className="w-full mt-2 py-1.5 px-2 bg-white hover:bg-[#ebf2f7] text-[#3A5A74] hover:text-[#18232c] rounded-lg text-xs font-serif font-bold transition border border-[#c8d7e3] flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#3c6b4e]" />
                        <span>View Arrivals Summary & Pending Guests</span>
                      </button>
                    </div>

                    {/* Quick Check-In Status Filters */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-serif font-bold text-[#18232c] block">Check-In Filter</label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => setCheckInFilter('all')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-serif font-semibold transition ${
                            checkInFilter === 'all'
                              ? 'bg-[#3A5A74] text-white shadow-xs'
                              : 'bg-[#ebf2f7] text-[#506173] hover:bg-[#dbe7f0] border border-[#c8d7e3]'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckInFilter('checked-in')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-serif font-semibold transition ${
                            checkInFilter === 'checked-in'
                              ? 'bg-[#3c6b4e] text-white shadow-xs'
                              : 'bg-[#ebf2f7] text-[#3c6b4e] hover:bg-emerald-100 border border-[#c8d7e3]'
                          }`}
                        >
                          Checked-In ({checkedInGuestsCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckInFilter('pending')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-serif font-semibold transition ${
                            checkInFilter === 'pending'
                              ? 'bg-[#a83232] text-white shadow-xs'
                              : 'bg-[#ebf2f7] text-[#a83232] hover:bg-rose-100 border border-[#c8d7e3]'
                          }`}
                        >
                          Pending ({attendingGuests.length - checkedInGuestsCount})
                        </button>
                      </div>
                    </div>

                    {/* Batch Check-In Actions */}
                    <div className="space-y-2 pt-1 border-t border-[#c8d7e3]/60">
                      <label className="text-xs font-serif font-bold text-[#18232c] block">Batch Actions</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleBatchCheckIn(true)}
                          disabled={selectedGuestIds.length === 0}
                          className="py-2 px-3 bg-[#3c6b4e] hover:bg-[#2c533c] text-white rounded-xl text-xs font-serif font-semibold transition shadow-xs disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Check-In Selected ({selectedGuestIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBatchCheckIn(false)}
                          disabled={selectedGuestIds.length === 0}
                          className="py-2 px-3 bg-[#506173] hover:bg-[#3d4b5a] text-white rounded-xl text-xs font-serif font-semibold transition shadow-xs disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear Selected</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCheckInAllAttending}
                          className="py-2 px-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition shadow-xs flex items-center justify-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Check-In All</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetAllCheckIns}
                          className="py-2 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-serif font-semibold transition shadow-xs flex items-center justify-center space-x-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset All</span>
                        </button>
                      </div>
                    </div>

                    {/* Rapid Check-In Mini List */}
                    <div className="space-y-2 pt-1 border-t border-[#c8d7e3]/60">
                      <div className="flex items-center justify-between text-xs font-serif font-bold text-[#18232c]">
                        <span>Rapid Guest Check-In</span>
                        <span className="text-[11px] text-slate-500 font-normal">1-Click Toggle</span>
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {attendingGuests.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400">No attending guests yet</div>
                        ) : (
                          attendingGuests.map((g) => {
                            const isArrived = Boolean(g.checkedIn || g.is_checked_in);
                            const arrivalTimestamp = g.arrivedAt || g.checkedInAt || g.checked_in_at;
                            return (
                              <div
                                key={g.id}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                                  isArrived
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                    : 'bg-[#f8fafc] border-[#c8d7e3] text-[#18232c]'
                                }`}
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="font-bold truncate">{g.name}</div>
                                  <div className="text-[10px] text-slate-500 truncate">{g.table || 'Table 1'} / {g.seat || 'Seat 1'}</div>
                                  {isArrived && arrivalTimestamp && (
                                    <div className="text-[10px] text-emerald-700 font-sans font-medium flex items-center mt-0.5">
                                      <Clock className="w-2.5 h-2.5 mr-1 text-emerald-600 shrink-0" />
                                      <span>Arrived {formatArrivalTime(arrivalTimestamp)}</span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleGuestCheckIn(g)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-serif transition shrink-0 cursor-pointer ${
                                    isArrived
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                      : 'bg-[#3A5A74] hover:bg-[#274155] text-white shadow-xs'
                                  }`}
                                  title={isArrived ? 'Click to unmark arrival' : 'Click to mark as arrived'}
                                >
                                  {isArrived ? '✓ Arrived' : 'Check In'}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Check-In & Arrivals Summary */}
            {view === 'summary' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 sm:pr-2 overscroll-contain touch-pan-y">
                {/* Section Header & Quick Links */}
                <div className="p-4 sm:p-5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18232c] flex items-center space-x-2">
                      <UserCheck className="w-5 h-5 text-[#3c6b4e]" />
                      <span>Guest Arrivals & Check-In Summary</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                      Live attendance overview, arrival pacing metrics, and queue of guests not yet arrived.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-[#3A5A74] rounded-xl text-xs sm:text-sm font-semibold transition border border-[#c8d7e3] flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                    >
                      <List className="w-4 h-4 text-[#3A5A74]" />
                      <span>Open Full Guest List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportPendingGuestsToCsv(guests)}
                      disabled={pendingGuests.length === 0}
                      className="px-3 py-1.5 sm:py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-[#4D708E] flex items-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                      title="Export unarrived guests to CSV"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Pending ({pendingGuests.length})</span>
                    </button>
                  </div>
                </div>

                {/* Hero KPI Cards & Percentage Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Radial Percentage Metric */}
                  <div className="p-5 bg-gradient-to-br from-white to-[#f4f8fb] rounded-2xl border border-[#c8d7e3] shadow-xs flex items-center space-x-4">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        {/* Background track */}
                        <path
                          className="text-slate-200 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Progress ring */}
                        <path
                          className="text-[#3c6b4e] stroke-current transition-all duration-700 ease-out"
                          strokeDasharray={`${checkInPercentage}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl sm:text-2xl font-serif font-extrabold text-[#18232c] leading-none">
                          {checkInPercentage}%
                        </span>
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#3c6b4e] mt-0.5">
                          Arrived
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-serif font-bold text-[#506173] uppercase tracking-wider">
                        Attendance Rate
                      </div>
                      <div className="text-base sm:text-lg font-serif font-bold text-[#18232c] mt-0.5">
                        {checkedInGuestsCount} of {attendingGuests.length} Checked-In
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {checkedInHeadcount} of {totalHeadcount} total seats occupied on site
                      </p>
                      <div className="mt-2.5 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#3c6b4e] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${checkInPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Headcount & Attendance Split */}
                  <div className="p-5 bg-white rounded-2xl border border-[#c8d7e3] shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold text-[#506173] uppercase tracking-wider">
                          Status Breakdown
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ebf2f7] text-[#3A5A74]">
                          {guests.length} Total RSVPs
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                          <div className="flex items-center space-x-1.5 text-xs text-emerald-800 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Arrived</span>
                          </div>
                          <div className="text-xl font-bold font-serif text-emerald-950 mt-1">
                            {checkedInGuestsCount}
                          </div>
                          <div className="text-[10px] text-emerald-700">
                            {checkedInHeadcount} attendees
                          </div>
                        </div>

                        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                          <div className="flex items-center space-x-1.5 text-xs text-amber-800 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Not Arrived</span>
                          </div>
                          <div className="text-xl font-bold font-serif text-amber-950 mt-1">
                            {pendingGuests.length}
                          </div>
                          <div className="text-[10px] text-amber-700">
                            {pendingHeadcount} attendees
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Confirmed Attending: <strong className="text-[#18232c]">{attendingGuests.length}</strong></span>
                      <span>Declined: <strong className="text-slate-600">{declinedGuests.length}</strong></span>
                    </div>
                  </div>

                  {/* Card 3: Schedule & Ceremony Pacing */}
                  <div className="p-5 bg-white rounded-2xl border border-[#c8d7e3] shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-serif font-bold text-[#506173] uppercase tracking-wider flex items-center justify-between">
                        <span>Event Timeline & Target</span>
                        <span className="flex items-center space-x-1 text-emerald-700 font-sans font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Live Desk Active</span>
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 bg-[#f8fafc] rounded-xl border border-slate-200">
                          <span className="text-slate-600 font-medium flex items-center">
                            <Church className="w-3.5 h-3.5 text-[#3A5A74] mr-1.5" />
                            Ceremony:
                          </span>
                          <span className="font-bold text-[#18232c]">{formData.churchTime || '2:00 PM PST'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-[#f8fafc] rounded-xl border border-slate-200">
                          <span className="text-slate-600 font-medium flex items-center">
                            <Clock className="w-3.5 h-3.5 text-[#3A5A74] mr-1.5" />
                            Reception Gala:
                          </span>
                          <span className="font-bold text-[#18232c]">{formData.time || '4:00 PM PST'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleCheckInAllAttending}
                        disabled={pendingGuests.length === 0}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-serif font-bold bg-[#3c6b4e] hover:bg-[#2c533c] text-white transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Check In All Pending</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAllCheckIns}
                        disabled={checkedInGuestsCount === 0}
                        className="py-1.5 px-2 rounded-lg text-xs font-serif font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset All</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Section: Guests Not Yet Arrived */}
                <div className="bg-white rounded-2xl border border-[#c8d7e3] p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Section Title & Filter/Sort Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#c8d7e3] pb-3.5">
                    <div>
                      <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span>Guests Not Yet Arrived ({pendingGuests.length})</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sorted by expected arrival time or name to help door ushers and hosts welcome incoming guests.
                      </p>
                    </div>

                    {/* Sorting & Search Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search in Pending */}
                      <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={summarySearchQuery}
                          onChange={(e) => setSummarySearchQuery(e.target.value)}
                          placeholder="Search unarrived..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#f8fafc] border border-[#c8d7e3] text-xs outline-none focus:ring-2 focus:ring-[#3A5A74] text-[#18232c]"
                        />
                        {summarySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSummarySearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Sort Selection Buttons */}
                      <div className="inline-flex items-center p-1 bg-[#ebf2f7] rounded-xl border border-[#c8d7e3] text-xs font-serif font-semibold">
                        <span className="px-2 text-slate-500 text-[11px] hidden sm:inline">Sort:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (summarySortBy === 'time') {
                              setSummarySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSummarySortBy('time');
                              setSummarySortDirection('asc');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                            summarySortBy === 'time'
                              ? 'bg-white text-[#3A5A74] font-bold shadow-xs'
                              : 'text-slate-600 hover:text-[#18232c]'
                          }`}
                          title="Sort by Expected Arrival Time"
                        >
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Expected Time</span>
                          {summarySortBy === 'time' && (
                            summarySortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (summarySortBy === 'name') {
                              setSummarySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSummarySortBy('name');
                              setSummarySortDirection('asc');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                            summarySortBy === 'name'
                              ? 'bg-white text-[#3A5A74] font-bold shadow-xs'
                              : 'text-slate-600 hover:text-[#18232c]'
                          }`}
                          title="Sort alphabetically by Name"
                        >
                          <Type className="w-3 h-3 text-[#3A5A74]" />
                          <span>Name</span>
                          {summarySortBy === 'name' && (
                            summarySortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (summarySortBy === 'table') {
                              setSummarySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSummarySortBy('table');
                              setSummarySortDirection('asc');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                            summarySortBy === 'table'
                              ? 'bg-white text-[#3A5A74] font-bold shadow-xs'
                              : 'text-slate-600 hover:text-[#18232c]'
                          }`}
                          title="Sort by Table & Seat assignment"
                        >
                          <ChairIcon className="w-3 h-3 text-[#3A5A74]" />
                          <span>Table</span>
                          {summarySortBy === 'table' && (
                            summarySortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Direction toggle icon */}
                      <button
                        type="button"
                        onClick={() => setSummarySortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#c8d7e3] text-[#3A5A74] transition cursor-pointer"
                        title={summarySortDirection === 'asc' ? 'Ascending (click to invert)' : 'Descending (click to invert)'}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Batch Actions Bar (when pending guests are selected) */}
                  {selectedPendingIds.length > 0 && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold">
                          {selectedPendingIds.length} pending {selectedPendingIds.length === 1 ? 'guest' : 'guests'} selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleBatchCheckInPending(selectedPendingIds)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-serif font-bold transition shadow-xs cursor-pointer flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Selected as Arrived ({selectedPendingIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPendingIds([])}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List / Grid of Pending Guests */}
                  {pendingGuests.length === 0 ? (
                    <div className="py-12 text-center bg-[#f8fafc] rounded-2xl border border-dashed border-[#c8d7e3] space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-[#18232c]">
                        All Confirmed Guests Have Arrived!
                      </h4>
                      <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto">
                        100% of attending guests have been checked in at the arrivals desk. Reception proceedings and banquet service may begin without delay.
                      </p>
                      <button
                        type="button"
                        onClick={() => setView('list')}
                        className="px-4 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <List className="w-4 h-4" />
                        <span>Return to Guest List</span>
                      </button>
                    </div>
                  ) : filteredAndSortedPendingGuests.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 bg-[#f8fafc] rounded-xl border border-slate-200">
                      No unarrived guests match your search query "{summarySearchQuery}".
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={toggleSelectAllPending}
                            className="hover:text-[#3A5A74] font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            {selectedPendingIds.length === filteredAndSortedPendingGuests.length && filteredAndSortedPendingGuests.length > 0 ? (
                              <CheckSquare className="w-3.5 h-3.5 text-[#3A5A74]" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>Select All ({filteredAndSortedPendingGuests.length})</span>
                          </button>
                        </div>
                        <span>
                          Showing {filteredAndSortedPendingGuests.length} unarrived {filteredAndSortedPendingGuests.length === 1 ? 'guest' : 'guests'} • Sorted by {summarySortBy === 'time' ? 'Expected Arrival Time' : summarySortBy === 'name' ? 'Name' : 'Table'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredAndSortedPendingGuests.map((g) => {
                          const isSelected = selectedPendingIds.includes(g.id);
                          const expectedTimeDisplay = g.expectedArrivalTime || g.expectedArrival || formData.churchTime || formData.time || '2:00 PM';
                          const isEditingTime = editingArrivalGuestId === g.id;

                          return (
                            <div
                              key={g.id}
                              className={`p-3.5 rounded-2xl border transition shadow-xs flex flex-col justify-between gap-3 ${
                                isSelected 
                                  ? 'bg-[#ebf2f7] border-[#3A5A74]' 
                                  : 'bg-[#ffffff] hover:bg-[#fafcfe] border-[#c8d7e3]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start space-x-2.5 min-w-0">
                                  {/* Selection Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectPendingGuest(g.id)}
                                    className="mt-0.5 p-0.5 rounded hover:bg-slate-200 text-[#3A5A74] transition cursor-pointer"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-[#3A5A74]" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-400" />
                                    )}
                                  </button>

                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-2 flex-wrap">
                                      <span className="font-bold text-sm sm:text-base text-[#18232c] truncate">
                                        {g.name}
                                      </span>
                                      {g.count && g.count > 1 ? (
                                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                                          Party of {g.count}
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded-md text-[10.5px] text-slate-500 bg-slate-100">
                                          1 guest
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      {g.phone && (
                                        <span className="font-mono text-[#3A5A74] flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-[#506173]" />
                                          <span>{g.phone}</span>
                                        </span>
                                      )}
                                      {g.phone && g.email && <span>•</span>}
                                      {g.email && <span>{g.email}</span>}
                                      {!g.phone && !g.email && <span className="italic">No contact info</span>}
                                    </div>
                                    {g.note && (
                                      <div className="text-xs text-[#3A5A74] italic mt-1 line-clamp-1">
                                        "{g.note}"
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Table / Seat Badge */}
                                <div className="text-right shrink-0">
                                  <div className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                                    <ChairIcon className="w-3 h-3 mr-1 text-[#3A5A74]" />
                                    <span>{g.table || 'Table 1'} • {g.seat || 'Seat 1'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Row: Expected Arrival Time & 1-Click Arrival Button */}
                              <div className="pt-2.5 border-t border-[#c8d7e3]/60 flex items-center justify-between gap-2 flex-wrap">
                                {/* Expected Arrival Time Display / Inline Setter */}
                                <div className="flex items-center space-x-1.5">
                                  {isEditingTime ? (
                                    <div className="flex items-center space-x-1 animate-in fade-in">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <input
                                        type="text"
                                        value={editingArrivalTimeValue}
                                        onChange={(e) => setEditingArrivalTimeValue(e.target.value)}
                                        placeholder="e.g. 2:15 PM"
                                        className="w-24 px-2 py-1 rounded-lg bg-white border border-[#3A5A74] text-xs font-bold outline-none"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveExpectedArrivalTime(g, editingArrivalTimeValue);
                                          } else if (e.key === 'Escape') {
                                            setEditingArrivalGuestId(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveExpectedArrivalTime(g, editingArrivalTimeValue)}
                                        className="p-1 rounded bg-[#3A5A74] text-white hover:bg-[#274155] cursor-pointer"
                                        title="Save expected arrival time"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingArrivalGuestId(null)}
                                        className="p-1 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                                        title="Cancel"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingArrivalGuestId(g.id);
                                        setEditingArrivalTimeValue(g.expectedArrivalTime || g.expectedArrival || expectedTimeDisplay);
                                      }}
                                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-serif font-semibold transition cursor-pointer group"
                                      title="Click to change expected arrival time"
                                    >
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Expected: <strong>{expectedTimeDisplay}</strong></span>
                                      <Edit3 className="w-2.5 h-2.5 text-amber-700 opacity-60 group-hover:opacity-100 ml-1" />
                                    </button>
                                  )}
                                </div>

                                {/* Instant Mark as Arrived Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleGuestCheckIn(g)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-serif font-bold bg-[#3c6b4e] hover:bg-[#2c533c] text-white transition flex items-center space-x-1.5 shadow-xs cursor-pointer ml-auto"
                                  title={`Check in ${g.name} and record arrival time`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark as Arrived</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 2: Seating Arrangement & Ballroom Capacity */}
            {view === 'seating' && (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Ballroom Capacity Architecture & Parameter Controllers */}
                <div className="p-4 sm:p-6 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c8d7e3] pb-3.5">
                    <div>
                      <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                        <ChairIcon className="w-5 h-5 text-[#3A5A74]" />
                        <span>Reception Seating & Ballroom Architecture</span>
                      </h4>
                      <p className="text-xs text-[#475569] mt-0.5">
                        Configure total banquet tables and chairs per table. Adjustments automatically update the guest directory and guest-facing seating charts.
                      </p>
                    </div>

                    {seatingCapacityNotice && (
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{seatingCapacityNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* Adjustable Parameters Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total Tables Controller */}
                    <div className="p-4 bg-white rounded-xl border border-[#c8d7e3] space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-bold text-[#18232c] flex items-center space-x-1.5">
                          <span>Total Reception Tables</span>
                          <span className="text-slate-400 font-normal">(1 – 100)</span>
                        </label>
                        <span className="text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] px-2.5 py-0.5 rounded-full border border-[#c8d7e3]">
                          {activeTotalTables} Tables
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateSeatingCapacity(activeTotalTables - 1, activeSeatsPerTable)}
                          disabled={activeTotalTables <= 1}
                          title="Decrease table count"
                          className="p-2 rounded-lg bg-[#ebf2f7] hover:bg-[#3A5A74] hover:text-white text-[#3A5A74] border border-[#c8d7e3] transition disabled:opacity-40 disabled:hover:bg-[#ebf2f7] disabled:hover:text-[#3A5A74]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={activeTotalTables}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              handleUpdateSeatingCapacity(val, activeSeatsPerTable);
                            }
                          }}
                          className="flex-1 text-center py-2 px-3 rounded-lg border border-[#c8d7e3] font-serif font-bold text-[#18232c] text-base focus:ring-2 focus:ring-[#3A5A74]/30 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSeatingCapacity(activeTotalTables + 1, activeSeatsPerTable)}
                          disabled={activeTotalTables >= 100}
                          title="Increase table count"
                          className="p-2 rounded-lg bg-[#ebf2f7] hover:bg-[#3A5A74] hover:text-white text-[#3A5A74] border border-[#c8d7e3] transition disabled:opacity-40 disabled:hover:bg-[#ebf2f7] disabled:hover:text-[#3A5A74]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Presets for Total Tables */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-500 mr-1">Presets:</span>
                        {[8, 10, 12, 15, 20, 25, 30, 40, 50].map((tPreset) => (
                          <button
                            key={tPreset}
                            type="button"
                            onClick={() => handleUpdateSeatingCapacity(tPreset, activeSeatsPerTable)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                              activeTotalTables === tPreset
                                ? 'bg-[#3A5A74] text-white font-bold shadow-xs'
                                : 'bg-[#ebf2f7] text-[#3A5A74] hover:bg-[#dbe7f0] border border-[#c8d7e3]'
                            }`}
                          >
                            {tPreset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seats Per Table Controller */}
                    <div className="p-4 bg-white rounded-xl border border-[#c8d7e3] space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-bold text-[#18232c] flex items-center space-x-1.5">
                          <span>Seats Per Table (Chairs)</span>
                          <span className="text-slate-400 font-normal">(1 – 50)</span>
                        </label>
                        <span className="text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] px-2.5 py-0.5 rounded-full border border-[#c8d7e3]">
                          {activeSeatsPerTable} Chairs / Table
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateSeatingCapacity(activeTotalTables, activeSeatsPerTable - 1)}
                          disabled={activeSeatsPerTable <= 1}
                          title="Decrease seats per table"
                          className="p-2 rounded-lg bg-[#ebf2f7] hover:bg-[#3A5A74] hover:text-white text-[#3A5A74] border border-[#c8d7e3] transition disabled:opacity-40 disabled:hover:bg-[#ebf2f7] disabled:hover:text-[#3A5A74]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={activeSeatsPerTable}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              handleUpdateSeatingCapacity(activeTotalTables, val);
                            }
                          }}
                          className="flex-1 text-center py-2 px-3 rounded-lg border border-[#c8d7e3] font-serif font-bold text-[#18232c] text-base focus:ring-2 focus:ring-[#3A5A74]/30 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSeatingCapacity(activeTotalTables, activeSeatsPerTable + 1)}
                          disabled={activeSeatsPerTable >= 50}
                          title="Increase seats per table"
                          className="p-2 rounded-lg bg-[#ebf2f7] hover:bg-[#3A5A74] hover:text-white text-[#3A5A74] border border-[#c8d7e3] transition disabled:opacity-40 disabled:hover:bg-[#ebf2f7] disabled:hover:text-[#3A5A74]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Presets for Seats Per Table */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-500 mr-1">Presets:</span>
                        {[6, 8, 10, 12, 14, 16, 20].map((sPreset) => (
                          <button
                            key={sPreset}
                            type="button"
                            onClick={() => handleUpdateSeatingCapacity(activeTotalTables, sPreset)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                              activeSeatsPerTable === sPreset
                                ? 'bg-[#3A5A74] text-white font-bold shadow-xs'
                                : 'bg-[#ebf2f7] text-[#3A5A74] hover:bg-[#dbe7f0] border border-[#c8d7e3]'
                            }`}
                          >
                            {sPreset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Ballroom Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-[#c8d7e3] text-center">
                      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Capacity</span>
                      <span className="font-serif font-bold text-base sm:text-lg text-[#18232c]">
                        {totalBallroomSeats} <span className="text-xs text-slate-400 font-sans">Seats</span>
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#c8d7e3] text-center">
                      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Attending RSVP</span>
                      <span className="font-serif font-bold text-base sm:text-lg text-[#3A5A74]">
                        {totalHeadcount} <span className="text-xs text-slate-400 font-sans">Guests ({attendingGuests.length} parties)</span>
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#c8d7e3] text-center">
                      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Assigned Seats</span>
                      <span className="font-serif font-bold text-base sm:text-lg text-emerald-700">
                        {totalSeatedChairs} <span className="text-xs text-slate-400 font-sans">/ {totalBallroomSeats} Seats ({seatedAttendingGuests.length} parties)</span>
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#c8d7e3] text-center">
                      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Vacant Seats</span>
                      <span className="font-serif font-bold text-base sm:text-lg text-slate-700">
                        {Math.max(0, totalBallroomSeats - totalSeatedChairs)} <span className="text-xs text-slate-400 font-sans">Available</span>
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl border text-center col-span-2 sm:col-span-1 ${
                      unassignedAttendingGuests.length > 0 
                        ? 'bg-amber-50 border-amber-300 text-amber-900' 
                        : 'bg-white border-[#c8d7e3] text-slate-600'
                    }`}>
                      <span className="block text-[11px] uppercase tracking-wider font-semibold">Unassigned Guests</span>
                      <span className={`font-serif font-bold text-base sm:text-lg ${unassignedAttendingGuests.length > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {unassignedAttendingGuests.length} <span className="text-xs font-sans">Parties ({totalUnassignedChairs} seats needed)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar for Tables */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#c8d7e3]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tables or guest names..."
                      value={seatingSearch}
                      onChange={(e) => setSeatingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-[#ebf2f7] border border-[#c8d7e3] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                    />
                    {seatingSearch && (
                      <button
                        type="button"
                        onClick={() => setSeatingSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSeatingFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        seatingFilter === 'all'
                          ? 'bg-[#3A5A74] text-white shadow-xs'
                          : 'bg-[#ebf2f7] text-[#3A5A74] hover:bg-[#dbe7f0] border border-[#c8d7e3]'
                      }`}
                    >
                      All Tables ({allSeatingTables.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeatingFilter('vacant')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        seatingFilter === 'vacant'
                          ? 'bg-[#3A5A74] text-white shadow-xs'
                          : 'bg-[#ebf2f7] text-[#3A5A74] hover:bg-[#dbe7f0] border border-[#c8d7e3]'
                      }`}
                    >
                      Open Seats
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeatingFilter('full')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        seatingFilter === 'full'
                          ? 'bg-[#3A5A74] text-white shadow-xs'
                          : 'bg-[#ebf2f7] text-[#3A5A74] hover:bg-[#dbe7f0] border border-[#c8d7e3]'
                      }`}
                    >
                      Full
                    </button>
                    {unassignedAttendingGuests.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSeatingFilter(seatingFilter === 'unassigned' ? 'all' : 'unassigned')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          seatingFilter === 'unassigned'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        }`}
                      >
                        Unassigned ({unassignedAttendingGuests.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Toast Notification for Quick Seat Changes */}
                {reassignFeedback && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold border border-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{reassignFeedback}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setReassignFeedback(null)} 
                      className="text-emerald-700 hover:text-emerald-900 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Unassigned Guests Fast Placement Tray */}
                {unassignedAttendingGuests.length > 0 && (seatingFilter === 'all' || seatingFilter === 'unassigned') && (
                  <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2 text-amber-900 font-serif font-bold text-sm sm:text-base">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Guests Awaiting Table Placement ({unassignedAttendingGuests.length} parties • {totalUnassignedChairs} seats)</span>
                      </div>
                      <span className="text-xs text-amber-700">Select a table from the dropdown to place their party</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {unassignedAttendingGuests.map((g) => {
                        const partySize = Math.max(1, typeof g.count === 'number' ? g.count : 1);
                        return (
                          <div
                            key={g.id}
                            className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-[#18232c] truncate">{g.name}</p>
                              <p className="text-[11px] text-[#3A5A74] font-medium">
                                Party of {partySize} ({partySize === 1 ? '1 seat' : `${partySize} seats`}) {g.meal ? `• ${g.meal}` : ''}
                              </p>
                            </div>
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const chosenTable = e.target.value;
                                if (chosenTable) {
                                  const destGuests = (allSeatingTables.find(([tn]) => tn === chosenTable)?.[1] || []).filter(item => item.id !== g.id);
                                  const firstOpen = getFirstAvailableSeat(destGuests, activeSeatsPerTable, partySize, g.id);
                                  onUpdateGuest({
                                    ...g,
                                    table: chosenTable,
                                    seat: firstOpen
                                  });
                                  setReassignFeedback(`Placed ${g.name} (Party of ${partySize}) at ${chosenTable} (${firstOpen})`);
                                  setTimeout(() => setReassignFeedback(null), 3500);
                                }
                              }}
                              className="text-xs px-2 py-1.5 rounded-lg bg-[#ebf2f7] border border-[#c8d7e3] text-[#3A5A74] font-semibold outline-none focus:ring-1 focus:ring-[#3A5A74] max-w-[130px] sm:max-w-[150px]"
                            >
                              <option value="" disabled>Seat party at...</option>
                              {allSeatingTables.map(([tName, tGuests]) => {
                                const occupied = getTableOccupiedSeats(tGuests);
                                const avail = Math.max(0, activeSeatsPerTable - occupied);
                                const fits = avail >= partySize;
                                return (
                                  <option key={tName} value={tName} className={!fits && avail === 0 ? 'text-slate-400 bg-slate-100' : ''}>
                                    {tName} ({avail} open • {fits ? 'Fits party' : avail === 0 ? 'Full' : `Needs ${partySize}`})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Table Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allSeatingTables
                    .filter(([tName, tableGuests]) => {
                      const occupied = getTableOccupiedSeats(tableGuests);
                      if (seatingFilter === 'vacant') return occupied < activeSeatsPerTable;
                      if (seatingFilter === 'full') return occupied === activeSeatsPerTable;
                      if (seatingFilter === 'overcapacity') return occupied > activeSeatsPerTable;
                      if (seatingFilter === 'unassigned') return false;
                      return true;
                    })
                    .filter(([tName, tableGuests]) => {
                      if (!seatingSearch.trim()) return true;
                      const q = seatingSearch.toLowerCase().trim();
                      return (
                        tName.toLowerCase().includes(q) ||
                        tableGuests.some((g) => g.name.toLowerCase().includes(q))
                      );
                    })
                    .map(([tName, tableGuests]) => {
                      const occupiedSeats = getTableOccupiedSeats(tableGuests);
                      const availableSeats = Math.max(0, activeSeatsPerTable - occupiedSeats);
                      const occupancyRate = Math.min(100, Math.round((occupiedSeats / activeSeatsPerTable) * 100));
                      const isFull = occupiedSeats === activeSeatsPerTable;
                      const isOver = occupiedSeats > activeSeatsPerTable;
                      const isOpen = occupiedSeats < activeSeatsPerTable;

                      return (
                        <div
                          key={tName}
                          className="p-4 sm:p-5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] space-y-3.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2.5">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  isOver
                                    ? 'bg-amber-500 ring-2 ring-amber-200'
                                    : isFull
                                    ? 'bg-[#3A5A74]'
                                    : occupiedSeats > 0
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-300'
                                }`}
                              ></span>
                              <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg">
                                {tName}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs font-serif font-bold px-2.5 py-1 rounded-full border ${
                                  isOver
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : isFull
                                    ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3]'
                                    : occupiedSeats > 0
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-white text-slate-500 border-slate-200'
                                }`}
                              >
                                {occupiedSeats} / {activeSeatsPerTable} Seats
                                {isOpen && occupiedSeats > 0 && ` (${availableSeats} open)`}
                                {isFull && ' (Full)'}
                                {isOver && ` (${occupiedSeats - activeSeatsPerTable} over)`}
                                <span className="text-[10px] font-sans font-normal text-slate-500 ml-1.5">
                                  • {tableGuests.length} {tableGuests.length === 1 ? 'party' : 'parties'}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Mini Occupancy Bar */}
                          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOver
                                  ? 'bg-amber-500'
                                  : isFull
                                  ? 'bg-[#3A5A74]'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>

                          {/* Seated Guests Roster */}
                          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                            {tableGuests.length === 0 ? (
                              <div className="p-4 bg-[#ffffff]/70 rounded-xl border border-dashed border-[#c8d7e3] text-center text-xs sm:text-sm text-slate-500 font-serif italic">
                                Table currently vacant ({activeSeatsPerTable} seats available).
                              </div>
                            ) : (
                              tableGuests.map((g) => {
                                const isReassigning = reassignGuestId === g.id;
                                const guestPartySize = Math.max(1, typeof g.count === 'number' ? g.count : 1);

                                if (isReassigning) {
                                  // Inline Quick Reassign Dropdown Card
                                  const destGuests = (allSeatingTables.find(([tn]) => tn === reassignTable)?.[1] || []).filter(item => item.id !== g.id);
                                  const seatOptions = reassignTable && reassignTable !== 'Unassigned'
                                    ? getAvailableSeatOptions(destGuests, activeSeatsPerTable, guestPartySize, g.table === reassignTable ? g.seat : undefined, g.id)
                                    : [];

                                  return (
                                    <div
                                      key={g.id}
                                      className="p-3.5 bg-[#ffffff] rounded-xl border-2 border-[#3A5A74] shadow-md space-y-3 font-serif animate-in fade-in"
                                    >
                                      <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2">
                                        <div className="min-w-0 pr-2">
                                          <div className="font-bold text-[#18232c] text-sm truncate flex items-center gap-1.5 flex-wrap">
                                            <span>{g.name}</span>
                                            <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                                              Party of {guestPartySize} ({guestPartySize === 1 ? '1 chair' : `${guestPartySize} chairs`})
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                                            Select destination table & available seat from the dropdowns below:
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setReassignGuestId(null)}
                                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                                          title="Cancel"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
                                        {/* Table Dropdown */}
                                        <div>
                                          <label className="block text-[11px] font-bold text-[#18232c] uppercase tracking-wider mb-1">
                                            Destination Table
                                          </label>
                                          <select
                                            value={reassignTable}
                                            onChange={(e) => {
                                              const newT = e.target.value;
                                              setReassignTable(newT);
                                              if (newT && newT !== 'Unassigned') {
                                                const newTableGuests = (allSeatingTables.find(([tn]) => tn === newT)?.[1] || []).filter(item => item.id !== g.id);
                                                const firstOpen = getFirstAvailableSeat(newTableGuests, activeSeatsPerTable, guestPartySize, g.id);
                                                setReassignSeat(firstOpen);
                                              } else {
                                                setReassignSeat('');
                                              }
                                            }}
                                            className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#c8d7e3] text-xs font-semibold text-[#18232c] outline-none focus:ring-2 focus:ring-[#3A5A74]"
                                          >
                                            <option value="Unassigned">Unassigned (Remove from Table)</option>
                                            {allSeatingTables.map(([tNameCandidate, candGuests]) => {
                                              const candWithoutGuest = candGuests.filter(item => item.id !== g.id);
                                              const occupied = getTableOccupiedSeats(candWithoutGuest);
                                              const openChairs = Math.max(0, activeSeatsPerTable - occupied);
                                              const fits = openChairs >= guestPartySize;
                                              const isCurrentTable = (g.table || '') === tNameCandidate;

                                              let statusLabel = '';
                                              if (isCurrentTable) {
                                                statusLabel = `Current Table • ${openChairs} seats open`;
                                              } else if (openChairs === 0) {
                                                statusLabel = `FULL (0 seats open)`;
                                              } else if (fits) {
                                                statusLabel = `${openChairs} open • Fits party of ${guestPartySize}`;
                                              } else {
                                                statusLabel = `${openChairs} open • Overcapacity by ${guestPartySize - openChairs}`;
                                              }

                                              return (
                                                <option 
                                                  key={tNameCandidate} 
                                                  value={tNameCandidate}
                                                  className={!fits && openChairs === 0 ? 'text-slate-400 bg-slate-100' : ''}
                                                >
                                                  {tNameCandidate} ({statusLabel})
                                                </option>
                                              );
                                            })}
                                          </select>
                                        </div>

                                        {/* Seat Dropdown */}
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <label className="block text-[11px] font-bold text-[#18232c] uppercase tracking-wider">
                                              Available Seat
                                            </label>
                                            {reassignTable !== 'Unassigned' && (
                                              <button
                                                type="button"
                                                onClick={() => setReassignCustomSeat(!reassignCustomSeat)}
                                                className="text-[10px] text-[#3A5A74] hover:underline font-semibold"
                                              >
                                                {reassignCustomSeat ? 'Dropdown' : 'Custom Name'}
                                              </button>
                                            )}
                                          </div>

                                          {reassignTable === 'Unassigned' ? (
                                            <input
                                              type="text"
                                              disabled
                                              value="No seat (Unassigned)"
                                              className="w-full px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-500 italic"
                                            />
                                          ) : reassignCustomSeat ? (
                                            <input
                                              type="text"
                                              value={reassignSeat}
                                              onChange={(e) => setReassignSeat(e.target.value)}
                                              placeholder="e.g. Seat 1 or Head Table"
                                              className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#c8d7e3] text-xs font-semibold text-[#18232c] outline-none focus:ring-2 focus:ring-[#3A5A74]"
                                            />
                                          ) : (
                                            <select
                                              value={reassignSeat}
                                              onChange={(e) => setReassignSeat(e.target.value)}
                                              className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#c8d7e3] text-xs font-semibold text-[#18232c] outline-none focus:ring-2 focus:ring-[#3A5A74]"
                                            >
                                              {seatOptions.map((opt) => (
                                                <option
                                                  key={opt.value}
                                                  value={opt.value}
                                                  disabled={!opt.isAvailable}
                                                  className={!opt.isAvailable ? 'text-slate-400 bg-slate-100' : opt.fitsParty ? 'text-emerald-800 font-semibold' : ''}
                                                >
                                                  {opt.label}
                                                </option>
                                              ))}
                                            </select>
                                          )}
                                        </div>
                                      </div>

                                      {/* Reassign Actions */}
                                      <div className="flex items-center justify-between pt-1 border-t border-[#c8d7e3] flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReassignGuestId(null);
                                            setEditingGuest(g);
                                          }}
                                          className="text-xs text-[#3A5A74] hover:underline font-semibold flex items-center gap-1 font-sans"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>Edit Full Details...</span>
                                        </button>

                                        <div className="flex items-center space-x-2">
                                          <button
                                            type="button"
                                            onClick={() => setReassignGuestId(null)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#475569] hover:bg-slate-100 transition font-sans"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const finalTable = reassignTable === 'Unassigned' ? '' : reassignTable;
                                              const finalSeat = reassignTable === 'Unassigned' ? '' : (reassignSeat || 'Seat 1');
                                              onUpdateGuest({
                                                ...g,
                                                table: finalTable,
                                                seat: finalSeat
                                              });
                                              setReassignFeedback(`Moved ${g.name} (Party of ${guestPartySize}) to ${finalTable || 'Unassigned'} • ${finalSeat || 'No seat'}`);
                                              setTimeout(() => setReassignFeedback(null), 3500);
                                              setReassignGuestId(null);
                                            }}
                                            className="px-3 py-1.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1 transition font-sans"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Confirm Seat</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                // Normal Guest Row on Table Card
                                return (
                                  <div
                                    key={g.id}
                                    className="flex items-center justify-between p-2.5 sm:p-3 bg-[#ffffff] rounded-xl border border-[#c8d7e3] font-serif shadow-2xs hover:border-[#3A5A74]/40 transition"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-bold text-[#18232c] text-sm truncate flex items-center gap-2">
                                        <span>{g.name}</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                                          Party of {guestPartySize}
                                        </span>
                                      </div>
                                      <div className="text-xs text-[#475569] font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                                        <span className="text-[#3A5A74] font-bold">{g.seat || 'Seat 1'}</span>
                                        <span>• Takes {guestPartySize} {guestPartySize === 1 ? 'chair' : 'chairs'}</span>
                                        {g.meal && <span>• {g.meal}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReassignGuestId(g.id);
                                          setReassignTable(g.table || tName);
                                          setReassignSeat(g.seat || 'Seat 1');
                                          setReassignCustomSeat(false);
                                        }}
                                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#ebf2f7] text-[#3A5A74] hover:bg-[#3A5A74] hover:text-white rounded-lg transition text-xs font-semibold border border-[#c8d7e3]"
                                        title={`Change table or seat for ${g.name} (${guestPartySize} chairs)`}
                                      >
                                        <span>Change Seat</span>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* View: Operation Settings Hub Table */}
            {view === 'operations' && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-4 overscroll-contain">
                {/* Executive Overview Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#ebf2f7] via-[#f4f8fa] to-[#ebf2f7] rounded-2xl border border-[#c8d7e3] flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#3A5A74] text-[10px] font-serif font-bold uppercase tracking-widest border border-[#c8d7e3] mb-1.5 shadow-2xs">
                      <SlidersHorizontal className="w-3 h-3 text-[#3A5A74]" />
                      <span>Executive Operations Directory</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#18232c]">
                      Event Operation Settings
                    </h4>
                    <p className="text-xs sm:text-sm text-[#475569] font-serif mt-0.5">
                      Dedicated control center for stationery slideshows, wedding ceremony logistics, QR registries, wishes, media keepsakes, and visual themes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="px-3.5 py-2 rounded-xl text-xs font-serif font-semibold bg-white hover:bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Return to Guest List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCloudSettingsInitialTab('backup');
                        setIsCloudSettingsOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-serif font-semibold bg-[#3A5A74] hover:bg-[#274155] text-white border border-[#274155] transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-sky-200" />
                      <span>Full Backup Suite</span>
                    </button>
                  </div>
                </div>

                {/* Operations Summary KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div 
                    onClick={() => setView('slideshow')}
                    className="p-3 bg-white hover:bg-[#f8fafc] rounded-xl border border-[#c8d7e3] text-center cursor-pointer transition shadow-2xs hover:border-[#3A5A74]/50 group"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">1. Slideshow</span>
                    <span className="text-base sm:text-lg font-bold font-serif text-[#18232c] group-hover:text-[#3A5A74]">
                      {getNormalizedSlides().length} Cards
                    </span>
                  </div>

                  <div 
                    onClick={() => setView('invitation')}
                    className="p-3 bg-white hover:bg-[#f8fafc] rounded-xl border border-[#c8d7e3] text-center cursor-pointer transition shadow-2xs hover:border-[#3A5A74]/50 group"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">2. Details</span>
                    <span className="text-base sm:text-lg font-bold font-serif text-[#18232c] group-hover:text-[#3A5A74]">
                      {formData.timeline.length} Events
                    </span>
                  </div>

                  <div 
                    onClick={() => setView('qr-display')}
                    className="p-3 bg-white hover:bg-[#f8fafc] rounded-xl border border-[#c8d7e3] text-center cursor-pointer transition shadow-2xs hover:border-[#3A5A74]/50 group"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">3. QR Registry</span>
                    <span className="text-base sm:text-lg font-bold font-serif text-[#18232c] group-hover:text-[#3A5A74]">
                      {getNormalizedGiftQrList(formData).length} Channels
                    </span>
                  </div>

                  <div 
                    onClick={() => setView('guestbook')}
                    className="p-3 bg-white hover:bg-[#f8fafc] rounded-xl border border-[#c8d7e3] text-center cursor-pointer transition shadow-2xs hover:border-[#3A5A74]/50 group"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">4. Guestbook</span>
                    <span className="text-base sm:text-lg font-bold font-serif text-[#18232c] group-hover:text-[#3A5A74]">
                      {writtenGuestbookEntries.length} Wishes
                    </span>
                  </div>

                  <div 
                    onClick={() => setView('media')}
                    className="p-3 bg-white hover:bg-[#f8fafc] rounded-xl border border-[#c8d7e3] text-center cursor-pointer transition shadow-2xs hover:border-[#3A5A74]/50 group"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">5. Media Keepsakes</span>
                    <span className="text-base sm:text-lg font-bold font-serif text-[#18232c] group-hover:text-[#3A5A74]">
                      {mediaKeepsakeEntries.length} Keepsakes
                    </span>
                  </div>

                  <div 
                    onClick={() => setView('themes')}
                    className="p-3 bg-white hover:bg-[#f8fafc] rounded-xl border border-[#c8d7e3] text-center cursor-pointer transition shadow-2xs hover:border-[#3A5A74]/50 group"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">6. Themes</span>
                    <span className="text-base sm:text-lg font-bold font-serif text-[#C5A059] group-hover:text-[#a57f35]">
                      5 Themes
                    </span>
                  </div>
                </div>

                {/* The Operation Settings Master Table */}
                <div className="bg-white rounded-2xl border border-[#c8d7e3] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[#e2ecf4] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-[#3A5A74]" />
                      <h5 className="font-serif font-bold text-sm sm:text-base text-[#18232c]">
                        Operation Settings Directory (6 Modules)
                      </h5>
                    </div>
                    <span className="text-xs text-[#506173] font-serif">
                      Click any module row or action button to edit settings
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm font-serif">
                      <thead>
                        <tr className="bg-[#ebf2f7]/80 text-[#506173] uppercase tracking-wider text-[10px] sm:text-[11px] font-bold border-b border-[#c8d7e3]">
                          <th className="py-3 px-4 sm:px-5">Operation Module</th>
                          <th className="py-3 px-4">Live Configuration &amp; Key Values</th>
                          <th className="py-3 px-4 hidden lg:table-cell">Description &amp; Capabilities</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 sm:px-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2ecf4]">
                        {/* 1. INVITATION SLIDESHOW */}
                        <tr className="hover:bg-[#f8fafc] transition-colors group cursor-pointer" onClick={() => setView('slideshow')}>
                          <td className="py-3.5 px-4 sm:px-5 align-middle">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] group-hover:bg-[#3A5A74] text-[#3A5A74] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-[#c8d7e3] shrink-0">
                                <ScrollText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-sm sm:text-base text-[#18232c] group-hover:text-[#3A5A74] transition-colors block">
                                  Invitation Slideshow
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Letterpress Suite &amp; Photos
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#18232c]">
                                {getNormalizedSlides().length} Cards Uploaded
                              </div>
                              <div className="text-[11px] text-[#506173]">
                                RSVP Deadline: <span className="font-mono text-[#3A5A74]">{formData.rsvpDeadline || formData.deadline || 'March 10, 2027'}</span>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-sans font-medium">
                                ✓ ImageKit.io Global CDN
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell align-middle text-[#506173] text-xs leading-relaxed">
                            Organize stationery sequence, add captions, configure RSVP deadline reminder, and upload high-res cards.
                          </td>
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider border ${
                              formData.invitationEnabled !== false 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {formData.invitationEnabled !== false ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setView('slideshow');
                              }}
                              className="px-3.5 py-1.5 bg-[#ebf2f7] hover:bg-[#3A5A74] text-[#3A5A74] hover:text-white rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Configure Slides →
                            </button>
                          </td>
                        </tr>

                        {/* 2. WEDDING DETAILS */}
                        <tr className="hover:bg-[#f8fafc] transition-colors group cursor-pointer" onClick={() => setView('invitation')}>
                          <td className="py-3.5 px-4 sm:px-5 align-middle">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] group-hover:bg-[#3A5A74] text-[#3A5A74] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-[#c8d7e3] shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-sm sm:text-base text-[#18232c] group-hover:text-[#3A5A74] transition-colors block">
                                  Wedding Details
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Ceremony, Reception &amp; Timeline
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#18232c] truncate max-w-[240px]">
                                {formData.title || 'Mark & Karla'}
                              </div>
                              <div className="text-[11px] text-[#506173] truncate max-w-[240px]">
                                💒 {formData.churchName || 'Holy Cross Parish'} ({formData.churchTime || '2:00 PM PST'})
                              </div>
                              <div className="text-[11px] text-[#506173] truncate max-w-[240px]">
                                🌿 {formData.venue || "Cai's Garden & Events"} • {formData.timeline.length} Program Events
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell align-middle text-[#506173] text-xs leading-relaxed">
                            Couple names, celebration date, church ceremony venue, reception grounds, navigation maps, and order of proceedings.
                          </td>
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Configured
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setView('invitation');
                              }}
                              className="px-3.5 py-1.5 bg-[#ebf2f7] hover:bg-[#3A5A74] text-[#3A5A74] hover:text-white rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Edit Details →
                            </button>
                          </td>
                        </tr>

                        {/* 3. QR DISPLAY */}
                        <tr className="hover:bg-[#f8fafc] transition-colors group cursor-pointer" onClick={() => setView('qr-display')}>
                          <td className="py-3.5 px-4 sm:px-5 align-middle">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] group-hover:bg-[#3A5A74] text-[#3A5A74] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-[#c8d7e3] shrink-0">
                                <QrCode className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-sm sm:text-base text-[#18232c] group-hover:text-[#3A5A74] transition-colors block">
                                  QR Display
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Gift &amp; Monetary Registry
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#18232c]">
                                {getNormalizedGiftQrList(formData).length} Payment Channels
                              </div>
                              <div className="text-[11px] text-[#506173] truncate max-w-[240px]">
                                {getNormalizedGiftQrList(formData).map(q => q.bankName || 'Channel').join(', ')}
                              </div>
                              <div className="text-[10px] text-[#3A5A74] font-medium">
                                1-Click Copy &amp; Download Active
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell align-middle text-[#506173] text-xs leading-relaxed">
                            Upload GCash, Maya, and bank QR codes, account holder names, account numbers, and couple's registry notes.
                          </td>
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider border ${
                              formData.giftEnabled !== false 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {formData.giftEnabled !== false ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setView('qr-display');
                              }}
                              className="px-3.5 py-1.5 bg-[#ebf2f7] hover:bg-[#3A5A74] text-[#3A5A74] hover:text-white rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Manage QR Codes →
                            </button>
                          </td>
                        </tr>

                        {/* 4. WISHES GUESTBOOK */}
                        <tr className="hover:bg-[#f8fafc] transition-colors group cursor-pointer" onClick={() => setView('guestbook')}>
                          <td className="py-3.5 px-4 sm:px-5 align-middle">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] group-hover:bg-[#3A5A74] text-[#3A5A74] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-[#c8d7e3] shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-sm sm:text-base text-[#18232c] group-hover:text-[#3A5A74] transition-colors block">
                                  Wishes Guestbook
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Messages &amp; Moderation
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#18232c]">
                                {writtenGuestbookEntries.length} Written Wishes
                              </div>
                              <div className="text-[11px] text-[#506173]">
                                {guestbookEntries.filter(e => e.isFeatured).length} Pinned on Hero
                              </div>
                              <div className="text-[10px] text-emerald-700 font-sans font-medium">
                                Real-Time Firestore Sync
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell align-middle text-[#506173] text-xs leading-relaxed">
                            Review guest messages, pin heartwarming blessings to hero ticker, delete spam, and export entries to CSV.
                          </td>
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider border ${
                              formData.guestbookEnabled !== false 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {formData.guestbookEnabled !== false ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setView('guestbook');
                              }}
                              className="px-3.5 py-1.5 bg-[#ebf2f7] hover:bg-[#3A5A74] text-[#3A5A74] hover:text-white rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Moderate Wishes →
                            </button>
                          </td>
                        </tr>

                        {/* 5. VIDEOS & IMAGES */}
                        <tr className="hover:bg-[#f8fafc] transition-colors group cursor-pointer" onClick={() => setView('media')}>
                          <td className="py-3.5 px-4 sm:px-5 align-middle">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] group-hover:bg-[#3A5A74] text-[#3A5A74] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-[#c8d7e3] shrink-0">
                                <Film className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-sm sm:text-base text-[#18232c] group-hover:text-[#3A5A74] transition-colors block">
                                  Videos &amp; Images
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Keepsakes (R2 &amp; ImageKit)
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#18232c]">
                                {mediaKeepsakeEntries.length} Total Keepsakes
                              </div>
                              <div className="text-[11px] text-[#506173]">
                                🎥 {mediaVideoEntries.length} Videos (Cloudflare R2)
                              </div>
                              <div className="text-[11px] text-[#506173]">
                                📷 {mediaPhotoEntries.length} Photos (ImageKit CDN)
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell align-middle text-[#506173] text-xs leading-relaxed">
                            Manage live video toast recordings stored in Cloudflare R2, uploaded guest memories, photo lightboxes, and moderation.
                          </td>
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider border ${
                              formData.videoBlessingsEnabled !== false 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {formData.videoBlessingsEnabled !== false ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setView('media');
                              }}
                              className="px-3.5 py-1.5 bg-[#ebf2f7] hover:bg-[#3A5A74] text-[#3A5A74] hover:text-white rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Manage Media →
                            </button>
                          </td>
                        </tr>

                        {/* 6. CURATED DESIGN THEMES */}
                        <tr className="hover:bg-[#f8fafc] transition-colors group cursor-pointer" onClick={() => setView('themes')}>
                          <td className="py-3.5 px-4 sm:px-5 align-middle">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-[#fdf8ed] group-hover:bg-[#C5A059] text-[#C5A059] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-[#e8d5a3] shrink-0">
                                <Palette className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-sm sm:text-base text-[#18232c] group-hover:text-[#8a6e38] transition-colors block">
                                  Curated Design Themes
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Palettes, Fonts &amp; Atmosphere
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#18232c]">
                                Theme: <span className="text-[#3A5A74] font-bold">{(formData.themeColor || 'dusty-blue').replace('-', ' ').toUpperCase()}</span>
                              </div>
                              <div className="text-[11px] text-[#506173]">
                                Font: <span className="italic">{(formData.titleFont || 'great-vibes').replace('-', ' ').toUpperCase()}</span>
                              </div>
                              <div className="text-[10px] text-[#C5A059] font-medium">
                                Falling Petals &amp; Ambient Glow Active
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell align-middle text-[#506173] text-xs leading-relaxed">
                            Curated luxury wedding color palettes (Dusty Blue, Burgundy, Emerald, Navy, Champagne), script fonts, and atmospheric overlays.
                          </td>
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-[#fdf8ed] text-[#8a6e38] border border-[#e8d5a3]">
                              5 Themes
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setView('themes');
                              }}
                              className="px-3.5 py-1.5 bg-[#fdf8ed] hover:bg-[#C5A059] text-[#8a6e38] hover:text-white rounded-xl text-xs font-semibold border border-[#e8d5a3] transition shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Customize Themes →
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Unified Invitation & Photos Customizer */}
            {view === 'invitation' && (
              <form onSubmit={handleSaveInvitation} className="flex-1 overflow-y-auto space-y-6 pr-1 text-sm font-serif">
                {/* Back to Operation Settings Hub */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#ffffff] p-2.5 sm:p-3 rounded-2xl border border-[#c8d7e3] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setView('operations')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] hover:bg-[#dbe7f0] border border-[#c8d7e3] transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Operation Settings Table</span>
                  </button>
                  <span className="text-xs font-serif font-semibold text-[#506173]">
                    Operation Settings / <strong className="text-[#18232c]">Wedding Details &amp; Schedule</strong>
                  </span>
                </div>
                {/* Top status bar & actions */}
                <div className="p-4 sm:p-5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#3A5A74]" />
                      <span>Invitation Customizer & Photo Manager</span>
                    </h4>
                    <p className="text-[#475569] text-xs sm:text-sm font-serif italic mt-0.5">
                      Customize couple portrait, ceremony timeline, dinner menu, and wedding details.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onResetToDefaults && (
                      <button
                        type="button"
                        onClick={handleOpenResetModal}
                        title="Protected with Security Password & Confirmation Alert"
                        className="px-3.5 py-2 bg-[#ffffff] hover:bg-rose-50 text-rose-700 hover:text-rose-800 rounded-xl text-xs sm:text-sm font-semibold border border-rose-200 transition flex items-center space-x-1.5 shadow-xs"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Reset Defaults...</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md border border-[#4D708E] flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4 text-sky-200" />
                      <span>Apply & Save All Changes</span>
                    </button>
                  </div>
                </div>

                {resetSuccessToast && (
                  <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl text-xs sm:text-sm font-semibold border border-amber-300 flex items-start space-x-3 animate-in fade-in shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Security Authorized: Reset Complete</p>
                      <p className="text-amber-800 text-xs mt-0.5">
                        Wedding details, guest rosters, and Firestore database have been restored to template defaults.
                      </p>
                    </div>
                  </div>
                )}

                {savedNotice && (
                  <div className="p-3.5 bg-emerald-50 text-[#245237] rounded-xl text-sm font-bold border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#245237]" />
                    <span>✓ Invitation details and photos successfully saved and applied to live invitation!</span>
                  </div>
                )}

                {/* Formal Invitation Slideshow Quick Navigation Banner */}
                <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#3A5A74] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ScrollText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#18232c] text-sm sm:text-base">
                        Formal Invitation Slideshow & Sliding Photos
                      </p>
                      <p className="text-[#475569] text-xs sm:text-sm">
                        Upload scanned cards, reorder slides, or add image URLs for the responsive invitation carousel.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('slideshow')}
                    className="px-4 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>Open Slideshow Manager</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* SECTION 1: PHOTO & VISUAL MEDIA MANAGER */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2.5 flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-[#3A5A74]" />
                      <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                        Hero Photo URL & Portrait (Top Emblem)
                      </h4>
                    </div>
                    {/* Live URL validation badge */}
                    {heroImgStatus === 'valid' ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#245237] border border-emerald-200 text-xs sm:text-sm font-semibold">
                        <Check className="w-3.5 h-3.5 text-[#245237]" />
                        <span>Photo URL is verified & active</span>
                      </span>
                    ) : heroImgStatus === 'loading' ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#506173] border border-amber-200 text-xs sm:text-sm font-semibold">
                        <span>Testing image link...</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#3A5A74] border border-rose-200 text-xs sm:text-sm font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-[#3A5A74]" />
                        <span>Image link error (fallback active)</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Live Portrait Preview Box */}
                    <div className="flex flex-col items-center justify-center p-3 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 border-2 border-[#5B7C99]/80 shadow-md bg-[#ffffff] overflow-hidden mb-2">
                        <img
                          src={formData.heroImage || 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=500&q=80'}
                          alt="Hero Preview"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=500&q=80';
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#506173] font-bold uppercase tracking-wider">
                        Hero Preview
                      </span>
                    </div>

                    {/* URL Input & Sample Buttons */}
                    <div className="md:col-span-3 space-y-3">
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                          Couple Photo URL (Direct Image Link)
                        </label>
                        <input
                          type="text"
                          value={formData.heroImage || ''}
                          onChange={(e) => handleFieldChange('heroImage', e.target.value)}
                          placeholder="https://images.unsplash.com/... or any direct image URL"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                        />
                        <p className="text-[#475569] text-xs sm:text-sm mt-1">
                          Supports Unsplash, Imgur, Cloudinary, AWS S3, or any direct HTTPS photo link.
                        </p>
                      </div>

                      {/* Quick 1-Click Test Photos */}
                      <div>
                        <span className="block text-xs sm:text-sm font-semibold text-[#475569] mb-1.5">
                          Quick Sample Photos (Click to test):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {SAMPLE_HERO_PHOTOS.map((sample) => (
                            <button
                              key={sample.label}
                              type="button"
                              onClick={() => handleFieldChange('heroImage', sample.url)}
                              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition border ${
                                formData.heroImage === sample.url
                                  ? 'bg-[#3A5A74] text-white border-[#4D708E]'
                                  : 'bg-[#ebf2f7] text-[#18232c] border-[#c8d7e3] hover:bg-[#dbe7f0]'
                              }`}
                            >
                              {sample.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Venue & Background Image URLs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#c8d7e3]">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm sm:text-base font-semibold text-[#18232c]">
                          Venue Photo URL
                        </label>
                        {venueImgStatus === 'valid' && (
                          <span className="text-xs sm:text-sm text-[#245237] font-bold">✓ Verified</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.venueImg}
                        onChange={(e) => handleFieldChange('venueImg', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                      />
                      {formData.venueImg && (
                        <div className="mt-2.5 rounded-xl overflow-hidden h-28 border border-[#c8d7e3]">
                          <img src={formData.venueImg} alt="Venue" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                        Full Page Background Wallpaper URL
                      </label>
                      <input
                        type="text"
                        value={formData.bgImage}
                        onChange={(e) => handleFieldChange('bgImage', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                      />
                      {formData.bgImage && (
                        <div className="mt-2.5 rounded-xl overflow-hidden h-28 border border-[#c8d7e3]">
                          <img src={formData.bgImage} alt="Wallpaper" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: HERO INVITATION CALLIGRAPHY & DETAILS */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#c8d7e3] pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Type className="w-5 h-5 text-[#3A5A74]" />
                        <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                          Hero Invitation Wording & Calligraphic Details
                        </h4>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5">
                        Customize the romantic calligraphic subheader, formal request line, couple names, and welcome quote.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer bg-[#ebf2f7] hover:bg-[#dbe7f0] px-3 py-1.5 rounded-xl border border-[#c8d7e3] transition">
                        <input
                          type="checkbox"
                          checked={formData.subHeaderEnabled !== false}
                          onChange={(e) => handleFieldChange('subHeaderEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#3A5A74] focus:ring-[#3A5A74] accent-[#3A5A74]"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-[#18232c]">
                          {formData.subHeaderEnabled !== false ? 'Calligraphy Subheader Enabled' : 'Subheader Hidden'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.subHeaderEnabled === false && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2.5">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs sm:text-sm font-semibold">Calligraphic Subheader is Currently Hidden</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            The cursive script subheader ("Together with their families") is hidden from the main card. You can customize the couple names and presence lines below or re-enable the subheader anytime.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('subHeaderEnabled', true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition shrink-0"
                      >
                        Enable Subheader
                      </button>
                    </div>
                  )}

                  {/* 1. Calligraphic Subheader & Quick Samples */}
                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c]">
                        Romantic Calligraphic Subheader
                      </label>
                      <span className="text-[11px] text-[#506173] font-serif">
                        Shown in elegant cursive script above the invitation line
                      </span>
                    </div>

                    <input
                      type="text"
                      value={formData.subHeader}
                      onChange={(e) => handleFieldChange('subHeader', e.target.value)}
                      placeholder="e.g. Together with their families"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                    />

                    {/* Script Live Typography Preview */}
                    <div className="p-3 bg-[#ffffff] rounded-lg border border-[#c8d7e3] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#506173] font-serif block">Live Script Preview:</span>
                        <p className="font-script text-2xl sm:text-3xl text-[#3A5A74] mt-0.5 leading-tight">
                          {formData.subHeader || 'Together with their families'}
                        </p>
                      </div>
                      <Sparkles className="w-4 h-4 text-[#c5a059] shrink-0" />
                    </div>

                    {/* Quick Subheader Preset Chips */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#506173] uppercase tracking-wider block mb-1.5 font-serif">
                        Quick Subheader Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_SUBHEADERS.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleFieldChange('subHeader', sample)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-serif transition border ${
                              formData.subHeader === sample
                                ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                                : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                            }`}
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Formal Request / Presence Line */}
                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c]">
                        Formal Invitation Request Line
                      </label>
                      <span className="text-[11px] text-[#506173] font-serif">
                        Uppercase tracked ribbon above the couple names
                      </span>
                    </div>

                    <input
                      type="text"
                      value={formData.invitationLine !== undefined ? formData.invitationLine : 'Request the honour of your presence at the marriage of'}
                      onChange={(e) => handleFieldChange('invitationLine', e.target.value)}
                      placeholder="e.g. Request the honour of your presence at the marriage of (or leave blank to hide)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                    />

                    {/* Live Tracking Preview */}
                    <div className="p-2.5 bg-[#ffffff] rounded-lg border border-[#c8d7e3]">
                      <span className="text-[10px] uppercase tracking-wider text-[#506173] font-serif block mb-0.5">Live Line Preview:</span>
                      {(formData.invitationLine !== undefined ? formData.invitationLine : 'Request the honour of your presence at the marriage of').trim() ? (
                        <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#506173] block font-serif">
                          {formData.invitationLine !== undefined ? formData.invitationLine : 'Request the honour of your presence at the marriage of'}
                        </span>
                      ) : (
                        <span className="text-xs italic text-amber-700 font-serif">[This line is currently empty / hidden on the invitation]</span>
                      )}
                    </div>

                    {/* Quick Invitation Line Chips */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#506173] uppercase tracking-wider block mb-1.5 font-serif">
                        Classic Phrasing Options:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_INVITATION_LINES.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleFieldChange('invitationLine', sample)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-serif transition border ${
                              (formData.invitationLine !== undefined ? formData.invitationLine : 'Request the honour of your presence at the marriage of') === sample
                                ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                                : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                            }`}
                          >
                            {sample}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleFieldChange('invitationLine', '')}
                          className="px-2.5 py-1 rounded-lg text-xs font-serif text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                        >
                          ✕ Hide / Blank Line
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Couple Names / Celebration Title */}
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                      Couple Names / Main Celebration Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      required
                      placeholder="e.g. Victoria Sterling & Alexander Montgomery"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-serif font-semibold"
                    />
                  </div>

                  {/* 3.5. Wedding Typography & Font Customization Suite */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#ebf2f7]/80 border border-[#c8d7e3] space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#c8d7e3] pb-3 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Type className="w-4 h-4 text-[#3A5A74]" />
                          <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                            Main Celebration Title Typography & Font Style
                          </h5>
                        </div>
                        <p className="text-xs text-[#475569] mt-0.5 font-serif">
                          Choose from handcrafted wedding fonts: flowing romantic calligraphy, aristocratic scripts, editorial serif, or imperial Roman antiqua.
                        </p>
                      </div>

                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#3A5A74]/10 text-[#3A5A74] self-start sm:self-auto shrink-0">
                        Current: {WEDDING_TITLE_FONTS.find(f => f.id === (formData.titleFont || 'great-vibes'))?.name || 'Great Vibes'}
                      </span>
                    </div>

                    {/* Quick 1-Click Wedding Typography Presets */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#506173] uppercase tracking-wider block mb-2 font-serif">
                        Curated Wedding Typography Presets (1-Click Apply):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {WEDDING_TYPOGRAPHY_PRESETS.map((preset, pIdx) => {
                          const isMatch = (formData.titleFont || 'great-vibes') === preset.font &&
                                          (formData.titleItalic ?? false) === preset.italic &&
                                          (formData.titleTransform || 'none') === preset.transform &&
                                          (formData.titleSize || 'majestic') === preset.size;
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => {
                                handleFieldChange('titleFont', preset.font);
                                handleFieldChange('titleWeight', preset.weight);
                                handleFieldChange('titleItalic', preset.italic);
                                handleFieldChange('titleTransform', preset.transform);
                                handleFieldChange('titleTracking', preset.tracking);
                                handleFieldChange('titleSize', preset.size);
                              }}
                              className={`p-2.5 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                                isMatch
                                  ? 'bg-[#3A5A74] text-white border-[#274155] shadow-sm'
                                  : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                              }`}
                            >
                              <div className="font-semibold truncate">{preset.name}</div>
                              <div className={`text-[10px] mt-1 line-clamp-2 ${isMatch ? 'text-white/80' : 'text-[#475569]'}`}>
                                {preset.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Font Cards Grid with Real Live Typeface Preview */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-2 font-serif">
                        Select Wedding Font Family:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                        {WEDDING_TITLE_FONTS.map((fontOpt) => {
                          const isSelected = (formData.titleFont || 'great-vibes') === fontOpt.id;
                          return (
                            <button
                              key={fontOpt.id}
                              type="button"
                              onClick={() => {
                                handleFieldChange('titleFont', fontOpt.id);
                                if (fontOpt.isScript && formData.titleTransform === 'uppercase') {
                                  handleFieldChange('titleTransform', 'none');
                                }
                                if (fontOpt.isScript && (!formData.titleSize || formData.titleSize === 'classic')) {
                                  handleFieldChange('titleSize', fontOpt.recommendedSize);
                                }
                              }}
                              className={`p-3.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#ffffff] border-[#3A5A74] ring-2 ring-[#3A5A74]/20 shadow-md'
                                  : 'bg-[#ffffff] border-[#c8d7e3] hover:bg-slate-50 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-xs sm:text-sm text-[#18232c]">
                                    {fontOpt.name}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ebf2f7] text-[#3A5A74] font-medium">
                                    {fontOpt.category}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-[#3A5A74] text-white flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>

                              {/* Live Name Preview in this exact font */}
                              <div className="my-2 py-2 px-3 rounded-lg bg-[#f8fafc] border border-slate-100 overflow-hidden text-center">
                                <p className={`${fontOpt.cssClass} text-2xl sm:text-3xl text-[#18232c] truncate leading-tight`}>
                                  {formData.title || fontOpt.previewText}
                                </p>
                              </div>

                              <p className="text-[11px] text-[#475569] leading-snug mt-1">
                                {fontOpt.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Advanced Typographic Stylings: Size, Weight, Italic, Tracking */}
                    <div className="pt-3 border-t border-[#c8d7e3] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Size Scale */}
                        <div>
                          <label className="block text-xs font-semibold text-[#18232c] mb-1.5 font-serif">
                            Display Size Scale:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'compact', label: 'Compact' },
                              { id: 'classic', label: 'Classic' },
                              { id: 'grand', label: 'Grand' },
                              { id: 'majestic', label: 'Majestic' }
                            ].map((sz) => (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={() => handleFieldChange('titleSize', sz.id)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                                  (formData.titleSize || 'majestic') === sz.id
                                    ? 'bg-[#3A5A74] text-white border-[#274155]'
                                    : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                                }`}
                              >
                                {sz.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Stroke Weight */}
                        <div>
                          <label className="block text-xs font-semibold text-[#18232c] mb-1.5 font-serif">
                            Stroke Weight:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'light', label: 'Light' },
                              { id: 'normal', label: 'Normal' },
                              { id: 'medium', label: 'Medium' },
                              { id: 'bold', label: 'Bold' }
                            ].map((wt) => (
                              <button
                                key={wt.id}
                                type="button"
                                onClick={() => handleFieldChange('titleWeight', wt.id)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                                  (formData.titleWeight || 'normal') === wt.id
                                    ? 'bg-[#3A5A74] text-white border-[#274155]'
                                    : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                                }`}
                              >
                                {wt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Slant & Italic */}
                        <div>
                          <label className="block text-xs font-semibold text-[#18232c] mb-1.5 font-serif">
                            Slant & Italic:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFieldChange('titleItalic', false)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                                !(formData.titleItalic ?? false)
                                  ? 'bg-[#3A5A74] text-white border-[#274155]'
                                  : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                              }`}
                            >
                              Upright (Normal)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFieldChange('titleItalic', true)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-medium border italic transition ${
                                (formData.titleItalic ?? false)
                                  ? 'bg-[#3A5A74] text-white border-[#274155]'
                                  : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                              }`}
                            >
                              Italic Slant
                            </button>
                          </div>
                        </div>

                        {/* Letter Spacing (Tracking) */}
                        <div>
                          <label className="block text-xs font-semibold text-[#18232c] mb-1.5 font-serif">
                            Letter Spacing (Kerning):
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'normal', label: 'Standard' },
                              { id: 'wide', label: 'Wide' },
                              { id: 'wider', label: 'Wider' },
                              { id: 'widest', label: 'Airy Spaced' }
                            ].map((tr) => (
                              <button
                                key={tr.id}
                                type="button"
                                onClick={() => handleFieldChange('titleTracking', tr.id)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                                  (formData.titleTracking || 'normal') === tr.id
                                    ? 'bg-[#3A5A74] text-white border-[#274155]'
                                    : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                                }`}
                              >
                                {tr.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Transform Warning if Script */}
                      {isScriptFont(formData.titleFont || 'great-vibes') && (
                        <p className="text-[11px] text-[#475569] italic font-serif">
                          💡 Calligraphy scripts (Great Vibes, Pinyon Script, etc.) have continuous hand-flourished loops and look most natural in standard Title Case.
                        </p>
                      )}
                    </div>

                    {/* Immediate Interactive Name Preview Card */}
                    <div className="p-4 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-center shadow-xs">
                      <span className="text-[10px] uppercase tracking-widest text-[#506173] font-serif block mb-1">
                        Active Typography Live Preview
                      </span>
                      <h4
                        className={`${getWeddingTitleClasses({
                          font: formData.titleFont || 'great-vibes',
                          weight: formData.titleWeight,
                          italic: formData.titleItalic,
                          transform: formData.titleTransform,
                          tracking: formData.titleTracking,
                          size: formData.titleSize || 'majestic'
                        })} text-[#18232c] my-1 sm:my-2`}
                      >
                        {formData.title || 'Victoria Sterling & Alexander Montgomery'}
                      </h4>
                    </div>
                  </div>

                  {/* 4. Invitation Description & Atmosphere Message */}
                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c]">
                        Invitation Welcome Message & Atmosphere Description
                      </label>
                      <span className="text-[11px] text-[#506173] font-serif">
                        Displayed in delicate italic typography beneath the floral ornament
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder="e.g. Request the honour of your presence at their marriage and to celebrate the beginning of their forever..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base leading-relaxed"
                    />

                    {/* Live Quote Preview */}
                    <div className="p-3 bg-[#ffffff] rounded-lg border border-[#c8d7e3]">
                      <span className="text-[10px] uppercase tracking-wider text-[#506173] font-serif block mb-1">Live Invitation Quote Preview:</span>
                      <p className="text-[#334155] font-serif italic text-sm leading-relaxed">
                        "{formData.description || 'Request the honour of your presence at their marriage...'}"
                      </p>
                    </div>

                    {/* Quick Description Presets */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#506173] uppercase tracking-wider block mb-1.5 font-serif">
                        Sample Invitation Messages:
                      </span>
                      <div className="space-y-1.5">
                        {SAMPLE_DESCRIPTIONS.map((desc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleFieldChange('description', desc)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-serif transition border ${
                              formData.description === desc
                                ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                                : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                            }`}
                          >
                            "{desc}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5. Live Stationery Header Plaque Preview */}
                  <div className="p-5 rounded-2xl bg-[#ffffff] border-2 border-[#c5a059]/40 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute inset-2 border border-[#c5a059]/20 rounded-xl pointer-events-none"></div>
                    <span className="text-[10px] font-serif uppercase tracking-widest text-[#c5a059] font-bold block mb-2">
                      ✦ Complete Hero Header Preview ✦
                    </span>

                    {formData.subHeaderEnabled !== false && (formData.subHeader || '').trim() && (
                      <p className="font-script text-2xl sm:text-3xl text-[#3A5A74] leading-tight mb-1">
                        {formData.subHeader}
                      </p>
                    )}

                    {(formData.invitationLine !== undefined ? formData.invitationLine : 'Request the honour of your presence at the marriage of').trim() && (
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-semibold text-[#506173] block mb-2 font-serif">
                        {formData.invitationLine !== undefined ? formData.invitationLine : 'Request the honour of your presence at the marriage of'}
                      </span>
                    )}

                    <h3 className={`${getWeddingTitleClasses({
                      font: formData.titleFont || 'great-vibes',
                      weight: formData.titleWeight,
                      italic: formData.titleItalic,
                      transform: formData.titleTransform,
                      tracking: formData.titleTracking,
                      size: formData.titleSize || 'majestic'
                    })} text-[#18232c] my-1 sm:my-2`}>
                      {formData.title || 'Couple Names'}
                    </h3>

                    <div className="flex items-center justify-center space-x-3 my-2.5">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c5a059]/60"></div>
                      <span className="text-[#3A5A74] text-sm select-none">❦</span>
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c5a059]/60"></div>
                    </div>

                    {(formData.description || '').trim() && (
                      <p className="text-[#334155] text-xs sm:text-sm max-w-md mx-auto font-serif italic leading-relaxed">
                        "{formData.description}"
                      </p>
                    )}
                  </div>

                  {/* 6. Countdown Headline & Timer Configuration */}
                  <div className="pt-2 border-t border-[#c8d7e3] space-y-4">
                    <h5 className="font-serif font-bold text-[#18232c] text-xs sm:text-sm uppercase tracking-wider">
                      Countdown Timer & Event Schedule
                    </h5>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                        Countdown Section Headline
                      </label>
                      <input
                        type="text"
                        value={formData.countdownTitle !== undefined ? formData.countdownTitle : 'Countdown to the Sacred Celebration'}
                        onChange={(e) => handleFieldChange('countdownTitle', e.target.value)}
                        placeholder="e.g. Countdown to the Sacred Celebration"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {SAMPLE_COUNTDOWN_TITLES.map((titlePreset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleFieldChange('countdownTitle', titlePreset)}
                            className={`px-2 py-0.5 rounded-md text-xs font-serif border ${
                              (formData.countdownTitle || 'Countdown to the Sacred Celebration') === titlePreset
                                ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                                : 'bg-[#ffffff] text-[#506173] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                            }`}
                          >
                            {titlePreset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Countdown Timer Status & Preview Banner */}
                  <div className="p-4 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                    <div>
                      <div className="flex items-center space-x-2 text-[#3A5A74] font-semibold text-xs sm:text-sm uppercase tracking-wider">
                        <Timer className="w-4 h-4 animate-pulse text-[#3A5A74]" />
                        <span>Live Event Countdown Timer</span>
                        {dashboardCountdown.isExpired ? (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md text-[11px] font-bold">Event Day Has Arrived</span>
                        ) : (
                          <span className="bg-[#3A5A74]/15 text-[#3A5A74] px-2 py-0.5 rounded-md text-[11px] font-bold">Active & Synced</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-[#ffffff] px-2.5 py-1.5 rounded-lg border border-[#c8d7e3] text-center min-w-[50px] shadow-sm">
                        <span className="block font-serif font-bold text-base sm:text-lg text-[#18232c]">{dashboardCountdown.days}</span>
                        <span className="block text-[10px] text-[#475569] uppercase tracking-wider">Days</span>
                      </div>
                      <span className="text-[#3A5A74] font-bold">:</span>
                      <div className="bg-[#ffffff] px-2.5 py-1.5 rounded-lg border border-[#c8d7e3] text-center min-w-[50px] shadow-sm">
                        <span className="block font-serif font-bold text-base sm:text-lg text-[#18232c]">{dashboardCountdown.hours}</span>
                        <span className="block text-[10px] text-[#475569] uppercase tracking-wider">Hours</span>
                      </div>
                      <span className="text-[#3A5A74] font-bold">:</span>
                      <div className="bg-[#ffffff] px-2.5 py-1.5 rounded-lg border border-[#c8d7e3] text-center min-w-[50px] shadow-sm">
                        <span className="block font-serif font-bold text-base sm:text-lg text-[#18232c]">{dashboardCountdown.mins}</span>
                        <span className="block text-[10px] text-[#475569] uppercase tracking-wider">Mins</span>
                      </div>
                      <span className="text-[#3A5A74] font-bold">:</span>
                      <div className="bg-[#ffffff] px-2.5 py-1.5 rounded-lg border border-[#c8d7e3] text-center min-w-[50px] shadow-sm">
                        <span className="block font-serif font-bold text-base sm:text-lg text-[#3A5A74]">{dashboardCountdown.secs}</span>
                        <span className="block text-[10px] text-[#475569] uppercase tracking-wider">Secs</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Target Date & RSVP Deadline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c] flex items-center space-x-1.5">
                          <Church className="w-4 h-4 text-[#3A5A74]" />
                          <span>Countdown Target Date & Time</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleSyncDisplayFromTarget}
                          className="text-xs text-[#3A5A74] hover:text-[#274155] underline font-medium flex items-center space-x-1"
                          title="Auto-fills the Display Date and Church Ceremony Time from this picker"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Fill Ceremony Date/Time</span>
                        </button>
                      </div>
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalString(formData.targetDate)}
                        onChange={(e) => handleFieldChange('targetDate', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-medium"
                      />
                      <p className="text-[11px] text-[#475569] mt-1">
                        Updates the live countdown timer on the hero card and dashboard.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c] flex items-center space-x-1.5">
                          <Calendar className="w-4 h-4 text-[#3A5A74]" />
                          <span>RSVP Deadline</span>
                        </label>
                        <span className="text-[10px] text-[#3A5A74] font-semibold px-2 py-0.5 bg-[#ebf2f7] rounded-md border border-[#c8d7e3]">
                          On Invitation Card
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.rsvpDeadline || formData.deadline || ''}
                        onChange={(e) => {
                          handleFieldChange('deadline', e.target.value);
                          handleFieldChange('rsvpDeadline', e.target.value);
                        }}
                        placeholder="e.g. March 10, 2027"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-medium"
                      />
                      <p className="text-[11px] text-[#475569] mt-1">
                        Cutoff date displayed on the invitation card to inform guests when to submit their responses by.
                      </p>
                    </div>
                  </div>

                  {/* Display Date, Church Ceremony Time, Reception Gala Time & Timezone controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c]">
                          Display Date
                        </label>
                        <button
                          type="button"
                          onClick={handleSyncTargetFromDisplay}
                          className="text-xs text-[#3A5A74] hover:text-[#274155] underline font-medium flex items-center space-x-1"
                          title="Updates the countdown target to 2:00 PM on this date for the Church Ceremony"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Sync to 2:00 PM</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.date}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                        placeholder="e.g. Saturday, September 19, 2027"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                      />
                      <p className="text-[11px] text-[#475569] mt-1">
                        Exact wording shown on the wedding invitation card.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5 flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Church className="w-4 h-4 text-[#3A5A74]" />
                          <span>Church Ceremony Time</span>
                        </span>
                        <span className="text-[10px] text-[#3c6b4e] font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Timer Target</span>
                      </label>
                      <input
                        type="text"
                        value={formData.churchTime ?? '2:00 PM PST'}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleFieldChange('churchTime', val);
                        }}
                        placeholder="e.g. 2:00 PM PST"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-medium"
                      />
                      <p className="text-[11px] text-[#475569] mt-1">
                        Countdown timer target: Church holy matrimony start time.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5 flex items-center justify-between">
                        <span>Reception Gala Time</span>
                        <span className="text-[11px] text-[#3A5A74] font-semibold bg-[#ebf2f7] px-2 py-0.5 rounded-md border border-[#c8d7e3]">/#venue</span>
                      </label>
                      <input
                        type="text"
                        value={formData.time}
                        onChange={(e) => handleFieldChange('time', e.target.value)}
                        placeholder="e.g. 4:00 PM PST"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-medium"
                      />
                      <p className="text-[11px] text-[#475569] mt-1">
                        Evening celebration & reception banquet at the estate (/#venue).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                        Timezone (Clock)
                      </label>
                      <select
                        value={formData.timezone || 'PST'}
                        onChange={(e) => {
                          const newTz = e.target.value;
                          handleFieldChange('timezone', newTz);
                          if (formData.time) {
                            const oldTz = formData.timezone || 'PST';
                            handleFieldChange('time', formData.time.replace(new RegExp(`\\b${oldTz}\\b`, 'g'), newTz));
                          }
                          if (formData.churchTime) {
                            const oldTz = formData.timezone || 'PST';
                            handleFieldChange('churchTime', formData.churchTime.replace(new RegExp(`\\b${oldTz}\\b`, 'g'), newTz));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-medium"
                      >
                        {SUPPORTED_TIMEZONES.map((tz) => (
                          <option key={tz.code} value={tz.code}>
                            {tz.name} ({tz.utcOffsetDesc})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#475569] mt-1">
                        Applied to the countdown clock (defaults to PST).
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: THE CELEBRATION GROUNDS & VENUE DETAILS */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#c8d7e3] pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-[#3A5A74]" />
                        <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                          The Celebration Grounds & Venue Details
                        </h4>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5">
                        Customize "The Celebration Grounds" tagline, "The Estate & Glasshouse" title, quote, and location information.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer bg-[#ebf2f7] hover:bg-[#dbe7f0] px-3 py-1.5 rounded-xl border border-[#c8d7e3] transition">
                        <input
                          type="checkbox"
                          checked={formData.venueEnabled !== false}
                          onChange={(e) => handleFieldChange('venueEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#3A5A74] focus:ring-[#3A5A74]"
                        />
                        <span className="text-xs font-semibold text-[#18232c]">
                          {formData.venueEnabled !== false ? 'Section Enabled' : 'Section Hidden'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.venueEnabled !== false ? (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Section Eyebrow Tagline
                          </label>
                          <input
                            type="text"
                            value={formData.venueEyebrow ?? 'The Celebration Grounds'}
                            onChange={(e) => handleFieldChange('venueEyebrow', e.target.value)}
                            placeholder="e.g. The Celebration Grounds"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-serif"
                          />
                          <p className="text-[11px] text-[#475569] mt-1">
                            Header badge between floral ❦ ornaments (default: <em>The Celebration Grounds</em>).
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Venue Section Title
                          </label>
                          <input
                            type="text"
                            value={formData.venueTitle ?? 'The Estate & Glasshouse'}
                            onChange={(e) => handleFieldChange('venueTitle', e.target.value)}
                            placeholder="e.g. The Estate & Glasshouse"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-serif font-semibold"
                          />
                          <p className="text-[11px] text-[#475569] mt-1">
                            Main prominent title above the venue photo (default: <em>The Estate & Glasshouse</em>).
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                          Venue Atmosphere Quote / Subtitle
                        </label>
                        <input
                          type="text"
                          value={formData.venueSubtitle ?? 'Join us amid timeless coastal gardens and candlelit historic halls.'}
                          onChange={(e) => handleFieldChange('venueSubtitle', e.target.value)}
                          placeholder="e.g. Join us amid timeless coastal gardens and candlelit historic halls."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base italic font-serif"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Venue / Estate Facility Name
                          </label>
                          <input
                            type="text"
                            value={formData.venue}
                            onChange={(e) => handleFieldChange('venue', e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5 flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <Clock className="w-4 h-4 text-[#3A5A74]" />
                              <span>Reception Gala Start Time</span>
                            </span>
                            <span className="text-[11px] text-[#3A5A74] font-semibold bg-[#ebf2f7] px-2 py-0.5 rounded-md border border-[#c8d7e3]">/#venue</span>
                          </label>
                          <input
                            type="text"
                            value={formData.time}
                            onChange={(e) => handleFieldChange('time', e.target.value)}
                            placeholder="e.g. 4:00 PM PST"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-medium"
                          />
                          <p className="text-[11px] text-[#475569] mt-1">
                            Start time for the evening gala, banquet, and celebration at the estate.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Full Physical Address
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Google Maps Navigation Link
                          </label>
                          <input
                            type="text"
                            value={formData.mapLink}
                            onChange={(e) => handleFieldChange('mapLink', e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Ambient Audio Soundtrack URL (MP3)
                          </label>
                          <input
                            type="text"
                            value={formData.audioUrl}
                            onChange={(e) => handleFieldChange('audioUrl', e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                          Parking, Transportation & Guest Arrival Notes
                        </label>
                        <textarea
                          rows={2}
                          value={formData.venueNotes ?? 'Valet and guest parking are available on-site at the estate entrance. Shuttle vans operate continuously between the sanctuary and celebration grounds.'}
                          onChange={(e) => handleFieldChange('venueNotes', e.target.value)}
                          placeholder="e.g. Parking instructions, valet arrival, reception shuttle pickup points..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif"
                        />
                        <p className="text-[11px] text-[#475569] mt-1">
                          Displayed inside an informational guide box below the celebration venue address.
                        </p>
                      </div>

                      {/* Venue Photo URL & Presets */}
                      <div className="p-4 bg-[#ebf2f7] rounded-xl border border-[#c8d7e3] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-[#18232c] flex items-center space-x-2">
                            <ImageIcon className="w-4 h-4 text-[#3A5A74]" />
                            <span>Venue & Grounds Photo URL</span>
                          </label>
                          {venueImgStatus === 'valid' && (
                            <span className="text-xs text-[#245237] font-bold">✓ Verified Photo</span>
                          )}
                          {venueImgStatus === 'loading' && (
                            <span className="text-xs text-[#3A5A74]">Checking...</span>
                          )}
                          {venueImgStatus === 'error' && (
                            <span className="text-xs text-rose-600 font-bold">⚠ Could not load photo URL</span>
                          )}
                        </div>

                        <input
                          type="text"
                          value={formData.venueImg ?? 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'}
                          onChange={(e) => handleFieldChange('venueImg', e.target.value)}
                          placeholder="https://images.unsplash.com/... or any HTTPS direct image URL"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                        />

                        {/* Quick Sample Venue Photos */}
                        <div>
                          <span className="block text-xs font-semibold text-[#475569] mb-1.5">
                            Sample Estate & Grounds Photos (Click to apply):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {SAMPLE_VENUE_PHOTOS.map((sample) => (
                              <button
                                key={sample.label}
                                type="button"
                                onClick={() => handleFieldChange('venueImg', sample.url)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                  (formData.venueImg || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80') === sample.url
                                    ? 'bg-[#3A5A74] text-white border-[#4D708E]'
                                    : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#dbe7f0]'
                                }`}
                              >
                                {sample.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {formData.venueImg && (
                          <div className="rounded-xl overflow-hidden h-32 border border-[#c8d7e3] shadow-inner">
                            <img
                              src={formData.venueImg}
                              alt="Venue preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#ebf2f7] text-center text-xs text-[#506173] font-serif italic">
                      Celebration grounds & venue section is currently hidden. Check "Section Enabled" above to display the venue card on the invitation.
                    </div>
                  )}
                </div>

                {/* SECTION 3B: RECEPTION BALLROOM & SEATING CAPACITY ARCHITECTURE */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#c8d7e3] pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <ChairIcon className="w-5 h-5 text-[#3A5A74]" />
                        <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                          Reception Ballroom & Seating Capacity
                        </h4>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5">
                        Define banquet floor limits and chair count per table. Used to calculate total venue capacity and guest seating plans.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-serif font-bold px-3 py-1 rounded-full bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                        {((formData.totalTables || config.totalTables || 10) * (formData.seatsPerTable || config.seatsPerTable || 12))} Total Seats
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                        Total Ballroom Tables
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.totalTables ?? config.totalTables ?? 10}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          handleFieldChange('totalTables', isNaN(val) ? 10 : Math.max(1, Math.min(100, val)));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-serif font-bold"
                      />
                      <p className="text-[11px] text-[#475569] mt-1">
                        Number of physical or virtual reception banquet tables (default: 10 tables, max: 100).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                        Seats Per Table (Chairs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.seatsPerTable ?? config.seatsPerTable ?? 12}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          handleFieldChange('seatsPerTable', isNaN(val) ? 12 : Math.max(1, Math.min(50, val)));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-serif font-bold"
                      />
                      <p className="text-[11px] text-[#475569] mt-1">
                        Chairs accommodated per banquet table (default: 12 seats, max: 50).
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: WEDDING CHURCH & CEREMONY DETAILS (THE HOLY MATRIMONY) */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#c8d7e3] pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Church className="w-5 h-5 text-[#3A5A74]" />
                        <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                          Wedding Church & Ceremony Details
                        </h4>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5">
                        Customize the Holy Matrimony / Church Sanctuary venue, address, ceremony time, and parking details.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer bg-[#ebf2f7] hover:bg-[#dbe7f0] px-3 py-1.5 rounded-xl border border-[#c8d7e3] transition">
                        <input
                          type="checkbox"
                          checked={formData.churchEnabled !== false}
                          onChange={(e) => handleFieldChange('churchEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#3A5A74] focus:ring-[#3A5A74]"
                        />
                        <span className="text-xs font-semibold text-[#18232c]">
                          {formData.churchEnabled !== false ? 'Section Enabled' : 'Section Hidden'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.churchEnabled !== false ? (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Church Section Eyebrow Tagline
                          </label>
                          <input
                            type="text"
                            value={formData.churchEyebrow ?? 'The Holy Matrimony'}
                            onChange={(e) => handleFieldChange('churchEyebrow', e.target.value)}
                            placeholder="e.g. The Holy Matrimony"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-serif"
                          />
                          <p className="text-[11px] text-[#475569] mt-1">
                            Header badge between floral ❦ ornaments (default: <em>The Holy Matrimony</em>).
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Church Section Title
                          </label>
                          <input
                            type="text"
                            value={formData.churchTitle ?? 'The Church Ceremony'}
                            onChange={(e) => handleFieldChange('churchTitle', e.target.value)}
                            placeholder="e.g. The Church Ceremony or St. Mary's by the Sea"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-serif font-semibold"
                          />
                          <p className="text-[11px] text-[#475569] mt-1">
                            Prominent title above church photo (default: <em>The Church Ceremony</em>).
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                          Atmosphere Quote / Subtitle
                        </label>
                        <input
                          type="text"
                          value={formData.churchSubtitle ?? 'Join us as we exchange sacred vows and unite in holy matrimony.'}
                          onChange={(e) => handleFieldChange('churchSubtitle', e.target.value)}
                          placeholder="e.g. Join us as we exchange sacred vows and unite in holy matrimony."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base italic font-serif"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Church / Sanctuary Name
                          </label>
                          <input
                            type="text"
                            value={formData.churchName ?? "St. Mary's Catholic Church & Sanctuary"}
                            onChange={(e) => handleFieldChange('churchName', e.target.value)}
                            placeholder="e.g. St. Mary's Catholic Church"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5 flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <Church className="w-4 h-4 text-[#3A5A74]" />
                              <span>Ceremony Start Time (Church)</span>
                            </span>
                            <span className="text-[10px] text-[#3c6b4e] font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Timer Target</span>
                          </label>
                          <input
                            type="text"
                            value={formData.churchTime ?? '2:00 PM PST'}
                            onChange={(e) => handleFieldChange('churchTime', e.target.value)}
                            placeholder="e.g. 2:00 PM PST"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base font-medium"
                          />
                          <p className="text-[11px] text-[#475569] mt-1">
                            Start time for Holy Matrimony at the Church (Countdown Timer & Schedule Target).
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Full Church Address
                          </label>
                          <input
                            type="text"
                            value={formData.churchAddress ?? '14 Spring Street, Newport, Rhode Island 02840'}
                            onChange={(e) => handleFieldChange('churchAddress', e.target.value)}
                            placeholder="e.g. 14 Spring Street, Newport, Rhode Island 02840"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-sm sm:text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                            Google Maps Navigation Link
                          </label>
                          <input
                            type="text"
                            value={formData.churchMapLink ?? 'https://maps.google.com/?q=St+Mary+Church+Newport+RI'}
                            onChange={(e) => handleFieldChange('churchMapLink', e.target.value)}
                            placeholder="https://maps.google.com/..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1.5">
                          Parking, Transportation & Guest Arrival Notes
                        </label>
                        <textarea
                          rows={2}
                          value={formData.churchNotes ?? 'Guests are kindly requested to be seated 15 minutes before the processional. Complimentary parking is available behind the sanctuary; guest shuttles depart for The Rosewood Estate directly following the benediction.'}
                          onChange={(e) => handleFieldChange('churchNotes', e.target.value)}
                          placeholder="e.g. Parking instructions, shuttle departure schedule, reverend notes..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif"
                        />
                        <p className="text-[11px] text-[#475569] mt-1">
                          Displayed inside an informational guide box below the church address.
                        </p>
                      </div>

                      {/* Church Photo URL & Presets */}
                      <div className="p-4 bg-[#ebf2f7] rounded-xl border border-[#c8d7e3] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-[#18232c] flex items-center space-x-2">
                            <ImageIcon className="w-4 h-4 text-[#3A5A74]" />
                            <span>Church Photo URL</span>
                          </label>
                          {churchImgStatus === 'valid' && (
                            <span className="text-xs text-[#245237] font-bold">✓ Verified Photo</span>
                          )}
                          {churchImgStatus === 'loading' && (
                            <span className="text-xs text-[#3A5A74]">Checking...</span>
                          )}
                          {churchImgStatus === 'error' && (
                            <span className="text-xs text-rose-600 font-bold">⚠ Could not load photo URL</span>
                          )}
                        </div>

                        <input
                          type="text"
                          value={formData.churchImg ?? 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80'}
                          onChange={(e) => handleFieldChange('churchImg', e.target.value)}
                          placeholder="https://images.unsplash.com/... or any HTTPS direct image URL"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-mono text-xs sm:text-sm"
                        />

                        {/* Quick Sample Church Photos */}
                        <div>
                          <span className="block text-xs font-semibold text-[#475569] mb-1.5">
                            Sample Church & Cathedral Photos (Click to apply):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {SAMPLE_CHURCH_PHOTOS.map((sample) => (
                              <button
                                key={sample.label}
                                type="button"
                                onClick={() => handleFieldChange('churchImg', sample.url)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                  (formData.churchImg || 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80') === sample.url
                                    ? 'bg-[#3A5A74] text-white border-[#4D708E]'
                                    : 'bg-[#ffffff] text-[#18232c] border-[#c8d7e3] hover:bg-[#dbe7f0]'
                                }`}
                              >
                                {sample.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {formData.churchImg && (
                          <div className="rounded-xl overflow-hidden h-32 border border-[#c8d7e3] shadow-inner">
                            <img
                              src={formData.churchImg}
                              alt="Church preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#ebf2f7] text-center text-xs text-[#506173] font-serif italic">
                      Wedding church section is currently hidden. Check "Section Enabled" above to display the Holy Matrimony ceremony card.
                    </div>
                  )}
                </div>

                {/* SECTION 5: CEREMONY TIMELINE */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2 flex-wrap gap-2">
                    <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                      Ceremony Timeline ({formData.timeline.length} Events)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddTimelineItem}
                      className="px-3 py-1.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.timeline.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 bg-[#ebf2f7] rounded-xl border border-[#c8d7e3] space-y-2">
                        <div className="flex items-center justify-between gap-2.5">
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) => handleTimelineChange(idx, 'time', e.target.value)}
                            placeholder="Time (e.g. 4:00 PM)"
                            className="w-32 px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#c8d7e3] font-semibold text-[#3A5A74] text-xs sm:text-sm"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleTimelineChange(idx, 'title', e.target.value)}
                            placeholder="Milestone Title"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#c8d7e3] font-semibold text-xs sm:text-sm text-[#18232c]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTimelineItem(idx)}
                            className="text-[#a83232] hover:bg-[#ffffff] p-1.5 rounded-lg transition"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => handleTimelineChange(idx, 'desc', e.target.value)}
                          placeholder="Description of milestone"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#c8d7e3] text-slate-600 text-xs sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 6: ROMANTIC FALLING WEDDING LEAVES & PETALS */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#c8d7e3] pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Leaf className="w-5 h-5 text-[#3A5A74]" />
                        <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                          Falling Wedding Leaves & Petals Animation
                        </h4>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5">
                        Gentle, faded botanical leaves and romantic flower petals cascading softly across the background wallpaper.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer bg-[#ebf2f7] hover:bg-[#dbe7f0] px-3 py-1.5 rounded-xl border border-[#c8d7e3] transition">
                        <input
                          type="checkbox"
                          checked={formData.leavesAnimationEnabled !== false}
                          onChange={(e) => handleFieldChange('leavesAnimationEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#3A5A74] focus:ring-[#3A5A74]"
                        />
                        <span className="text-xs font-semibold text-[#18232c]">
                          {formData.leavesAnimationEnabled !== false ? 'Animation Active' : 'Animation Paused'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.leavesAnimationEnabled !== false && (
                    <div className="space-y-5 pt-1">
                      {/* Ambient Lighting */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-2">
                          Atmospheric Ambient Lighting & Glow Filter
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                          {[
                            { id: 'none', label: 'Natural Daylight', desc: 'Crisp daylight transparency' },
                            { id: 'candlelight', label: 'Candlelight Glow', desc: 'Warm intimate floor amber glow' },
                            { id: 'golden-hour', label: 'Golden Hour', desc: 'Sunset honey-peach warmth' },
                            { id: 'twilight-fairy', label: 'Twilight & Fairies', desc: 'Evening sapphire & starlight' },
                            { id: 'rose-quartz', label: 'Rose Quartz', desc: 'French blush rose-gold veil' },
                            { id: 'enchanted-mist', label: 'Enchanted Mist', desc: 'Opalescent morning dew haze' }
                          ].map((lightOpt) => (
                            <button
                              key={lightOpt.id}
                              type="button"
                              onClick={() => handleFieldChange('atmosphereLighting', lightOpt.id)}
                              className={`p-2.5 rounded-xl text-left border transition ${
                                (formData.atmosphereLighting || 'none') === lightOpt.id
                                  ? 'bg-[#ebf2f7] border-[#3A5A74] text-[#18232c] ring-1 ring-[#3A5A74]'
                                  : 'bg-[#ffffff] border-[#c8d7e3] text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="font-semibold text-xs text-[#18232c]">{lightOpt.label}</div>
                              <div className="text-[10px] text-[#475569] mt-0.5 leading-snug">{lightOpt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Particle Aesthetics - 10 styles */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-2">
                          Particle Flora & Atmospheric Element (10 Styles)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                          {[
                            {
                              id: 'cherry-blossom',
                              title: 'Cherry Blossom (Sakura)',
                              desc: 'Notched pink sakura petals & spring buds'
                            },
                            {
                              id: 'celestial-stardust',
                              title: 'Celestial Stardust',
                              desc: 'Twinkling diamond stars & astral motes'
                            },
                            {
                              id: 'candlelit-lantern',
                              title: 'Candlelight & Embers',
                              desc: 'Upward floating lanterns & warm ember sparks'
                            },
                            {
                              id: 'lavender-wildflower',
                              title: 'Lavender & Wildflowers',
                              desc: 'Purple lavender sprigs & meadow buttercups'
                            },
                            {
                              id: 'autumn-maple',
                              title: 'Autumn Maple & Vineyard',
                              desc: 'Scarlet maple leaves & harvest grape foliage'
                            },
                            {
                              id: 'snow-crystal',
                              title: 'Winter Frost & Crystals',
                              desc: 'Six-point snowflakes & ice crystal shards'
                            },
                            {
                              id: 'gilded',
                              title: 'Gilded Gold Foil',
                              desc: 'Champagne gold shimmer foil leaves'
                            },
                            {
                              id: 'petals',
                              title: 'Romantic Rose Petals',
                              desc: 'Crimson, blush & ivory garden rose petals'
                            },
                            {
                              id: 'botanical',
                              title: 'Botanical Foliage',
                              desc: 'Eucalyptus, olive sprigs & willow leaves'
                            },
                            {
                              id: 'mixed',
                              title: 'Heirloom Garden Mix',
                              desc: 'Delicate blend of flora, petals & gold dust'
                            }
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleFieldChange('leavesStyle', opt.id)}
                              className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                                (formData.leavesStyle || 'mixed') === opt.id
                                  ? 'bg-[#ebf2f7] border-[#3A5A74] text-[#18232c] ring-1 ring-[#3A5A74]'
                                  : 'bg-[#ffffff] border-[#c8d7e3] text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="font-semibold text-xs sm:text-sm text-[#18232c]">{opt.title}</div>
                              <div className="text-[11px] text-[#475569] mt-1 leading-snug">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Wind & Motion Direction + Particle Scale */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-2">
                            Wind & Motion Drift
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'calm', label: 'Calm Vertical' },
                              { id: 'breeze-right', label: 'East Breeze (Right)' },
                              { id: 'breeze-left', label: 'West Breeze (Left)' },
                              { id: 'swirling', label: 'Swirling Whirlwind' }
                            ].map((w) => (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => handleFieldChange('leavesWindDirection', w.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                  (formData.leavesWindDirection || 'calm') === w.id
                                    ? 'bg-[#3A5A74] text-white border-[#274155]'
                                    : 'bg-[#ffffff] text-slate-700 border-[#c8d7e3] hover:bg-[#ebf2f7]'
                                }`}
                              >
                                {w.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-2">
                            Particle Scale & Size
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'delicate', label: 'Delicate (70%)' },
                              { id: 'natural', label: 'Natural (100%)' },
                              { id: 'statement', label: 'Statement (140%)' }
                            ].map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleFieldChange('leavesScale', s.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                  (formData.leavesScale || 'natural') === s.id
                                    ? 'bg-[#3A5A74] text-white border-[#274155]'
                                    : 'bg-[#ffffff] text-slate-700 border-[#c8d7e3] hover:bg-[#ebf2f7]'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Density */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-2">
                          Particle Density & Cascade Frequency
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { id: 'whisper', label: 'Whisper (12 motes)' },
                            { id: 'gentle', label: 'Gentle (20 particles)' },
                            { id: 'medium', label: 'Graceful Drift (32 particles)' },
                            { id: 'lush', label: 'Lush Celebration (50 particles)' },
                            { id: 'blizzard', label: 'Blizzard / Gala (72 particles)' }
                          ].map((densityOpt) => (
                            <button
                              key={densityOpt.id}
                              type="button"
                              onClick={() => handleFieldChange('leavesDensity', densityOpt.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                (formData.leavesDensity || 'medium') === densityOpt.id
                                  ? 'bg-[#3A5A74] text-white border-[#274155]'
                                  : 'bg-[#ffffff] text-slate-700 border-[#c8d7e3] hover:bg-[#ebf2f7]'
                              }`}
                            >
                              {densityOpt.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#475569] mt-1.5">
                          Particles drift dynamically with organic 3D tumbling flips, gentle sway cycles, and interactive breeze impulse upon mouse movement or touch.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 6B: ROMANTIC KEEPSAKE GUESTBOOK SETTINGS */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-3 flex-wrap gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-[#3A5A74]" />
                        <h4 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider">
                          Romantic Keepsake Guestbook & Wishes
                        </h4>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5">
                        Manage your interactive guestbook where guests leave blessings, advice, and heartfelt love.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setView('guestbook')}
                        className="px-3.5 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Manage Wishes ({writtenGuestbookEntries.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setView('media')}
                        className="px-3.5 py-2 bg-white hover:bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                      >
                        <Film className="w-4 h-4" />
                        <span>Manage Videos & Images ({mediaKeepsakeEntries.length})</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Guestbook Section Display Toggle */}
                    <div className="p-4 rounded-xl border border-[#c8d7e3] bg-[#f8fafc] flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-[#18232c]">Guestbook Section Visibility</div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          Display the Wishes & Love keepsake section on the main wedding invitation page.
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer shrink-0 bg-[#ffffff] hover:bg-[#ebf2f7] px-3 py-1.5 rounded-xl border border-[#c8d7e3] transition">
                        <input
                          type="checkbox"
                          checked={formData.guestbookEnabled !== false}
                          onChange={(e) => handleFieldChange('guestbookEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#3A5A74] focus:ring-[#3A5A74]"
                        />
                        <span className="text-xs font-semibold text-[#18232c]">
                          {formData.guestbookEnabled !== false ? 'Section Visible' : 'Section Hidden'}
                        </span>
                      </label>
                    </div>

                    {/* Guestbook Posting Enabled / Disabled Toggle */}
                    <div className="p-4 rounded-xl border border-[#c8d7e3] bg-[#f8fafc] flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-[#18232c]">Guestbook Public Posting</div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          Allow wedding guests to submit new wishes and blessings.
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        id="host-toggle-guestbook-posting-details"
                        aria-checked={formData.guestbookPostingEnabled !== false}
                        onClick={() => handleFieldChange('guestbookPostingEnabled', formData.guestbookPostingEnabled === false ? true : false)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3A5A74] ${
                          formData.guestbookPostingEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            formData.guestbookPostingEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {formData.guestbookEnabled !== false && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1.5">
                            Guestbook Eyebrow Tagline
                          </label>
                          <input
                            type="text"
                            value={formData.guestbookEyebrow ?? 'Keepsake Guestbook'}
                            onChange={(e) => handleFieldChange('guestbookEyebrow', e.target.value)}
                            placeholder="e.g. Keepsake Guestbook"
                            className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1.5">
                            Guestbook Title
                          </label>
                          <input
                            type="text"
                            value={formData.guestbookTitle ?? 'Wishes & Love'}
                            onChange={(e) => handleFieldChange('guestbookTitle', e.target.value)}
                            placeholder="e.g. Wishes & Love"
                            className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1.5">
                            Guestbook Subtitle
                          </label>
                          <input
                            type="text"
                            value={formData.guestbookSubtitle ?? 'Leave your blessings, fond memories, and heartfelt congratulations for the newlyweds.'}
                            onChange={(e) => handleFieldChange('guestbookSubtitle', e.target.value)}
                            placeholder="Subtitle or blessing invitation"
                            className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif italic"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 6C: VIDEO BLESSINGS & MEDIA KEEPSAKES CONFIGURATION */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] text-[#18232c] space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2ecf4] pb-3.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                        <Film className="w-5 h-5 text-[#3A5A74]" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#18232c] flex items-center gap-2">
                          <span>Video & Photo Blessings Configuration</span>
                          <span className="text-[10px] bg-[#ebf2f7] text-[#3A5A74] px-2.5 py-0.5 rounded-full font-sans uppercase tracking-wider font-bold border border-[#c8d7e3]">
                            Cloudflare R2 + ImageKit
                          </span>
                        </h4>
                        <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                          Manage section visibility, public video toasts & photo uploads, section eyebrow, title, and atmosphere quote.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setView('media')}
                      className="px-3.5 py-2 bg-white hover:bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                      <Film className="w-4 h-4" />
                      <span>Manage Videos & Images ({mediaKeepsakeEntries.length})</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Section Visibility Toggle */}
                    <div className="p-4 rounded-xl border border-[#c8d7e3] bg-[#f8fafc] flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-[#18232c]">Section Visibility</div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          Display the Video & Photo Blessings section on the public wedding page.
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer shrink-0 bg-[#ffffff] hover:bg-[#ebf2f7] px-3 py-1.5 rounded-xl border border-[#c8d7e3] transition">
                        <input
                          type="checkbox"
                          checked={formData.videoBlessingsEnabled !== false}
                          onChange={(e) => handleFieldChange('videoBlessingsEnabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#3A5A74] focus:ring-[#3A5A74]"
                        />
                        <span className="text-xs font-semibold text-[#18232c]">
                          {formData.videoBlessingsEnabled !== false ? 'Section Visible' : 'Section Hidden'}
                        </span>
                      </label>
                    </div>

                    {/* Public Submissions Toggle */}
                    <div className="p-4 rounded-xl border border-[#c8d7e3] bg-[#f8fafc] flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-[#18232c]">Public Submissions</div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          Allow wedding guests to record live video toasts and upload photo memories.
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        id="host-toggle-video-posting-details"
                        aria-checked={formData.videoBlessingsPostingEnabled !== false}
                        onClick={() => handleFieldChange('videoBlessingsPostingEnabled', formData.videoBlessingsPostingEnabled === false ? true : false)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3A5A74] ${
                          formData.videoBlessingsPostingEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            formData.videoBlessingsPostingEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {formData.videoBlessingsEnabled !== false && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1.5">
                            Section Eyebrow Tagline
                          </label>
                          <input
                            type="text"
                            value={formData.videoBlessingsEyebrow ?? 'Cinematic & Photographic Keepsakes'}
                            onChange={(e) => handleFieldChange('videoBlessingsEyebrow', e.target.value)}
                            placeholder="e.g. Cinematic & Photographic Keepsakes"
                            className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1.5">
                            Section Title
                          </label>
                          <input
                            type="text"
                            value={formData.videoBlessingsTitle ?? 'Video & Photo Blessings'}
                            onChange={(e) => handleFieldChange('videoBlessingsTitle', e.target.value)}
                            placeholder="e.g. Video & Photo Blessings"
                            className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1.5">
                            Atmosphere Quote / Subtitle
                          </label>
                          <input
                            type="text"
                            value={formData.videoBlessingsSubtitle ?? 'Record a live toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla.'}
                            onChange={(e) => handleFieldChange('videoBlessingsSubtitle', e.target.value)}
                            placeholder="Atmosphere subtitle or recording prompt"
                            className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif italic"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 7B: HOST SECURITY & DASHBOARD ACCESS CONTROL */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] text-[#18232c] space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2ecf4] pb-3.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                        <ShieldCheck className="w-5 h-5 text-[#3A5A74]" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#18232c] flex items-center gap-2">
                          <span>Host Security & Access Password</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-sans uppercase tracking-wider font-bold border ${
                            getActiveHostPassword() !== 'admin123'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {getActiveHostPassword() !== 'admin123' ? 'Custom Password Active' : 'Default (admin123)'}
                          </span>
                        </h4>
                        <p className="text-xs text-[#506173] mt-0.5 font-serif italic">
                          Manage host password to safeguard guest RSVP lists, seating arrangements, and event settings.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenChangePassword}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-serif font-semibold tracking-wider transition border border-[#4D708E] shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Change Host Password</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] space-y-1">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block">
                        Authorized Username
                      </span>
                      <p className="font-mono text-sm font-bold text-[#18232c]">
                        admin
                      </p>
                      <p className="text-[11px] text-[#506173]">
                        Host portal administrator account identifier.
                      </p>
                    </div>

                    <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] space-y-1">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block">
                        Password Protection Status
                      </span>
                      <div className="flex items-center gap-1.5 font-sans font-bold text-xs sm:text-sm text-[#18232c]">
                        {getActiveHostPassword() !== 'admin123' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-emerald-800 font-serif">Custom Private Password Active</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-amber-800 font-serif">Default Password Active (admin123)</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-[#506173]">
                        {getActiveHostPassword() !== 'admin123'
                          ? 'Synchronized across Firestore & browser storage.'
                          : 'Change password anytime to secure your Host Portal.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Sticky Save Button */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-[#506173] font-serif italic">
                    {savedNotice ? '✓ Changes saved to current browser!' : 'Be sure to apply changes before exiting'}
                  </span>
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#3A5A74] hover:bg-[#274155] text-white text-sm sm:text-base font-semibold rounded-xl transition shadow-lg border border-[#4D708E] flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4 text-sky-200" />
                    <span>Apply & Save All Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* View 4: Formal Invitation Slideshow & Suite Manager */}
            {view === 'slideshow' && (
              <form onSubmit={handleSaveInvitation} className="flex-1 overflow-y-auto space-y-6 pr-1 text-sm font-serif">
                {/* Back to Operation Settings Hub */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#ffffff] p-2.5 sm:p-3 rounded-2xl border border-[#c8d7e3] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setView('operations')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] hover:bg-[#dbe7f0] border border-[#c8d7e3] transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Operation Settings Table</span>
                  </button>
                  <span className="text-xs font-serif font-semibold text-[#506173]">
                    Operation Settings / <strong className="text-[#18232c]">Invitation Slideshow &amp; Suite</strong>
                  </span>
                </div>
                {/* Top Status Bar & Actions */}
                <div className="p-4 sm:p-5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                      <ScrollText className="w-5 h-5 text-[#3A5A74]" />
                      <span>Formal Invitation Slideshow & Suite Manager</span>
                    </h4>
                    <p className="text-[#475569] text-xs sm:text-sm font-serif italic mt-0.5">
                      Upload sliding invitation photos, arrange stationery sequence, and configure display headings.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleLoadSampleSlides}
                      className="px-3.5 py-2 bg-[#ffffff] hover:bg-slate-50 text-[#3A5A74] rounded-xl text-xs sm:text-sm font-semibold border border-[#c8d7e3] transition flex items-center space-x-1.5 shadow-xs"
                      title="Populate 3 sample formal letterpress invitation slides"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Load Sample Suite</span>
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md border border-[#4D708E] flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4 text-sky-200" />
                      <span>Save Slideshow & Sync</span>
                    </button>
                  </div>
                </div>

                {savedNotice && (
                  <div className="p-3.5 bg-emerald-50 text-[#245237] rounded-xl text-sm font-bold border border-emerald-200 flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#245237]" />
                    <span>✓ Invitation slideshow photos and settings successfully saved and applied to live invitation!</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3.5 bg-rose-50 text-[#3A5A74] rounded-xl text-sm font-semibold border border-rose-200 flex items-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-[#3A5A74]" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* SECTION 1: SLIDESHOW DISPLAY SETTINGS */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2.5 flex-wrap gap-2">
                    <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-[#3A5A74]" />
                      <span>1. Slideshow Visibility & Section Headings</span>
                    </h5>
                    <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.invitationEnabled !== false}
                        onChange={(e) => handleFieldChange('invitationEnabled', e.target.checked)}
                        className="w-4 h-4 rounded text-[#3A5A74] focus:ring-[#3A5A74] border-gray-300"
                      />
                      <span className="text-xs sm:text-sm font-bold text-[#18232c]">
                        {formData.invitationEnabled !== false ? '✓ Displaying on Website' : 'Hidden from Website'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173] mb-1">
                        Eyebrow Label
                      </label>
                      <input
                        type="text"
                        value={formData.invitationEyebrow ?? 'Formal Suite & Stationery'}
                        onChange={(e) => handleFieldChange('invitationEyebrow', e.target.value)}
                        placeholder="Formal Suite & Stationery"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173] mb-1">
                        Section Main Title
                      </label>
                      <input
                        type="text"
                        value={formData.invitationTitle ?? 'The Wedding Invitation Suite'}
                        onChange={(e) => handleFieldChange('invitationTitle', e.target.value)}
                        placeholder="The Wedding Invitation Suite"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#c8d7e3]/60">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173] mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#3A5A74]" />
                        <span>RSVP Deadline</span>
                        <span className="text-[10px] text-[#3A5A74] font-normal lowercase">(displayed on invitation card)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rsvpDeadline || formData.deadline || ''}
                        onChange={(e) => {
                          handleFieldChange('deadline', e.target.value);
                          handleFieldChange('rsvpDeadline', e.target.value);
                        }}
                        placeholder="e.g. March 10, 2027"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-medium"
                      />
                      <p className="text-[11px] text-[#475569] mt-1 font-serif italic">
                        Informs guests on each invitation card when to submit their responses by.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173] mb-1">
                        Subtitle / Instructions for Guests
                      </label>
                      <input
                        type="text"
                        value={formData.invitationSubtitle ?? 'Swipe through our formal letterpress invitation suite, ceremony details, and celebration guide.'}
                        onChange={(e) => handleFieldChange('invitationSubtitle', e.target.value)}
                        placeholder="Swipe through our formal letterpress invitation suite..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c]"
                      />
                      <p className="text-[11px] text-[#475569] mt-1 font-serif italic">
                        Instructional note displayed under the main invitation heading.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: IMAGE UPLOADER & ADD SLIDES */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2.5 flex-wrap gap-2">
                    <div>
                      <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                        <Upload className="w-4 h-4 text-[#3A5A74]" />
                        <span>2. Upload Formal Invitation Photos</span>
                      </h5>
                      <p className="text-xs sm:text-sm text-[#475569] mt-0.5 font-serif italic">
                        Drag & drop scanned cards to upload directly to ImageKit.io global CDN.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {imageKitStatus?.configured ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ImageKit CDN Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full text-xs font-medium" title="Configure keys in Host Dashboard under ImageKit & Storage">
                          <Cloud className="w-3.5 h-3.5 text-sky-600" />
                          <span>ImageKit API Ready</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCloudSettingsInitialTab('imagekit');
                          setIsCloudSettingsOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffffff] hover:bg-slate-50 text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs font-semibold shadow-xs transition"
                        title="Change or replace ImageKit account credentials in Settings"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Account Keys</span>
                      </button>
                    </div>
                  </div>

                  {uploadStatusMessage && (
                    <div className="p-3.5 bg-emerald-50 text-[#245237] border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{uploadStatusMessage}</span>
                    </div>
                  )}

                  {imageKitStatus && !imageKitStatus.configured && (
                    <div className="p-3.5 bg-sky-50/80 border border-sky-200/80 rounded-xl text-xs text-sky-900 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-sky-950">ImageKit.io Cloud Upload Integration Active</p>
                        <p className="text-sky-800 font-serif leading-relaxed">
                          Drag-and-drop connects directly to <strong>ImageKit.io via server API</strong>. To store unlimited cards on your personal ImageKit CDN account and bypass Firestore's 1 MB document limit, add your <code>IMAGEKIT_PRIVATE_KEY</code> and <code>IMAGEKIT_URL_ENDPOINT</code> via the <button type="button" onClick={() => { setCloudSettingsInitialTab('imagekit'); setIsCloudSettingsOpen(true); }} className="underline font-bold hover:text-sky-950">Account Keys Settings</button>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input for primary uploader */}
                  <input
                    ref={slideshowFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleAddSlideFromFiles(e.target.files);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Hidden file input for replacing single slide */}
                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleExecuteReplaceSlide}
                    className="hidden"
                  />

                  {/* Drag and drop upload box */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files) {
                        handleAddSlideFromFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => slideshowFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#a3bacd] hover:border-[#3A5A74] bg-[#f7fafc] hover:bg-[#ebf2f7] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#ebf2f7] group-hover:bg-[#ffffff] text-[#3A5A74] flex items-center justify-center transition border border-[#c8d7e3] shadow-xs">
                      {isUploadingImages ? (
                        <RotateCcw className="w-6 h-6 animate-spin text-[#3A5A74]" />
                      ) : (
                        <CloudUpload className="w-6 h-6 text-[#3A5A74] group-hover:scale-110 transition" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-[#18232c]">
                        {isUploadingImages ? 'Uploading Cards to ImageKit CDN...' : 'Click to Upload or Drag & Drop Cards to ImageKit'}
                      </p>
                      <p className="text-xs sm:text-sm text-[#475569] mt-1 font-serif">
                        Supports multiple files (.JPG, .PNG, .WEBP). Uploaded via ImageKit.io API for lightning-fast edge CDN delivery and unlimited card capacity.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#3A5A74] text-white rounded-xl text-xs sm:text-sm font-semibold pointer-events-none shadow-xs flex items-center gap-1.5"
                    >
                      <CloudUpload className="w-4 h-4" />
                      <span>Browse Device Photos</span>
                    </button>
                  </div>

                  {/* Alternative: Add via Web Image URL */}
                  <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#506173]">
                      Or Add Single Photo via Direct URL:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="url"
                        value={newSlideUrl}
                        onChange={(e) => setNewSlideUrl(e.target.value)}
                        placeholder="Image URL (e.g. https://.../invitation-card-1.jpg)"
                        className="sm:col-span-5 px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm"
                      />
                      <input
                        type="text"
                        value={newSlideTitle}
                        onChange={(e) => setNewSlideTitle(e.target.value)}
                        placeholder="Card Title (Optional)"
                        className="sm:col-span-3 px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm"
                      />
                      <input
                        type="text"
                        value={newSlideCaption}
                        onChange={(e) => setNewSlideCaption(e.target.value)}
                        placeholder="Caption (Optional)"
                        className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddSlideFromUrl}
                        disabled={!newSlideUrl.trim()}
                        className="sm:col-span-2 py-2 px-3 bg-[#ffffff] hover:bg-slate-100 disabled:opacity-40 text-[#3A5A74] font-semibold rounded-xl border border-[#c8d7e3] text-xs sm:text-sm transition flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Link</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: REORDER & CUSTOMIZE SLIDE CARDS */}
                <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2.5 flex-wrap gap-2">
                    <div>
                      <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                        <List className="w-4 h-4 text-[#3A5A74]" />
                        <span>3. Slideshow Sequence & Card Details</span>
                      </h5>
                      <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                        Arrange the sliding cards in the exact order guests will browse them.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-[#ebf2f7] text-[#3A5A74] rounded-full text-xs font-bold border border-[#c8d7e3]">
                      {getNormalizedSlides().length} {getNormalizedSlides().length === 1 ? 'Slide' : 'Slides'} Configured
                    </span>
                  </div>

                  {getNormalizedSlides().length === 0 ? (
                    <div className="py-10 text-center space-y-3 bg-[#f8fafc] rounded-2xl border border-dashed border-[#c8d7e3]">
                      <ScrollText className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700">No invitation cards uploaded yet</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto font-serif">
                        Upload your scanned stationery or wedding cards above, or load the sample suite to get started.
                      </p>
                      <button
                        type="button"
                        onClick={handleLoadSampleSlides}
                        className="px-4 py-2 bg-[#3A5A74] text-white rounded-xl text-xs font-semibold"
                      >
                        Load Sample Suite
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getNormalizedSlides().map((slide, idx) => (
                        <div
                          key={slide.id || idx}
                          className="p-4 bg-[#f8fafc] hover:bg-[#f1f5f9] rounded-2xl border border-[#c8d7e3] transition space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="px-2.5 py-1 bg-[#3A5A74] text-white rounded-lg text-xs font-bold font-sans">
                                Card {idx + 1}
                              </span>
                              {slide.url && slide.url.includes('imagekit.io') && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold">
                                  <Cloud className="w-3 h-3 text-emerald-600" />
                                  <span>ImageKit CDN</span>
                                </span>
                              )}
                              <span className="text-xs text-slate-500 font-serif italic">
                                Slide order in responsive carousel
                              </span>
                            </div>

                            {/* Reorder and action buttons */}
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleMoveSlide(idx, 'up')}
                                disabled={idx === 0}
                                title="Move earlier in slideshow"
                                className="p-1.5 bg-[#ffffff] hover:bg-slate-100 disabled:opacity-30 rounded-lg border border-[#c8d7e3] text-[#475569] transition"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSlide(idx, 'down')}
                                disabled={idx === getNormalizedSlides().length - 1}
                                title="Move later in slideshow"
                                className="p-1.5 bg-[#ffffff] hover:bg-slate-100 disabled:opacity-30 rounded-lg border border-[#c8d7e3] text-[#475569] transition"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTriggerReplaceSlide(slide.id)}
                                title="Replace image file"
                                className="px-2.5 py-1.5 bg-[#ffffff] hover:bg-slate-100 rounded-lg border border-[#c8d7e3] text-[#3A5A74] text-xs font-semibold transition flex items-center space-x-1"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Replace Image</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlide(slide.id)}
                                title="Delete this slide"
                                className="p-1.5 bg-[#ffffff] hover:bg-rose-50 text-rose-600 rounded-lg border border-rose-200 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                            {/* Card Thumbnail */}
                            <div className="sm:col-span-3">
                              <div className="relative rounded-xl overflow-hidden border border-[#c8d7e3] aspect-[4/5] bg-slate-200 shadow-xs group">
                                <img
                                  src={slide.url}
                                  alt={slide.title || `Slide ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  referrerPolicy="no-referrer"
                                />
                                <a
                                  href={slide.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-black/60 hover:bg-black/80 text-white rounded text-[10px] font-sans"
                                >
                                  View Full
                                </a>
                              </div>
                            </div>

                            {/* Card Details Inputs */}
                            <div className="sm:col-span-9 space-y-2.5">
                              <div>
                                <label className="block text-xs font-semibold text-[#18232c] mb-1">
                                  Card Title / Label
                                </label>
                                <input
                                  type="text"
                                  value={slide.title || ''}
                                  onChange={(e) => handleUpdateSlide(slide.id, { title: e.target.value })}
                                  placeholder="e.g. Formal Invitation Suite, Ceremony Liturgy, Reception Banquet"
                                  className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-[#18232c] mb-1">
                                  Card Description / Caption
                                </label>
                                <textarea
                                  rows={2}
                                  value={slide.caption || ''}
                                  onChange={(e) => handleUpdateSlide(slide.id, { caption: e.target.value })}
                                  placeholder="e.g. Heirloom letterpress typography, RSVP guidelines, and dress code instructions"
                                  className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#475569]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                                  Direct Image Link
                                </label>
                                <input
                                  type="text"
                                  value={slide.url}
                                  onChange={(e) => handleUpdateSlide(slide.id, { url: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#c8d7e3] text-xs text-slate-500 font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 4: LIVE RESPONSIVE PREVIEW */}
                {getNormalizedSlides().length > 0 && (
                  <div className="p-5 sm:p-6 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2.5">
                      <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[#3A5A74]" />
                        <span>4. Live Slideshow Preview</span>
                      </h5>
                      <span className="text-xs text-[#506173] font-serif italic">
                        Test interactive carousel before publishing
                      </span>
                    </div>

                    <div className="max-w-md mx-auto bg-[#ffffff] rounded-2xl p-4 border border-[#c8d7e3] shadow-md space-y-3">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        {getNormalizedSlides()[previewSlideIndex] && (
                          <img
                            src={getNormalizedSlides()[previewSlideIndex].url}
                            alt={getNormalizedSlides()[previewSlideIndex].title}
                            className="w-full h-full object-cover transition duration-300"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* Navigation Arrows */}
                        <button
                          type="button"
                          onClick={() => setPreviewSlideIndex(prev => (prev === 0 ? getNormalizedSlides().length - 1 : prev - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-[#18232c] shadow-md border border-[#c8d7e3] transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewSlideIndex(prev => (prev === getNormalizedSlides().length - 1 ? 0 : prev + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-[#18232c] shadow-md border border-[#c8d7e3] transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Slide Indicator Badge */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-sans">
                          {previewSlideIndex + 1} / {getNormalizedSlides().length}
                        </div>
                      </div>

                      {/* Current slide info */}
                      {getNormalizedSlides()[previewSlideIndex] && (
                        <div className="text-center space-y-1 pt-1">
                          <h6 className="font-serif font-bold text-[#18232c] text-sm sm:text-base">
                            {getNormalizedSlides()[previewSlideIndex].title}
                          </h6>
                          <p className="text-xs text-[#475569] font-serif italic">
                            {getNormalizedSlides()[previewSlideIndex].caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Sticky Save Button */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-[#506173] font-serif italic">
                    {savedNotice ? '✓ Changes saved to current browser!' : 'Save changes to sync to your Cloud Firestore database'}
                  </span>
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#3A5A74] hover:bg-[#274155] text-white text-sm sm:text-base font-semibold rounded-xl transition shadow-lg border border-[#4D708E] flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4 text-sky-200" />
                    <span>Apply & Save All Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* VIEW: QR DISPLAY & MONETARY GIFT REGISTRY SUITE */}
            {view === 'qr-display' && (() => {
              const currentQrList = getNormalizedQrList();
              const safeActiveIndex = Math.min(Math.max(0, selectedQrTab), Math.max(0, currentQrList.length - 1));
              const activeQrItem = currentQrList[safeActiveIndex] || {
                id: 'qr_temp',
                bankName: 'GCash',
                accountName: 'Mark Alain Sim & Karla',
                accountNumber: '0917-888-2027',
                qrImage: '',
                notes: ''
              };

              return (
                <form onSubmit={handleSaveInvitation} className="flex-1 overflow-y-auto space-y-6 pr-1 text-sm font-serif">
                  {/* Back to Operation Settings Hub */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#ffffff] p-2.5 sm:p-3 rounded-2xl border border-[#c8d7e3] shadow-xs">
                    <button
                      type="button"
                      onClick={() => setView('operations')}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] hover:bg-[#dbe7f0] border border-[#c8d7e3] transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Operation Settings Table</span>
                    </button>
                    <span className="text-xs font-serif font-semibold text-[#506173]">
                      Operation Settings / <strong className="text-[#18232c]">QR Display &amp; Registry</strong>
                    </span>
                  </div>
                  {/* Hidden file input for QR image upload */}
                  <input
                    type="file"
                    ref={qrFileInputRef}
                    onChange={(e) => handleQrFileUpload(e.target.files, activeQrItem.id)}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                  />

                  {/* Top Status Bar & Actions */}
                  <div className="p-4 sm:p-5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    <div>
                      <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                        <QrCode className="w-5 h-5 text-[#3A5A74]" />
                        <span>QR Display & Monetary Gift Registry</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#3A5A74] text-white">
                          {currentQrList.length} {currentQrList.length === 1 ? 'Channel' : 'Channels'}
                        </span>
                      </h4>
                      <p className="text-[#475569] text-xs sm:text-sm font-serif italic mt-0.5">
                        Configure multiple payment channels (GCash, Maya, Bank Transfer) with custom QR codes, account details, and couple notes.
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleAddQrCode}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Add another QR Code payment option"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add QR Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleQr}
                        className="px-3.5 py-2 bg-[#ffffff] hover:bg-slate-50 text-[#3A5A74] rounded-xl text-xs sm:text-sm font-semibold border border-[#c8d7e3] transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Load sample GCash & Maya QR presets"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Load Sample QRs</span>
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md border border-[#4D708E] flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Save className="w-4 h-4 text-sky-200" />
                        <span>Save All</span>
                      </button>
                    </div>
                  </div>

                  {qrUploadStatus && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{qrUploadStatus}</span>
                    </div>
                  )}

                  {/* SECTION 1: VISIBILITY & PUBLIC SITE CONTROLS */}
                  <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2ecf4] pb-3.5">
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#18232c] flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[#3A5A74]" />
                          <span>Gift Section & Header Navigator Visibility</span>
                        </h4>
                        <p className="text-xs text-[#506173] mt-0.5 font-serif italic">
                          Control whether the Gift section appears on the wedding website and header navigation bar.
                        </p>
                      </div>

                      {/* Toggle Switch */}
                      <div className="flex items-center space-x-3 bg-[#f8fafc] px-4 py-2 rounded-2xl border border-[#c8d7e3] shadow-xs">
                        <div className="text-right">
                          <span className="text-[11px] font-serif font-bold uppercase tracking-wider block text-[#18232c]">
                            Registry Display
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              formData.giftEnabled !== false ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {formData.giftEnabled !== false ? '● Visible on Website' : '○ Section Hidden'}
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          id="host-toggle-gift-enabled"
                          aria-checked={formData.giftEnabled !== false}
                          onClick={() => handleFieldChange('giftEnabled', formData.giftEnabled === false ? true : false)}
                          title={
                            formData.giftEnabled !== false
                              ? 'Click to hide Gift section'
                              : 'Click to show Gift section'
                          }
                          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3A5A74] ${
                            formData.giftEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              formData.giftEnabled !== false ? 'translate-x-7' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block">
                          Header Navigator
                        </span>
                        <p className="font-semibold text-xs sm:text-sm text-[#18232c]">
                          {formData.giftEnabled !== false ? 'GIFT Tab & Button Active' : 'Hidden from Header'}
                        </p>
                        <p className="text-[11px] text-[#506173]">
                          Displays quick GIFT button in header with instant modal and smooth scrolling.
                        </p>
                      </div>

                      <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block">
                          Multiple QR Support
                        </span>
                        <p className="font-semibold text-xs sm:text-sm text-[#18232c]">
                          {currentQrList.length} {currentQrList.length === 1 ? 'Option Configured' : 'Options Configured'}
                        </p>
                        <p className="text-[11px] text-[#506173]">
                          Guests can effortlessly switch between GCash, Maya, and bank transfers.
                        </p>
                      </div>

                      <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block">
                          1-Click Copy & Save
                        </span>
                        <p className="font-semibold text-xs sm:text-sm text-[#18232c]">
                          Active & Interactive
                        </p>
                        <p className="text-[11px] text-[#506173]">
                          Guests can copy account numbers with 1 tap or save QR images to photo library.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PAYMENT CHANNELS & QR CODES MANAGER */}
                  <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2ecf4] pb-3">
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#18232c] flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#3A5A74]" />
                          <span>Payment Channels & QR Codes</span>
                        </h4>
                        <p className="text-xs text-[#506173] mt-0.5 font-serif italic">
                          Manage each payment channel. Click a tab to edit that QR code or add a new channel.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddQrCode}
                        className="px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] text-xs font-serif font-bold rounded-xl border border-[#c8d7e3] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#3A5A74]" />
                        <span>Add Another QR Code</span>
                      </button>
                    </div>

                    {/* QR Code Tab Strip */}
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#f0f4f8] rounded-2xl border border-[#c8d7e3]">
                      {currentQrList.map((qr, idx) => {
                        const isSelected = idx === safeActiveIndex;
                        return (
                          <div
                            key={qr.id || `qr-chip-${idx}`}
                            className={`flex items-center rounded-xl transition-all ${
                              isSelected
                                ? 'bg-[#3A5A74] text-white shadow-sm'
                                : 'bg-white/80 hover:bg-white text-[#475569] border border-transparent'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQrTab(idx);
                                setQrTestCopied(false);
                              }}
                              className="px-3.5 py-2 text-xs sm:text-sm font-serif font-semibold flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Smartphone className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#3A5A74]'}`} />
                              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                                {qr.bankName || `Channel ${idx + 1}`}
                              </span>
                              {qr.qrImage && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              )}
                            </button>

                            {/* Reorder & Remove Controls inside Tab */}
                            <div className="flex items-center pr-1.5 space-x-0.5">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveQr(idx, 'up');
                                  }}
                                  title="Move Left"
                                  className={`p-1 rounded hover:bg-black/10 transition text-xs ${
                                    isSelected ? 'text-white/80' : 'text-slate-400'
                                  }`}
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                              )}
                              {idx < currentQrList.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveQr(idx, 'down');
                                  }}
                                  title="Move Right"
                                  className={`p-1 rounded hover:bg-black/10 transition text-xs ${
                                    isSelected ? 'text-white/80' : 'text-slate-400'
                                  }`}
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                              {currentQrList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveQrCode(qr.id);
                                  }}
                                  title="Delete this QR option"
                                  className={`p-1 rounded hover:bg-rose-500 hover:text-white transition text-xs ${
                                    isSelected ? 'text-white/80' : 'text-rose-400'
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleAddQrCode}
                        className="px-3 py-2 rounded-xl text-xs font-serif font-semibold bg-white/70 hover:bg-white text-[#3A5A74] border border-dashed border-[#3A5A74]/40 transition flex items-center gap-1 cursor-pointer"
                        title="Add payment channel"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New</span>
                      </button>
                    </div>

                    {/* Active QR Item Editor Card */}
                    <div className="p-4 sm:p-5 bg-[#f8fafc] rounded-2xl border border-[#c8d7e3] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#e2ecf4] pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-[#3A5A74] text-white text-xs font-bold flex items-center justify-center">
                            {safeActiveIndex + 1}
                          </span>
                          <h5 className="font-serif font-bold text-sm sm:text-base text-[#18232c]">
                            Editing: {activeQrItem.bankName || `Channel ${safeActiveIndex + 1}`}
                          </h5>
                          {safeActiveIndex === 0 && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                              Primary Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {currentQrList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQrCode(activeQrItem.id)}
                              className="px-2.5 py-1 text-xs font-serif font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                              title="Delete this QR channel"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove Option</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Left Column: QR Image Preview & Upload */}
                        <div className="md:col-span-5 flex flex-col items-center">
                          <div className="w-full max-w-xs p-4 bg-white rounded-2xl border-2 border-[#c8d7e3] shadow-md text-center">
                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] mb-2.5">
                              <Smartphone className="w-3.5 h-3.5 text-[#3A5A74]" />
                              <span>{activeQrItem.bankName || 'GCash'}</span>
                            </div>

                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-inner aspect-square flex items-center justify-center overflow-hidden">
                              {activeQrItem.qrImage ? (
                                <img
                                  src={activeQrItem.qrImage}
                                  alt={`${activeQrItem.bankName} QR Code Preview`}
                                  className="w-full h-full object-contain rounded-lg"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80';
                                  }}
                                />
                              ) : (
                                <div className="text-center p-4 text-slate-400 space-y-2">
                                  <QrCode className="w-12 h-12 mx-auto text-slate-300" />
                                  <p className="text-xs font-serif">No QR image uploaded for {activeQrItem.bankName}</p>
                                </div>
                              )}
                            </div>

                            <p className="text-[11px] font-serif text-[#506173] mt-2 font-semibold truncate">
                              {activeQrItem.accountName || 'Mark Alain Sim & Karla'}
                            </p>
                            <p className="text-xs font-mono font-bold text-[#3A5A74] truncate">
                              {activeQrItem.accountNumber || 'No number set'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => qrFileInputRef.current?.click()}
                              className="px-3.5 py-1.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{activeQrItem.qrImage ? 'Replace Image' : 'Upload QR Image'}</span>
                            </button>
                            {activeQrItem.qrImage && (
                              <button
                                type="button"
                                onClick={() => handleUpdateQrItem(activeQrItem.id, { qrImage: '' })}
                                className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                title="Remove QR image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Details & Upload Zone */}
                        <div className="md:col-span-7 space-y-4">
                          {/* Drag & Drop Upload Zone */}
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleQrFileUpload(e.dataTransfer.files, activeQrItem.id);
                            }}
                            onClick={() => qrFileInputRef.current?.click()}
                            className="p-5 border-2 border-dashed border-[#c8d7e3] hover:border-[#3A5A74] bg-[#ffffff] hover:bg-[#ebf2f7]/50 rounded-2xl text-center cursor-pointer transition space-y-1.5 group"
                          >
                            {isUploadingQr ? (
                              <div className="py-2 flex flex-col items-center justify-center space-y-2">
                                <Loader2 className="w-6 h-6 text-[#3A5A74] animate-spin" />
                                <p className="text-xs font-semibold text-[#3A5A74]">Processing and uploading QR code...</p>
                              </div>
                            ) : (
                              <>
                                <div className="w-9 h-9 rounded-full bg-[#ebf2f7] text-[#3A5A74] flex items-center justify-center mx-auto group-hover:scale-110 transition">
                                  <CloudUpload className="w-4 h-4" />
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-[#18232c]">
                                  Click to upload screenshot or QR export for {activeQrItem.bankName}
                                </p>
                                <p className="text-[11px] text-[#506173] font-serif italic">
                                  Supports PNG, JPG, WEBP screenshots directly from your mobile banking app
                                </p>
                              </>
                            )}
                          </div>

                          {/* Direct Image URL */}
                          <div>
                            <label className="block text-xs font-semibold text-[#18232c] mb-1">
                              Or Enter Direct Image URL for {activeQrItem.bankName}
                            </label>
                            <input
                              type="url"
                              value={activeQrItem.qrImage || ''}
                              onChange={(e) => handleUpdateQrItem(activeQrItem.id, { qrImage: e.target.value })}
                              placeholder="https://images.unsplash.com/... or https://ik.imagekit.io/..."
                              className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs font-mono text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                            />
                          </div>

                          {/* Provider Quick Chips */}
                          <div>
                            <label className="block text-xs font-semibold text-[#18232c] mb-1.5">
                              Bank or E-Wallet Provider Name:
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {['GCash', 'Maya', 'BDO Unibank', 'BPI', 'UnionBank', 'GoTyme', 'PayPal', 'Metrobank', 'RCBC'].map(
                                (prov) => (
                                  <button
                                    key={prov}
                                    type="button"
                                    onClick={() => handleUpdateQrItem(activeQrItem.id, { bankName: prov })}
                                    className={`px-2.5 py-1 rounded-full text-xs font-serif transition border ${
                                      activeQrItem.bankName === prov
                                        ? 'bg-[#3A5A74] text-white border-[#4D708E] font-semibold'
                                        : 'bg-white text-[#475569] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                                    }`}
                                  >
                                    {prov}
                                  </button>
                                )
                              )}
                            </div>
                            <input
                              type="text"
                              value={activeQrItem.bankName || ''}
                              onChange={(e) => handleUpdateQrItem(activeQrItem.id, { bankName: e.target.value })}
                              placeholder="e.g. GCash / Maya / BPI"
                              className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm font-semibold text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                            />
                          </div>

                          {/* Account Name & Number */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-[#18232c] mb-1">
                                Account Holder Name
                              </label>
                              <input
                                type="text"
                                value={activeQrItem.accountName || ''}
                                onChange={(e) => handleUpdateQrItem(activeQrItem.id, { accountName: e.target.value })}
                                placeholder="e.g. Mark Alain Sim / Karla"
                                className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#18232c] mb-1">
                                Account / Mobile Number
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={activeQrItem.accountNumber || ''}
                                  onChange={(e) => handleUpdateQrItem(activeQrItem.id, { accountNumber: e.target.value })}
                                  placeholder="e.g. 0917-888-2027"
                                  className="w-full px-3.5 py-2 pr-16 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm font-mono font-bold text-[#3A5A74] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeQrItem.accountNumber && navigator.clipboard) {
                                      navigator.clipboard.writeText(activeQrItem.accountNumber);
                                      setQrTestCopied(true);
                                      setTimeout(() => setQrTestCopied(false), 2000);
                                    }
                                  }}
                                  className="absolute right-1 top-1 bottom-1 px-2 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] text-[11px] font-serif font-semibold rounded-lg border border-[#c8d7e3] transition flex items-center gap-1 cursor-pointer"
                                  title="Test 1-Click Copy"
                                >
                                  {qrTestCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span>{qrTestCopied ? 'Copied' : 'Test'}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Specific Note for this Payment Channel */}
                          <div>
                            <label className="block text-xs font-semibold text-[#18232c] mb-1">
                              Channel-Specific Remarks / Note for Guests
                            </label>
                            <input
                              type="text"
                              value={activeQrItem.notes || ''}
                              onChange={(e) => handleUpdateQrItem(activeQrItem.id, { notes: e.target.value })}
                              placeholder="e.g. GCash Express Send. Please include your name in the remarks!"
                              className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: DISPLAY TEXT & GUEST MESSAGES */}
                  <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-xs">
                    <div className="border-b border-[#e2ecf4] pb-3">
                      <h4 className="font-serif font-bold text-sm sm:text-base text-[#18232c] flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                        <span>Section Presentation & Notes to Guests</span>
                      </h4>
                      <p className="text-xs text-[#506173] mt-0.5 font-serif italic">
                        Customize the romantic headings, blessing message, and remarks instructions displayed to your guests.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#18232c] mb-1">
                          Registry Eyebrow
                        </label>
                        <input
                          type="text"
                          value={formData.giftEyebrow ?? 'Wedding Registry & Blessings'}
                          onChange={(e) => handleFieldChange('giftEyebrow', e.target.value)}
                          placeholder="e.g. Wedding Registry & Blessings"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#18232c] mb-1">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={formData.giftTitle ?? 'Monetary Gift & Blessings'}
                          onChange={(e) => handleFieldChange('giftTitle', e.target.value)}
                          placeholder="e.g. Monetary Gift & Blessings"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm font-semibold text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18232c] mb-1">
                        Blessing Subtitle / Message
                      </label>
                      <textarea
                        rows={2}
                        value={
                          formData.giftSubtitle ??
                          'Your presence and love on our special day are the greatest gifts of all. Should you wish to honor us with a gift, a monetary blessing is warmly appreciated.'
                        }
                        onChange={(e) => handleFieldChange('giftSubtitle', e.target.value)}
                        placeholder="Introductory blessing message for guests..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm font-serif italic text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18232c] mb-1">
                        General Remarks / Note from the Couple
                      </label>
                      <input
                        type="text"
                        value={
                          formData.giftNotes ??
                          'Kindly include your name in the payment reference or note so we can express our deepest gratitude!'
                        }
                        onChange={(e) => handleFieldChange('giftNotes', e.target.value)}
                        placeholder="e.g. Kindly include your name in the payment reference so we can thank you!"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                      />
                    </div>
                  </div>

                  {/* SECTION 4: LIVE GUEST VIEW PREVIEW */}
                  <div className="p-5 sm:p-6 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-2.5">
                      <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[#3A5A74]" />
                        <span>Live Guest View Simulation</span>
                      </h5>
                      <span className="text-xs text-[#506173] font-serif italic">
                        {currentQrList.length} Payment {currentQrList.length === 1 ? 'Channel' : 'Channels'} Active
                      </span>
                    </div>

                    <div className="max-w-md mx-auto bg-white rounded-2xl p-5 border border-[#c8d7e3] shadow-md space-y-3 text-center">
                      <div className="inline-flex items-center space-x-1 text-[#3A5A74] text-[10px] font-serif uppercase tracking-widest">
                        <span>❦</span>
                        <span>{formData.giftEyebrow || 'Wedding Registry & Blessings'}</span>
                        <span>❦</span>
                      </div>
                      <h4 className="text-xl font-serif text-[#18232c]">
                        {formData.giftTitle || 'Monetary Gift & Blessings'}
                      </h4>

                      {/* Pill Tabs for multiple channels */}
                      {currentQrList.length > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          {currentQrList.map((qr, idx) => (
                            <button
                              key={`preview-tab-${idx}`}
                              type="button"
                              onClick={() => setSelectedQrTab(idx)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-serif font-semibold border transition ${
                                idx === safeActiveIndex
                                  ? 'bg-[#3A5A74] text-white border-[#274155]'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {qr.bankName || `Option ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-inner max-w-[200px] mx-auto aspect-square flex items-center justify-center overflow-hidden">
                        {activeQrItem.qrImage ? (
                          <img
                            src={activeQrItem.qrImage}
                            alt="Preview QR"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QrCode className="w-12 h-12 text-slate-300" />
                        )}
                      </div>

                      <div className="text-xs font-serif space-y-0.5">
                        <p className="font-bold text-[#18232c]">{activeQrItem.bankName}</p>
                        <p className="text-slate-600">{activeQrItem.accountName}</p>
                        <p className="font-mono font-bold text-[#3A5A74]">{activeQrItem.accountNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Sticky Save Button */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs text-[#506173] font-serif italic">
                      {savedNotice ? '✓ Changes saved to current browser!' : 'Save changes to sync to your Cloud Firestore database'}
                    </span>
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-[#3A5A74] hover:bg-[#274155] text-white text-sm sm:text-base font-semibold rounded-xl transition shadow-lg border border-[#4D708E] flex items-center space-x-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-sky-200" />
                      <span>Apply & Save All Changes</span>
                    </button>
                  </div>
                </form>
              );
            })()}

            {/* VIEW 5: GUESTBOOK & WISHES MANAGER */}
            {view === 'guestbook' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 sm:pr-2 animate-fade-in overscroll-contain">
                {/* Back to Operation Settings Hub */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#ffffff] p-2.5 sm:p-3 rounded-2xl border border-[#c8d7e3] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setView('operations')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] hover:bg-[#dbe7f0] border border-[#c8d7e3] transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Operation Settings Table</span>
                  </button>
                  <span className="text-xs font-serif font-semibold text-[#506173]">
                    Operation Settings / <strong className="text-[#18232c]">Wishes Guestbook</strong>
                  </span>
                </div>
                {/* Notice banner linking to dedicated Media Manager if media items exist */}
                {mediaKeepsakeEntries.length > 0 && (
                  <div className="p-4 bg-[#f0f7fb] border border-[#c8d7e3] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-[#3A5A74] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Film className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-serif font-bold text-sm text-[#18232c]">
                          Media Keepsakes Organized Separately ({mediaKeepsakeEntries.length} Items)
                        </div>
                        <div className="text-xs font-serif text-[#475569] mt-0.5">
                          {mediaVideoEntries.length} Captured Moments (Cloudflare R2) and {mediaPhotoEntries.length} Photo Memories (ImageKit CDN) are managed in their dedicated section.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView('media')}
                      className="px-4 py-2 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs sm:text-sm font-serif font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <Film className="w-3.5 h-3.5 text-[#3A5A74]" />
                      <span>Open Videos & Photos Manager</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* Top Control Header Card */}
                <div className="bg-[#ffffff] rounded-2xl border border-[#c8d7e3] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2ecf4] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3] flex items-center justify-center text-[#3A5A74]">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18232c] tracking-wide">
                          Keepsake Guestbook Wishes Manager
                        </h3>
                      </div>
                      <p className="font-serif italic text-xs sm:text-sm text-[#475569]">
                        Review, moderate, and curate all written blessings, heartfelt messages, and congratulations posted by your wedding guests.
                      </p>
                    </div>

                    {/* Guestbook Posting Toggle & Visibility Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* TOGGLE SWITCH: Enable or Disable Guestbook Posting */}
                      <div className="flex items-center space-x-3 bg-[#f8fafc] px-4 py-2 rounded-2xl border border-[#c8d7e3] shadow-xs">
                        <div className="text-right">
                          <span className="text-[11px] font-serif font-bold uppercase tracking-wider block text-[#18232c]">
                            Guestbook Posting
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              config.guestbookPostingEnabled !== false
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {config.guestbookPostingEnabled !== false ? '● Posting Enabled' : '○ Posting Disabled'}
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          id="host-toggle-guestbook-posting"
                          aria-checked={config.guestbookPostingEnabled !== false}
                          onClick={handleToggleGuestbookPosting}
                          title={
                            config.guestbookPostingEnabled !== false
                              ? 'Click to disable guestbook posting'
                              : 'Click to enable guestbook posting'
                          }
                          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3A5A74] ${
                            config.guestbookPostingEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              config.guestbookPostingEnabled !== false ? 'translate-x-7' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Section Display Toggle on Page */}
                      <button
                        type="button"
                        id="host-toggle-guestbook-section"
                        onClick={handleToggleGuestbookSection}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-serif font-semibold border transition flex items-center space-x-1.5 shadow-xs ${
                          config.guestbookEnabled !== false
                            ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <span>Section: {config.guestbookEnabled !== false ? 'Visible on Site' : 'Hidden from Site'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569]">Total Written Wishes</div>
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#3A5A74] mt-0.5">
                        {writtenGuestbookEntries.length}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569]">Posting Status</div>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            config.guestbookPostingEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-xs sm:text-sm font-serif font-semibold text-[#18232c]">
                          {config.guestbookPostingEnabled !== false ? 'Accepting Wishes' : 'Posting Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569]">Showing in View</div>
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#18232c] mt-0.5">
                        {
                          writtenGuestbookEntries.filter((e) => {
                            const query = guestbookSearch.toLowerCase();
                            const matchSearch =
                              !query ||
                              e.name.toLowerCase().includes(query) ||
                              (e.relationship && e.relationship.toLowerCase().includes(query)) ||
                              e.message.toLowerCase().includes(query);
                            const matchFilter = guestbookFilter === 'all' || e.relationship === guestbookFilter;
                            return matchSearch && matchFilter;
                          }).length
                        }
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569]">Cloud Firestore</div>
                      <div className="flex items-center space-x-1.5 mt-1 text-emerald-700 font-semibold text-xs sm:text-sm">
                        <Check className="w-4 h-4" />
                        <span>Live Synchronized</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search & Actions Toolbar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#ffffff] p-4 rounded-2xl border border-[#c8d7e3] shadow-sm">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="guestbook-search-input"
                      value={guestbookSearch}
                      onChange={(e) => setGuestbookSearch(e.target.value)}
                      placeholder="Search wishes by guest name, connection, or keyword..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#fbfdfd] border border-[#c8d7e3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] text-xs sm:text-sm font-serif text-[#18232c] placeholder:text-[#94a3b8]"
                    />
                    {guestbookSearch && (
                      <button
                        type="button"
                        onClick={() => setGuestbookSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Relationship Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-[#3A5A74] shrink-0" />
                    <select
                      value={guestbookFilter}
                      onChange={(e) => setGuestbookFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#fbfdfd] border border-[#c8d7e3] text-xs sm:text-sm font-serif text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                    >
                      <option value="all">All Connections & Groups</option>
                      {Array.from(new Set(writtenGuestbookEntries.map((e) => e.relationship).filter(Boolean))).map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      id="host-add-wish-btn"
                      onClick={() => setIsAddWishModalOpen(true)}
                      className="px-3.5 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-serif font-semibold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Keepsake Wish</span>
                    </button>

                    <button
                      type="button"
                      id="host-export-guestbook-csv"
                      onClick={() => exportGuestbookToCsv(writtenGuestbookEntries)}
                      title="Export all written wishes to CSV"
                      className="px-3.5 py-2 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs sm:text-sm font-serif font-semibold transition border border-[#c8d7e3] flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Wishes CSV</span>
                    </button>
                  </div>
                </div>

                {/* Posted Wishes List / Feed */}
                {(() => {
                  const dedupedEntries: GuestbookEntry[] = Array.from(
                    new Map<string, GuestbookEntry>(
                      writtenGuestbookEntries
                        .filter((e): e is GuestbookEntry => Boolean(e && e.id))
                        .map((e) => [e.id, e])
                    ).values()
                  );
                  const filtered = dedupedEntries.filter((entry: GuestbookEntry) => {
                    const q = guestbookSearch.toLowerCase();
                    const matchQ =
                      !q ||
                      entry.name.toLowerCase().includes(q) ||
                      (entry.relationship && entry.relationship.toLowerCase().includes(q)) ||
                      entry.message.toLowerCase().includes(q);
                    const matchF = guestbookFilter === 'all' || entry.relationship === guestbookFilter;
                    return matchQ && matchF;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-12 text-center bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-3">
                        <div className="w-14 h-14 bg-[#ebf2f7] text-[#3A5A74] rounded-full flex items-center justify-center mx-auto border border-[#c8d7e3]">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <h4 className="font-serif text-xl text-[#18232c]">No Written Wishes Found</h4>
                        <p className="font-serif italic text-xs sm:text-sm text-[#475569] max-w-md mx-auto">
                          {guestbookSearch || guestbookFilter !== 'all'
                            ? 'No written messages match your current search or relationship filter. Try clearing your search.'
                            : 'No written wishes have been posted yet. You can add one manually or guests can submit wishes on the invitation page.'}
                        </p>
                        {(guestbookSearch || guestbookFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setGuestbookSearch('');
                              setGuestbookFilter('all');
                            }}
                            className="mt-2 px-4 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    );
                  }

                  const sortedFiltered = [...filtered].sort((a, b) => {
                    const aF = Boolean(a.isFeatured);
                    const bF = Boolean(b.isFeatured);
                    if (aF !== bF) return aF ? -1 : 1;
                    const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
                    const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
                    return timeB - timeA;
                  });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                      {sortedFiltered.map((wish) => {
                        const dateFormatted = wish.createdAt
                          ? new Date(wish.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Recently';

                        return (
                          <div
                            key={wish.id}
                            className={`bg-[#ffffff] rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between ${
                              wish.isFeatured
                                ? 'border-2 border-[#c5a059] ring-1 ring-[#c5a059]/20 bg-gradient-to-br from-[#fffdfa] via-white to-[#fbf7ee]'
                                : 'border border-[#c8d7e3]'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header: Avatar, Name, Relationship, Date */}
                              <div className="flex items-start justify-between gap-2 border-b border-[#f1f5f9] pb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3A5A74] to-[#5b83a5] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs shrink-0">
                                    {(wish.name || 'G').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h5 className="font-serif font-bold text-base text-[#18232c] leading-tight">
                                      {wish.name}
                                    </h5>
                                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                      <span className="text-[11px] font-serif font-semibold px-2 py-0.5 rounded-full bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                                        {wish.relationship || 'Well-Wisher'}
                                      </span>
                                      {wish.isFeatured && (
                                        <span className="inline-flex items-center space-x-1 text-[10px] font-serif font-bold px-2 py-0.5 rounded-full bg-[#fbf5e6] text-[#8a6417] border border-[#e5d4a6] shadow-2xs">
                                          <Pin className="w-2.5 h-2.5 fill-[#c5a059] text-[#8a6417] -rotate-45" />
                                          <span>Featured Keepsake</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <span className="text-[11px] font-serif text-[#64748b] shrink-0">
                                  {dateFormatted}
                                </span>
                              </div>

                              {/* Message Content */}
                              <div className={`relative pl-3 border-l-2 py-1 ${wish.isFeatured ? 'border-[#c5a059]' : 'border-[#c5a059]/50'}`}>
                                <p className="font-serif italic text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                                  "{wish.message}"
                                </p>
                              </div>
                            </div>

                            {/* Card Action Controls */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#f1f5f9]">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  disabled={togglingWishId === wish.id}
                                  onClick={() => handleToggleFeatureWish(wish)}
                                  className={`px-2.5 py-1.5 text-xs font-serif font-medium rounded-lg transition flex items-center space-x-1.5 cursor-pointer border ${
                                    wish.isFeatured
                                      ? 'bg-[#fbf5e6] text-[#8a6417] border-[#e5d4a6] hover:bg-[#f5ebd2]'
                                      : 'text-[#475569] hover:text-[#3A5A74] hover:bg-[#ebf2f7] border-transparent hover:border-[#c8d7e3]'
                                  }`}
                                  title={wish.isFeatured ? 'Unpin from top of public guestbook' : 'Pin to top of public guestbook'}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${wish.isFeatured ? 'fill-[#c5a059] text-[#8a6417] -rotate-45' : 'text-[#64748b]'}`} />
                                  <span>{wish.isFeatured ? 'Pinned' : 'Pin to Top'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyWish(wish)}
                                  className="px-2.5 py-1.5 text-xs font-serif font-medium text-[#475569] hover:text-[#3A5A74] hover:bg-[#ebf2f7] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                                  title="Copy message quote"
                                >
                                  {copiedWishId === wish.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setDeleteWishConfirm(wish)}
                                className="px-2.5 py-1.5 text-xs font-serif font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                                title="Delete this guestbook entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* VIEW 6: KEEPSAKE VIDEO & IMAGES MANAGER */}
            {view === 'media' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 sm:pr-2 animate-fade-in overscroll-contain">
                {/* Back to Operation Settings Hub */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#ffffff] p-2.5 sm:p-3 rounded-2xl border border-[#c8d7e3] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setView('operations')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] hover:bg-[#dbe7f0] border border-[#c8d7e3] transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Operation Settings Table</span>
                  </button>
                  <span className="text-xs font-serif font-semibold text-[#506173]">
                    Operation Settings / <strong className="text-[#18232c]">Videos &amp; Images Keepsakes</strong>
                  </span>
                </div>
                {/* Top Control Header Card */}
                <div className="bg-[#ffffff] rounded-2xl border border-[#c8d7e3] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2ecf4] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3] flex items-center justify-center text-[#3A5A74]">
                          <Film className="w-5 h-5" />
                        </div>
                        <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18232c] tracking-wide">
                          Keepsake Video & Images Manager
                        </h3>
                      </div>
                      <p className="font-serif italic text-xs sm:text-sm text-[#475569]">
                        Review, stream, preview, organize, and moderate all guest video toasts (Cloudflare R2) and photo memories (ImageKit CDN).
                      </p>
                    </div>

                    {/* Media Posting Toggle & Visibility Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* TOGGLE SWITCH: Enable or Disable Media Posting */}
                      <div className="flex items-center space-x-3 bg-[#f8fafc] px-4 py-2 rounded-2xl border border-[#c8d7e3] shadow-xs">
                        <div className="text-right">
                          <span className="text-[11px] font-serif font-bold uppercase tracking-wider block text-[#18232c]">
                            Media Submissions
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              config.videoBlessingsPostingEnabled !== false
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {config.videoBlessingsPostingEnabled !== false ? '● Submissions Open' : '○ Submissions Closed'}
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          id="host-toggle-media-posting"
                          aria-checked={config.videoBlessingsPostingEnabled !== false}
                          onClick={handleToggleVideoBlessingsPosting}
                          title={
                            config.videoBlessingsPostingEnabled !== false
                              ? 'Click to disable media submissions'
                              : 'Click to enable media submissions'
                          }
                          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3A5A74] ${
                            config.videoBlessingsPostingEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              config.videoBlessingsPostingEnabled !== false ? 'translate-x-7' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Section Display Toggle on Page */}
                      <button
                        type="button"
                        id="host-toggle-media-section"
                        onClick={handleToggleVideoBlessingsSection}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-serif font-semibold border transition flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                          config.videoBlessingsEnabled !== false
                            ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <span>Section: {config.videoBlessingsEnabled !== false ? 'Visible on Site' : 'Hidden from Site'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569]">Total Media Keepsakes</div>
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#3A5A74] mt-0.5">
                        {mediaKeepsakeEntries.length}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569] flex items-center space-x-1">
                        <Film className="w-3 h-3 text-[#3A5A74]" />
                        <span>Videos (R2)</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#3A5A74] mt-0.5">
                        {mediaVideoEntries.length}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569] flex items-center space-x-1">
                        <Camera className="w-3 h-3 text-[#3A5A74]" />
                        <span>Photos (ImageKit)</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#3A5A74] mt-0.5">
                        {mediaPhotoEntries.length}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569]">Submissions</div>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            config.videoBlessingsPostingEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-xs sm:text-sm font-serif font-semibold text-[#18232c]">
                          {config.videoBlessingsPostingEnabled !== false ? 'Accepting Media' : 'Submissions Closed'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#ebf2f7] border border-[#c8d7e3]">
                      <div className="text-[11px] font-serif uppercase tracking-wider text-[#475569]">Storage Active</div>
                      <div className="flex items-center space-x-1.5 mt-1 text-emerald-700 font-semibold text-xs sm:text-sm">
                        <Check className="w-4 h-4" />
                        <span>R2 + ImageKit</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION HEADER & ATMOSPHERE QUOTE CUSTOMIZATION */}
                <div className="bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs overflow-hidden transition-all">
                  {/* Card Header with Quick Status Preview & Toggle */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e2ecf4] bg-[#fbfdff]">
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] shrink-0 mt-0.5 sm:mt-0">
                        <Type className="w-5 h-5 text-[#3A5A74]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#18232c]">
                            Section Eyebrow, Title & Atmosphere Quote Customization
                          </h4>
                          <span className="text-[10px] bg-[#ebf2f7] text-[#3A5A74] px-2.5 py-0.5 rounded-full font-sans uppercase tracking-wider font-bold border border-[#c8d7e3]">
                            Public Invitation Header
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                          Live Title: <span className="font-semibold text-[#18232c] not-italic">"{mediaHeaderTitle || 'Video & Photo Blessings'}"</span> • Eyebrow: <span className="font-semibold text-[#3A5A74] not-italic">{mediaHeaderEyebrow || 'Cinematic & Photographic Keepsakes'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        id="host-toggle-media-header-customizer"
                        onClick={() => setIsMediaHeaderCustomizerOpen(!isMediaHeaderCustomizerOpen)}
                        className="px-3.5 py-2 bg-white hover:bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                        aria-expanded={isMediaHeaderCustomizerOpen}
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>{isMediaHeaderCustomizerOpen ? 'Hide Section Header Settings' : 'Customize Header & Quote'}</span>
                        {isMediaHeaderCustomizerOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Customization Body */}
                  {isMediaHeaderCustomizerOpen && (
                    <div className="p-5 sm:p-6 space-y-6 bg-[#ffffff] animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Inputs Column (7 cols) */}
                        <div className="lg:col-span-7 space-y-5">
                          {/* 1. Eyebrow Tagline */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                                Section Eyebrow Tagline
                              </label>
                              <span className="text-[11px] text-[#475569] font-serif italic">Romantic ribbon above the title</span>
                            </div>
                            <input
                              type="text"
                              id="media-header-eyebrow-input"
                              value={mediaHeaderEyebrow}
                              onChange={(e) => setMediaHeaderEyebrow(e.target.value)}
                              placeholder="e.g. Cinematic & Photographic Keepsakes"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif"
                            />
                            {/* Preset Chips */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="text-[10px] uppercase tracking-wider text-[#475569] font-bold py-1 mr-1">
                                Suggestions:
                              </span>
                              {[
                                'Cinematic & Photographic Keepsakes',
                                'Keepsake Video & Photo Blessings',
                                'Heartfelt Video & Photo Toasts',
                                'Wishes in Motion & Memory'
                              ].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => setMediaHeaderEyebrow(chip)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                    mediaHeaderEyebrow === chip
                                      ? 'bg-[#3A5A74] text-white border-[#3A5A74] font-medium'
                                      : 'bg-[#f8fafc] hover:bg-[#ebf2f7] text-[#334155] border-[#c8d7e3]'
                                  }`}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Section Title */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                                Section Main Title
                              </label>
                              <span className="text-[11px] text-[#475569] font-serif italic">Prominent serif headline</span>
                            </div>
                            <input
                              type="text"
                              id="media-header-title-input"
                              value={mediaHeaderTitle}
                              onChange={(e) => setMediaHeaderTitle(e.target.value)}
                              placeholder="e.g. Video & Photo Blessings"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif font-bold"
                            />
                            {/* Preset Chips */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="text-[10px] uppercase tracking-wider text-[#475569] font-bold py-1 mr-1">
                                Suggestions:
                              </span>
                              {[
                                'Captured Moments & Photos',
                                'Cinematic Keepsakes & Toasts',
                                'Captured Moments & Memories',
                                'Moments & Blessings'
                              ].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => setMediaHeaderTitle(chip)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                    mediaHeaderTitle === chip
                                      ? 'bg-[#3A5A74] text-white border-[#3A5A74] font-medium'
                                      : 'bg-[#f8fafc] hover:bg-[#ebf2f7] text-[#334155] border-[#c8d7e3]'
                                  }`}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Atmosphere Quote / Subtitle */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                                Atmosphere Quote / Subtitle
                              </label>
                              <span className="text-[11px] text-[#475569] font-serif italic">Encouraging toast & memory quote</span>
                            </div>
                            <textarea
                              rows={3}
                              id="media-header-subtitle-textarea"
                              value={mediaHeaderSubtitle}
                              onChange={(e) => setMediaHeaderSubtitle(e.target.value)}
                              placeholder="e.g. Record a live toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] text-xs sm:text-sm font-serif italic leading-relaxed"
                            />
                            {/* Preset Chips */}
                            <div className="flex flex-col gap-1.5 pt-1">
                              <span className="text-[10px] uppercase tracking-wider text-[#475569] font-bold">
                                Recommended Atmosphere Quotes:
                              </span>
                              {[
                                'Record a live toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla.',
                                'Share your warmest video toasts and cherished photo moments to treasure for a lifetime.',
                                'Leave an enduring blessing in motion and memory for Mark and Karla.'
                              ].map((quote) => (
                                <button
                                  key={quote}
                                  type="button"
                                  onClick={() => setMediaHeaderSubtitle(quote)}
                                  className={`text-[11px] text-left px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                                    mediaHeaderSubtitle === quote
                                      ? 'bg-[#ebf2f7] text-[#18232c] border-[#3A5A74] font-medium'
                                      : 'bg-[#f8fafc] hover:bg-[#ebf2f7] text-[#475569] border-[#c8d7e3]'
                                  }`}
                                >
                                  "{quote}"
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Live Preview Column (5 cols) */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="p-5 rounded-2xl bg-linear-to-b from-[#f8fafc] to-[#eef4f8] border border-[#c8d7e3] space-y-4 shadow-inner">
                            <div className="flex items-center justify-between pb-2 border-b border-[#c8d7e3]">
                              <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#3A5A74]">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Live Public Site Appearance</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#c8d7e3] text-[#475569]">
                                Real-Time Preview
                              </span>
                            </div>

                            {/* Public Header Preview Box */}
                            <div className="p-6 bg-[#ffffff] rounded-xl border border-[#c8d7e3] text-center space-y-2.5 shadow-xs relative overflow-hidden">
                              <div className="absolute inset-2 border border-[#c5a059]/20 rounded-lg pointer-events-none" />

                              {/* Eyebrow */}
                              <div className="inline-flex items-center justify-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em]">
                                <span className="text-[#3A5A74]/50">❦</span>
                                <span>{mediaHeaderEyebrow.trim() || 'Cinematic & Photographic Keepsakes'}</span>
                                <span className="text-[#3A5A74]/50">❦</span>
                              </div>

                              {/* Title */}
                              <h4 className="text-xl sm:text-2xl font-serif text-[#18232c] font-normal tracking-wide">
                                {mediaHeaderTitle.trim() || 'Video & Photo Blessings'}
                              </h4>

                              {/* Atmosphere Subtitle */}
                              <p className="text-[#475569] font-serif italic text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                                "{mediaHeaderSubtitle.trim() || 'Record a live toast or upload cherished photo memories for Mark & Karla.'}"
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                              <button
                                type="button"
                                id="save-media-header-btn"
                                onClick={() => handleSaveMediaHeader()}
                                className="flex-1 px-4 py-2.5 bg-[#3A5A74] hover:bg-[#2c4559] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
                              >
                                <Save className="w-4 h-4" />
                                <span>Save Section Header</span>
                              </button>

                              <button
                                type="button"
                                id="reset-media-header-btn"
                                onClick={handleResetMediaHeader}
                                className="px-3.5 py-2.5 bg-white hover:bg-[#ebf2f7] text-[#475569] hover:text-[#18232c] border border-[#c8d7e3] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                                title="Reset to default wedding copy"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Defaults</span>
                              </button>
                            </div>

                            {/* Saved Notification Toast */}
                            {mediaHeaderSavedToast && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-medium animate-in fade-in duration-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>✓ Section header successfully updated on live site and saved to cloud!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search & Actions Toolbar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#ffffff] p-4 rounded-2xl border border-[#c8d7e3] shadow-sm">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="media-search-input"
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder="Search media by guest name, connection, or caption..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#fbfdfd] border border-[#c8d7e3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] text-xs sm:text-sm font-serif text-[#18232c] placeholder:text-[#94a3b8]"
                    />
                    {mediaSearch && (
                      <button
                        type="button"
                        onClick={() => setMediaSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Media Type Filter Tabs */}
                  <div className="flex items-center space-x-1 bg-[#f1f6fa] p-1 rounded-xl border border-[#c8d7e3]">
                    <button
                      type="button"
                      onClick={() => setMediaTypeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center space-x-1 cursor-pointer ${
                        mediaTypeFilter === 'all'
                          ? 'bg-white text-[#3A5A74] shadow-xs border border-[#c8d7e3]'
                          : 'text-[#64748b] hover:text-[#18232c]'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>All ({mediaKeepsakeEntries.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMediaTypeFilter('video')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center space-x-1 cursor-pointer ${
                        mediaTypeFilter === 'video'
                          ? 'bg-white text-[#3A5A74] shadow-xs border border-[#c8d7e3]'
                          : 'text-[#64748b] hover:text-[#18232c]'
                      }`}
                    >
                      <Film className="w-3 h-3" />
                      <span>Videos ({mediaVideoEntries.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMediaTypeFilter('photo')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center space-x-1 cursor-pointer ${
                        mediaTypeFilter === 'photo'
                          ? 'bg-white text-[#3A5A74] shadow-xs border border-[#c8d7e3]'
                          : 'text-[#64748b] hover:text-[#18232c]'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>Photos ({mediaPhotoEntries.length})</span>
                    </button>
                  </div>

                  {/* Relationship Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-[#3A5A74] shrink-0" />
                    <select
                      value={mediaRelationshipFilter}
                      onChange={(e) => setMediaRelationshipFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#fbfdfd] border border-[#c8d7e3] text-xs sm:text-sm font-serif text-[#18232c] focus:outline-none focus:ring-2 focus:ring-[#3A5A74]"
                    >
                      <option value="all">All Connections</option>
                      {Array.from(new Set(mediaKeepsakeEntries.map((e) => e.relationship).filter(Boolean))).map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      id="host-export-media-csv"
                      onClick={() => exportMediaKeepsakesToCsv(mediaKeepsakeEntries)}
                      title="Export all media keepsakes with URLs to CSV"
                      className="px-3.5 py-2 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs sm:text-sm font-serif font-semibold transition border border-[#c8d7e3] flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Media CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setView('guestbook')}
                      title="Switch to Written Guestbook Wishes Manager"
                      className="px-3 py-2 bg-[#ebf2f7] hover:bg-[#dfeaf3] text-[#3A5A74] rounded-xl text-xs font-serif font-semibold transition border border-[#c8d7e3] flex items-center space-x-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Written Wishes ({writtenGuestbookEntries.length})</span>
                    </button>
                  </div>
                </div>

                {/* Media Grid */}
                {(() => {
                  const filteredMedia = mediaKeepsakeEntries.filter((item) => {
                    const q = mediaSearch.toLowerCase();
                    const matchQ =
                      !q ||
                      item.name.toLowerCase().includes(q) ||
                      (item.relationship && item.relationship.toLowerCase().includes(q)) ||
                      (item.message && item.message.toLowerCase().includes(q));

                    const matchType =
                      mediaTypeFilter === 'all'
                        ? true
                        : mediaTypeFilter === 'video'
                        ? Boolean(item.videoUrl)
                        : Boolean(item.imageUrl);

                    const matchRel = mediaRelationshipFilter === 'all' || item.relationship === mediaRelationshipFilter;

                    return matchQ && matchType && matchRel;
                  });

                  if (filteredMedia.length === 0) {
                    return (
                      <div className="p-12 text-center bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-3">
                        <div className="w-14 h-14 bg-[#ebf2f7] text-[#3A5A74] rounded-full flex items-center justify-center mx-auto border border-[#c8d7e3]">
                          {mediaTypeFilter === 'photo' ? (
                            <Camera className="w-6 h-6" />
                          ) : (
                            <Film className="w-6 h-6" />
                          )}
                        </div>
                        <h4 className="font-serif text-xl text-[#18232c]">
                          {mediaTypeFilter === 'photo'
                            ? 'No Photos Found'
                            : mediaTypeFilter === 'video'
                            ? 'No Videos Found'
                            : 'No Media Keepsakes Found'}
                        </h4>
                        <p className="font-serif italic text-xs sm:text-sm text-[#475569] max-w-md mx-auto">
                          {mediaSearch || mediaRelationshipFilter !== 'all' || mediaTypeFilter !== 'all'
                            ? 'No videos or photos match your current search or filter criteria. Try clearing your search.'
                            : 'Guests have not uploaded any videos or photos yet. You can enable media submissions on the wedding site so guests can share keepsakes.'}
                        </p>
                        {(mediaSearch || mediaRelationshipFilter !== 'all' || mediaTypeFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setMediaSearch('');
                              setMediaTypeFilter('all');
                              setMediaRelationshipFilter('all');
                            }}
                            className="mt-2 px-4 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    );
                  }

                  const sortedFilteredMedia = [...filteredMedia].sort((a, b) => {
                    const aF = Boolean(a.isFeatured);
                    const bF = Boolean(b.isFeatured);
                    if (aF !== bF) return aF ? -1 : 1;
                    const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
                    const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
                    return timeB - timeA;
                  });

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-8">
                      {sortedFilteredMedia.map((media) => {
                        const dateFormatted = media.createdAt
                          ? new Date(media.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Recently';

                        const isVideo = Boolean(media.videoUrl);
                        const isPhoto = Boolean(media.imageUrl);

                        return (
                          <div
                            key={media.id}
                            className={`bg-[#ffffff] rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between ${
                              media.isFeatured
                                ? 'border-2 border-[#c5a059] ring-1 ring-[#c5a059]/20 bg-gradient-to-br from-[#fffdfa] via-white to-[#fbf7ee]'
                                : 'border border-[#c8d7e3]'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header: Author Info & Media Badges */}
                              <div className="flex items-start justify-between gap-2 border-b border-[#f1f5f9] pb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3A5A74] to-[#5b83a5] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs shrink-0">
                                    {(media.name || 'G').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h5 className="font-serif font-bold text-base text-[#18232c] leading-tight">
                                      {media.name}
                                    </h5>
                                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                      <span className="text-[11px] font-serif font-semibold px-2 py-0.5 rounded-full bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                                        {media.relationship || 'Guest'}
                                      </span>
                                      {isVideo && (
                                        <span className="text-[10px] font-mono text-[#3A5A74] bg-[#ebf2f7] px-1.5 py-0.5 rounded border border-[#c8d7e3] flex items-center space-x-1">
                                          <Film className="w-2.5 h-2.5" />
                                          <span>R2 Video</span>
                                        </span>
                                      )}
                                      {isPhoto && (
                                        <span className="text-[10px] font-mono text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 flex items-center space-x-1">
                                          <Camera className="w-2.5 h-2.5" />
                                          <span>ImageKit</span>
                                        </span>
                                      )}
                                      {media.isFeatured && (
                                        <span className="inline-flex items-center space-x-1 text-[10px] font-serif font-bold px-2 py-0.5 rounded-full bg-[#fbf5e6] text-[#8a6417] border border-[#e5d4a6] shadow-2xs">
                                          <Pin className="w-2.5 h-2.5 fill-[#c5a059] text-[#8a6417] -rotate-45" />
                                          <span>Featured Keepsake</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <span className="text-[11px] font-serif text-[#64748b] shrink-0">
                                  {dateFormatted}
                                </span>
                              </div>

                              {/* Media Player or Photo Preview */}
                              {isVideo && media.videoUrl && (
                                <div className="space-y-2">
                                  <VideoBlessingPlayer
                                    videoUrl={media.videoUrl}
                                    authorName={media.name}
                                    relationship={media.relationship}
                                    duration={media.videoDuration}
                                  />
                                  <div className="flex items-center justify-between text-[11px] font-serif text-[#475569] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2ecf4]">
                                    <span className="truncate max-w-[200px]" title={media.videoUrl}>
                                      Cloudflare R2 Stream
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(media.videoUrl!);
                                          setCopiedMediaId(media.id);
                                          setTimeout(() => setCopiedMediaId(null), 2500);
                                        }}
                                        className="text-[#3A5A74] hover:underline cursor-pointer flex items-center space-x-1"
                                      >
                                        {copiedMediaId === media.id ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span className="text-emerald-700">Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy URL</span>
                                          </>
                                        )}
                                      </button>
                                      <a
                                        href={media.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#3A5A74] hover:underline flex items-center space-x-0.5"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>Open</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {isPhoto && media.imageUrl && (
                                <div className="space-y-2">
                                  <div
                                    onClick={() =>
                                      setSelectedMediaLightboxPhoto({
                                        url: media.imageUrl!,
                                        authorName: media.name,
                                        relationship: media.relationship,
                                        caption: media.message,
                                        createdAt: media.createdAt,
                                      })
                                    }
                                    className="group relative block cursor-pointer overflow-hidden rounded-xl border border-[#c8d7e3] bg-[#f8fafc] shadow-xs hover:shadow-md transition"
                                  >
                                    <img
                                      src={media.imageUrl}
                                      alt={`${media.name}'s photo memory`}
                                      referrerPolicy="no-referrer"
                                      className="h-56 w-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition flex items-center justify-center">
                                      <span className="opacity-0 group-hover:opacity-100 transition bg-white/95 text-[#18232c] text-xs font-serif px-3 py-1.5 rounded-full shadow-md flex items-center space-x-1.5 transform translate-y-1 group-hover:translate-y-0 duration-200">
                                        <Maximize2 className="w-3.5 h-3.5 text-[#3A5A74]" />
                                        <span className="font-semibold">Zoom Full Screen</span>
                                      </span>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded font-mono">
                                      ImageKit CDN
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] font-serif text-[#475569] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2ecf4]">
                                    <span className="truncate max-w-[200px]" title={media.imageUrl}>
                                      ImageKit CDN Photo
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(media.imageUrl!);
                                          setCopiedMediaId(media.id);
                                          setTimeout(() => setCopiedMediaId(null), 2500);
                                        }}
                                        className="text-[#3A5A74] hover:underline cursor-pointer flex items-center space-x-1"
                                      >
                                        {copiedMediaId === media.id ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span className="text-emerald-700">Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy URL</span>
                                          </>
                                        )}
                                      </button>
                                      <a
                                        href={media.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#3A5A74] hover:underline flex items-center space-x-0.5"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>Open</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Message Note / Caption */}
                              {media.message && (
                                <div className="relative pl-3 border-l-2 border-[#c5a059]/50 py-1">
                                  <p className="font-serif italic text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                                    "{media.message}"
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Card Action Controls */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#f1f5f9]">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  disabled={togglingWishId === media.id}
                                  onClick={() => handleToggleFeatureWish(media)}
                                  className={`px-2.5 py-1.5 text-xs font-serif font-medium rounded-lg transition flex items-center space-x-1.5 cursor-pointer border ${
                                    media.isFeatured
                                      ? 'bg-[#fbf5e6] text-[#8a6417] border-[#e5d4a6] hover:bg-[#f5ebd2]'
                                      : 'text-[#475569] hover:text-[#3A5A74] hover:bg-[#ebf2f7] border-transparent hover:border-[#c8d7e3]'
                                  }`}
                                  title={media.isFeatured ? 'Unpin from top of gallery and guestbook' : 'Pin to top of gallery and guestbook'}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${media.isFeatured ? 'fill-[#c5a059] text-[#8a6417] -rotate-45' : 'text-[#64748b]'}`} />
                                  <span>{media.isFeatured ? 'Pinned' : 'Pin to Top'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyWish(media)}
                                  className="px-2.5 py-1.5 text-xs font-serif font-medium text-[#475569] hover:text-[#3A5A74] hover:bg-[#ebf2f7] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                                  title="Copy caption text"
                                >
                                  {copiedWishId === media.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setDeleteWishConfirm(media)}
                                className="px-2.5 py-1.5 text-xs font-serif font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                                title="Delete this media keepsake"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* VIEW 7: WEDDING THEMES CONTROL STUDIO */}
            {view === 'themes' && (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 w-full animate-in fade-in">
                {/* Back to Operation Settings Hub */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#ffffff] p-2.5 sm:p-3 rounded-2xl border border-[#c8d7e3] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setView('operations')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-serif font-bold text-[#3A5A74] bg-[#ebf2f7] hover:bg-[#dbe7f0] border border-[#c8d7e3] transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Operation Settings Table</span>
                  </button>
                  <span className="text-xs font-serif font-semibold text-[#506173]">
                    Operation Settings / <strong className="text-[#18232c]">Curated Design Themes</strong>
                  </span>
                </div>
                <HostThemesSection
                  config={config}
                  onSaveConfig={onSaveConfig}
                  onClose={onClose}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Single Guest Modal */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#c8d7e3] relative space-y-4 font-serif">
            <button
              onClick={() => setEditingGuest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#ebf2f7] text-[#475569] hover:text-[#18232c]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-[#c8d7e3] pb-3">
              <div className="w-11 h-11 rounded-xl bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] flex items-center justify-center text-lg">
                <ChairIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18232c]">
                  Manage Guest Seating
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] font-serif">Update table, seat, and RSVP details</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm font-serif">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={editingGuest.name}
                  onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base text-[#18232c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingGuest.phone || ''}
                    onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                    placeholder="e.g. 0917 123 4567"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1">
                    Email Address <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={editingGuest.email || ''}
                    onChange={(e) => setEditingGuest({ ...editingGuest, email: e.target.value })}
                    placeholder="e.g. guest@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                      Assigned Table
                    </label>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Party of {Math.max(1, editingGuest.count || 1)}
                    </span>
                  </div>
                  <select
                    value={editingGuest.table || ''}
                    onChange={(e) => {
                      const newTable = e.target.value;
                      const partySize = Math.max(1, editingGuest.count || 1);
                      if (newTable) {
                        const destGuests = (allSeatingTables.find(([tn]) => tn === newTable)?.[1] || []).filter(item => item.id !== editingGuest.id);
                        const firstOpen = getFirstAvailableSeat(destGuests, activeSeatsPerTable, partySize, editingGuest.id);
                        setEditingGuest({
                          ...editingGuest,
                          table: newTable,
                          seat: firstOpen || editingGuest.seat || 'Seat 1'
                        });
                      } else {
                        setEditingGuest({
                          ...editingGuest,
                          table: '',
                          seat: ''
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c] font-semibold outline-none focus:ring-2 focus:ring-[#3A5A74]"
                  >
                    <option value="">Unassigned (No Table)</option>
                    {allSeatingTables.map(([tNameCandidate, candGuests]) => {
                      const candWithoutGuest = candGuests.filter(item => item.id !== editingGuest.id);
                      const occupied = getTableOccupiedSeats(candWithoutGuest);
                      const openChairs = Math.max(0, activeSeatsPerTable - occupied);
                      const partySize = Math.max(1, editingGuest.count || 1);
                      const fits = openChairs >= partySize;
                      const isCurrent = (editingGuest.table || '') === tNameCandidate;

                      let info = '';
                      if (isCurrent) {
                        info = `Current • ${openChairs} open`;
                      } else if (openChairs === 0) {
                        info = `FULL`;
                      } else if (fits) {
                        info = `${openChairs} open • Fits party`;
                      } else {
                        info = `${openChairs} open • Needs ${partySize}`;
                      }

                      return (
                        <option key={tNameCandidate} value={tNameCandidate}>
                          {tNameCandidate} ({info})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                      Assigned Seat
                    </label>
                  </div>
                  {editingGuest.table ? (
                    <select
                      value={editingGuest.seat || 'Seat 1'}
                      onChange={(e) => setEditingGuest({ ...editingGuest, seat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c] font-semibold outline-none focus:ring-2 focus:ring-[#3A5A74]"
                    >
                      {(() => {
                        const destGuests = (allSeatingTables.find(([tn]) => tn === editingGuest.table)?.[1] || []).filter(item => item.id !== editingGuest.id);
                        const partySize = Math.max(1, editingGuest.count || 1);
                        const seatOptions = getAvailableSeatOptions(destGuests, activeSeatsPerTable, partySize, editingGuest.seat, editingGuest.id);
                        return seatOptions.map(opt => (
                          <option 
                            key={opt.value} 
                            value={opt.value} 
                            disabled={!opt.isAvailable}
                            className={!opt.isAvailable ? 'text-slate-400 bg-slate-100' : opt.fitsParty ? 'text-emerald-800 font-semibold' : ''}
                          >
                            {opt.label}
                          </option>
                        ));
                      })()}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="No seat (Unassigned)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-500 italic"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#18232c] mb-1">
                    Status
                  </label>
                  <select
                    value={editingGuest.attending}
                    onChange={(e) => setEditingGuest({ ...editingGuest, attending: e.target.value as 'yes' | 'no' })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base"
                  >
                    <option value="yes">Attending (Yes)</option>
                    <option value="no">Declined (No)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#18232c] mb-1">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editingGuest.count}
                    onChange={(e) => setEditingGuest({ ...editingGuest, count: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Expected Arrival Time Field */}
              <div>
                <label className="block text-sm font-semibold text-[#18232c] mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Expected Arrival Time</span>
                  </span>
                  <span className="text-xs text-slate-400 font-normal">Optional</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingGuest.expectedArrivalTime || editingGuest.expectedArrival || ''}
                    placeholder={`e.g. ${formData.churchTime || '2:00 PM PST'}`}
                    onChange={(e) => setEditingGuest({
                      ...editingGuest,
                      expectedArrivalTime: e.target.value,
                      expectedArrival: e.target.value
                    })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const defaultTime = formData.churchTime || formData.time || '2:00 PM PST';
                      setEditingGuest({
                        ...editingGuest,
                        expectedArrivalTime: defaultTime,
                        expectedArrival: defaultTime
                      });
                    }}
                    className="px-2.5 py-2 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs font-semibold whitespace-nowrap border border-[#c8d7e3]"
                    title="Set to Event Default Time"
                  >
                    Use Default
                  </button>
                </div>
              </div>

              {/* Check-In / Arrival Status in Edit Guest Modal */}
              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`w-4 h-4 ${(editingGuest.checkedIn || editingGuest.is_checked_in) ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-xs sm:text-sm font-semibold text-[#18232c]">Check-In / Arrival Status</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !(editingGuest.checkedIn || editingGuest.is_checked_in);
                      const now = new Date().toISOString();
                      setEditingGuest({
                        ...editingGuest,
                        checkedIn: next,
                        is_checked_in: next,
                        arrivedAt: next ? (editingGuest.arrivedAt || editingGuest.checkedInAt || editingGuest.checked_in_at || now) : undefined,
                        checkedInAt: next ? (editingGuest.checkedInAt || editingGuest.arrivedAt || editingGuest.checked_in_at || now) : undefined,
                        checked_in_at: next ? (editingGuest.checked_in_at || editingGuest.arrivedAt || editingGuest.checkedInAt || now) : undefined,
                      });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      (editingGuest.checkedIn || editingGuest.is_checked_in)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-600 border border-[#c8d7e3]'
                    }`}
                  >
                    {(editingGuest.checkedIn || editingGuest.is_checked_in) ? '✓ Checked-In (Arrived)' : 'Pending Arrival'}
                  </button>
                </div>
                {(editingGuest.checkedIn || editingGuest.is_checked_in) && (editingGuest.arrivedAt || editingGuest.checkedInAt || editingGuest.checked_in_at) && (
                  <div className="text-[11px] text-emerald-700 font-sans flex items-center pt-1 border-t border-emerald-100">
                    <Clock className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                    <span>Arrived: {new Date(editingGuest.arrivedAt || editingGuest.checkedInAt || editingGuest.checked_in_at!).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2.5 pt-3 border-t border-[#c8d7e3]">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteGuest(editingGuest.id);
                    setEditingGuest(null);
                  }}
                  className="px-4 py-2.5 bg-[#ebf2f7] text-[#a83232] hover:bg-[#dbe7f0] rounded-xl font-semibold transition border border-[#c8d7e3] text-xs sm:text-sm"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateGuest(editingGuest);
                    setEditingGuest(null);
                  }}
                  className="flex-1 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white font-semibold rounded-xl transition border border-[#4D708E] text-xs sm:text-sm"
                >
                  Save Seating Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Guest Modal */}
      {isAddGuestModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#c8d7e3] relative space-y-4 font-serif">
            <button
              onClick={() => setIsAddGuestModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#ebf2f7] text-[#475569] hover:text-[#18232c]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-[#c8d7e3] pb-3">
              <div className="w-11 h-11 rounded-xl bg-[#3A5A74] text-white flex items-center justify-center text-lg">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18232c]">
                  Add Guest to Registry
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] font-serif">Assign table, seat, and RSVP status</p>
              </div>
            </div>

            <form onSubmit={handleCreateGuestSubmit} className="space-y-3.5 text-xs sm:text-sm font-serif">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-[#18232c] mb-1">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newGuestData.name}
                  onChange={(e) => setNewGuestData({ ...newGuestData, name: e.target.value })}
                  placeholder="e.g. Lady Genevieve Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base text-[#18232c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newGuestData.phone || ''}
                    onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                    placeholder="e.g. 0917 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base text-[#18232c]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#18232c] mb-1">
                    Email Address <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={newGuestData.email || ''}
                    onChange={(e) => setNewGuestData({ ...newGuestData, email: e.target.value })}
                    placeholder="e.g. genevieve@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base text-[#18232c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                      Table
                    </label>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Party of {Math.max(1, newGuestData.count || 1)}
                    </span>
                  </div>
                  <select
                    value={newGuestData.table}
                    onChange={(e) => {
                      const newTable = e.target.value;
                      const partySize = Math.max(1, newGuestData.count || 1);
                      if (newTable) {
                        const destGuests = allSeatingTables.find(([tn]) => tn === newTable)?.[1] || [];
                        const firstOpen = getFirstAvailableSeat(destGuests, activeSeatsPerTable, partySize);
                        setNewGuestData({
                          ...newGuestData,
                          table: newTable,
                          seat: firstOpen || 'Seat 1'
                        });
                      } else {
                        setNewGuestData({
                          ...newGuestData,
                          table: '',
                          seat: ''
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c] font-semibold outline-none focus:ring-2 focus:ring-[#3A5A74]"
                  >
                    <option value="">Unassigned (No Table)</option>
                    {allSeatingTables.map(([tNameCandidate, candGuests]) => {
                      const occupied = getTableOccupiedSeats(candGuests);
                      const openChairs = Math.max(0, activeSeatsPerTable - occupied);
                      const partySize = Math.max(1, newGuestData.count || 1);
                      const fits = openChairs >= partySize;

                      let info = '';
                      if (openChairs === 0) {
                        info = `FULL`;
                      } else if (fits) {
                        info = `${openChairs} open • Fits party`;
                      } else {
                        info = `${openChairs} open • Needs ${partySize}`;
                      }

                      return (
                        <option key={tNameCandidate} value={tNameCandidate}>
                          {tNameCandidate} ({info})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                      Seat
                    </label>
                  </div>
                  {newGuestData.table ? (
                    <select
                      value={newGuestData.seat || 'Seat 1'}
                      onChange={(e) => setNewGuestData({ ...newGuestData, seat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-xs sm:text-sm text-[#18232c] font-semibold outline-none focus:ring-2 focus:ring-[#3A5A74]"
                    >
                      {(() => {
                        const destGuests = allSeatingTables.find(([tn]) => tn === newGuestData.table)?.[1] || [];
                        const partySize = Math.max(1, newGuestData.count || 1);
                        const seatOptions = getAvailableSeatOptions(destGuests, activeSeatsPerTable, partySize, newGuestData.seat);
                        return seatOptions.map(opt => (
                          <option 
                            key={opt.value} 
                            value={opt.value} 
                            disabled={!opt.isAvailable}
                            className={!opt.isAvailable ? 'text-slate-400 bg-slate-100' : opt.fitsParty ? 'text-emerald-800 font-semibold' : ''}
                          >
                            {opt.label}
                          </option>
                        ));
                      })()}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="No seat (Unassigned)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-500 italic"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#18232c] mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={newGuestData.attending}
                    onChange={(e) => setNewGuestData({ ...newGuestData, attending: e.target.value as 'yes' | 'no' })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base"
                  >
                    <option value="yes">Attending (Yes)</option>
                    <option value="no">Declined (No)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#18232c] mb-1">
                    Party Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newGuestData.count}
                    onChange={(e) => setNewGuestData({ ...newGuestData, count: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Expected Arrival Time Field */}
              <div>
                <label className="block text-sm font-semibold text-[#18232c] mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Expected Arrival Time</span>
                  </span>
                  <span className="text-xs text-slate-400 font-normal">Optional</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newGuestData.expectedArrivalTime || ''}
                    placeholder={`e.g. ${formData.churchTime || '2:00 PM PST'}`}
                    onChange={(e) => setNewGuestData({
                      ...newGuestData,
                      expectedArrivalTime: e.target.value,
                      expectedArrival: e.target.value
                    })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const defaultTime = formData.churchTime || formData.time || '2:00 PM PST';
                      setNewGuestData({
                        ...newGuestData,
                        expectedArrivalTime: defaultTime,
                        expectedArrival: defaultTime
                      });
                    }}
                    className="px-2.5 py-2 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs font-semibold whitespace-nowrap border border-[#c8d7e3]"
                    title="Set to Event Default Time"
                  >
                    Use Default
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 pt-3 border-t border-[#c8d7e3]">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="px-4 py-2.5 bg-[#ebf2f7] text-[#475569] rounded-xl font-semibold border border-[#c8d7e3] text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white font-semibold rounded-xl border border-[#4D708E] transition text-xs sm:text-sm"
                >
                  Confirm & Add Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom In-App Delete Confirmation Modal (Safe for iframes, avoids blocked window.confirm) */}
      {deleteConfirmState && (
        <div className="fixed inset-0 bg-black/85 z-[85] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 relative space-y-4 font-serif text-[#18232c] animate-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200 shadow-xs">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-rose-700 font-sans">
                    Confirm Deletion
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmState(null)}
                    disabled={isBulkDeleting}
                    className="p-1 rounded-full text-[#475569] hover:text-[#18232c] hover:bg-slate-100 transition"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-xl font-bold font-serif text-[#18232c]">
                  {deleteConfirmState.ids.length > 1
                    ? `Delete ${deleteConfirmState.ids.length} Selected Guests?`
                    : `Delete "${deleteConfirmState.names[0]}"?`}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
              Are you sure you want to permanently delete {deleteConfirmState.ids.length > 1 ? `these ${deleteConfirmState.ids.length} guests` : `"${deleteConfirmState.names[0]}"`}? This will remove {deleteConfirmState.ids.length > 1 ? 'them' : 'this guest'} from your guest list, seating arrangements, and Cloud Firestore.
            </p>

            {deleteConfirmState.ids.length > 1 && (
              <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-sans space-y-1">
                {deleteConfirmState.names.slice(0, 8).map((name, i) => (
                  <div key={i} className="truncate font-medium flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
                {deleteConfirmState.names.length > 8 && (
                  <div className="text-slate-500 italic pt-1 pl-3">
                    ...and {deleteConfirmState.names.length - 8} more guests
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 px-4 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#475569] rounded-xl font-semibold text-xs sm:text-sm transition border border-[#c8d7e3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedDelete}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 px-4 bg-[#a83232] hover:bg-[#8b2222] text-white rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 shadow-md border border-rose-900/20"
              >
                {isBulkDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>
                  {deleteConfirmState.ids.length > 1
                    ? `Delete ${deleteConfirmState.ids.length} Guests`
                    : 'Delete Guest'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset to Defaults Security Password & Confirmation Alert Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/85 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-200 relative space-y-5 font-serif text-[#18232c] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200 shadow-xs">
                <ShieldAlert className="w-6 h-6 text-rose-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-rose-700 font-sans">
                    Protected Action
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="p-1 rounded-full text-[#475569] hover:text-[#18232c] hover:bg-slate-100 transition"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#18232c]">
                  Confirm Database Reset
                </h3>
              </div>
            </div>

            {/* Alert Notification Box */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-bold text-rose-900">
                    Warning: Accidental clicks are prevented!
                  </p>
                  <p className="text-rose-800 leading-relaxed">
                    Resetting will overwrite your customized wedding ceremony, couple names, photos, schedules, guest RSVPs, and Cloud Firestore database with the starter template defaults.
                  </p>
                  <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Authorization Form */}
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-[#18232c]">
                    Host Security Password:
                  </label>
                  <span className="text-[11px] text-[#506173] font-sans">
                    {getActiveHostPassword() === 'admin123' ? (
                      <>Default: <code className="bg-slate-100 px-1 py-0.5 rounded text-[#3A5A74] font-mono">admin123</code></>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Custom Password Required</span>
                    )}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <KeyRound className="w-4 h-4 text-[#506173]" />
                  </div>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPasswordInput}
                    onChange={(e) => {
                      setResetPasswordInput(e.target.value);
                      if (resetPasswordError) setResetPasswordError('');
                    }}
                    placeholder="Enter host password to authorize"
                    autoFocus
                    required
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none text-sm text-[#18232c] placeholder:text-slate-400 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#506173] hover:text-[#18232c]"
                    title={showResetPassword ? 'Hide password' : 'Show password'}
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {resetPasswordError && (
                  <div className="mt-2.5 p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs sm:text-sm flex items-center space-x-2 font-sans font-medium animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{resetPasswordError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] font-serif font-semibold text-xs sm:text-sm transition"
                >
                  Cancel & Protect Data
                </button>
                <button
                  type="submit"
                  disabled={!resetPasswordInput.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-serif font-semibold text-xs sm:text-sm transition shadow-md flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Host Password Changer Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/80 z-[75] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#c8d7e3] relative space-y-5 font-serif animate-in zoom-in-95 duration-150">
            <button
              onClick={handleCloseChangePassword}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#ebf2f7] text-[#475569] hover:text-[#18232c] transition cursor-pointer"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-3.5 border-b border-[#c8d7e3] pb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] flex items-center justify-center shrink-0 shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="pr-6">
                <h3 className="text-lg sm:text-xl font-bold font-serif text-[#18232c]">
                  Change Host Password
                </h3>
                <p className="text-xs text-[#506173] mt-0.5 font-serif italic">
                  Update your private access credentials for the Host Dashboard and security resets.
                </p>
              </div>
            </div>

            {changePasswordSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 text-center py-6 animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base text-emerald-900 font-serif">Password Updated Successfully!</h4>
                <p className="text-xs text-emerald-800 font-sans leading-relaxed">
                  Your new host password has been saved. Please make a note of your new credentials for future logins.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitChangePassword} className="space-y-4 font-sans text-left">
                {changePasswordError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{changePasswordError}</span>
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#18232c]">
                      Current Host Password:
                    </label>
                    {getActiveHostPassword() === 'admin123' && (
                      <span className="text-[10px] text-[#506173]">
                        Default: <code className="bg-[#ebf2f7] px-1 py-0.5 rounded text-[#3A5A74] font-mono">admin123</code>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => {
                        setCurrentPasswordInput(e.target.value);
                        if (changePasswordError) setChangePasswordError('');
                      }}
                      placeholder="Enter current password"
                      required
                      autoFocus
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] outline-none focus:ring-2 focus:ring-[#3A5A74]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#506173] hover:text-[#18232c] cursor-pointer"
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#18232c] mb-1">
                    New Host Password <span className="text-[11px] font-normal text-[#506173]">(minimum 6 characters)</span>:
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => {
                        setNewPasswordInput(e.target.value);
                        if (changePasswordError) setChangePasswordError('');
                      }}
                      placeholder="Enter new host password"
                      required
                      minLength={6}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] outline-none focus:ring-2 focus:ring-[#3A5A74]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#506173] hover:text-[#18232c] cursor-pointer"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#18232c] mb-1">
                    Confirm New Host Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => {
                        setConfirmPasswordInput(e.target.value);
                        if (changePasswordError) setChangePasswordError('');
                      }}
                      placeholder="Re-enter new host password"
                      required
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#ffffff] border text-sm text-[#18232c] outline-none focus:ring-2 ${
                        confirmPasswordInput && newPasswordInput && confirmPasswordInput !== newPasswordInput
                          ? 'border-rose-300 focus:ring-rose-200'
                          : confirmPasswordInput && newPasswordInput && confirmPasswordInput === newPasswordInput
                          ? 'border-emerald-300 focus:ring-emerald-200'
                          : 'border-[#c8d7e3] focus:ring-[#3A5A74]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#506173] hover:text-[#18232c] cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPasswordInput && newPasswordInput && (
                    <div className="mt-1 text-[11px] flex items-center space-x-1">
                      {confirmPasswordInput === newPasswordInput ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Passwords match</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>Passwords do not match</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2.5 pt-3 border-t border-[#c8d7e3]">
                  <button
                    type="button"
                    onClick={handleCloseChangePassword}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] font-serif font-semibold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !currentPasswordInput || !newPasswordInput || !confirmPasswordInput}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#3A5A74] hover:bg-[#274155] disabled:opacity-50 disabled:cursor-not-allowed text-white font-serif font-semibold text-xs sm:text-sm transition shadow-md border border-[#4D708E] flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Wish Confirmation Modal */}
      {deleteWishConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#c8d7e3] relative space-y-4 font-serif">
            <button
              onClick={() => setDeleteWishConfirm(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#ebf2f7] text-[#475569] hover:text-[#18232c]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-[#c8d7e3] pb-3">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#18232c]">Delete Guestbook Wish</h3>
                <p className="text-xs text-[#475569]">Remove this entry from the keepsake album</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#c8d7e3] space-y-1.5 text-xs sm:text-sm">
              <div className="font-semibold text-[#18232c]">
                {deleteWishConfirm.name} ({deleteWishConfirm.relationship || 'Well-Wisher'})
              </div>
              <p className="italic text-[#475569] line-clamp-3">"{deleteWishConfirm.message}"</p>
            </div>

            {deleteWishConfirm.videoUrl && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start space-x-2">
                <Film className="w-4 h-4 text-[#3A5A74] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#18232c]">Attached Captured Moment in Cloudflare R2</span>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    This wish includes a video captured moment stored in your Cloudflare R2 storage bucket. Deleting this wish will automatically and permanently purge the video file from Cloudflare R2.
                  </p>
                </div>
              </div>
            )}

            {deleteWishConfirm.imageUrl && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start space-x-2">
                <Camera className="w-4 h-4 text-[#3A5A74] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#18232c]">Attached Photo Memory in ImageKit CDN</span>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    This keepsake includes a photo memory hosted in ImageKit cloud CDN. Deleting will permanently remove it from your live showcase and Firestore database.
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-[#64748b]">
              {deleteWishConfirm.videoUrl
                ? 'Are you sure you want to delete this wish? The video will be purged from Cloudflare R2 and the wish removed from Firestore.'
                : deleteWishConfirm.imageUrl
                ? 'Are you sure you want to delete this photo keepsake? It will be removed from your showcase and cloud database.'
                : 'Are you sure you want to permanently delete this wish? It will be removed from your cloud Firestore database and website keepsake album.'}
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteWishConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] font-serif font-semibold text-xs sm:text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingWish}
                onClick={handleConfirmDeleteWish}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-serif font-semibold text-xs sm:text-sm transition shadow-md flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingWish ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Keepsake Wish Modal */}
      {isAddWishModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-[#c8d7e3] relative space-y-4 font-serif">
            <button
              onClick={() => setIsAddWishModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#ebf2f7] text-[#475569] hover:text-[#18232c]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-[#c8d7e3] pb-3">
              <div className="w-11 h-11 rounded-xl bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#18232c]">Add Keepsake Wish</h3>
                <p className="text-xs text-[#475569]">Add a message or offline note to the guestbook</p>
              </div>
            </div>

            <form onSubmit={handleCreateHostWish} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-[#18232c] mb-1">Guest Name(s) *</label>
                <input
                  type="text"
                  required
                  value={newWishName}
                  onChange={(e) => setNewWishName(e.target.value)}
                  placeholder="e.g. Aunt Clara & Uncle Robert"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] focus:outline-none focus:ring-2 focus:ring-[#3A5A74] text-[#18232c]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#18232c] mb-1">Relationship / Connection (Optional)</label>
                <input
                  type="text"
                  value={newWishRelationship}
                  onChange={(e) => setNewWishRelationship(e.target.value)}
                  placeholder="e.g. Family of the Bride, High School Friends"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] focus:outline-none focus:ring-2 focus:ring-[#3A5A74] text-[#18232c]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#18232c] mb-1">Wishes & Love Message *</label>
                <textarea
                  required
                  rows={4}
                  value={newWishMessage}
                  onChange={(e) => setNewWishMessage(e.target.value)}
                  placeholder="Write the blessing, quote, or tribute here..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] focus:outline-none focus:ring-2 focus:ring-[#3A5A74] text-[#18232c] resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddWishModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] font-semibold text-xs sm:text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWish || !newWishName.trim() || !newWishMessage.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#3A5A74] hover:bg-[#274155] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmittingWish ? 'Posting...' : 'Post Wish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Firebase, Supabase & ImageKit Account Settings Modal */}
      <CloudSettingsModal
        isOpen={isCloudSettingsOpen}
        onClose={() => setIsCloudSettingsOpen(false)}
        initialTab={cloudSettingsInitialTab}
        config={config}
        guests={guests}
        guestbookEntries={guestbookEntries}
        onSaveConfig={onSaveConfig}
        onSaveGuests={onSaveGuests}
        isCloudConnected={isCloudConnected}
      />

      {/* Lightbox for host media manager photo previews */}
      {selectedMediaLightboxPhoto && (
        <PhotoLightboxModal
          isOpen={true}
          onClose={() => setSelectedMediaLightboxPhoto(null)}
          imageUrl={selectedMediaLightboxPhoto.url}
          authorName={selectedMediaLightboxPhoto.authorName}
          relationship={selectedMediaLightboxPhoto.relationship}
          caption={selectedMediaLightboxPhoto.caption}
          createdAt={selectedMediaLightboxPhoto.createdAt}
        />
      )}
    </div>
  );
};
