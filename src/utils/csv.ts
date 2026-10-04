import { Guest, GuestbookEntry } from '../types';

export function exportGuestbookToCsv(entries: GuestbookEntry[], filename = 'guestbook_wishes_export.csv') {
  const header = ['Name', 'Relationship', 'Message', 'Date'];
  const rows = entries.map(e => [
    `"${(e.name || '').replace(/"/g, '""')}"`,
    `"${(e.relationship || '').replace(/"/g, '""')}"`,
    `"${(e.message || '').replace(/"/g, '""')}"`,
    `"${(e.createdAt || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportMediaKeepsakesToCsv(entries: GuestbookEntry[], filename = 'media_blessings_keepsakes_export.csv') {
  const header = ['Name', 'Relationship', 'MediaType', 'StorageCloud', 'MediaUrl', 'DurationSeconds', 'MessageCaption', 'Date'];
  const rows = entries.map(e => {
    const isVideo = Boolean(e.videoUrl);
    const isPhoto = Boolean(e.imageUrl);
    const mediaType = isVideo ? 'Video' : isPhoto ? 'Photo' : 'Text';
    const storageCloud = isVideo ? 'Cloudflare R2' : isPhoto ? 'ImageKit CDN' : 'Firestore';
    const mediaUrl = e.videoUrl || e.imageUrl || '';
    const duration = e.videoDuration ? `${e.videoDuration}s` : '';
    return [
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.relationship || '').replace(/"/g, '""')}"`,
      `"${mediaType}"`,
      `"${storageCloud}"`,
      `"${mediaUrl.replace(/"/g, '""')}"`,
      `"${duration}"`,
      `"${(e.message || '').replace(/"/g, '""')}"`,
      `"${(e.createdAt || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportGuestsToCsv(guests: Guest[], filename = 'guest_list_rsvp_export.csv') {
  const header = ['Name', 'Phone', 'Email', 'Attending', 'Guests', 'Table', 'Seat', 'ExpectedArrival', 'SongRequest', 'Note', 'CheckedIn', 'CheckedInTime'];
  const rows = guests.map(g => {
    const isCheckedIn = Boolean(g.checkedIn || g.is_checked_in);
    const checkedAt = g.arrivedAt || g.checkedInAt || g.checked_in_at;
    const formattedTime = checkedAt ? new Date(checkedAt).toLocaleString() : '-';
    const expectedArrival = g.expectedArrivalTime || g.expectedArrival || '-';
    return [
      `"${(g.name || '').replace(/"/g, '""')}"`,
      `"${(g.phone || '').replace(/"/g, '""')}"`,
      `"${(g.email || '').replace(/"/g, '""')}"`,
      `"${g.attending}"`,
      g.count || 0,
      `"${(g.table || '').replace(/"/g, '""')}"`,
      `"${(g.seat || '').replace(/"/g, '""')}"`,
      `"${expectedArrival.replace(/"/g, '""')}"`,
      `"${(g.song || '').replace(/"/g, '""')}"`,
      `"${(g.note || '').replace(/"/g, '""')}"`,
      `"${isCheckedIn ? 'Yes' : 'No'}"`,
      `"${formattedTime.replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportPendingGuestsToCsv(guests: Guest[], filename = 'pending_unarrived_guests.csv') {
  const header = ['Name', 'Phone', 'ExpectedArrival', 'Table', 'Seat', 'PartyCount', 'Email', 'Note'];
  const pending = guests.filter(g => g.attending === 'yes' && !(g.checkedIn || g.is_checked_in));
  const rows = pending.map(g => [
    `"${(g.name || '').replace(/"/g, '""')}"`,
    `"${(g.phone || '').replace(/"/g, '""')}"`,
    `"${(g.expectedArrivalTime || g.expectedArrival || 'Not specified').replace(/"/g, '""')}"`,
    `"${(g.table || '').replace(/"/g, '""')}"`,
    `"${(g.seat || '').replace(/"/g, '""')}"`,
    g.count || 1,
    `"${(g.email || '').replace(/"/g, '""')}"`,
    `"${(g.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function downloadSampleCsvTemplate() {
  const sample = `Name,Phone,Email,Attending,Guests,Table,Seat,SongRequest,Note
Emily Watson,0917-123-4567,emily@example.com,yes,2,Table 1,Seat 1,At Last - Etta James,Looking forward to this!
Michael Chang,0918-234-5678,,yes,1,Table 1,Seat 3,L-O-V-E - Nat King Cole,Congratulations
Sophia Martinez,+1 (555) 345-6789,sophia@example.com,no,0,-,-,-,Regretfully cannot attend`;

  const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_guest_seating_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function parseGuestCsv(csvText: string): Partial<Guest>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  // Parse header to dynamically map columns
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const nameIdx = headers.indexOf('name');
  const phoneIdx = headers.findIndex(h => h === 'phone' || h === 'mobile' || h === 'contact' || h === 'cell' || h === 'tel');
  const emailIdx = headers.indexOf('email');
  const attendingIdx = headers.indexOf('attending');
  const countIdx = headers.findIndex(h => h === 'guests' || h === 'count');
  const tableIdx = headers.indexOf('table');
  const seatIdx = headers.indexOf('seat');
  const songIdx = headers.findIndex(h => h === 'songrequest' || h === 'song');
  const noteIdx = headers.indexOf('note');

  const parsed: Partial<Guest>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma ignoring commas inside quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentValue = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"' && (charIdx === 0 || line[charIdx - 1] !== '\\')) {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    const name = nameIdx !== -1 ? values[nameIdx] : values[0];
    if (name) {
      parsed.push({
        name,
        phone: (phoneIdx !== -1 ? values[phoneIdx] : '') || '',
        email: (emailIdx !== -1 ? values[emailIdx] : '') || '',
        attending: (attendingIdx !== -1 ? values[attendingIdx] : values[2])?.toLowerCase() === 'no' ? 'no' : 'yes',
        count: parseInt((countIdx !== -1 ? values[countIdx] : values[3]) || '1', 10) || 1,
        table: (tableIdx !== -1 ? values[tableIdx] : values[4]) || 'Table 1',
        seat: (seatIdx !== -1 ? values[seatIdx] : values[5]) || 'Seat 1',
        song: (songIdx !== -1 ? values[songIdx] : values[6]) || '',
        note: (noteIdx !== -1 ? values[noteIdx] : values[7]) || ''
      });
    }
  }

  return parsed;
}
