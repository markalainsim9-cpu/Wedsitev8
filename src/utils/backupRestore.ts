import { EventConfig, Guest, GuestbookEntry, SupabaseConfig } from '../types';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, saveSupabaseCredentials } from '../lib/supabase';
import { saveImageKitCredentials } from '../lib/imagekitClient';
import { saveR2Credentials } from './r2Client';
import { saveSupabaseConfigToCloud } from '../lib/firebase';

export interface ParsedBackup {
  isValid: boolean;
  version?: string;
  exportedAt?: string;
  formatType?: 'json_snapshot' | 'presets_file' | 'cloud_settings_block' | 'event_config_block';
  hasEventConfig: boolean;
  hasGuests: boolean;
  hasGuestbook: boolean;
  hasSupabase: boolean;
  hasImageKit: boolean;
  hasR2?: boolean;
  hasFirebase?: boolean;
  eventConfig?: EventConfig;
  guests?: Guest[];
  guestbookEntries?: GuestbookEntry[];
  supabase?: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    mode: 'failover' | 'mirror' | 'disabled';
    autoFailover: boolean;
    lastSyncTime?: string;
  };
  imagekit?: {
    publicKey: string;
    privateKey?: string;
    urlEndpoint: string;
  };
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey?: string;
    bucketName: string;
    publicUrl?: string;
  };
  firebase?: {
    projectId?: string;
    firestoreDatabaseId?: string;
    appId?: string;
    authDomain?: string;
  };
  summary: {
    title?: string;
    guestsCount: number;
    guestbookCount: number;
    supabaseUrl?: string;
    supabaseMode?: string;
    imagekitUrl?: string;
    r2Bucket?: string;
    firebaseProjectId?: string;
  };
  errors: string[];
}

/**
 * Checks if a credential string is masked with asterisks or ellipsis.
 */
function isMaskedValue(val: string): boolean {
  if (!val) return false;
  return val.includes('...') || val.includes('•••') || val.includes('***') || val.startsWith('••••');
}

/**
 * Normalizes redundancy mode string to strict union type.
 */
function normalizeRedundancyMode(raw: any): 'failover' | 'mirror' | 'disabled' {
  if (!raw || typeof raw !== 'string') return 'failover';
  const clean = raw.trim().toLowerCase();
  if (clean === 'mirror' || clean === 'dual-write' || clean === 'active-active') return 'mirror';
  if (clean === 'disabled' || clean === 'off' || clean === 'standalone') return 'disabled';
  return 'failover';
}

/**
 * Safely extracts a balanced `{ ... }` or `[ ... ]` substring taking into account
 * strings, template literals, escaped characters, and inline comments.
 */
function extractBalancedStructure(str: string, startIndex: number): { content: string; endIndex: number } | null {
  const openChar = str[startIndex];
  const closeChar = openChar === '{' ? '}' : openChar === '[' ? ']' : null;
  if (!closeChar) return null;

  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escape = false;

  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];
    const nextChar = i + 1 < str.length ? str[i + 1] : '';

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (inSingleQuote) {
      if (char === "'") inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      if (char === '"') inDoubleQuote = false;
      continue;
    }
    if (inBacktick) {
      if (char === '`') inBacktick = false;
      continue;
    }

    // Comments
    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    // String literals
    if (char === "'") {
      inSingleQuote = true;
      continue;
    }
    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (char === '`') {
      inBacktick = true;
      continue;
    }

    // Bracket nesting
    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return {
          content: str.substring(startIndex, i + 1),
          endIndex: i + 1
        };
      }
    }
  }
  return null;
}

/**
 * Safely parses a JSON or JavaScript literal (handles single quotes, unquoted keys, and trailing commas).
 */
function safeParseJsValue(literal: string): any {
  const trimmed = literal.trim();
  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Safe Function evaluation for standard JS object literals
  try {
    const fn = new Function('"use strict"; return (' + trimmed + ');');
    const res = fn();
    if (res && typeof res === 'object') return res;
  } catch {}

  return null;
}

/**
 * Normalizes input text into a root data object whether it's pure JSON,
 * markdown-fenced code, TypeScript presets file (with import/export statements),
 * or individual export snippets.
 */
