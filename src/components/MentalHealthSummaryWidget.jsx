import React, { useState } from 'react';
import { Brain, Send, ShieldCheck, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function MentalHealthSummaryWidget() {
  const { moods, schedules, brainDumps, createBrainDump } = useData();
  const [dumpText, setDumpText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Calculate 7-day average mood
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() - 7);

  const recentMoods = moods.filter(m => new Date(m.tanggal) >= cutoff);
  const avgScore = recentMoods.length
    ? Math.round((recentMoods.reduce((acc, curr) => acc + Number(curr.moodScore), 0) / recentMoods.length) * 20)
    : 60;

  const recentSchedulesCount = schedules.filter(s => new Date(s.tanggal) >= now).length;

  const handleRelease = async (e) => {
    e.preventDefault();
    if (!dumpText.trim()) return;
    setIsSubmitting(true);
    try {
      await createBrainDump(dumpText.trim());
      setDumpText('');
      setMessage('Thoughts released successfully! Stay calm and take a deep breath.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel glass-panel-hover" style={{ padding: '24px', borderRadius: '0px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={20} color="#00FFF5" />
          <span>Emotional Balance & Quick Mental Release</span>
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Daily mental health summary and a quick space to release mental clutter.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Left Column: Emotion Balance Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#00ADB5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            This Week's Summary
          </div>

          <div style={{
            padding: '14px 16px',
            background: 'rgba(34, 40, 49, 0.7)',
            border: '1px solid rgba(0, 173, 181, 0.2)',
            borderRadius: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average Energy / Mood</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#00FFF5', marginTop: '2px' }}>{avgScore}%</div>
            </div>
            <div style={{ padding: '4px 10px', background: 'rgba(0, 173, 181, 0.15)', border: '1px solid #00ADB5', color: '#00FFF5', fontSize: '11px', fontWeight: 700 }}>
              {avgScore >= 70 ? 'Stable & Good' : avgScore >= 50 ? 'Neutral' : 'Needs Relaxation'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'rgba(34, 40, 49, 0.7)', border: '1px solid rgba(0, 173, 181, 0.2)', borderRadius: '0px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Check-ins Completed</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#EEEEEE', marginTop: '4px' }}>
                {recentMoods.length} {recentMoods.length === 1 ? 'Entry' : 'Entries'}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(34, 40, 49, 0.7)', border: '1px solid rgba(0, 173, 181, 0.2)', borderRadius: '0px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Upcoming Schedules</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#EEEEEE', marginTop: '4px' }}>
                {recentSchedulesCount} {recentSchedulesCount === 1 ? 'Item' : 'Items'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Mental Release Box */}
        <div style={{ background: 'rgba(34, 40, 49, 0.5)', padding: '16px', border: '1px solid rgba(0, 173, 181, 0.2)', borderRadius: '0px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#00FFF5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#00FFF5" />
            <span>Mental Clutter Release Box</span>
          </div>

          {message && (
            <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              {message}
            </div>
          )}

          <form onSubmit={handleRelease}>
            <textarea
              className="glass-input"
              rows={3}
              placeholder="Overthinking or something bothering your mind? Write it here to release it..."
              value={dumpText}
              onChange={(e) => setDumpText(e.target.value)}
              style={{ fontSize: '12px', borderRadius: '0px', resize: 'vertical', marginBottom: '10px' }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !dumpText.trim()}
              className="glass-button glass-button-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '12px', borderRadius: '0px' }}
            >
              <Send size={13} />
              {isSubmitting ? 'Releasing...' : 'Release & Clear Mind'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
