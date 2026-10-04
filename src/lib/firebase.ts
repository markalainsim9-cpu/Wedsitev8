import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  collection, 
  deleteDoc,
  writeBatch,
  getDocFromServer,
  getDocs,
  where,
  addDoc,
  query,
  orderBy,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import { EventConfig, Guest, GuestbookEntry } from '../types';
import { 
  recordFirestoreReads, 
  recordFirestoreWrites, 
  recordFirestoreDeletes 
} from './quotaTracker';
import {
  getStoredSupabaseConfig,
  saveEventConfigToSupabase,
  saveGuestToSupabase,
  deleteGuestFromSupabase,
  saveGuestbookEntryToSupabase,
  deleteGuestbookEntryFromSupabase,
  fetchEventConfigFromSupabase,
  fetchGuestsFromSupabase,
  fetchGuestbookFromSupabase
} from './supabase';

// Your web app's Firebase configuration loaded directly from the authoritative config
export const firebaseAppletConfigRaw = firebaseConfigRaw;

export const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
  firestoreDatabaseId: firebaseConfigRaw.firestoreDatabaseId,
  oAuthClientId: firebaseConfigRaw.oAuthClientId || '',
  measurementId: firebaseConfigRaw.measurementId || '',
  recaptchaSiteKey: firebaseConfigRaw.recaptchaSiteKey || ''
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function getOrCreateFirestore() {
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;
  try {
    return dbId
      ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId)
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}

export const db = getOrCreateFirestore();
export const auth = getAuth(app);
try {
  setLogLevel('error');
} catch {
  // ignore
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strips any undefined fields recursively so Firestore setDoc/updateDoc never throws
 * "Unsupported field value: undefined"
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item));
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// Initial connection test as mandated by Firebase skill
async function testConnection(retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      return;
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('the client is offline') || error?.code === 'unavailable') {
        if (i === retries - 1) {
          console.warn('Initial connection probe notice: Client operating in offline cache mode.');
        }
      }
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1000);
} else {
  testConnection().catch(() => {});
}

const CONFIG_DOC = 'wedding_event';

/**
 * Validates active connection to Firestore and measures response latency.
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const docRef = doc(db, 'event_config', CONFIG_DOC);
    await getDocFromServer(docRef);
    const latencyMs = Date.now() - start;
    recordFirestoreReads(1);
    return { success: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const msg = err?.message || '';
    let friendlyError = msg;
    if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
      friendlyError = 'Permission denied: Please update your Firestore Security Rules in the Firebase Console to allow read/write.';
    } else if (msg.includes('Failed to get document from server')) {
      friendlyError = 'Server rejected request. Please ensure: 1) Cloud Firestore database is created in Firebase Console, and 2) Firestore Rules allow read/write (not "allow read, write: if false;").';
    } else if (err instanceof Error && (err.message.includes('the client is offline') || err.message.includes('backend is unreachable') || (err as any).code === 'unavailable')) {
      friendlyError = 'Operating in offline cache mode. Cloud Firestore will reconnect automatically when network is available.';
    }
    return { 
      success: false, 
      latencyMs, 
      error: friendlyError
    };
  }
}

export interface ServerAuthoritativeStatus {
  authoritative: boolean;
  mode: string;
  firestoreDatabaseId?: string;
  projectId?: string;
  initializedFromDb?: boolean;
  sseClientsCount?: number;
  guestsCount?: number;
  deletedGuestsCount?: number;
  guestbookCount?: number;
  uptime?: number;
  checkedAt?: number;
  error?: string;
}

let cachedServerStatus: ServerAuthoritativeStatus | null = null;
const serverStatusListeners = new Set<(status: ServerAuthoritativeStatus | null) => void>();

export function getCachedServerAuthoritativeStatus(): ServerAuthoritativeStatus | null {
  if (cachedServerStatus) return cachedServerStatus;
  try {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('rsvp_server_auth_status') : null;
    if (saved) {
      cachedServerStatus = JSON.parse(saved);
      return cachedServerStatus;
    }
  } catch {
    // ignore
  }
  return null;
}

export function subscribeToServerStatus(cb: (status: ServerAuthoritativeStatus | null) => void): () => void {
  serverStatusListeners.add(cb);
  const current = getCachedServerAuthoritativeStatus();
  if (current) {
    cb(current);
  }
  return () => {
    serverStatusListeners.delete(cb);
  };
}

function updateServerStatus(status: ServerAuthoritativeStatus) {
  cachedServerStatus = status;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rsvp_server_auth_status', JSON.stringify(status));
    }
  } catch {
    // ignore
  }
  serverStatusListeners.forEach((cb) => cb(status));
}

/**
 * Retrieves the Server-Authoritative engine status with quick timeout and caching.
 */
