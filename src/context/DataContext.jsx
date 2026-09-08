import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';
import { notifyNewTask, notifyTaskCompleted, notifyClassReminder, notifyDeadlineReminder, notifyOverdueTaskReminder, notifyImpendingDeadlineReminder } from '../services/telegramService';
import { parseScheduleItem } from '../utils/scheduleUtils';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [moods, setMoods] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tags, setTags] = useState([]);
  const [copingList, setCopingList] = useState([]);
  const [brainDumps, setBrainDumps] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDifferent = (prev, next) => {
    if (prev === next) return false;
    if (!prev || !next) return true;
    if (prev.length !== next.length) return true;
    return JSON.stringify(prev) !== JSON.stringify(next);
  };

  const reloadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      if (!user) {
        setMoods([]);
        setSchedules([]);
        setCourses([]);
        setTags([]);
        setCopingList([]);
        setBrainDumps([]);
        setLoading(false);
        return;
      }
      const [m, s, cList, t, c, b] = await Promise.all([
        api.getMoodHistory(),
        api.getSchedules(),
        api.getAcademicCourses(),
        api.getTags(),
        api.getCopingStrategies(),
        api.getBrainDumps()
      ]);

      // Hanya ubah state jika data benar-benar berbeda (mencegah lag / re-render sia-sia)
      setMoods(prev => isDifferent(prev, m) ? (m || []) : prev);
      setSchedules(prev => isDifferent(prev, s) ? (s || []) : prev);
      setCourses(prev => isDifferent(prev, cList) ? (cList || []) : prev);
      setTags(prev => isDifferent(prev, t) ? (t || []) : prev);
      setCopingList(prev => isDifferent(prev, c) ? (c || []) : prev);
      setBrainDumps(prev => isDifferent(prev, b) ? (b || []) : prev);
    } catch (err) {
      console.error("Error loading application data", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Auto-sync multi-perangkat (Laptop <-> HP): Silent background sync saat window/tab aktif atau interval 10 detik
  useEffect(() => {
    if (!user) return;

    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        reloadData(true);
      }
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('pageshow', handleSync);
    window.addEventListener('online', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        reloadData(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('pageshow', handleSync);
      window.removeEventListener('online', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      clearInterval(syncInterval);
    };
  }, [user, reloadData]);

  // Pengingat Otomatis Mandiri: 30 Menit Sebelum Tiap Kelas & Deadline Hari Ini
  useEffect(() => {
    if (!user) return;

    const checkUpcomingReminders = () => {
      try {
        const now = new Date();
        const currentDayEn = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentDayId = now.toLocaleDateString('id-ID', { weekday: 'long' });
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const todayDateStr = now.toISOString().split('T')[0];
        const displayName = user?.nama || user?.username || 'demo';

        // 1. Pengingat Masing-Masing Kelas Kuliah (30 Menit Sebelum Mulai)
        if (courses && courses.length > 0) {
          courses.forEach((c) => {
            const courseDay = (c.hari || '').trim().toLowerCase();
            const isToday =
              courseDay === currentDayEn.toLowerCase() ||
              courseDay === currentDayId.toLowerCase() ||
              (currentDayEn === 'Monday' && courseDay === 'senin') ||
              (currentDayEn === 'Tuesday' && courseDay === 'selasa') ||
              (currentDayEn === 'Wednesday' && courseDay === 'rabu') ||
              (currentDayEn === 'Thursday' && courseDay === 'kamis') ||
              (currentDayEn === 'Friday' && courseDay === 'jumat') ||
              (currentDayEn === 'Saturday' && courseDay === 'sabtu') ||
              (currentDayEn === 'Sunday' && courseDay === 'minggu');

            if (!isToday) return;

            // Parse jamMulai (format "HH:mm")
            const [hStr, mStr] = (c.jamMulai || '08:00').split(':');
            const classMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
            const diffMinutes = classMinutes - nowMinutes;

            // Kirim pesan pengingat tersendiri bila kelas akan mulai dalam rentang <= 30 menit
            if (diffMinutes > 0 && diffMinutes <= 30) {
              const sentKey = `tg_sent_course_${c.id}_${todayDateStr}`;
              if (!localStorage.getItem(sentKey)) {
                localStorage.setItem(sentKey, 'true');
                notifyClassReminder(c, user?.telegramChatId, displayName);
              }
            }
          });
        }

        // 2. Pengingat Masing-Masing Deadline Tugas Hari Ini
        if (schedules && schedules.length > 0) {
          schedules.forEach((s) => {
            if (s.selesai || s.progress === 100) return;
            const taskDate = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0];
            if (taskDate === todayDateStr) {
              const sentDeadlineKey = `tg_sent_deadline_${s.id}_${todayDateStr}`;
              if (!localStorage.getItem(sentDeadlineKey)) {
                localStorage.setItem(sentDeadlineKey, 'true');
                notifyDeadlineReminder(s, user?.telegramChatId, displayName);
              }
            }
          });
        }

        // 3. Pengingat Tugas yang Sudah Melewati Tenggat Waktu & Belum Selesai (Overdue)
        if (schedules && schedules.length > 0) {
          schedules.forEach((s) => {
            if (s.selesai || s.progress === 100) return;
            const taskDate = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0];
            // Jika tanggal tugas < hari ini (sudah lewat tenggat)
            if (taskDate < todayDateStr) {
              const sentOverdueKey = `tg_sent_overdue_${s.id}_${todayDateStr}`;
              if (!localStorage.getItem(sentOverdueKey)) {
                localStorage.setItem(sentOverdueKey, 'true');
                notifyOverdueTaskReminder(s, user?.telegramChatId, displayName);
              }
            }
          });
        }

        // 4. Pengingat Tugas Menjelang Deadline (30 Menit / 1 Jam / 2 Jam Sebelumnya sesuai pilihan tugas)
        if (schedules && schedules.length > 0) {
          schedules.forEach((s) => {
            if (s.selesai) return;
            const parsed = parseScheduleItem(s);
            if (parsed.progress === 100 || !parsed.reminderBefore) return;

            const targetMinutes = parseInt(parsed.reminderBefore, 10);
            if (!targetMinutes || isNaN(targetMinutes)) return;

            const taskDate = typeof s.tanggal === 'string' ? s.tanggal.split('T')[0] : new Date(s.tanggal).toISOString().split('T')[0];
            if (taskDate !== todayDateStr) return;

            const deadlineTimeStr = parsed.deadlineTime || '23:59';
            const [hStr, mStr] = deadlineTimeStr.split(':');
            const deadlineMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10);
            const diffMinutes = deadlineMinutes - nowMinutes;

            // Trigger jika dalam rentang <= targetMinutes (belum lewat)
            if (diffMinutes > 0 && diffMinutes <= targetMinutes) {
              const sentImpendingKey = `tg_sent_impending_${s.id}_${targetMinutes}_${todayDateStr}`;
              if (!localStorage.getItem(sentImpendingKey)) {
                localStorage.setItem(sentImpendingKey, 'true');
                notifyImpendingDeadlineReminder(parsed, targetMinutes, user?.telegramChatId, displayName);
              }
            }
          });
        }
      } catch (e) {
        console.warn('Error checking upcoming reminders for Telegram:', e);
      }
    };

    checkUpcomingReminders();
    const intervalId = setInterval(checkUpcomingReminders, 30000); // Cek tiap 30 detik
    return () => clearInterval(intervalId);
  }, [user, courses, schedules]);

  const addMoodEntry = async (entryData) => {
    const res = await api.submitMood(entryData);
    if (res) {
      setMoods(prev => [res, ...prev.filter(m => m.id !== res.id)]);
    }
    reloadData(true);
    return res;
  };

  const removeMoodEntry = async (id) => {
    // Optimistic delete: instantly remove from screen
    setMoods(prev => prev.filter(m => m.id !== id));
    await api.deleteMood(id);
    reloadData(true);
  };

  const addScheduleItem = async (schedData) => {
    const res = await api.submitSchedule(schedData);
    if (res) {
      setSchedules(prev => [...prev.filter(s => s.id !== res.id), res]);
    }
    try {
      const displayName = user?.nama || user?.username || 'demo';
      notifyNewTask(schedData, user?.telegramChatId, displayName).catch(() => {});
    } catch {}
    reloadData(true);
    return res;
  };

  const updateScheduleItem = async (id, schedData) => {
    // Optimistic update: reflect immediately
    setSchedules(prev => prev.map(s => (s.id === id ? { ...s, ...schedData } : s)));
    const res = await api.updateSchedule(id, schedData);
    if (res) {
      setSchedules(prev => prev.map(s => (s.id === id ? { ...s, ...res } : s)));
    }
    try {
      if (schedData.progress === 100 || schedData.selesai) {
        const displayName = user?.nama || user?.username || 'demo';
        notifyTaskCompleted(schedData, user?.telegramChatId, displayName).catch(() => {});
      }
    } catch {}
    reloadData(true);
    return res;
  };

  const removeScheduleItem = async (id) => {
    // Optimistic delete: instantly remove from screen
    setSchedules(prev => prev.filter(s => s.id !== id));
    await api.deleteSchedule(id);
    reloadData(true);
  };

  const addAcademicCourse = async (courseData) => {
    const res = await api.submitAcademicCourse(courseData);
    if (res) {
      setCourses(prev => [...prev.filter(c => c.id !== res.id), res]);
    }
    reloadData(true);
    return res;
  };

  const updateAcademicCourse = async (id, courseData) => {
    // Optimistic update: reflect immediately
    setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...courseData } : c)));
    const res = await api.updateAcademicCourse(id, courseData);
    if (res) {
      setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...res } : c)));
    }
    reloadData(true);
    return res;
  };

  const removeAcademicCourse = async (id) => {
    // Optimistic delete: instantly remove from screen
    setCourses(prev => prev.filter(c => c.id !== id));
    await api.deleteAcademicCourse(id);
    reloadData(true);
  };

  const removeAcademicCourses = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    // Optimistic bulk delete: instantly remove selected courses from screen
    setCourses(prev => prev.filter(c => !ids.includes(c.id)));
    await api.bulkDeleteAcademicCourses(ids);
    reloadData(true);
  };

  const createTag = async (nama) => {
    const res = await api.addTag(nama);
    if (res) {
      setTags(prev => [...prev.filter(t => t.id !== res.id), res]);
    }
    reloadData(true);
    return res;
  };

  const createCopingStrategy = async (nama, deskripsi) => {
    const res = await api.addCopingStrategy(nama, deskripsi);
    if (res) {
      setCopingList(prev => [...prev.filter(c => c.id !== res.id), res]);
    }
    reloadData(true);
    return res;
  };

  const createBrainDump = async (isi) => {
    const res = await api.addBrainDump(isi);
    if (res) {
      setBrainDumps(prev => [res, ...prev.filter(b => b.id !== res.id)]);
    }
    reloadData(true);
    return res;
  };

  return (
    <DataContext.Provider
      value={{
        moods,
        schedules,
        courses,
        tags,
        copingList,
        brainDumps,
        loading,
        reloadData,
        addMoodEntry,
        removeMoodEntry,
        addScheduleItem,
        updateScheduleItem,
        removeScheduleItem,
        addAcademicCourse,
        updateAcademicCourse,
        removeAcademicCourse,
        removeAcademicCourses,
        createTag,
        createCopingStrategy,
        createBrainDump
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