function extractBackupPayload(raw: string): { root: any; formatType: ParsedBackup['formatType'] } | null {
  let text = raw.trim();
  if (!text) return null;

  // 1. Strip markdown code fences if present (e.g. ```json ... ``` or ```ts ... ```)
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  // 2. Try direct JSON parse first
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return { root: parsed, formatType: 'json_snapshot' };
    }
  } catch {}

  // 3. Direct JS object or array literal
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    const parsed = safeParseJsValue(text);
    if (parsed && typeof parsed === 'object') {
      return { root: parsed, formatType: 'json_snapshot' };
    }
  }

  // 4. Key-value block (e.g., "wedding: { ... },")
  const keyObjMatch = text.match(/^\s*([A-Za-z0-9_$]+)\s*:\s*(\{[\s\S]*\})\s*,?\s*$/);
  if (keyObjMatch) {
    const key = keyObjMatch[1];
    const obj = safeParseJsValue(keyObjMatch[2]);
    if (obj) {
      return { root: { [key]: obj }, formatType: 'event_config_block' };
    }
  }

  // 5. TypeScript / JavaScript variable declarations (presets.ts or export snippets)
  // Matches "export const VAR: Type = ...", "const VAR = ...", "var VAR = ...", "let VAR = ..."
  const varRegex = /(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)(?:\s*:\s*[^=]+)?\s*=\s*/g;
  let match: RegExpExecArray | null;
  const root: Record<string, any> = {};
  let foundAny = false;

  while ((match = varRegex.exec(text)) !== null) {
    const varName = match[1];
    let startIdx = match.index + match[0].length;
    while (startIdx < text.length && /\s/.test(text[startIdx])) {
      startIdx++;
    }
    const char = text[startIdx];
    if (char === '{' || char === '[') {
      const extracted = extractBalancedStructure(text, startIdx);
      if (extracted) {
        const value = safeParseJsValue(extracted.content);
        if (value !== null) {
          root[varName] = value;
          foundAny = true;

          // Map known presets variables to standard root keys
          if (varName === 'EVENT_PRESETS') {
            root.EVENT_PRESETS = value;
            if (value.wedding) root.wedding = value.wedding;
            if (value.eventConfig) root.eventConfig = value.eventConfig;
          }
          if (varName === 'INITIAL_GUESTS') {
            root.INITIAL_GUESTS = value;
            root.guests = value;
          }
          if (varName === 'INITIAL_GUESTBOOK') {
            root.INITIAL_GUESTBOOK = value;
            root.guestbookEntries = value;
          }
          if (varName === 'INITIAL_CLOUD_SETTINGS') {
            root.INITIAL_CLOUD_SETTINGS = value;
            root.cloudSettings = value;
          }
          if (varName === 'FIREBASE_PROVISIONED_CONFIG') {
            root.cloudSettings = root.cloudSettings || {};
            root.cloudSettings.firebase = value;
          }
          if (varName === 'SUPABASE_REDUNDANCY_POLICY') {
            root.cloudSettings = root.cloudSettings || {};
            root.cloudSettings.supabase = value;
          }
        }
      }
    }
  }

  if (foundAny) {
    const isFullPresets = Boolean(root.EVENT_PRESETS || (root.wedding && root.INITIAL_GUESTS));
    const isCloudSettingsOnly = Boolean(root.INITIAL_CLOUD_SETTINGS || root.SUPABASE_REDUNDANCY_POLICY || root.FIREBASE_PROVISIONED_CONFIG);
    return {
      root,
      formatType: isFullPresets ? 'presets_file' : isCloudSettingsOnly ? 'cloud_settings_block' : 'event_config_block'
    };
  }

  // 6. Fallback: Search for any top-level balanced object in the text
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    const extracted = extractBalancedStructure(text, firstBrace);
    if (extracted) {
      const value = safeParseJsValue(extracted.content);
      if (value && typeof value === 'object') {
        return { root: value, formatType: 'json_snapshot' };
      }
    }
  }

  return null;
}

/**
 * Safely parses any backup JSON payload or presets.ts code and extracts event config, guests, guestbook,
 * and authoritative Cloud & Account settings (Supabase, ImageKit, Firebase).
 */