export async function getServerAuthoritativeStatus(forceRefresh = false): Promise<ServerAuthoritativeStatus> {
  if (!forceRefresh && cachedServerStatus && (Date.now() - (cachedServerStatus.checkedAt || 0) < 15000)) {
    return cachedServerStatus;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

  try {
    const res = await fetch('/api/status', {
      signal: controller ? controller.signal : undefined,
      headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (timeoutId) clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && !res.redirected && contentType.includes('application/json')) {
      const data = await res.json();
      const newStatus: ServerAuthoritativeStatus = {
        ...data,
        checkedAt: Date.now(),
      };
      updateServerStatus(newStatus);
      return newStatus;
    }
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);
    console.warn('Server authoritative status check notice:', err);
  }

  // Fallback status if unreachable, redirected by proxy, or timed out
  const fallbackStatus: ServerAuthoritativeStatus = {
    authoritative: false,
    mode: 'direct-firestore',
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    projectId: firebaseConfig.projectId,
    checkedAt: Date.now(),
    error: 'Operating in direct Firestore mode'
  };
  updateServerStatus(fallbackStatus);
  return fallbackStatus;
}

// Global SSE Manager for Server-Authoritative real-time streaming
type ConfigCallback = (config: EventConfig) => void;
type GuestsCallback = (guests: Guest[]) => void;
type GuestbookCallback = (entries: GuestbookEntry[]) => void;

const configListeners = new Set<ConfigCallback>();
const guestsListeners = new Set<GuestsCallback>();
const guestbookListeners = new Set<GuestbookCallback>();

let sseSource: EventSource | null = null;
let isSSEConnecting = false;

function initServerEventsStream() {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return;
  if (sseSource || isSSEConnecting) return;

  isSSEConnecting = true;
  try {
    const es = new EventSource('/api/events/stream');
    sseSource = es;

    es.addEventListener('connected', () => {
      const existing = getCachedServerAuthoritativeStatus();
      updateServerStatus({
        authoritative: true,
        mode: 'server-authoritative',
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
        projectId: firebaseConfig.projectId,
        initializedFromDb: true,
        checkedAt: Date.now(),
        ...(existing || {}),
      });
    });

    es.addEventListener('full_state', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const existing = getCachedServerAuthoritativeStatus();
        updateServerStatus({
          authoritative: true,
          mode: 'server-authoritative',
          firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
          projectId: firebaseConfig.projectId,
          initializedFromDb: true,
          guestsCount: Array.isArray(data.guests) ? data.guests.length : existing?.guestsCount,
          guestbookCount: Array.isArray(data.guestbook) ? data.guestbook.length : existing?.guestbookCount,
          checkedAt: Date.now(),
          ...(existing || {}),
        });
        if (data.config) configListeners.forEach((cb) => cb(data.config));
        if (data.guests && Array.isArray(data.guests)) {
          const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
          const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
          const map = new Map<string, Guest>();
          data.guests.forEach((g: any) => {
            if (g && g.id && !deletedIds.includes(g.id)) map.set(g.id, g);
          });
          const dedupedGuests = Array.from(map.values());
          guestsListeners.forEach((cb) => cb(dedupedGuests));
        }
        if (data.guestbook && Array.isArray(data.guestbook)) {
          const rawGbDeleted = localStorage.getItem('rsvp_guestbook_deleted_ids');
          const deletedGbIds: string[] = rawGbDeleted ? JSON.parse(rawGbDeleted) : [];
          const map = new Map<string, GuestbookEntry>();
          data.guestbook.forEach((entry: any) => {
            if (entry && entry.id && !deletedGbIds.includes(entry.id)) map.set(entry.id, entry);
          });
          const dedupedGb = Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return timeB - timeA;
          });
          guestbookListeners.forEach((cb) => cb(dedupedGb));
        }
      } catch (err) {
        console.warn('SSE full_state parse notice:', err);
      }
    });

    es.addEventListener('config_updated', (e: MessageEvent) => {
      try {
        const config = JSON.parse(e.data);
        configListeners.forEach((cb) => cb(config));
      } catch (err) {
        console.warn('SSE config_updated notice:', err);
      }
    });

    es.addEventListener('guests_updated', (e: MessageEvent) => {
      try {
        const guests = JSON.parse(e.data);
        if (Array.isArray(guests)) {
          const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
          const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
          const map = new Map<string, Guest>();
          guests.forEach((g) => {
            if (g && g.id && !deletedIds.includes(g.id)) map.set(g.id, g);
          });
          const deduped = Array.from(map.values());
          guestsListeners.forEach((cb) => cb(deduped));
        }
      } catch (err) {
        console.warn('SSE guests_updated notice:', err);
      }
    });

    es.addEventListener('guest_deleted', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data && data.id) {
          const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
          const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
          if (!deletedIds.includes(data.id)) {
            deletedIds.push(data.id);
            localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(deletedIds));
          }
        }
      } catch (err) {
        console.warn('SSE guest_deleted notice:', err);
      }
    });

    es.addEventListener('guests_batch_deleted', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data && Array.isArray(data.ids)) {
          const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
          const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
          data.ids.forEach((id: string) => {
            if (!deletedIds.includes(id)) deletedIds.push(id);
          });
          localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(deletedIds));
        }
      } catch (err) {
        console.warn('SSE guests_batch_deleted notice:', err);
      }
    });

    es.addEventListener('guestbook_updated', (e: MessageEvent) => {
      try {
        const entries = JSON.parse(e.data);
        if (Array.isArray(entries)) {
          const map = new Map<string, GuestbookEntry>();
          entries.forEach((entry) => {
            if (entry && entry.id) map.set(entry.id, entry);
          });
          const deduped = Array.from(map.values()).sort((a, b) => {
            const aF = Boolean(a.isFeatured);
            const bF = Boolean(b.isFeatured);
            if (aF !== bF) return aF ? -1 : 1;
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return timeB - timeA;
          });
          guestbookListeners.forEach((cb) => cb(deduped));
        }
      } catch (err) {
        console.warn('SSE guestbook_updated notice:', err);
      }
    });

    es.onerror = () => {
      // SSE connection error - fallback to Firestore onSnapshot
      es.close();
      sseSource = null;
      isSSEConnecting = false;
    };

    es.onopen = () => {
      isSSEConnecting = false;
    };
  } catch (err) {
    console.warn('Server SSE stream initialization notice:', err);
    sseSource = null;
    isSSEConnecting = false;
  }
}

