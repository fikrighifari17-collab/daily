import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const DataContext = createContext();

export function DataProvider({ children }) {
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
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

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
