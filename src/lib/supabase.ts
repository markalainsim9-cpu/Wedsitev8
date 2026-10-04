import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventConfig, Guest, GuestbookEntry, SupabaseConfig } from '../types';
import {
  recordSupabaseReads,
  recordSupabaseWrites,
  recordSupabaseDeletes,
  recordSupabasePing,
  extractSupabaseProjectRef
} from './supabaseQuotaTracker';
import { saveSupabaseConfigToCloud } from './firebase';

const STORAGE_KEY = 'rsvp_supabase_config';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  supabaseUrl: 'https://icfspyvyavvcgofxgnsf.supabase.co',
  supabaseAnonKey: 'sb_publishable_m-JlgMYjemUxSz_Pe1bc5Q_0XuCu_C5',
  mode: 'failover',
  autoFailover: true,
  lastSyncTime: '2026-09-12T15:55:38.367Z',
  syncStatus: 'idle'
};

// Global singleton client cache across hot reloads, re-renders, and concurrent modules
const GLOBAL_SUPABASE_CLIENTS_KEY = '__WEDDING_SUPABASE_CLIENT_MAP__';

function getGlobalClientRegistry(): Map<string, SupabaseClient> {
  const root = typeof globalThis !== 'undefined' 
    ? (globalThis as any) 
    : (typeof window !== 'undefined' ? (window as any) : ({} as any));
  if (!root[GLOBAL_SUPABASE_CLIENTS_KEY]) {
    root[GLOBAL_SUPABASE_CLIENTS_KEY] = new Map<string, SupabaseClient>();
  }
  return root[GLOBAL_SUPABASE_CLIENTS_KEY];
}

/**
 * Retrieves the stored Supabase configuration from localStorage.
 */
export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SUPABASE_CONFIG,
        ...parsed
      };
    }
  } catch (err) {
    console.warn('Failed to parse Supabase config from localStorage:', err);
  }
  return { ...DEFAULT_SUPABASE_CONFIG };
}

/**
 * Saves the Supabase configuration to localStorage.
 */
export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save Supabase config to localStorage:', err);
  }
}

/**
 * Saves Supabase credentials and redundancy policy permanently to Cloud Firestore and local storage.
 */
export async function saveSupabaseCredentials(config: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  mode?: 'failover' | 'mirror' | 'disabled';
  autoFailover?: boolean;
  lastSyncTime?: string;
}): Promise<{ success: boolean; message: string }> {
  const current = getStoredSupabaseConfig();
  const finalConfig: SupabaseConfig = {
    ...current,
    supabaseUrl: config.supabaseUrl.trim(),
    supabaseAnonKey: config.supabaseAnonKey.trim(),
    mode: config.mode || current.mode || 'failover',
    autoFailover: config.autoFailover ?? current.autoFailover ?? true,
    lastSyncTime: config.lastSyncTime || current.lastSyncTime
  };

  // 1. Persist to localStorage
  saveStoredSupabaseConfig(finalConfig);

  // 2. Persist to Cloud Firestore
  try {
    await saveSupabaseConfigToCloud({
      supabaseUrl: finalConfig.supabaseUrl,
      supabaseAnonKey: finalConfig.supabaseAnonKey,
      mode: finalConfig.mode,
      autoFailover: finalConfig.autoFailover,
      lastSyncTime: finalConfig.lastSyncTime
    });
  } catch (err) {
    console.warn('Could not persist Supabase config to Firestore:', err);
  }

  return {
    success: true,
    message: '✓ Supabase credentials & redundancy policy saved and activated in Cloud Firestore & Browser Storage!'
  };
}

/**
 * Gets or initializes an active Supabase client singleton instance.
 * Reuses existing instances per (url, key) pair to prevent multiple GoTrueClient
 * instances in the same browser context.
 */
