import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ChevronUp } from 'lucide-react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InvitationSection } from './components/InvitationSection';
import { SeatingSection } from './components/SeatingSection';
import { ScheduleSection } from './components/ScheduleSection';
import { VenueSection } from './components/VenueSection';
import { ChurchSection } from './components/ChurchSection';
import { GuestbookSection } from './components/GuestbookSection';
import { VideoBlessingsSection } from './components/VideoBlessingsSection';
import { RsvpSection } from './components/RsvpSection';
import { AudioPlayerDock } from './components/AudioPlayerDock';
import { GuestPassModal } from './components/GuestPassModal';
import { SeatingPlanModal } from './components/SeatingPlanModal';
import { GuestbookModal } from './components/GuestbookModal';
import { GiftModal } from './components/GiftModal';
import { GiftSection } from './components/GiftSection';
import { HostModal } from './components/HostModal';
import { HtmlCodeModal } from './components/HtmlCodeModal';
import { FallingLeavesBackground } from './components/FallingLeavesBackground';
import { AtmosphereLightingOverlay } from './components/AtmosphereLightingOverlay';
import { EventConfig, Guest, GuestbookEntry } from './types';
import { EVENT_PRESETS, INITIAL_GUESTS, INITIAL_GUESTBOOK } from './data/presets';
import { 
  subscribeToEventConfig, 
  saveEventConfigToCloud, 
  subscribeToGuests, 
  saveGuestToCloud, 
  deleteGuestFromCloud, 
  deleteMultipleGuestsFromCloud, 
  seedInitialGuestsToCloud,
  subscribeToGuestbook,
  addGuestbookEntryToCloud,
  deleteGuestbookEntryFromCloud,
  toggleFeatureGuestbookEntryInCloud,
  seedInitialGuestbookToCloud
} from './lib/firebase';
import { checkImageKitStatus } from './lib/imagekitClient';