/**
 * Subscribes to real-time updates for the event configuration.
 * Uses Server-Authoritative SSE stream with direct Firestore onSnapshot fallback.
 */
export function subscribeToEventConfig(
  onUpdate: (config: EventConfig) => void,
  onError?: (err: Error) => void
) {
  configListeners.add(onUpdate);
  initServerEventsStream();

  const docRef = doc(db, 'event_config', CONFIG_DOC);
  const unsubFirestore = onSnapshot(
    docRef, 
    (snapshot) => {
      recordFirestoreReads(1);
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as EventConfig);
      }
    }, 
    async (err) => {
      console.warn('Firestore config subscription warning:', err);
      const supaConf = getStoredSupabaseConfig();
      if (supaConf.mode !== 'disabled') {
        const fallback = await fetchEventConfigFromSupabase();
        if (fallback) {
          console.info('Loaded event config from Supabase fallback replica.');
          onUpdate(fallback);
          return;
        }
      }
      if (onError) onError(err);
    }
  );

  return () => {
    configListeners.delete(onUpdate);
    unsubFirestore();
  };
}

/**
 * Saves event configuration authoritatively through the server,
 * falling back to direct Firestore if running in a static deployment.
 */
export async function saveEventConfigToCloud(config: EventConfig): Promise<void> {
  const supaConf = getStoredSupabaseConfig();

  // 1. Attempt Server-Authoritative Endpoint
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      recordFirestoreWrites(1);
      if (supaConf.mode === 'mirror') {
        saveEventConfigToSupabase(config).catch((err) => console.warn('Supabase mirror sync notice:', err));
      }
      return;
    }
  } catch (serverErr) {
    console.warn('Server endpoint /api/config unreachable, falling back to direct Firestore:', serverErr);
  }

  // 2. Direct Firestore Fallback
  try {
    const docRef = doc(db, 'event_config', CONFIG_DOC);
    await setDoc(docRef, cleanFirestoreData(config), { merge: true });
    recordFirestoreWrites(1);

    if (supaConf.mode === 'mirror') {
      saveEventConfigToSupabase(config).catch((err) => {
        console.warn('Supabase mirror sync notice:', err);
      });
    }
  } catch (firestoreErr: any) {
    console.warn('Firestore saveEventConfigToCloud failed, evaluating Supabase fallback:', firestoreErr);
    if (supaConf.mode === 'failover' || supaConf.mode === 'mirror') {
      const ok = await saveEventConfigToSupabase(config);
      if (ok) {
        console.info('✓ Successfully saved event config to Supabase fallback replica.');
        return;
      }
    }
    throw firestoreErr;
  }
}

/**
 * Subscribes to real-time updates for guests and RSVP responses.
 * Uses Server-Authoritative SSE stream with direct Firestore onSnapshot fallback.
 */