export function getSupabaseClient(overrideUrl?: string, overrideKey?: string): SupabaseClient | null {
  const url = (overrideUrl ?? getStoredSupabaseConfig().supabaseUrl).trim();
  const key = (overrideKey ?? getStoredSupabaseConfig().supabaseAnonKey).trim();

  if (!url || !key) return null;

  const registry = getGlobalClientRegistry();
  const cacheKey = `${url}:::${key}`;

  const existing = registry.get(cacheKey);
  if (existing) {
    return existing;
  }

  try {
    const projectRef = extractSupabaseProjectRef(url) || 'wedding';
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: `sb_${projectRef}_wedding_singleton`,
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        },
        lock: async (_name, _acquireTimeout, fn) => await fn()
      }
    });

    registry.set(cacheKey, client);
    return client;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

/**
 * Tests the live connectivity to Supabase by checking the API endpoint.
 * Reuses the singleton Supabase client rather than spawning duplicate GoTrue clients.
 */
export async function testSupabaseConnection(
  customUrl?: string, 
  customKey?: string
): Promise<{ 
  success: boolean; 
  latencyMs: number; 
  error?: string;
  tablesDetected?: string[];
}> {
  const start = Date.now();
  const url = (customUrl ?? getStoredSupabaseConfig().supabaseUrl).trim();
  const key = (customKey ?? getStoredSupabaseConfig().supabaseAnonKey).trim();

  if (!url || !key) {
    return {
      success: false,
      latencyMs: 0,
      error: 'Please provide both Supabase Project URL and Anon Public Key.'
    };
  }

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      success: false,
      latencyMs: 0,
      error: 'Supabase URL must start with https:// (e.g. https://your-project.supabase.co)'
    };
  }

  try {
    // Reuse the singleton client instance to avoid multiple GoTrueClient browser warnings
    const client = getSupabaseClient(url, key);
    if (!client) {
      return {
        success: false,
        latencyMs: 0,
        error: 'Failed to initialize Supabase client with the provided credentials.'
      };
    }

    // Check if tables are ready or queryable
    const detected: string[] = [];

    // Attempt to probe event_config table
    const { data: configData, error: configError } = await client
      .from('event_config')
      .select('id')
      .limit(1);

    if (!configError) {
      detected.push('event_config');
    }

    // Attempt to probe guests table
    const { error: guestError } = await client
      .from('guests')
      .select('id')
      .limit(1);

    if (!guestError) {
      detected.push('guests');
    }

    // Attempt to probe guestbook table
    const { error: gbError } = await client
      .from('guestbook')
      .select('id')
      .limit(1);

    if (!gbError) {
      detected.push('guestbook');
    }

    const latencyMs = Date.now() - start;
    recordSupabasePing();

    // If tables don't exist yet, we still verify the API itself answered
    if (configError && configError.code === 'PGRST204') {
      // Table doesn't exist, but API is live and answered!
      return {
        success: true,
        latencyMs,
        tablesDetected: detected,
        error: 'Connected to Supabase! However, the database tables have not been created yet. Please run the SQL schema script provided below in your Supabase SQL Editor.'
      };
    }

    if (configError && (configError.code === 'PGRST301' || configError.message?.toLowerCase().includes('jwt'))) {
      return {
        success: false,
        latencyMs,
        error: 'Invalid Anon Public Key or API token rejected by Supabase.'
      };
    }

    return {
      success: true,
      latencyMs,
      tablesDetected: detected
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err?.message || 'Could not reach Supabase endpoint. Please verify the URL.'
    };
  }
}

/**
 * Mirrors or saves event configuration to Supabase.
 */
export async function saveEventConfigToSupabase(config: EventConfig): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('event_config')
      .upsert({
        id: 'wedding_event',
        data: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase event_config sync notice:', error.message);
      return false;
    }
    recordSupabaseWrites(1, 4096);
    return true;
  } catch (err) {
    console.warn('Failed to sync event config to Supabase:', err);
    return false;
  }
}

/**
 * Mirrors or saves a guest record to Supabase.
 */
