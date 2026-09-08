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

  const reloadData = useCallback(async () => {
    setLoading(true);
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
      setMoods(m || []);
      setSchedules(s || []);
      setCourses(cList || []);
      setTags(t || []);
      setCopingList(c || []);
      setBrainDumps(b || []);
    } catch (err) {
      console.error("Error loading application data", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Auto-sync multi-perangkat (Laptop <-> HP): Refetch saat window difokuskan, tab aktif, atau interval 15 detik
  useEffect(() => {
    if (!user) return;

    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        reloadData();
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        reloadData();
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleSync);
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
    await reloadData();
    return res;
  };

  const removeMoodEntry = async (id) => {
    await api.deleteMood(id);
    await reloadData();
  };

  const addScheduleItem = async (schedData) => {
    const res = await api.submitSchedule(schedData);
    try {
      const displayName = user?.nama || user?.username || 'demo';
      notifyNewTask(schedData, user?.telegramChatId, displayName);
    } catch (e) {
      console.warn('Telegram notify error:', e);
    }
    await reloadData();
    return res;
  };

  const updateScheduleItem = async (id, schedData) => {
    const res = await api.updateSchedule(id, schedData);
    try {
      if (schedData.progress === 100 || schedData.selesai) {
        const displayName = user?.nama || user?.username || 'demo';
        notifyTaskCompleted(schedData, user?.telegramChatId, displayName);
      }
    } catch (e) {
      console.warn('Telegram notify error:', e);
    }
    await reloadData();
    return res;
  };

  const removeScheduleItem = async (id) => {
    await api.deleteSchedule(id);
    await reloadData();
  };

  const addAcademicCourse = async (courseData) => {
    const res = await api.submitAcademicCourse(courseData);
    await reloadData();
    return res;
  };

  const updateAcademicCourse = async (id, courseData) => {
    const res = await api.updateAcademicCourse(id, courseData);
    await reloadData();
    return res;
  };

  const removeAcademicCourse = async (id) => {
    await api.deleteAcademicCourse(id);
    await reloadData();
  };

  const createTag = async (nama) => {
    const res = await api.addTag(nama);
    await reloadData();
    return res;
  };

  const createCopingStrategy = async (nama, deskripsi) => {
    const res = await api.addCopingStrategy(nama, deskripsi);
    await reloadData();
    return res;
  };

  const createBrainDump = async (isi) => {
    const res = await api.addBrainDump(isi);
    await reloadData();
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
