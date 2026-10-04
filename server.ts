import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  setLogLevel 
} from 'firebase/firestore';
import firebaseConfigRaw from './firebase-applet-config.json';
import { EVENT_PRESETS, INITIAL_GUESTS, INITIAL_GUESTBOOK } from './src/data/presets';
import { EventConfig, Guest, GuestbookEntry } from './src/types';
import { 
  getR2Status, 
  createR2PresignedUploadUrl, 
  uploadBufferToR2, 
  testR2Connection,
  deleteObjectFromR2,
  extractR2ObjectKey,
  saveR2ConfigFile,
  clearR2ConfigFile,
  getStoredR2ConfigFile,
  getR2Config,
  maskSecretKey,
  maskAccountId,
  maskAccessKey
} from './server/r2Service';

// Suppress non-fatal gRPC stream reset warnings from Firebase Web SDK running in Node.js
setLogLevel('error');

// Initialize Firebase with Web SDK on Node.js using project web apiKey
const firebaseApp = initializeApp(firebaseConfigRaw);
const firestoreDb = getFirestore(
  firebaseApp,
  firebaseConfigRaw.firestoreDatabaseId && firebaseConfigRaw.firestoreDatabaseId !== '(default)'
    ? firebaseConfigRaw.firestoreDatabaseId
    : undefined
);

/**
 * Wraps Firestore operations with auto-retry for transient connection resets (ECONNRESET, UNAVAILABLE).
 */
async function withFirestoreRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 600): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isTransient =
        err?.code === 14 ||
        err?.code === 'unavailable' ||
        msg.includes('ECONNRESET') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('read ECONNRESET');
      if (isTransient && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Firestore operation failed after retries');
}

// Server-authoritative in-memory state cache
let authoritativeConfig: EventConfig = EVENT_PRESETS.wedding;
let authoritativeGuests: Map<string, Guest> = new Map();
let authoritativeDeletedGuestIds: Set<string> = new Set();
let authoritativeGuestbook: GuestbookEntry[] = [];
let isInitializedFromDb = false;

// SSE Client Connections for real-time push
interface SSEClient {
  id: string;
  res: Response;
}
const sseClients = new Set<SSEClient>();

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

/**
 * Strips any undefined fields recursively so Firestore setDoc never throws
 * "Unsupported field value: undefined"
 */