export async function saveGuestToSupabase(guest: Guest): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('guests')
      .upsert({
        id: guest.id,
        name: guest.name,
        email: guest.email || '',
        attending: guest.attending,
        count: guest.count,
        song: guest.song || '',
        table_name: guest.table || '',
        seat: guest.seat || '',
        note: guest.note || '',
        created_at: guest.createdAt || new Date().toISOString(),
        raw_data: guest
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase guest sync notice:', error.message);
      return false;
    }
    recordSupabaseWrites(1, 1024);
    return true;
  } catch (err) {
    console.warn('Failed to sync guest to Supabase:', err);
    return false;
  }
}

/**
 * Deletes a guest record from Supabase.
 */
export async function deleteGuestFromSupabase(guestId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('guests')
      .delete()
      .eq('id', guestId);

    if (error) {
      console.warn('Supabase guest deletion notice:', error.message);
      return false;
    }
    recordSupabaseDeletes(1);
    return true;
  } catch (err) {
    console.warn('Failed to delete guest from Supabase:', err);
    return false;
  }
}

/**
 * Mirrors or saves a guestbook entry to Supabase.
 */
export async function saveGuestbookEntryToSupabase(
  entry: GuestbookEntry
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('guestbook')
      .upsert({
        id: entry.id,
        name: entry.name,
        message: entry.message,
        relationship: entry.relationship || '',
        created_at: entry.createdAt || new Date().toISOString(),
        raw_data: entry
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase guestbook sync notice:', error.message);
      return false;
    }
    recordSupabaseWrites(1, 1024);
    return true;
  } catch (err) {
    console.warn('Failed to sync guestbook entry to Supabase:', err);
    return false;
  }
}

/**
 * Deletes a guestbook entry from Supabase.
 */
export async function deleteGuestbookEntryFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('guestbook')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase guestbook delete notice:', error.message);
      return false;
    }
    recordSupabaseDeletes(1);
    return true;
  } catch (err) {
    console.warn('Failed to delete guestbook from Supabase:', err);
    return false;
  }
}

/**
 * Fetches event configuration from Supabase (used during failover).
 */
export async function fetchEventConfigFromSupabase(): Promise<EventConfig | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('event_config')
      .select('data')
      .eq('id', 'wedding_event')
      .maybeSingle();

    if (error || !data) return null;
    recordSupabaseReads(1, 4096);
    return data.data as EventConfig;
  } catch (err) {
    console.warn('Failed to fetch event config from Supabase:', err);
    return null;
  }
}

/**
 * Fetches all guests from Supabase (used during failover).
 */
export async function fetchGuestsFromSupabase(): Promise<Guest[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    recordSupabaseReads(1, Math.max(1024, data.length * 512));

    return data.map((row: any) => {
      if (row.raw_data && typeof row.raw_data === 'object') {
        return { ...row.raw_data, id: row.id };
      }
      return {
        id: row.id,
        name: row.name,
        phone: row.phone || row.raw_data?.phone || '',
        email: row.email || '',
        attending: row.attending || 'yes',
        count: Number(row.count) || 1,
        song: row.song || '',
        table: row.table_name || '',
        seat: row.seat || '',
        note: row.note || '',
        createdAt: row.created_at || new Date().toISOString()
      } as Guest;
    });
  } catch (err) {
    console.warn('Failed to fetch guests from Supabase:', err);
    return null;
  }
}

/**
 * Fetches all guestbook entries from Supabase (used during failover).
 */
export async function fetchGuestbookFromSupabase(): Promise<GuestbookEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('guestbook')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    recordSupabaseReads(1, Math.max(1024, data.length * 512));

    return data.map((row: any) => {
      if (row.raw_data && typeof row.raw_data === 'object') {
        return { ...row.raw_data, id: row.id };
      }
      return {
        id: row.id,
        name: row.name,
        message: row.message,
        relationship: row.relationship || '',
        createdAt: row.created_at || new Date().toISOString(),
        timestamp: new Date(row.created_at).getTime() || Date.now()
      } as GuestbookEntry;
    });
  } catch (err) {
    console.warn('Failed to fetch guestbook from Supabase:', err);
    return null;
  }
}

