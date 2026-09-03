import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Trash2,
  Clock,
  MapPin,
  User,
  CheckSquare,
  AlertCircle,
  X,
  Edit3,
  ExternalLink,
  Download,
  AlertTriangle,
  Radio,
  Calendar,
  Sparkles,
  Layers,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { exportCoursesToICS, getGoogleCalendarUrl } from '../utils/calendarExport';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const COLOR_OPTIONS = [
  { name: 'Cyan / Teal', value: '#00ADB5' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Amber Yellow', value: '#f59e0b' },
  { name: 'Purple Violet', value: '#8b5cf6' },
  { name: 'Pink Rose', value: '#ec4899' },
  { name: 'Sky Blue', value: '#3b82f6' }
];

export default function AcademicSchedulePage() {
  const { courses, schedules, addAcademicCourse, updateAcademicCourse, removeAcademicCourse } = useData();
  const { toast } = useToast();

  // Pop-up Modal State (used for both Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  // Google Calendar Sync Modal State
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);

  // Form states
  const [mataKuliah, setMataKuliah] = useState('');
  const [dosen, setDosen] = useState('');
  const [hari, setHari] = useState('Monday');
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('10:30');
  const [ruangan, setRuangan] = useState('');
  const [sks, setSks] = useState('3');
  const [warna, setWarna] = useState('#00ADB5');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');

  // 2-Step Deletion Verification Modal State
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Live real-time clock for class status calculation (updates every 30 seconds)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (courseToDelete || isModalOpen || isGCalModalOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [courseToDelete, isModalOpen, isGCalModalOpen]);

  // Today's day name in English
  const todayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  // Open modal for adding a brand new course
  const handleOpenAddModal = () => {
    setEditingCourseId(null);
    setMataKuliah('');
    setDosen('');
    setHari('Monday');
    setJamMulai('08:00');
    setJamSelesai('10:30');
    setRuangan('');
    setSks('3');
    setWarna('#00ADB5');
    setLink('');
    setIsModalOpen(true);
  };

  // Open modal for editing an existing course
  const handleOpenEditModal = (c) => {
    setEditingCourseId(c.id);
    setMataKuliah(c.mataKuliah || '');
    setDosen(c.dosen || '');
    setHari(c.hari || 'Monday');
    setJamMulai(c.jamMulai || '08:00');
    setJamSelesai(c.jamSelesai || '10:30');
    setRuangan(c.ruangan || '');
    setSks(String(c.sks || '3'));
    setWarna(c.warna || '#00ADB5');
    setLink(c.link || '');
    setIsModalOpen(true);
  };

  // Save / Update course handler
  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    if (!mataKuliah.trim()) {
      toast.error('Course name is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        mataKuliah: mataKuliah.trim(),
        dosen: dosen.trim() || 'Staff Lecturer',
        hari,
        jamMulai,
        jamSelesai,
        ruangan: ruangan.trim() || 'Campus Room',
        sks: Number(sks) || 3,
        warna,
        link: link.trim()
      };

      if (editingCourseId) {
        await updateAcademicCourse(editingCourseId, payload);
        toast.success(`Course '${payload.mataKuliah}' updated successfully!`);
      } else {
        await addAcademicCourse({
          ...payload,
          attendance: { present: 0, absent: 0, excused: 0, target: 16 }
        });
        toast.success(`Course '${payload.mataKuliah}' added to ${hari}!`);
      }

      setIsModalOpen(false);
      setEditingCourseId(null);
    } catch (err) {
      toast.error('Failed to save academic course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Attendance increment handler (+ Present, + Absent, + Excused)
  const handleUpdateAttendance = async (c, type) => {
    const currentAtt = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    const updatedAtt = {
      ...currentAtt,
      [type]: (currentAtt[type] || 0) + 1
    };

    try {
      await updateAcademicCourse(c.id, { attendance: updatedAtt });
      const label = type === 'present' ? 'Present (+1)' : type === 'absent' ? 'Absent (+1)' : 'Excused (+1)';
      toast.success(`${c.mataKuliah}: ${label} recorded!`);
    } catch (err) {
      toast.error('Failed to update attendance.');
    }
  };

  // Export to Calendar (.ics) - Sync all directly
  const handleExportCalendar = () => {
    try {
      exportCoursesToICS(courses);
      toast.success('File kalender (.ics) berhasil diunduh! Buka di HP untuk langsung menambahkan semua jadwal.');
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor kalender.');
    }
  };

  // Open all courses in Google Calendar web/intent tabs at once
  const handleOpenAllInGCal = () => {
    if (!courses || courses.length === 0) {
      toast.error('Belum ada jadwal kuliah.');
      return;
    }
    courses.forEach((c, idx) => {
      setTimeout(() => {
        window.open(getGoogleCalendarUrl(c), '_blank');
      }, idx * 300);
    });
    toast.success(`Membuka ${courses.length} jadwal kuliah di Google Calendar...`);
  };

  // Filtered courses
  const filteredCourses = selectedDayFilter === 'ALL'
    ? courses
    : courses.filter(c => c.hari === selectedDayFilter);

  // Total SKS calculation
  const totalSks = courses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);

  // Helper function to evaluate live class status
  const getLiveClassStatus = (c) => {
    if (c.hari !== todayName) return null;

    const [startH, startM] = (c.jamMulai || '08:00').split(':').map(Number);
    const [endH, endM] = (c.jamSelesai || '10:00').split(':').map(Number);

    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();

    const nowTotalMins = nowH * 60 + nowM;
    const startTotalMins = startH * 60 + startM;
    const endTotalMins = endH * 60 + endM;

    if (nowTotalMins >= startTotalMins && nowTotalMins <= endTotalMins) {
      const remainingMins = endTotalMins - nowTotalMins;
      return {
        type: 'ongoing',
        label: `ONGOING NOW • ${remainingMins}m left`,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.2)',
        border: 'rgba(16, 185, 129, 0.5)'
      };
    }

    if (nowTotalMins < startTotalMins && (startTotalMins - nowTotalMins) <= 60) {
      const diffMins = startTotalMins - nowTotalMins;
      return {
        type: 'upcoming',
        label: `Starts in ${diffMins} mins`,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.2)',
        border: 'rgba(245, 158, 11, 0.5)'
      };
    }

    if (nowTotalMins > endTotalMins) {
      return {
        type: 'finished',
        label: 'Finished Today',
        color: '#9ca3af',
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'rgba(156, 163, 175, 0.25)'
      };
    }

    return null;
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(57, 62, 70, 0.8))', border: '1px solid rgba(0, 173, 181, 0.3)', borderRadius: '0px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '0px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="#00FFF5" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>
                Academic Schedule (Jadwal Kuliah)
              </h2>
              <p style={{ fontSize: '12px', color: '#b0b8c1', margin: '4px 0 0 0' }}>
                Track weekly course timetable, attendance limits, Zoom/LMS links, and exam requirements.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Quick Metrics */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 173, 181, 0.3)', textAlign: 'center', borderRadius: '0px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00FFF5', lineHeight: 1.1 }}>{courses.length}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Classes</div>
              </div>
              <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 173, 181, 0.3)', textAlign: 'center', borderRadius: '0px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>{totalSks}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Credits (SKS)</div>
              </div>
            </div>

            {/* Sync Google Calendar HP Button (Cara 1) */}
            <button
              type="button"
              onClick={() => setIsGCalModalOpen(true)}
              className="glass-button"
              style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}
              title="Open course directly in Google Calendar app on phone"
            >
              <Calendar size={14} color="#10b981" />
              <span>Sync Google Calendar HP</span>
            </button>

            {/* Export to Calendar Button */}
            <button
              type="button"
              onClick={handleExportCalendar}
              className="glass-button"
              style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              title="Download .ics file to import into Google Calendar or Apple Calendar"
            >
              <Download size={14} color="#00FFF5" />
              <span>Export Calendar (.ics)</span>
            </button>

            {/* Primary Button to Open Add Course Pop-up */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="glass-button glass-button-primary"
              style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Plus size={15} />
              <span>Add Course Class</span>
            </button>

            <NavLink
              to="/schedule"
              className="glass-button"
              style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <CheckSquare size={14} color="#00FFF5" />
              <span>Tasks & Deadlines &rarr;</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="glass-panel" style={{ padding: '10px 14px', borderRadius: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Day Tabs Filter */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px', flex: 1 }}>
          <button
            onClick={() => setSelectedDayFilter('ALL')}
            className={`glass-button ${selectedDayFilter === 'ALL' ? 'glass-button-primary' : ''}`}
            style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '0px', whiteSpace: 'nowrap' }}
          >
            All Days ({courses.length})
          </button>
          {DAYS_OF_WEEK.map(day => {
            const count = courses.filter(c => c.hari === day).length;
            const isToday = day === todayName;
            return (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                className={`glass-button ${selectedDayFilter === day ? 'glass-button-primary' : ''}`}
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  borderRadius: '0px',
                  whiteSpace: 'nowrap',
                  borderColor: isToday ? '#00FFF5' : undefined
                }}
              >
                <span>{day.slice(0, 3)}</span>
                {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
                {isToday && <span style={{ fontSize: '9px', color: '#00FFF5', marginLeft: '4px' }}>•</span>}
              </button>
            );
          })}
        </div>

        {/* New Course Button */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="glass-button"
          style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(0, 173, 181, 0.4)', color: '#00FFF5' }}
        >
          <Plus size={13} />
          <span>New Course</span>
        </button>
      </div>

      {/* Course Classes Cards Grid (8px gap) */}
      {filteredCourses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', borderRadius: '0px' }}>
          <BookOpen size={32} style={{ opacity: 0.35, margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#EEEEEE' }}>No course classes scheduled for {selectedDayFilter === 'ALL' ? 'this semester' : selectedDayFilter}.</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>Click the button below to add your lecture schedule.</div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="glass-button glass-button-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '12px', borderRadius: '0px' }}
          >
            <Plus size={14} />
            <span>Add Course Class Now</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '8px' }}>
          {filteredCourses.map((c) => {
            const isToday = c.hari === todayName;
            const liveStatus = getLiveClassStatus(c);

            // Attendance calculations
            const att = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
            const totalRecorded = (att.present || 0) + (att.absent || 0) + (att.excused || 0);
            const attendancePct = totalRecorded > 0 ? Math.round(((att.present || 0) / totalRecorded) * 100) : 100;
            const isAttendanceWarning = totalRecorded >= 3 && attendancePct < 75;

            // Linked tasks matching course name
            const linkedTasks = (schedules || []).filter(s =>
              s.judul && s.judul.toLowerCase().includes(c.mataKuliah.toLowerCase())
            );

            return (
              <div
                key={c.id}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '14px 18px',
                  borderRadius: '0px',
                  borderLeft: `4px solid ${c.warna || '#00ADB5'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  {/* Card Header: Title, Day badge, SKS, Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                          {c.mataKuliah}
                        </h4>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          background: `${c.warna || '#00ADB5'}22`,
                          color: c.warna || '#00FFF5',
                          border: `1px solid ${c.warna || '#00ADB5'}55`
                        }}>
                          {c.hari.toUpperCase()} {isToday ? '• TODAY' : ''}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-secondary)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          {c.sks} SKS
                        </span>
                      </div>

                      {c.dosen && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                          <User size={12} color="var(--text-muted)" />
                          <span>{c.dosen}</span>
                        </div>
                      )}
                    </div>

                    {/* Edit & Delete Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(c)}
                        className="glass-button"
                        style={{ padding: '4px 8px', color: '#00FFF5', borderColor: 'rgba(0, 173, 181, 0.3)', fontSize: '11px', background: 'rgba(0, 173, 181, 0.08)', borderRadius: '0px' }}
                        title="Edit course class"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(c)}
                        className="glass-button"
                        style={{ padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '11px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '0px' }}
                        title="Delete this course class"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Class Status Badge (if today) */}
                  {liveStatus && (
                    <div style={{
                      marginTop: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: liveStatus.color,
                      background: liveStatus.bg,
                      border: `1px solid ${liveStatus.border}`,
                      borderRadius: '0px'
                    }}>
                      <Radio size={12} className={liveStatus.type === 'ongoing' ? 'animate-pulse' : ''} />
                      <span>{liveStatus.label}</span>
                    </div>
                  )}

                  {/* Time and Room */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11px', color: '#EEEEEE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={12} color="#00FFF5" />
                      <span>{c.jamMulai} - {c.jamSelesai}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={12} color="#f59e0b" />
                      <span>{c.ruangan || 'Campus Room'}</span>
                    </div>
                  </div>

                  {/* Quick Link Button & Linked Tasks Pill & Direct Google Calendar Link */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {/* Direct Add to Google Calendar HP */}
                    <a
                      href={getGoogleCalendarUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button"
                      style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '0px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.08)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Directly open and save this course in phone Google Calendar app"
                    >
                      <Calendar size={11} />
                      <span>Add to Google Calendar HP</span>
                    </a>

                    {c.link && (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '0px', color: '#00FFF5', borderColor: 'rgba(0, 173, 181, 0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title={c.link}
                      >
                        <ExternalLink size={11} />
                        <span>Open LMS / Class Link</span>
                      </a>
                    )}

                    {linkedTasks.length > 0 && (
                      <NavLink
                        to="/schedule"
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '0px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="View linked assignments and exams in Tasks & Deadlines"
                      >
                        <CheckSquare size={11} />
                        <span>{linkedTasks.length} Active Task{linkedTasks.length > 1 ? 's' : ''}</span>
                      </NavLink>
                    )}
                  </div>
                </div>

                {/* Attendance Tracker Widget */}
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '0px',
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Attendance:</span>
                      <strong style={{ color: isAttendanceWarning ? '#ef4444' : '#10b981' }}>
                        {att.present || 0} / {totalRecorded || att.target || 16} ({attendancePct}%)
                      </strong>
                    </div>

                    {isAttendanceWarning && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(239, 68, 68, 0.15)', padding: '1px 5px' }}>
                        <AlertTriangle size={10} />
                        <span>&lt; 75% Limit</span>
                      </span>
                    )}
                  </div>

                  {/* Attendance Progress Bar */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '0px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, attendancePct)}%`,
                        height: '100%',
                        background: isAttendanceWarning ? '#ef4444' : attendancePct >= 85 ? '#10b981' : '#f59e0b',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>

                  {/* Quick Attendance Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      Absent: {att.absent || 0} &bull; Excused: {att.excused || 0}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateAttendance(c, 'present')}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '0px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                        title="Record attendance for today"
                      >
                        + Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAttendance(c, 'excused')}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '0px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        title="Record excused absence (sakit/izin)"
                      >
                        + Excused
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAttendance(c, 'absent')}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '0px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="Record unexcused absence (alfa)"
                      >
                        + Absent
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* POP-UP MODAL: Add / Edit Course Class */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1c222b',
              border: '1px solid rgba(0, 173, 181, 0.4)',
              padding: '22px',
              maxWidth: '490px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid #00FFF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00FFF5' }}>
                  {editingCourseId ? <Edit3 size={15} /> : <Plus size={16} />}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                  {editingCourseId ? 'Edit Course Class (Jadwal Kuliah)' : 'Add Course Class (Jadwal Kuliah)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="glass-button"
                style={{ padding: '4px 8px', borderRadius: '0px' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCourse} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Course Name (Mata Kuliah) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="glass-input"
                  placeholder="e.g. Software Engineering"
                  value={mataKuliah}
                  onChange={(e) => setMataKuliah(e.target.value)}
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Day of Week *
                  </label>
                  <select
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    className="glass-input"
                    style={{ borderRadius: '0px', cursor: 'pointer' }}
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day} style={{ background: '#222831', color: '#EEEEEE' }}>
                        {day} {day === todayName ? '(Today)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Credits (SKS)
                  </label>
                  <select
                    value={sks}
                    onChange={(e) => setSks(e.target.value)}
                    className="glass-input"
                    style={{ borderRadius: '0px', cursor: 'pointer' }}
                  >
                    <option value="1" style={{ background: '#222831', color: '#EEEEEE' }}>1 SKS</option>
                    <option value="2" style={{ background: '#222831', color: '#EEEEEE' }}>2 SKS</option>
                    <option value="3" style={{ background: '#222831', color: '#EEEEEE' }}>3 SKS</option>
                    <option value="4" style={{ background: '#222831', color: '#EEEEEE' }}>4 SKS</option>
                    <option value="6" style={{ background: '#222831', color: '#EEEEEE' }}>6 SKS (Thesis)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="glass-input"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    className="glass-input"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    style={{ borderRadius: '0px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Room / Lab / Location
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Room 304, Lab AI, Online Zoom"
                  value={ruangan}
                  onChange={(e) => setRuangan(e.target.value)}
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Lecturer / Professor
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Prof. Alan Turing"
                  value={dosen}
                  onChange={(e) => setDosen(e.target.value)}
                  style={{ borderRadius: '0px' }}
                />
              </div>

              {/* Online Class / LMS / Zoom Link */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Online Class / LMS / Google Classroom / Drive Link (Optional)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="url"
                    className="glass-input"
                    placeholder="https://classroom.google.com/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    style={{ borderRadius: '0px', paddingLeft: '30px' }}
                  />
                  <LinkIcon size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Badge Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map(c => (
                    <div
                      key={c.value}
                      onClick={() => setWarna(c.value)}
                      title={c.name}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: c.value,
                        cursor: 'pointer',
                        border: warna === c.value ? '2px solid white' : '1px solid rgba(0,0,0,0.5)',
                        transform: warna === c.value ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-button"
                  style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '0px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button glass-button-primary"
                  style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '0px' }}
                >
                  {editingCourseId ? <Edit3 size={15} /> : <Plus size={15} />}
                  {isSubmitting ? 'Saving...' : editingCourseId ? 'Update Course Class' : 'Add Course Class'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 2-Step Deletion Verification Modal */}
      {courseToDelete && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setCourseToDelete(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1b2028',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              padding: '22px',
              maxWidth: '440px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '0px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                  Confirm Deletion (Step 2/2)
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Are you sure you want to permanently delete this course class?
                </p>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '12px',
              color: '#EEEEEE',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Course:</strong> {courseToDelete.mataKuliah}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Schedule:</strong> {courseToDelete.hari}, {courseToDelete.jamMulai} - {courseToDelete.jamSelesai}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Room:</strong> {courseToDelete.ruangan}</div>
              {courseToDelete.dosen && (
                <div><strong style={{ color: 'var(--text-muted)' }}>Lecturer:</strong> {courseToDelete.dosen}</div>
              )}
            </div>

            <p style={{ fontSize: '11px', color: '#f87171', margin: 0 }}>
              * This class schedule will be removed from your weekly timetable.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="glass-button"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeAcademicCourse(courseToDelete.id);
                  setCourseToDelete(null);
                  toast.info(`Class '${courseToDelete.mataKuliah}' deleted successfully.`);
                }}
                className="glass-button"
                style={{
                  fontSize: '13px',
                  padding: '8px 18px',
                  background: '#ef4444',
                  color: 'white',
                  borderColor: '#ef4444',
                  fontWeight: 700
                }}
              >
                Yes, Delete Class
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* POP-UP MODAL: Sync to Google Calendar HP (Cara 1) */}
      {isGCalModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsGCalModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1c222b',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '22px',
              maxWidth: '540px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Calendar size={16} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                  Sambungkan ke Google Calendar HP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGCalModalOpen(false)}
                className="glass-button"
                style={{ padding: '4px 8px', borderRadius: '0px' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* OPSI 1: MASUKKAN SEMUA SEKALIGUS */}
            <div style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(0, 173, 181, 0.12) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '0px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#10b981" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#EEEEEE', letterSpacing: '-0.01em' }}>
                  Opsi 1: Masukkan Semua Jadwal Sekaligus (1 Klik untuk HP)
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#b0b8c1', margin: 0, lineHeight: 1.5 }}>
                Di ponsel Android atau iPhone, tombol ini akan <strong>langsung membuka Google Calendar</strong> dan menampilkan jendela <em>"Tambahkan semua {courses.length} acara ke kalender?"</em>. Anda cukup menekan <strong>"Tambahkan Semua / Add All"</strong>.
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportCalendar}
                  className="glass-button glass-button-primary"
                  style={{
                    fontSize: '12px',
                    padding: '8px 16px',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#10b981'
                  }}
                >
                  <Download size={14} />
                  <span>⚡ Masukkan Semua Jadwal Sekaligus ke Kalender HP</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAllInGCal}
                  className="glass-button"
                  style={{
                    fontSize: '11px',
                    padding: '8px 12px',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderColor: 'rgba(0, 173, 181, 0.4)',
                    color: '#00FFF5'
                  }}
                  title="Buka semua mata kuliah di tab Google Calendar secara bersamaan"
                >
                  <Layers size={13} />
                  <span>Buka Semua Tab Google Calendar ({courses.length})</span>
                </button>
              </div>
            </div>

            {/* OPSI 2: PILIH SATU PER SATU */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Opsi 2: Atau Masukkan Satu per Satu ke Google Calendar:
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{courses.length} Mata Kuliah</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {courses.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderLeft: `3px solid ${c.warna || '#00ADB5'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>{c.mataKuliah}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {c.hari}, {c.jamMulai} - {c.jamSelesai} &bull; {c.ruangan}
                      </div>
                    </div>

                    <a
                      href={getGoogleCalendarUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button"
                      style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '0px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    >
                      <ExternalLink size={12} />
                      <span>Buka di Google Calendar HP</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setIsGCalModalOpen(false)}
                className="glass-button"
                style={{ fontSize: '12px', padding: '6px 16px', borderRadius: '0px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
