const BASE_URL = "/api";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// LocalStorage Persistence Helpers for Offline / Local Preview Fallback
const STORAGE_KEYS = {
  MOODS: "daily_mood_entries_v2",
  SCHEDULES: "daily_schedules_v2",
  COURSES: "daily_courses_v2",
  TAGS: "daily_tags_v2",
  COPING: "daily_coping_v2",
  DUMPS: "daily_dumps_v2",
  USER: "daily_user_v2"
};

function getLocal(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("LocalStorage write error", e);
  }
}

// Seed initial default data for interactive preview if empty
if (!localStorage.getItem(STORAGE_KEYS.TAGS)) {
  setLocal(STORAGE_KEYS.TAGS, [
    { id: 1, nama: "Tasks Done" },
    { id: 2, nama: "Exam Stress" },
    { id: 3, nama: "Late Night Study" },
    { id: 4, nama: "Pop Quiz" },
    { id: 5, nama: "Hanging Out" },
    { id: 6, nama: "Workout / Exercise" }
  ]);
}

if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
  const today = new Date();
  const formatIso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  setLocal(STORAGE_KEYS.SCHEDULES, [
    { id: 101, judul: "AI Practicum Report", jenis: "tugas", tanggal: formatIso(1) },
    { id: 102, judul: "Web Development Midterm", jenis: "uts", tanggal: formatIso(3) },
    { id: 103, judul: "Database Group Presentation", jenis: "presentasi", tanggal: formatIso(5) },
    { id: 104, judul: "Computer Networks Final Exam", jenis: "uas", tanggal: formatIso(12) }
  ]);
}

if (!localStorage.getItem(STORAGE_KEYS.COPING)) {
  setLocal(STORAGE_KEYS.COPING, [
    { id: 201, namaStrategi: "4-7-8 Breathing Technique", deskripsi: "Inhale for 4 seconds, hold for 7 seconds, exhale slowly for 8 seconds." },
    { id: 202, namaStrategi: "10-Minute Walk", deskripsi: "Step away from your study desk to get some fresh air and clear your thoughts." },
    { id: 203, namaStrategi: "Pomodoro Focus (25/5)", deskripsi: "Focus on your tasks for 25 minutes, then take a 5-minute restorative break." }
  ]);
}

if (!localStorage.getItem(STORAGE_KEYS.MOODS)) {
  const today = new Date();
  const formatIso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  setLocal(STORAGE_KEYS.MOODS, [
    {
      id: 301,
      moodScore: 4,
      catatan: "Finished database presentation smoothly!",
      waktu: "01:30 PM",
      tanggal: formatIso(0),
      createdAt: new Date().toISOString(),
      tags: [{ tag: { id: 1, nama: "Tasks Done" } }]
    },
    {
      id: 302,
      moodScore: 2,
      catatan: "Quite anxious preparing for tomorrow's midterm exam",
      waktu: "08:15 PM",
      tanggal: formatIso(1),
      createdAt: new Date().toISOString(),
      tags: [{ tag: { id: 2, nama: "Exam Stress" } }, { tag: { id: 3, nama: "Late Night Study" } }]
    },
    {
      id: 303,
      moodScore: 5,
      catatan: "Played games with classmates, feeling refreshed and relieved",
      waktu: "09:45 PM",
      tanggal: formatIso(2),
      createdAt: new Date().toISOString(),
      tags: [{ tag: { id: 5, nama: "Hanging Out" } }]
    }
  ]);
}

