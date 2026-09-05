import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  X,
  Clock,
  CheckSquare,
  Paperclip,
  ExternalLink,
  Download
} from 'lucide-react';

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

import { parseScheduleItem } from '../utils/scheduleUtils';
import { getAttachmentData, openOrDownloadAttachment, isMobileDevice } from '../utils/attachmentStorage';

export default function CalendarOverlay({
  moods = [],
  schedules = []
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [popupDateCell, setPopupDateCell] = useState(null);

  // Collapsible calendar state: collapsed by default on mobile (< 768px) for minimalist view
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('daily_calendar_open');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 768;
    }
    return true;
  });

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('daily_calendar_open', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Lock body scroll and listen for Escape key when popup is open
  useEffect(() => {
    if (popupDateCell) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          setPopupDateCell(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = original;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [popupDateCell]);

  const handleCellClick = (cell) => {
    if (cell.empty) return;
    setPopupDateCell(cell);
  };

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

  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Map entries by date
  const moodByDate = {};
  moods.forEach((m) => {
    const dStr = typeof m.tanggal === 'string' ? m.tanggal.split('T')[0] : new Date(m.tanggal).toISOString().split('T')[0];
    if (!moodByDate[dStr]) moodByDate[dStr] = [];
    moodByDate[dStr].push(m);
  });

  const schedulesByDate = {};
  schedules.forEach((s) => {
    // Exclude completed tasks (100% progress) from calendar display
    const parsed = parseScheduleItem(s);
    if (parsed.progress === 100) return;

    const dStr = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0];
    if (!schedulesByDate[dStr]) schedulesByDate[dStr] = [];
    schedulesByDate[dStr].push(s);
  });

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  const dayCells = [];
  // Empty slots before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push({ empty: true, key: `empty-${i}` });
  }

  // Days 1..N
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    dayCells.push({
      empty: false,
      day,
      dateStr,
      isToday: dateStr === todayStr,
      moods: moodByDate[dateStr] || [],
      schedules: schedulesByDate[dateStr] || []
    });
  }

  return (
    <>
      <div
        className="glass-panel"
        style={{
          padding: isOpen ? '16px 20px' : '12px 18px',
          borderRadius: '0px',
          border: '1px solid rgba(0, 173, 181, 0.3)',
          transition: 'all 0.25s ease'
        }}
      >
        {/* Calendar Header / Toggle Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isOpen ? '14px' : '0px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          {/* Left: Title & Month badge when collapsed */}
          <div
            onClick={handleToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <CalendarIcon size={18} color="#00FFF5" style={{ flexShrink: 0 }} />
            <span className="calendar-header-title" style={{ fontWeight: 700, color: '#EEEEEE', fontSize: '14px', whiteSpace: 'nowrap' }}>
              Kalender & Filter Tanggal
            </span>

            {!isOpen && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#00FFF5',
                  background: 'rgba(0, 173, 181, 0.15)',
                  border: '1px solid rgba(0, 173, 181, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '0px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                {monthName}
              </span>
            )}
          </div>

          {/* Right: Month Navigation (when open) + Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={prevMonth}
                  className="glass-button"
                  style={{ padding: '5px 9px', borderRadius: '0px' }}
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#00FFF5',
                    minWidth: '120px',
                    textAlign: 'center',
                    textTransform: 'capitalize'
                  }}
                >
                  {monthName}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="glass-button"
                  style={{ padding: '5px 9px', borderRadius: '0px' }}
                  title="Bulan Berikutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleToggle}
              className="glass-button"
              style={{
                padding: '5px 10px',
                borderRadius: '0px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: isOpen ? 'var(--text-muted)' : '#00FFF5',
                borderColor: isOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 173, 181, 0.4)',
                background: isOpen ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 173, 181, 0.12)',
                flexShrink: 0
              }}
              title={isOpen ? 'Tutup Kalender (Mode Minimalis)' : 'Buka Kalender'}
            >
              <span>{isOpen ? 'Tutup' : 'Buka'}</span>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Expandable Calendar Body */}
        {isOpen && (
          <div className="animate-fade-in">
            {/* Weekday Labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                textAlign: 'center',
                marginBottom: '8px'
              }}
            >
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: idx === 0 ? '#f87171' : 'var(--text-muted)'
                  }}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Grid with EXACT uniform cell sizes */}
            <div className="calendar-grid-container">
              {dayCells.map((cell) => {
                if (cell.empty) {
                  return (
                    <div
                      key={cell.key}
                      className="calendar-cell-empty"
                    />
                  );
                }

                const avgScore = cell.moods.length
                  ? Math.round(cell.moods.reduce((a, b) => a + Number(b.moodScore), 0) / cell.moods.length)
                  : null;

                const moodColor = avgScore ? MOOD_COLORS[avgScore] : null;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => handleCellClick(cell)}
                    className="calendar-cell"
                    style={{
                      background: cell.isToday
                        ? 'rgba(0, 173, 181, 0.15)'
                        : moodColor
                        ? `${moodColor}22`
                        : 'rgba(255, 255, 255, 0.03)',
                      border: cell.isToday
                        ? '1.5px solid #00FFF5'
                        : moodColor
                        ? `1px solid ${moodColor}66`
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: cell.isToday ? '0 0 10px rgba(0, 255, 245, 0.25)' : 'none'
                    }}
                    title={`Lihat detail tugas tanggal ${cell.day}`}
                  >
                    {/* Top Row: Day Number & Mood Indicator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: cell.isToday ? 800 : 700,
                          color: cell.isToday ? '#00FFF5' : '#EEEEEE',
                          lineHeight: 1
                        }}
                      >
                        {cell.day}
                      </span>

                      {avgScore && (
                        <>
                          <span
                            className="calendar-cell-desktop-badges"
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: moodColor,
                              padding: '1px 4px',
                              background: `${moodColor}33`,
                              border: `1px solid ${moodColor}`,
                              borderRadius: '0px'
                            }}
                          >
                            {MOOD_PERCENT[avgScore]}
                          </span>
                          <span
                            className="calendar-cell-mobile-dots"
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: moodColor,
                              boxShadow: `0 0 4px ${moodColor}`
                            }}
                          />
                        </>
                      )}
                    </div>

                    {/* Mobile Dot Indicator */}
                    <div className="calendar-cell-mobile-dots" style={{ justifyContent: 'center', gap: '3px' }}>
                      {cell.schedules.length > 0 && (
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: '#00FFF5',
                            boxShadow: '0 0 4px #00FFF5'
                          }}
                        />
                      )}
                    </div>

                    {/* Desktop Schedule Badges */}
                    <div className="calendar-cell-desktop-badges" style={{ flexDirection: 'column', gap: '2px', width: '100%' }}>
                      {cell.schedules.slice(0, 2).map((s) => {
                        const parsed = parseScheduleItem(s);
                        return (
                          <div
                            key={s.id}
                            style={{
                              fontSize: '9px',
                              padding: '1px 4px',
                              background: 'rgba(0, 173, 181, 0.2)',
                              color: '#EEEEEE',
                              borderRadius: '0px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '4px'
                            }}
                            title={`${s.jenis.toUpperCase()}: ${parsed.cleanTitle}`}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {parsed.cleanTitle}
                            </span>
                            <span
                              style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: '#00FFF5',
                                flexShrink: 0
                              }}
                            />
                          </div>
                        );
                      })}
                      {cell.schedules.length > 2 && (
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          +{cell.schedules.length - 2} lagi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= POP-UP MODAL DETAIL TUGAS ================= */}
      {popupDateCell && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setPopupDateCell(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in glass-panel calendar-popup-container"
          >
            {/* Header Pop-up: Tanggal Diperbesar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(0, 173, 181, 0.25)',
              paddingBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Big Day Number Box matching user's screenshot */}
                <div style={{
                  width: '54px',
                  height: '54px',
                  background: '#164e63',
                  border: '2px solid #00FFF5',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(0, 255, 245, 0.4)',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                    {popupDateCell.day}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#00FFF5', textTransform: 'uppercase', marginTop: '2px' }}>
                    {new Date(popupDateCell.dateStr).toLocaleDateString('id-ID', { month: 'short' })}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>
                      Detail Tugas Tanggal {popupDateCell.day}
                    </h3>
                    {popupDateCell.isToday && (
                      <span style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(0, 255, 245, 0.2)', color: '#00FFF5', border: '1px solid #00FFF5', fontWeight: 800 }}>
                        HARI INI
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#00FFF5', marginTop: '3px', fontWeight: 600 }}>
                    {new Date(popupDateCell.dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPopupDateCell(null)}
                className="glass-button"
                style={{ padding: '6px', borderRadius: '0px', color: 'var(--text-secondary)' }}
                title="Tutup pop up"
              >
                <X size={18} />
              </button>
            </div>

            {/* Task List in Pop-up */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>
                  <CheckSquare size={15} color="#00FFF5" />
                  <span>Daftar Tugas & Deadline ({popupDateCell.schedules.length})</span>
                </div>
              </div>

              {popupDateCell.schedules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {popupDateCell.schedules.map((s) => {
                    const parsed = parseScheduleItem(s);
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(34, 40, 49, 0.75)',
                          border: '1px solid rgba(0, 173, 181, 0.3)',
                          borderRadius: '0px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#EEEEEE', lineHeight: 1.4 }}>
                            {parsed.cleanTitle}
                          </span>
                          <span className={`badge badge-${(parsed.jenis || 'tugas').toLowerCase()}`} style={{ flexShrink: 0 }}>
                            {(parsed.jenis || 'tugas').toUpperCase()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            color: parsed.progress === 100 ? '#10b981' : '#00FFF5',
                            background: parsed.progress === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 173, 181, 0.15)',
                            border: `1px solid ${parsed.progress === 100 ? '#10b981' : 'rgba(0, 173, 181, 0.4)'}`
                          }}>
                            {parsed.progress === 100 ? 'SELESAI (100%)' : `${parsed.progress}% SELESAI`}
                          </span>

                          {parsed.subtasks && parsed.subtasks.length > 0 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              ({parsed.subtasks.filter(st => st.done).length}/{parsed.subtasks.length} checklist)
                            </span>
                          )}
                        </div>

                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.3)', overflow: 'hidden', marginTop: '2px' }}>
                          <div style={{
                            width: `${parsed.progress}%`,
                            height: '100%',
                            background: parsed.progress === 100 ? '#10b981' : '#00FFF5',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap', marginTop: '2px' }}>
                          {parsed.deadlineTime && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00FFF5', fontWeight: 600 }}>
                              <Clock size={12} />
                              Tenggat: {parsed.deadlineTime}
                            </span>
                          )}
                          {parsed.startTime && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Mulai: {parsed.startTime}
                            </span>
                          )}
                          <span>Tanggal: {popupDateCell.dateStr}</span>
                        </div>

                        {parsed.attachments && parsed.attachments.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '10px', color: '#00FFF5', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Paperclip size={11} />
                              <span>Berkas Tugas ({parsed.attachments.length}):</span>
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {parsed.attachments.map((att) => {
                                const isMobile = isMobileDevice();
                                return (
                                  <button
                                    key={att.id}
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await openOrDownloadAttachment(att, { forceDownload: false });
                                    }}
                                    className="glass-button"
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 7px',
                                      borderRadius: '0px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      color: '#EEEEEE',
                                      borderColor: 'rgba(0, 173, 181, 0.3)'
                                    }}
                                    title={
                                      att.link
                                        ? `Buka tautan ${att.name}`
                                        : isMobile
                                        ? `Buka ${att.name} (bawaan HP)`
                                        : `Buka ${att.name} di browser default`
                                    }
                                  >
                                    {att.link ? (
                                      <ExternalLink size={10} color="#00FFF5" />
                                    ) : (
                                      <ExternalLink size={10} color="#00FFF5" />
                                    )}
                                    <span>{att.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  padding: '24px 16px',
                  background: 'rgba(34, 40, 49, 0.45)',
                  border: '1px dashed rgba(0, 173, 181, 0.25)',
                  borderRadius: '0px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CalendarIcon size={28} color="rgba(0, 173, 181, 0.4)" />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#EEEEEE' }}>
                    Tidak ada tugas atau deadline
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Tidak ada jadwal tugas kuliah, ujian, ataupun presentasi pada tanggal {popupDateCell.day}.
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid rgba(0, 173, 181, 0.2)' }}>
              <button
                type="button"
                onClick={() => setPopupDateCell(null)}
                className="glass-button"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '12px', borderRadius: '0px', color: '#EEEEEE' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