function cleanFirestoreData<T extends Record<string, any>>(obj: T): any {
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

// Deleted guest tombstones helper
async function persistDeletedGuestIds() {
  const ids = Array.from(authoritativeDeletedGuestIds);
  try {
    await withFirestoreRetry(() => setDoc(doc(firestoreDb, 'event_config', 'deleted_guests'), { ids }, { merge: true }));
  } catch (e) {
    console.warn('Notice: Failed to persist to event_config/deleted_guests:', e);
  }
  try {
    await withFirestoreRetry(() => setDoc(doc(firestoreDb, 'config', 'deleted_guests'), { ids }, { merge: true }));
  } catch {
    // ignore
  }
}

// Initial Sync & Background Firestore sync to maintain authoritative state
async function initAuthoritativeState() {
  try {
    // 1. Load Event Configuration
    const configRef = doc(firestoreDb, 'event_config', 'wedding_event');
    const configSnap = await withFirestoreRetry(() => getDoc(configRef));
    if (configSnap.exists()) {
      authoritativeConfig = {
        ...EVENT_PRESETS.wedding,
        ...(configSnap.data() as EventConfig),
      };
      console.log('✓ Server-Authoritative: Loaded event config from Firestore');
    } else {
      // Seed default
      await withFirestoreRetry(() => setDoc(configRef, EVENT_PRESETS.wedding));
      authoritativeConfig = EVENT_PRESETS.wedding;
      console.log('✓ Server-Authoritative: Seeded default event config to Firestore');
    }

    // 2. Load Deleted Guest Tombstones
    try {
      let delSnap = await withFirestoreRetry(() => getDoc(doc(firestoreDb, 'event_config', 'deleted_guests')));
      if (!delSnap.exists() || !Array.isArray(delSnap.data()?.ids)) {
        delSnap = await withFirestoreRetry(() => getDoc(doc(firestoreDb, 'config', 'deleted_guests')));
      }
      if (delSnap.exists() && Array.isArray(delSnap.data()?.ids)) {
        authoritativeDeletedGuestIds = new Set(delSnap.data()?.ids);
        console.log(`✓ Server-Authoritative: Loaded ${authoritativeDeletedGuestIds.size} deleted guest tombstones`);
      }
    } catch (delErr) {
      console.warn('Notice: Could not load deleted_guests tombstones:', delErr);
    }

    // 3. Load Guests
    const guestsCol = collection(firestoreDb, 'guests');
    const guestsSnap = await withFirestoreRetry(() => getDocs(guestsCol));
    if (!guestsSnap.empty) {
      authoritativeGuests.clear();
      guestsSnap.forEach((d) => {
        // Never restore guests that have been explicitly deleted
        if (!authoritativeDeletedGuestIds.has(d.id)) {
          authoritativeGuests.set(d.id, { id: d.id, ...d.data() } as Guest);
        }
      });
      console.log(`✓ Server-Authoritative: Loaded ${authoritativeGuests.size} active guests from Firestore`);
    } else if (authoritativeDeletedGuestIds.size === 0) {
      // Seed initial guests ONLY if database has never been initialized
      const batch = writeBatch(firestoreDb);
      INITIAL_GUESTS.forEach((g) => {
        const dRef = doc(firestoreDb, 'guests', g.id);
        const { id, ...data } = g;
        batch.set(dRef, data);
        authoritativeGuests.set(g.id, g);
      });
      await withFirestoreRetry(() => batch.commit());
      console.log(`✓ Server-Authoritative: Seeded ${INITIAL_GUESTS.length} initial guests to Firestore`);
    }

    // 3. Load Guestbook
    const gbCol = collection(firestoreDb, 'guestbook');
    const gbSnap = await withFirestoreRetry(() => getDocs(gbCol));
    if (!gbSnap.empty) {
      const list: GuestbookEntry[] = [];
      gbSnap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as GuestbookEntry);
      });
      list.sort((a, b) => {
        const aF = Boolean(a.isFeatured);
        const bF = Boolean(b.isFeatured);
        if (aF !== bF) return aF ? -1 : 1;
        const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
      });
      authoritativeGuestbook = list;
      console.log(`✓ Server-Authoritative: Loaded ${list.length} guestbook entries from Firestore`);
    } else {
      const batch = writeBatch(firestoreDb);
      INITIAL_GUESTBOOK.forEach((entry, idx) => {
        const entryId = entry.id || `gb_init_${idx + 1}`;
        const dRef = doc(firestoreDb, 'guestbook', entryId);
        const formatted: GuestbookEntry = {
          ...entry,
          id: entryId,
          createdAt: entry.createdAt || new Date(Date.now() - idx * 3600000).toISOString(),
          timestamp: Date.now() - idx * 3600000,
        };
        batch.set(dRef, cleanFirestoreData(formatted));
        authoritativeGuestbook.push(formatted);
      });
      await withFirestoreRetry(() => batch.commit());
      console.log(`✓ Server-Authoritative: Seeded ${INITIAL_GUESTBOOK.length} guestbook entries`);
    }

    isInitializedFromDb = true;

    // Resilient background sync: replaces fragile persistent gRPC onSnapshot streaming listeners
    // which encounter ECONNRESET / Code 14 when idle in container runtimes.
    async function syncFromFirestorePeriodic() {
      try {
        const cSnap = await withFirestoreRetry(() => getDoc(configRef));
        if (cSnap.exists()) {
          const remoteConfig = cSnap.data() as EventConfig;
          if (JSON.stringify(remoteConfig) !== JSON.stringify(authoritativeConfig)) {
            authoritativeConfig = { ...authoritativeConfig, ...remoteConfig };
            broadcastSSE('config_updated', authoritativeConfig);
          }
        }

        const gSnap = await withFirestoreRetry(() => getDocs(guestsCol));
        if (!gSnap.empty) {
          let changed = false;
          const remoteIds = new Set<string>();
          gSnap.forEach((d) => {
            remoteIds.add(d.id);
            if (!authoritativeDeletedGuestIds.has(d.id)) {
              const current = authoritativeGuests.get(d.id);
              const remoteData = { id: d.id, ...d.data() } as Guest;
              if (!current || JSON.stringify(current) !== JSON.stringify(remoteData)) {
                authoritativeGuests.set(d.id, remoteData);
                changed = true;
              }
            }
          });
          for (const [id] of authoritativeGuests) {
            if (!remoteIds.has(id)) {
              authoritativeGuests.delete(id);
              changed = true;
            }
          }
          if (changed) {
            broadcastSSE('guests_updated', Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id)));
          }
        }

        const gbookSnap = await withFirestoreRetry(() => getDocs(gbCol));
        if (!gbookSnap.empty) {
          const list: GuestbookEntry[] = [];
          gbookSnap.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as GuestbookEntry);
          });
          list.sort((a, b) => {
            const aF = Boolean(a.isFeatured);
            const bF = Boolean(b.isFeatured);
            if (aF !== bF) return aF ? -1 : 1;
            const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return tB - tA;
          });
          if (JSON.stringify(list) !== JSON.stringify(authoritativeGuestbook)) {
            authoritativeGuestbook = list;
            broadcastSSE('guestbook_updated', authoritativeGuestbook);
          }
        }
      } catch {
        // Handled silently
      }
    }

    // Run background sync every 25 seconds
    setInterval(() => {
      syncFromFirestorePeriodic().catch(() => {});
    }, 25000);

    // 4. Synchronize Cloudflare R2 configuration from Firestore if r2-config.json is absent on disk
    try {
      if (!getStoredR2ConfigFile()) {
        const r2Ref = doc(firestoreDb, 'event_config', 'r2_config');
        const r2Snap = await getDoc(r2Ref);
        if (r2Snap.exists()) {
          const r2Data = r2Snap.data();
          if (r2Data.accountId && r2Data.accessKeyId && r2Data.secretAccessKey && r2Data.bucketName) {
            saveR2ConfigFile({
              accountId: String(r2Data.accountId).trim(),
              accessKeyId: String(r2Data.accessKeyId).trim(),
              secretAccessKey: String(r2Data.secretAccessKey).trim(),
              bucketName: String(r2Data.bucketName).trim(),
              publicUrl: (r2Data.publicUrl || '').trim(),
              updatedAt: r2Data.updatedAt || undefined,
            });
            console.log('✓ Server-Authoritative: Synchronized Cloudflare R2 credentials from Firestore to r2-config.json');
          }
        }
      }
    } catch (r2BootErr) {
      console.warn('Notice: Could not load r2_config from Firestore on boot:', r2BootErr);
    }

    // 5. Synchronize ImageKit configuration from Firestore if imagekit-config.json is absent on disk
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        const ikRef = doc(firestoreDb, 'event_config', 'imagekit_config');
        const ikSnap = await getDoc(ikRef);
        if (ikSnap.exists()) {
          const ikData = ikSnap.data();
          if (ikData.privateKey && String(ikData.privateKey).trim()) {
            const ikPayload = {
              publicKey: (ikData.publicKey || '').trim(),
              privateKey: String(ikData.privateKey).trim(),
              urlEndpoint: (ikData.urlEndpoint || '').trim(),
              updatedAt: ikData.updatedAt || new Date().toISOString(),
            };
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(ikPayload, null, 2), 'utf-8');
            console.log('✓ Server-Authoritative: Synchronized ImageKit credentials from Firestore to imagekit-config.json');
          }
        }
      }
    } catch (ikBootErr) {
      console.warn('Notice: Could not load imagekit_config from Firestore on boot:', ikBootErr);
    }
  } catch (err) {
    console.error('Server-Authoritative initialization notice:', err);
  }
}

// ImageKit configuration management
interface ActiveImageKitConfig {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  source: 'custom' | 'env' | 'none';
  updatedAt?: string;
}

const CONFIG_FILE = path.resolve(process.cwd(), 'imagekit-config.json');

