const BASE_URL = "/api";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// LocalStorage Persistence Helpers
const STORAGE_KEYS = {
  MOODS: "daily_mood_entries_v3",
  SCHEDULES: "daily_schedules_v3",
  COURSES: "daily_courses_v3",
  TAGS: "daily_tags_v3",
  COPING: "daily_coping_v3",
  DUMPS: "daily_dumps_v3",
  USER: "daily_user_v3"
};

// Purge legacy mock data
try {
  [
    'daily_mood_entries_v2',
    'daily_schedules_v2',
    'daily_courses_v2',
    'daily_tags_v2',
    'daily_coping_v2',
    'daily_dumps_v2',
    'daily_user_v2',
    'daily_user_info'
  ].forEach(k => localStorage.removeItem(k));
} catch (e) {}

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

// API Functions
export async function registerUser(username, password, nama) {
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, nama: nama || username })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("daily_user_info", JSON.stringify(data.user));
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Pendaftaran gagal");
    }
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') {
      throw e;
    }
    // Offline local fallback if server unreachable
    console.warn("Using offline fallback for register");
    const cleanUsername = String(username).trim().toLowerCase();
    const user = { id: Date.now(), username: cleanUsername, nama: nama || cleanUsername, pinLock: null };
    const token = "mock-jwt-token-" + Date.now();
    localStorage.setItem("token", token);
    localStorage.setItem("daily_user_info", JSON.stringify(user));
    setLocal(STORAGE_KEYS.USER, user);
    return { token, user };
  }
}

export async function loginUser(username, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("daily_user_info", JSON.stringify(data.user));
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Username atau password salah");
    }
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') {
      throw e;
    }
    // Offline local fallback if server unreachable
    console.warn("Using offline fallback for login");
    const cleanUsername = String(username).trim().toLowerCase();
    const storedUser = getLocal(STORAGE_KEYS.USER, null);
    if (!storedUser || (storedUser.username !== cleanUsername && storedUser.email !== cleanUsername)) {
      throw new Error("Username atau password salah");
    }
    const token = "mock-jwt-token-" + Date.now();
    localStorage.setItem("token", token);
    localStorage.setItem("daily_user_info", JSON.stringify(storedUser));
    return { token, user: storedUser };
  }
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("daily_user_info");
  localStorage.removeItem(STORAGE_KEYS.USER);
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
