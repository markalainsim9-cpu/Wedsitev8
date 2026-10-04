import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Flame, 
  Cloud, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  KeyRound, 
  Copy, 
  Check, 
  Loader2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Globe, 
  Code, 
  Info, 
  Database,
  Wifi,
  WifiOff,
  UploadCloud,
  Layers,
  Sparkles,
  HardDrive,
  Gauge,
  BarChart3,
  Clock,
  TrendingUp,
  Zap,
  PieChart,
  ArrowRightLeft,
  Server,
  Users,
  MessageSquare,
  Download,
  Upload,
  Trash2,
  Clipboard,
  Video
} from 'lucide-react';
import { EventConfig, Guest, GuestbookEntry, SupabaseConfig, SupabaseRedundancyMode, CloudAccountSettings } from '../types';
import { 
  firebaseConfig, 
  firebaseAppletConfigRaw,
  testFirestoreConnection, 
  saveEventConfigToCloud, 
  seedInitialGuestsToCloud,
  loadSupabaseConfigFromCloud,
  getServerAuthoritativeStatus,
  getCachedServerAuthoritativeStatus,
  subscribeToServerStatus,
  ServerAuthoritativeStatus
} from '../lib/firebase';
import { 
  calculateFirestoreStorage, 
  formatBytes, 
  getDailyQuotaUsage, 
  subscribeToQuotaUsage, 
  resetDailyQuotaUsage, 
  getTimeUntilQuotaReset, 
  FIRESTORE_SPARK_LIMITS,
  StorageBreakdown,
  DailyQuotaUsage
} from '../lib/quotaTracker';
import { 
  checkImageKitStatus as fetchSafeImageKitStatus, 
  testImageKitCredentials, 
  saveImageKitCredentials, 
  resetImageKitCredentials, 
  clearImageKitCredentials,
  ImageKitStatus,
  maskPrivateKey
} from '../lib/imagekitClient';
import { 
  checkR2Status, 
  testR2Credentials, 
  saveR2Credentials, 
  clearR2Credentials, 
  maskR2SecretKey,
  R2StatusResponse
} from '../utils/r2Client';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  saveSupabaseCredentials,
  testSupabaseConnection, 
  mirrorAllDataToSupabase, 
  generateSupabaseSqlSchema 
} from '../lib/supabase';
import { parseBackupData, applyRestoreData, ParsedBackup } from '../utils/backupRestore';
import {
  SUPABASE_FREE_LIMITS,
  SupabaseStorageBreakdown,
  SupabaseDailyQuotaUsage,
  calculateSupabaseStorage,
  getSupabaseQuotaUsage,
  subscribeToSupabaseQuotaUsage,
  resetSupabaseQuotaCounters,
  getInactivityPauseCountdown,
  extractSupabaseProjectRef,
  recordSupabasePing
} from '../lib/supabaseQuotaTracker';
import { INITIAL_GUESTS, INITIAL_CLOUD_SETTINGS, EVENT_PRESETS } from '../data/presets';

interface CloudSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'firebase' | 'supabase' | 'imagekit' | 'r2' | 'backup';
  config: EventConfig;
  guests: Guest[];
  guestbookEntries?: GuestbookEntry[];
  onSaveConfig: (newConfig: EventConfig) => Promise<void> | void;
  onSaveGuests?: (newGuests: Guest[]) => Promise<void> | void;
  isCloudConnected?: boolean;
}

