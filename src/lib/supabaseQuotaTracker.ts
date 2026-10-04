import { EventConfig, Guest, GuestbookEntry } from '../types';
import { getUtf8ByteLength, formatBytes } from './quotaTracker';

/**
 * Supabase Free Tier Specifications
 * Source: Official Supabase Pricing & Platform Limits Documentation
 */
export const SUPABASE_FREE_LIMITS = {
  tierName: 'Supabase Free Tier',
  maxDatabaseBytes: 524288000, // 500 MB PostgreSQL Database Space
  monthlyEgressBytes: 5368709120, // 5 GB Monthly Bandwidth / Network Egress
  storageFileBytes: 1073741824, // 1 GB Storage Buckets
  maxConcurrentConnections: 200, // 200 Direct / Realtime connections
  monthlyRealtimeMessages: 2000000, // 2,000,000 Realtime messages / month
  monthlyAuthMau: 50000, // 50,000 Monthly Active Users
  inactivityPauseDays: 7, // Projects pause after 7 days without queries or API traffic
};

export interface SupabaseStorageBreakdown {
  totalBytes: number;
  maxDatabaseBytes: number;
  bytesRemaining: number;
  percentUsed: number;
  percentRemaining: number;
  eventConfigBytes: number;
  guestsTotalBytes: number;
  guestsCount: number;
  avgGuestRecordBytes: number;
  guestbookTotalBytes: number;
  guestbookCount: number;
  avgGuestbookRecordBytes: number;
  largestRecordBytes: number;
  isApproachingLimit: boolean;
}

export interface SupabaseDailyQuotaUsage {
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  reads: number;
  writes: number;
  deletes: number;
  estimatedEgressBytes: number;
  sessionReads: number;
  sessionWrites: number;
  sessionDeletes: number;
  lastActiveTime: number; // For 7-day inactivity pause tracking
  lastUpdated: number;
}

const SUPABASE_QUOTA_STORAGE_KEY = 'supabase_daily_quota_tracker_v1';

/**
 * Computes estimated PostgreSQL table row size in bytes.
 * PostgreSQL overhead includes:
 * - 24-byte HeapTupleHeaderData + null bitmap + padding (~32 bytes minimum per row)
 * - Primary Key B-Tree Index leaf tuple overhead (~16 bytes per indexed row)
 */
function estimatePostgresRowBytes(data: Record<string, any>): number {
  const jsonStr = JSON.stringify(data);
  const rawDataBytes = getUtf8ByteLength(jsonStr);
  const pgTupleHeader = 32;
  const pkeyIndexOverhead = 16;
  return rawDataBytes + pgTupleHeader + pkeyIndexOverhead;
}

/**
 * Calculates Supabase PostgreSQL database storage usage across tables.
 */
export function calculateSupabaseStorage(
  config: EventConfig,
  guests: Guest[],
  guestbook: GuestbookEntry[] = []
): SupabaseStorageBreakdown {
  // 1. event_config table row size
  const eventConfigBytes = estimatePostgresRowBytes({
    id: 'current',
    ...config,
    updated_at: new Date().toISOString()
  });

  // 2. guests table rows size
  let guestsTotalBytes = 0;
  let largestRecordBytes = eventConfigBytes;

  for (const guest of guests) {
    const rowBytes = estimatePostgresRowBytes(guest as any);
    guestsTotalBytes += rowBytes;
    if (rowBytes > largestRecordBytes) {
      largestRecordBytes = rowBytes;
    }
  }

  // 3. guestbook table rows size
  let guestbookTotalBytes = 0;
  for (const entry of guestbook) {
    const rowBytes = estimatePostgresRowBytes(entry as any);
    guestbookTotalBytes += rowBytes;
    if (rowBytes > largestRecordBytes) {
      largestRecordBytes = rowBytes;
    }
  }

  const totalBytes = eventConfigBytes + guestsTotalBytes + guestbookTotalBytes;
  const maxDatabaseBytes = SUPABASE_FREE_LIMITS.maxDatabaseBytes;
  const bytesRemaining = Math.max(0, maxDatabaseBytes - totalBytes);
  const percentUsed = (totalBytes / maxDatabaseBytes) * 100;
  const percentRemaining = Math.max(0, 100 - percentUsed);

  const avgGuestRecordBytes = guests.length > 0 ? Math.round(guestsTotalBytes / guests.length) : 0;
  const avgGuestbookRecordBytes = guestbook.length > 0 ? Math.round(guestbookTotalBytes / guestbook.length) : 0;

  // Warning threshold: if database usage exceeds 80% (400 MB)
  const isApproachingLimit = percentUsed > 80;

  return {
    totalBytes,
    maxDatabaseBytes,
    bytesRemaining,
    percentUsed,
    percentRemaining,
    eventConfigBytes,
    guestsTotalBytes,
    guestsCount: guests.length,
    avgGuestRecordBytes,
    guestbookTotalBytes,
    guestbookCount: guestbook.length,
    avgGuestbookRecordBytes,
    largestRecordBytes,
    isApproachingLimit
  };
}

/**
 * Gets current billing date format (UTC).
 */
export function getSupabaseBillingDate(): { date: string; month: string } {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const month = date.slice(0, 7);
  return { date, month };
}

/**
 * Retrieves current stored Supabase operational metrics from localStorage.
 */
