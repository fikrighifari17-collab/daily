import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Link as LinkIcon,
  RefreshCw,
  FileText,
  FolderOpen,
  Paperclip,
  Presentation,
  File,
  Filter,
  Upload,
  Eye,
  CheckCircle2,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { exportCoursesToICS, getGoogleCalendarUrl } from '../utils/calendarExport';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_LABELS = {
  Monday: { short: 'Sen', full: 'Senin' },
  Tuesday: { short: 'Sel', full: 'Selasa' },
  Wednesday: { short: 'Rab', full: 'Rabu' },
  Thursday: { short: 'Kam', full: 'Kamis' },
  Friday: { short: 'Jum', full: 'Jumat' },
  Saturday: { short: 'Sab', full: 'Sabtu' },
  Sunday: { short: 'Min', full: 'Minggu' }
};

const getDayShort = (day) => DAY_LABELS[day]?.short || day?.slice(0, 3);
const getDayFull = (day) => DAY_LABELS[day]?.full || day;

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

  // Filter state - initialized to today's realtime day
  const [selectedDayFilter, setSelectedDayFilter] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return DAYS_OF_WEEK.includes(today) ? today : 'Monday';
  });

  // 2-Step Deletion Verification Modal State
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Course Materials & PPT Modal State
  const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState(null);
  const [materialPertemuanFilter, setMaterialPertemuanFilter] = useState('ALL'); // 'ALL' | '1'..'16'
  const [materialTypeFilter, setMaterialTypeFilter] = useState('ALL'); // 'ALL' | 'pptx' | 'docx' | 'pdf' | 'link'
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);

  // Attendance Detail Modal State (Pertemuan 1 s/d 16)
  const [selectedCourseForAttendanceDetail, setSelectedCourseForAttendanceDetail] = useState(null);
  const [attendanceDetailFilter, setAttendanceDetailFilter] = useState('ALL'); // 'ALL' | 'present' | 'excused' | 'absent' | 'pending'

  // Quick Excused Modal State (optional reason)
  const [excusedTargetCourse, setExcusedTargetCourse] = useState(null);
  const [excusedReason, setExcusedReason] = useState('');

  // Form states for uploading/adding material
  const [newMatPertemuan, setNewMatPertemuan] = useState('1');
  const [newMatJudul, setNewMatJudul] = useState('');
  const [newMatCatatan, setNewMatCatatan] = useState('');
  const [newMatLink, setNewMatLink] = useState('');
  const [newMatFile, setNewMatFile] = useState(null);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  // Live real-time clock for class status calculation (updates every 30 seconds)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Keep selectedCourse modals synchronized when courses state updates
  useEffect(() => {
    if (selectedCourseForMaterials) {
      const refreshed = courses.find(c => c.id === selectedCourseForMaterials.id);
      if (refreshed) {
        setSelectedCourseForMaterials(refreshed);
      }
    }
    if (selectedCourseForAttendanceDetail) {
      const refreshed = courses.find(c => c.id === selectedCourseForAttendanceDetail.id);
      if (refreshed) {
        setSelectedCourseForAttendanceDetail(refreshed);
      }
    }
  }, [courses]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (courseToDelete || isModalOpen || isGCalModalOpen || selectedCourseForMaterials || selectedCourseForAttendanceDetail || excusedTargetCourse) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [courseToDelete, isModalOpen, isGCalModalOpen, selectedCourseForMaterials, selectedCourseForAttendanceDetail, excusedTargetCourse]);

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
      toast.error('Nama mata kuliah wajib diisi ya.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        mataKuliah: mataKuliah.trim(),
        dosen: dosen.trim() || 'Dosen Pengampu',
        hari,
        jamMulai,
        jamSelesai,
        ruangan: ruangan.trim() || 'Ruang Kuliah',
        sks: Number(sks) || 3,
        warna,
        link: link.trim()
      };

      if (editingCourseId) {
        await updateAcademicCourse(editingCourseId, payload);
        toast.success(`Jadwal '${payload.mataKuliah}' berhasil diperbarui!`);
      } else {
        await addAcademicCourse({
          ...payload,
          attendance: { present: 0, absent: 0, excused: 0, target: 16 }
        });
        toast.success(`Jadwal '${payload.mataKuliah}' berhasil ditambahkan ke hari ${getDayFull(hari)}!`);
      }

      setIsModalOpen(false);
      setEditingCourseId(null);
    } catch (err) {
      toast.error('Gagal menyimpan jadwal kuliah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to extract or generate 16 attendance sessions
  const getCourseAttendanceSessions = (course) => {
    const att = course?.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    const target = Number(att.target) || 16;
    if (Array.isArray(att.sessions) && att.sessions.length === target) {
      return att.sessions;
    }

    // Generate sessions matching existing counts
    const sessions = [];
    let pLeft = att.present || 0;
    let eLeft = att.excused || 0;
    let aLeft = att.absent || 0;

    for (let i = 1; i <= target; i++) {
      let status = 'pending';
      if (pLeft > 0) {
        status = 'present';
        pLeft--;
      } else if (eLeft > 0) {
        status = 'excused';
        eLeft--;
      } else if (aLeft > 0) {
        status = 'absent';
        aLeft--;
      }
      sessions.push({
        pertemuan: i,
        status,
        date: status !== 'pending' ? new Date().toISOString().split('T')[0] : '',
        topic: i === 8 ? 'Ujian Tengah Semester (UTS)' : i === 16 ? 'Ujian Akhir Semester (UAS)' : ''
      });
    }
    return sessions;
  };

  // Quick Attendance increment handler (+ Present, + Absent, + Excused)
  const handleUpdateAttendance = async (c, type, reason = '') => {
    const currentAtt = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    const target = Number(currentAtt.target) || 16;
    const currentSessions = getCourseAttendanceSessions(c);

    let sessionMarked = false;
    const updatedSessions = currentSessions.map((s) => {
      if (!sessionMarked && s.status === 'pending') {
        sessionMarked = true;
        return {
          ...s,
          status: type,
          date: new Date().toISOString().split('T')[0],
          reason: type === 'excused' ? (reason?.trim() || '') : ''
        };
      }
      return s;
    });

    const newPresent = updatedSessions.filter(s => s.status === 'present').length;
    const newAbsent = updatedSessions.filter(s => s.status === 'absent').length;
    const newExcused = updatedSessions.filter(s => s.status === 'excused').length;

    const updatedAtt = {
      ...currentAtt,
      present: newPresent,
      absent: newAbsent,
      excused: newExcused,
      sessions: updatedSessions
    };

    try {
      await updateAcademicCourse(c.id, { attendance: updatedAtt });
      const label = type === 'present' ? 'Hadir (+1)' : type === 'absent' ? 'Alfa (+1)' : `Izin (+1)${reason?.trim() ? ` - ${reason.trim()}` : ''}`;
      toast.success(`${c.mataKuliah}: ${label} berhasil dicatat!`);
    } catch (err) {
      toast.error('Gagal mencatat kehadiran.');
    }
  };

  // Reset attendance to 0
  const handleResetAttendance = async (c) => {
    if (!window.confirm(`Reset riwayat kehadiran untuk ${c.mataKuliah} kembali ke 0?`)) return;
    const currentAtt = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    const target = Number(currentAtt.target) || 16;
    const resetSessions = Array.from({ length: target }, (_, i) => ({
      pertemuan: i + 1,
      status: 'pending',
      date: '',
      topic: i + 1 === 8 ? 'Ujian Tengah Semester (UTS)' : i + 1 === 16 ? 'Ujian Akhir Semester (UAS)' : '',
      reason: ''
    }));

    const updatedAtt = {
      ...currentAtt,
      present: 0,
      absent: 0,
      excused: 0,
      sessions: resetSessions
    };
    try {
      await updateAcademicCourse(c.id, { attendance: updatedAtt });
      setSelectedCourseForAttendanceDetail(prev => prev && prev.id === c.id ? { ...prev, attendance: updatedAtt } : prev);
      toast.success(`Kehadiran ${c.mataKuliah} di-reset ke 0.`);
    } catch (err) {
      toast.error('Gagal mereset kehadiran.');
    }
  };

  // Set individual session status in Detail Modal (Hadir, Izin, Alfa, Belum)
  const handleSetSessionStatus = async (pertemuanNumber, newStatus, optionalReason = '') => {
    if (!selectedCourseForAttendanceDetail) return;
    const c = selectedCourseForAttendanceDetail;
    const currentAtt = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    const currentSessions = getCourseAttendanceSessions(c);

    const updatedSessions = currentSessions.map(s => {
      if (s.pertemuan === pertemuanNumber) {
        return {
          ...s,
          status: newStatus,
          date: newStatus !== 'pending' ? (s.date || new Date().toISOString().split('T')[0]) : '',
          reason: newStatus === 'excused' ? (optionalReason || s.reason || '') : ''
        };
      }
      return s;
    });

    const newPresent = updatedSessions.filter(s => s.status === 'present').length;
    const newAbsent = updatedSessions.filter(s => s.status === 'absent').length;
    const newExcused = updatedSessions.filter(s => s.status === 'excused').length;

    const updatedAtt = {
      ...currentAtt,
      present: newPresent,
      absent: newAbsent,
      excused: newExcused,
      sessions: updatedSessions
    };

    try {
      await updateAcademicCourse(c.id, { attendance: updatedAtt });
      setSelectedCourseForAttendanceDetail(prev => prev ? { ...prev, attendance: updatedAtt } : null);
    } catch (err) {
      toast.error('Gagal memperbarui status kehadiran.');
    }
  };

  // Update optional reason for an individual session in Detail Modal
  const handleUpdateSessionReason = async (pertemuanNumber, reason) => {
    if (!selectedCourseForAttendanceDetail) return;
    const c = selectedCourseForAttendanceDetail;
    const currentAtt = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    const currentSessions = getCourseAttendanceSessions(c);

    const updatedSessions = currentSessions.map(s => {
      if (s.pertemuan === pertemuanNumber) {
        return {
          ...s,
          reason: (reason || '').trim()
        };
      }
      return s;
    });

    const updatedAtt = {
      ...currentAtt,
      sessions: updatedSessions
    };

    try {
      await updateAcademicCourse(c.id, { attendance: updatedAtt });
      setSelectedCourseForAttendanceDetail(prev => prev ? { ...prev, attendance: updatedAtt } : null);
    } catch (err) {
      toast.error('Gagal menyimpan alasan.');
    }
  };

  // Bulk mark all sessions as present
  const handleMarkAllSessionsPresent = async () => {
    if (!selectedCourseForAttendanceDetail) return;
    const c = selectedCourseForAttendanceDetail;
    const currentAtt = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    const currentSessions = getCourseAttendanceSessions(c);

    const updatedSessions = currentSessions.map(s => ({
      ...s,
      status: 'present',
      date: s.date || new Date().toISOString().split('T')[0]
    }));

    const updatedAtt = {
      ...currentAtt,
      present: updatedSessions.length,
      absent: 0,
      excused: 0,
      sessions: updatedSessions
    };

    try {
      await updateAcademicCourse(c.id, { attendance: updatedAtt });
      setSelectedCourseForAttendanceDetail(prev => prev ? { ...prev, attendance: updatedAtt } : null);
      toast.success('Semua pertemuan ditandai Hadir!');
    } catch (err) {
      toast.error('Gagal memperbarui status kehadiran.');
    }
  };

  // Course Materials Handlers (Word, PPT, PDF, etc.)
  const handleMaterialFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 25MB.');
      return;
    }

    const formatSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewMatFile({
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
        data: reader.result
      });
      if (!newMatJudul.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setNewMatJudul(nameWithoutExt);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!selectedCourseForMaterials) return;
    if (!newMatJudul.trim() && !newMatFile && !newMatLink.trim()) {
      toast.error('Mohon masukkan judul materi, file (PPT/Word/PDF), atau link materi.');
      return;
    }

    setIsSavingMaterial(true);
    try {
      const course = selectedCourseForMaterials;
      const currentMaterials = course.materials || course.attendance?.materials || [];

      let fileExt = 'other';
      if (newMatFile?.name) {
        const ext = newMatFile.name.split('.').pop().toLowerCase();
        if (['ppt', 'pptx'].includes(ext)) fileExt = 'pptx';
        else if (['doc', 'docx'].includes(ext)) fileExt = 'docx';
        else if (ext === 'pdf') fileExt = 'pdf';
        else if (['xls', 'xlsx'].includes(ext)) fileExt = 'xlsx';
        else fileExt = ext;
      } else if (newMatLink.trim()) {
        fileExt = 'link';
      }

      const newMaterial = {
        id: 'mat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        pertemuan: Number(newMatPertemuan) || 1,
        judul: newMatJudul.trim() || newMatFile?.name || `Materi Pertemuan ${newMatPertemuan}`,
        namaFile: newMatFile?.name || null,
        tipeFile: fileExt,
        ukuranFile: newMatFile?.size || null,
        fileData: newMatFile?.data || null,
        externalLink: newMatLink.trim() || null,
        catatan: newMatCatatan.trim() || null,
        createdAt: new Date().toISOString()
      };

      const updatedMaterials = [newMaterial, ...currentMaterials];
      const updatedAttendance = {
        ...(course.attendance || { present: 0, absent: 0, excused: 0, target: 16 }),
        materials: updatedMaterials
      };

      await updateAcademicCourse(course.id, {
        attendance: updatedAttendance,
        materials: updatedMaterials
      });

      setSelectedCourseForMaterials(prev => prev ? { ...prev, attendance: updatedAttendance, materials: updatedMaterials } : null);
      toast.success(`Materi Pertemuan ${newMatPertemuan} berhasil disimpan!`);

      setNewMatJudul('');
      setNewMatCatatan('');
      setNewMatLink('');
      setNewMatFile(null);
      setIsAddMaterialOpen(false);
    } catch (err) {
      console.error("Save material error:", err);
      toast.error('Gagal menyimpan materi kuliah.');
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!selectedCourseForMaterials) return;
    try {
      const course = selectedCourseForMaterials;
      const currentMaterials = course.materials || course.attendance?.materials || [];
      const updatedMaterials = currentMaterials.filter(m => m.id !== materialId);

      const updatedAttendance = {
        ...(course.attendance || { present: 0, absent: 0, excused: 0, target: 16 }),
        materials: updatedMaterials
      };

      await updateAcademicCourse(course.id, {
        attendance: updatedAttendance,
        materials: updatedMaterials
      });

      setSelectedCourseForMaterials(prev => prev ? { ...prev, attendance: updatedAttendance, materials: updatedMaterials } : null);
      toast.info('Materi berhasil dihapus.');
    } catch (err) {
      console.error("Delete material error:", err);
      toast.error('Gagal menghapus materi.');
    }
  };

  const handleDownloadMaterial = (mat) => {
    if (mat.fileData) {
      const linkEl = document.createElement('a');
      linkEl.href = mat.fileData;
      linkEl.download = mat.namaFile || `${mat.judul || 'Materi'}.${mat.tipeFile || 'bin'}`;
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
      toast.success(`Mengunduh file: ${mat.namaFile || mat.judul}`);
    } else if (mat.externalLink) {
      window.open(mat.externalLink, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('File tidak memiliki data unduhan atau link.');
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
        label: `LAGI KULIAH • Sisa ${remainingMins} menit`,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.2)',
        border: 'rgba(16, 185, 129, 0.5)'
      };
    }

    if (nowTotalMins < startTotalMins && (startTotalMins - nowTotalMins) <= 60) {
      const diffMins = startTotalMins - nowTotalMins;
      return {
        type: 'upcoming',
        label: `Mulai ${diffMins} menit lagi`,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.2)',
        border: 'rgba(245, 158, 11, 0.5)'
      };
    }

    if (nowTotalMins > endTotalMins) {
      return {
        type: 'finished',
        label: 'Kuliah Sudah Selesai',
        color: '#9ca3af',
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'rgba(156, 163, 175, 0.25)'
      };
    }

    return null;
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '0 auto', padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Header Banner - Responsive: Minimalist on Mobile, Full on Laptop */}
      <div className="glass-panel academic-header-panel" style={{ 
        background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.2), rgba(57, 62, 70, 0.8))', 
        border: '1px solid rgba(0, 173, 181, 0.3)', 
        borderRadius: '0px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* Left: Icon, Title, Subtitle (Laptop), and Compact Badges (Mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '7px', borderRadius: '0px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} color="#00FFF5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 className="academic-header-title" style={{ fontWeight: 800, color: '#EEEEEE', margin: 0, letterSpacing: '-0.01em' }}>
                  Jadwal Kuliah
                </h2>

                {/* Mobile-only Stats Badges (Compact) */}
                <div className="academic-header-metrics-mobile" style={{ alignItems: 'center', gap: '5px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: '#00FFF5', 
                    background: 'rgba(0, 173, 181, 0.15)', 
                    border: '1px solid rgba(0, 173, 181, 0.35)', 
                    padding: '2px 7px' 
                  }}>
                    {courses.length} Kelas
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: '#10b981', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    border: '1px solid rgba(16, 185, 129, 0.35)', 
                    padding: '2px 7px' 
                  }}>
                    {totalSks} SKS
                  </span>
                </div>
              </div>

              {/* Laptop-only Subtitle */}
              <p className="academic-header-desc" style={{ fontSize: '12px', color: '#b0b8c1', margin: '4px 0 0 0' }}>
                Pantau jadwal kuliah mingguan, presensi pertemuan, link Zoom/LMS, dan materi dosen kamu.
              </p>
            </div>
          </div>

          {/* Right Action & Metrics Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Laptop-only Large Metric Cards */}
            <div className="academic-header-metrics-large" style={{ gap: '8px' }}>
              <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 173, 181, 0.3)', textAlign: 'center', borderRadius: '0px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00FFF5', lineHeight: 1.1 }}>{courses.length}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Kelas</div>
              </div>
              <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 173, 181, 0.3)', textAlign: 'center', borderRadius: '0px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>{totalSks}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total SKS</div>
              </div>
            </div>

            {/* Export Calendar Button */}
            <button
              type="button"
              onClick={handleExportCalendar}
              className="glass-button"
              style={{ 
                fontSize: '11px', 
                padding: '6px 12px', 
                borderRadius: '0px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                whiteSpace: 'nowrap' 
              }}
              title="Unduh file .ics untuk disinkronkan ke Google Calendar atau kalender HP"
            >
              <Download size={13} color="#00FFF5" />
              <span>Ekspor Kalender (.ics)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Filter Toolbar: Title and New Course */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="#00FFF5" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#EEEEEE' }}>
              Filter Hari:
            </span>
            <span style={{ fontSize: '10px', color: '#00FFF5', fontWeight: 600 }}>
              {selectedDayFilter === 'ALL' 
                ? `Semua Hari (${courses.length})` 
                : `${getDayFull(selectedDayFilter)} ${selectedDayFilter === todayName ? '(Hari Ini)' : ''}`}
            </span>
          </div>

          {/* New Course Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="glass-button"
            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '0px', display: 'flex', alignItems: 'center', gap: '5px', borderColor: 'rgba(0, 173, 181, 0.4)', color: '#00FFF5' }}
          >
            <Plus size={13} />
            <span>Tambah Matkul</span>
          </button>
        </div>

        {/* Day Tabs: Permanent Grid Layout (All 7 Days + All Always Visible) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))',
          gap: '6px',
          width: '100%'
        }}>
          <button
            onClick={() => setSelectedDayFilter('ALL')}
            className={`glass-button ${selectedDayFilter === 'ALL' ? 'glass-button-primary' : ''}`}
            style={{
              fontSize: '11px',
              padding: '7px 4px',
              borderRadius: '0px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontWeight: selectedDayFilter === 'ALL' ? 700 : 500
            }}
          >
            Semua ({courses.length})
          </button>
          {DAYS_OF_WEEK.map(day => {
            const count = courses.filter(c => c.hari === day).length;
            const isToday = day === todayName;
            const isSelected = selectedDayFilter === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                className={`glass-button ${isSelected ? 'glass-button-primary' : ''}`}
                style={{
                  fontSize: '11px',
                  padding: '7px 4px',
                  borderRadius: '0px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  fontWeight: isSelected ? 700 : 500,
                  borderColor: isToday && !isSelected ? '#00FFF5' : undefined
                }}
              >
                <span>{getDayShort(day)}</span>
                {count > 0 && <span style={{ opacity: 0.85, marginLeft: '3px', fontSize: '10px' }}>({count})</span>}
                {isToday && <span style={{ fontSize: '9px', color: isSelected ? '#ffffff' : '#00FFF5', marginLeft: '3px' }}>•</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Classes Cards Grid (8px gap) */}
      {filteredCourses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', borderRadius: '0px' }}>
          <BookOpen size={32} style={{ opacity: 0.35, margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#EEEEEE' }}>Belum ada jadwal kuliah untuk {selectedDayFilter === 'ALL' ? 'semester ini' : getDayFull(selectedDayFilter)}.</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>Klik tombol di bawah buat nambahin jadwal kuliah kamu ya.</div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="glass-button glass-button-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '12px', borderRadius: '0px' }}
          >
            <Plus size={14} />
            <span>+ Tambah Jadwal Kuliah</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '8px' }}>
          {filteredCourses.map((c) => {
            const isToday = c.hari === todayName;
            const liveStatus = getLiveClassStatus(c);

            // Attendance calculations
            const att = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
            const targetMeetings = att.target || 16;
            const totalRecorded = (att.present || 0) + (att.absent || 0) + (att.excused || 0);
            // Progress toward semester target meetings (0% if present is 0, so bar stays empty/not full green)
            const attendanceProgressPct = targetMeetings > 0 ? Math.round(((att.present || 0) / targetMeetings) * 100) : 0;
            // Attendance rate from recorded sessions
            const attendanceRatePct = totalRecorded > 0 ? Math.round(((att.present || 0) / totalRecorded) * 100) : 0;
            const isAttendanceWarning = totalRecorded >= 3 && attendanceRatePct < 75;

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
                          {getDayFull(c.hari).toUpperCase()} {isToday ? '• HARI INI' : ''}
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
                        title="Edit jadwal kuliah"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(c)}
                        className="glass-button"
                        style={{ padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '11px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '0px' }}
                        title="Hapus jadwal mata kuliah ini"
                      >
                        <Trash2 size={12} />
                        <span>Hapus</span>
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
                      <span>{c.ruangan || 'Ruang Kuliah'}</span>
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
                      title="Buka langsung di aplikasi Google Calendar HP"
                    >
                      <Calendar size={11} />
                      <span>Simpan ke Google Calendar</span>
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
                        <span>Buka Link Kuliah / Zoom</span>
                      </a>
                    )}

                    {linkedTasks.length > 0 && (
                      <NavLink
                        to="/schedule"
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '0px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Lihat tugas dan ujian terkait di menu Tugas & Deadline"
                      >
                        <CheckSquare size={11} />
                        <span>{linkedTasks.length} Tugas Terkait</span>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', flexWrap: 'wrap', gap: '4px' }}>
                    <div
                      onClick={() => {
                        setSelectedCourseForAttendanceDetail(c);
                        setAttendanceDetailFilter('ALL');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      title="Klik untuk melihat detail & checklist kehadiran pertemuan 1 s/d 16"
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Presensi:</span>
                      <strong style={{ color: isAttendanceWarning ? '#ef4444' : (att.present || 0) > 0 ? '#10b981' : 'var(--text-muted)' }}>
                        {att.present || 0} / {targetMeetings} ({attendanceProgressPct}%)
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAttendanceWarning && (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(239, 68, 68, 0.15)', padding: '1px 5px' }}>
                          <AlertTriangle size={10} />
                          <span>Batas &lt; 75%</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseForAttendanceDetail(c);
                          setAttendanceDetailFilter('ALL');
                        }}
                        className="glass-button"
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '0px',
                          color: '#00FFF5',
                          borderColor: 'rgba(0, 255, 245, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Buka rincian sesi pertemuan 1 s/d 16, kuota UAS, & tanggal absen"
                      >
                        <Eye size={11} />
                        <span>Lihat Detail</span>
                      </button>
                    </div>
                  </div>

                  {/* Attendance Progress Bar (Clickable) */}
                  <div
                    onClick={() => {
                      setSelectedCourseForAttendanceDetail(c);
                      setAttendanceDetailFilter('ALL');
                    }}
                    style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '0px', overflow: 'hidden', cursor: 'pointer' }}
                    title="Klik untuk melihat detail kehadiran"
                  >
                    <div
                      style={{
                        width: `${Math.min(100, attendanceProgressPct)}%`,
                        height: '100%',
                        background: isAttendanceWarning ? '#ef4444' : attendanceProgressPct >= 75 ? '#10b981' : '#00ADB5',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>

                  {/* Quick Attendance Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      Alfa: {att.absent || 0} &bull; Izin: {att.excused || 0}
                      {totalRecorded > 0 && (
                        <span style={{ marginLeft: '4px', color: isAttendanceWarning ? '#ef4444' : 'var(--text-secondary)' }}>
                          &bull; Hadir: {attendanceRatePct}%
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateAttendance(c, 'present')}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '0px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                        title="Catat hadir untuk hari ini"
                      >
                        + Hadir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExcusedTargetCourse(c);
                          setExcusedReason('');
                        }}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '0px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        title="Catat izin / sakit (alasan opsional)"
                      >
                        + Izin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAttendance(c, 'absent')}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '0px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="Catat alfa / tidak hadir"
                      >
                        + Alfa
                      </button>
                      {totalRecorded > 0 && (
                        <button
                          type="button"
                          onClick={() => handleResetAttendance(c)}
                          className="glass-button"
                          style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '0px', color: 'var(--text-muted)', opacity: 0.7 }}
                          title="Reset presensi ke 0"
                        >
                          <RefreshCw size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Materials & PPT Dosen Widget */}
                {(() => {
                  const courseMaterials = c.materials || c.attendance?.materials || [];
                  const uniqueMeetings = [...new Set(courseMaterials.map(m => m.pertemuan))].sort((a, b) => a - b);

                  return (
                    <div style={{
                      padding: '8px 10px',
                      background: 'rgba(0, 0, 0, 0.42)',
                      border: '1px solid rgba(0, 173, 181, 0.25)',
                      borderRadius: '0px',
                      marginTop: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Presentation size={13} color="#f97316" />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#EEEEEE' }}>
                            Materi & PPT Dosen:
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            background: courseMaterials.length > 0 ? 'rgba(0, 255, 245, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: courseMaterials.length > 0 ? '#00FFF5' : 'var(--text-muted)',
                            border: `1px solid ${courseMaterials.length > 0 ? 'rgba(0, 255, 245, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`
                          }}>
                            {courseMaterials.length} File
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseForMaterials(c);
                            setMaterialPertemuanFilter('ALL');
                            setMaterialTypeFilter('ALL');
                            setIsAddMaterialOpen(false);
                          }}
                          className="glass-button"
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '0px',
                            color: '#00FFF5',
                            borderColor: 'rgba(0, 173, 181, 0.45)',
                            background: 'rgba(0, 173, 181, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Buka daftar file, PPT, dan filter per pertemuan"
                        >
                          <FolderOpen size={11} />
                          <span>Kelola / Filter PPT</span>
                        </button>
                      </div>

                      {uniqueMeetings.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Tersedia:</span>
                          {uniqueMeetings.slice(0, 5).map(p => (
                            <span
                              key={p}
                              onClick={() => {
                                setSelectedCourseForMaterials(c);
                                setMaterialPertemuanFilter(String(p));
                                setMaterialTypeFilter('ALL');
                                setIsAddMaterialOpen(false);
                              }}
                              style={{
                                fontSize: '9px',
                                padding: '1px 5px',
                                background: 'rgba(0, 173, 181, 0.15)',
                                border: '1px solid rgba(0, 173, 181, 0.3)',
                                color: '#00FFF5',
                                cursor: 'pointer'
                              }}
                              title={`Klik untuk lihat Pertemuan ${p}`}
                            >
                              P.{p}
                            </span>
                          ))}
                          {uniqueMeetings.length > 5 && (
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{uniqueMeetings.length - 5} lainnya</span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Belum ada PPT/Word. Klik untuk unggah materi per pertemuan.
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                  {editingCourseId ? 'Edit Jadwal Kuliah' : 'Tambah Jadwal Kuliah'}
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
                  Nama Mata Kuliah *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="glass-input"
                  placeholder="Contoh: Rekayasa Perangkat Lunak"
                  value={mataKuliah}
                  onChange={(e) => setMataKuliah(e.target.value)}
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Hari Kuliah *
                  </label>
                  <select
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    className="glass-input"
                    style={{ borderRadius: '0px', cursor: 'pointer' }}
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day} style={{ background: '#222831', color: '#EEEEEE' }}>
                        {getDayFull(day)} {day === todayName ? '(Hari Ini)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Bobot SKS
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
                    <option value="6" style={{ background: '#222831', color: '#EEEEEE' }}>6 SKS (Skripsi / Tugas Akhir)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Jam Mulai
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
                    Jam Selesai
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
                  Ruangan / Lab / Gedung
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Contoh: Ruang 304, Lab AI, Online Zoom"
                  value={ruangan}
                  onChange={(e) => setRuangan(e.target.value)}
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Dosen Pengampu
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Contoh: Pak Budi, Bu Sri"
                  value={dosen}
                  onChange={(e) => setDosen(e.target.value)}
                  style={{ borderRadius: '0px' }}
                />
              </div>

              {/* Online Class / LMS / Zoom Link */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Link Kelas Online / LMS / Zoom / Drive (Opsional)
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
                  Warna Label Kartu
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
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button glass-button-primary"
                  style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '0px' }}
                >
                  {editingCourseId ? <Edit3 size={15} /> : <Plus size={15} />}
                  {isSubmitting ? 'Menyimpan...' : editingCourseId ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}
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
                  Konfirmasi Hapus Mata Kuliah
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Yakin mau menghapus jadwal mata kuliah ini?
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
              <div><strong style={{ color: 'var(--text-muted)' }}>Mata Kuliah:</strong> {courseToDelete.mataKuliah}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Jadwal:</strong> {getDayFull(courseToDelete.hari)}, {courseToDelete.jamMulai} - {courseToDelete.jamSelesai}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Ruangan:</strong> {courseToDelete.ruangan}</div>
              {courseToDelete.dosen && (
                <div><strong style={{ color: 'var(--text-muted)' }}>Dosen:</strong> {courseToDelete.dosen}</div>
              )}
            </div>

            <p style={{ fontSize: '11px', color: '#f87171', margin: 0 }}>
              * Jadwal kuliah ini akan dihapus dari daftar jadwal mingguan kamu.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="glass-button"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  removeAcademicCourse(courseToDelete.id);
                  setCourseToDelete(null);
                  toast.info(`Jadwal '${courseToDelete.mataKuliah}' berhasil dihapus.`);
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
                Ya, Hapus Matkul
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

      {/* POP-UP MODAL: Course Materials & PPT per Pertemuan */}
      {selectedCourseForMaterials && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedCourseForMaterials(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
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
              background: '#1b2028',
              border: `1px solid ${selectedCourseForMaterials.warna || 'rgba(0, 173, 181, 0.45)'}`,
              padding: '22px',
              maxWidth: '720px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(249, 115, 22, 0.2)',
                    border: '1px solid #f97316',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f97316'
                  }}>
                    <Presentation size={18} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#EEEEEE', margin: 0 }}>
                    Materi & PPT Kuliah: {selectedCourseForMaterials.mataKuliah}
                  </h3>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    background: 'rgba(0, 173, 181, 0.15)',
                    border: '1px solid rgba(0, 173, 181, 0.35)',
                    color: '#00FFF5'
                  }}>
                    {selectedCourseForMaterials.sks || 3} SKS
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 40px' }}>
                  {selectedCourseForMaterials.dosen || 'Dosen'} &bull; {selectedCourseForMaterials.hari}, {selectedCourseForMaterials.jamMulai} - {selectedCourseForMaterials.jamSelesai} &bull; {selectedCourseForMaterials.ruangan}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCourseForMaterials(null)}
                className="glass-button"
                style={{ padding: '6px', borderRadius: '0px', color: '#b0b8c1' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-header & Action Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE' }}>
                  Arsip Dokumen Kuliah
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  background: 'rgba(0, 255, 245, 0.12)',
                  color: '#00FFF5',
                  border: '1px solid rgba(0, 255, 245, 0.3)'
                }}>
                  {(selectedCourseForMaterials.materials || selectedCourseForMaterials.attendance?.materials || []).length} File Tersimpan
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddMaterialOpen(!isAddMaterialOpen);
                  if (materialPertemuanFilter !== 'ALL') {
                    setNewMatPertemuan(materialPertemuanFilter);
                  }
                }}
                className="glass-button glass-button-primary"
                style={{
                  fontSize: '12px',
                  padding: '7px 14px',
                  borderRadius: '0px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} />
                <span>{isAddMaterialOpen ? 'Tutup Form Upload' : '+ Tambah File / PPT Dosen'}</span>
              </button>
            </div>

            {/* Upload / Add Material Form */}
            {isAddMaterialOpen && (
              <form
                onSubmit={handleSaveMaterial}
                style={{
                  padding: '16px',
                  background: 'rgba(0, 173, 181, 0.06)',
                  border: '1px dashed rgba(0, 173, 181, 0.45)',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0, 173, 181, 0.2)', paddingBottom: '8px' }}>
                  <Upload size={16} color="#00FFF5" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#00FFF5' }}>
                    Unggah File Materi Kuliah (Word / PPT / PDF)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {/* Pertemuan Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Untuk Pertemuan Ke- *
                    </label>
                    <select
                      className="glass-input"
                      value={newMatPertemuan}
                      onChange={(e) => setNewMatPertemuan(e.target.value)}
                      style={{ borderRadius: '0px', cursor: 'pointer' }}
                    >
                      {Array.from({ length: 16 }, (_, i) => i + 1).map(p => (
                        <option key={p} value={p}>Pertemuan {p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Judul Materi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Judul / Topik Materi *
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="e.g. Slide Bab 2 - Tenses & Reading"
                      value={newMatJudul}
                      onChange={(e) => setNewMatJudul(e.target.value)}
                      style={{ borderRadius: '0px' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {/* File Upload Picker */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Pilih File (PowerPoint, Word, PDF, dll):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label
                        className="glass-button"
                        style={{
                          fontSize: '11px',
                          padding: '7px 12px',
                          borderRadius: '0px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#00FFF5',
                          borderColor: 'rgba(0, 173, 181, 0.45)'
                        }}
                      >
                        <Upload size={13} />
                        <span>Pilih File Dari Perangkat</span>
                        <input
                          type="file"
                          accept=".ppt,.pptx,.doc,.docx,.pdf,.xls,.xlsx,.txt,.zip"
                          onChange={handleMaterialFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    {newMatFile && (
                      <div style={{
                        marginTop: '6px',
                        padding: '6px 10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        fontSize: '11px',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <Check size={13} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {newMatFile.name} ({newMatFile.size})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewMatFile(null)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          title="Batal pilih file"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* External Link */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Atau Link Google Drive / LMS Dosen (Opsional):
                    </label>
                    <input
                      type="url"
                      className="glass-input"
                      placeholder="https://drive.google.com/..."
                      value={newMatLink}
                      onChange={(e) => setNewMatLink(e.target.value)}
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                </div>

                {/* Catatan Tambahan */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Catatan Materi (Opsional):
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Baca sebelum pertemuan dimulai, ada tugas di slide 12"
                    value={newMatCatatan}
                    onChange={(e) => setNewMatCatatan(e.target.value)}
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                {/* Submit & Cancel Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMaterialOpen(false);
                      setNewMatFile(null);
                    }}
                    className="glass-button"
                    style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '0px' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMaterial}
                    className="glass-button glass-button-primary"
                    style={{ fontSize: '12px', padding: '6px 18px', borderRadius: '0px', fontWeight: 700 }}
                  >
                    {isSavingMaterial ? 'Menyimpan...' : 'Simpan Materi Kuliah'}
                  </button>
                </div>
              </form>
            )}

            {/* FILTER PERTEMUAN & FORMAT BAR */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(0, 173, 181, 0.25)',
              borderRadius: '0px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00FFF5', fontWeight: 700 }}>
                  <Filter size={13} />
                  <span>Filter Berdasarkan Pertemuan:</span>
                </div>

                {/* Format Filter */}
                <select
                  value={materialTypeFilter}
                  onChange={(e) => setMaterialTypeFilter(e.target.value)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(0, 173, 181, 0.35)',
                    color: '#EEEEEE',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '0px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Semua Format File</option>
                  <option value="pptx">PowerPoint (.ppt / .pptx)</option>
                  <option value="docx">Word (.doc / .docx)</option>
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="link">Link Drive / LMS</option>
                </select>
              </div>

              {/* Horizontal Scroll / Wrap Pertemuan Tabs */}
              <div style={{
                display: 'flex',
                gap: '4px',
                overflowX: 'auto',
                paddingBottom: '4px',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => setMaterialPertemuanFilter('ALL')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: materialPertemuanFilter === 'ALL' ? 700 : 500,
                    background: materialPertemuanFilter === 'ALL' ? 'rgba(0, 173, 181, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                    color: materialPertemuanFilter === 'ALL' ? '#00FFF5' : '#b0b8c1',
                    border: materialPertemuanFilter === 'ALL' ? '1px solid #00ADB5' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Semua ({(selectedCourseForMaterials.materials || selectedCourseForMaterials.attendance?.materials || []).length})
                </button>

                {Array.from({ length: 16 }, (_, i) => i + 1).map(p => {
                  const courseMats = selectedCourseForMaterials.materials || selectedCourseForMaterials.attendance?.materials || [];
                  const countForP = courseMats.filter(m => m.pertemuan === p).length;
                  const isSelected = String(materialPertemuanFilter) === String(p);

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMaterialPertemuanFilter(String(p))}
                      style={{
                        padding: '4px 9px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? 'rgba(249, 115, 22, 0.35)' : countForP > 0 ? 'rgba(0, 173, 181, 0.12)' : 'transparent',
                        color: isSelected ? '#fed7aa' : countForP > 0 ? '#00FFF5' : 'var(--text-muted)',
                        border: isSelected ? '1px solid #f97316' : countForP > 0 ? '1px solid rgba(0, 173, 181, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Pertemuan {p}</span>
                      {countForP > 0 && (
                        <span style={{
                          fontSize: '9px',
                          padding: '0 4px',
                          borderRadius: '2px',
                          background: isSelected ? '#f97316' : 'rgba(0, 173, 181, 0.3)',
                          color: 'white',
                          fontWeight: 700
                        }}>
                          {countForP}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of Materials */}
            {(() => {
              const allMats = selectedCourseForMaterials.materials || selectedCourseForMaterials.attendance?.materials || [];
              const filteredMats = allMats.filter(m => {
                if (materialPertemuanFilter !== 'ALL' && String(m.pertemuan) !== String(materialPertemuanFilter)) {
                  return false;
                }
                if (materialTypeFilter !== 'ALL') {
                  if (materialTypeFilter === 'pptx' && !['ppt', 'pptx'].includes(m.tipeFile)) return false;
                  if (materialTypeFilter === 'docx' && !['doc', 'docx'].includes(m.tipeFile)) return false;
                  if (materialTypeFilter === 'pdf' && m.tipeFile !== 'pdf') return false;
                  if (materialTypeFilter === 'link' && m.tipeFile !== 'link' && !m.externalLink) return false;
                }
                return true;
              }).sort((a, b) => a.pertemuan - b.pertemuan);

              if (filteredMats.length === 0) {
                return (
                  <div style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FolderOpen size={32} color="#b0b8c1" style={{ opacity: 0.6 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#EEEEEE' }}>
                      {materialPertemuanFilter === 'ALL'
                        ? 'Belum ada file materi atau PPT yang ditambahkan untuk mata kuliah ini.'
                        : `Belum ada file materi untuk Pertemuan ${materialPertemuanFilter}.`}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, maxWidth: '420px' }}>
                      Anda dapat menyimpan file presentasi (.ppt/.pptx), dokumen Word (.doc/.docx), modul PDF, atau link drive yang dibagikan dosen.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMaterialOpen(true);
                        if (materialPertemuanFilter !== 'ALL') {
                          setNewMatPertemuan(materialPertemuanFilter);
                        }
                      }}
                      className="glass-button glass-button-primary"
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '0px', marginTop: '4px' }}
                    >
                      <Plus size={14} />
                      <span>Upload File ke Pertemuan {materialPertemuanFilter === 'ALL' ? '1' : materialPertemuanFilter}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredMats.map((m) => {
                    const isPPT = ['ppt', 'pptx'].includes(m.tipeFile);
                    const isDoc = ['doc', 'docx'].includes(m.tipeFile);
                    const isPDF = m.tipeFile === 'pdf';

                    return (
                      <div
                        key={m.id}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(0, 0, 0, 0.45)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderLeft: `4px solid ${isPPT ? '#f97316' : isDoc ? '#3b82f6' : isPDF ? '#ef4444' : '#00ADB5'}`,
                          borderRadius: '0px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: '220px', flex: 1 }}>
                          {/* File Type Icon badge */}
                          <div style={{
                            width: '36px',
                            height: '36px',
                            background: isPPT
                              ? 'rgba(249, 115, 22, 0.18)'
                              : isDoc
                              ? 'rgba(59, 130, 246, 0.18)'
                              : isPDF
                              ? 'rgba(239, 68, 68, 0.18)'
                              : 'rgba(0, 173, 181, 0.18)',
                            border: `1px solid ${isPPT ? '#f97316' : isDoc ? '#3b82f6' : isPDF ? '#ef4444' : '#00ADB5'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isPPT ? '#f97316' : isDoc ? '#3b82f6' : isPDF ? '#ef4444' : '#00ADB5',
                            flexShrink: 0
                          }}>
                            {isPPT ? <Presentation size={18} /> : isDoc ? <FileText size={18} /> : isPDF ? <File size={18} /> : <ExternalLink size={18} />}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                background: 'rgba(249, 115, 22, 0.2)',
                                color: '#f97316',
                                border: '1px solid rgba(249, 115, 22, 0.4)'
                              }}>
                                Pertemuan {m.pertemuan}
                              </span>

                              <span style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                textTransform: 'uppercase',
                                background: isPPT ? 'rgba(249, 115, 22, 0.15)' : isDoc ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                color: isPPT ? '#fb923c' : isDoc ? '#60a5fa' : '#b0b8c1'
                              }}>
                                {isPPT ? 'PowerPoint (PPT)' : isDoc ? 'Word (Doc)' : isPDF ? 'PDF' : 'Link Drive'}
                              </span>

                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>
                                {m.judul}
                              </span>
                            </div>

                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {m.namaFile && <span>📄 {m.namaFile}</span>}
                              {m.ukuranFile && <span>&bull; {m.ukuranFile}</span>}
                              <span>&bull; Ditambahkan {new Date(m.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>

                            {m.catatan && (
                              <div style={{ fontSize: '11px', color: '#00FFF5', marginTop: '4px', fontStyle: 'italic', background: 'rgba(0, 173, 181, 0.08)', padding: '2px 6px', borderLeft: '2px solid #00ADB5' }}>
                                "{m.catatan}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {m.fileData && (
                            <button
                              type="button"
                              onClick={() => handleDownloadMaterial(m)}
                              className="glass-button glass-button-primary"
                              style={{
                                fontSize: '11px',
                                padding: '6px 12px',
                                borderRadius: '0px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              title="Unduh file ke perangkat"
                            >
                              <Download size={13} />
                              <span>Unduh File</span>
                            </button>
                          )}

                          {m.externalLink && (
                            <a
                              href={m.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="glass-button"
                              style={{
                                fontSize: '11px',
                                padding: '6px 12px',
                                borderRadius: '0px',
                                color: '#00FFF5',
                                borderColor: 'rgba(0, 173, 181, 0.4)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <ExternalLink size={13} />
                              <span>Buka Link Drive</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="glass-button"
                            style={{
                              fontSize: '11px',
                              padding: '6px 10px',
                              borderRadius: '0px',
                              color: '#ef4444',
                              borderColor: 'rgba(239, 68, 68, 0.35)',
                              background: 'rgba(239, 68, 68, 0.08)'
                            }}
                            title="Hapus materi ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                * File tersimpan aman dan terorganisir per pertemuan kuliah.
              </span>
              <button
                type="button"
                onClick={() => setSelectedCourseForMaterials(null)}
                className="glass-button"
                style={{ fontSize: '12px', padding: '6px 18px', borderRadius: '0px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* POP-UP MODAL: Detail Kehadiran Pertemuan 1 s/d 16 */}
      {selectedCourseForAttendanceDetail && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedCourseForAttendanceDetail(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
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
              background: '#161c24',
              border: `1px solid ${selectedCourseForAttendanceDetail.warna || 'rgba(0, 173, 181, 0.45)'}`,
              padding: '22px',
              maxWidth: '820px',
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
            {(() => {
              const course = selectedCourseForAttendanceDetail;
              const att = course.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
              const target = Number(att.target) || 16;
              const sessions = getCourseAttendanceSessions(course);
              const presentCount = sessions.filter(s => s.status === 'present').length;
              const excusedCount = sessions.filter(s => s.status === 'excused').length;
              const absentCount = sessions.filter(s => s.status === 'absent').length;
              const pendingCount = sessions.filter(s => s.status === 'pending').length;
              const totalRecorded = presentCount + excusedCount + absentCount;
              const progressPct = target > 0 ? Math.round((presentCount / target) * 100) : 0;
              const ratePct = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 0;

              // Academic regulations: minimum 75% attendance for UAS (max 25% absences, e.g. 4 meetings out of 16)
              const maxAbsentAllowed = Math.floor(target * 0.25);
              const remainingAbsentQuota = Math.max(0, maxAbsentAllowed - absentCount);
              const isUasEligible = absentCount <= maxAbsentAllowed;
              const isWarning = absentCount > maxAbsentAllowed || (totalRecorded >= 3 && ratePct < 75);

              // Materials list for checking PPT/Word availability per meeting
              const courseMaterials = course.materials || course.attendance?.materials || [];

              // Filter sessions by selected tab
              const filteredSessions = sessions.filter(s => {
                if (attendanceDetailFilter === 'ALL') return true;
                return s.status === attendanceDetailFilter;
              });

              return (
                <>
                  {/* Modal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          background: `${course.warna || '#00ADB5'}22`,
                          border: `1px solid ${course.warna || '#00ADB5'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: course.warna || '#00FFF5'
                        }}>
                          <BookOpen size={15} />
                        </div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                          Detail Kehadiran: {course.mataKuliah}
                        </h3>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          background: 'rgba(0, 255, 245, 0.12)',
                          color: '#00FFF5',
                          border: '1px solid rgba(0, 255, 245, 0.3)'
                        }}>
                          {course.sks || 3} SKS
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {course.dosen || 'Dosen Pengampu'} &bull; {course.hari}, {course.jamMulai} - {course.jamSelesai} &bull; {course.ruangan || 'Kampus'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCourseForAttendanceDetail(null)}
                      className="glass-button"
                      style={{ padding: '4px 8px', borderRadius: '0px' }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Summary Stats Bar: 4 Metrics Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                    {/* Card 1: Progress Kehadiran Semester */}
                    <div style={{ padding: '10px 12px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progres Kehadiran</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: progressPct > 0 ? '#00FFF5' : 'var(--text-secondary)', marginTop: '2px' }}>
                        {presentCount} / {target} <span style={{ fontSize: '12px', opacity: 0.85 }}>({progressPct}%)</span>
                      </div>
                      {/* Mini bar */}
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, progressPct)}%`, height: '100%', background: progressPct >= 75 ? '#10b981' : '#00ADB5' }} />
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {target - presentCount} pertemuan tersisa
                      </div>
                    </div>

                    {/* Card 2: Attendance Rate Berjalan */}
                    <div style={{ padding: '10px 12px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tingkat Kehadiran Aktif</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: isWarning ? '#ef4444' : totalRecorded > 0 ? '#10b981' : 'var(--text-secondary)', marginTop: '2px' }}>
                        {totalRecorded > 0 ? `${ratePct}%` : 'Belum Mulai (0%)'}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {presentCount} hadir dari {totalRecorded} sesi tercatat
                      </div>
                    </div>

                    {/* Card 3: Status Syarat UAS */}
                    <div style={{ padding: '10px 12px', background: isUasEligible ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${isUasEligible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.35)'}` }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Syarat Ikut UAS (Min. 75%)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                        {isUasEligible ? (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} /> Memenuhi Syarat
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Batas Terlampaui
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '9px', color: isUasEligible ? '#EEEEEE' : '#ef4444', marginTop: '4px' }}>
                        Sisa kuota alfa: <strong>{remainingAbsentQuota}x</strong> (Maks {maxAbsentAllowed}x)
                      </div>
                    </div>

                    {/* Card 4: Rincian Cepat */}
                    <div style={{ padding: '10px 12px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rincian Status Sesi</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', fontSize: '10px' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Hadir: {presentCount}</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>ℹ Izin: {excusedCount}</span>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Alfa: {absentCount}</span>
                        <span style={{ color: 'var(--text-muted)' }}>○ Belum: {pendingCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs & Quick Action Toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                    {/* Status Filter Tabs */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setAttendanceDetailFilter('ALL')}
                        className={`glass-button ${attendanceDetailFilter === 'ALL' ? 'glass-button-primary' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '0px' }}
                      >
                        Semua ({target})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceDetailFilter('present')}
                        className={`glass-button ${attendanceDetailFilter === 'present' ? 'glass-button-primary' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '0px', color: attendanceDetailFilter === 'present' ? undefined : '#10b981' }}
                      >
                        Hadir ({presentCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceDetailFilter('excused')}
                        className={`glass-button ${attendanceDetailFilter === 'excused' ? 'glass-button-primary' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '0px', color: attendanceDetailFilter === 'excused' ? undefined : '#f59e0b' }}
                      >
                        Izin ({excusedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceDetailFilter('absent')}
                        className={`glass-button ${attendanceDetailFilter === 'absent' ? 'glass-button-primary' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '0px', color: attendanceDetailFilter === 'absent' ? undefined : '#ef4444' }}
                      >
                        Alfa ({absentCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceDetailFilter('pending')}
                        className={`glass-button ${attendanceDetailFilter === 'pending' ? 'glass-button-primary' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '0px', color: attendanceDetailFilter === 'pending' ? undefined : 'var(--text-muted)' }}
                      >
                        Belum ({pendingCount})
                      </button>
                    </div>

                    {/* Quick Mass Actions */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleMarkAllSessionsPresent}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '0px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                        title="Tandai semua pertemuan (1-16) menjadi Hadir"
                      >
                        <Check size={11} style={{ marginRight: '3px' }} />
                        Tandai Semua Hadir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetAttendance(course)}
                        className="glass-button"
                        style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '0px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="Reset semua sesi kembali ke Belum (0)"
                      >
                        <RefreshCw size={11} style={{ marginRight: '3px' }} />
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* 16 Pertemuan Grid List */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '8px', maxHeight: '52vh', overflowY: 'auto', paddingRight: '4px' }}>
                    {filteredSessions.map((s) => {
                      const isUTS = s.pertemuan === 8;
                      const isUAS = s.pertemuan === target;
                      const matsForSession = courseMaterials.filter(m => m.pertemuan === s.pertemuan);

                      return (
                        <div
                          key={s.pertemuan}
                          style={{
                            padding: '10px 12px',
                            background: s.status === 'present' ? 'rgba(16, 185, 129, 0.06)' : s.status === 'absent' ? 'rgba(239, 68, 68, 0.08)' : s.status === 'excused' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(0, 0, 0, 0.35)',
                            border: `1px solid ${s.status === 'present' ? 'rgba(16, 185, 129, 0.28)' : s.status === 'absent' ? 'rgba(239, 68, 68, 0.35)' : s.status === 'excused' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.07)'}`,
                            borderRadius: '0px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* Card Header: Pertemuan Number, UTS/UAS badge, Status Badge */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE' }}>
                                Pertemuan {s.pertemuan}
                              </span>
                              {isUTS && (
                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                                  UTS
                                </span>
                              )}
                              {isUAS && (
                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                                  UAS
                                </span>
                              )}
                            </div>

                            {/* Status Indicator Badge */}
                            <div>
                              {s.status === 'present' && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 7px' }}>
                                  <CheckCircle2 size={11} /> Hadir
                                </span>
                              )}
                              {s.status === 'excused' && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 7px' }}>
                                  <AlertCircle size={11} /> {s.reason ? `Izin: ${s.reason}` : 'Izin / Sakit'}
                                </span>
                              )}
                              {s.status === 'absent' && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 7px' }}>
                                  <X size={11} /> Alfa
                                </span>
                              )}
                              {s.status === 'pending' && (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 7px' }}>
                                  <Clock size={11} /> Belum
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Extra info: Date & Linked Materials */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '10px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {s.date ? `Tanggal: ${s.date}` : s.topic || 'Sesi perkuliahan reguler'}
                            </span>

                            {matsForSession.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCourseForMaterials(course);
                                  setMaterialPertemuanFilter(String(s.pertemuan));
                                  setSelectedCourseForAttendanceDetail(null);
                                }}
                                className="glass-button"
                                style={{ fontSize: '9px', padding: '1px 6px', color: '#00FFF5', borderColor: 'rgba(0, 255, 245, 0.35)', display: 'flex', alignItems: 'center', gap: '3px' }}
                                title="Buka file PPT / materi untuk pertemuan ini"
                              >
                                <Presentation size={10} />
                                <span>{matsForSession.length} PPT/Materi</span>
                              </button>
                            )}
                          </div>

                          {/* 4-Button Status Switcher */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '2px' }}>
                            <button
                              type="button"
                              onClick={() => handleSetSessionStatus(s.pertemuan, 'present')}
                              className="glass-button"
                              style={{
                                fontSize: '10px',
                                padding: '4px 2px',
                                borderRadius: '0px',
                                textAlign: 'center',
                                color: s.status === 'present' ? '#EEEEEE' : '#10b981',
                                background: s.status === 'present' ? '#10b981' : 'rgba(16, 185, 129, 0.08)',
                                borderColor: s.status === 'present' ? '#10b981' : 'rgba(16, 185, 129, 0.25)',
                                fontWeight: s.status === 'present' ? 700 : 500
                              }}
                            >
                              ✓ Hadir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetSessionStatus(s.pertemuan, 'excused')}
                              className="glass-button"
                              style={{
                                fontSize: '10px',
                                padding: '4px 2px',
                                borderRadius: '0px',
                                textAlign: 'center',
                                color: s.status === 'excused' ? '#111111' : '#f59e0b',
                                background: s.status === 'excused' ? '#f59e0b' : 'rgba(245, 158, 11, 0.08)',
                                borderColor: s.status === 'excused' ? '#f59e0b' : 'rgba(245, 158, 11, 0.25)',
                                fontWeight: s.status === 'excused' ? 700 : 500
                              }}
                            >
                              ℹ Izin
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetSessionStatus(s.pertemuan, 'absent')}
                              className="glass-button"
                              style={{
                                fontSize: '10px',
                                padding: '4px 2px',
                                borderRadius: '0px',
                                textAlign: 'center',
                                color: s.status === 'absent' ? '#EEEEEE' : '#ef4444',
                                background: s.status === 'absent' ? '#ef4444' : 'rgba(239, 68, 68, 0.08)',
                                borderColor: s.status === 'absent' ? '#ef4444' : 'rgba(239, 68, 68, 0.25)',
                                fontWeight: s.status === 'absent' ? 700 : 500
                              }}
                            >
                              ✗ Alfa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetSessionStatus(s.pertemuan, 'pending')}
                              className="glass-button"
                              style={{
                                fontSize: '10px',
                                padding: '4px 2px',
                                borderRadius: '0px',
                                textAlign: 'center',
                                color: s.status === 'pending' ? '#EEEEEE' : 'var(--text-muted)',
                                background: s.status === 'pending' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                borderColor: s.status === 'pending' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                                fontWeight: s.status === 'pending' ? 700 : 400
                              }}
                            >
                              ○ Belum
                            </button>
                          </div>

                          {/* Excused Reason Input (Opsional - Tidak Wajib) */}
                          {s.status === 'excused' && (
                            <div style={{
                              marginTop: '2px',
                              padding: '6px 8px',
                              background: 'rgba(245, 158, 11, 0.07)',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              borderRadius: '0px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                                <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                                  Alasan Izin / Sakit (Opsional):
                                </span>
                                {s.reason && (
                                  <span style={{ color: '#EEEEEE', opacity: 0.7 }}>
                                    Tersimpan
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                defaultValue={s.reason || ''}
                                key={`reason-${s.pertemuan}-${s.reason || ''}`}
                                placeholder="Contoh: Sakit demam, Acara keluarga (tidak wajib)..."
                                onBlur={(e) => handleUpdateSessionReason(s.pertemuan, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateSessionReason(s.pertemuan, e.target.value);
                                    e.target.blur();
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  background: 'rgba(0, 0, 0, 0.5)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  color: '#EEEEEE',
                                  borderRadius: '0px',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Footer */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      * Status per pertemuan otomatis memperbarui persentase dan progress bar di kartu jadwal.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCourseForAttendanceDetail(null)}
                      className="glass-button glass-button-primary"
                      style={{ fontSize: '12px', padding: '6px 20px', borderRadius: '0px' }}
                    >
                      Selesai
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* POP-UP MINI-MODAL: Catat Izin / Sakit (Alasan Opsional) */}
      {excusedTargetCourse && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setExcusedTargetCourse(null)}
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
              background: '#1a1f26',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '20px',
              maxWidth: '440px',
              width: '100%',
              borderRadius: '0px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <AlertCircle size={15} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#EEEEEE', margin: 0 }}>
                  Catat Izin / Sakit
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setExcusedTargetCourse(null)}
                className="glass-button"
                style={{ padding: '3px 7px', borderRadius: '0px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Mata Kuliah: <strong style={{ color: '#EEEEEE' }}>{excusedTargetCourse.mataKuliah}</strong>
            </div>

            {/* Reason Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>
                Alasan / Keterangan (Opsional):
              </label>
              <input
                type="text"
                value={excusedReason}
                onChange={(e) => setExcusedReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateAttendance(excusedTargetCourse, 'excused', excusedReason);
                    setExcusedTargetCourse(null);
                  }
                }}
                autoFocus
                placeholder="Contoh: Sakit demam, Acara keluarga (boleh dikosongkan)..."
                style={{
                  width: '100%',
                  fontSize: '12px',
                  padding: '7px 10px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#EEEEEE',
                  borderRadius: '0px',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                * Boleh dikosongkan ya, kamu bisa langsung klik &ldquo;Simpan Izin&rdquo;.
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setExcusedTargetCourse(null)}
                className="glass-button"
                style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '0px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateAttendance(excusedTargetCourse, 'excused', excusedReason);
                  setExcusedTargetCourse(null);
                }}
                className="glass-button"
                style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '0px', color: '#111111', background: '#f59e0b', borderColor: '#f59e0b', fontWeight: 700 }}
              >
                Simpan Izin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
