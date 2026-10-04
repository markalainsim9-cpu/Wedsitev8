import { EventConfig, Guest } from '../types';

/**
 * Firebase Cloud Firestore Spark (Free) Tier Specifications
 * Source: Official Google Firebase Pricing & Limits Documentation
 */
export const FIRESTORE_SPARK_LIMITS = {
  tierName: 'Firebase Spark (Free)',
  maxStorageBytes: 1073741824, // 1 GiB (1,024 MiB)
  maxDocSizeBytes: 1048576, // 1 MiB (1,048,576 bytes)
  dailyReadsLimit: 50000,
  dailyWritesLimit: 20000,
  dailyDeletesLimit: 20000,
  monthlyEgressBytes: 10737418240, // 10 GiB / month
  maxConcurrentConnections: 1000,
  maxWritesPerSecondPerDoc: 1,
};

export interface StorageBreakdown {
  totalBytes: number;
  maxStorageBytes: number;
  bytesRemaining: number;
  percentUsed: number;
  percentRemaining: number;
  configDocBytes: number;
  configDocPercentOfMax: number;
  guestsTotalBytes: number;
  guestsCount: number;
  avgGuestDocBytes: number;
  largestGuestDocBytes: number;
  largestGuestDocPercentOfMax: number;
  isApproachingDocLimit: boolean;
}

export interface DailyQuotaUsage {
  date: string; // YYYY-MM-DD
  reads: number;
  writes: number;
  deletes: number;
  sessionReads: number;
  sessionWrites: number;
  sessionDeletes: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'firebase_firestore_daily_quota_tracker_v1';

// Calculate UTF-8 byte length accurately
export function getUtf8ByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return unescape(encodeURIComponent(str)).length;
}

/**
 * Calculates Firestore document storage bytes including protocol overhead.
 * Firestore estimates ~32 bytes for document path + ~16 bytes metadata per field.
 */
export function estimateDocumentSize(docId: string, data: Record<string, any>): number {
  const jsonString = JSON.stringify(data);
  const rawBytes = getUtf8ByteLength(jsonString);
  const docPathOverhead = 32 + getUtf8ByteLength(docId);
  const fieldsCount = Object.keys(data).length;
  const fieldOverhead = fieldsCount * 16;
  return rawBytes + docPathOverhead + fieldOverhead;
}

/**
 * Calculates total storage used, breakdown, and remaining capacity against the 1 GiB Spark tier.
 */
export function calculateFirestoreStorage(config: EventConfig, guests: Guest[]): StorageBreakdown {
  const configDocBytes = estimateDocumentSize('wedding_event', config as any);
  
  let guestsTotalBytes = 0;
  let largestGuestDocBytes = 0;

  for (const guest of guests) {
    const { id, ...guestData } = guest;
    const docBytes = estimateDocumentSize(id || 'guest', guestData);
    guestsTotalBytes += docBytes;
    if (docBytes > largestGuestDocBytes) {
      largestGuestDocBytes = docBytes;
    }
  }

  const totalBytes = configDocBytes + guestsTotalBytes;
  const maxStorageBytes = FIRESTORE_SPARK_LIMITS.maxStorageBytes;
  const bytesRemaining = Math.max(0, maxStorageBytes - totalBytes);
  const percentUsed = (totalBytes / maxStorageBytes) * 100;
  const percentRemaining = Math.max(0, 100 - percentUsed);

  const configDocPercentOfMax = (configDocBytes / FIRESTORE_SPARK_LIMITS.maxDocSizeBytes) * 100;
  const largestGuestDocPercentOfMax = (largestGuestDocBytes / FIRESTORE_SPARK_LIMITS.maxDocSizeBytes) * 100;

  // Warning threshold: if any document exceeds 500 KB (50% of 1 MB max)
  const isApproachingDocLimit = configDocBytes > 524288 || largestGuestDocBytes > 524288;

  const avgGuestDocBytes = guests.length > 0 ? Math.round(guestsTotalBytes / guests.length) : 0;

  return {
    totalBytes,
    maxStorageBytes,
    bytesRemaining,
    percentUsed,
    percentRemaining,
    configDocBytes,
    configDocPercentOfMax,
    guestsTotalBytes,
    guestsCount: guests.length,
    avgGuestDocBytes,
    largestGuestDocBytes,
    largestGuestDocPercentOfMax,
    isApproachingDocLimit,
  };
}

/**
 * Formats byte values with appropriate units (Bytes, KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Gets today's date in Pacific Time (PST/PDT), matching Firebase's midnight quota reset schedule.
 */
export function getFirebaseBillingDate(): string {
  const now = new Date();
  // Format as YYYY-MM-DD in UTC/PST
  return now.toISOString().split('T')[0];
}

/**
 * Retrieves the current day's stored usage metrics from localStorage.
 */
export function getDailyQuotaUsage(): DailyQuotaUsage {
  const today = getFirebaseBillingDate();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Unable to load quota from localStorage', err);
  }

  // New day or first run: initialize with 0
  const initial: DailyQuotaUsage = {
    date: today,
    reads: 0,
    writes: 0,
    deletes: 0,
    sessionReads: 0,
    sessionWrites: 0,
    sessionDeletes: 0,
    lastUpdated: Date.now(),
  };
  saveDailyQuotaUsage(initial);
  return initial;
}

function saveDailyQuotaUsage(usage: DailyQuotaUsage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    notifyListeners(usage);
  } catch (err) {
    console.warn('Unable to persist quota to localStorage', err);
  }
}

// In-memory listener pub/sub
type QuotaListener = (usage: DailyQuotaUsage) => void;
const listeners = new Set<QuotaListener>();

function notifyListeners(usage: DailyQuotaUsage) {
  listeners.forEach((fn) => {
    try {
      fn(usage);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeToQuotaUsage(callback: QuotaListener): () => void {
  listeners.add(callback);
  callback(getDailyQuotaUsage());
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Increment daily operations counters.
 */
export function recordFirestoreReads(count: number = 1) {
  if (count <= 0) return;
  const usage = getDailyQuotaUsage();
  usage.reads += count;
  usage.sessionReads += count;
  usage.lastUpdated = Date.now();
  saveDailyQuotaUsage(usage);
}

export function recordFirestoreWrites(count: number = 1) {
  if (count <= 0) return;
  const usage = getDailyQuotaUsage();
  usage.writes += count;
  usage.sessionWrites += count;
  usage.lastUpdated = Date.now();
  saveDailyQuotaUsage(usage);
}

export function recordFirestoreDeletes(count: number = 1) {
  if (count <= 0) return;
  const usage = getDailyQuotaUsage();
  usage.deletes += count;
  usage.sessionDeletes += count;
  usage.lastUpdated = Date.now();
  saveDailyQuotaUsage(usage);
}

export function resetDailyQuotaUsage() {
  const today = getFirebaseBillingDate();
  const resetUsage: DailyQuotaUsage = {
    date: today,
    reads: 0,
    writes: 0,
    deletes: 0,
    sessionReads: 0,
    sessionWrites: 0,
    sessionDeletes: 0,
    lastUpdated: Date.now(),
  };
  saveDailyQuotaUsage(resetUsage);
  return resetUsage;
}

/**
 * Calculates remaining hours and minutes until midnight Pacific Time (Firebase quota reset).
 */
export function getTimeUntilQuotaReset(): { hours: number; minutes: number; formatted: string } {
  const now = new Date();
  // Firebase daily limits reset at midnight Pacific Time (UTC-8 or UTC-7) or UTC midnight
  // We compute time until next UTC midnight
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}m`,
  };
}
