import React from 'react';
import { NavLink } from 'react-router-dom';
import { HeartPulse, Calendar, PlusCircle, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Sun, Moon, Clock, BookOpen, CheckSquare, AlertCircle, History } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

import CalendarOverlay from '../components/CalendarOverlay';
import MentalHealthSummaryWidget from '../components/MentalHealthSummaryWidget';
import { isVideoUrl } from '../utils/mediaUtils';
import { parseScheduleItem } from '../utils/scheduleUtils';

const MOOD_PERCENT = { 1: '20%', 2: '40%', 3: '60%', 4: '80%', 5: '100%' };
const MOOD_LABELS = { 1: 'Very Bad', 2: 'Bad / Stressed', 3: 'Neutral', 4: 'Good / Calm', 5: 'Very Good' };
const MOOD_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#00ADB5', 5: '#10b981' };

export default function Dashboard() {
  const { user } = useAuth();
  const { moods, schedules, courses, copingList } = useData();

  // Find today's checkin
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const todayDayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const todayMood = moods.find((m) => {
    const dStr = typeof m.tanggal === 'string' ? m.tanggal.split('T')[0] : new Date(m.tanggal).toISOString().split('T')[0];
    return dStr === todayStr;
  });

  // Today's course classes
  const todayClasses = (courses || []).filter(c => c.hari === todayDayName);

  // Upcoming active task/exam deadlines:
  // Show max 3 tasks, sorted by earliest deadline (closest to submission time or already expired/overdue)
  const upcomingSchedules = schedules
    .map((s) => {
      const parsed = parseScheduleItem(s);
      const dStr = s.tanggal 
        ? (typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0]) 
        : todayStr;
      const timeStr = parsed.deadlineTime ? parsed.deadlineTime.trim() : '23:59';
      const [h, m] = timeStr.includes(':') ? timeStr.split(':').map(Number) : [23, 59];
      const deadlineDate = new Date(`${dStr}T${String(h || 0).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`);
      const validDeadline = isNaN(deadlineDate.getTime()) ? new Date(dStr) : deadlineDate;
      const isOverdue = validDeadline.getTime() < now.getTime();
      return {
        ...s,
        parsed,
        dStr,
        deadlineDate: validDeadline,
        isOverdue
      };
    })
    .filter((s) => s.parsed.progress < 100)
    .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime())
    .slice(0, 3);

  // Random coping tip
  const randomTip = copingList.length ? copingList[Math.floor(Math.random() * copingList.length)] : null;

  // Time based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Welcome Hero Banner */}
      <div className="glass-panel dashboard-hero-panel">
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '650px' }}>
          <div className="dashboard-hero-badge">
            <Sparkles size={13} color="#00FFF5" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00FFF5' }}>Mental Health Dashboard</span>
          </div>
          <h2 className="dashboard-hero-title">
            {greeting}, <span className="text-gradient-teal">{user?.nama || 'Friend'}!</span>
          </h2>
          <p className="dashboard-hero-desc mobile-hide">
            Track daily emotional patterns, align with academic workloads, and maintain performance with peace of mind.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <NavLink to="/checkin/new" className="glass-button glass-button-primary dashboard-hero-btn">
            <PlusCircle size={15} />
            <span>Mood Check-in</span>
          </NavLink>
          <NavLink to="/checkin" className="glass-button dashboard-hero-btn">
            <History size={15} color="#00ADB5" />
            <span>Riwayat Mood</span>
          </NavLink>
        </div>
      </div>

      {/* Top Banner Overview Grid */}
      <div className="dashboard-overview-grid">
        
        {/* Today's Checkin Card */}
        <div className="glass-panel glass-panel-hover dashboard-overview-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '0px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#00ADB5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Today's Status
                </span>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#EEEEEE', marginTop: '4px' }}>
                  {todayMood ? MOOD_LABELS[todayMood.moodScore] : 'Not Checked In'}
                </h3>
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: todayMood ? MOOD_COLORS[todayMood.moodScore] : '#b0b8c1',
                padding: '6px 14px',
                borderRadius: '0px',
                background: todayMood ? `${MOOD_COLORS[todayMood.moodScore]}22` : 'rgba(0, 173, 181, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${todayMood ? MOOD_COLORS[todayMood.moodScore] : 'rgba(0, 173, 181, 0.3)'}`
              }}>
                {todayMood ? MOOD_PERCENT[todayMood.moodScore] : '-%'}
              </div>
            </div>

            {todayMood ? (
              <>
                <p style={{ fontSize: '13px', color: '#EEEEEE', marginBottom: '10px', lineHeight: 1.5, background: 'rgba(34, 40, 49, 0.6)', padding: '10px 12px', borderRadius: '0px', border: '1px solid rgba(0, 173, 181, 0.15)' }}>
                  "{todayMood.catatan || 'No written notes.'}"
                </p>
                {todayMood.photoUrl && (
                  <div style={{ marginBottom: '14px', border: '1px solid rgba(0, 173, 181, 0.3)', overflow: 'hidden', maxHeight: '140px', background: '#000' }}>
                    {isVideoUrl(todayMood.photoUrl) ? (
                      <video
                        src={todayMood.photoUrl}
                        controls
                        playsInline
                        style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <img src={todayMood.photoUrl} alt="Today's Photo" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                Take 30 seconds to record your mood and identify its triggers.
              </p>
            )}
          </div>

          <div>
            {todayMood ? (
              <NavLink to="/checkin/new" className="glass-button" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', borderRadius: '0px' }}>
                Update Check-in
              </NavLink>
            ) : (
              <NavLink to="/checkin/new" className="glass-button glass-button-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', borderRadius: '0px' }}>
                <PlusCircle size={15} />
                Check-in Emotion Now
              </NavLink>
            )}
          </div>
        </div>

        {/* Today's Academic Classes (Jadwal Kuliah) */}
        <div className="glass-panel glass-panel-hover dashboard-overview-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '0px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <BookOpen size={17} color="#00FFF5" />
                <span>Today's Classes ({todayDayName})</span>
              </h4>
              <NavLink to="/academic-schedule" style={{ fontSize: '12px', color: '#00FFF5', textDecoration: 'none', fontWeight: 600 }}>
                Timetable
              </NavLink>
            </div>

            {todayClasses.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No lectures scheduled for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayClasses.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '8px 10px', borderRadius: '0px', background: 'rgba(34, 40, 49, 0.6)', borderLeft: `3px solid ${c.warna || '#00ADB5'}` }}>
                    <div>
                      <div style={{ color: '#EEEEEE', fontWeight: 600 }}>{c.mataKuliah}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.ruangan}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#00FFF5', fontWeight: 600 }}>{c.jamMulai}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '12px' }}>
            <NavLink to="/academic-schedule" className="glass-button" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', borderRadius: '0px' }}>
              Manage Academic Schedule
            </NavLink>
          </div>
        </div>

        {/* Upcoming Deadlines & Tasks (Jadwal Tugas) */}
        <div className="glass-panel glass-panel-hover dashboard-overview-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '0px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <CheckSquare size={17} color="#00ADB5" />
                <span>Upcoming Tasks & Deadlines</span>
              </h4>
              <NavLink to="/schedule" style={{ fontSize: '12px', color: '#00FFF5', textDecoration: 'none', fontWeight: 600 }}>
                View All
              </NavLink>
            </div>

            {upcomingSchedules.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Tidak ada tugas atau deadline mendatang yang belum selesai.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingSchedules.map((s) => {
                  const { parsed, dStr, isOverdue } = s;
                  const isToday = dStr === todayStr;
                  const isTomorrow = dStr === tomorrowStr;

                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '9px 12px',
                        borderRadius: '0px',
                        background: isOverdue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 40, 49, 0.65)',
                        border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 173, 181, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#EEEEEE', fontWeight: 700, fontSize: '13px', wordBreak: 'break-word' }}>
                          {parsed.cleanTitle}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                          {isOverdue && (
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: '#ffffff',
                              background: '#ef4444',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              letterSpacing: '0.04em'
                            }}>
                              HABIS
                            </span>
                          )}
                          <span className={`badge badge-${(s.jenis || 'tugas').toLowerCase()}`}>
                            {(s.jenis || 'tugas').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            color: isOverdue ? '#f87171' : isToday ? '#f59e0b' : '#00FFF5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: isOverdue || isToday ? 600 : 400
                          }}>
                            {isOverdue ? <AlertCircle size={11} /> : <Clock size={11} />}
                            {isOverdue 
                              ? (isToday ? `Habis jam ${parsed.deadlineTime || '23:59'}` : `Lewat (${dStr})`)
                              : isToday 
                              ? `Hari ini, ${parsed.deadlineTime || '23:59'}` 
                              : isTomorrow 
                              ? `Besok, ${parsed.deadlineTime || '23:59'}` 
                              : `${dStr}${parsed.deadlineTime ? ` (${parsed.deadlineTime})` : ''}`
                            }
                          </span>
                          {parsed.attachments && parsed.attachments.length > 0 && (
                            <span style={{ color: 'var(--text-muted)' }}>
                              📎 {parsed.attachments.length} berkas
                            </span>
                          )}
                        </div>

                        <span style={{
                          fontSize: '10px',
                          color: isOverdue ? '#f87171' : '#00FFF5',
                          background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 173, 181, 0.15)',
                          border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 173, 181, 0.35)',
                          padding: '1px 6px',
                          fontWeight: 700
                        }}>
                          {parsed.progress}% SELESAI
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: '12px' }}>
            <NavLink to="/schedule" className="glass-button" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', borderRadius: '0px' }}>
              Manage Tasks & Deadlines
            </NavLink>
          </div>
        </div>

      </div>

      <CalendarOverlay moods={moods} schedules={schedules} />

    </div>
  );
}