export function subscribeToGuests(
  onUpdate: (guests: Guest[]) => void,
  onError?: (err: Error) => void
) {
  guestsListeners.add(onUpdate);
  initServerEventsStream();

  const colRef = collection(db, 'guests');
  const unsubFirestore = onSnapshot(
    colRef, 
    (snapshot) => {
      recordFirestoreReads(snapshot.docs.length || 1);
      const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
      const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      const guestMap = new Map<string, Guest>();
      snapshot.forEach((d) => {
        if (!deletedIds.includes(d.id)) {
          guestMap.set(d.id, { id: d.id, ...d.data() } as Guest);
        }
      });
      onUpdate(Array.from(guestMap.values()));
    }, 
    async (err) => {
      console.warn('Firestore guests subscription warning:', err);
      const supaConf = getStoredSupabaseConfig();
      if (supaConf.mode !== 'disabled') {
        const fallbackGuests = await fetchGuestsFromSupabase();
        if (fallbackGuests && fallbackGuests.length > 0) {
          console.info('Loaded guest list from Supabase fallback replica.');
          const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
          const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
          onUpdate(fallbackGuests.filter((g) => !deletedIds.includes(g.id)));
          return;
        }
      }
      if (onError) onError(err);
    }
  );

  return () => {
    guestsListeners.delete(onUpdate);
    unsubFirestore();
  };
}

/**
 * Saves or updates a guest authoritatively through the server.
 * Automatically mirrors or falls back to direct Firestore and Supabase.
 */
export async function saveGuestToCloud(guest: Guest): Promise<void> {
  const supaConf = getStoredSupabaseConfig();

  // 1. Remove from local deleted tombstones if being created or updated
  try {
    const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
    if (rawDeleted) {
      const deletedSet: string[] = JSON.parse(rawDeleted);
      const filtered = deletedSet.filter((id) => id !== guest.id);
      localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(filtered));
    }
  } catch (e) {
    // ignore
  }

  // 2. Attempt Server-Authoritative Endpoint
  try {
    const res = await fetch('/api/guests/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guest),
    });
    if (res.ok) {
      recordFirestoreWrites(1);
      if (supaConf.mode === 'mirror') {
        saveGuestToSupabase(guest).catch((err) => console.warn('Supabase mirror guest sync notice:', err));
      }
      return;
    }
  } catch (serverErr) {
    console.warn('Server endpoint /api/guests/save unreachable, falling back to direct Firestore:', serverErr);
  }

  // 3. Direct Firestore Fallback
  try {
    const docRef = doc(db, 'guests', guest.id);
    await setDoc(docRef, cleanFirestoreData(guest), { merge: true });
    recordFirestoreWrites(1);

    if (supaConf.mode === 'mirror') {
      saveGuestToSupabase(guest).catch((err) => {
        console.warn('Supabase mirror guest sync notice:', err);
      });
    }
  } catch (firestoreErr: any) {
    console.warn('Firestore saveGuestToCloud failed, evaluating Supabase fallback:', firestoreErr);
    if (supaConf.mode === 'failover' || supaConf.mode === 'mirror') {
      const ok = await saveGuestToSupabase(guest);
      if (ok) {
        console.info('✓ Saved guest to Supabase fallback replica.');
        return;
      }
    }
    if (firestoreErr?.message?.includes('Missing or insufficient permissions') || firestoreErr?.code === 'permission-denied') {
      handleFirestoreError(firestoreErr, OperationType.WRITE, `guests/${guest.id}`);
    }
    throw firestoreErr;
  }
}

/**
 * Deletes a guest authoritatively through the server.
 */