if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
  setLocal(STORAGE_KEYS.COURSES, [
    {
      id: 1,
      mataKuliah: "Software Engineering",
      dosen: "Prof. Alan Turing",
      hari: "Monday",
      jamMulai: "08:00",
      jamSelesai: "10:30",
      ruangan: "Room 304 (Lab A)",
      sks: 3,
      warna: "#00ADB5",
      link: "https://classroom.google.com",
      attendance: { present: 10, absent: 1, excused: 1, target: 16 }
    },
    {
      id: 2,
      mataKuliah: "Artificial Intelligence",
      dosen: "Dr. Sarah Jenkins",
      hari: "Tuesday",
      jamMulai: "10:45",
      jamSelesai: "13:15",
      ruangan: "Lab AI (Building B)",
      sks: 3,
      warna: "#10b981",
      link: "https://meet.google.com",
      attendance: { present: 11, absent: 0, excused: 1, target: 16 }
    },
    {
      id: 3,
      mataKuliah: "Database Management Systems",
      dosen: "Prof. Michael Chen",
      hari: "Wednesday",
      jamMulai: "08:00",
      jamSelesai: "10:30",
      ruangan: "Room 205",
      sks: 3,
      warna: "#f59e0b",
      link: "https://zoom.us",
      attendance: { present: 8, absent: 3, excused: 1, target: 16 }
    },
    {
      id: 4,
      mataKuliah: "Web Application Development",
      dosen: "Dr. Emily Watson",
      hari: "Thursday",
      jamMulai: "13:30",
      jamSelesai: "16:00",
      ruangan: "Multimedia Lab",
      sks: 4,
      warna: "#8b5cf6",
      link: "https://github.com",
      attendance: { present: 12, absent: 0, excused: 0, target: 16 }
    },
    {
      id: 5,
      mataKuliah: "Human-Computer Interaction",
      dosen: "Prof. Robert Davis",
      hari: "Friday",
      jamMulai: "09:00",
      jamSelesai: "11:30",
      ruangan: "Room 401",
      sks: 2,
      warna: "#ec4899",
      link: "",
      attendance: { present: 9, absent: 2, excused: 0, target: 16 }
    }
  ]);
}

// API Functions
export async function registerUser(nama, email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, email, password })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for register");
  }

  // Local fallback
  const user = { id: Date.now(), nama, email, pinLock: null };
  const token = "mock-jwt-token-" + Date.now();
  localStorage.setItem("token", token);
  setLocal(STORAGE_KEYS.USER, user);
  return { token, user };
}

export async function loginUser(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for login");
  }

  // Local fallback
  const storedUser = getLocal(STORAGE_KEYS.USER, { id: 1, nama: "Student", email, pinLock: null });
  const token = "mock-jwt-token-" + Date.now();
  localStorage.setItem("token", token);
  return { token, user: storedUser };
}