function getActiveImageKitConfig(): ActiveImageKitConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.privateKey && typeof data.privateKey === 'string' && data.privateKey.trim().length > 0) {
        return {
          publicKey: (data.publicKey || '').trim(),
          privateKey: data.privateKey.trim(),
          urlEndpoint: (data.urlEndpoint || '').trim(),
          source: 'custom',
          updatedAt: data.updatedAt || undefined,
        };
      }
    } catch (e) {
      console.warn('Failed to read imagekit-config.json:', e);
    }
  }

  const envPrivate = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
  if (envPrivate.length > 0) {
    return {
      publicKey: (process.env.IMAGEKIT_PUBLIC_KEY || '').trim(),
      privateKey: envPrivate,
      urlEndpoint: (process.env.IMAGEKIT_URL_ENDPOINT || '').trim(),
      source: 'env',
    };
  }

  return {
    publicKey: (process.env.IMAGEKIT_PUBLIC_KEY || '').trim(),
    privateKey: '',
    urlEndpoint: (process.env.IMAGEKIT_URL_ENDPOINT || '').trim(),
    source: 'none',
  };
}

function maskPrivateKey(key?: string): string {
  if (!key || !key.trim()) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 8)}••••${trimmed.slice(-4)}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB and authoritative state
  await initAuthoritativeState();

  // Support CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // SSE Heartbeat
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.res.write(`event: heartbeat\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  }, 20000);

  // ==========================================
  // SERVER-AUTHORITATIVE REAL-TIME SSE STREAM
  // ==========================================
  app.get('/api/events/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const client: SSEClient = { id: clientId, res };
    sseClients.add(client);

    // Immediate authoritative state synchronization
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, authoritative: true })}\n\n`);
    res.write(`event: full_state\ndata: ${JSON.stringify({
      config: authoritativeConfig,
      guests: Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id)),
      guestbook: authoritativeGuestbook,
      serverTime: Date.now(),
    })}\n\n`);

    req.on('close', () => {
      sseClients.delete(client);
    });
  });

  // ==========================================
  // SERVER-AUTHORITATIVE REST APIS
  // ==========================================

  // 1. System Authority Status
  app.get('/api/status', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const activeGuests = Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id));
    res.json({
      authoritative: true,
      mode: 'server-authoritative',
      firestoreDatabaseId: firebaseConfigRaw.firestoreDatabaseId,
      projectId: firebaseConfigRaw.projectId,
      initializedFromDb: isInitializedFromDb,
      sseClientsCount: sseClients.size,
      guestsCount: activeGuests.length,
      deletedGuestsCount: authoritativeDeletedGuestIds.size,
      guestbookCount: authoritativeGuestbook.length,
      serverTime: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 2. Full State Snapshot
  app.get('/api/state', (req: Request, res: Response) => {
    res.json({
      authoritative: true,
      config: authoritativeConfig,
      guests: Array.from(authoritativeGuests.values()),
      guestbook: authoritativeGuestbook,
      serverTime: Date.now(),
    });
  });

  // 3. Event Configuration - GET & UPDATE
  app.get('/api/config', (req: Request, res: Response) => {
    res.json(authoritativeConfig);
  });

  app.post('/api/config', async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid config payload' });
      }

      // Merge and update authoritative state
      authoritativeConfig = {
        ...authoritativeConfig,
        ...updates,
      };

      // Persist to Cloud Firestore
      const configRef = doc(firestoreDb, 'event_config', 'wedding_event');
      await withFirestoreRetry(() => setDoc(configRef, cleanFirestoreData(authoritativeConfig), { merge: true }));

      // Broadcast update to all active clients
      broadcastSSE('config_updated', authoritativeConfig);

      return res.json({
        success: true,
        authoritative: true,
        config: authoritativeConfig,
      });
    } catch (err: any) {
      console.error('Server save config error:', err);
      return res.status(500).json({
        error: 'Failed to update event configuration on server',
        details: err.message,
      });
    }
  });

  // 4. Guests - GET, SAVE, BATCH SAVE, DELETE, BATCH DELETE
  app.get('/api/guests', (req: Request, res: Response) => {
    const list = Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id));
    res.json(list);
  });

  app.post('/api/guests/save', async (req: Request, res: Response) => {
    try {
      const guest = req.body as Partial<Guest>;
      if (!guest || !guest.name || !guest.name.trim()) {
        return res.status(400).json({ error: 'Guest name is required' });
      }

      const id = guest.id || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const isCheckedIn = Boolean(guest.checkedIn || guest.is_checked_in);
      const checkedInAtVal = guest.arrivedAt || guest.checkedInAt || guest.checked_in_at || (isCheckedIn ? new Date().toISOString() : undefined);
      const sanitizedGuest: Guest = {
        id,
        name: guest.name.trim(),
        email: (guest.email || '').trim(),
        phone: (guest.phone || '').trim() || undefined,
        attending: guest.attending === 'no' ? 'no' : 'yes',
        count: Math.max(1, parseInt(String(guest.count || 1), 10) || 1),
        song: (guest.song || '').trim(),
        table: (guest.table || '').trim(),
        seat: (guest.seat || '').trim(),
        note: (guest.note || '').trim(),
        createdAt: guest.createdAt || new Date().toISOString(),
        checkedIn: isCheckedIn,
        is_checked_in: isCheckedIn,
        checkedInAt: checkedInAtVal,
        checked_in_at: checkedInAtVal,
        arrivedAt: checkedInAtVal,
        expectedArrivalTime: (guest.expectedArrivalTime || guest.expectedArrival || '').trim() || undefined,
        expectedArrival: (guest.expectedArrival || guest.expectedArrivalTime || '').trim() || undefined,
      };

      // Save to Firestore
      const docRef = doc(firestoreDb, 'guests', id);
      await withFirestoreRetry(() => setDoc(docRef, cleanFirestoreData(sanitizedGuest), { merge: true }));

      // Update server cache and clear tombstone if re-adding/updating
      authoritativeGuests.set(id, sanitizedGuest);
      if (authoritativeDeletedGuestIds.has(id)) {
        authoritativeDeletedGuestIds.delete(id);
        await persistDeletedGuestIds();
      }

      // Broadcast to all clients
      broadcastSSE('guest_saved', sanitizedGuest);
      broadcastSSE('guests_updated', Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id)));

      return res.json({
        success: true,
        authoritative: true,
        guest: sanitizedGuest,
      });
    } catch (err: any) {
      console.error('Server save guest error:', err);
      return res.status(500).json({
        error: 'Failed to save guest on server',
        details: err.message,
      });
    }
  });

  app.post('/api/guests/batch', async (req: Request, res: Response) => {
    try {
      const { guests } = req.body;
      if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'guests array is required' });
      }

      const batch = writeBatch(firestoreDb);
      const sanitizedList: Guest[] = [];

      guests.forEach((g: Partial<Guest>) => {
        const id = g.id || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const isCheckedIn = Boolean(g.checkedIn || g.is_checked_in);
        const checkedInAtVal = g.arrivedAt || g.checkedInAt || g.checked_in_at || (isCheckedIn ? new Date().toISOString() : undefined);
        const sanitized: Guest = {
          id,
          name: (g.name || 'Valued Guest').trim(),
          email: (g.email || '').trim(),
          phone: (g.phone || '').trim() || undefined,
          attending: g.attending === 'no' ? 'no' : 'yes',
          count: Math.max(1, parseInt(String(g.count || 1), 10) || 1),
          song: (g.song || '').trim(),
          table: (g.table || '').trim(),
          seat: (g.seat || '').trim(),
          note: (g.note || '').trim(),
          createdAt: g.createdAt || new Date().toISOString(),
          checkedIn: isCheckedIn,
          is_checked_in: isCheckedIn,
          checkedInAt: checkedInAtVal,
          checked_in_at: checkedInAtVal,
          arrivedAt: checkedInAtVal,
          expectedArrivalTime: (g.expectedArrivalTime || g.expectedArrival || '').trim() || undefined,
          expectedArrival: (g.expectedArrival || g.expectedArrivalTime || '').trim() || undefined,
        };
        const docRef = doc(firestoreDb, 'guests', id);
        batch.set(docRef, cleanFirestoreData(sanitized), { merge: true });
        authoritativeGuests.set(id, sanitized);
        authoritativeDeletedGuestIds.delete(id);
        sanitizedList.push(sanitized);
      });

      await withFirestoreRetry(() => batch.commit());
      await persistDeletedGuestIds();

      broadcastSSE('guests_updated', Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id)));

      return res.json({
        success: true,
        authoritative: true,
        count: sanitizedList.length,
        guests: sanitizedList,
      });
    } catch (err: any) {
      console.error('Server batch save guests error:', err);
      return res.status(500).json({
        error: 'Failed to batch save guests on server',
        details: err.message,
      });
    }
  });

  app.delete('/api/guests/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Guest id required' });

      const docRef = doc(firestoreDb, 'guests', id);
      await withFirestoreRetry(() => deleteDoc(docRef));

      authoritativeGuests.delete(id);
      authoritativeDeletedGuestIds.add(id);

      // Persist deleted guest tombstone so it is never re-seeded or resurrected
      await persistDeletedGuestIds();

      broadcastSSE('guest_deleted', { id });
      broadcastSSE('guests_updated', Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id)));

      return res.json({ success: true, authoritative: true, id });
    } catch (err: any) {
      console.error('Server delete guest error:', err);
      return res.status(500).json({
        error: 'Failed to delete guest on server',
        details: err.message,
      });
    }
  });

  app.post('/api/guests/batch-delete', async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array required' });
      }

      const batch = writeBatch(firestoreDb);
      ids.forEach((id: string) => {
        batch.delete(doc(firestoreDb, 'guests', id));
        authoritativeGuests.delete(id);
        authoritativeDeletedGuestIds.add(id);
      });

      await withFirestoreRetry(() => batch.commit());

      // Persist deleted guest tombstones
      await persistDeletedGuestIds();

      broadcastSSE('guests_batch_deleted', { ids });
      broadcastSSE('guests_updated', Array.from(authoritativeGuests.values()).filter((g) => !authoritativeDeletedGuestIds.has(g.id)));

      return res.json({ success: true, authoritative: true, count: ids.length });
    } catch (err: any) {
      console.error('Server batch delete guests error:', err);
      return res.status(500).json({
        error: 'Failed to batch delete guests on server',
        details: err.message,
      });
    }
  });

  // 5. Guestbook - GET, POST, DELETE
  app.get('/api/guestbook', (req: Request, res: Response) => {
    res.json(authoritativeGuestbook);
  });

  app.post('/api/guestbook', async (req: Request, res: Response) => {
    try {
      const entry = req.body as Partial<GuestbookEntry>;
      if (!entry.name || !entry.name.trim() || !entry.message || !entry.message.trim()) {
        return res.status(400).json({ error: 'Name and heartfelt message are required' });
      }

      const id = entry.id || `gb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const cleanImageUrl = (entry.imageUrl || '').trim();
      const cleanVideoUrl = (entry.videoUrl || '').trim();
      const cleanVideoThumbnail = (entry.videoThumbnail || '').trim();
      const cleanVideoDuration = typeof entry.videoDuration === 'number' && !isNaN(entry.videoDuration) ? entry.videoDuration : undefined;
      const isFeatured = typeof entry.isFeatured === 'boolean' ? entry.isFeatured : false;
      const featuredAt = entry.featuredAt || (isFeatured ? new Date().toISOString() : undefined);

      const newEntry: GuestbookEntry = {
        id,
        name: entry.name.trim(),
        message: entry.message.trim(),
        relationship: (entry.relationship || '').trim(),
        createdAt: entry.createdAt || new Date().toISOString(),
        timestamp: entry.timestamp || Date.now(),
        ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
        ...(cleanVideoUrl ? { videoUrl: cleanVideoUrl } : {}),
        ...(cleanVideoDuration !== undefined ? { videoDuration: cleanVideoDuration } : {}),
        ...(cleanVideoThumbnail ? { videoThumbnail: cleanVideoThumbnail } : {}),
        ...(isFeatured ? { isFeatured: true, featuredAt } : {}),
      };

      const docRef = doc(firestoreDb, 'guestbook', id);
      const firestoreData = cleanFirestoreData(newEntry);
      await withFirestoreRetry(() => setDoc(docRef, firestoreData));

      // Deduplicate cache so new entry replaces any previous version with same id
      const gbMap = new Map<string, GuestbookEntry>();
      gbMap.set(id, newEntry);
      for (const e of authoritativeGuestbook) {
        if (!gbMap.has(e.id)) {
          gbMap.set(e.id, e);
        }
      }
      authoritativeGuestbook = Array.from(gbMap.values()).sort((a, b) => {
        const aF = Boolean(a.isFeatured);
        const bF = Boolean(b.isFeatured);
        if (aF !== bF) return aF ? -1 : 1;
        const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
      });

      broadcastSSE('guestbook_entry_added', newEntry);
      broadcastSSE('guestbook_updated', authoritativeGuestbook);

      return res.json({
        success: true,
        authoritative: true,
        entry: newEntry,
      });
    } catch (err: any) {
      console.error('Server save guestbook entry error:', err);
      return res.status(500).json({
        error: 'Failed to add guestbook entry on server',
        details: err.message,
      });
    }
  });

  app.patch('/api/guestbook/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Entry ID required' });

      const updates = req.body as Partial<GuestbookEntry>;
      const docRef = doc(firestoreDb, 'guestbook', id);

      const existingEntry = authoritativeGuestbook.find((e) => e.id === id);
      const updatedEntry: GuestbookEntry = {
        ...(existingEntry || {
          id,
          name: 'Guest',
          message: '',
          createdAt: new Date().toISOString()
        }),
        ...updates,
        id,
      };

      if (typeof updates.isFeatured === 'boolean') {
        updatedEntry.isFeatured = updates.isFeatured;
        if (updates.isFeatured && !updatedEntry.featuredAt) {
          updatedEntry.featuredAt = new Date().toISOString();
        } else if (!updates.isFeatured) {
          delete updatedEntry.featuredAt;
        }
      }

      const firestoreData = cleanFirestoreData(updatedEntry);
      await withFirestoreRetry(() => setDoc(docRef, firestoreData, { merge: true }));

      // Update authoritative cache
      const gbMap = new Map<string, GuestbookEntry>();
      gbMap.set(id, updatedEntry);
      for (const e of authoritativeGuestbook) {
        if (!gbMap.has(e.id)) {
          gbMap.set(e.id, e);
        }
      }
      authoritativeGuestbook = Array.from(gbMap.values()).sort((a, b) => {
        const aF = Boolean(a.isFeatured);
        const bF = Boolean(b.isFeatured);
        if (aF !== bF) return aF ? -1 : 1;
        const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
      });

      broadcastSSE('guestbook_entry_updated', updatedEntry);
      broadcastSSE('guestbook_updated', authoritativeGuestbook);

      return res.json({
        success: true,
        authoritative: true,
        entry: updatedEntry,
      });
    } catch (err: any) {
      console.error('Server patch guestbook entry error:', err);
      return res.status(500).json({
        error: 'Failed to update guestbook entry on server',
        details: err.message,
      });
    }
  });

  app.delete('/api/guestbook/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Entry ID required' });

      // 1. Locate entry to identify associated video assets in Cloudflare R2
      let targetVideoUrl: string | undefined = req.body?.videoUrl || (req.query?.videoUrl as string);
      let targetVideoThumbnail: string | undefined = req.body?.videoThumbnail || (req.query?.videoThumbnail as string);

      // Check in-memory authoritative guestbook cache
      const cachedEntry = authoritativeGuestbook.find((e) => e.id === id);
      if (cachedEntry) {
        if (!targetVideoUrl && cachedEntry.videoUrl) targetVideoUrl = cachedEntry.videoUrl;
        if (!targetVideoThumbnail && cachedEntry.videoThumbnail) targetVideoThumbnail = cachedEntry.videoThumbnail;
      }

      // Check Firestore doc directly if not found or to ensure comprehensive cleanup
      const docRef = doc(firestoreDb, 'guestbook', id);
      if (!targetVideoUrl) {
        try {
          const docSnap = await withFirestoreRetry(() => getDoc(docRef));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.videoUrl) targetVideoUrl = data.videoUrl;
            if (data?.videoThumbnail) targetVideoThumbnail = data.videoThumbnail;
          }
        } catch (fetchErr) {
          console.warn(`[Guestbook] Notice reading doc before deletion:`, fetchErr);
        }
      }

      // 2. If a video is stored in Cloudflare R2, delete the file from the bucket
      let r2Deleted = false;
      let r2Message: string | undefined = undefined;

      if (targetVideoUrl) {
        try {
          const r2Res = await deleteObjectFromR2(targetVideoUrl);
          r2Deleted = r2Res.success;
          r2Message = r2Res.message;
          console.log(`[Cloudflare R2] Guestbook entry "${id}" video file cleanup:`, r2Res);
        } catch (r2Err: any) {
          console.warn(`[Cloudflare R2] Warning deleting video for guestbook entry "${id}":`, r2Err);
          r2Message = r2Err.message;
        }
      }

      // If thumbnail is also in R2
      if (targetVideoThumbnail && extractR2ObjectKey(targetVideoThumbnail)) {
        try {
          await deleteObjectFromR2(targetVideoThumbnail);
        } catch {
          // ignore
        }
      }

      // 3. Delete document from Firestore database
      await withFirestoreRetry(() => deleteDoc(docRef));

      // 4. Update authoritative state cache and broadcast
      authoritativeGuestbook = authoritativeGuestbook.filter((e) => e.id !== id);

      broadcastSSE('guestbook_entry_deleted', { id });
      broadcastSSE('guestbook_updated', authoritativeGuestbook);

      return res.json({ 
        success: true, 
        authoritative: true, 
        id, 
        videoDeleted: r2Deleted,
        r2Message
      });
    } catch (err: any) {
      console.error('Server delete guestbook entry error:', err);
      return res.status(500).json({
        error: 'Failed to delete guestbook entry on server',
        details: err.message,
      });
    }
  });

  // API: Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      authoritative: true,
      serverTime: new Date().toISOString(),
    });
  });

  // API: ImageKit status and active configuration
  app.get('/api/imagekit/status', (req, res) => {
    const config = getActiveImageKitConfig();
    res.json({
      configured: Boolean(config.privateKey && config.privateKey.length > 0),
      source: config.source,
      publicKey: config.publicKey,
      urlEndpoint: config.urlEndpoint,
      hasPrivateKey: Boolean(config.privateKey && config.privateKey.length > 0),
      maskedPrivateKey: maskPrivateKey(config.privateKey),
      rawPrivateKey: config.privateKey || '',
      updatedAt: config.updatedAt || null,
    });
  });

  // API: Test connection to ImageKit with provided or active keys
  app.post('/api/imagekit/test', async (req, res) => {
    try {
      const activeConfig = getActiveImageKitConfig();
      const privateKeyToTest = (req.body.privateKey || activeConfig.privateKey || '').trim();

      if (!privateKeyToTest) {
        return res.status(400).json({
          success: false,
          error: 'No Private Key provided or configured to test. Please enter your ImageKit Private Key (starts with private_).',
        });
      }

      if (privateKeyToTest.startsWith('public_')) {
        return res.status(400).json({
          success: false,
          error: "The Private Key provided starts with 'public_'. You entered your Public Key in the Private Key field. Please copy the Private Key (starts with 'private_') from ImageKit Developer Options.",
        });
      }

      const authHeader = 'Basic ' + Buffer.from(privateKeyToTest + ':').toString('base64');
      const testResponse = await fetch('https://api.imagekit.io/v1/files?limit=1', {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (testResponse.ok) {
        return res.json({
          success: true,
          message: '✓ ImageKit connection test successful! Your Private Key is valid and authorized.',
        });
      }

      const testData: any = await testResponse.json().catch(() => ({}));
      if (testResponse.status === 401 || testResponse.status === 403) {
        return res.status(400).json({
          success: false,
          error: 'Authentication failed. Please verify that your ImageKit Private Key (starts with private_) is correct.',
          details: testData,
        });
      }

      return res.status(testResponse.status).json({
        success: false,
        error: testData.message || `ImageKit returned HTTP status ${testResponse.status}`,
        details: testData,
      });
    } catch (err: any) {
      console.error('ImageKit test error:', err);
      return res.status(500).json({
        success: false,
        error: err.name === 'TimeoutError'
          ? 'Connection to ImageKit timed out. Please check your internet connection.'
          : (err.message || 'Unable to connect to ImageKit API. Please verify network connection.'),
      });
    }
  });

  // API: Save custom ImageKit credentials from Host Dashboard
  app.post('/api/imagekit/config', async (req, res) => {
    try {
      const { publicKey, privateKey, urlEndpoint, validateFirst, clear } = req.body;

      // Detect if user intends to delete / clear all ImageKit credentials
      const isClear = clear === true ||
        (publicKey !== undefined && privateKey !== undefined && urlEndpoint !== undefined &&
         !String(publicKey).trim() && !String(privateKey).trim() && !String(urlEndpoint).trim());

      if (isClear) {
        if (fs.existsSync(CONFIG_FILE)) {
          fs.unlinkSync(CONFIG_FILE);
        }
        const fallbackConfig = getActiveImageKitConfig();
        return res.json({
          success: true,
          cleared: true,
          message: '✓ ImageKit credentials deleted from server.',
          config: {
            configured: Boolean(fallbackConfig.privateKey && fallbackConfig.privateKey.length > 0),
            source: fallbackConfig.source,
            publicKey: fallbackConfig.publicKey,
            urlEndpoint: fallbackConfig.urlEndpoint,
            hasPrivateKey: Boolean(fallbackConfig.privateKey && fallbackConfig.privateKey.length > 0),
            maskedPrivateKey: maskPrivateKey(fallbackConfig.privateKey),
            rawPrivateKey: fallbackConfig.privateKey || '',
            updatedAt: null,
          },
        });
      }

      const activeConfig = getActiveImageKitConfig();
      const finalPrivateKey = (privateKey && String(privateKey).trim()) 
        ? String(privateKey).trim() 
        : activeConfig.privateKey;

      if (!finalPrivateKey) {
        return res.status(400).json({
          success: false,
          error: 'IMAGEKIT_PRIVATE_KEY is required to configure ImageKit cloud uploads, or pass empty fields to clear.',
        });
      }

      if (validateFirst) {
        const authHeader = 'Basic ' + Buffer.from(finalPrivateKey + ':').toString('base64');
        const testRes = await fetch('https://api.imagekit.io/v1/files?limit=1', {
          method: 'GET',
          headers: { Authorization: authHeader },
        });
        if (!testRes.ok) {
          return res.status(400).json({
            success: false,
            error: 'Invalid ImageKit Private Key. Please check the key from Developer Options in ImageKit.',
          });
        }
      }

      const finalPublicKey = publicKey !== undefined ? String(publicKey).trim() : (activeConfig.publicKey || '').trim();
      const finalUrlEndpoint = urlEndpoint !== undefined ? String(urlEndpoint).trim() : (activeConfig.urlEndpoint || '').trim();

      const newConfig = {
        publicKey: finalPublicKey,
        privateKey: finalPrivateKey,
        urlEndpoint: finalUrlEndpoint,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');

      return res.json({
        success: true,
        message: '✓ ImageKit credentials saved and activated successfully!',
        config: {
          configured: true,
          source: 'custom',
          publicKey: newConfig.publicKey,
          urlEndpoint: newConfig.urlEndpoint,
          hasPrivateKey: true,
          maskedPrivateKey: maskPrivateKey(newConfig.privateKey),
          rawPrivateKey: newConfig.privateKey,
          updatedAt: newConfig.updatedAt,
        },
      });
    } catch (err: any) {
      console.error('Failed to save ImageKit config:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to save ImageKit configuration on the server.',
      });
    }
  });

  // API: Explicitly delete ImageKit credentials from server
  app.post('/api/imagekit/clear', (req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
      }
      const fallbackConfig = getActiveImageKitConfig();
      return res.json({
        success: true,
        cleared: true,
        message: '✓ ImageKit credentials deleted from server.',
        config: {
          configured: Boolean(fallbackConfig.privateKey && fallbackConfig.privateKey.length > 0),
          source: fallbackConfig.source,
          publicKey: fallbackConfig.publicKey,
          urlEndpoint: fallbackConfig.urlEndpoint,
          hasPrivateKey: Boolean(fallbackConfig.privateKey && fallbackConfig.privateKey.length > 0),
          maskedPrivateKey: maskPrivateKey(fallbackConfig.privateKey),
          rawPrivateKey: fallbackConfig.privateKey || '',
          updatedAt: null,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to clear ImageKit configuration.',
      });
    }
  });

  // API: Reset ImageKit configuration to server environment defaults
  app.post('/api/imagekit/reset', (req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
      }
      const fallbackConfig = getActiveImageKitConfig();
      return res.json({
        success: true,
        cleared: true,
        message: '✓ Reset to server environment defaults.',
        config: {
          configured: Boolean(fallbackConfig.privateKey && fallbackConfig.privateKey.length > 0),
          source: fallbackConfig.source,
          publicKey: fallbackConfig.publicKey,
          urlEndpoint: fallbackConfig.urlEndpoint,
          hasPrivateKey: Boolean(fallbackConfig.privateKey && fallbackConfig.privateKey.length > 0),
          maskedPrivateKey: maskPrivateKey(fallbackConfig.privateKey),
          rawPrivateKey: fallbackConfig.privateKey || '',
          updatedAt: null,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to reset ImageKit configuration.',
      });
    }
  });

  // API: ImageKit direct server-side upload endpoint
  app.post('/api/imagekit/upload', async (req, res) => {
    try {
      const config = getActiveImageKitConfig();
      const privateKey = config.privateKey;

      if (!privateKey || !privateKey.trim()) {
        return res.status(400).json({
          error: 'ImageKit private key not configured. Please set your credentials in the Host Dashboard under ImageKit & Storage.',
          missingConfig: true,
        });
      }

      const { file, fileName, folder } = req.body;
      if (!file) {
        return res.status(400).json({ error: 'Missing file payload.' });
      }

      const cleanFileName = (fileName || `invitation-card-${Date.now()}.jpg`)
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', cleanFileName);
      formData.append('folder', folder || '/wedding-invitations');
      formData.append('useUniqueFileName', 'true');

      const authHeader = 'Basic ' + Buffer.from(privateKey.trim() + ':').toString('base64');

      const ikResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      const ikData: any = await ikResponse.json();

      if (!ikResponse.ok) {
        return res.status(ikResponse.status).json({
          error: ikData.message || ikData.help || 'ImageKit upload rejected.',
          details: ikData,
        });
      }

      return res.json({
        success: true,
        url: ikData.url,
        thumbnailUrl: ikData.thumbnailUrl || ikData.url,
        fileId: ikData.fileId,
        name: ikData.name,
        width: ikData.width,
        height: ikData.height,
        size: ikData.size,
      });
    } catch (err: any) {
      console.error('ImageKit upload error in server:', err);
      return res.status(500).json({
        error: err.message || 'Server failed to proxy upload to ImageKit.io',
      });
    }
  });

  // ==========================================
  // CLOUDFLARE R2 API ENDPOINTS
  // ==========================================

  // 1. Check Cloudflare R2 configuration status
  app.get('/api/r2/status', (req: Request, res: Response) => {
    try {
      const status = getR2Status();
      return res.json({
        success: true,
        ...status,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve Cloudflare R2 status',
      });
    }
  });

  // 2. Test Cloudflare R2 connection (with provided or stored credentials)
  app.post('/api/r2/test', async (req: Request, res: Response) => {
    try {
      const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } = req.body || {};
      const result = await testR2Connection({
        accountId,
        accessKeyId,
        secretAccessKey,
        bucketName,
        publicUrl,
      });
      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Error occurred while testing Cloudflare R2 connection',
      });
    }
  });

  // 3. Save custom Cloudflare R2 credentials permanently
  app.post('/api/r2/config', async (req: Request, res: Response) => {
    try {
      const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl, validateFirst, clear } = req.body;

      // Detect if user intends to delete / clear all R2 credentials
      const isClear = clear === true ||
        (accountId !== undefined && accessKeyId !== undefined && secretAccessKey !== undefined && bucketName !== undefined &&
         !String(accountId).trim() && !String(accessKeyId).trim() && !String(secretAccessKey).trim() && !String(bucketName).trim());

      if (isClear) {
        clearR2ConfigFile();
        try {
          await withFirestoreRetry(() => deleteDoc(doc(firestoreDb, 'event_config', 'r2_config')));
        } catch {
          // ignore
        }
        const fallbackStatus = getR2Status();
        return res.json({
          success: true,
          cleared: true,
          message: '✓ Cloudflare R2 credentials deleted from server and cloud.',
          status: fallbackStatus,
        });
      }

      const existingConfig = getR2Config();
      const finalAccountId = (accountId && String(accountId).trim()) || existingConfig?.accountId || '';
      const finalAccessKeyId = (accessKeyId && String(accessKeyId).trim()) || existingConfig?.accessKeyId || '';
      const finalSecretAccessKey = (secretAccessKey && String(secretAccessKey).trim()) || existingConfig?.secretAccessKey || '';
      const finalBucketName = (bucketName && String(bucketName).trim()) || existingConfig?.bucketName || '';
      let finalPublicUrl = publicUrl !== undefined ? String(publicUrl).trim() : (existingConfig?.publicUrl || '');

      if (!finalAccountId || !finalAccessKeyId || !finalSecretAccessKey || !finalBucketName) {
        return res.status(400).json({
          success: false,
          error: 'Cloudflare Account ID, Access Key ID, Secret Access Key, and Bucket Name are all required, or clear all fields to remove credentials.',
        });
      }

      if (validateFirst) {
        const testRes = await testR2Connection({
          accountId: finalAccountId,
          accessKeyId: finalAccessKeyId,
          secretAccessKey: finalSecretAccessKey,
          bucketName: finalBucketName,
          publicUrl: finalPublicUrl,
        });
        if (!testRes.success) {
          return res.status(400).json({
            success: false,
            error: testRes.message || 'Validation failed for Cloudflare R2 credentials.',
          });
        }
      }

      saveR2ConfigFile({
        accountId: finalAccountId,
        accessKeyId: finalAccessKeyId,
        secretAccessKey: finalSecretAccessKey,
        bucketName: finalBucketName,
        publicUrl: finalPublicUrl,
      });

      // Synchronize to Firestore event_config/r2_config so credentials persist across container restarts & machines
      try {
        await withFirestoreRetry(() => setDoc(doc(firestoreDb, 'event_config', 'r2_config'), {
          accountId: finalAccountId,
          accessKeyId: finalAccessKeyId,
          secretAccessKey: finalSecretAccessKey,
          bucketName: finalBucketName,
          publicUrl: finalPublicUrl,
          updatedAt: new Date().toISOString(),
        }, { merge: true }));
      } catch (cloudErr) {
        console.warn('Notice: Failed to sync r2_config to Firestore:', cloudErr);
      }

      const status = getR2Status();
      return res.json({
        success: true,
        message: '✓ Cloudflare R2 credentials saved and activated successfully across Cloud & Server!',
        status,
      });
    } catch (err: any) {
      console.error('Failed to save Cloudflare R2 config:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to save Cloudflare R2 configuration on the server.',
      });
    }
  });

  // 4. Explicitly delete Cloudflare R2 credentials from server and Cloud Firestore
  app.post('/api/r2/clear', async (req: Request, res: Response) => {
    try {
      clearR2ConfigFile();
      try {
        await withFirestoreRetry(() => deleteDoc(doc(firestoreDb, 'event_config', 'r2_config')));
      } catch {
        // ignore
      }
      const fallbackStatus = getR2Status();
      return res.json({
        success: true,
        cleared: true,
        message: '✓ Cloudflare R2 credentials permanently deleted from Cloud and Server.',
        status: fallbackStatus,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to clear Cloudflare R2 configuration.',
      });
    }
  });

  // 5. Reset Cloudflare R2 credentials
  app.post('/api/r2/reset', async (req: Request, res: Response) => {
    try {
      clearR2ConfigFile();
      try {
        await withFirestoreRetry(() => deleteDoc(doc(firestoreDb, 'event_config', 'r2_config')));
      } catch {
        // ignore
      }
      const fallbackStatus = getR2Status();
      return res.json({
        success: true,
        cleared: true,
        message: '✓ Cloudflare R2 credentials reset to defaults.',
        status: fallbackStatus,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to reset Cloudflare R2 configuration.',
      });
    }
  });

  // 3. Generate a Presigned Upload URL for direct-to-R2 client uploads
  app.post('/api/r2/presigned-url', async (req: Request, res: Response) => {
    try {
      const { fileName, contentType, folder } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({
          error: 'fileName and contentType are required to generate an R2 presigned upload URL',
        });
      }

      const result = await createR2PresignedUploadUrl({
        fileName: String(fileName),
        contentType: String(contentType),
        folder: folder ? String(folder) : 'guestbook-videos',
      });

      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error('Cloudflare R2 presigned URL generation error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate Cloudflare R2 upload ticket',
      });
    }
  });

  // 4. Direct Server-Side Upload (buffer/base64 proxy for environments without direct R2 CORS)
  app.post('/api/r2/upload-direct', async (req: Request, res: Response) => {
    try {
      const { dataUrl, fileName, contentType, folder } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'dataUrl (base64) is required' });
      }

      let buffer: Buffer;
      let resolvedContentType = contentType || 'video/mp4';

      const strData = String(dataUrl);
      const commaIdx = strData.indexOf(',');
      if (commaIdx !== -1) {
        const header = strData.slice(0, commaIdx);
        const base64Payload = strData.slice(commaIdx + 1);
        const mimeMatch = header.match(/^data:([^;,]+)/);
        if (mimeMatch) {
          resolvedContentType = mimeMatch[1];
        }
        buffer = Buffer.from(base64Payload, 'base64');
      } else {
        buffer = Buffer.from(strData, 'base64');
      }

      if (buffer.length === 0) {
        return res.status(400).json({ error: 'Decoded video buffer is empty' });
      }

      const result = await uploadBufferToR2({
        buffer,
        fileName: fileName ? String(fileName) : `guestbook_video_${Date.now()}.mp4`,
        contentType: resolvedContentType,
        folder: folder ? String(folder) : 'guestbook-videos',
      });

      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error('Cloudflare R2 direct upload error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to upload video to Cloudflare R2',
      });
    }
  });

  // 4b. Direct Raw Binary Upload (high speed streaming, bypasses base64 overhead)
  app.post(
    '/api/r2/upload-raw',
    express.raw({ type: ['video/*', 'application/octet-stream'], limit: '100mb' }),
    async (req: Request, res: Response) => {
      try {
        const fileName = (req.query.fileName as string) || (req.headers['x-file-name'] as string) || `guestbook_video_${Date.now()}.mp4`;
        const contentType = (req.query.contentType as string) || (req.headers['x-content-type'] as string) || (req.headers['content-type'] as string) || 'video/mp4';
        const folder = (req.query.folder as string) || 'guestbook-videos';

        const buffer = req.body;
        if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
          return res.status(400).json({ error: 'Empty binary payload received' });
        }

        const result = await uploadBufferToR2({
          buffer,
          fileName: decodeURIComponent(String(fileName)),
          contentType: decodeURIComponent(String(contentType)),
          folder: decodeURIComponent(String(folder)),
        });

        return res.json({
          success: true,
          ...result,
        });
      } catch (err: any) {
        console.error('Cloudflare R2 raw binary upload error:', err);
        return res.status(500).json({
          error: err.message || 'Failed to upload video stream to Cloudflare R2',
        });
      }
    }
  );

  // 5. Delete an object directly from Cloudflare R2
  app.post('/api/r2/delete', async (req: Request, res: Response) => {
    try {
      const videoUrl = req.body?.videoUrl || req.body?.objectKey || req.body?.url;
      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl or objectKey is required for Cloudflare R2 deletion',
        });
      }

      const result = await deleteObjectFromR2(String(videoUrl));
      return res.json(result);
    } catch (err: any) {
      console.error('Cloudflare R2 delete endpoint error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete object from Cloudflare R2',
      });
    }
  });

  app.delete('/api/r2/delete', async (req: Request, res: Response) => {
    try {
      const videoUrl = req.body?.videoUrl || req.body?.objectKey || req.query?.videoUrl || req.query?.objectKey;
      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl or objectKey is required for Cloudflare R2 deletion',
        });
      }

      const result = await deleteObjectFromR2(String(videoUrl));
      return res.json(result);
    } catch (err: any) {
      console.error('Cloudflare R2 delete endpoint error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete object from Cloudflare R2',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [Server-Authoritative]`);
  });
}

startServer();

