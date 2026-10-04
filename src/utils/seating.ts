import { Guest } from '../types';

/**
 * Calculates the total chairs/seats occupied at a table by summing each guest's party size (count).
 * If count is undefined or 0 for an attending guest, defaults to 1.
 */
export function getTableOccupiedSeats(guests: Guest[]): number {
  return guests.reduce((sum, g) => {
    const size = Math.max(1, typeof g.count === 'number' ? g.count : 1);
    return sum + size;
  }, 0);
}

/**
 * Calculates remaining available chairs at a table.
 */
export function getTableAvailableSeats(guests: Guest[], maxSeatsPerTable: number): number {
  const occupied = getTableOccupiedSeats(guests);
  return Math.max(0, maxSeatsPerTable - occupied);
}

/**
 * Extracts numeric seat ranges occupied by guests at a table.
 * For example, if a guest is assigned "Seat 3" with count = 2, they occupy seats 3 and 4.
 */
export function getOccupiedSeatIndices(
  guests: Guest[],
  excludeGuestId?: string
): Set<number> {
  const occupied = new Set<number>();

  guests.forEach((g) => {
    if (excludeGuestId && g.id === excludeGuestId) return;

    const seatStr = (g.seat || '').trim();
    const count = Math.max(1, typeof g.count === 'number' ? g.count : 1);

    // Try to extract starting number from "Seat 3", "3", "Table 1 - Seat 4", etc.
    const match = seatStr.match(/\b(?:seat\s*)?(\d+)/i);
    if (match) {
      const startNum = parseInt(match[1], 10);
      if (!isNaN(startNum) && startNum > 0) {
        for (let i = 0; i < count; i++) {
          occupied.add(startNum + i);
        }
        return;
      }
    }

    // If seat string is non-numeric (e.g. "Head Table Chair A"), we don't index as number
  });

  return occupied;
}

export interface AvailableSeatOption {
  value: string;
  label: string;
  isAvailable: boolean;
  fitsParty?: boolean;
}

/**
 * Generates available seat options for dropdown selection at a table.
 */
export function getAvailableSeatOptions(
  tableGuests: Guest[],
  maxSeats: number,
  guestPartySize: number = 1,
  currentSeat?: string,
  excludeGuestId?: string
): AvailableSeatOption[] {
  const safePartySize = Math.max(1, guestPartySize);
  const occupied = getOccupiedSeatIndices(tableGuests, excludeGuestId);
  const options: AvailableSeatOption[] = [];

  // Determine current seat number if any
  let currentStartNum: number | null = null;
  if (currentSeat) {
    const m = currentSeat.match(/\b(?:seat\s*)?(\d+)/i);
    if (m) currentStartNum = parseInt(m[1], 10);
  }

  // Generate options from Seat 1 up to maxSeats (or higher if overflow)
  const totalSlots = Math.max(maxSeats, ...Array.from(occupied), (currentStartNum || 0) + safePartySize);

  for (let i = 1; i <= Math.min(50, Math.max(maxSeats, totalSlots)); i++) {
    const isCurrent = currentStartNum === i;
    let willFit = true;

    // Check if consecutive seats i .. i + safePartySize - 1 are free
    for (let offset = 0; offset < safePartySize; offset++) {
      const checkSeat = i + offset;
      if (occupied.has(checkSeat) && !(isCurrent && offset < safePartySize)) {
        willFit = false;
        break;
      }
    }

    const isSlotOccupied = occupied.has(i) && !isCurrent;
    const seatVal = `Seat ${i}`;

    let label = `Seat ${i}`;
    if (safePartySize > 1) {
      label = `Seat ${i} (Seats ${i}–${i + safePartySize - 1} • Party of ${safePartySize})`;
    }

    if (isCurrent) {
      label += ' (Current Seat)';
    } else if (isSlotOccupied) {
      label += ' (Occupied)';
    } else if (!willFit && safePartySize > 1) {
      label += ' (Partially blocked)';
    } else {
      label += ' (Available)';
    }

    options.push({
      value: seatVal,
      label,
      isAvailable: !isSlotOccupied,
      fitsParty: willFit
    });
  }

  // If current seat is non-standard (e.g. "VIP High Chair" or "Host Chair"), include it
  if (currentSeat && !options.some((o) => o.value.toLowerCase() === currentSeat.trim().toLowerCase())) {
    options.unshift({
      value: currentSeat.trim(),
      label: `${currentSeat.trim()} (Current Custom Seat)`,
      isAvailable: true,
      fitsParty: true
    });
  }

  return options;
}

/**
 * Returns the first available seat label for a table that fits the guest's party size.
 */
export function getFirstAvailableSeat(
  tableGuests: Guest[],
  maxSeats: number,
  guestPartySize: number = 1,
  excludeGuestId?: string
): string {
  const options = getAvailableSeatOptions(tableGuests, maxSeats, guestPartySize, undefined, excludeGuestId);
  const best = options.find((o) => o.isAvailable && o.fitsParty) || options.find((o) => o.isAvailable);
  return best ? best.value : `Seat 1`;
}
