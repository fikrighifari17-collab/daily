import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BookOpen, Clock } from 'lucide-react';

const MOOD_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#00ADB5',
  5: '#10b981'
};

const MOOD_PERCENT = {
  1: '20%',
  2: '40%',
  3: '60%',
  4: '80%',
  5: '100%'
};

export default function CalendarOverlay({ moods = [], schedules = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Map entries by date
  const moodByDate = {};
  moods.forEach((m) => {
    const dStr = typeof m.tanggal === 'string' ? m.tanggal.split('T')[0] : new Date(m.tanggal).toISOString().split('T')[0];
    if (!moodByDate[dStr]) moodByDate[dStr] = [];
    moodByDate[dStr].push(m);
  });

  const schedulesByDate = {};
  schedules.forEach((s) => {
    const dStr = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0];
    if (!schedulesByDate[dStr]) schedulesByDate[dStr] = [];
    schedulesByDate[dStr].push(s);
  });

  const dayCells = [];
  // Empty slots before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push({ empty: true, key: `empty-${i}` });
  }

  // Days 1..N
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    // Format YYYY-MM-DD local
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    dayCells.push({
      empty: false,
      day,
      dateStr,
      moods: moodByDate[dateStr] || [],
      schedules: schedulesByDate[dateStr] || []
    });
  }

  return (
    <div className="glass-panel glass-panel-hover" style={{ padding: '24px', borderRadius: '0px' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={20} color="#00ADB5" />
          <span>Emotion Calendar & Academic Overlay</span>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#00FFF5' }}>
            {monthName}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={prevMonth} className="glass-button" style={{ padding: '6px 10px', borderRadius: '0px' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextMonth} className="glass-button" style={{ padding: '6px 10px', borderRadius: '0px' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '10px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w, idx) => (
          <div key={idx} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {dayCells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} style={{ minHeight: '85px', opacity: 0.2 }} />;
          }

          const avgScore = cell.moods.length
            ? Math.round(cell.moods.reduce((a, b) => a + Number(b.moodScore), 0) / cell.moods.length)
            : null;

          const moodColor = avgScore ? MOOD_COLORS[avgScore] : null;

          return (
            <div
              key={cell.dateStr}
              style={{
                minHeight: '85px',
                padding: '8px',
                borderRadius: '0px',
                background: moodColor ? `${moodColor}22` : 'rgba(34, 40, 49, 0.5)',
                border: `1px solid ${moodColor ? `${moodColor}77` : 'rgba(0, 173, 181, 0.15)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>
                  {cell.day}
                </span>
                {avgScore && (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: moodColor, padding: '1px 4px', background: `${moodColor}33`, border: `1px solid ${moodColor}` }} title={`Average mood: ${avgScore}/5 (${MOOD_PERCENT[avgScore]})`}>
                    {MOOD_PERCENT[avgScore]}
                  </span>
                )}
              </div>

              {/* Schedule badges list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                {cell.schedules.slice(0, 2).map((s) => (
                  <span
                    key={s.id}
                    className={`badge badge-${s.jenis}`}
                    style={{ fontSize: '9px', padding: '2px 5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    title={`${s.jenis.toUpperCase()}: ${s.judul}`}
                  >
                    {s.judul}
                  </span>
                ))}
                {cell.schedules.length > 2 && (
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    +{cell.schedules.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

