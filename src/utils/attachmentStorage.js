/**
 * Reliable IndexedDB storage for file attachments (PDF, PPT, Word, Excel, Images).
 * Avoids localStorage 5MB quota exhaustion and network payload limits by storing
 * heavy file binary/base64 in browser IndexedDB while keeping lightweight metadata
 * in the database/localStorage.
 */

const DB_NAME = 'DailyAttachmentsDB';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

let dbPromise = null;
const memoryFallback = new Map();

function openDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onerror = (err) => {
        console.warn('IndexedDB open error:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB initialization failed:', e);
      resolve(null);
    }
  });

  return dbPromise;
}

export async function saveAttachmentData(id, data) {
  if (!id || !data) return false;
  memoryFallback.set(id, data);

  const db = await openDB();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, data, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      console.warn('Failed to save attachment to IndexedDB:', e);
      resolve(false);
    }
  });
}

export async function getAttachmentData(id) {
  if (!id) return null;
  if (memoryFallback.has(id)) {
    return memoryFallback.get(id);
  }

  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result?.data || null;
        if (result) memoryFallback.set(id, result);
        resolve(result);
      };
      req.onerror = () => resolve(null);
    } catch (e) {
      console.warn('Failed to read attachment from IndexedDB:', e);
      resolve(null);
    }
  });
}

export async function deleteAttachmentData(id) {
  if (!id) return false;
  memoryFallback.delete(id);

  const db = await openDB();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Detect if current device is a mobile device / handphone
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  return mobileRegex.test(ua) || (isTouch && window.innerWidth < 768);
}

/**
 * Convert base64 data URL to Blob with accurate mime type
 */
export function base64ToBlob(dataUrl, defaultMime = 'application/octet-stream') {
  if (!dataUrl) return null;
  try {
    const parts = dataUrl.split(',');
    const header = parts[0] || '';
    const base64Data = parts[1] || parts[0];
    const mimeMatch = header.match(/:(.*?);/);
    const mime = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : defaultMime;

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: mime });
  } catch (err) {
    console.error('base64ToBlob error:', err);
    return null;
  }
}

/**
 * Open or download an attachment:
 * - Laptop / Desktop: Opens PDF / images directly in the browser's default viewer tab.
 * - Smartphone / Handphone: Native handling (tergantung bawaan HP / app PDF bawaan / unduh bawaan).
 * - forceDownload: true will force downloading to disk.
 */
export async function openOrDownloadAttachment(att, options = {}) {
  const { forceDownload = false } = options;

  if (att.link) {
    window.open(att.link, '_blank', 'noopener,noreferrer');
    return { success: true, message: 'Membuka tautan...' };
  }

  let fileData = att.data;
  if (!fileData && att.hasData) {
    fileData = await getAttachmentData(att.id);
  }

  if (!fileData) {
    return { success: false, message: 'Berkas tidak ditemukan atau belum tersimpan.' };
  }

  const ext = (att.ext || att.name?.split('.').pop() || '').toLowerCase();
  const isPDF = att.type === 'pdf' || ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isMobile = isMobileDevice();

  let mime = 'application/octet-stream';
  if (isPDF) mime = 'application/pdf';
  else if (['doc', 'docx'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (['ppt', 'pptx'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  else if (['xls', 'xlsx'].includes(ext)) mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  else if (isImage) mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const blob = base64ToBlob(fileData, mime);
  if (!blob) {
    return { success: false, message: 'Gagal membaca isi berkas.' };
  }

  const blobUrl = URL.createObjectURL(blob);
  const fileName = att.name || `Berkas_${Date.now()}.${ext || 'bin'}`;

  // If user explicitly pressed "Unduh"
  if (forceDownload) {
    const linkEl = document.createElement('a');
    linkEl.href = blobUrl;
    linkEl.download = fileName;
    document.body.appendChild(linkEl);
    linkEl.click();
    setTimeout(() => {
      document.body.removeChild(linkEl);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
    return { success: true, message: `Mengunduh ${fileName}` };
  }

  // On Mobile / Handphone:
  // "untuk handphone tergantung bawaan" (biarkan browser & sistem HP menangani sesuai bawaan)
  if (isMobile) {
    const linkEl = document.createElement('a');
    linkEl.href = blobUrl;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener,noreferrer';
    document.body.appendChild(linkEl);
    linkEl.click();
    setTimeout(() => {
      document.body.removeChild(linkEl);
      URL.revokeObjectURL(blobUrl);
    }, 15000);
    return { success: true, message: `Membuka ${fileName} sesuai pengaturan HP` };
  }

  // On Laptop / Desktop PC:
  // "untuk laptop langsung terbuka di browser default"
  if (isPDF || isImage) {
    const newTab = window.open(blobUrl, '_blank');
    if (!newTab) {
      // Fallback if popup blocker intercepted window.open
      const linkEl = document.createElement('a');
      linkEl.href = blobUrl;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener,noreferrer';
      document.body.appendChild(linkEl);
      linkEl.click();
      setTimeout(() => {
        document.body.removeChild(linkEl);
        URL.revokeObjectURL(blobUrl);
      }, 15000);
    } else {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000); // Allow tab to finish rendering
    }
    return { success: true, message: `Membuka ${fileName} di browser` };
  }

  // Office documents on laptop (Word, PowerPoint, Excel cannot be natively viewed in standard browser tabs without plugins)
  const linkEl = document.createElement('a');
  linkEl.href = blobUrl;
  linkEl.download = fileName;
  document.body.appendChild(linkEl);
  linkEl.click();
  setTimeout(() => {
    document.body.removeChild(linkEl);
    URL.revokeObjectURL(blobUrl);
  }, 2000);
  return { success: true, message: `Mengunduh/membuka berkas: ${fileName}` };
}