export function CloudSettingsModal({
  isOpen,
  onClose,
  initialTab = 'firebase',
  config,
  guests,
  guestbookEntries = [],
  onSaveConfig,
  onSaveGuests,
  isCloudConnected = true,
}: CloudSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'firebase' | 'supabase' | 'imagekit' | 'r2' | 'backup'>(initialTab);

  // Sync tab if initialTab changes on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Fetch Supabase config from cloud on open
      loadSupabaseConfigFromCloud().then((config) => {
        if (config) {
          setSupabaseConfig((prev) => ({ ...prev, ...config }));
        }
      });
    }
  }, [isOpen, initialTab]);

  // --- FIREBASE STATE ---
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  
  // Backup/Restore UI State
  const [showBackupPreview, setShowBackupPreview] = useState(false);
  const [backupPreviewTab, setBackupPreviewTab] = useState<'presets' | 'cloud' | 'json'>('presets');
  const [maskExportSecrets, setMaskExportSecrets] = useState(false);
  const [copiedPresetsFile, setCopiedPresetsFile] = useState(false);
  const [downloadedPresetsFile, setDownloadedPresetsFile] = useState(false);
  const [downloadedJsonBackup, setDownloadedJsonBackup] = useState(false);
  const [copiedPresetCode, setCopiedPresetCode] = useState(false);
  const [copiedCloudSettingsCode, setCopiedCloudSettingsCode] = useState(false);
  const [copiedFirebaseSnippet, setCopiedFirebaseSnippet] = useState(false);
  const [copiedSupabaseSnippet, setCopiedSupabaseSnippet] = useState(false);
  const [copiedImageKitSnippet, setCopiedImageKitSnippet] = useState(false);
  const [copiedR2Snippet, setCopiedR2Snippet] = useState(false);
  const restoreFileInputRef = React.useRef<HTMLInputElement>(null);
  const [restoreModalData, setRestoreModalData] = useState<{
    isOpen: boolean;
    isRestoring: boolean;
    parsed: ParsedBackup | null;
    rawFileName?: string;
    resultNotice?: { success: boolean; message: string; details: string[] } | null;
  }>({
    isOpen: false,
    isRestoring: false,
    parsed: null,
    rawFileName: undefined,
    resultNotice: null
  });
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isTestingLiveDb, setIsTestingLiveDb] = useState(false);
  const [liveDbStatus, setLiveDbStatus] = useState<any>(null);

  // --- SERVER-AUTHORITATIVE STATE ---
  const [serverAuthStatus, setServerAuthStatus] = useState<ServerAuthoritativeStatus | null>(() => 
    getCachedServerAuthoritativeStatus()
  );
  const [isTestingServerAuth, setIsTestingServerAuth] = useState(false);

  const handleTestServerAuth = async () => {
    setIsTestingServerAuth(true);
    try {
      const status = await getServerAuthoritativeStatus(true);
      setServerAuthStatus(status);
    } finally {
      setIsTestingServerAuth(false);
    }
  };

  useEffect(() => {
    // 1. Subscribe to live server updates
    const unsubscribe = subscribeToServerStatus((status) => {
      if (status) {
        setServerAuthStatus(status);
      }
    });

    // 2. Fetch authoritative status on open if not already cached
    if (isOpen) {
      if (!serverAuthStatus || !serverAuthStatus.authoritative) {
        handleTestServerAuth();
      }
    }

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Storage & Daily Quota Tracking State (Spark Free Tier)
  const [storageStats, setStorageStats] = useState<StorageBreakdown>(() => 
    calculateFirestoreStorage(config, guests)
  );
  const [dailyUsage, setDailyUsage] = useState<DailyQuotaUsage>(() => getDailyQuotaUsage());
  const [timeUntilReset, setTimeUntilReset] = useState(() => getTimeUntilQuotaReset());

  // Automatically recalculate storage stats whenever config or guests change
  useEffect(() => {
    setStorageStats(calculateFirestoreStorage(config, guests));
  }, [config, guests]);

  // Subscribe to live quota events & update reset countdown
  useEffect(() => {
    const unsubscribe = subscribeToQuotaUsage((usage) => {
      setDailyUsage({ ...usage });
    });

    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilQuotaReset());
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleResetQuotaCounters = () => {
    if (window.confirm('Reset local daily operation counters for today? Note: Google Cloud servers maintain their own cumulative daily counts until midnight UTC/PST.')) {
      const fresh = resetDailyQuotaUsage();
      setDailyUsage({ ...fresh });
    }
  };

  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const [forceSyncMessage, setForceSyncMessage] = useState<string | null>(null);

  const [isSeedingGuests, setIsSeedingGuests] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isFirebasePrivacyMasked, setIsFirebasePrivacyMasked] = useState<boolean>(true);

  const maskId = (val: string, startLen = 6, endLen = 4) => {
    if (!val) return '';
    if (val.length <= startLen + endLen) return '••••••••••••';
    return `${val.slice(0, startLen)}••••••••••••${val.slice(-endLen)}`;
  };

  const maskDomain = (val: string, prefixLen = 6) => {
    if (!val) return '';
    const parts = val.split('.');
    if (parts.length > 1) {
      const main = parts[0];
      const rest = parts.slice(1).join('.');
      const maskedPrefix = main.length > prefixLen ? `${main.slice(0, prefixLen)}••••••••` : '••••••••';
      return `${maskedPrefix}.${rest}`;
    }
    return maskId(val, prefixLen, 4);
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    setFirebaseTestResult(null);
    try {
      const result = await testFirestoreConnection();
      setFirebaseTestResult(result);
    } catch (err: any) {
      setFirebaseTestResult({
        success: false,
        error: err?.message || 'Failed to ping Firestore'
      });
    } finally {
      setIsTestingFirebase(false);
    }
  };

  // Build authoritative Cloud & Account Settings covering:
  // 1.) Firebase Provisioned Project & Account Details
  // 2.) Supabase Credentials & Redundancy Policy
  // 3.) ImageKit Credentials
  // 4.) Cloudflare R2 Credentials & Video Storage Settings
  const buildCloudAccountSettings = (maskSecrets: boolean = false): CloudAccountSettings => {
    const ikPriv = (ikPrivateKey || imageKitStatus?.rawPrivateKey || '').trim();
    const r2Secret = (r2SecretAccessKey || r2Status?.rawSecretAccessKey || '').trim();
    const supaKey = (supabaseConfig.supabaseAnonKey || '').trim();
    const fbKey = firebaseConfig.apiKey || '';

    const effectiveMode = supabaseConfig.mode || 'failover';
    const effectiveAutoFailover = supabaseConfig.autoFailover ?? true;
    const supaProjectRef = extractSupabaseProjectRef(supabaseConfig.supabaseUrl) || 'unconfigured';

    let supaPolicyDesc = '';
    if (effectiveMode === 'mirror') {
      supaPolicyDesc = 'Dual-Write Realtime Mirror Active: Every guest RSVP, seat allocation, event config update, and keepsake wish is dual-written atomically to Cloud Firestore and Supabase PostgreSQL. Provides real-time synchronization and immediate zero-loss backup.';
    } else if (effectiveMode === 'failover') {
      supaPolicyDesc = 'Warm Standby High-Availability Failover Active: Cloud Firestore is the primary authoritative source. If Firestore encounters quota limits (Spark 50k reads / 20k writes), connection timeouts (>10s), or 503 service downtime, clients automatically fail over to Supabase PostgreSQL.';
    } else {
      supaPolicyDesc = 'Redundancy Disabled: Standalone Cloud Firestore primary operations without secondary cloud replication.';
    }

    return {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      // 1.) Firebase Provisioned Project & Account Details
      firebase: {
        projectId: firebaseConfig.projectId,
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
        appId: firebaseConfig.appId,
        apiKey: maskSecrets ? maskId(fbKey, 8, 4) : fbKey,
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
        supabaseUrl: supabaseConfig.supabaseUrl || '',
        supabaseAnonKey: maskSecrets && supaKey ? maskId(supaKey, 8, 4) : supaKey,
        mode: effectiveMode,
        autoFailover: effectiveAutoFailover,
        lastSyncTime: supabaseConfig.lastSyncTime,
        redundancyPolicy: {
          mode: effectiveMode,
          autoFailover: effectiveAutoFailover,
          projectRef: supaProjectRef,
          policyDescription: supaPolicyDesc,
          failoverTriggers: [
            'Firestore Spark free-tier daily quotas reached (50,000 document reads / 20,000 writes per day)',
            'Network partition or unhandled client disconnection exceeding 10 seconds',
            'Backend server HTTP 503 / 504 gateway degradation or cold restart',
            'Manual operator toggle in Cloud Settings Modal'
          ],
          synchronizedTables: ['wedding_config', 'guests', 'guestbook_entries'],
          syncStrategy: 'Last-Write-Wins (LWW) with ISO-8601 timestamps and atomic batch upserts'
        }
      },
      // 3.) ImageKit Credentials
      imagekit: {
        publicKey: ikPublicKey.trim() || imageKitStatus?.publicKey || 'public_vie7nQLXXCidvyqXsEkC9qnkwWk=',
        urlEndpoint: ikUrlEndpoint.trim() || imageKitStatus?.urlEndpoint || 'https://ik.imagekit.io/9abzbu5ke/',
        privateKey: maskSecrets ? (ikPriv ? maskPrivateKey(ikPriv) : '') : ikPriv,
        configured: Boolean(ikPublicKey.trim() || imageKitStatus?.configured),
        uploadFolder: '/wedding-invitations',
        cdnOptimization: 'Global Tier-1 CDN with automatic WebP/AVIF transformation, progressive JPEG loading, lossless compression, and signed client upload authentication'
      },
      // 4.) Cloudflare R2 Credentials & Video Storage Settings
      r2: {
        accountId: r2AccountId.trim() || r2Status?.accountId || '9426f4fce849e75ba9560f855a882cb0',
        accessKeyId: r2AccessKeyId.trim() || r2Status?.accessKeyId || '65e6cb7bc4db4e0b5f13426e680a6d09',
        secretAccessKey: maskSecrets ? (r2Secret ? maskR2SecretKey(r2Secret) : '') : r2Secret,
        bucketName: r2BucketName.trim() || r2Status?.bucketName || 'wedding-videos',
        publicUrl: r2PublicUrl.trim() || r2Status?.publicUrl || 'https://pub-9426f4fce849e75ba9560f855a882cb0.r2.dev',
        configured: Boolean(r2AccountId.trim() || r2Status?.configured),
        uploadFolder: 'guestbook-videos',
        deliveryType: 'Cloudflare Global Edge Anycast with zero egress fees, S3 compatibility, presigned ticket uploads, and direct video streaming'
      }
    };
  };

  // Generate the complete /src/data/presets.ts file content (with Cloud & Account Settings)
  const generateFullPresetsCode = (maskSecrets = maskExportSecrets): string => {
    const weddingPreset = { ...config };
    const galaPreset = EVENT_PRESETS?.gala || {};
    const guestsList = guests && guests.length > 0 ? guests : [];
    const gbList = guestbookEntries && guestbookEntries.length > 0 ? guestbookEntries : [];
    const cloudSettings = buildCloudAccountSettings(maskSecrets);

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

  // Generate standalone Cloud & Account Settings code block
  const generateCloudSettingsCode = (maskSecrets = maskExportSecrets): string => {
    const cloudSettings = buildCloudAccountSettings(maskSecrets);
    return `import { CloudAccountSettings } from '../types';

// Codebase Presets & Backup Suite: Authoritative Cloud & Account Settings
// 1.) Firebase Provisioned Project & Account Details
// 2.) Supabase Credentials & Redundancy Policy
// 3.) ImageKit Credentials
// 4.) Cloudflare R2 Credentials & Video Storage Settings
export const INITIAL_CLOUD_SETTINGS: CloudAccountSettings = ${JSON.stringify(cloudSettings, null, 2)};
`;
  };

  // Generate JSON backup snapshot string (including Cloud & Account Settings)
  const generateJsonBackupString = (maskSecrets = maskExportSecrets): string => {
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      eventConfig: config,
      guests: guests || [],
      guestbookEntries: guestbookEntries || [],
      cloudSettings: buildCloudAccountSettings(maskSecrets)
    };
    return JSON.stringify(backupData, null, 2);
  };

  const handleCopyFullPresetsFile = () => {
    const code = generateFullPresetsCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedPresetsFile(true);
      setTimeout(() => setCopiedPresetsFile(false), 3500);
    }
  };

  const handleCopyCloudSettingsCode = () => {
    const code = generateCloudSettingsCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCloudSettingsCode(true);
      setTimeout(() => setCopiedCloudSettingsCode(false), 3500);
    }
  };

  const handleCopyFirebaseSnippet = () => {
    const cloud = buildCloudAccountSettings(maskExportSecrets);
    const code = `// 1.) Firebase Provisioned Project & Account Details\nexport const FIREBASE_PROVISIONED_CONFIG = ${JSON.stringify(cloud.firebase, null, 2)};`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedFirebaseSnippet(true);
      setTimeout(() => setCopiedFirebaseSnippet(false), 2500);
    }
  };

  const handleCopySupabaseSnippet = () => {
    const cloud = buildCloudAccountSettings(maskExportSecrets);
    const code = `// 2.) Supabase Credentials & Redundancy Policy\nexport const SUPABASE_REDUNDANCY_POLICY = ${JSON.stringify(cloud.supabase, null, 2)};`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedSupabaseSnippet(true);
      setTimeout(() => setCopiedSupabaseSnippet(false), 2500);
    }
  };

  const handleCopyImageKitSnippet = () => {
    const cloud = buildCloudAccountSettings(maskExportSecrets);
    const code = `// 3.) ImageKit Credentials\nexport const IMAGEKIT_CREDENTIALS = ${JSON.stringify(cloud.imagekit, null, 2)};`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedImageKitSnippet(true);
      setTimeout(() => setCopiedImageKitSnippet(false), 2500);
    }
  };

  const handleCopyR2Snippet = () => {
    const cloud = buildCloudAccountSettings(maskExportSecrets);
    const code = `// 4.) Cloudflare R2 Credentials & Video Storage Settings\nexport const R2_CREDENTIALS = ${JSON.stringify(cloud.r2, null, 2)};`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedR2Snippet(true);
      setTimeout(() => setCopiedR2Snippet(false), 2500);
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
    const jsonStr = generateJsonBackupString();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (config.title || 'wedding').toLowerCase().replace(/[^a-z0-9]/g, '_');
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
    const code = `  wedding: ${JSON.stringify(config, null, 2)},`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedPresetCode(true);
      setTimeout(() => setCopiedPresetCode(false), 3500);
    }
  };

  const handleRestoreFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseBackupData(text);
        if (!parsed.isValid) {
          setRestoreModalData({
            isOpen: true,
            isRestoring: false,
            parsed,
            rawFileName: file.name,
            resultNotice: {
              success: false,
              message: 'Invalid or Unrecognized Backup File',
              details: parsed.errors.length > 0 ? parsed.errors : ['Could not locate valid wedding configuration, guests, or Supabase credentials in this file.']
            }
          });
          return;
        }

        // Open in-modal review & confirmation dialog
        setRestoreModalData({
          isOpen: true,
          isRestoring: false,
          parsed,
          rawFileName: file.name,
          resultNotice: null
        });
      } catch (err: any) {
        setRestoreModalData({
          isOpen: true,
          isRestoring: false,
          parsed: null,
          rawFileName: file.name,
          resultNotice: {
            success: false,
            message: 'Failed to read JSON backup file',
            details: [err?.message || 'Could not parse JSON content']
          }
        });
      }
    };
    reader.readAsText(file);
  };

  const handlePasteRestoreSubmit = () => {
    setPasteError(null);
    if (!pastedJsonText.trim()) {
      setPasteError('Please paste valid JSON backup or TypeScript presets content.');
      return;
    }
    const parsed = parseBackupData(pastedJsonText);
    if (!parsed.isValid) {
      setPasteError(parsed.errors.join(' ') || 'No wedding data, guest list, or cloud credentials found in pasted content.');
      return;
    }
    const detectedName = parsed.formatType === 'presets_file' 
      ? 'presets_backup.ts' 
      : parsed.formatType === 'cloud_settings_block' 
        ? 'cloud_settings_export.ts' 
        : parsed.formatType === 'event_config_block'
          ? 'wedding_config_snippet.ts'
          : 'pasted_backup_snapshot.json';

    setShowPasteModal(false);
    setPastedJsonText('');
    setRestoreModalData({
      isOpen: true,
      isRestoring: false,
      parsed,
      rawFileName: detectedName,
      resultNotice: null
    });
  };

  const handleExecuteRestore = async () => {
    if (!restoreModalData.parsed) return;
    setRestoreModalData(prev => ({ ...prev, isRestoring: true }));
    try {
      const res = await applyRestoreData(restoreModalData.parsed, {
        onSaveConfig: async (cfg) => {
          await onSaveConfig(cfg);
        },
        onSaveGuests: async (gst) => {
          if (onSaveGuests) await onSaveGuests(gst);
        },
        onSaveGuestbook: async (entries) => {
          if (guestbookEntries && entries) {
            // Updated in Firestore by applyRestoreData callbacks if wired
          }
        },
        onUpdateSupabase: (newSupa) => {
          setSupabaseConfig(newSupa);
        },
        onUpdateImageKit: (newIk) => {
          setIkPublicKey(newIk.publicKey || '');
          setIkPrivateKey(newIk.privateKey || '');
          setIkUrlEndpoint(newIk.urlEndpoint || '');
          checkImageKitStatus();
        },
        onUpdateR2: (newR2) => {
          setR2AccountId(newR2.accountId || '');
          setR2AccessKeyId(newR2.accessKeyId || '');
          setR2SecretAccessKey(newR2.secretAccessKey || '');
          setR2BucketName(newR2.bucketName || '');
          setR2PublicUrl(newR2.publicUrl || '');
          checkCloudflareR2Status();
        }
      });

      // Synchronize modal's local supabaseConfig state immediately with authoritative storage
      const authoritativeSupa = getStoredSupabaseConfig();
      setSupabaseConfig(authoritativeSupa);

      setRestoreModalData(prev => ({
        ...prev,
        isRestoring: false,
        resultNotice: {
          success: true,
          message: res.message,
          details: res.details
        }
      }));
    } catch (err: any) {
      setRestoreModalData(prev => ({
        ...prev,
        isRestoring: false,
        resultNotice: {
          success: false,
          message: 'Restoration could not be completed',
          details: [err?.message || 'An unexpected error occurred during database restoration.']
        }
      }));
    }
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

  const handleForceCloudSync = async () => {
    setIsForceSyncing(true);
    setForceSyncMessage(null);
    try {
      // 1. Sync config
      await saveEventConfigToCloud(config);
      // 2. Sync all current guests
      await seedInitialGuestsToCloud(guests);
      setForceSyncMessage('✓ Successfully synchronized event config & guest records to Firestore!');
    } catch (err: any) {
      setForceSyncMessage(`Error syncing: ${err?.message || 'Network error'}`);
    } finally {
      setIsForceSyncing(false);
      setTimeout(() => setForceSyncMessage(null), 5000);
    }
  };

  const [confirmingSeed, setConfirmingSeed] = useState(false);

  const handleReSeedGuests = async () => {
    setIsSeedingGuests(true);
    setSeedMessage(null);
    setConfirmingSeed(false);
    try {
      await seedInitialGuestsToCloud(INITIAL_GUESTS);
      if (onSaveGuests) {
        await onSaveGuests(INITIAL_GUESTS);
      }
      setSeedMessage('✓ Successfully seeded 4 sample guests into Cloud Firestore & Host list!');
    } catch (err: any) {
      setSeedMessage(`Failed to seed: ${err?.message || 'Error'}`);
    } finally {
      setIsSeedingGuests(false);
      setTimeout(() => setSeedMessage(null), 6000);
    }
  };

  // --- SUPABASE FAILOVER & REDUNDANCY STATE ---
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getStoredSupabaseConfig());
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
    tablesDetected?: string[];
  } | null>(null);
  const [isMirroringToSupabase, setIsMirroringToSupabase] = useState(false);
  const [mirrorResult, setMirrorResult] = useState<{
    success: boolean;
    syncedCount?: number;
    error?: string;
  } | null>(null);
  const [isSupabasePrivacyMasked, setIsSupabasePrivacyMasked] = useState<boolean>(true);
  const [isSqlSchemaExpanded, setIsSqlSchemaExpanded] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [supabaseSaveNotice, setSupabaseSaveNotice] = useState<string | null>(null);

  const handleSaveSupabaseConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = await saveSupabaseCredentials({
      supabaseUrl: supabaseConfig.supabaseUrl,
      supabaseAnonKey: supabaseConfig.supabaseAnonKey
    });
    setSupabaseSaveNotice(result.message);
    setTimeout(() => setSupabaseSaveNotice(null), 4000);
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const result = await testSupabaseConnection(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
      setSupabaseTestResult(result);
    } catch (err: any) {
      setSupabaseTestResult({
        success: false,
        latencyMs: 0,
        error: err?.message || 'Failed to ping Supabase.'
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleMirrorToSupabase = async () => {
    if (!supabaseConfig.supabaseUrl || !supabaseConfig.supabaseAnonKey) {
      setMirrorResult({
        success: false,
        error: 'Please enter and save your Supabase URL and Anon Key first.'
      });
      return;
    }

    setIsMirroringToSupabase(true);
    setMirrorResult(null);
    try {
      const res = await mirrorAllDataToSupabase(config, guests, guestbookEntries);
      setMirrorResult(res);
      if (res.success) {
        setSupabaseConfig(getStoredSupabaseConfig());
      }
    } catch (err: any) {
      setMirrorResult({
        success: false,
        error: err?.message || 'Error occurred while mirroring data to Supabase.'
      });
    } finally {
      setIsMirroringToSupabase(false);
    }
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // --- SUPABASE QUOTA & STORAGE COUNTER STATE ---
  const [supabaseUsage, setSupabaseUsage] = useState<SupabaseDailyQuotaUsage>(() => getSupabaseQuotaUsage());
  const [inactivityCountdown, setInactivityCountdown] = useState(() => 
    getInactivityPauseCountdown(supabaseUsage.lastActiveTime)
  );
  const [isSendingPing, setIsSendingPing] = useState(false);
  const [pingNotice, setPingNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToSupabaseQuotaUsage((usage) => {
      setSupabaseUsage(usage);
      setInactivityCountdown(getInactivityPauseCountdown(usage.lastActiveTime));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setInactivityCountdown(getInactivityPauseCountdown(supabaseUsage.lastActiveTime));
    }, 60000);
    return () => clearInterval(timer);
  }, [supabaseUsage.lastActiveTime]);

  const supabaseStorageStats: SupabaseStorageBreakdown = calculateSupabaseStorage(config, guests, guestbookEntries);
  const supabaseProjectRef = extractSupabaseProjectRef(supabaseConfig.supabaseUrl);

  const handleResetSupabaseCounters = () => {
    const reset = resetSupabaseQuotaCounters();
    setSupabaseUsage(reset);
    setInactivityCountdown(getInactivityPauseCountdown(reset.lastActiveTime));
  };

  const handleKeepAlivePing = async () => {
    setIsSendingPing(true);
    setPingNotice(null);
    try {
      await testSupabaseConnection(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
      recordSupabasePing();
      const current = getSupabaseQuotaUsage();
      setSupabaseUsage(current);
      setInactivityCountdown(getInactivityPauseCountdown(current.lastActiveTime));
      setPingNotice('✓ Keep-alive ping successful! 7-day inactivity pause clock refreshed.');
      setTimeout(() => setPingNotice(null), 4000);
    } catch (err: any) {
      setPingNotice('Ping notice: ' + (err?.message || 'Attempt finished.'));
      setTimeout(() => setPingNotice(null), 4000);
    } finally {
      setIsSendingPing(false);
    }
  };

  // --- IMAGEKIT STATE ---
  const [imageKitStatus, setImageKitStatus] = useState<ImageKitStatus | null>(null);
  const [isCheckingImageKit, setIsCheckingImageKit] = useState(false);

  const [ikPublicKey, setIkPublicKey] = useState('');
  const [ikPrivateKey, setIkPrivateKey] = useState('');
  const [ikUrlEndpoint, setIkUrlEndpoint] = useState('');
  const [ikShowPrivateKey, setIkShowPrivateKey] = useState(false);
  const [ikIsSaving, setIkIsSaving] = useState(false);
  const [ikIsTesting, setIkIsTesting] = useState(false);
  const [ikIsResetting, setIkIsResetting] = useState(false);
  const [ikSaveResult, setIkSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [ikTestResult, setIkTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const checkImageKitStatus = async () => {
    try {
      setIsCheckingImageKit(true);
      const data = await fetchSafeImageKitStatus();
      setImageKitStatus(data);
      setIkPublicKey(data.publicKey || '');
      setIkUrlEndpoint(data.urlEndpoint || '');
      setIkPrivateKey(data.rawPrivateKey || '');
    } catch (err) {
      console.warn('ImageKit status check fallback:', err);
    } finally {
      setIsCheckingImageKit(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkImageKitStatus();
    }
  }, [isOpen]);

  const handleTestImageKit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTestingImageKitLoading(true);
    setIkTestResult(null);
    try {
      const privateKeyToUse = ikPrivateKey.trim() || imageKitStatus?.rawPrivateKey || '';
      const result = await testImageKitCredentials({
        publicKey: ikPublicKey.trim(),
        privateKey: privateKeyToUse,
        urlEndpoint: ikUrlEndpoint.trim()
      });
      setIkTestResult(result);
    } catch (err: any) {
      setIkTestResult({
        success: false,
        message: err.message || 'Network error while contacting ImageKit.'
      });
    } finally {
      setIsTestingImageKitLoading(false);
    }
  };

  const setIsTestingImageKitLoading = (v: boolean) => setIkIsTesting(v);

  const handleSaveImageKit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIkIsSaving(true);
    setIkSaveResult(null);

    const pKey = ikPublicKey.trim();
    const privKey = ikPrivateKey.trim();
    const urlEp = ikUrlEndpoint.trim();

    // 1. If all 3 fields are empty: user explicitly wants to delete all ImageKit credentials!
    if (!pKey && !privKey && !urlEp) {
      try {
        const result = await clearImageKitCredentials();
        setIkPublicKey('');
        setIkPrivateKey('');
        setIkUrlEndpoint('');
        await checkImageKitStatus();
        setIkSaveResult({
          success: true,
          message: '✓ ImageKit credentials deleted. The fields have been cleared from Cloud Firestore, Server, and Browser Storage.'
        });
      } catch (err: any) {
        setIkSaveResult({
          success: false,
          message: err?.message || 'Failed to clear ImageKit credentials.'
        });
      } finally {
        setIkIsSaving(false);
      }
      return;
    }

    // 2. User is updating/saving credentials
    try {
      const privateKeyToSave = privKey || imageKitStatus?.rawPrivateKey || '';
      if (!privateKeyToSave) {
        setIkSaveResult({
          success: false,
          message: 'Please provide a valid ImageKit Private Key (starts with private_), or clear all 3 fields to delete credentials.'
        });
        setIkIsSaving(false);
        return;
      }
      const result = await saveImageKitCredentials({
        publicKey: pKey,
        privateKey: privateKeyToSave,
        urlEndpoint: urlEp
      });
      setIkSaveResult(result);
      if (result.success) {
        setIkPrivateKey(privateKeyToSave);
        await checkImageKitStatus();
      }
    } catch (err: any) {
      setIkSaveResult({
        success: false,
        message: err.message || 'Network error while saving ImageKit credentials.'
      });
    } finally {
      setIkIsSaving(false);
    }
  };

  const handleResetImageKit = async () => {
    if (!window.confirm('Delete ImageKit credentials? This will permanently remove IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT from Cloud Firestore, server, and browser storage.')) return;
    setIkIsResetting(true);
    setIkSaveResult(null);
    try {
      const result = await clearImageKitCredentials();
      setIkSaveResult(result);
      setIkPublicKey('');
      setIkPrivateKey('');
      setIkUrlEndpoint('');
      await checkImageKitStatus();
    } catch (err: any) {
      setIkSaveResult({
        success: false,
        message: err.message || 'Failed to delete ImageKit credentials.'
      });
    } finally {
      setIkIsResetting(false);
    }
  };

  // --- CLOUDFLARE R2 STATE & HANDLERS ---
  const [r2Status, setR2Status] = useState<R2StatusResponse | null>(null);
  const [isCheckingR2, setIsCheckingR2] = useState(false);

  const [r2AccountId, setR2AccountId] = useState('');
  const [r2AccessKeyId, setR2AccessKeyId] = useState('');
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState('');
  const [r2BucketName, setR2BucketName] = useState('');
  const [r2PublicUrl, setR2PublicUrl] = useState('');
  const [r2ShowSecretKey, setR2ShowSecretKey] = useState(false);
  const [r2IsSaving, setR2IsSaving] = useState(false);
  const [r2IsTesting, setR2IsTesting] = useState(false);
  const [r2IsResetting, setR2IsResetting] = useState(false);
  const [r2SaveResult, setR2SaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [r2TestResult, setR2TestResult] = useState<{ success: boolean; message: string } | null>(null);

  const checkCloudflareR2Status = async () => {
    try {
      setIsCheckingR2(true);
      const data = await checkR2Status();
      setR2Status(data);
      setR2AccountId(data.accountId || '');
      setR2AccessKeyId(data.accessKeyId || '');
      setR2SecretAccessKey(data.rawSecretAccessKey || '');
      setR2BucketName(data.bucketName || '');
      setR2PublicUrl(data.publicUrl || '');
    } catch (err) {
      console.warn('R2 status check fallback:', err);
    } finally {
      setIsCheckingR2(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkCloudflareR2Status();
    }
  }, [isOpen]);

  const handleTestR2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setR2IsTesting(true);
    setR2TestResult(null);
    try {
      const secretKeyToUse = r2SecretAccessKey.trim() || r2Status?.rawSecretAccessKey || '';
      const result = await testR2Credentials({
        accountId: r2AccountId.trim(),
        accessKeyId: r2AccessKeyId.trim(),
        secretAccessKey: secretKeyToUse,
        bucketName: r2BucketName.trim(),
        publicUrl: r2PublicUrl.trim()
      });
      setR2TestResult(result);
    } catch (err: any) {
      setR2TestResult({
        success: false,
        message: err.message || 'Error occurred while testing Cloudflare R2 connection.'
      });
    } finally {
      setR2IsTesting(false);
    }
  };

  const handleSaveR2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setR2IsSaving(true);
    setR2SaveResult(null);
    try {
      const secretToSave = r2SecretAccessKey.trim() || r2Status?.rawSecretAccessKey || '';
      const result = await saveR2Credentials({
        accountId: r2AccountId.trim(),
        accessKeyId: r2AccessKeyId.trim(),
        secretAccessKey: secretToSave,
        bucketName: r2BucketName.trim(),
        publicUrl: r2PublicUrl.trim()
      });
      setR2SaveResult(result);
      if (result.success) {
        await checkCloudflareR2Status();
      }
    } catch (err: any) {
      setR2SaveResult({
        success: false,
        message: err.message || 'Network error while saving Cloudflare R2 credentials.'
      });
    } finally {
      setR2IsSaving(false);
    }
  };

  const handleResetR2 = async () => {
    if (!window.confirm('Delete Cloudflare R2 credentials? This will permanently remove R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL from Cloud Firestore, server, and browser storage.')) return;
    setR2IsResetting(true);
    setR2SaveResult(null);
    try {
      const result = await clearR2Credentials();
      setR2SaveResult(result);
      setR2AccountId('');
      setR2AccessKeyId('');
      setR2SecretAccessKey('');
      setR2BucketName('');
      setR2PublicUrl('');
      await checkCloudflareR2Status();
    } catch (err: any) {
      setR2SaveResult({
        success: false,
        message: err.message || 'Failed to delete Cloudflare R2 credentials.'
      });
    } finally {
      setR2IsResetting(false);
    }
  };

  // Render comprehensive Codebase Presets & Backup Suite including:
  // 1.) Firebase Provisioned Project & Account Details
  // 2.) Supabase Credentials & Redundancy Policy
  // 3.) ImageKit Credentials
  // 4.) Cloudflare R2 Video Storage Credentials
  const renderPresetsAndBackupSuite = (isDedicatedTab: boolean = false) => {
    const cloud = buildCloudAccountSettings(maskExportSecrets);
    const supaKey = (supabaseConfig.supabaseAnonKey || '').trim();
    const fbKey = firebaseConfig.apiKey || '';
    const ikPriv = (ikPrivateKey || imageKitStatus?.rawPrivateKey || '').trim();
    const r2Secret = (r2SecretAccessKey || r2Status?.rawSecretAccessKey || '').trim();

    return (
      <div className={`space-y-4 ${isDedicatedTab ? '' : 'pt-3 border-t border-emerald-200/80'}`}>
        {/* Header and Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-serif flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Codebase Presets & Backup Suite</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Cloud-Integrated v3.0 (4 Clouds)
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5 max-w-2xl">
              Unified recovery package and code generator. Incorporates all current wedding configurations, guest list & seating assignments, keepsake guestbook wishes, alongside authoritative cloud account infrastructure across Firebase, Supabase, ImageKit, and Cloudflare R2.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowBackupPreview(!showBackupPreview)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition"
            >
              <Code className="w-3.5 h-3.5 text-emerald-700" />
              <span>{showBackupPreview ? 'Hide Code Preview' : 'Preview Generated Code'}</span>
            </button>
          </div>
        </div>

        {/* 4 CLOUD & ACCOUNT PILLARS BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Pillar 1: Firebase Provisioned Project & Account Details */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-amber-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 font-serif flex items-center gap-1.5">
                      1.) Firebase Provisioned Account
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Google Cloud Firestore • Live SSE Real-Time Sync
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  Authoritative Primary
                </span>
              </div>

              <p className="text-xs text-[#506173] leading-relaxed">
                Authoritative Google Cloud Firestore project with live Server-Sent Events (SSE) streaming, real-time client listener sync, and instant persistence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Project ID</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(firebaseConfig.projectId, 'fb_proj')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                      title="Copy Project ID"
                    >
                      {copiedField === 'fb_proj' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-900 font-semibold truncate text-xs" title={firebaseConfig.projectId}>
                    {firebaseConfig.projectId}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Database ID</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(firebaseConfig.firestoreDatabaseId || '', 'fb_db')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                      title="Copy Firestore Database ID"
                    >
                      {copiedField === 'fb_db' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-900 font-semibold truncate text-xs" title={firebaseConfig.firestoreDatabaseId || '(default)'}>
                    {firebaseConfig.firestoreDatabaseId || '(default)'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">App ID</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(firebaseConfig.appId, 'fb_app')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                      title="Copy App ID"
                    >
                      {copiedField === 'fb_app' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-900 font-mono truncate text-xs" title={firebaseConfig.appId}>
                    {maskId(firebaseConfig.appId, 8, 4)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Plan & Quota</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Healthy" />
                  </div>
                  <span className="text-emerald-700 font-sans font-semibold text-xs truncate" title="Spark Tier: 50k reads / 20k writes daily">
                    Spark Tier (50k/20k daily)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyFirebaseSnippet}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1.5 flex-1 justify-center shadow-2xs"
              >
                {copiedFirebaseSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{copiedFirebaseSnippet ? 'Copied Details' : 'Copy Firebase Details'}</span>
              </button>
              <a
                href={cloud.firebase.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-800 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1.5 shrink-0"
                title="Open Firebase Console"
              >
                <span>Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Pillar 2: Supabase Credentials & Redundancy Policy */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 font-serif flex items-center gap-1.5">
                      2.) Supabase Redundancy Policy
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      PostgreSQL Replica • Automatic Failover & Mirror
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold shrink-0 ${
                  supabaseConfig.mode === 'mirror'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : supabaseConfig.mode === 'failover'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {supabaseConfig.mode === 'mirror' ? 'Mirror Dual-Write' : supabaseConfig.mode === 'failover' ? 'Failover Standby' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-[#506173] leading-relaxed">
                PostgreSQL redundancy for failover and continuous dual-writes across wedding configuration, guest RSVP lists, and guestbook wishes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Project URL</span>
                    {supabaseConfig.supabaseUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(supabaseConfig.supabaseUrl, 'sb_url')}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                        title="Copy Supabase URL"
                      >
                        {copiedField === 'sb_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <span className="text-slate-900 font-semibold truncate text-xs" title={supabaseConfig.supabaseUrl || 'Scaffolding Ready'}>
                    {supabaseConfig.supabaseUrl ? maskDomain(supabaseConfig.supabaseUrl, 10) : 'Scaffolding Ready'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Anon Key</span>
                    {supaKey && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(supaKey, 'sb_key')}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                        title="Copy Anon Key"
                      >
                        {copiedField === 'sb_key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <span className="text-slate-900 truncate text-xs font-sans" title={supaKey ? 'Configured' : 'Local default'}>
                    {supaKey ? (maskExportSecrets ? '••••••••••••' : maskId(supaKey, 6, 4)) : 'Local default'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Auto-Failover</span>
                    <span className={`w-2 h-2 rounded-full ${supabaseConfig.autoFailover ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  </div>
                  <span className={`font-sans font-semibold text-xs ${supabaseConfig.autoFailover ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {supabaseConfig.autoFailover ? 'Active (Auto-switches)' : 'Manual Switch'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Sync Policy</span>
                  </div>
                  <span className="text-slate-800 font-sans font-semibold text-xs truncate" title="Last-Write-Wins (LWW) with ISO-8601 atomic batching">
                    LWW with ISO timestamps
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopySupabaseSnippet}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition flex items-center gap-1.5 flex-1 justify-center shadow-2xs"
              >
                {copiedSupabaseSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{copiedSupabaseSnippet ? 'Copied Policy' : 'Copy Supabase Policy'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('supabase')}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition shrink-0"
              >
                Manage Tab
              </button>
            </div>
          </div>

          {/* Pillar 3: ImageKit Credentials */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-sky-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-sky-950 font-serif flex items-center gap-1.5">
                      3.) ImageKit Credentials
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Global Tier-1 Media CDN • Real-Time Transforms
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
                  Global CDN
                </span>
              </div>

              <p className="text-xs text-[#506173] leading-relaxed">
                Tier-1 CDN image delivery with auto-WebP/AVIF transforms, progressive loading, and client signature auth via <code>/api/imagekit/auth</code>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Public Key</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(ikPublicKey || imageKitStatus?.publicKey || 'public_vie7nQLXXCidvyqXsEkC9qnkwWk=', 'ik_pub')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                      title="Copy Public Key"
                    >
                      {copiedField === 'ik_pub' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-900 font-semibold truncate text-xs" title={ikPublicKey || imageKitStatus?.publicKey || 'Configured'}>
                    {ikPublicKey ? maskId(ikPublicKey, 8, 4) : 'public_vie7...'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">URL Endpoint</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(ikUrlEndpoint || imageKitStatus?.urlEndpoint || 'https://ik.imagekit.io/9abzbu5ke', 'ik_url')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                      title="Copy Endpoint URL"
                    >
                      {copiedField === 'ik_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-900 font-semibold truncate text-xs" title={ikUrlEndpoint || imageKitStatus?.urlEndpoint || 'https://ik.imagekit.io/9abzbu5ke'}>
                    {maskDomain(ikUrlEndpoint || imageKitStatus?.urlEndpoint || 'https://ik.imagekit.io/9abzbu5ke', 12)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Private Key</span>
                  </div>
                  <span className="text-slate-800 font-sans font-semibold text-xs truncate">
                    {ikPriv ? (maskExportSecrets ? '••••••••••••' : 'Configured (Encrypted)') : 'Scaffold/Server'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Target Folder</span>
                  </div>
                  <span className="text-slate-800 font-sans font-semibold text-xs truncate">
                    /wedding-invitations
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyImageKitSnippet}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 transition flex items-center gap-1.5 flex-1 justify-center shadow-2xs"
              >
                {copiedImageKitSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-sky-700" />}
                <span>{copiedImageKitSnippet ? 'Copied ImageKit' : 'Copy ImageKit Config'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('imagekit')}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-sky-800 hover:bg-sky-100 border border-sky-200 transition shrink-0"
              >
                Manage Tab
              </button>
            </div>
          </div>

          {/* Pillar 4: Cloudflare R2 Video Storage */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-amber-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 font-serif flex items-center gap-1.5">
                      4.) Cloudflare R2
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      S3-Compatible Edge Storage • Zero Egress Fees
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                  Zero Egress
                </span>
              </div>

              <p className="text-xs text-[#506173] leading-relaxed">
                Cloudflare edge S3-compatible storage for high-res guestbook video blessings with zero egress fees and direct signed uploads.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Account ID</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(r2AccountId || r2Status?.accountId || '9426f4fce849e75ba9560f855a882cb0', 'r2_acc')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                      title="Copy Account ID"
                    >
                      {copiedField === 'r2_acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-900 font-semibold truncate text-xs" title={r2AccountId || r2Status?.accountId || 'Configured'}>
                    {r2AccountId || r2Status?.accountId ? maskId(r2AccountId || r2Status?.accountId || '', 8, 4) : '9426f4fc...'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Bucket</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(r2BucketName || r2Status?.bucketName || 'wedding-videos', 'r2_bucket')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
                      title="Copy Bucket Name"
                    >
                      {copiedField === 'r2_bucket' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-slate-900 font-semibold truncate text-xs" title={r2BucketName || r2Status?.bucketName || 'wedding-videos'}>
                    {r2BucketName || r2Status?.bucketName || 'wedding-videos'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Secret Key</span>
                  </div>
                  <span className="text-slate-800 font-sans font-semibold text-xs truncate">
                    {r2Status?.hasSecretAccessKey || r2SecretAccessKey ? (maskExportSecrets ? '••••••••••••' : 'Configured (Encrypted)') : 'Scaffold/Server'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-sans font-bold tracking-wider">Delivery CDN</span>
                  </div>
                  <span className="text-slate-800 font-sans font-semibold text-xs truncate" title={r2PublicUrl || r2Status?.publicUrl || 'Cloudflare CDN'}>
                    {r2PublicUrl || r2Status?.publicUrl ? 'Cloudflare CDN' : 'Zero Egress'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyR2Snippet}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1.5 flex-1 justify-center shadow-2xs"
              >
                {copiedR2Snippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{copiedR2Snippet ? 'Copied R2 Config' : 'Copy R2 Config'}</span>
              </button>
              <a
                href="https://dash.cloudflare.com/?to=/:account/r2"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-800 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1.5 shrink-0"
                title="Open Cloudflare R2 Dashboard"
              >
                <span>Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ACTION TOOLBAR & RESTORATION CONTROLS */}
        <div className="p-3 bg-emerald-950/5 rounded-2xl border border-emerald-200/90 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-serif">
              Export & Snapshot Operations
            </span>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={maskExportSecrets}
                onChange={(e) => setMaskExportSecrets(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="font-medium">Mask private credentials in export code</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPresetsFile}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition flex items-center space-x-1.5 shadow-xs"
              title="Downloads authoritative presets.ts containing EventConfig, Guests, Guestbook, and INITIAL_CLOUD_SETTINGS"
            >
              {downloadedPresetsFile ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadedPresetsFile ? '✓ Downloaded presets.ts!' : 'Download Complete presets.ts'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyFullPresetsFile}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition flex items-center space-x-1.5 shadow-xs"
              title="Copies complete presets.ts file with Cloud & Account Settings"
            >
              {copiedPresetsFile ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-700" />}
              <span>{copiedPresetsFile ? '✓ Copied presets.ts!' : 'Copy Full presets.ts Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-xs"
              title="Downloads JSON snapshot containing wedding data + cloudSettings"
            >
              {downloadedJsonBackup ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4 text-slate-600" />}
              <span>{downloadedJsonBackup ? '✓ Downloaded JSON!' : 'Download JSON Snapshot'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCloudSettingsCode}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center space-x-1.5"
              title="Copies only the INITIAL_CLOUD_SETTINGS TypeScript export block"
            >
              {copiedCloudSettingsCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedCloudSettingsCode ? '✓ Copied Cloud Settings!' : 'Copy Cloud Settings Only'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPresetCode}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center space-x-1.5"
              title="Copies just the wedding preset object block"
            >
              {copiedPresetCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedPresetCode ? '✓ Copied Preset!' : 'Copy Preset Block Only'}</span>
            </button>

            <button
              type="button"
              onClick={() => restoreFileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 text-rose-800 hover:bg-rose-100 transition flex items-center space-x-1.5 border border-rose-200 shadow-xs"
              title="Restore event data and cloud credentials from a JSON backup file"
            >
              <Upload className="w-4 h-4" />
              <span>Restore JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPasteError(null);
                setPastedJsonText('');
                setShowPasteModal(true);
              }}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition flex items-center space-x-1.5 border border-slate-300 shadow-xs"
              title="Paste JSON snapshot or presets.ts code text directly to inspect and restore"
            >
              <Code className="w-3.5 h-3.5 text-slate-500" />
              <span>Paste JSON / Code...</span>
            </button>

            <input
              ref={restoreFileInputRef}
              type="file"
              accept=".json,.ts,.js,application/json,text/plain"
              className="hidden"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleRestoreFileSelected(file);
              }}
            />
          </div>
        </div>

        {/* EXPANDABLE CODE PREVIEW VIEWER */}
        {showBackupPreview && (
          <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed relative animate-fadeIn border border-slate-700 shadow-lg space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setBackupPreviewTab('presets')}
                  className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold transition ${
                    backupPreviewTab === 'presets' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Complete presets.ts
                </button>
                <button
                  type="button"
                  onClick={() => setBackupPreviewTab('cloud')}
                  className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold transition ${
                    backupPreviewTab === 'cloud' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cloud & Account Settings Only
                </button>
                <button
                  type="button"
                  onClick={() => setBackupPreviewTab('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold transition ${
                    backupPreviewTab === 'json' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON Backup Snapshot
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
                  {maskExportSecrets ? 'Private keys masked' : 'Raw keys exposed'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const code = backupPreviewTab === 'presets'
                      ? generateFullPresetsCode()
                      : backupPreviewTab === 'cloud'
                      ? generateCloudSettingsCode()
                      : generateJsonBackupString();
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(code);
                      setCopiedPresetsFile(true);
                      setTimeout(() => setCopiedPresetsFile(false), 2500);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  {copiedPresetsFile ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPresetsFile ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto pr-2 space-y-1 select-all bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-200">
                {backupPreviewTab === 'presets' && generateFullPresetsCode()}
                {backupPreviewTab === 'cloud' && generateCloudSettingsCode()}
                {backupPreviewTab === 'json' && generateJsonBackupString()}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-[#f0f4f8] w-full max-w-5xl xl:max-w-6xl rounded-3xl border border-[#c8d7e3] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#ffffff] border-b border-[#c8d7e3] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ebf2f7] border border-[#c8d7e3] flex items-center justify-center text-[#3A5A74] shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold text-[#3A5A74] tracking-widest font-serif">
                  Infrastructure & Cloud Integrations
                </span>
                {isCloudConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Sync Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Local Mode</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#18232c]">
                Cloud & Account Settings
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#475569] hover:text-[#18232c] hover:bg-[#ebf2f7] rounded-full transition"
            title="Close Cloud Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 pb-0 bg-[#f8fafc] border-b border-[#c8d7e3] flex items-center space-x-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 border-t border-x ${
              activeTab === 'firebase'
                ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] -mb-px shadow-xs'
                : 'text-[#506173] hover:text-[#18232c] border-transparent hover:bg-[#ebf2f7]'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Firebase & Live Sync</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans bg-amber-100 text-amber-800 font-semibold">
              Firestore
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 border-t border-x ${
              activeTab === 'supabase'
                ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] -mb-px shadow-xs'
                : 'text-[#506173] hover:text-[#18232c] border-transparent hover:bg-[#ebf2f7]'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            <span>Supabase Failover</span>
            {supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey ? (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold ${
                supabaseConfig.mode === 'mirror' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : supabaseConfig.mode === 'failover' 
                  ? 'bg-sky-100 text-sky-800' 
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {supabaseConfig.mode === 'mirror' ? 'Mirror Active' : supabaseConfig.mode === 'failover' ? 'Standby' : 'Off'}
              </span>
            ) : (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans bg-amber-100 text-amber-800 font-semibold">
                Scaffold
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('imagekit')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 border-t border-x ${
              activeTab === 'imagekit'
                ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] -mb-px shadow-xs'
                : 'text-[#506173] hover:text-[#18232c] border-transparent hover:bg-[#ebf2f7]'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-600" />
            <span>ImageKit & Storage</span>
            {imageKitStatus?.configured ? (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans bg-emerald-100 text-emerald-800 font-semibold">
                Active CDN
              </span>
            ) : (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans bg-slate-200 text-slate-700 font-semibold">
                Setup
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('r2')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 border-t border-x ${
              activeTab === 'r2'
                ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] -mb-px shadow-xs'
                : 'text-[#506173] hover:text-[#18232c] border-transparent hover:bg-[#ebf2f7]'
            }`}
          >
            <Video className="w-4 h-4 text-amber-600" />
            <span>Cloudflare R2</span>
            {r2Status?.configured ? (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans bg-emerald-100 text-emerald-800 font-semibold">
                Active S3
              </span>
            ) : (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans bg-slate-200 text-slate-700 font-semibold">
                Setup
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-serif font-bold transition flex items-center space-x-2 border-t border-x ${
              activeTab === 'backup'
                ? 'bg-[#ffffff] text-[#3A5A74] border-[#c8d7e3] -mb-px shadow-xs'
                : 'text-[#506173] hover:text-[#18232c] border-transparent hover:bg-[#ebf2f7]'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Presets & Backup Suite</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans bg-emerald-100 text-emerald-800 font-semibold">
              4 Clouds
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: FIREBASE ACCOUNT & LIVE SYNC */}
          {activeTab === 'firebase' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Info */}
              <div className="p-4 sm:p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                    <Database className="w-5 h-5 text-amber-600" />
                    <span>Firebase Firestore Real-Time Database</span>
                  </h4>
                  <p className="text-[#475569] text-xs sm:text-sm font-serif italic mt-0.5">
                    Continuous bi-directional synchronization between Host Dashboard, Guest Passports, and RSVPs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs sm:text-sm font-semibold border border-amber-300 transition flex items-center space-x-1.5"
                    title="Open Firestore Database in Firebase Console"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                    <span>Firebase Console</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleTestFirebase}
                    disabled={isTestingFirebase}
                    className="px-3.5 py-2 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs sm:text-sm font-semibold border border-[#c8d7e3] transition flex items-center space-x-1.5 disabled:opacity-50"
                    title="Ping Firebase Firestore to verify live connectivity"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                    <span>{isTestingFirebase ? 'Pinging Cloud...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 7: CLOUD FIRESTORE & DEPLOYMENT SYNC */}
              <div className="p-5 sm:p-6 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-[#18232c] space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-xs">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#18232c] flex items-center gap-2 flex-wrap">
                          <span>Live Cloud Firestore Database Connected</span>
                          <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-sans uppercase tracking-wider font-semibold">Active & Online</span>
                        </h4>
                        <p className="text-xs text-[#475569] mt-0.5">
                          Database ID: <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900 font-semibold">{firebaseConfig.firestoreDatabaseId}</code>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestLiveDbConnection}
                      disabled={isTestingLiveDb}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition flex items-center space-x-1.5 shadow-xs shrink-0 self-start"
                    >
                      {isTestingLiveDb ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                          <span>Pinging Live Cloud...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Test Cloud Latency</span>
                        </>
                      )}
                    </button>
                  </div>

                  {liveDbStatus && (
                    <div className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start space-x-2.5 transition animate-fadeIn ${
                      liveDbStatus.success 
                        ? 'bg-white border-emerald-300 text-emerald-950' 
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}>
                      {liveDbStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <p className="font-semibold">
                          {liveDbStatus.success 
                            ? `✓ Cloud Connection Verified (${liveDbStatus.latencyMs}ms response latency)` 
                            : 'Connection Warning'}
                        </p>
                        <p className="text-xs text-[#475569]">
                          {liveDbStatus.success 
                            ? 'Your Google Cloud Firestore database is fully active and responding with ultra-fast latency. All live invitation edits and RSVPs are synchronized.' 
                            : liveDbStatus.error}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    Whenever you click <strong className="text-[#18232c]">Apply & Save All Changes</strong> below, your updates are synced directly to your <strong>Google Cloud Firestore database</strong>. Any guest opening your website anywhere in the world will immediately see your live wedding information and seating in real-time.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#334155]">
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Event Configuration</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Synchronized</span>
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Guest List & RSVPs</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-[#3A5A74]" />
                        <span>{guests?.length || 0} Registered Guests</span>
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Guestbook Blessings</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        <span>{guestbookEntries?.length || 0} Messages</span>
                      </span>
                    </div>
                  </div>

                  {/* SECTION: SERVER-AUTHORITATIVE ARCHITECTURE */}
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-[#18232c] rounded-2xl border border-indigo-700/60 text-white space-y-3.5 shadow-md">
                    <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5 shadow-sm">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-serif font-bold text-sm sm:text-base text-white">
                              Server-Authoritative Architecture
                            </h4>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                              serverAuthStatus?.authoritative 
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' 
                                : isTestingServerAuth 
                                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                                  : 'bg-indigo-800 text-indigo-200 border border-indigo-600'
                            }`}>
                              {serverAuthStatus?.authoritative ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                                  <span>Authoritative Active</span>
                                </>
                              ) : isTestingServerAuth ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-slate-950" />
                                  <span>Checking Gateway...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-indigo-300" />
                                  <span>Direct Firestore Active</span>
                                </>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-200/90 mt-1 leading-relaxed">
                            Mutations (RSVPs, seating, event settings, guestbook) are processed through the backend Express gateway, persisted to Google Cloud Firestore, and broadcast live via Server-Sent Events (SSE).
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestServerAuth}
                        disabled={isTestingServerAuth}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center space-x-1.5 shrink-0 self-start disabled:opacity-50"
                        title="Ping backend API to check authoritative health and SSE stream"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingServerAuth ? 'animate-spin' : ''}`} />
                        <span>{isTestingServerAuth ? 'Pinging...' : 'Ping Gateway'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-indigo-300 block">Gateway Mode</span>
                        <span className="font-semibold text-white truncate block mt-0.5">
                          {serverAuthStatus?.authoritative ? (serverAuthStatus?.mode || 'Server-Authoritative') : 'Direct Firestore'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-indigo-300 block">Real-Time Stream</span>
                        <span className={`font-semibold flex items-center gap-1 mt-0.5 ${
                          serverAuthStatus?.authoritative ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          <Wifi className="w-3.5 h-3.5" />
                          <span>{serverAuthStatus?.authoritative ? 'SSE Stream Active' : 'Firestore onSnapshot'}</span>
                        </span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-indigo-300 block">Authoritative Records</span>
                        <span className="font-semibold text-white block mt-0.5">
                          {(serverAuthStatus?.guestsCount !== undefined ? serverAuthStatus.guestsCount : guests?.length) || 0} Guests
                        </span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-indigo-300 block">Backend Uptime</span>
                        <span className="font-semibold text-white block mt-0.5">
                          {serverAuthStatus?.uptime ? `${Math.floor(serverAuthStatus.uptime)}s` : serverAuthStatus?.authoritative ? 'Active' : 'Standby'}
                        </span>
                      </div>
                    </div>

                    {!serverAuthStatus?.authoritative && (
                      <div className="p-3 bg-indigo-950/70 border border-indigo-500/30 rounded-xl text-xs space-y-1.5 text-indigo-200">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Direct Cloud Firestore Connected
                          </span>
                          <span className="text-[11px] text-indigo-300 font-mono">
                            Database ID: ai-studio-remixremixreeven-f3bdd371-0727-4153-ad53-32f81493a70b
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-200/90 leading-relaxed">
                          In the embedded preview iframe, the client connects directly to Google Cloud Firestore with real-time snapshots. All guest RSVPs, seating plans, and event edits write directly to your database. Opening the app in a standalone tab activates the Express Server-Authoritative gateway with SSE streaming.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PRESETS & OFFLINE BACKUP TOOLKIT */}
                  {renderPresetsAndBackupSuite(false)}
                </div>

              {/* Status Feedback Alerts */}
              {firebaseTestResult && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
                  firebaseTestResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {firebaseTestResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>
                      {firebaseTestResult.success 
                        ? `✓ Cloud Firestore connection active and verified! (Latency: ${firebaseTestResult.latencyMs}ms)`
                        : `Connection failed: ${firebaseTestResult.error}`
                      }
                    </span>
                  </div>
                  {firebaseTestResult.latencyMs !== undefined && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/70 border border-current">
                      {firebaseTestResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              {forceSyncMessage && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  forceSyncMessage.startsWith('✓') 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  {forceSyncMessage.startsWith('✓') ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{forceSyncMessage}</span>
                </div>
              )}

              {seedMessage && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  seedMessage.startsWith('✓') 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{seedMessage}</span>
                </div>
              )}

              {/* Live Sync Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Connection State
                  </span>
                  <div className="pt-1">
                    {isCloudConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                        <span>Connected & Syncing</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Offline Fallback</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#475569] font-serif pt-0.5">
                    WebSocket listeners active
                  </p>
                </div>

                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Event Configuration
                  </span>
                  <div className="text-sm font-semibold text-[#18232c] pt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>event_config / wedding_event</span>
                  </div>
                  <p className="text-[11px] text-[#475569] font-serif pt-0.5">
                    Details & Church & Venue
                  </p>
                </div>

                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Live Guest List
                  </span>
                  <div className="text-sm font-semibold text-[#18232c] pt-1 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#3A5A74]" />
                    <span>{guests.length} Guest Records</span>
                  </div>
                  <p className="text-[11px] text-[#475569] font-serif pt-0.5">
                    Synced in `guests` collection
                  </p>
                </div>

                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Client Multi-Sync
                  </span>
                  <div className="text-sm font-semibold text-emerald-800 pt-1 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    <span>Zero-Latency Push</span>
                  </div>
                  <p className="text-[11px] text-[#475569] font-serif pt-0.5">
                    Sub-second RSVP updates
                  </p>
                </div>
              </div>

              {/* FIREBASE SPARK (FREE TIER) STORAGE COUNTER & DAILY LIMITS MONITOR */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-6">
                {/* Header */}
                <div className="border-b border-[#c8d7e3] pb-3.5 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-emerald-700" />
                        <span>Firestore Storage Counter & Spark Free Tier Quota Monitor</span>
                      </h5>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        Spark Tier (Free)
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      Real-time database payload size calculation, remaining storage capacity, and daily operational quota trackers.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/usage`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs"
                      title="View live server-side telemetry graphs in Google Cloud Console"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Official Google Live Usage</span>
                      <ExternalLink className="w-3 h-3 text-[#506173]" />
                    </a>
                  </div>
                </div>

                {/* 1. Storage Capacity Counter (Hero Meter) */}
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#ebf2f7]/60 border border-[#c8d7e3] space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block mb-1">
                        Total Database Storage Used
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-serif font-bold text-[#18232c]">
                          {formatBytes(storageStats.totalBytes)}
                        </span>
                        <span className="text-xs text-[#475569] font-sans">
                          of <strong className="text-[#18232c]">1.00 GiB</strong> (1,024 MB free limit)
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] font-serif mt-1">
                        Includes JSON document records, paths, and Firestore field index metadata.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block mb-1">
                        Storage Space Remaining
                      </span>
                      <div className="text-lg sm:text-xl font-serif font-bold text-emerald-700">
                        {formatBytes(storageStats.bytesRemaining)} left
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{storageStats.percentRemaining.toFixed(4)}% available</span>
                      </span>
                    </div>
                  </div>

                  {/* Storage Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full bg-[#dbe7f0] rounded-full h-3 overflow-hidden p-0.5 border border-[#c8d7e3]">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out min-w-[6px]"
                        style={{ width: `${Math.max(0.5, storageStats.percentUsed)}%` }}
                        title={`${storageStats.percentUsed.toFixed(4)}% used`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#506173] font-mono">
                      <span>0 MB</span>
                      <span className="font-sans font-semibold text-[#18232c]">
                        {storageStats.percentUsed < 0.001 ? '< 0.001%' : `${storageStats.percentUsed.toFixed(3)}%`} consumed
                      </span>
                      <span>1,024 MB (1 GiB)</span>
                    </div>
                  </div>

                  {/* Detailed Storage Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-[#c8d7e3] space-y-1">
                      <span className="font-bold text-[#506173] text-[11px] uppercase block">
                        Event Details Document
                      </span>
                      <p className="font-mono text-sm font-bold text-[#18232c]">
                        {formatBytes(storageStats.configDocBytes)}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#506173] pt-0.5">
                        <span>Target doc: wedding_event</span>
                        <span className="text-emerald-700 font-semibold">{storageStats.configDocPercentOfMax.toFixed(2)}% of 1 MB max</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-[#c8d7e3] space-y-1">
                      <span className="font-bold text-[#506173] text-[11px] uppercase block">
                        Guest Roster Collection
                      </span>
                      <p className="font-mono text-sm font-bold text-[#18232c]">
                        {formatBytes(storageStats.guestsTotalBytes)}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#506173] pt-0.5">
                        <span>{storageStats.guestsCount} guest cards</span>
                        <span className="text-slate-700 font-medium">Avg ~{formatBytes(storageStats.avgGuestDocBytes)} / guest</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-[#c8d7e3] space-y-1">
                      <span className="font-bold text-[#506173] text-[11px] uppercase block">
                        Per-Document Safety Limit
                      </span>
                      <p className="font-mono text-sm font-bold text-[#18232c]">
                        {formatBytes(storageStats.largestGuestDocBytes)} peak
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#506173] pt-0.5">
                        <span>Max doc size: 1 MiB</span>
                        <span className="text-emerald-700 font-semibold">{storageStats.largestGuestDocPercentOfMax.toFixed(2)}% of 1 MB max</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Daily Limit Monitor Cards (Reads, Writes, Deletes) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-serif font-bold text-[#18232c] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-[#3A5A74]" />
                      <span>Spark Tier Daily Operation Quotas (Resets Every 24h)</span>
                    </h6>

                    <div className="flex items-center gap-2 text-[11px] text-[#506173]">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Resets in <strong>{timeUntilReset.formatted}</strong> (Midnight UTC)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Daily Reads */}
                    <div className="p-4 rounded-xl bg-white border border-[#c8d7e3] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                          Document Reads
                        </span>
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {((dailyUsage.reads / FIRESTORE_SPARK_LIMITS.dailyReadsLimit) * 100).toFixed(1)}% Used
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-serif font-bold text-[#18232c]">
                            {dailyUsage.reads.toLocaleString()}
                          </span>
                          <span className="text-xs font-mono text-[#506173]">
                            / 50,000 / day
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          {(FIRESTORE_SPARK_LIMITS.dailyReadsLimit - dailyUsage.reads).toLocaleString()} reads remaining today
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(1, (dailyUsage.reads / FIRESTORE_SPARK_LIMITS.dailyReadsLimit) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#506173] font-serif italic">
                        Recorded during initial app boot, guest lookup, and live real-time sync.
                      </p>
                    </div>

                    {/* Daily Writes */}
                    <div className="p-4 rounded-xl bg-white border border-[#c8d7e3] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                          Document Writes
                        </span>
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {((dailyUsage.writes / FIRESTORE_SPARK_LIMITS.dailyWritesLimit) * 100).toFixed(1)}% Used
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-serif font-bold text-[#18232c]">
                            {dailyUsage.writes.toLocaleString()}
                          </span>
                          <span className="text-xs font-mono text-[#506173]">
                            / 20,000 / day
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          {(FIRESTORE_SPARK_LIMITS.dailyWritesLimit - dailyUsage.writes).toLocaleString()} writes remaining today
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-sky-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(1, (dailyUsage.writes / FIRESTORE_SPARK_LIMITS.dailyWritesLimit) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#506173] font-serif italic">
                        Triggered when RSVP responses, wedding detail edits, or seating plans are saved.
                      </p>
                    </div>

                    {/* Daily Deletes */}
                    <div className="p-4 rounded-xl bg-white border border-[#c8d7e3] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                          Document Deletes
                        </span>
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {((dailyUsage.deletes / FIRESTORE_SPARK_LIMITS.dailyDeletesLimit) * 100).toFixed(1)}% Used
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-serif font-bold text-[#18232c]">
                            {dailyUsage.deletes.toLocaleString()}
                          </span>
                          <span className="text-xs font-mono text-[#506173]">
                            / 20,000 / day
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          {(FIRESTORE_SPARK_LIMITS.dailyDeletesLimit - dailyUsage.deletes).toLocaleString()} deletes remaining today
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-amber-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(1, (dailyUsage.deletes / FIRESTORE_SPARK_LIMITS.dailyDeletesLimit) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#506173] font-serif italic">
                        Triggered when guests or invitation records are removed from the host roster.
                      </p>
                    </div>
                  </div>

                  {/* Reset / Info Bar */}
                  <div className="p-3 bg-[#ebf2f7]/70 rounded-xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#475569]">
                      <Info className="w-4 h-4 text-[#3A5A74] shrink-0" />
                      <span>
                        Session tally: <strong>{dailyUsage.sessionReads}</strong> reads, <strong>{dailyUsage.sessionWrites}</strong> writes, <strong>{dailyUsage.sessionDeletes}</strong> deletes since opening app.
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResetQuotaCounters}
                        className="text-[#3A5A74] hover:text-[#18232c] underline text-xs font-semibold cursor-pointer"
                      >
                        Reset Session Counters
                      </button>
                      <span className="text-[#c8d7e3]">|</span>
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/usage`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#3A5A74] hover:underline"
                      >
                        <span>View Real-Time Google Graph</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-4">
                <div className="border-b border-[#c8d7e3] pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-[#3A5A74]" />
                      <span>Live Sync Actions & Controls</span>
                    </h5>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      Trigger manual sync, force cloud overwrite, or re-seed default guests.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleForceCloudSync}
                    disabled={isForceSyncing}
                    className="px-4 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 shadow-sm border border-[#4D708E] disabled:opacity-50"
                    title="Push all local state and current guests into Firestore"
                  >
                    {isForceSyncing ? <Loader2 className="w-4 h-4 animate-spin text-sky-200" /> : <UploadCloud className="w-4 h-4 text-sky-200" />}
                    <span>{isForceSyncing ? 'Synchronizing Cloud...' : 'Force Sync All to Cloud'}</span>
                  </button>

                  {!confirmingSeed ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingSeed(true)}
                      disabled={isSeedingGuests}
                      className="px-4 py-2.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs sm:text-sm font-semibold transition border border-[#c8d7e3] flex items-center space-x-2 disabled:opacity-50"
                      title="Re-populate cloud with sample guests"
                    >
                      {isSeedingGuests ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-600" />}
                      <span>{isSeedingGuests ? 'Seeding...' : 'Seed Sample Guests to Cloud'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-1.5 bg-amber-50 border border-amber-300 rounded-xl">
                      <span className="text-xs text-amber-900 font-serif font-medium px-1">
                        Seed 4 sample guests to Firestore?
                      </span>
                      <button
                        type="button"
                        onClick={handleReSeedGuests}
                        disabled={isSeedingGuests}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                      >
                        {isSeedingGuests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Confirm Seed</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingSeed(false)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Local Feedback Toasts */}
                {forceSyncMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                    forceSyncMessage.startsWith('✓')
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border border-rose-300'
                  }`}>
                    {forceSyncMessage.startsWith('✓') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{forceSyncMessage}</span>
                  </div>
                )}

                {seedMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                    seedMessage.startsWith('✓')
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border border-rose-300'
                  }`}>
                    {seedMessage.startsWith('✓') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{seedMessage}</span>
                  </div>
                )}
              </div>

              {/* Firebase Account Details Card */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-4">
                <div className="border-b border-[#c8d7e3] pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#3A5A74]" />
                        <span>Firebase Provisioned Project & Account Details</span>
                      </h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold border transition ${
                        isFirebasePrivacyMasked 
                          ? 'bg-amber-50 text-amber-900 border-amber-300' 
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {isFirebasePrivacyMasked ? 'Privacy Mask Active' : 'Details Visible'}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      Sensitive project identifiers and database credentials with screen privacy protection.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsFirebasePrivacyMasked(!isFirebasePrivacyMasked)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs"
                      title={isFirebasePrivacyMasked ? "Reveal full identifiers" : "Mask sensitive characters"}
                    >
                      {isFirebasePrivacyMasked ? <Eye className="w-3.5 h-3.5 text-[#3A5A74]" /> : <EyeOff className="w-3.5 h-3.5 text-[#3A5A74]" />}
                      <span>{isFirebasePrivacyMasked ? "Unhide Letters" : "Hide Letters"}</span>
                    </button>

                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId || '(default)'}/data`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#c8d7e3] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#506173] uppercase tracking-wider text-[11px]">Firebase Project ID</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(firebaseConfig.projectId, 'projectId')}
                        className="text-[#3A5A74] hover:text-[#18232c] transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedField === 'projectId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#506173]" />}
                        <span>{copiedField === 'projectId' ? 'Copied Full Value' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-[#18232c] text-xs font-semibold select-all break-all tracking-wide">
                      {isFirebasePrivacyMasked ? maskId(firebaseConfig.projectId, 7, 4) : firebaseConfig.projectId}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#c8d7e3] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#506173] uppercase tracking-wider text-[11px]">Firestore Database ID</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(firebaseConfig.firestoreDatabaseId || '', 'dbId')}
                        className="text-[#3A5A74] hover:text-[#18232c] transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedField === 'dbId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#506173]" />}
                        <span>{copiedField === 'dbId' ? 'Copied Full Value' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-[#18232c] text-xs font-semibold select-all break-all tracking-wide">
                      {isFirebasePrivacyMasked 
                        ? maskId(firebaseConfig.firestoreDatabaseId || '(default)', 9, 4) 
                        : (firebaseConfig.firestoreDatabaseId || '(default)')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#c8d7e3] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#506173] uppercase tracking-wider text-[11px]">Auth Domain</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(firebaseConfig.authDomain, 'authDomain')}
                        className="text-[#3A5A74] hover:text-[#18232c] transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedField === 'authDomain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#506173]" />}
                        <span>{copiedField === 'authDomain' ? 'Copied Full Value' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-[#18232c] text-xs select-all break-all tracking-wide">
                      {isFirebasePrivacyMasked ? maskDomain(firebaseConfig.authDomain, 7) : firebaseConfig.authDomain}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#c8d7e3] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#506173] uppercase tracking-wider text-[11px]">Storage Bucket</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(firebaseConfig.storageBucket, 'storageBucket')}
                        className="text-[#3A5A74] hover:text-[#18232c] transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedField === 'storageBucket' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#506173]" />}
                        <span>{copiedField === 'storageBucket' ? 'Copied Full Value' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-[#18232c] text-xs select-all break-all tracking-wide">
                      {isFirebasePrivacyMasked ? maskDomain(firebaseConfig.storageBucket, 7) : firebaseConfig.storageBucket}
                    </p>
                  </div>
                </div>
              </div>

              {/* Architecture Explanation */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-3">
                <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#3A5A74]" />
                  <span>How Live Synchronization Operates</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#475569]">
                  <div className="p-3.5 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1">
                    <p className="font-bold text-[#18232c]">1. Instant RSVP Sync</p>
                    <p className="font-serif leading-relaxed">
                      When guests accept or decline their invitations from any phone, laptop, or shared link, the response streams live directly into your Host Dashboard within milliseconds.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1">
                    <p className="font-bold text-[#18232c]">2. Real-Time Wedding Updates</p>
                    <p className="font-serif leading-relaxed">
                      Changes made to the schedule, church vows, or reception venue are automatically pushed to all active attendees without requiring them to reload the page.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1">
                    <p className="font-bold text-[#18232c]">3. Offline Resilience</p>
                    <p className="font-serif leading-relaxed">
                      Local state is safely stored on device in case of connectivity drops, and automatically reconciles when internet connection is re-established.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUPABASE REDUNDANCY & FAILOVER */}
          {activeTab === 'supabase' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Banner */}
              <div className="p-4 sm:p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                    <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
                    <span>Supabase Alternate & Failover Database Scaffolding</span>
                  </h4>
                  <p className="text-[#475569] text-xs sm:text-sm font-serif italic mt-0.5">
                    Secondary high-availability database and automatic failover system for guests, RSVPs, and wedding settings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold border border-emerald-300 transition flex items-center space-x-1.5"
                    title="Open Supabase Dashboard in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Supabase Dashboard</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase}
                    className="px-3.5 py-2 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs sm:text-sm font-semibold border border-[#c8d7e3] transition flex items-center space-x-1.5 disabled:opacity-50"
                    title="Ping Supabase endpoint to verify credentials and connectivity"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isTestingSupabase ? 'Pinging...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>

              {/* Privacy Shield Notice Card */}
              <div className="p-4 sm:p-5 bg-[#f8fafc] rounded-2xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#18232c] text-sm flex items-center gap-1.5">
                      <span>Screen Privacy Protection Active</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-100 text-emerald-800">
                        {isSupabasePrivacyMasked ? 'Masked' : 'Revealed'}
                      </span>
                    </h5>
                    <p className="text-[#475569] text-xs font-serif italic mt-0.5">
                      Supabase Project URL and Anon API key letters are masked on screen to prevent accidental exposure during demonstrations or live streams.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSupabasePrivacyMasked(!isSupabasePrivacyMasked)}
                  className="px-3.5 py-2 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs font-serif font-bold transition border border-[#c8d7e3] flex items-center space-x-1.5 shadow-xs"
                >
                  {isSupabasePrivacyMasked ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Unhide Letters</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Letters</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status & Feedback Alerts */}
              {supabaseSaveNotice && (
                <div className="p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in bg-emerald-50 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{supabaseSaveNotice}</span>
                </div>
              )}

              {supabaseTestResult && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
                  supabaseTestResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {supabaseTestResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span>
                        {supabaseTestResult.success 
                          ? `✓ Supabase connection active and verified! (Latency: ${supabaseTestResult.latencyMs}ms)`
                          : `Connection notice: ${supabaseTestResult.error}`
                        }
                      </span>
                      {supabaseTestResult.tablesDetected && supabaseTestResult.tablesDetected.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-normal opacity-85">Detected tables:</span>
                          {supabaseTestResult.tablesDetected.map((tbl) => (
                            <span key={tbl} className="px-1.5 py-0.5 rounded bg-white/80 border border-current text-[10px] font-mono">
                              {tbl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {supabaseTestResult.latencyMs !== undefined && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/80 border border-current shrink-0">
                      {supabaseTestResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              {mirrorResult && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  mirrorResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  {mirrorResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {mirrorResult.success 
                      ? `✓ Successfully mirrored ${mirrorResult.syncedCount} wedding records to Supabase as an immediate replica!`
                      : `Mirror notice: ${mirrorResult.error}`}
                  </span>
                </div>
              )}

              {/* Redundancy Architecture Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Primary Database
                  </span>
                  <div className="pt-1 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-serif font-bold text-[#18232c] text-sm sm:text-base">
                      Cloud Firestore
                    </span>
                  </div>
                  <p className="text-[11px] text-[#506173] font-serif italic pt-0.5">
                    Real-time bi-directional sync
                  </p>
                </div>

                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Alternate Database
                  </span>
                  <div className="pt-1 flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      supabaseConfig.supabaseUrl ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}></span>
                    <span className="font-serif font-bold text-[#18232c] text-sm sm:text-base">
                      Supabase (PostgreSQL)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#506173] font-serif italic pt-0.5">
                    {supabaseConfig.supabaseUrl ? 'Configured & Standby' : 'Scaffolding Ready'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Redundancy Strategy
                  </span>
                  <div className="pt-1 flex items-center space-x-2">
                    <span className="font-serif font-bold text-[#3A5A74] text-sm sm:text-base">
                      {supabaseConfig.mode === 'mirror'
                        ? 'Dual-Write Mirror'
                        : supabaseConfig.mode === 'failover'
                        ? 'Automatic Failover'
                        : 'Firestore Only'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#506173] font-serif italic pt-0.5">
                    {supabaseConfig.mode === 'mirror'
                      ? 'Writes to both databases'
                      : supabaseConfig.mode === 'failover'
                      ? 'Switches if Firestore drops'
                      : 'Standby mode'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border bg-[#ffffff] border-[#c8d7e3] space-y-1 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                    Last Replica Mirror
                  </span>
                  <div className="pt-1 flex items-center space-x-2">
                    <span className="font-serif font-bold text-[#18232c] text-sm sm:text-base">
                      {supabaseConfig.lastSyncTime 
                        ? new Date(supabaseConfig.lastSyncTime).toLocaleDateString()
                        : 'Not mirrored yet'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#506173] font-serif italic pt-0.5">
                    {supabaseConfig.lastSyncTime 
                      ? new Date(supabaseConfig.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Click Mirror Now below'}
                  </p>
                </div>
              </div>

              {/* SUPABASE STORAGE COUNTER & FREE TIER QUOTA MONITOR */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-6">
                {/* Header */}
                <div className="border-b border-[#c8d7e3] pb-3.5 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-emerald-700" />
                        <span>Supabase Storage Counter & Free Tier Quota Monitor</span>
                      </h5>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        Free Tier (500 MB DB / 5 GB Egress)
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      PostgreSQL database disk size, table row allocations, monthly egress bandwidth, and 7-day inactivity pause monitor.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={supabaseProjectRef ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/settings/billing/usage` : "https://supabase.com/dashboard/project/_/settings/billing/usage"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs font-semibold border border-[#c8d7e3] transition shadow-2xs"
                      title="View live official telemetry and usage in Supabase Project Settings"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Official Supabase Live Usage</span>
                      <ExternalLink className="w-3 h-3 text-[#506173]" />
                    </a>
                  </div>
                </div>

                {/* 1. Storage Capacity Counter (Hero Meter) */}
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#ebf2f7]/60 border border-[#c8d7e3] space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block mb-1">
                        Total Database Storage Used
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-serif font-bold text-[#18232c]">
                          {formatBytes(supabaseStorageStats.totalBytes)}
                        </span>
                        <span className="text-xs text-[#475569] font-sans">
                          of <strong className="text-[#18232c]">500.00 MB</strong> (Free Plan Limit)
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] font-serif mt-1">
                        Calculated across PostgreSQL heap pages, row headers, B-Tree indexes, and JSON payloads.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173] block mb-1">
                        Storage Space Remaining
                      </span>
                      <div className="text-lg sm:text-xl font-serif font-bold text-emerald-700">
                        {formatBytes(supabaseStorageStats.bytesRemaining)} left
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{supabaseStorageStats.percentRemaining.toFixed(4)}% available</span>
                      </span>
                    </div>
                  </div>

                  {/* Storage Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full bg-[#dbe7f0] rounded-full h-3 overflow-hidden p-0.5 border border-[#c8d7e3]">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out min-w-[6px]"
                        style={{ width: `${Math.max(0.5, supabaseStorageStats.percentUsed)}%` }}
                        title={`${supabaseStorageStats.percentUsed.toFixed(4)}% used`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#506173] font-mono">
                      <span>0 MB</span>
                      <span className="font-sans font-semibold text-[#18232c]">
                        {supabaseStorageStats.percentUsed < 0.001 ? '< 0.001%' : `${supabaseStorageStats.percentUsed.toFixed(3)}%`} consumed
                      </span>
                      <span>500 MB (Free Plan)</span>
                    </div>
                  </div>

                  {/* Detailed Storage Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-[#c8d7e3] space-y-1">
                      <span className="font-bold text-[#506173] text-[11px] uppercase block">
                        Event Configuration Table
                      </span>
                      <p className="font-mono text-sm font-bold text-[#18232c]">
                        {formatBytes(supabaseStorageStats.eventConfigBytes)}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#506173] pt-0.5">
                        <span>Table: event_config (1 row)</span>
                        <span className="text-emerald-700 font-semibold">{((supabaseStorageStats.eventConfigBytes / supabaseStorageStats.maxDatabaseBytes) * 100).toFixed(3)}% of DB</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-[#c8d7e3] space-y-1">
                      <span className="font-bold text-[#506173] text-[11px] uppercase block">
                        Guest Roster Table
                      </span>
                      <p className="font-mono text-sm font-bold text-[#18232c]">
                        {formatBytes(supabaseStorageStats.guestsTotalBytes)}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#506173] pt-0.5">
                        <span>{supabaseStorageStats.guestsCount} guest rows</span>
                        <span className="text-slate-700 font-medium">Avg ~{formatBytes(supabaseStorageStats.avgGuestRecordBytes)} / guest</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-[#c8d7e3] space-y-1">
                      <span className="font-bold text-[#506173] text-[11px] uppercase block">
                        Guestbook Wishes Table
                      </span>
                      <p className="font-mono text-sm font-bold text-[#18232c]">
                        {formatBytes(supabaseStorageStats.guestbookTotalBytes)}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#506173] pt-0.5">
                        <span>{supabaseStorageStats.guestbookCount} wishes & notes</span>
                        <span className="text-slate-700 font-medium">Avg ~{formatBytes(supabaseStorageStats.avgGuestbookRecordBytes)} / wish</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Operational Quotas & Inactivity Keep-Alive Monitor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-serif font-bold text-xs uppercase tracking-wider text-[#18232c] flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-[#3A5A74]" />
                      <span>Supabase Free Tier Operations & Egress Bandwidth</span>
                    </h6>

                    <div className="flex items-center gap-2 text-[11px] text-[#506173]">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Inactivity Auto-Pause: <strong>{inactivityCountdown.formatted}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Monthly Egress */}
                    <div className="p-4 rounded-xl bg-white border border-[#c8d7e3] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                          Monthly Egress (Bandwidth)
                        </span>
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {((supabaseUsage.estimatedEgressBytes / SUPABASE_FREE_LIMITS.monthlyEgressBytes) * 100).toFixed(2)}% Used
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-serif font-bold text-[#18232c]">
                            {formatBytes(supabaseUsage.estimatedEgressBytes)}
                          </span>
                          <span className="text-xs font-mono text-[#506173]">
                            / 5.00 GB / month
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          {formatBytes(Math.max(0, SUPABASE_FREE_LIMITS.monthlyEgressBytes - supabaseUsage.estimatedEgressBytes))} bandwidth remaining
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-sky-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(1, (supabaseUsage.estimatedEgressBytes / SUPABASE_FREE_LIMITS.monthlyEgressBytes) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#506173] font-serif italic">
                        Outbound data transferred via Supabase PostgREST API when syncing records.
                      </p>
                    </div>

                    {/* REST Operations */}
                    <div className="p-4 rounded-xl bg-white border border-[#c8d7e3] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                          REST Operations (Daily)
                        </span>
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Uncapped (Fair Use)
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-serif font-bold text-[#18232c]">
                            {(supabaseUsage.reads + supabaseUsage.writes + supabaseUsage.deletes).toLocaleString()}
                          </span>
                          <span className="text-xs font-mono text-[#506173]">
                            requests today
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                          {supabaseUsage.reads} reads, {supabaseUsage.writes} writes, {supabaseUsage.deletes} deletes
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(1, ((supabaseUsage.reads + supabaseUsage.writes) / 1000) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#506173] font-serif italic">
                        SELECT queries, RSVP mutations, and dual-write mirror transactions.
                      </p>
                    </div>

                    {/* 7-Day Inactivity Auto-Pause Monitor */}
                    <div className="p-4 rounded-xl bg-white border border-[#c8d7e3] space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#506173]">
                          7-Day Inactivity Monitor
                        </span>
                        <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${
                          inactivityCountdown.isCloseToPause
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {inactivityCountdown.isCloseToPause ? 'Action Recommended' : 'Database Warm'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-serif font-bold text-[#18232c]">
                            {inactivityCountdown.formatted}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#506173] font-medium mt-0.5">
                          Free Supabase projects pause after 7 days without queries.
                        </p>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleKeepAlivePing}
                          disabled={isSendingPing || !supabaseConfig.supabaseUrl}
                          className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold border border-emerald-200 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                          title="Sends a lightweight probe query to reset the 7-day inactivity pause clock"
                        >
                          <RefreshCw className={`w-3 h-3 text-emerald-700 ${isSendingPing ? 'animate-spin' : ''}`} />
                          <span>{isSendingPing ? 'Pinging Database...' : 'Send Keep-Alive Ping'}</span>
                        </button>
                      </div>
                      {pingNotice && (
                        <p className="text-[10px] text-emerald-700 font-serif italic text-center">
                          {pingNotice}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reset / Telemetry Info Bar */}
                  <div className="p-3 bg-[#ebf2f7]/70 rounded-xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#475569]">
                      <Info className="w-4 h-4 text-[#3A5A74] shrink-0" />
                      <span>
                        Session tally: <strong>{supabaseUsage.sessionReads}</strong> reads, <strong>{supabaseUsage.sessionWrites}</strong> writes, <strong>{supabaseUsage.sessionDeletes}</strong> deletes since opening app.
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResetSupabaseCounters}
                        className="text-[#3A5A74] hover:text-[#18232c] underline text-xs font-semibold cursor-pointer"
                      >
                        Reset Session Counters
                      </button>
                      <span className="text-[#c8d7e3]">|</span>
                      <a
                        href={supabaseProjectRef ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/settings/billing/usage` : "https://supabase.com/dashboard/project/_/settings/billing/usage"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#3A5A74] hover:underline"
                      >
                        <span>View Supabase Telemetry Graph</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supabase Configuration Form */}
              <form onSubmit={handleSaveSupabaseConfig} className="bg-[#ffffff] rounded-2xl border border-[#c8d7e3] p-5 sm:p-6 shadow-xs space-y-6">
                <div className="border-b border-[#e2ecf4] pb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                      <Server className="w-4 h-4 text-emerald-600" />
                      <span>Supabase Credentials & Redundancy Policy</span>
                    </h5>
                    <p className="text-xs text-[#506173] font-serif italic mt-0.5">
                      Paste your Supabase Project URL and Anon API key to enable live failover and active replica mirroring.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                    {supabaseConfig.supabaseUrl ? 'Credentials Saved' : 'Scaffolding Ready'}
                  </span>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                  {/* Supabase Project URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-serif font-bold text-xs sm:text-sm text-[#18232c] flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Supabase Project URL</span>
                      </label>
                      {supabaseConfig.supabaseUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(supabaseConfig.supabaseUrl, 'supaUrl')}
                          className="text-xs font-serif text-[#3A5A74] hover:underline flex items-center gap-1"
                        >
                          {copiedField === 'supaUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'supaUrl' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={isSupabasePrivacyMasked ? 'password' : 'text'}
                        value={supabaseConfig.supabaseUrl}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, supabaseUrl: e.target.value })}
                        placeholder="https://your-project-id.supabase.co"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#c8d7e3] bg-[#f8fafc] text-[#18232c] text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3A5A74] transition"
                      />
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic">
                      Found in Supabase Project Settings → API → Project URL.
                    </p>
                  </div>

                  {/* Supabase Anon Public API Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-serif font-bold text-xs sm:text-sm text-[#18232c] flex items-center space-x-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Supabase Anon Public API Key</span>
                      </label>
                      {supabaseConfig.supabaseAnonKey && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(supabaseConfig.supabaseAnonKey, 'supaKey')}
                          className="text-xs font-serif text-[#3A5A74] hover:underline flex items-center gap-1"
                        >
                          {copiedField === 'supaKey' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'supaKey' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={isSupabasePrivacyMasked ? 'password' : 'text'}
                        value={supabaseConfig.supabaseAnonKey}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, supabaseAnonKey: e.target.value })}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full px-4 py-2.5 rounded-xl border border-[#c8d7e3] bg-[#f8fafc] text-[#18232c] text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3A5A74] transition"
                      />
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic">
                      Found in Supabase Project Settings → API → Project API Keys (anon / public). Safe for browser usage.
                    </p>
                  </div>

                  {/* Redundancy Mode Selector */}
                  <div className="space-y-2 pt-2">
                    <label className="font-serif font-bold text-xs sm:text-sm text-[#18232c] flex items-center space-x-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Redundancy & Failover Strategy</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Option 1: Automatic Failover */}
                      <button
                        type="button"
                        onClick={() => setSupabaseConfig({ ...supabaseConfig, mode: 'failover' })}
                        className={`p-4 rounded-xl border text-left transition space-y-1.5 ${
                          supabaseConfig.mode === 'failover'
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                            : 'bg-[#f8fafc] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs sm:text-sm text-[#18232c]">
                            Automatic Failover
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-100 text-emerald-800">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569] font-serif leading-relaxed">
                          Firestore is primary. If Firestore drops or quota limits are reached, reads and writes seamlessly switch to Supabase.
                        </p>
                      </button>

                      {/* Option 2: Dual-Write Mirroring */}
                      <button
                        type="button"
                        onClick={() => setSupabaseConfig({ ...supabaseConfig, mode: 'mirror' })}
                        className={`p-4 rounded-xl border text-left transition space-y-1.5 ${
                          supabaseConfig.mode === 'mirror'
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                            : 'bg-[#f8fafc] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs sm:text-sm text-[#18232c]">
                            Dual-Write Mirroring
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-sky-100 text-sky-800">
                            Active-Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569] font-serif leading-relaxed">
                          Every RSVP, seat change, and guestbook greeting writes to both Firestore and Supabase simultaneously.
                        </p>
                      </button>

                      {/* Option 3: Disabled */}
                      <button
                        type="button"
                        onClick={() => setSupabaseConfig({ ...supabaseConfig, mode: 'disabled' })}
                        className={`p-4 rounded-xl border text-left transition space-y-1.5 ${
                          supabaseConfig.mode === 'disabled'
                            ? 'bg-slate-100 border-slate-400 shadow-xs ring-1 ring-slate-300'
                            : 'bg-[#f8fafc] border-[#c8d7e3] hover:bg-[#ebf2f7]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs sm:text-sm text-[#18232c]">
                            Firestore Only
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-200 text-slate-700">
                            Standby
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569] font-serif leading-relaxed">
                          Keeps your Supabase credentials safely stored in scaffolding, but does not dispatch queries.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2ecf4]">
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Redundancy Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMirrorToSupabase}
                      disabled={isMirroringToSupabase || !supabaseConfig.supabaseUrl}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold border border-emerald-300 transition flex items-center space-x-1.5 disabled:opacity-50"
                      title="Push existing configuration, guest lists, and guestbook entries to Supabase"
                    >
                      {isMirroringToSupabase ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                      )}
                      <span>{isMirroringToSupabase ? 'Mirroring Data...' : 'Mirror All Data Now'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase || !supabaseConfig.supabaseUrl}
                    className="px-4 py-2.5 bg-[#f8fafc] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs sm:text-sm font-semibold border border-[#c8d7e3] transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>Test Supabase Connection</span>
                  </button>
                </div>
              </form>

              {/* Ready-to-Deploy SQL Schema Box */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#c8d7e3] p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ecf4] pb-3">
                  <div>
                    <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base flex items-center space-x-2">
                      <Code className="w-4 h-4 text-emerald-600" />
                      <span>Supabase PostgreSQL Schema & Security Rules</span>
                    </h5>
                    <p className="text-xs text-[#506173] font-serif italic mt-0.5">
                      Copy and run this SQL script in your Supabase SQL Editor to set up all 3 tables with Row Level Security.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold border border-emerald-300 transition flex items-center space-x-1.5"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                      <span>{copiedSql ? '✓ Copied SQL!' : 'Copy SQL Schema'}</span>
                    </button>

                    <a
                      href="https://supabase.com/dashboard/project/_/sql"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-[#f8fafc] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs font-semibold border border-[#c8d7e3] transition flex items-center space-x-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open SQL Editor</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsSqlSchemaExpanded(!isSqlSchemaExpanded)}
                      className="px-3 py-1.5 text-xs text-[#506173] hover:text-[#18232c] underline"
                    >
                      {isSqlSchemaExpanded ? 'Collapse' : 'Preview SQL'}
                    </button>
                  </div>
                </div>

                {/* Expandable SQL Code Box */}
                {isSqlSchemaExpanded && (
                  <div className="relative">
                    <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto max-h-72 border border-slate-700 leading-relaxed">
                      {generateSupabaseSqlSchema()}
                    </pre>
                  </div>
                )}
              </div>

              {/* 3-Step Setup Guide */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#c8d7e3] p-5 sm:p-6 shadow-xs space-y-4">
                <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base flex items-center space-x-2">
                  <Info className="w-4 h-4 text-[#3A5A74]" />
                  <span>How to connect your Supabase database in 3 minutes</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#334155]">
                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">1</span>
                      <span>Create Supabase Project</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Visit <strong>supabase.com</strong>, click <strong>New Project</strong>, give it a name (e.g., <em>Wedding Replica</em>), and choose a nearby region.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
                      <span>Paste & Run Schema</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Click <strong>SQL Editor</strong> in Supabase, click <strong>Copy SQL Schema</strong> above, paste it in, and click <strong>Run</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">3</span>
                      <span>Save & Mirror</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Copy the <strong>Project URL</strong> and <strong>Anon Key</strong> into the fields above, click <strong>Save</strong>, then click <strong>Mirror All Data Now</strong>!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMAGEKIT & CLOUD STORAGE */}
          {activeTab === 'imagekit' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Banner */}
              <div className="p-4 sm:p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-sky-600" />
                    <span>ImageKit.io Cloud Storage & Account Settings</span>
                  </h4>
                  <p className="text-[#475569] text-xs sm:text-sm font-serif italic mt-0.5">
                    Configure, test, or replace your ImageKit.io API keys for unlimited invitation card CDN delivery.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={checkImageKitStatus}
                    disabled={isCheckingImageKit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    title="Refresh connection status from server"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingImageKit ? 'animate-spin' : ''}`} />
                    <span>{isCheckingImageKit ? 'Checking...' : 'Refresh Status'}</span>
                  </button>
                </div>
              </div>

              {/* Status Card */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#3A5A74]" />
                      <span>ImageKit Active Connection Status</span>
                    </h5>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      Current server-side upload configuration and verification state.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-xl border bg-[#f8fafc] border-[#c8d7e3] space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#506173]">Account Status</span>
                    <div className="pt-1">
                      {imageKitStatus?.configured ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>Connected & Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Not Configured</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-[#f8fafc] border-[#c8d7e3] space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#506173]">Credential Source</span>
                    <div className="text-sm font-semibold text-[#18232c] pt-1">
                      {imageKitStatus?.source === 'cloud' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                          <Database className="w-3.5 h-3.5" />
                          <span>Cloud Firestore (Saved Permanently)</span>
                        </span>
                      ) : imageKitStatus?.source === 'custom' ? (
                        <span className="inline-flex items-center gap-1 text-sky-800 font-semibold">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Server & Cloud Storage</span>
                        </span>
                      ) : imageKitStatus?.source === 'local' ? (
                        <span className="inline-flex items-center gap-1 text-indigo-800 font-semibold">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Browser Storage (Static / Netlify)</span>
                        </span>
                      ) : imageKitStatus?.source === 'env' ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Code className="w-3.5 h-3.5" />
                          <span>Server Environment (.env)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None configured</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-[#f8fafc] border-[#c8d7e3] space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#506173]">Private Key State</span>
                    <div className="pt-1 font-mono text-xs text-[#18232c] truncate">
                      {imageKitStatus?.hasPrivateKey ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          <span>{imageKitStatus.maskedPrivateKey || 'Key stored securely'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No key active</span>
                      )}
                    </div>
                  </div>
                </div>

                {imageKitStatus?.urlEndpoint && (
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                    <span><strong>Active CDN URL-endpoint:</strong> <code className="font-mono">{imageKitStatus.urlEndpoint}</code></span>
                  </div>
                )}
              </div>

              {/* Notifications */}
              {ikSaveResult && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  ikSaveResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  {ikSaveResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <span>{ikSaveResult.message}</span>
                </div>
              )}

              {ikTestResult && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  ikTestResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  {ikTestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <span>{ikTestResult.message}</span>
                </div>
              )}

              {/* Credential Form */}
              <form onSubmit={handleSaveImageKit} className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-5">
                <div className="border-b border-[#c8d7e3] pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#3A5A74]" />
                      <span>Update ImageKit Credentials</span>
                    </h5>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      Enter your ImageKit API credentials below. Changes take effect immediately for all invitation card uploads.
                    </p>
                  </div>

                  {(imageKitStatus?.hasPrivateKey || ikPublicKey || ikPrivateKey || ikUrlEndpoint || imageKitStatus?.configured) && (
                    <button
                      type="button"
                      onClick={handleResetImageKit}
                      disabled={ikIsResetting || ikIsSaving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition disabled:opacity-50"
                      title="Permanently remove all ImageKit keys from Cloud Firestore, Server, and Local Storage"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${ikIsResetting ? 'animate-spin' : ''}`} />
                      <span>{ikIsResetting ? 'Deleting...' : 'Delete / Clear Credentials'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* 1. Public Key */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        IMAGEKIT_PUBLIC_KEY
                      </label>
                      <span className="text-[11px] text-[#475569] font-sans">Required for client authentication</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={ikPublicKey}
                        onChange={(e) => setIkPublicKey(e.target.value)}
                        placeholder="e.g. public_xxxxxxxxxxxxxxxxxxxxxxxxxx="
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-[#3A5A74] focus:outline-hidden"
                      />
                      {ikPublicKey && (
                        <button
                          type="button"
                          onClick={() => setIkPublicKey('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                          title="Clear Public Key"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      Your public key from ImageKit.io Developer Options → API Keys.
                    </p>
                  </div>

                  {/* 2. Private Key */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        IMAGEKIT_PRIVATE_KEY
                      </label>
                      <div className="flex items-center gap-2">
                        {imageKitStatus?.hasPrivateKey && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Saved in Cloud & Server</span>
                          </span>
                        )}
                        <span className="text-[11px] text-amber-800 font-sans font-medium">Confidential</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type={ikShowPrivateKey ? 'text' : 'password'}
                        value={ikPrivateKey}
                        onChange={(e) => setIkPrivateKey(e.target.value)}
                        placeholder={
                          imageKitStatus?.maskedPrivateKey
                            ? `Enter new private key (Current: ${imageKitStatus.maskedPrivateKey})`
                            : 'e.g. private_xxxxxxxxxxxxxxxxxxxxxxxxxx='
                        }
                        className="w-full pl-3.5 pr-16 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-[#3A5A74] focus:outline-hidden"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-[#475569]">
                        {ikPrivateKey && (
                          <button
                            type="button"
                            onClick={() => setIkPrivateKey('')}
                            className="p-1 text-slate-400 hover:text-slate-600 transition"
                            title="Clear Private Key"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIkShowPrivateKey(!ikShowPrivateKey)}
                          className="p-1 hover:text-[#18232c] transition"
                          title={ikShowPrivateKey ? 'Hide Private Key' : 'Show Private Key'}
                        >
                          {ikShowPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      Saved permanently in Cloud Firestore & Server. Click the eye icon to view or edit.
                    </p>
                  </div>

                  {/* 3. URL Endpoint */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        IMAGEKIT_URL_ENDPOINT
                      </label>
                      <span className="text-[11px] text-[#475569] font-sans">CDN Delivery Base</span>
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={ikUrlEndpoint}
                        onChange={(e) => setIkUrlEndpoint(e.target.value)}
                        placeholder="e.g. https://ik.imagekit.io/your_imagekit_id"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-[#3A5A74] focus:outline-hidden"
                      />
                      {ikUrlEndpoint && (
                        <button
                          type="button"
                          onClick={() => setIkUrlEndpoint('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                          title="Clear URL Endpoint"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      Your account's unique URL-endpoint where your high-res cards are hosted.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#c8d7e3] flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleTestImageKit}
                    disabled={ikIsTesting || (!ikPrivateKey.trim() && !imageKitStatus?.hasPrivateKey)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3] transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    {ikIsTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>{ikIsTesting ? 'Pinging ImageKit API...' : 'Test Connection'}</span>
                  </button>

                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    {(imageKitStatus?.hasPrivateKey || ikPublicKey || ikPrivateKey || ikUrlEndpoint || imageKitStatus?.configured) && (
                      <button
                        type="button"
                        onClick={handleResetImageKit}
                        disabled={ikIsSaving || ikIsResetting}
                        className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                        title="Permanently remove all ImageKit keys from Cloud Firestore, Server, and Local Storage"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>{ikIsResetting ? 'Deleting...' : 'Delete / Clear Credentials'}</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={ikIsSaving || ikIsResetting}
                      className="px-6 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-md border border-[#4D708E] flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ikIsSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-200" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-sky-200" />
                      )}
                      <span>
                        {ikIsSaving
                          ? 'Saving & Applying...'
                          : (!ikPublicKey.trim() && !ikPrivateKey.trim() && !ikUrlEndpoint.trim() && imageKitStatus?.hasPrivateKey)
                            ? 'Save & Apply (Delete Credentials)'
                            : 'Save & Apply'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Helpful Setup Guide */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-4">
                <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#3A5A74]" />
                  <span>How to find your ImageKit.io credentials</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#334155]">
                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#3A5A74] text-white flex items-center justify-center text-[11px]">1</span>
                      <span>Create Free Account</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Visit <strong>imagekit.io</strong> and log in. Free tier gives 20 GB bandwidth and unlimited media storage.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#3A5A74] text-white flex items-center justify-center text-[11px]">2</span>
                      <span>Copy API Keys</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Go to <strong>Developer Options → API Keys</strong>. Copy your <em>Public Key</em>, <em>Private Key</em>, and <em>URL-endpoint</em>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#3A5A74] text-white flex items-center justify-center text-[11px]">3</span>
                      <span>Paste & Apply</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Paste the keys above, click <strong>Save & Apply</strong>, and upload cards in the Invitation Slideshow directly to the CDN!
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-[#506173]">
                  <span>Need to manage or delete files on ImageKit directly?</span>
                  <a
                    href="https://imagekit.io/dashboard/developer/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#3A5A74] hover:underline font-semibold"
                  >
                    <span>Open ImageKit Developer Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLOUDFLARE R2 & VIDEO STORAGE */}
          {activeTab === 'r2' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Banner */}
              <div className="p-4 sm:p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                    <Video className="w-5 h-5 text-amber-600" />
                    <span>Cloudflare R2 Cloud Storage & Account Settings</span>
                  </h4>
                  <p className="text-[#475569] text-xs sm:text-sm font-serif italic mt-0.5">
                    Configure, test, or replace your Cloudflare R2 API credentials for high-resolution keepsake video blessings with zero egress fees.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={checkCloudflareR2Status}
                    disabled={isCheckingR2}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    title="Refresh R2 connection status from server"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingR2 ? 'animate-spin' : ''}`} />
                    <span>{isCheckingR2 ? 'Checking...' : 'Refresh Status'}</span>
                  </button>
                </div>
              </div>

              {/* Status Card */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#c8d7e3] pb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Cloudflare R2 Active Connection Status</span>
                    </h5>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      Current server-side S3-compatible storage configuration and verification state.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-xl border bg-[#f8fafc] border-[#c8d7e3] space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#506173]">Account Status</span>
                    <div className="pt-1">
                      {r2Status?.configured ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>Connected & Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Not Configured</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-[#f8fafc] border-[#c8d7e3] space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#506173]">Credential Source</span>
                    <div className="text-sm font-semibold text-[#18232c] pt-1">
                      {r2Status?.source === 'cloud' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                          <Database className="w-3.5 h-3.5" />
                          <span>Cloud Firestore (Saved Permanently)</span>
                        </span>
                      ) : r2Status?.source === 'custom' ? (
                        <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Server & Cloud Storage</span>
                        </span>
                      ) : r2Status?.source === 'local' ? (
                        <span className="inline-flex items-center gap-1 text-indigo-800 font-semibold">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Browser Storage (Static / Local)</span>
                        </span>
                      ) : r2Status?.source === 'env' ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Code className="w-3.5 h-3.5" />
                          <span>Server Environment (.env)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None configured</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-[#f8fafc] border-[#c8d7e3] space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#506173]">Secret Key State</span>
                    <div className="pt-1 font-mono text-xs text-[#18232c] truncate">
                      {r2Status?.hasSecretAccessKey ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          <span>{r2Status.maskedSecretAccessKey || 'Key stored securely'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No key active</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Target Bucket:</strong> <code className="font-mono">{r2BucketName || r2Status?.bucketName || 'wedding-videos'}</code></span>
                  </div>

                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="truncate"><strong>Public CDN Domain:</strong> <code className="font-mono">{r2PublicUrl || r2Status?.publicUrl || 'https://pub-9426f4fce849e75ba9560f855a882cb0.r2.dev'}</code></span>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              {r2SaveResult && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  r2SaveResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  {r2SaveResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <span>{r2SaveResult.message}</span>
                </div>
              )}

              {r2TestResult && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  r2TestResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  {r2TestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <span>{r2TestResult.message}</span>
                </div>
              )}

              {/* Credential Form */}
              <form onSubmit={handleSaveR2} className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-5">
                <div className="border-b border-[#c8d7e3] pb-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Update Cloudflare R2 Credentials</span>
                    </h5>
                    <p className="text-xs text-[#475569] mt-0.5 font-serif italic">
                      Enter your Cloudflare R2 S3-compatible API credentials below. Changes take effect immediately for all video uploads and streaming.
                    </p>
                  </div>

                  {(r2Status?.hasSecretAccessKey || r2AccountId || r2AccessKeyId || r2SecretAccessKey || r2BucketName || r2Status?.configured) && (
                    <button
                      type="button"
                      onClick={handleResetR2}
                      disabled={r2IsResetting || r2IsSaving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition disabled:opacity-50"
                      title="Permanently remove all R2 keys from Cloud Firestore, Server, and Local Storage"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${r2IsResetting ? 'animate-spin' : ''}`} />
                      <span>{r2IsResetting ? 'Deleting...' : 'Delete / Clear Credentials'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* 1. Account ID */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        R2_ACCOUNT_ID
                      </label>
                      <span className="text-[11px] text-[#475569] font-sans">Cloudflare 32-character Hex Account ID</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={r2AccountId}
                        onChange={(e) => setR2AccountId(e.target.value)}
                        placeholder="e.g. 9426f4fce849e75ba9560f855a882cb0"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      {r2AccountId && (
                        <button
                          type="button"
                          onClick={() => setR2AccountId('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                          title="Clear Account ID"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      Located in Cloudflare Dashboard URL or right sidebar under &ldquo;Account ID&rdquo;.
                    </p>
                  </div>

                  {/* 2. Access Key ID */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        R2_ACCESS_KEY_ID
                      </label>
                      <span className="text-[11px] text-[#475569] font-sans">S3-Compatible Access Key</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={r2AccessKeyId}
                        onChange={(e) => setR2AccessKeyId(e.target.value)}
                        placeholder="e.g. 65e6cb7bc4db4e0b5f13426e680a6d09"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      {r2AccessKeyId && (
                        <button
                          type="button"
                          onClick={() => setR2AccessKeyId('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                          title="Clear Access Key ID"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      Generated from Cloudflare R2 &rarr; Manage R2 API Tokens.
                    </p>
                  </div>

                  {/* 3. Secret Access Key */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        R2_SECRET_ACCESS_KEY
                      </label>
                      <div className="flex items-center gap-2">
                        {r2Status?.hasSecretAccessKey && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Saved in Cloud & Server</span>
                          </span>
                        )}
                        <span className="text-[11px] text-amber-800 font-sans font-medium">Confidential</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type={r2ShowSecretKey ? 'text' : 'password'}
                        value={r2SecretAccessKey}
                        onChange={(e) => setR2SecretAccessKey(e.target.value)}
                        placeholder={
                          r2Status?.maskedSecretAccessKey
                            ? `Enter new secret key (Current: ${r2Status.maskedSecretAccessKey})`
                            : 'Enter R2 Secret Access Key'
                        }
                        className="w-full pl-3.5 pr-16 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-[#475569]">
                        {r2SecretAccessKey && (
                          <button
                            type="button"
                            onClick={() => setR2SecretAccessKey('')}
                            className="p-1 text-slate-400 hover:text-slate-600 transition"
                            title="Clear Secret Key"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setR2ShowSecretKey(!r2ShowSecretKey)}
                          className="p-1 hover:text-[#18232c] transition"
                          title={r2ShowSecretKey ? 'Hide Secret Key' : 'Show Secret Key'}
                        >
                          {r2ShowSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      Saved permanently in Cloud Firestore & Server. Never exposed to unauthorized clients.
                    </p>
                  </div>

                  {/* 4. Bucket Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        R2_BUCKET_NAME
                      </label>
                      <span className="text-[11px] text-[#475569] font-sans">Storage Container</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={r2BucketName}
                        onChange={(e) => setR2BucketName(e.target.value)}
                        placeholder="e.g. wedding-videos"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      {r2BucketName && (
                        <button
                          type="button"
                          onClick={() => setR2BucketName('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                          title="Clear Bucket Name"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      The name of your R2 bucket created in Cloudflare (e.g. wedding-videos).
                    </p>
                  </div>

                  {/* 5. Public URL Domain */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#506173]">
                        R2_PUBLIC_URL
                      </label>
                      <span className="text-[11px] text-[#475569] font-sans">Public Streaming URL / r2.dev</span>
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={r2PublicUrl}
                        onChange={(e) => setR2PublicUrl(e.target.value)}
                        placeholder="e.g. https://pub-xxxxxxxxxxxx.r2.dev or https://videos.yourwedding.com"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-[#ffffff] border border-[#c8d7e3] text-sm text-[#18232c] font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      {r2PublicUrl && (
                        <button
                          type="button"
                          onClick={() => setR2PublicUrl('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                          title="Clear Public URL"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#506173] font-serif italic mt-1">
                      Enable &ldquo;Public access&rdquo; on your bucket (or connect custom domain) to get this URL for video streaming.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#c8d7e3] flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleTestR2}
                    disabled={r2IsTesting || (!r2SecretAccessKey.trim() && !r2Status?.hasSecretAccessKey)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3] transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    {r2IsTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>{r2IsTesting ? 'Pinging Cloudflare R2...' : 'Test Connection'}</span>
                  </button>

                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    {(r2Status?.hasSecretAccessKey || r2AccountId || r2AccessKeyId || r2SecretAccessKey || r2BucketName || r2Status?.configured) && (
                      <button
                        type="button"
                        onClick={handleResetR2}
                        disabled={r2IsSaving || r2IsResetting}
                        className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                        title="Permanently remove all R2 keys from Cloud Firestore, Server, and Local Storage"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>{r2IsResetting ? 'Deleting...' : 'Delete / Clear Credentials'}</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={r2IsSaving || r2IsResetting}
                      className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-md border border-amber-800 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {r2IsSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-amber-200" />
                      )}
                      <span>
                        {r2IsSaving
                          ? 'Saving & Applying...'
                          : (!r2AccountId.trim() && !r2AccessKeyId.trim() && !r2SecretAccessKey.trim() && r2Status?.hasSecretAccessKey)
                            ? 'Save & Apply (Delete Credentials)'
                            : 'Save & Apply'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Helpful Setup Guide */}
              <div className="p-5 sm:p-6 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs space-y-4">
                <h5 className="font-serif font-bold text-[#18232c] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>How to set up Cloudflare R2 for guest video blessings</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#334155]">
                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">1</span>
                      <span>Create R2 Bucket</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Log into <strong>dash.cloudflare.com</strong> &rarr; <strong>R2 Object Storage</strong> &rarr; Click <strong>Create Bucket</strong> (e.g. <code>wedding-videos</code>).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">2</span>
                      <span>Generate API Tokens</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Click <strong>Manage R2 API Tokens</strong> &rarr; <strong>Create API Token</strong> with <em>Object Read &amp; Write</em> permission. Copy the <strong>Access Key ID</strong> &amp; <strong>Secret Access Key</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#ebf2f7]/60 border border-[#c8d7e3] space-y-1.5">
                    <div className="font-bold text-[#18232c] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">3</span>
                      <span>Enable Public Access</span>
                    </div>
                    <p className="font-serif leading-relaxed text-[#475569]">
                      Under bucket <strong>Settings &rarr; Public Access</strong>, enable the <code>r2.dev</code> subdomain or connect your custom domain to allow video playback.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-[#506173]">
                  <span>Need to manage or view stored videos directly on Cloudflare?</span>
                  <a
                    href="https://dash.cloudflare.com/?to=/:account/r2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-800 hover:underline font-semibold"
                  >
                    <span>Open Cloudflare R2 Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CODEBASE PRESETS & BACKUP SUITE (DEDICATED FULL VIEW) */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 sm:p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif font-bold text-[#18232c] text-base sm:text-lg flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-emerald-700" />
                    <span>Codebase Presets & Backup Suite</span>
                  </h4>
                  <p className="text-xs text-[#506173] mt-0.5">
                    Authoritative Cloud & Account Settings inclusion: Firebase Provisioned Project, Supabase Redundancy Policy, and ImageKit Credentials.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                    3/3 Cloud Services Synchronized
                  </span>
                </div>
              </div>

              {renderPresetsAndBackupSuite(true)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#ffffff] border-t border-[#c8d7e3] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-[#506173] font-serif">
            <span>❦</span>
            <span className="italic">All changes take effect immediately across all guests and connected devices.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>

      {/* RESTORE PREVIEW & CONFIRMATION MODAL */}
      {restoreModalData.isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base sm:text-lg">Restore JSON Backup</h4>
                  <p className="text-xs text-slate-400">
                    {restoreModalData.rawFileName || 'Snapshot restoration review'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModalData(prev => ({ ...prev, isOpen: false, resultNotice: null }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* If Result Notice is active */}
              {restoreModalData.resultNotice ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border ${
                      restoreModalData.resultNotice.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold mb-2">
                      {restoreModalData.resultNotice.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                      <span className="text-sm sm:text-base">
                        {restoreModalData.resultNotice.message}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs pl-7">
                      {restoreModalData.resultNotice.details.map((d, i) => (
                        <p key={i} className="leading-relaxed">
                          {d}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    {restoreModalData.resultNotice.success && (
                      <button
                        type="button"
                        onClick={() => {
                          setRestoreModalData(prev => ({ ...prev, isOpen: false, resultNotice: null }));
                          setActiveTab('supabase');
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 shadow-xs"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>View Restored Supabase Settings</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRestoreModalData(prev => ({ ...prev, isOpen: false, resultNotice: null }))}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Inspection & Confirmation Stage */
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider block">
                        Snapshot Inspection Summary
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                        {restoreModalData.parsed?.formatType === 'presets_file' 
                          ? 'TypeScript Presets File' 
                          : restoreModalData.parsed?.formatType === 'cloud_settings_block' 
                            ? 'Cloud Settings Code' 
                            : restoreModalData.parsed?.formatType === 'event_config_block'
                              ? 'Event Details Snippet'
                              : 'JSON Snapshot'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">Wedding Details:</span>
                        <span className="font-semibold text-slate-800">
                          {restoreModalData.parsed?.summary.title || (restoreModalData.parsed?.hasEventConfig ? 'Event Details Included' : 'Retained Existing')}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">Guest List & Seating:</span>
                        <span className="font-semibold text-slate-800">
                          {restoreModalData.parsed?.summary.guestsCount ? `${restoreModalData.parsed.summary.guestsCount} guests found` : 'Retained Existing'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">Keepsake Wishes:</span>
                        <span className="font-semibold text-slate-800">
                          {restoreModalData.parsed?.summary.guestbookCount ? `${restoreModalData.parsed.summary.guestbookCount} wishes found` : 'Retained Existing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Supabase Restored Credentials Card */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                        <Database className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Supabase Credentials & Redundancy Policy</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {restoreModalData.parsed?.supabase ? 'Detected in Backup' : 'Not in Snapshot'}
                      </span>
                    </div>

                    {restoreModalData.parsed?.supabase ? (
                      <div className="space-y-1.5 text-xs text-emerald-900">
                        <div className="flex items-center justify-between gap-2 p-2 bg-white/80 rounded-lg border border-emerald-200">
                          <span className="text-slate-600 text-[11px]">Project URL:</span>
                          <span className="font-mono text-xs font-semibold text-slate-800 truncate max-w-[240px]">
                            {restoreModalData.parsed.supabase.supabaseUrl || '(No URL provided in backup)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 p-2 bg-white/80 rounded-lg border border-emerald-200">
                          <span className="text-slate-600 text-[11px]">Public Anon API Key:</span>
                          <span className="font-mono text-xs text-slate-800">
                            {restoreModalData.parsed.supabase.supabaseAnonKey ? '✓ Present & Ready to Activate' : '(No Key provided)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 p-2 bg-white/80 rounded-lg border border-emerald-200">
                          <span className="text-slate-600 text-[11px]">Redundancy Strategy:</span>
                          <span className="font-semibold text-emerald-800">
                            {restoreModalData.parsed.supabase.mode === 'mirror'
                              ? 'Dual-Write Mirroring (Active-Active)'
                              : restoreModalData.parsed.supabase.mode === 'disabled'
                              ? 'Firestore Only (Standby)'
                              : 'Automatic Failover (Recommended)'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">
                        This snapshot does not contain secondary Supabase configurations. Your existing Supabase settings will be retained.
                      </p>
                    )}
                  </div>

                  {/* ImageKit CDN Info */}
                  {restoreModalData.parsed?.imagekit && (
                    <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs space-y-1 text-sky-950">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">ImageKit CDN Settings:</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">Included</span>
                      </div>
                      <p className="font-mono text-[11px] text-sky-800">
                        {restoreModalData.parsed.imagekit.urlEndpoint || 'Endpoint configured'}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 font-serif italic">
                    Restoring will overwrite current in-memory, Firestore, and browser storage with the settings above.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={restoreModalData.isRestoring}
                      onClick={() => setRestoreModalData(prev => ({ ...prev, isOpen: false }))}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={restoreModalData.isRestoring}
                      onClick={handleExecuteRestore}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 shadow-xs"
                    >
                      {restoreModalData.isRestoring ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Restoring Data & Cloud...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm & Restore Snapshot</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIRECT PASTE JSON / PRESETS BACKUP MODAL */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <h4 className="font-serif font-bold text-base sm:text-lg">Paste JSON Backup or Presets Content</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Paste raw JSON snapshot, complete <code className="text-slate-800 font-mono font-semibold">presets.ts</code> file (with import/export statements), or Cloud & Account Settings TypeScript code. Both JSON and TypeScript formats are automatically detected, parsed, and previewed.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.readText) {
                        const clipText = await navigator.clipboard.readText();
                        if (clipText) {
                          setPastedJsonText(clipText);
                          setPasteError(null);
                        }
                      }
                    } catch (e) {
                      console.warn('Clipboard read error:', e);
                    }
                  }}
                  className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 border border-slate-300 shadow-2xs"
                  title="Paste directly from your system clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-slate-600" />
                  <span>Paste from Clipboard</span>
                </button>
              </div>

              <textarea
                value={pastedJsonText}
                onChange={(e) => {
                  setPastedJsonText(e.target.value);
                  if (pasteError) setPasteError(null);
                }}
                placeholder={`// Accepts either JSON snapshots OR presets.ts TypeScript code!
// Example 1: Full presets.ts file (starting with import / export const ...)
import { EventConfig, Guest, CloudAccountSettings } from '../types';
export const INITIAL_CLOUD_SETTINGS: CloudAccountSettings = { ... };

// Example 2: Downloaded JSON Snapshot
{
  "version": "3.0",
  "cloudSettings": { "supabase": { "mode": "mirror" } },
  "eventConfig": { "title": "Mark & Karla Wedding" }
}`}
                className="w-full h-56 p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {pasteError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pasteError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-400 font-mono">
                  {pastedJsonText.length > 0 ? `${pastedJsonText.length.toLocaleString()} characters` : 'Ready for input'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasteModal(false);
                      setPasteError(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePasteRestoreSubmit}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Parse & Review Snapshot</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