export async function getMoodHistory() {
  try {
    const res = await fetch(`${BASE_URL}/mood`, { headers: authHeader() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for getMoodHistory");
  }
  return getLocal(STORAGE_KEYS.MOODS, []);
}

export async function submitMood(data) {
  try {
    const res = await fetch(`${BASE_URL}/mood`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for submitMood");
  }

  const currentTags = getLocal(STORAGE_KEYS.TAGS, []);
  const selectedTagObjs = (data.tagIds || [])
    .map(id => currentTags.find(t => t.id === id))
    .filter(Boolean)
    .map(tag => ({ tag }));

  const newEntry = {
    id: Date.now(),
    moodScore: Number(data.moodScore),
    catatan: data.catatan || "",
    voiceNotePath: data.voiceNotePath || null,
    photoUrl: data.photoUrl || null,
    waktu: data.waktu || "08:00 AM",
    tanggal: data.tanggal ? new Date(data.tanggal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    tags: selectedTagObjs
  };

  const list = getLocal(STORAGE_KEYS.MOODS, []);
  list.unshift(newEntry);
  setLocal(STORAGE_KEYS.MOODS, list);
  return newEntry;
}

export async function deleteMood(id) {
  try {
    const res = await fetch(`${BASE_URL}/mood/${id}`, {
      method: "DELETE",
      headers: authHeader()
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for deleteMood");
  }

  const list = getLocal(STORAGE_KEYS.MOODS, []).filter(m => m.id !== id);
  setLocal(STORAGE_KEYS.MOODS, list);
  return { success: true };
}

export async function getSchedules() {
  try {
    const res = await fetch(`${BASE_URL}/schedule`, { headers: authHeader() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for getSchedules");
  }
  return getLocal(STORAGE_KEYS.SCHEDULES, []);
}

export async function submitSchedule(data) {
  try {
    const res = await fetch(`${BASE_URL}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for submitSchedule");
  }

  const newSched = {
    id: Date.now(),
    judul: data.judul,
    jenis: data.jenis,
    tanggal: data.tanggal
  };
  const list = getLocal(STORAGE_KEYS.SCHEDULES, []);
  list.push(newSched);
  setLocal(STORAGE_KEYS.SCHEDULES, list);
  return newSched;
}

export async function deleteSchedule(id) {
  try {
    const res = await fetch(`${BASE_URL}/schedule/${id}`, {
      method: "DELETE",
      headers: authHeader()
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for deleteSchedule");
  }

  const list = getLocal(STORAGE_KEYS.SCHEDULES, []).filter(s => s.id !== id);
  setLocal(STORAGE_KEYS.SCHEDULES, list);
  return { success: true };
}

// Academic Courses (Jadwal Kuliah) API
export async function getAcademicCourses() {
  try {
    const res = await fetch(`${BASE_URL}/academic-courses`, { headers: authHeader() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for getAcademicCourses");
  }
  return getLocal(STORAGE_KEYS.COURSES, []);
}

export async function submitAcademicCourse(data) {
  try {
    const res = await fetch(`${BASE_URL}/academic-courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for submitAcademicCourse");
  }

  const newCourse = {
    id: Date.now(),
    mataKuliah: data.mataKuliah,
    dosen: data.dosen || "Lecturer",
    hari: data.hari || "Monday",
    jamMulai: data.jamMulai || "08:00",
    jamSelesai: data.jamSelesai || "10:00",
    ruangan: data.ruangan || "Room 101",
    sks: Number(data.sks) || 3,
    warna: data.warna || "#00ADB5",
    link: data.link || "",
    attendance: data.attendance || { present: 0, absent: 0, excused: 0, target: 16 }
  };
  const list = getLocal(STORAGE_KEYS.COURSES, []);
  list.push(newCourse);
  setLocal(STORAGE_KEYS.COURSES, list);
  return newCourse;
}

export async function updateAcademicCourse(id, data) {
  try {
    const res = await fetch(`${BASE_URL}/academic-courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for updateAcademicCourse");
  }

  const list = getLocal(STORAGE_KEYS.COURSES, []);
  const index = list.findIndex(c => c.id === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...data,
      sks: data.sks !== undefined ? Number(data.sks) : list[index].sks,
      attendance: data.attendance !== undefined ? data.attendance : (list[index].attendance || { present: 0, absent: 0, excused: 0, target: 16 })
    };
    setLocal(STORAGE_KEYS.COURSES, list);
    return list[index];
  }
  return null;
}

export async function deleteAcademicCourse(id) {
  try {
    const res = await fetch(`${BASE_URL}/academic-courses/${id}`, {
      method: "DELETE",
      headers: authHeader()
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for deleteAcademicCourse");
  }

  const list = getLocal(STORAGE_KEYS.COURSES, []).filter(c => c.id !== id);
  setLocal(STORAGE_KEYS.COURSES, list);
  return { success: true };
}

export async function getTags() {
  try {
    const res = await fetch(`${BASE_URL}/tags`, { headers: authHeader() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for getTags");
  }
  return getLocal(STORAGE_KEYS.TAGS, []);
}

export async function addTag(nama) {
  try {
    const res = await fetch(`${BASE_URL}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ nama })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for addTag");
  }

  const newTag = { id: Date.now(), nama };
  const list = getLocal(STORAGE_KEYS.TAGS, []);
  list.push(newTag);
  setLocal(STORAGE_KEYS.TAGS, list);
  return newTag;
}

export async function getCopingStrategies() {
  try {
    const res = await fetch(`${BASE_URL}/coping`, { headers: authHeader() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for getCopingStrategies");
  }
  return getLocal(STORAGE_KEYS.COPING, []);
}

export async function addCopingStrategy(namaStrategi, deskripsi) {
  try {
    const res = await fetch(`${BASE_URL}/coping`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ namaStrategi, deskripsi })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for addCopingStrategy");
  }

  const newCoping = { id: Date.now(), namaStrategi, deskripsi };
  const list = getLocal(STORAGE_KEYS.COPING, []);
  list.push(newCoping);
  setLocal(STORAGE_KEYS.COPING, list);
  return newCoping;
}

export async function getBrainDumps() {
  try {
    const res = await fetch(`${BASE_URL}/braindump`, { headers: authHeader() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for getBrainDumps");
  }
  return getLocal(STORAGE_KEYS.DUMPS, []);
}

export async function addBrainDump(isi) {
  try {
    const res = await fetch(`${BASE_URL}/braindump`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ isi })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline fallback for addBrainDump");
  }

  const newDump = { id: Date.now(), isi, createdAt: new Date().toISOString() };
  const list = getLocal(STORAGE_KEYS.DUMPS, []);
  list.unshift(newDump);
  setLocal(STORAGE_KEYS.DUMPS, list);
  return newDump;
}