export async function deleteGuestFromCloud(guestId: string): Promise<void> {
  const supaConf = getStoredSupabaseConfig();

  // 1. Mark as permanently deleted in local cache so UI never resurrects it
  try {
    const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
    const deletedSet: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!deletedSet.includes(guestId)) {
      deletedSet.push(guestId);
      localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(deletedSet));
    }
  } catch (e) {
    // ignore
  }

  // 2. Attempt Server-Authoritative Endpoint
  try {
    const res = await fetch(`/api/guests/${encodeURIComponent(guestId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      recordFirestoreDeletes(1);
      if (supaConf.mode === 'mirror') {
        deleteGuestFromSupabase(guestId).catch((err) => console.warn('Supabase mirror guest deletion notice:', err));
      }
      return;
    }
  } catch (serverErr) {
    console.warn('Server DELETE /api/guests/:id unreachable, falling back to direct Firestore:', serverErr);
  }

  // 3. Direct Firestore Fallback
  try {
    const docRef = doc(db, 'guests', guestId);
    await deleteDoc(docRef);
    recordFirestoreDeletes(1);

    if (supaConf.mode === 'mirror') {
      deleteGuestFromSupabase(guestId).catch((err) => {
        console.warn('Supabase mirror guest deletion notice:', err);
      });
    }
  } catch (firestoreErr: any) {
    console.warn('Firestore deleteGuestFromCloud failed, evaluating Supabase fallback:', firestoreErr);
    if (supaConf.mode === 'failover' || supaConf.mode === 'mirror') {
      const ok = await deleteGuestFromSupabase(guestId);
      if (ok) {
        console.info('✓ Deleted guest from Supabase fallback replica.');
        return;
      }
    }
    throw firestoreErr;
  }
}

/**
 * Batch deletes multiple guests authoritatively through the server.
 */
export async function deleteMultipleGuestsFromCloud(guestIds: string[]): Promise<void> {
  if (!guestIds || guestIds.length === 0) return;

  // 1. Mark as permanently deleted in local cache so UI never resurrects them
  try {
    const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
    const deletedSet: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    guestIds.forEach((id) => {
      if (!deletedSet.includes(id)) deletedSet.push(id);
    });
    localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(deletedSet));
  } catch (e) {
    // ignore
  }

  // 2. Attempt Server-Authoritative Endpoint
  try {
    const res = await fetch('/api/guests/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: guestIds }),
    });
    if (res.ok) {
      recordFirestoreDeletes(guestIds.length);
      return;
    }
  } catch (serverErr) {
    console.warn('Server /api/guests/batch-delete unreachable, falling back to direct Firestore batch:', serverErr);
  }

  // 3. Direct Firestore Batch Fallback
  const chunkSize = 400;
  const chunks: string[][] = [];
  for (let i = 0; i < guestIds.length; i += chunkSize) {
    chunks.push(guestIds.slice(i, i + chunkSize));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, 'guests', id));
      }
      await batch.commit();
    })
  );
  recordFirestoreDeletes(guestIds.length);
}

/**
 * Batch seeds initial guests authoritatively through the server.
 */
export async function seedInitialGuestsToCloud(initialGuests: Guest[]): Promise<void> {
  // 1. Attempt Server-Authoritative Endpoint
  try {
    const res = await fetch('/api/guests/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guests: initialGuests }),
    });
    if (res.ok) {
      recordFirestoreWrites(initialGuests.length);
      return;
    }
  } catch (serverErr) {
    console.warn('Server /api/guests/batch unreachable, falling back to direct Firestore batch:', serverErr);
  }

  // 2. Direct Firestore Batch Fallback
  const batch = writeBatch(db);
  for (const g of initialGuests) {
    const docRef = doc(db, 'guests', g.id);
    const { id, ...data } = g;
    batch.set(docRef, data, { merge: true });
  }
  await batch.commit();
  recordFirestoreWrites(initialGuests.length);
}

/**
 * Persists ImageKit configuration to Cloud Firestore so credentials persist
 * across server restarts, page refreshes, and multi-device deployments (e.g. Netlify).
 */
export async function saveImageKitConfigToCloud(config: {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}): Promise<void> {
  const pKey = (config.publicKey || '').trim();
  const privKey = (config.privateKey || '').trim();
  const urlEp = (config.urlEndpoint || '').trim();

  // If all fields are empty, delete the ImageKit configuration document from Firestore
  if (!pKey && !privKey && !urlEp) {
    await resetImageKitConfigInCloud();
    return;
  }

  try {
    const docRef = doc(db, 'event_config', 'imagekit_config');
    await setDoc(docRef, {
      publicKey: pKey,
      privateKey: privKey,
      urlEndpoint: urlEp,
      updatedAt: new Date().toISOString()
    });
    recordFirestoreWrites(1);
  } catch (err) {
    console.warn('Failed to save ImageKit config to Firestore:', err);
  }
}

/**
 * Persists Supabase configuration to Cloud Firestore so credentials persist
 * across server restarts, page refreshes, and multi-device deployments.
 */
/**
 * Saves Supabase configuration & Redundancy Policy permanently to Cloud Firestore.
 */
export async function saveSupabaseConfigToCloud(config: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  mode?: 'failover' | 'mirror' | 'disabled';
  autoFailover?: boolean;
  lastSyncTime?: string;
}): Promise<void> {
  try {
    const docRef = doc(db, 'event_config', 'supabase_config');
    await setDoc(docRef, {
      supabaseUrl: config.supabaseUrl.trim(),
      supabaseAnonKey: config.supabaseAnonKey.trim(),
      mode: config.mode || 'failover',
      autoFailover: config.autoFailover ?? true,
      lastSyncTime: config.lastSyncTime || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    recordFirestoreWrites(1);
  } catch (err) {
    console.warn('Failed to save Supabase config to Firestore:', err);
  }
}

/**
 * Loads Supabase configuration & Redundancy Policy from Cloud Firestore.
 */
export async function loadSupabaseConfigFromCloud(): Promise<{
  supabaseUrl: string;
  supabaseAnonKey: string;
  mode: 'failover' | 'mirror' | 'disabled';
  autoFailover: boolean;
  lastSyncTime?: string;
} | null> {
  try {
    const docRef = doc(db, 'event_config', 'supabase_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      recordFirestoreReads(1);
      const data = snap.data();
      if (data) {
        const mode = data.mode === 'mirror' || data.mode === 'disabled' ? data.mode : 'failover';
        const autoFailover = typeof data.autoFailover === 'boolean' ? data.autoFailover : true;
        return {
          supabaseUrl: typeof data.supabaseUrl === 'string' ? data.supabaseUrl.trim() : '',
          supabaseAnonKey: typeof data.supabaseAnonKey === 'string' ? data.supabaseAnonKey.trim() : '',
          mode,
          autoFailover,
          lastSyncTime: typeof data.lastSyncTime === 'string' ? data.lastSyncTime : undefined
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load Supabase config from Firestore:', err);
  }
  return null;
}

/**
 * Loads ImageKit configuration from Cloud Firestore.
 */
export async function loadImageKitConfigFromCloud(): Promise<{
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  updatedAt?: string;
} | null> {
  try {
    const docRef = doc(db, 'event_config', 'imagekit_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      recordFirestoreReads(1);
      const data = snap.data();
      if (data && data.privateKey && typeof data.privateKey === 'string') {
        return {
          publicKey: data.publicKey || '',
          privateKey: data.privateKey || '',
          urlEndpoint: data.urlEndpoint || '',
          updatedAt: data.updatedAt
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load ImageKit config from Firestore:', err);
  }
  return null;
}

/**
 * Removes ImageKit configuration from Cloud Firestore.
 */
export async function resetImageKitConfigInCloud(): Promise<void> {
  try {
    const docRef = doc(db, 'event_config', 'imagekit_config');
    await deleteDoc(docRef);
    recordFirestoreDeletes(1);
  } catch (err) {
    console.warn('Failed to reset ImageKit config in Firestore:', err);
  }
}

/**
 * Persists Cloudflare R2 configuration to Cloud Firestore so credentials persist
 * across server restarts, page refreshes, and multi-device deployments.
 */
export async function saveR2ConfigToCloud(config: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey?: string;
  bucketName: string;
  publicUrl?: string;
}): Promise<void> {
  const acc = (config.accountId || '').trim();
  const aKey = (config.accessKeyId || '').trim();
  const sKey = (config.secretAccessKey || '').trim();
  const bName = (config.bucketName || '').trim();
  const pubUrl = (config.publicUrl || '').trim();

  // If all fields are empty, delete the R2 configuration document from Firestore
  if (!acc && !aKey && !sKey && !bName) {
    await resetR2ConfigInCloud();
    return;
  }

  try {
    const docRef = doc(db, 'event_config', 'r2_config');
    await setDoc(docRef, {
      accountId: acc,
      accessKeyId: aKey,
      secretAccessKey: sKey,
      bucketName: bName,
      publicUrl: pubUrl,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    recordFirestoreWrites(1);
  } catch (err) {
    console.warn('Failed to save Cloudflare R2 config to Firestore:', err);
  }
}

/**
 * Loads Cloudflare R2 configuration from Cloud Firestore.
 */
export async function loadR2ConfigFromCloud(): Promise<{
  accountId: string;
  accessKeyId: string;
  secretAccessKey?: string;
  bucketName: string;
  publicUrl?: string;
  updatedAt?: string;
} | null> {
  try {
    const docRef = doc(db, 'event_config', 'r2_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      recordFirestoreReads(1);
      const data = snap.data();
      if (data && data.accountId && data.accessKeyId && data.bucketName) {
        return {
          accountId: data.accountId || '',
          accessKeyId: data.accessKeyId || '',
          secretAccessKey: data.secretAccessKey || '',
          bucketName: data.bucketName || '',
          publicUrl: data.publicUrl || '',
          updatedAt: data.updatedAt,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load Cloudflare R2 config from Firestore:', err);
  }
  return null;
}

/**
 * Removes Cloudflare R2 configuration from Cloud Firestore.
 */
export async function resetR2ConfigInCloud(): Promise<void> {
  try {
    const docRef = doc(db, 'event_config', 'r2_config');
    await deleteDoc(docRef);
    recordFirestoreDeletes(1);
  } catch (err) {
    console.warn('Failed to reset Cloudflare R2 config in Firestore:', err);
  }
}

/**
 * Subscribes to real-time updates for guestbook wishes and love entries.
 * Uses Server-Authoritative SSE stream with direct Firestore onSnapshot fallback.
 */
export function subscribeToGuestbook(
  onUpdate: (entries: GuestbookEntry[]) => void,
  onError?: (err: Error) => void
) {
  guestbookListeners.add(onUpdate);
  initServerEventsStream();

  const colRef = collection(db, 'guestbook');

  const unsubFirestore = onSnapshot(
    colRef,
    (snapshot) => {
      recordFirestoreReads(snapshot.docs.length || 1);
      
      // Check for locally deleted IDs to prevent ghost re-injections
      let deletedIds: string[] = [];
      try {
        const raw = localStorage.getItem('rsvp_guestbook_deleted_ids');
        if (raw) deletedIds = JSON.parse(raw);
      } catch (e) {
        // ignore
      }

      const entryMap = new Map<string, GuestbookEntry>();
      snapshot.forEach((d) => {
        if (!deletedIds.includes(d.id)) {
          entryMap.set(d.id, { id: d.id, ...d.data() } as GuestbookEntry);
        }
      });

      const entries = Array.from(entryMap.values());
      // Sort: Featured first, then descending by createdAt or timestamp
      entries.sort((a, b) => {
        const aF = Boolean(a.isFeatured);
        const bF = Boolean(b.isFeatured);
        if (aF !== bF) return aF ? -1 : 1;
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      onUpdate(entries);
    },
    async (err) => {
      console.warn('Firestore guestbook subscription warning:', err);
      const supaConf = getStoredSupabaseConfig();
      if (supaConf.mode !== 'disabled') {
        const fallback = await fetchGuestbookFromSupabase();
        if (fallback && fallback.length > 0) {
          console.info('Loaded guestbook from Supabase fallback replica.');
          onUpdate(fallback);
          return;
        }
      }
      if (onError) onError(err);
    }
  );

  return () => {
    guestbookListeners.delete(onUpdate);
    unsubFirestore();
  };
}

/**
 * Adds a new heartfelt wish to the guestbook authoritatively through the server.
 * Accepts an optional preferredId to ensure React state and Firestore document IDs are perfectly identical.
 */
export async function addGuestbookEntryToCloud(
  entry: Omit<GuestbookEntry, 'id'>,
  preferredId?: string
): Promise<string> {
  const supaConf = getStoredSupabaseConfig();
  const entryId = preferredId || `gb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Attempt Server-Authoritative Endpoint
  try {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, id: entryId }),
    });
    if (res.ok) {
      const json = await res.json();
      recordFirestoreWrites(1);
      if (supaConf.mode === 'mirror') {
        saveGuestbookEntryToSupabase({
          id: entryId,
          ...entry,
          createdAt: entry.createdAt || new Date().toISOString(),
        }).catch((err) => console.warn('Supabase mirror guestbook notice:', err));
      }
      return json?.entry?.id || entryId;
    }
  } catch (serverErr) {
    console.warn('Server endpoint /api/guestbook unreachable, falling back to direct Firestore:', serverErr);
  }

  // 2. Direct Firestore Fallback
  try {
    const docRef = doc(db, 'guestbook', entryId);
    await setDoc(
      docRef,
      cleanFirestoreData({
        ...entry,
        id: entryId,
        createdAt: entry.createdAt || new Date().toISOString(),
        timestamp: Date.now(),
      })
    );
    recordFirestoreWrites(1);

    if (supaConf.mode === 'mirror') {
      saveGuestbookEntryToSupabase({
        id: entryId,
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString()
      }).catch((err) => console.warn('Supabase mirror guestbook notice:', err));
    }

    return entryId;
  } catch (firestoreErr: any) {
    console.warn('Firestore addGuestbookEntryToCloud failed, evaluating Supabase fallback:', firestoreErr);
    if (supaConf.mode === 'failover' || supaConf.mode === 'mirror') {
      const ok = await saveGuestbookEntryToSupabase({
        id: entryId,
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString()
      });
      if (ok) {
        console.info('✓ Saved guestbook wish to Supabase fallback replica.');
        return entryId;
      }
    }
    throw firestoreErr;
  }
}

