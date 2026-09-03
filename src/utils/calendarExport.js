// RFC 5545 iCalendar (.ics) export utility for college course timetable

const DAY_MAP = {
  Monday: { byDay: 'MO', dayOffset: 1 },
  Tuesday: { byDay: 'TU', dayOffset: 2 },
  Wednesday: { byDay: 'WE', dayOffset: 3 },
  Thursday: { byDay: 'TH', dayOffset: 4 },
  Friday: { byDay: 'FR', dayOffset: 5 },
  Saturday: { byDay: 'SA', dayOffset: 6 },
  Sunday: { byDay: 'SU', dayOffset: 0 }
};

function formatIcsDateTime(date, timeStr) {
  const [hours, minutes] = (timeStr || '08:00').split(':');
  const d = new Date(date);
  d.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);

  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());

  return `${year}${month}${day}T${h}${m}${s}`;
}

function getNextDateForDay(targetDayName) {
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 = Sun, 1 = Mon ...
  const targetDayInfo = DAY_MAP[targetDayName] || DAY_MAP.Monday;
  const targetDayIndex = targetDayInfo.dayOffset;

  let diff = targetDayIndex - currentDayIndex;
  if (diff < 0) diff += 7;

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  return targetDate;
}

export function exportCoursesToICS(courses) {
  if (!courses || courses.length === 0) {
    throw new Error('No courses available to export.');
  }

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = courses.map((c) => {
    const nextDate = getNextDateForDay(c.hari);
    const dtStart = formatIcsDateTime(nextDate, c.jamMulai || '08:00');
    const dtEnd = formatIcsDateTime(nextDate, c.jamSelesai || '10:00');
    const dayInfo = DAY_MAP[c.hari] || { byDay: 'MO' };

    const description = [
      `Lecturer: ${c.dosen || 'Staff'}`,
      `Room / Location: ${c.ruangan || 'Campus'}`,
      `Credits: ${c.sks || 3} SKS`,
      c.link ? `Online Class / LMS Link: ${c.link}` : ''
    ].filter(Boolean).join('\\n');

    return [
      'BEGIN:VEVENT',
      `UID:course-${c.id}-${Date.now()}@daily-emotion-calendar`,
      `DTSTAMP:${nowStamp}`,
      `SUMMARY:${c.mataKuliah} (${c.sks || 3} SKS)`,
      `DESCRIPTION:${description}`,
      `LOCATION:${c.ruangan || 'Campus Room'}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayInfo.byDay}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daily Emotion Calendar//Academic Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Academic Course Schedule',
    'X-WR-TIMEZONE:Asia/Jakarta',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

  // Trigger browser download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `academic_schedule_${new Date().toISOString().split('T')[0]}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate direct Google Calendar intent link with weekly recurrence
export function getGoogleCalendarUrl(course) {
  const nextDate = getNextDateForDay(course.hari);
  const dtStart = formatIcsDateTime(nextDate, course.jamMulai || '08:00');
  const dtEnd = formatIcsDateTime(nextDate, course.jamSelesai || '10:00');
  const dayInfo = DAY_MAP[course.hari] || { byDay: 'MO' };

  const title = `${course.mataKuliah} (${course.sks || 3} SKS)`;
  const details = [
    `Course: ${course.mataKuliah}`,
    `Day: ${course.hari}`,
    `Lecturer: ${course.dosen || 'Staff Lecturer'}`,
    `Room: ${course.ruangan || 'Campus Room'}`,
    `Credits: ${course.sks || 3} SKS`,
    course.link ? `LMS / Class Link: ${course.link}` : ''
  ].filter(Boolean).join('\n');

  const location = course.ruangan || 'Campus Room';
  const recur = `RRULE:FREQ=WEEKLY;BYDAY=${dayInfo.byDay}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    location: location,
    recur: recur
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