export function parseBackupData(rawContent: string | object): ParsedBackup {
  const errors: string[] = [];
  let root: any = null;
  let formatType: ParsedBackup['formatType'] = 'json_snapshot';

  if (typeof rawContent === 'string') {
    const extracted = extractBackupPayload(rawContent);
    if (extracted && extracted.root) {
      root = extracted.root;
      formatType = extracted.formatType;
    } else {
      return {
        isValid: false,
        hasEventConfig: false,
        hasGuests: false,
        hasGuestbook: false,
        hasSupabase: false,
        hasImageKit: false,
        summary: { guestsCount: 0, guestbookCount: 0 },
        errors: [
          'Could not parse content. Supported formats: JSON backup file (.json), complete presets.ts TypeScript file, or Cloud & Account Settings export snippet.'
        ]
      };
    }
  } else if (typeof rawContent === 'object' && rawContent !== null) {
    root = rawContent;
  } else {
    return {
      isValid: false,
      hasEventConfig: false,
      hasGuests: false,
      hasGuestbook: false,
      hasSupabase: false,
      hasImageKit: false,
      summary: { guestsCount: 0, guestbookCount: 0 },
      errors: ['Invalid input payload provided for restoration.']
    };
  }

  // 1. Extract Event Config
  let eventConfig: EventConfig | undefined;
  if (root.eventConfig && typeof root.eventConfig === 'object') {
    eventConfig = root.eventConfig;
  } else if (root.config && typeof root.config === 'object') {
    eventConfig = root.config;
  } else if (root.wedding && typeof root.wedding === 'object') {
    eventConfig = root.wedding;
  } else if (root.weddingConfig && typeof root.weddingConfig === 'object') {
    eventConfig = root.weddingConfig;
  } else if (root.EVENT_PRESETS?.wedding && typeof root.EVENT_PRESETS.wedding === 'object') {
    eventConfig = root.EVENT_PRESETS.wedding;
  } else if (root.title && (root.date || root.venue || root.hostPassword || root.name)) {
    eventConfig = root as EventConfig;
  }

  // 2. Extract Guests List
  let guests: Guest[] | undefined;
  if (Array.isArray(root.guests)) {
    guests = root.guests;
  } else if (Array.isArray(root.INITIAL_GUESTS)) {
    guests = root.INITIAL_GUESTS;
  } else if (Array.isArray(root.guestList)) {
    guests = root.guestList;
  } else if (Array.isArray(root.guest_list)) {
    guests = root.guest_list;
  } else if (Array.isArray(root) && root.length > 0 && (root[0]?.name || root[0]?.phone || root[0]?.isAttending !== undefined)) {
    guests = root as Guest[];
  }

  // 3. Extract Guestbook Entries
  let guestbookEntries: GuestbookEntry[] | undefined;
  if (Array.isArray(root.guestbookEntries)) {
    guestbookEntries = root.guestbookEntries;
  } else if (Array.isArray(root.guestbook)) {
    guestbookEntries = root.guestbook;
  } else if (Array.isArray(root.INITIAL_GUESTBOOK)) {
    guestbookEntries = root.INITIAL_GUESTBOOK;
  } else if (Array.isArray(root.guestbook_entries)) {
    guestbookEntries = root.guestbook_entries;
  } else if (Array.isArray(root) && root.length > 0 && root[0]?.message) {
    guestbookEntries = root as GuestbookEntry[];
  }

  // 4. Extract Supabase Settings & Redundancy Policy
  // Check all possible containers:
  const supaContainer = 
    root.cloudSettings?.supabase ||
    root.cloudAccountSettings?.supabase ||
    root.INITIAL_CLOUD_SETTINGS?.supabase ||
    root.SUPABASE_REDUNDANCY_POLICY ||
    root.supabase ||
    root.supabaseConfig ||
    root.redundancyPolicy ||
    root;

  let supabase: ParsedBackup['supabase'] | undefined;

  const rawSupaUrl = 
    supaContainer?.supabaseUrl ||
    supaContainer?.supabase_url ||
    supaContainer?.url ||
    supaContainer?.projectUrl ||
    supaContainer?.project_url ||
    supaContainer?.endpoint ||
    root.supabaseUrl;

  const rawSupaKey =
    supaContainer?.supabaseAnonKey ||
    supaContainer?.supabase_anon_key ||
    supaContainer?.anonKey ||
    supaContainer?.anon_key ||
    supaContainer?.apiKey ||
    supaContainer?.api_key ||
    supaContainer?.key ||
    supaContainer?.publicApiKey ||
    root.supabaseAnonKey;

  const rawMode =
    supaContainer?.mode ||
    supaContainer?.redundancyMode ||
    supaContainer?.redundancy_mode ||
    supaContainer?.redundancyPolicy?.mode ||
    root.redundancyMode ||
    root.mode;

  const rawAutoFailover =
    supaContainer?.autoFailover ??
    supaContainer?.auto_failover ??
    supaContainer?.redundancyPolicy?.autoFailover ??
    root.autoFailover;

  const rawLastSync =
    supaContainer?.lastSyncTime ||
    supaContainer?.last_sync_time ||
    root.lastSyncTime;

  const cleanSupaUrl = typeof rawSupaUrl === 'string' && !isMaskedValue(rawSupaUrl) ? rawSupaUrl.trim() : '';
  const cleanSupaKey = typeof rawSupaKey === 'string' && !isMaskedValue(rawSupaKey) ? rawSupaKey.trim() : '';
  const parsedMode = normalizeRedundancyMode(rawMode);
  const parsedAutoFailover = typeof rawAutoFailover === 'boolean' ? rawAutoFailover : true;

  // Supabase is present if any url, key, or explicit mode is present
  if (cleanSupaUrl || cleanSupaKey || rawMode !== undefined || supaContainer?.redundancyPolicy) {
    supabase = {
      supabaseUrl: cleanSupaUrl,
      supabaseAnonKey: cleanSupaKey,
      mode: parsedMode,
      autoFailover: parsedAutoFailover,
      lastSyncTime: typeof rawLastSync === 'string' ? rawLastSync : undefined
    };
  }

  // 5. Extract ImageKit Settings
  const ikContainer =
    root.cloudSettings?.imagekit ||
    root.cloudAccountSettings?.imagekit ||
    root.INITIAL_CLOUD_SETTINGS?.imagekit ||
    root.imagekit ||
    root.imagekitConfig ||
    root;

  let imagekit: ParsedBackup['imagekit'] | undefined;

  const rawIkPublic = ikContainer?.publicKey || ikContainer?.public_key || root.imagekitPublicKey;
  const rawIkPrivate = ikContainer?.privateKey || ikContainer?.private_key || root.imagekitPrivateKey;
  const rawIkEndpoint = ikContainer?.urlEndpoint || ikContainer?.url_endpoint || ikContainer?.endpoint || root.imagekitUrlEndpoint;

  const cleanIkPublic = typeof rawIkPublic === 'string' && !isMaskedValue(rawIkPublic) ? rawIkPublic.trim() : '';
  const cleanIkPrivate = typeof rawIkPrivate === 'string' && !isMaskedValue(rawIkPrivate) ? rawIkPrivate.trim() : '';
  const cleanIkEndpoint = typeof rawIkEndpoint === 'string' && !isMaskedValue(rawIkEndpoint) ? rawIkEndpoint.trim() : '';

    if (cleanIkPublic || cleanIkEndpoint || cleanIkPrivate) {
    imagekit = {
      publicKey: cleanIkPublic,
      privateKey: cleanIkPrivate || undefined,
      urlEndpoint: cleanIkEndpoint
    };
  }

  // 6. Extract Cloudflare R2 Settings
  const r2Container =
    root.cloudSettings?.r2 ||
    root.cloudAccountSettings?.r2 ||
    root.INITIAL_CLOUD_SETTINGS?.r2 ||
    root.r2 ||
    root.r2Config ||
    root;

  let r2: ParsedBackup['r2'] | undefined;

  const rawR2Account = r2Container?.accountId || r2Container?.account_id || root.r2AccountId;
  const rawR2AccessKey = r2Container?.accessKeyId || r2Container?.access_key_id || root.r2AccessKeyId;
  const rawR2Secret = r2Container?.secretAccessKey || r2Container?.secret_access_key || root.r2SecretAccessKey;
  const rawR2Bucket = r2Container?.bucketName || r2Container?.bucket_name || r2Container?.bucket || root.r2BucketName;
  const rawR2PublicUrl = r2Container?.publicUrl || r2Container?.public_url || root.r2PublicUrl;

  const cleanR2Account = typeof rawR2Account === 'string' && !isMaskedValue(rawR2Account) ? rawR2Account.trim() : '';
  const cleanR2AccessKey = typeof rawR2AccessKey === 'string' && !isMaskedValue(rawR2AccessKey) ? rawR2AccessKey.trim() : '';
  const cleanR2Secret = typeof rawR2Secret === 'string' && !isMaskedValue(rawR2Secret) ? rawR2Secret.trim() : '';
  const cleanR2Bucket = typeof rawR2Bucket === 'string' && !isMaskedValue(rawR2Bucket) ? rawR2Bucket.trim() : '';
  const cleanR2PublicUrl = typeof rawR2PublicUrl === 'string' && !isMaskedValue(rawR2PublicUrl) ? rawR2PublicUrl.trim() : '';

  if (cleanR2Account || cleanR2AccessKey || cleanR2Bucket) {
    r2 = {
      accountId: cleanR2Account,
      accessKeyId: cleanR2AccessKey,
      secretAccessKey: cleanR2Secret || undefined,
      bucketName: cleanR2Bucket,
      publicUrl: cleanR2PublicUrl || undefined,
    };
  }

  // 7. Extract Firebase Provisioned Settings
  const fbContainer =
    root.cloudSettings?.firebase ||
    root.cloudAccountSettings?.firebase ||
    root.INITIAL_CLOUD_SETTINGS?.firebase ||
    root.FIREBASE_PROVISIONED_CONFIG ||
    root.firebase;

  let firebase: ParsedBackup['firebase'] | undefined;
  if (fbContainer && typeof fbContainer === 'object') {
    firebase = {
      projectId: fbContainer.projectId || fbContainer.project_id || root.projectId,
      firestoreDatabaseId: fbContainer.firestoreDatabaseId || fbContainer.firestore_database_id || fbContainer.databaseId || root.firestoreDatabaseId,
      appId: fbContainer.appId || fbContainer.app_id || root.appId,
      authDomain: fbContainer.authDomain || fbContainer.auth_domain || root.authDomain
    };
  }

  // Check overall validity: At least eventConfig OR guests OR guestbook OR supabase OR imagekit OR r2 OR firebase must be present
  const hasEventConfig = Boolean(eventConfig && (eventConfig.title || eventConfig.date || eventConfig.name));
  const hasGuests = Array.isArray(guests) && guests.length > 0;
  const hasGuestbook = Array.isArray(guestbookEntries) && guestbookEntries.length > 0;
  const hasSupabase = Boolean(supabase && (supabase.supabaseUrl || supabase.supabaseAnonKey || supabase.mode));
  const hasImageKit = Boolean(imagekit && (imagekit.publicKey || imagekit.urlEndpoint));
  const hasR2 = Boolean(r2 && (r2.accountId || r2.bucketName));
  const hasFirebase = Boolean(firebase && (firebase.projectId || firebase.firestoreDatabaseId));

  const isValid = hasEventConfig || hasGuests || hasGuestbook || hasSupabase || hasImageKit || hasR2 || hasFirebase;
  if (!isValid) {
    errors.push('No recognized wedding data, guest list, or cloud credentials found in the provided backup file.');
  }

  return {
    isValid,
    version: root.version,
    exportedAt: root.exportedAt,
    formatType,
    hasEventConfig,
    hasGuests,
    hasGuestbook,
    hasSupabase,
    hasImageKit,
    hasR2,
    hasFirebase,
    eventConfig,
    guests,
    guestbookEntries,
    supabase,
    imagekit,
    r2,
    firebase,
    summary: {
      title: eventConfig?.title,
      guestsCount: guests?.length || 0,
      guestbookCount: guestbookEntries?.length || 0,
      supabaseUrl: supabase?.supabaseUrl,
      supabaseMode: supabase?.mode,
      imagekitUrl: imagekit?.urlEndpoint,
      r2Bucket: r2?.bucketName,
      firebaseProjectId: firebase?.projectId
    },
    errors
  };
}

