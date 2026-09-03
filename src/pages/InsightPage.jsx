import React from 'react';
import { BarChart3, PieChart as PieIcon, Award, Zap, AlertTriangle, CheckCircle, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import TagManager from '../components/TagManager';
import BrainDump from '../components/BrainDump';
import MentalHealthSummaryWidget from '../components/MentalHealthSummaryWidget';

const MOOD_LABELS = { 1: 'Very Bad', 2: 'Bad / Stressed', 3: 'Neutral', 4: 'Good / Calm', 5: 'Very Good' };
const MOOD_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#00ADB5', 5: '#10b981' };

export default function InsightPage() {
  const { moods, schedules } = useData();

  // Metrics calculation
  const totalEntries = moods.length;
  const avgScore = totalEntries
    ? (moods.reduce((a, b) => a + Number(b.moodScore), 0) / totalEntries).toFixed(1)
    : 0;

  // Breakdown by score
  const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  moods.forEach((m) => {
    if (scoreDistribution[m.moodScore] !== undefined) {
      scoreDistribution[m.moodScore] += 1;
    }
  });

  // Day of week breakdown
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = daysOfWeek.map((dayName, idx) => {
    const dayEntries = moods.filter((m) => new Date(m.tanggal).getDay() === idx);
    const dayAvg = dayEntries.length
      ? (dayEntries.reduce((a, b) => a + Number(b.moodScore), 0) / dayEntries.length).toFixed(1)
      : null;
    return { dayName, dayAvg, count: dayEntries.length };
  });

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(57, 62, 70, 0.8))', border: '1px solid rgba(0, 173, 181, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
            <TrendingUp size={20} color="#00FFF5" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE' }}>Emotion Insights & Analytics</h2>
            <p style={{ fontSize: '12px', color: '#b0b8c1' }}>
              Deep analysis of daily emotional trends, stress triggers, and academic correlation.
            </p>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
        
        <div className="glass-panel glass-panel-hover" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Mood Score</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#00FFF5', marginTop: '4px', lineHeight: 1 }}>
            {avgScore} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Based on {totalEntries} total {totalEntries === 1 ? 'check-in' : 'check-ins'}
          </p>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emotional Health Status</span>
          <div style={{ fontSize: '17px', fontWeight: 800, color: Number(avgScore) >= 3.5 ? '#10b981' : Number(avgScore) >= 2.5 ? '#eab308' : '#ef4444', marginTop: '6px' }}>
            {Number(avgScore) >= 4 ? 'Very Good & Productive' : Number(avgScore) >= 3 ? 'Stable & Controlled' : 'Needs Extra Relaxation'}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Psychological stability indicator
          </p>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Academic Schedules</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#00ADB5', marginTop: '4px', lineHeight: 1 }}>
            {schedules.length}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Assignments, Midterms, Finals & Presentations
          </p>
        </div>

      </div>

      {/* Day of Week Analysis & Score Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
        
        {/* Day of Week Card */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={17} color="#00ADB5" />
            <span>Average Mood by Day of the Week</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dayStats.map((d) => (
              <div key={d.dayName} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '75px', color: 'var(--text-secondary)', fontWeight: 600 }}>{d.dayName}</span>
                <div style={{ flex: 1, height: '8px', background: 'rgba(34, 40, 49, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: d.dayAvg ? `${(Number(d.dayAvg) / 5) * 100}%` : '0%',
                      background: 'linear-gradient(90deg, #00ADB5, #00FFF5)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
                <span style={{ width: '40px', textAlign: 'right', fontWeight: 700, color: d.dayAvg ? '#EEEEEE' : 'var(--text-muted)' }}>
                  {d.dayAvg ? `${d.dayAvg}` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution Breakdown */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={17} color="#00FFF5" />
            <span>Emotion Level Distribution</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[5, 4, 3, 2, 1].map((lvl) => {
              const count = scoreDistribution[lvl] || 0;
              const percent = totalEntries ? Math.round((count / totalEntries) * 100) : 0;
              const color = MOOD_COLORS[lvl];
              return (
                <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                  <span style={{ width: '100px', color: '#EEEEEE', fontWeight: 600 }}>{MOOD_LABELS[lvl]}</span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(34, 40, 49, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ width: '50px', textAlign: 'right', fontWeight: 700, color: color }}>
                    {count} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Tag Manager & Brain Dump */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
        <TagManager />
        <BrainDump />
      </div>

    </div>
  );
}