/**
 * Performs a complete one-click sync / mirror from existing application data to Supabase.
 */
export async function mirrorAllDataToSupabase(
  config: EventConfig,
  guests: Guest[],
  guestbook: GuestbookEntry[]
): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, syncedCount: 0, error: 'Supabase credentials are not configured.' };
  }

  try {
    let count = 0;

    // 1. Sync Event Config
    const configOk = await saveEventConfigToSupabase(config);
    if (configOk) count += 1;

    // 2. Sync Guests
    if (guests && guests.length > 0) {
      const guestRows = guests.map((g) => ({
        id: g.id,
        name: g.name,
        email: g.email || '',
        attending: g.attending,
        count: g.count,
        song: g.song || '',
        table_name: g.table || '',
        seat: g.seat || '',
        note: g.note || '',
        created_at: g.createdAt || new Date().toISOString(),
        raw_data: g
      }));

      const { error: guestError } = await client
        .from('guests')
        .upsert(guestRows, { onConflict: 'id' });

      if (!guestError) {
        count += guestRows.length;
      }
    }

    // 3. Sync Guestbook
    if (guestbook && guestbook.length > 0) {
      const gbRows = guestbook.map((gb) => ({
        id: gb.id,
        name: gb.name,
        message: gb.message,
        relationship: gb.relationship || '',
        created_at: gb.createdAt || new Date().toISOString(),
        raw_data: gb
      }));

      const { error: gbError } = await client
        .from('guestbook')
        .upsert(gbRows, { onConflict: 'id' });

      if (!gbError) {
        count += gbRows.length;
      }
    }

    // Update stored config last sync timestamp
    const current = getStoredSupabaseConfig();
    saveStoredSupabaseConfig({
      ...current,
      lastSyncTime: new Date().toISOString(),
      syncStatus: 'synced'
    });

    if (count > 0) {
      recordSupabaseWrites(count, count * 1024);
    }

    return { success: true, syncedCount: count };
  } catch (err: any) {
    return {
      success: false,
      syncedCount: 0,
      error: err?.message || 'Error occurred during mirror sync.'
    };
  }
}

/**
 * Returns clean, ready-to-run PostgreSQL SQL script for Supabase SQL Editor.
 */
export function generateSupabaseSqlSchema(): string {
  return `-- ==========================================================
-- SUPABASE REDUNDANCY & FAILOVER DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==========================================================

-- 1. Create table for Event Configuration
CREATE TABLE IF NOT EXISTS public.event_config (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create table for Guests and RSVPs
CREATE TABLE IF NOT EXISTS public.guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  attending TEXT DEFAULT 'yes',
  count INTEGER DEFAULT 1,
  song TEXT,
  table_name TEXT,
  seat TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  raw_data JSONB
);

-- 3. Create table for Guestbook Wishes & Greetings
CREATE TABLE IF NOT EXISTS public.guestbook (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  raw_data JSONB
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

-- 5. Create permissive policies for event website & host dashboard
-- (Allows reading and inserting/updating wedding records using Anon key)

DROP POLICY IF EXISTS "Public read access for event_config" ON public.event_config;
CREATE POLICY "Public read access for event_config"
  ON public.event_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public upsert access for event_config" ON public.event_config;
CREATE POLICY "Public upsert access for event_config"
  ON public.event_config FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access for guests" ON public.guests;
CREATE POLICY "Public read access for guests"
  ON public.guests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public upsert access for guests" ON public.guests;
CREATE POLICY "Public upsert access for guests"
  ON public.guests FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access for guestbook" ON public.guestbook;
CREATE POLICY "Public read access for guestbook"
  ON public.guestbook FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public upsert access for guestbook" ON public.guestbook;
CREATE POLICY "Public upsert access for guestbook"
  ON public.guestbook FOR ALL
  USING (true)
  WITH CHECK (true);
`;
}