/**
 * Deletes a guestbook entry permanently authoritatively through the server,
 * cleaning up local caches and Supabase replicas.
 */
export async function deleteGuestbookEntryFromCloud(
  id: string,
  entryData?: Partial<GuestbookEntry>
): Promise<void> {
  const supaConf = getStoredSupabaseConfig();

  // 1. Mark as permanently deleted in local cache so UI never resurrects it
  try {
    const rawDeleted = localStorage.getItem('rsvp_guestbook_deleted_ids');
    const deletedSet: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!deletedSet.includes(id)) {
      deletedSet.push(id);
      localStorage.setItem('rsvp_guestbook_deleted_ids', JSON.stringify(deletedSet));
    }
  } catch (e) {
    // ignore
  }

  // 2. Attempt Server-Authoritative Endpoint (including Cloudflare R2 video deletion)
  try {
    const res = await fetch(`/api/guestbook/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: entryData?.videoUrl,
        videoThumbnail: entryData?.videoThumbnail,
      }),
    });
    if (res.ok) {
      recordFirestoreDeletes(1);
      if (supaConf.mode === 'mirror' || supaConf.mode === 'failover') {
        deleteGuestbookEntryFromSupabase(id).catch((err) => console.warn('Supabase mirror delete guestbook notice:', err));
      }
      return;
    }
  } catch (serverErr) {
    console.warn('Server DELETE /api/guestbook/:id unreachable, falling back to direct Firestore:', serverErr);
  }

  // 3. Direct Firestore Fallback + R2 Cleanup
  try {
    // Also trigger Cloudflare R2 video deletion if entry contained a video
    if (entryData?.videoUrl) {
      fetch('/api/r2/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: entryData.videoUrl }),
      }).catch((r2Err) => console.warn('Cloudflare R2 video cleanup notice:', r2Err));
    }

    // Delete primary document by exact ID
    const docRef = doc(db, 'guestbook', id);
    await deleteDoc(docRef);
    recordFirestoreDeletes(1);

    // Defensive content-match cleanup
    if (entryData && entryData.name && entryData.message) {
      try {
        const colRef = collection(db, 'guestbook');
        const q = query(
          colRef,
          where('name', '==', entryData.name),
          where('message', '==', entryData.message)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
            recordFirestoreDeletes(1);
          }
        }
      } catch (qErr) {
        console.warn('Defensive query cleanup notice:', qErr);
      }
    }

    // Record permanently deleted ID in Firestore metadata
    try {
      const metaRef = doc(db, 'guestbook_meta', 'deleted_entries');
      const metaSnap = await getDoc(metaRef);
      const existingIds: string[] = metaSnap.exists() ? (metaSnap.data()?.ids || []) : [];
      if (!existingIds.includes(id)) {
        await setDoc(metaRef, { ids: [...existingIds, id], lastUpdated: Date.now() }, { merge: true });
        recordFirestoreWrites(1);
      }
    } catch (metaErr) {
      console.warn('Firestore delete tracking metadata note:', metaErr);
    }

    // Delete from Supabase replica if mirror or failover active
    if (supaConf.mode === 'mirror' || supaConf.mode === 'failover') {
      deleteGuestbookEntryFromSupabase(id).catch((err) => console.warn('Supabase mirror delete guestbook notice:', err));
    }
  } catch (firestoreErr: any) {
    console.warn('Firestore deleteGuestbookEntryFromCloud failed, evaluating Supabase fallback:', firestoreErr);
    if (supaConf.mode === 'failover' || supaConf.mode === 'mirror') {
      const ok = await deleteGuestbookEntryFromSupabase(id);
      if (ok) {
        console.info('✓ Deleted guestbook wish from Supabase fallback replica.');
        return;
      }
    }
    throw firestoreErr;
  }
}

/**
 * Toggles the pinned/featured status of a guestbook entry authoritatively through the server,
 * falling back to direct Firestore update.
 */
export async function toggleFeatureGuestbookEntryInCloud(
  id: string,
  isFeatured: boolean
): Promise<void> {
  const featuredAt = isFeatured ? new Date().toISOString() : undefined;

  // 1. Attempt Server-Authoritative Endpoint
  try {
    const res = await fetch(`/api/guestbook/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isFeatured,
        featuredAt,
      }),
    });
    if (res.ok) {
      recordFirestoreWrites(1);
      return;
    }
  } catch (serverErr) {
    console.warn('Server PATCH /api/guestbook/:id unreachable, falling back to direct Firestore:', serverErr);
  }

  // 2. Direct Firestore Fallback
  try {
    const docRef = doc(db, 'guestbook', id);
    await setDoc(docRef, { isFeatured, featuredAt: featuredAt || null }, { merge: true });
    recordFirestoreWrites(1);
  } catch (firestoreErr: any) {
    console.warn('Firestore toggleFeatureGuestbookEntryInCloud failed:', firestoreErr);
    throw firestoreErr;
  }
}