export function getSupabaseQuotaUsage(): SupabaseDailyQuotaUsage {
  const { date, month } = getSupabaseBillingDate();
  try {
    const raw = localStorage.getItem(SUPABASE_QUOTA_STORAGE_KEY);
    if (raw) {
      const parsed: SupabaseDailyQuotaUsage = JSON.parse(raw);
      // If same day, return
      if (parsed.date === date && parsed.month === month) {
        return parsed;
      }
      // If same month but new day, carry over month's estimated egress
      if (parsed.month === month) {
        return {
          date,
          month,
          reads: 0,
          writes: 0,
          deletes: 0,
          estimatedEgressBytes: parsed.estimatedEgressBytes || 0,
          sessionReads: 0,
          sessionWrites: 0,
          sessionDeletes: 0,
          lastActiveTime: parsed.lastActiveTime || Date.now(),
          lastUpdated: Date.now()
        };
      }
    }
  } catch (err) {
    console.warn('Unable to load Supabase quota from localStorage', err);
  }

  const initial: SupabaseDailyQuotaUsage = {
    date,
    month,
    reads: 0,
    writes: 0,
    deletes: 0,
    estimatedEgressBytes: 0,
    sessionReads: 0,
    sessionWrites: 0,
    sessionDeletes: 0,
    lastActiveTime: Date.now(),
    lastUpdated: Date.now()
  };
  saveSupabaseQuotaUsage(initial);
  return initial;
}

function saveSupabaseQuotaUsage(usage: SupabaseDailyQuotaUsage): void {
  try {
    localStorage.setItem(SUPABASE_QUOTA_STORAGE_KEY, JSON.stringify(usage));
    notifySupabaseListeners(usage);
  } catch (err) {
    console.warn('Unable to persist Supabase quota to localStorage', err);
  }
}

type SupabaseQuotaListener = (usage: SupabaseDailyQuotaUsage) => void;
const supabaseListeners = new Set<SupabaseQuotaListener>();

function notifySupabaseListeners(usage: SupabaseDailyQuotaUsage) {
  supabaseListeners.forEach((fn) => {
    try {
      fn(usage);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeToSupabaseQuotaUsage(callback: SupabaseQuotaListener): () => void {
  supabaseListeners.add(callback);
  callback(getSupabaseQuotaUsage());
  return () => {
    supabaseListeners.delete(callback);
  };
}

/**
 * Record a Supabase read operation (SELECT).
 */
export function recordSupabaseReads(count: number = 1, estimatedBytes: number = 2048): void {
  if (count <= 0) return;
  const usage = getSupabaseQuotaUsage();
  usage.reads += count;
  usage.sessionReads += count;
  usage.estimatedEgressBytes += estimatedBytes;
  usage.lastActiveTime = Date.now();
  usage.lastUpdated = Date.now();
  saveSupabaseQuotaUsage(usage);
}

/**
 * Record a Supabase write operation (INSERT / UPDATE).
 */
export function recordSupabaseWrites(count: number = 1, estimatedBytes: number = 1024): void {
  if (count <= 0) return;
  const usage = getSupabaseQuotaUsage();
  usage.writes += count;
  usage.sessionWrites += count;
  usage.estimatedEgressBytes += estimatedBytes;
  usage.lastActiveTime = Date.now();
  usage.lastUpdated = Date.now();
  saveSupabaseQuotaUsage(usage);
}

/**
 * Record a Supabase delete operation.
 */
export function recordSupabaseDeletes(count: number = 1): void {
  if (count <= 0) return;
  const usage = getSupabaseQuotaUsage();
  usage.deletes += count;
  usage.sessionDeletes += count;
  usage.estimatedEgressBytes += 512;
  usage.lastActiveTime = Date.now();
  usage.lastUpdated = Date.now();
  saveSupabaseQuotaUsage(usage);
}

/**
 * Updates the last active timestamp (e.g. from ping or connection test)
 * to keep the 7-day inactivity pause counter fresh.
 */
export function recordSupabasePing(): void {
  const usage = getSupabaseQuotaUsage();
  usage.lastActiveTime = Date.now();
  usage.lastUpdated = Date.now();
  saveSupabaseQuotaUsage(usage);
}

/**
 * Resets local session counters.
 */
export function resetSupabaseQuotaCounters(): SupabaseDailyQuotaUsage {
  const { date, month } = getSupabaseBillingDate();
  const resetUsage: SupabaseDailyQuotaUsage = {
    date,
    month,
    reads: 0,
    writes: 0,
    deletes: 0,
    estimatedEgressBytes: 0,
    sessionReads: 0,
    sessionWrites: 0,
    sessionDeletes: 0,
    lastActiveTime: Date.now(),
    lastUpdated: Date.now()
  };
  saveSupabaseQuotaUsage(resetUsage);
  return resetUsage;
}

/**
 * Calculates remaining days and hours until the 7-day inactivity pause.
 */
export function getInactivityPauseCountdown(lastActiveTime: number): {
  daysRemaining: number;
  hoursRemaining: number;
  formatted: string;
  isCloseToPause: boolean;
} {
  const now = Date.now();
  const pauseWindowMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const elapsedMs = Math.max(0, now - lastActiveTime);
  const remainingMs = Math.max(0, pauseWindowMs - elapsedMs);

  const daysRemaining = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  const isCloseToPause = daysRemaining <= 1;

  let formatted = `${daysRemaining}d ${hoursRemaining}h remaining`;
  if (daysRemaining === 0) {
    const minutesRemaining = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    formatted = `${hoursRemaining}h ${minutesRemaining}m remaining`;
  }

  return {
    daysRemaining,
    hoursRemaining,
    formatted,
    isCloseToPause
  };
}

/**
 * Extracts the Supabase project reference from a project URL.
 * e.g., 'https://xyzabcdef.supabase.co' -> 'xyzabcdef'
 */
export function extractSupabaseProjectRef(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/https:\/\/([a-z0-9-_]+)\.supabase\.co/i);
  return match ? match[1] : null;
}