export default function App() {
  // Load configuration with persistence
  const [config, setConfig] = useState<EventConfig>(() => {
    const defaultPreset = EVENT_PRESETS.wedding;
    try {
      const saved = localStorage.getItem('rsvp_event_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultPreset,
          subHeaderEnabled: parsed.subHeaderEnabled !== undefined ? parsed.subHeaderEnabled : (defaultPreset.subHeaderEnabled ?? true),
          invitationLine: parsed.invitationLine !== undefined ? parsed.invitationLine : (defaultPreset.invitationLine || 'Request the honour of your presence at the marriage of'),
          countdownTitle: parsed.countdownTitle !== undefined ? parsed.countdownTitle : (defaultPreset.countdownTitle || 'Countdown to the Sacred Celebration'),
          venueEnabled: parsed.venueEnabled !== undefined ? parsed.venueEnabled : (defaultPreset.venueEnabled ?? true),
          venueEyebrow: parsed.venueEyebrow || defaultPreset.venueEyebrow || 'The Celebration Grounds',
          venueTitle: parsed.venueTitle || defaultPreset.venueTitle || 'The Estate & Glasshouse',
          venueSubtitle: parsed.venueSubtitle || defaultPreset.venueSubtitle || 'Join us amid timeless coastal gardens and candlelit historic halls.',
          venueNotes: parsed.venueNotes !== undefined ? parsed.venueNotes : (defaultPreset.venueNotes || 'Valet and guest parking are available on-site at the estate entrance. Shuttle vans operate continuously between the sanctuary and celebration grounds.'),
          churchEnabled: parsed.churchEnabled !== undefined ? parsed.churchEnabled : (defaultPreset.churchEnabled ?? true),
          churchEyebrow: parsed.churchEyebrow || defaultPreset.churchEyebrow || 'The Holy Matrimony',
          churchTitle: parsed.churchTitle || defaultPreset.churchTitle || 'The Church Ceremony',
          churchSubtitle: parsed.churchSubtitle || defaultPreset.churchSubtitle || 'Join us as we exchange sacred vows and unite in holy matrimony.',
          churchName: parsed.churchName || defaultPreset.churchName || 'Holy Cross Parish Church',
          churchTime: (parsed.churchTime || defaultPreset.churchTime || '2:00 PM PST').replace(/\bEST\b/g, 'PST'),
          churchAddress: parsed.churchAddress || defaultPreset.churchAddress || '14 Spring Street, Newport, Rhode Island 02840',
          churchImg: parsed.churchImg || defaultPreset.churchImg || 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80',
          churchMapLink: parsed.churchMapLink || defaultPreset.churchMapLink || 'https://maps.google.com/?q=St+Mary+Church+Newport+RI',
          churchNotes: parsed.churchNotes || defaultPreset.churchNotes || 'Guests are kindly requested to be seated 15 minutes before the processional. Complimentary parking is available behind the sanctuary; guest shuttles depart for The Rosewood Estate directly following the benediction.',
          leavesAnimationEnabled: parsed.leavesAnimationEnabled !== undefined ? parsed.leavesAnimationEnabled : true,
          leavesStyle: parsed.leavesStyle || 'mixed',
          leavesDensity: parsed.leavesDensity || 'medium',
          atmosphereLighting: parsed.atmosphereLighting || 'none',
          leavesWindDirection: parsed.leavesWindDirection || 'calm',
          leavesScale: parsed.leavesScale || 'natural',
          titleFont: parsed.titleFont || 'great-vibes',
          titleWeight: parsed.titleWeight || 'normal',
          titleItalic: parsed.titleItalic !== undefined ? parsed.titleItalic : false,
          titleTransform: parsed.titleTransform || 'none',
          titleTracking: parsed.titleTracking || 'normal',
          titleSize: parsed.titleSize || 'majestic',
          totalTables: parsed.totalTables ? Math.max(1, parseInt(String(parsed.totalTables), 10) || 10) : (defaultPreset.totalTables || 10),
          seatsPerTable: parsed.seatsPerTable ? Math.max(1, parseInt(String(parsed.seatsPerTable), 10) || 12) : (defaultPreset.seatsPerTable || 12),
          ...parsed,
          time: (parsed.time || defaultPreset.time || '4:00 PM PST').replace(/\bEST\b/g, 'PST'),
          timezone: (parsed.timezone && parsed.timezone !== 'EST') ? parsed.timezone : 'PST',
          hostPassword: parsed.hostPassword || (typeof window !== 'undefined' ? localStorage.getItem('rsvp_host_password') : null) || defaultPreset.hostPassword || 'admin123',
          themeColor: parsed.themeColor || 'dusty-blue',
          heroImage: parsed.heroImage || defaultPreset.heroImage,
          deadline: parsed.deadline || parsed.rsvpDeadline || defaultPreset.deadline,
          rsvpDeadline: parsed.rsvpDeadline || parsed.deadline || defaultPreset.deadline
        };
      } else {
        const localHostPass = typeof window !== 'undefined' ? localStorage.getItem('rsvp_host_password') : null;
        if (localHostPass) {
          return {
            ...defaultPreset,
            hostPassword: localHostPass
          };
        }
      }
    } catch (e) {
      console.error('Failed to load saved event config', e);
    }
    return defaultPreset;
  });

  const [currentPresetKey, setCurrentPresetKey] = useState<string>('wedding');

  // Interactive falling leaves & petals animation toggle
  const [leavesEnabled, setLeavesEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rsvp_leaves_enabled');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });

  const handleToggleLeaves = () => {
    setLeavesEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rsvp_leaves_enabled', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Load guests with persistence
  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
      const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      const saved = localStorage.getItem('rsvp_guestData_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((g: any) => g && g.id && !deletedIds.includes(g.id));
        }
      }
      return INITIAL_GUESTS.filter((g) => !deletedIds.includes(g.id));
    } catch (e) {
      console.error('Failed to load saved guest list', e);
    }
    return INITIAL_GUESTS;
  });

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Modals state
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [isSeatingPlanModalOpen, setIsSeatingPlanModalOpen] = useState(false);
  const [isGuestPassModalOpen, setIsGuestPassModalOpen] = useState(false);
  const [isGuestbookModalOpen, setIsGuestbookModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedGuestForPass, setSelectedGuestForPass] = useState<Guest | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Guestbook Wishes & Love state with local persistence & Firestore sync
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>(() => {
    try {
      const saved = localStorage.getItem('rsvp_guestbook_entries_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = new Map<string, GuestbookEntry>();
          for (const item of parsed) {
            if (item && item.id) map.set(item.id, item);
          }
          return Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return timeB - timeA;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load local guestbook entries', e);
    }
    return INITIAL_GUESTBOOK;
  });

  // Strict deduplication helper to prevent duplicate React keys
  const setDedupedGuestbookEntries = (
    entriesOrUpdater: GuestbookEntry[] | ((prev: GuestbookEntry[]) => GuestbookEntry[])
  ) => {
    setGuestbookEntries((prev) => {
      const raw = typeof entriesOrUpdater === 'function' ? entriesOrUpdater(prev) : entriesOrUpdater;
      const map = new Map<string, GuestbookEntry>();
      for (const item of raw) {
        if (item && item.id) {
          map.set(item.id, item);
        }
      }
      return Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
    });
  };

  // Real-time Firestore Cloud Synchronization
  useEffect(() => {
    // 1. Subscribe to real-time event configuration
    const unsubscribeConfig = subscribeToEventConfig(
      (cloudConfig) => {
        if (cloudConfig && Object.keys(cloudConfig).length > 0) {
          const sanitizedCloud: Partial<EventConfig> = {
            ...cloudConfig,
            time: cloudConfig.time ? cloudConfig.time.replace(/\bEST\b/g, 'PST') : undefined,
            churchTime: cloudConfig.churchTime ? cloudConfig.churchTime.replace(/\bEST\b/g, 'PST') : undefined,
            timezone: cloudConfig.timezone === 'EST' ? 'PST' : (cloudConfig.timezone || 'PST')
          };
          Object.keys(sanitizedCloud).forEach(k => {
            if ((sanitizedCloud as Record<string, unknown>)[k] === undefined) {
              delete (sanitizedCloud as Record<string, unknown>)[k];
            }
          });
          setConfig((prev) => ({
            ...prev,
            ...sanitizedCloud
          }));
          if (cloudConfig.hostPassword) {
            try {
              localStorage.setItem('rsvp_host_password', cloudConfig.hostPassword);
            } catch (e) {
              // ignore
            }
          }
          setIsCloudConnected(true);
          try {
            localStorage.setItem('rsvp_event_config', JSON.stringify(cloudConfig));
          } catch (e) {
            // ignore
          }
        }
      },
      () => {
        setIsCloudConnected(false);
      }
    );

    // 2. Subscribe to real-time guests & RSVPs
    const unsubscribeGuests = subscribeToGuests(
      (cloudGuests) => {
        const rawDeleted = localStorage.getItem('rsvp_guests_deleted_ids');
        const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
        const filteredGuests = cloudGuests ? cloudGuests.filter((g) => g && g.id && !deletedIds.includes(g.id)) : [];

        if (filteredGuests.length > 0 || deletedIds.length > 0) {
          setGuests(filteredGuests);
          setIsCloudConnected(true);
          try {
            localStorage.setItem('rsvp_guestData_v2', JSON.stringify(filteredGuests));
          } catch (e) {
            // ignore
          }
        } else if (deletedIds.length === 0) {
          // If Firestore is completely empty on initial setup and no guests were deleted
          seedInitialGuestsToCloud(INITIAL_GUESTS).catch((err) => {
            console.warn('Initial guests seeding skipped:', err);
          });
        }
      },
      () => {
        setIsCloudConnected(false);
      }
    );

    // 3. Subscribe to real-time Guestbook wishes & love
    const unsubscribeGuestbook = subscribeToGuestbook(
      (cloudEntries) => {
        setDedupedGuestbookEntries(cloudEntries);
        setIsCloudConnected(true);
        try {
          const map = new Map<string, GuestbookEntry>();
          for (const item of cloudEntries) {
            if (item && item.id) map.set(item.id, item);
          }
          localStorage.setItem('rsvp_guestbook_entries_v1', JSON.stringify(Array.from(map.values())));
        } catch (e) {
          // ignore
        }
      },
      (err) => {
        console.info('Guestbook cloud subscription handled:', err);
      }
    );

    // Seed initial guestbook messages only if app has never been initialized
    if (typeof window !== 'undefined' && !localStorage.getItem('rsvp_guestbook_seeded_v1')) {
      seedInitialGuestbookToCloud(INITIAL_GUESTBOOK).catch((err) => {
        console.info('Initial guestbook cloud seed note:', err);
      });
    }

    // Initialize ImageKit status & sync across Server, Firestore, and LocalStorage
    checkImageKitStatus().catch((err) => {
      console.warn('Initial ImageKit status sync check:', err);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeGuests();
      unsubscribeGuestbook();
    };
  }, []);

  // Handle Guestbook submission with matched client & cloud IDs
  const handleSubmitGuestbookEntry = async (newEntry: Omit<GuestbookEntry, 'id'>) => {
    const entryId = `gb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEntry: GuestbookEntry = {
      ...newEntry,
      id: entryId
    };
    setDedupedGuestbookEntries((prev) => [fullEntry, ...prev.filter((e) => e.id !== entryId)]);
    try {
      const updated = [fullEntry, ...guestbookEntries.filter((e) => e.id !== entryId)];
      localStorage.setItem('rsvp_guestbook_entries_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save guestbook locally', e);
    }

    try {
      await addGuestbookEntryToCloud(newEntry, entryId);
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Saved guestbook entry locally, cloud sync error:', err);
    }
  };

  // Handle Guestbook deletion (Host Dashboard moderation) with persistent cloud deletion
  const handleDeleteGuestbookEntry = async (id: string, entryData?: Partial<GuestbookEntry>) => {
    const targetEntry = entryData || guestbookEntries.find((entry) => entry.id === id);
    setDedupedGuestbookEntries((prev) => prev.filter((entry) => entry.id !== id));
    try {
      const updated = guestbookEntries.filter((entry) => entry.id !== id);
      localStorage.setItem('rsvp_guestbook_entries_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save guestbook locally', e);
    }

    try {
      await deleteGuestbookEntryFromCloud(id, targetEntry);
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Deleted guestbook entry locally, cloud delete error:', err);
    }
  };

  // Handle toggling featured/pinned status of a guestbook entry
  const handleToggleFeatureGuestbookEntry = async (id: string, isFeatured: boolean) => {
    const featuredAt = isFeatured ? new Date().toISOString() : undefined;
    setDedupedGuestbookEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isFeatured, featuredAt: isFeatured ? (e.featuredAt || featuredAt) : undefined } : e))
    );
    try {
      const updated = guestbookEntries.map((e) =>
        e.id === id ? { ...e, isFeatured, featuredAt: isFeatured ? (e.featuredAt || featuredAt) : undefined } : e
      );
      localStorage.setItem('rsvp_guestbook_entries_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update guestbook locally', e);
    }

    try {
      await toggleFeatureGuestbookEntryInCloud(id, isFeatured);
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Toggled guestbook feature status locally, cloud sync error:', err);
    }
  };

  // Save config to local state, localStorage, and Firestore Cloud
  const saveConfig = async (newConfig: EventConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('rsvp_event_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save event config locally', e);
    }
    try {
      await saveEventConfigToCloud(newConfig);
      setIsCloudConnected(true);
    } catch (e) {
      console.warn('Failed to sync event config to Cloud Firestore', e);
    }
  };

  // Save guests to localStorage
  const saveGuests = (newGuests: Guest[]) => {
    setGuests(newGuests);
    try {
      localStorage.setItem('rsvp_guestData_v2', JSON.stringify(newGuests));
    } catch (e) {
      console.error('Failed to save guest list', e);
    }
  };

  // Preset selection
  const handleSelectPreset = (presetKey: string) => {
    if (EVENT_PRESETS[presetKey]) {
      setCurrentPresetKey(presetKey);
      saveConfig(EVENT_PRESETS[presetKey]);
    }
  };

  // Reset to current preset defaults
  const handleResetToDefaults = () => {
    const defaultPreset = EVENT_PRESETS[currentPresetKey] || EVENT_PRESETS.wedding;
    saveConfig(defaultPreset);
    try {
      localStorage.removeItem('rsvp_host_password');
      localStorage.removeItem('rsvp_guests_deleted_ids');
      localStorage.removeItem('rsvp_guestbook_deleted_ids');
    } catch {
      // ignore
    }
    saveGuests(INITIAL_GUESTS);
    seedInitialGuestsToCloud(INITIAL_GUESTS).catch((err) => console.warn('Reset cloud sync warning:', err));
  };

  // Audio controls & Auto-play engine
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    let hasStarted = false;

    const tryAutoPlay = () => {
      if (!audio || hasStarted) return;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            hasStarted = true;
            setIsPlayingAudio(true);
            cleanupInteractionListeners();
          })
          .catch(() => {
            // Autoplay policy prevented immediate playback without user gesture.
            // Will start automatically on the very first touch/scroll/click anywhere.
          });
      }
    };

    const handleFirstInteraction = () => {
      tryAutoPlay();
    };

    const cleanupInteractionListeners = () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    // 1. Attempt immediate playback without pressing play
    tryAutoPlay();

    // 2. Fallback listeners so any user tap, scroll, or click starts music automatically
    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('scroll', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      cleanupInteractionListeners();
    };
  }, [config.audioUrl]);

  const handleToggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn('Audio playback waiting for interaction:', err);
      });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
  };

  // Handle RSVP submission
  const handleSubmitRsvp = (submittedGuest: Omit<Guest, 'id' | 'createdAt'>) => {
    const cleanSubmittedPhone = (submittedGuest.phone || '').replace(/\D/g, '');
    const existingIndex = guests.findIndex(
      (g) =>
        (cleanSubmittedPhone && g.phone && g.phone.replace(/\D/g, '') === cleanSubmittedPhone) ||
        (submittedGuest.email && g.email && g.email.toLowerCase() === submittedGuest.email.toLowerCase()) ||
        g.name.toLowerCase() === submittedGuest.name.toLowerCase()
    );

    let assignedTable = submittedGuest.table;
    let assignedSeat = submittedGuest.seat;

    if (submittedGuest.attending === 'yes') {
      if (existingIndex !== -1 && guests[existingIndex].table && guests[existingIndex].table !== '-') {
        assignedTable = guests[existingIndex].table;
        assignedSeat = guests[existingIndex].seat;
      } else {
        // Calculate next available table & seat
        let currentSeated = 0;
        guests.forEach((g, idx) => {
          if (g.attending === 'yes' && idx !== existingIndex) {
            currentSeated += g.count || 1;
          }
        });

        const maxSeats = config.seatsPerTable || 12;
        const tableNum = Math.floor(currentSeated / maxSeats) + 1;
        const seatNum = (currentSeated % maxSeats) + 1;
        assignedTable = `Table ${tableNum}`;
        assignedSeat = `Seat ${seatNum}`;
      }
    } else {
      assignedTable = '-';
      assignedSeat = '-';
    }

    let updatedList: Guest[];
    let finalGuest: Guest;

    if (existingIndex !== -1) {
      finalGuest = {
        ...guests[existingIndex],
        ...submittedGuest,
        table: assignedTable,
        seat: assignedSeat
      };
      updatedList = [...guests];
      updatedList[existingIndex] = finalGuest;
    } else {
      finalGuest = {
        ...submittedGuest,
        id: `guest_${Date.now()}`,
        table: assignedTable,
        seat: assignedSeat,
        createdAt: new Date().toISOString()
      };
      updatedList = [...guests, finalGuest];
    }

    saveGuests(updatedList);
    saveGuestToCloud(finalGuest).catch((err) => console.warn('RSVP cloud sync error:', err));

    if (submittedGuest.attending === 'yes') {
      setSelectedGuestForPass(finalGuest);
      setIsGuestPassModalOpen(true);
    }
  };

  // Guest actions from Host portal
  const handleUpdateGuest = (updatedGuest: Guest) => {
    const updated = guests.map((g) => (g.id === updatedGuest.id ? updatedGuest : g));
    saveGuests(updated);
    saveGuestToCloud(updatedGuest).catch((err) => console.warn('Guest cloud update error:', err));
  };

  const handleDeleteGuest = (guestId: string) => {
    try {
      const raw = localStorage.getItem('rsvp_guests_deleted_ids');
      const set: string[] = raw ? JSON.parse(raw) : [];
      if (!set.includes(guestId)) {
        set.push(guestId);
        localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(set));
      }
    } catch {
      // ignore
    }

    const updated = guests.filter((g) => g.id !== guestId);
    saveGuests(updated);
    deleteGuestFromCloud(guestId).catch((err) => console.warn('Guest cloud delete error:', err));
  };

  const handleDeleteGuests = (guestIds: string[]) => {
    if (!guestIds || guestIds.length === 0) return;
    try {
      const raw = localStorage.getItem('rsvp_guests_deleted_ids');
      const set: string[] = raw ? JSON.parse(raw) : [];
      guestIds.forEach((id) => {
        if (!set.includes(id)) set.push(id);
      });
      localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(set));
    } catch {
      // ignore
    }

    const idSet = new Set(guestIds);
    const updated = guests.filter((g) => !idSet.has(g.id));
    saveGuests(updated);
    deleteMultipleGuestsFromCloud(guestIds).catch((err) => console.warn('Batch guest cloud delete error:', err));
  };

  const handleAddGuest = (newGuestData: Omit<Guest, 'id' | 'createdAt'>) => {
    const newGuest: Guest = {
      ...newGuestData,
      id: `guest_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    try {
      const raw = localStorage.getItem('rsvp_guests_deleted_ids');
      if (raw) {
        const set: string[] = JSON.parse(raw);
        const filtered = set.filter((id) => id !== newGuest.id);
        localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
    saveGuests([...guests, newGuest]);
    saveGuestToCloud(newGuest).catch((err) => console.warn('New guest cloud save error:', err));
  };

  const handleImportGuests = (imported: Partial<Guest>[]) => {
    const currentList = [...guests];
    imported.forEach((item) => {
      if (!item.name) return;
      const existingIdx = currentList.findIndex(
        (g) => g.name.toLowerCase() === item.name!.toLowerCase()
      );

      if (existingIdx !== -1) {
        currentList[existingIdx] = {
          ...currentList[existingIdx],
          ...item
        } as Guest;
      } else {
        const newId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        try {
          const raw = localStorage.getItem('rsvp_guests_deleted_ids');
          if (raw) {
            const set: string[] = JSON.parse(raw);
            const filtered = set.filter((id) => id !== newId);
            localStorage.setItem('rsvp_guests_deleted_ids', JSON.stringify(filtered));
          }
        } catch {
          // ignore
        }
        currentList.push({
          id: newId,
          name: item.name,
          phone: (item as any).phone || (item as any).mobile || (item as any).contact || '',
          email: item.email || '',
          attending: item.attending || 'yes',
          count: item.count || 1,
          song: item.song || '',
          table: item.table || 'Table 1',
          seat: item.seat || 'Seat 1',
          note: item.note || '',
          createdAt: new Date().toISOString()
        });
      }
    });

    saveGuests(currentList);
    seedInitialGuestsToCloud(currentList).catch((err) => console.warn('Guest import cloud sync error:', err));
  };

  return (
    <div
      data-wedding-theme={config.themeColor || 'dusty-blue'}
      className="min-h-screen flex flex-col justify-between relative selection:bg-[#3A5A74] selection:text-white"
      style={{
        backgroundImage: `url('${config.bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Classic Romantic Wedding Stationery Overlay */}
      <div className="fixed inset-0 bg-[#f0f4f8]/85 backdrop-blur-[1px] pointer-events-none z-0"></div>

      {/* Atmospheric Ambient Lighting / Glow Filter Overlay */}
      {config.atmosphereLighting && config.atmosphereLighting !== 'none' && (
        <AtmosphereLightingOverlay mode={config.atmosphereLighting} />
      )}

      {/* Faded Beautiful Falling Animated Leaves, Petals & Stardust for Wedding */}
      <FallingLeavesBackground
        enabled={leavesEnabled && config.leavesAnimationEnabled !== false}
        style={config.leavesStyle || 'mixed'}
        density={config.leavesDensity || 'medium'}
        theme={config.themeColor || 'dusty-blue'}
        windDirection={config.leavesWindDirection || 'calm'}
        scale={config.leavesScale || 'natural'}
        atmosphereLighting={config.atmosphereLighting || 'none'}
      />

      {/* Background audio element */}
      <audio
        ref={audioRef}
        src={config.audioUrl}
        loop
        autoPlay
        preload="auto"
        onPlay={() => setIsPlayingAudio(true)}
        onPause={() => setIsPlayingAudio(false)}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation & Toolbar Header */}
        <Header
          config={config}
          isPlayingAudio={isPlayingAudio}
          onToggleAudio={handleToggleAudio}
          onOpenHtmlModal={() => setIsHtmlModalOpen(true)}
          onOpenGuestbookModal={() => setIsGuestbookModalOpen(true)}
          onOpenGiftModal={() => setIsGiftModalOpen(true)}
          onSelectPreset={handleSelectPreset}
          currentPresetKey={currentPresetKey}
          leavesEnabled={leavesEnabled}
          onToggleLeaves={handleToggleLeaves}
        />

        {/* Main Content Sections */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-12 w-full flex-1">
          {/* Hero Section with countdown */}
          <HeroSection
            config={config}
          />

          {/* Formal Invitation Slideshow Suite */}
          {config.invitationEnabled !== false && (
            <InvitationSection config={config} />
          )}

          {/* Seating Assignment & Guest Lookup */}
          <SeatingSection
            guests={guests}
            onSelectGuestForPass={(g) => {
              setSelectedGuestForPass(g);
              setIsGuestPassModalOpen(true);
            }}
            onOpenSeatingPlanModal={() => setIsSeatingPlanModalOpen(true)}
          />

          {/* Church Ceremony Details */}
          {config.churchEnabled !== false && (
            <ChurchSection config={config} />
          )}

          {/* Venue & Location Details (The Celebration Grounds) */}
          {config.venueEnabled !== false && (
            <VenueSection config={config} />
          )}

          {/* Schedule of Events Timeline (Order of the Day) */}
          <ScheduleSection timeline={config.timeline} config={config} />

          {/* Keepsake Guestbook - Wishes & Love */}
          {config.guestbookEnabled !== false && (
            <GuestbookSection
              config={config}
              entries={guestbookEntries}
              onSubmitEntry={handleSubmitGuestbookEntry}
              onOpenModal={() => setIsGuestbookModalOpen(true)}
            />
          )}

          {/* Dedicated Video Blessings Section (Cloudflare R2) */}
          {config.videoBlessingsEnabled !== false && (
            <VideoBlessingsSection
              config={config}
              entries={guestbookEntries}
              onSubmitEntry={handleSubmitGuestbookEntry}
            />
          )}

          {/* RSVP Form Section */}
          <RsvpSection
            config={config}
            onSubmitRsvp={handleSubmitRsvp}
          />

          {/* Monetary Gift & QR Code Registry Section */}
          {config.giftEnabled !== false && (
            <GiftSection
              config={config}
              onOpenModal={() => setIsGiftModalOpen(true)}
            />
          )}
        </main>

        {/* Floating Audio Player Bar */}
        <AudioPlayerDock
          isPlaying={isPlayingAudio}
          onTogglePlay={handleToggleAudio}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          trackTitle={config.title ? `${config.title} · Serenade` : 'Canon in D · Classical Romance'}
        />

        {/* Footer */}
        <footer className="relative z-10 py-10 text-center text-xs font-serif text-[#475569] bg-[#ffffff]/95 border-t border-[#c8d7e3] mt-16 shadow-sm">
          <div className="flex items-center justify-center space-x-2 text-[#3A5A74] mb-2 text-sm">
            <span>❦</span>
            <span className="font-serif italic tracking-wider">With love, joy, and gratitude</span>
            <span>❦</span>
          </div>
          <p className="font-serif text-[#3A5A74]/80">© {config.title}. Forever & Always.</p>

          {/* Discreet Staff / Host Access Portal */}
          <div className="mt-5 pt-3.5 border-t border-[#e2ecf4]/80 max-w-xs mx-auto flex items-center justify-center">
            <button
              id="footer-host-btn"
              onClick={() => setIsHostModalOpen(true)}
              title="Host Dashboard (Wedding Staff & Organizers Only)"
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-serif text-[#64748b] hover:text-[#3A5A74] hover:bg-[#ebf2f7] transition border border-transparent hover:border-[#c8d7e3] cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3A5A74]/70" />
              <span>Host Dashboard (Staff Only)</span>
            </button>
          </div>
        </footer>

        {/* Floating Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full bg-[#ffffff]/95 backdrop-blur-md hover:bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] shadow-[0_6px_24px_rgba(58,90,116,0.18)] hover:shadow-[0_8px_30px_rgba(58,90,116,0.28)] flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 active:scale-90 cursor-pointer animate-in fade-in"
            title="Return to Top"
            aria-label="Back to Top"
          >
            <ChevronUp className="w-5 h-5 text-[#3A5A74]" />
          </button>
        )}
      </div>

      {/* Modals */}
      <GuestPassModal
        guest={selectedGuestForPass}
        config={config}
        isOpen={isGuestPassModalOpen}
        onClose={() => setIsGuestPassModalOpen(false)}
      />

      <SeatingPlanModal
        guests={guests}
        config={config}
        isOpen={isSeatingPlanModalOpen}
        onClose={() => setIsSeatingPlanModalOpen(false)}
      />

      <GuestbookModal
        isOpen={isGuestbookModalOpen}
        onClose={() => setIsGuestbookModalOpen(false)}
        config={config}
        entries={guestbookEntries}
        onSubmitEntry={handleSubmitGuestbookEntry}
      />

      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        config={config}
      />

      <HostModal
        isOpen={isHostModalOpen}
        onClose={() => setIsHostModalOpen(false)}
        guests={guests}
        onUpdateGuest={handleUpdateGuest}
        onDeleteGuest={handleDeleteGuest}
        onDeleteGuests={handleDeleteGuests}
        onAddGuest={handleAddGuest}
        onImportGuests={handleImportGuests}
        config={config}
        onSaveConfig={saveConfig}
        onSaveGuests={saveGuests}
        onResetToDefaults={handleResetToDefaults}
        isCloudConnected={isCloudConnected}
        guestbookEntries={guestbookEntries}
        onDeleteGuestbookEntry={handleDeleteGuestbookEntry}
        onAddGuestbookEntry={handleSubmitGuestbookEntry}
        onToggleFeatureGuestbookEntry={handleToggleFeatureGuestbookEntry}
      />

      <HtmlCodeModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        config={config}
        guests={guests}
      />
    </div>
  );
}