/**
 * Seeds initial guestbook messages to Cloud Firestore ONLY on initial app boot.
 * If already initialized, it will NEVER overwrite or re-seed deleted entries.
 */
export async function seedInitialGuestbookToCloud(
  initialEntries: GuestbookEntry[]
): Promise<void> {
  try {
    // Check if initialization has already happened
    const metaRef = doc(db, 'guestbook_meta', 'init_status');
    const snap = await getDoc(metaRef);
    if (snap.exists() && snap.data()?.seeded) {
      // Already initialized before, do not re-seed deleted wishes!
      return;
    }

    // Also check localStorage marker
    if (typeof window !== 'undefined' && localStorage.getItem('rsvp_guestbook_seeded_v1') === 'true') {
      return;
    }

    const colRef = collection(db, 'guestbook');
    const batch = writeBatch(db);
    initialEntries.forEach((entry, idx) => {
      const entryId = entry.id || `gb_init_${idx + 1}`;
      const docRef = doc(colRef, entryId);
      batch.set(docRef, {
        ...entry,
        id: entryId,
        createdAt: entry.createdAt || new Date(Date.now() - (idx * 3600000)).toISOString(),
        timestamp: Date.now() - (idx * 3600000)
      });
    });

    // Mark initialization status so this never runs again
    batch.set(metaRef, {
      seeded: true,
      timestamp: Date.now(),
      seededAt: new Date().toISOString()
    });

    await batch.commit();
    recordFirestoreWrites(initialEntries.length + 1);

    if (typeof window !== 'undefined') {
      localStorage.setItem('rsvp_guestbook_seeded_v1', 'true');
    }
  } catch (err) {
    console.info('Guestbook cloud initial seeding note:', err);
  }
}