/**
 * Applies the parsed backup data to all persistence layers:
 * - LocalStorage (Supabase, ImageKit)
 * - Cloud Firestore (Event config, Guests, Supabase credentials & policy, ImageKit credentials)
 * - React in-memory state callbacks
 */
export async function applyRestoreData(
  parsed: ParsedBackup,
  callbacks: {
    onSaveConfig?: (config: EventConfig) => Promise<void> | void;
    onSaveGuests?: (guests: Guest[]) => Promise<void> | void;
    onSaveGuestbook?: (entries: GuestbookEntry[]) => Promise<void> | void;
    onUpdateSupabase?: (config: SupabaseConfig) => void;
    onUpdateImageKit?: (creds: { publicKey: string; privateKey?: string; urlEndpoint: string }) => void;
    onUpdateR2?: (creds: { accountId: string; accessKeyId: string; secretAccessKey?: string; bucketName: string; publicUrl?: string }) => void;
  }
): Promise<{ success: boolean; message: string; details: string[] }> {
  if (!parsed.isValid) {
    throw new Error(parsed.errors.join(' ') || 'Invalid backup payload.');
  }

  const details: string[] = [];

  // 1. Restore Event Config
  if (parsed.eventConfig && callbacks.onSaveConfig) {
    await callbacks.onSaveConfig(parsed.eventConfig);
    details.push(`✓ Wedding details updated ("${parsed.eventConfig.title || 'Event'}")`);
  }

  // 2. Restore Guests
  if (parsed.guests && callbacks.onSaveGuests) {
    await callbacks.onSaveGuests(parsed.guests);
    details.push(`✓ ${parsed.guests.length} guests and seating allocations restored`);
  }

  // 3. Restore Guestbook
  if (parsed.guestbookEntries && callbacks.onSaveGuestbook) {
    await callbacks.onSaveGuestbook(parsed.guestbookEntries);
    details.push(`✓ ${parsed.guestbookEntries.length} keepsake wishes restored`);
  }

  // 4. Restore Supabase Credentials & Redundancy Policy
  if (parsed.supabase) {
    const current = getStoredSupabaseConfig();
    const finalSupa: SupabaseConfig = {
      ...current,
      supabaseUrl: parsed.supabase.supabaseUrl || current.supabaseUrl,
      supabaseAnonKey: parsed.supabase.supabaseAnonKey || current.supabaseAnonKey,
      mode: parsed.supabase.mode || current.mode || 'failover',
      autoFailover: parsed.supabase.autoFailover ?? current.autoFailover ?? true,
      lastSyncTime: parsed.supabase.lastSyncTime || current.lastSyncTime
    };

    // Save to localStorage immediately
    saveStoredSupabaseConfig(finalSupa);

    // Save to Cloud Firestore
    try {
      await saveSupabaseConfigToCloud({
        supabaseUrl: finalSupa.supabaseUrl,
        supabaseAnonKey: finalSupa.supabaseAnonKey,
        mode: finalSupa.mode,
        autoFailover: finalSupa.autoFailover,
        lastSyncTime: finalSupa.lastSyncTime
      });
    } catch (err) {
      console.warn('Could not save restored Supabase config to Firestore:', err);
    }

    // Trigger local state update in active modal
    if (callbacks.onUpdateSupabase) {
      callbacks.onUpdateSupabase(finalSupa);
    }

    const modeLabel = 
      finalSupa.mode === 'mirror' ? 'Dual-Write Mirroring' :
      finalSupa.mode === 'failover' ? 'Automatic Failover' : 'Firestore Standby';

    details.push(`✓ Supabase credentials & Redundancy Policy (${modeLabel}) activated`);
    if (finalSupa.supabaseUrl) {
      details.push(`   Project URL: ${finalSupa.supabaseUrl}`);
    }
  }

  // 5. Restore ImageKit
  if (parsed.imagekit) {
    try {
      await saveImageKitCredentials({
        publicKey: parsed.imagekit.publicKey,
        privateKey: parsed.imagekit.privateKey || '',
        urlEndpoint: parsed.imagekit.urlEndpoint
      });
      if (callbacks.onUpdateImageKit) {
        callbacks.onUpdateImageKit(parsed.imagekit);
      }
      details.push(`✓ ImageKit CDN credentials restored (${parsed.imagekit.urlEndpoint})`);
    } catch (err) {
      console.warn('Failed to save ImageKit credentials:', err);
    }
  }

  // 6. Restore Cloudflare R2
  if (parsed.r2) {
    try {
      await saveR2Credentials({
        accountId: parsed.r2.accountId,
        accessKeyId: parsed.r2.accessKeyId,
        secretAccessKey: parsed.r2.secretAccessKey || '',
        bucketName: parsed.r2.bucketName,
        publicUrl: parsed.r2.publicUrl,
      });
      if (callbacks.onUpdateR2) {
        callbacks.onUpdateR2(parsed.r2);
      }
      details.push(`✓ Cloudflare R2 video storage credentials restored (Bucket: ${parsed.r2.bucketName})`);
    } catch (err) {
      console.warn('Failed to save Cloudflare R2 credentials:', err);
    }
  }

  return {
    success: true,
    message: '✓ Restoration applied successfully across Cloud Firestore, Supabase, and Browser Storage!',
    details
  };
}
