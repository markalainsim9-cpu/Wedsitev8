/**
 * Timezone utilities for event countdown timer, scheduling, and calendar sync.
 * Default timezone is Pacific Standard / Daylight Time (PST / PDT, America/Los_Angeles).
 */

export interface TimezoneOption {
  code: string;
  name: string;
  iana: string;
  utcOffsetDesc: string;
}

export const SUPPORTED_TIMEZONES: TimezoneOption[] = [
  { code: 'PST', name: 'Pacific Time (PST / PDT)', iana: 'America/Los_Angeles', utcOffsetDesc: 'UTC-8 / UTC-7' },
  { code: 'EST', name: 'Eastern Time (EST / EDT)', iana: 'America/New_York', utcOffsetDesc: 'UTC-5 / UTC-4' },
  { code: 'CST', name: 'Central Time (CST / CDT)', iana: 'America/Chicago', utcOffsetDesc: 'UTC-6 / UTC-5' },
  { code: 'MST', name: 'Mountain Time (MST / MDT)', iana: 'America/Denver', utcOffsetDesc: 'UTC-7 / UTC-6' },
  { code: 'HST', name: 'Hawaii Time (HST)', iana: 'Pacific/Honolulu', utcOffsetDesc: 'UTC-10' },
  { code: 'AKST', name: 'Alaska Time (AKST / AKDT)', iana: 'America/Anchorage', utcOffsetDesc: 'UTC-9 / UTC-8' },
  { code: 'UTC', name: 'Coordinated Universal Time (UTC)', iana: 'UTC', utcOffsetDesc: 'UTC+0' },
  { code: 'GMT', name: 'Greenwich / British Time (GMT / BST)', iana: 'Europe/London', utcOffsetDesc: 'UTC+0 / UTC+1' },
  { code: 'CET', name: 'Central European Time (CET / CEST)', iana: 'Europe/Paris', utcOffsetDesc: 'UTC+1 / UTC+2' },
  { code: 'SGT', name: 'Singapore / Hong Kong (SGT / HKT)', iana: 'Asia/Singapore', utcOffsetDesc: 'UTC+8' },
  { code: 'JST', name: 'Japan & Korea Time (JST / KST)', iana: 'Asia/Tokyo', utcOffsetDesc: 'UTC+9' },
  { code: 'AEST', name: 'Australian Eastern Time (AEST / AEDT)', iana: 'Australia/Sydney', utcOffsetDesc: 'UTC+10 / UTC+11' }
];

export const DEFAULT_TIMEZONE = 'PST';

const TZ_IANA_MAP: Record<string, string> = {
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  PT: 'America/Los_Angeles',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  ET: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  CT: 'America/Chicago',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  MT: 'America/Denver',
  HST: 'Pacific/Honolulu',
  AKST: 'America/Anchorage',
  AKDT: 'America/Anchorage',
  UTC: 'UTC',
  GMT: 'Europe/London',
  BST: 'Europe/London',
  CET: 'Europe/Paris',
  CEST: 'Europe/Paris',
  SGT: 'Asia/Singapore',
  HKT: 'Asia/Hong_Kong',
  JST: 'Asia/Tokyo',
  KST: 'Asia/Seoul',
  AEST: 'Australia/Sydney',
  AEDT: 'Australia/Sydney'
};

/**
 * Get IANA timezone name from abbreviation (defaulting to America/Los_Angeles for PST)
 */
export function getIanaTimezone(tzCode: string = DEFAULT_TIMEZONE): string {
  const upper = tzCode.trim().toUpperCase();
  return TZ_IANA_MAP[upper] || 'America/Los_Angeles';
}

/**
 * Converts a target date & time into an absolute UTC millisecond timestamp
 * based on the specified event timezone (default: PST / America/Los_Angeles).
 */
export function getEventTargetTimestamp(
  targetDateStr?: string,
  dateStr?: string,
  timeStr?: string,
  tzCode: string = DEFAULT_TIMEZONE
): number {
  const ianaTz = getIanaTimezone(tzCode);

  let y: number, m: number, d: number;
  let h = 14, min = 0, s = 0; // Default to 2:00 PM (14:00) for Wedding Church & Ceremony

  let matched = false;
  if (targetDateStr) {
    const isoMatch = targetDateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (isoMatch) {
      y = parseInt(isoMatch[1], 10);
      m = parseInt(isoMatch[2], 10);
      d = parseInt(isoMatch[3], 10);
      if (isoMatch[4] !== undefined) h = parseInt(isoMatch[4], 10);
      if (isoMatch[5] !== undefined) min = parseInt(isoMatch[5], 10);
      if (isoMatch[6] !== undefined) s = parseInt(isoMatch[6], 10);
      matched = true;
    }
  }

  // If timeStr (church ceremony start time, e.g. "2:00 PM PST") is provided,
  // the countdown timer MUST ALWAYS target the church ceremony start time (Church), not the /#venue or Reception Gala
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const ampm = timeMatch[4]?.toUpperCase();

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      // Always set hours and minutes to ceremony time
      h = hours;
      min = minutes;
      s = seconds;
    }
  }

  if (!matched && dateStr) {
    // Try to parse natural or display date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      y = parsed.getFullYear();
      m = parsed.getMonth() + 1;
      d = parsed.getDate();
      matched = true;
    }
  }

  if (!matched) {
    return NaN;
  }

  // Iteratively determine exact UTC timestamp for local wall-clock time in ianaTz
  try {
    let guess = Date.UTC(y!, m! - 1, d!, h, min, s);
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    for (let i = 0; i < 3; i++) {
      const parts = dtf.formatToParts(new Date(guess));
      const map: Record<string, string> = {};
      for (const p of parts) map[p.type] = p.value;

      const tzH = parseInt(map.hour, 10) === 24 ? 0 : parseInt(map.hour, 10);
      const tzMin = parseInt(map.minute, 10);
      const tzSec = parseInt(map.second, 10);
      const tzY = parseInt(map.year, 10);
      const tzM = parseInt(map.month, 10);
      const tzD = parseInt(map.day, 10);

      const targetWallAsUtc = Date.UTC(y!, m! - 1, d!, h, min, s);
      const producedWallAsUtc = Date.UTC(tzY, tzM - 1, tzD, tzH, tzMin, tzSec);
      const diff = targetWallAsUtc - producedWallAsUtc;

      if (diff === 0) break;
      guess += diff;
    }
    return guess;
  } catch {
    // Fallback: assume Pacific daylight/standard offset roughly -8 / -7
    return Date.UTC(y!, m! - 1, d!, h + 7, min, s);
  }
}

/**
 * Formats a given timestamp to a local readable string in the target timezone
 */
export function formatInEventTimezone(
  timestamp: number | Date,
  tzCode: string = DEFAULT_TIMEZONE,
  options?: Intl.DateTimeFormatOptions
): string {
  const ianaTz = getIanaTimezone(tzCode);
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ianaTz,
    timeZoneName: 'short'
  };

  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(date);
}

/**
 * Returns human-readable label for a timezone code
 */
export function getTimezoneLabel(tzCode: string = DEFAULT_TIMEZONE): string {
  const found = SUPPORTED_TIMEZONES.find(t => t.code.toUpperCase() === tzCode.toUpperCase());
  return found ? found.name : `${tzCode} Time`;
}
