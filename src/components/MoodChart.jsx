import React, { useMemo, useState } from 'react';
import { Activity, Calendar, Clock, BookOpen, Layers } from 'lucide-react';
import { parseScheduleItem } from '../utils/scheduleUtils';

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

export default function MoodChart({ moods = [], schedules = [] }) {
  const [range, setRange] = useState('7');

  const timelineData = useMemo(() => {
    const limitDays = Number(range);
    const map = {};

    // Generate dates in range (most recent first)
    for (let i = 0; i < limitDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
      map[dateKey] = {
        dateKey,
        displayDate,
        moodSum: 0,
        count: 0,
        moodScore: null,
        schedules: []
      };
    }

    // Populate mood checkins
    moods.forEach((m) => {
      const dateKey = typeof m.tanggal === 'string' ? m.tanggal.split('T')[0] : new Date(m.tanggal).toISOString().split('T')[0];
      if (map[dateKey]) {
        map[dateKey].moodSum += Number(m.moodScore);
        map[dateKey].count += 1;
      }
    });

    // Populate schedules
    schedules.forEach((s) => {
      const dateKey = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0];
      if (map[dateKey]) {
        map[dateKey].schedules.push(s);
      }
    });

    return Object.values(map).map((item) => {
      const avg = item.count ? Math.round(item.moodSum / item.count) : null;
      const exactPct = item.count ? Math.round((item.moodSum / item.count) * 20) : null;
      return {
        ...item,
        avgScore: avg,
        exactPct
      };
    });
  }, [moods, schedules, range]);

  return (
    <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '0px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={19} color="#00ADB5" />
            <span>Daily Emotion Tracking & Academic Load</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            History of daily emotion percentages and academic schedules
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: '7', label: 'Last 7 Days' },
            { id: '14', label: '14 Days' },
            { id: '30', label: '30 Days' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '0px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: range === item.id ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'rgba(255, 255, 255, 0.05)',
                color: range === item.id ? '#ffffff' : '#b0b8c1',
                border: range === item.id ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 173, 181, 0.15)',
                transition: 'all 0.2s ease',
                boxShadow: range === item.id ? '0 4px 12px rgba(0, 173, 181, 0.3)' : 'none'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Track Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {timelineData.map((item) => {
          const color = item.avgScore ? MOOD_COLORS[item.avgScore] : '#393E46';
          const pctVal = item.exactPct !== null ? item.exactPct : 0;

          return (
            <div
              key={item.dateKey}
              style={{
                padding: '12px 14px',
                background: 'rgba(34, 40, 49, 0.6)',
                border: `1px solid ${item.avgScore ? `${color}40` : 'rgba(0, 173, 181, 0.15)'}`,
                borderLeft: `4px solid ${color}`,
                borderRadius: '0px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE', minWidth: '110px' }}>
                    {item.displayDate}
                  </span>
                  
                  {item.avgScore ? (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: color, padding: '2px 8px', background: `${color}22`, border: `1px solid ${color}`, borderRadius: '0px' }}>
                      {pctVal}%
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0px' }}>
                      Not Checked In
                    </span>
                  )}
                </div>

                {/* Schedules Tags */}
                {item.schedules.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {item.schedules.map((s) => {
                      const parsed = parseScheduleItem(s);
                      return (
                        <span key={s.id} className={`badge badge-${(s.jenis || 'tugas').toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '0px' }}>
                          {parsed.cleanTitle}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Progress Track Line */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pctVal}%`,
                    background: `linear-gradient(90deg, #ef4444 0%, ${color} 100%)`,
                    borderRadius: '0px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


