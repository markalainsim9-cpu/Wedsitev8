import { EventConfig } from '../types';
import { getEventTargetTimestamp } from './timezone';

export function downloadCalendarIcs(config: EventConfig) {
  const targetMs = getEventTargetTimestamp(
    config.targetDate,
    config.date,
    config.churchTime || '2:00 PM PST',
    config.timezone || 'PST'
  );

  const formatIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let startDate: string;
  let endDate: string;

  if (!isNaN(targetMs)) {
    const start = new Date(targetMs);
    const end = new Date(targetMs + 4 * 60 * 60 * 1000); // 4 hours duration
    startDate = formatIcsDate(start);
    endDate = formatIcsDate(end);
  } else {
    startDate = config.targetDate.replace(/[-:]/g, '') + 'Z';
    endDate = startDate;
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Interactive Event Invitation//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${config.title}
DESCRIPTION:${config.description.replace(/\n/g, ' ')}
LOCATION:${config.address}
DTSTART:${startDate}
DTEND:${endDate}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_invite.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
