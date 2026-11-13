// src/lib/storage.js
// Centralized browser LocalStorage and IndexedDB storage management

const STORAGE_PREFIX = "market_mode_db_";
const FILE_CACHE_PREFIX = "market_mode_file_";
const DB_VERSION = 1;
const IDB_NAME = "market_mode_files_db";
const IDB_STORE = "files";

// Memory fallback when localStorage is unavailable (e.g. during Node scripts / tests)
const memoryStore = new Map();

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

/**
 * Safe LocalStorage getItem with JSON parsing
 */
export function getItem(table, defaultValue = []) {
  const key = `${STORAGE_PREFIX}${table}`;
  try {
    if (isBrowser) {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === "") {
        return defaultValue;
      }
      return JSON.parse(raw);
    } else {
      if (memoryStore.has(key)) {
        return memoryStore.get(key);
      }
      return defaultValue;
    }
  } catch (err) {
    console.error(`Error reading from storage for table "${table}":`, err);
    return defaultValue;
  }
}

/**
 * Safe LocalStorage setItem with JSON serialization & quota error handling
 */
export function setItem(table, data) {
  const key = `${STORAGE_PREFIX}${table}`;
  try {
    const serialized = JSON.stringify(data);
    if (isBrowser) {
      localStorage.setItem(key, serialized);
      notifyStorageChange(table, "update", data);
    } else {
      memoryStore.set(key, JSON.parse(serialized));
    }
    return true;
  } catch (err) {
    if (err && (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      console.warn(`LocalStorage quota exceeded while saving table "${table}".`);
    } else {
      console.error(`Error saving to storage for table "${table}":`, err);
    }
    return false;
  }
}

/**
 * Get all items from a table (alias of getItem)
 */
export function getAllItems(table) {
  return getItem(table, []);
}

/**
 * Update a specific item in a table by ID or predicate function
 */
export function updateItem(table, idOrPredicate, updateDataOrFn) {
  const items = getItem(table, []);
  let updated = false;

  const newItems = items.map((item) => {
    const isMatch =
      typeof idOrPredicate === "function"
        ? idOrPredicate(item)
        : String(item.id) === String(idOrPredicate) ||
          (item.enquiry_number && String(item.enquiry_number) === String(idOrPredicate));

    if (isMatch) {
      updated = true;
      const changes =
        typeof updateDataOrFn === "function" ? updateDataOrFn(item) : updateDataOrFn;
      return { ...item, ...changes };
    }
    return item;
  });

  if (updated) {
    setItem(table, newItems);
  }
  return updated;
}

/**
 * Delete a specific item in a table by ID or predicate function
 */
export function deleteItem(table, idOrPredicate) {
  const items = getItem(table, []);
  const initialLength = items.length;

  const newItems = items.filter((item) => {
    const isMatch =
      typeof idOrPredicate === "function"
        ? idOrPredicate(item)
        : String(item.id) === String(idOrPredicate) ||
          (item.enquiry_number && String(item.enquiry_number) === String(idOrPredicate));
    return !isMatch;
  });

  if (newItems.length !== initialLength) {
    setItem(table, newItems);
    notifyStorageChange(table, "delete", { id: idOrPredicate });
    return true;
  }
  return false;
}

/**
 * Clear all tables managed by this storage prefix
 */
export function clearStorage() {
  if (isBrowser) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(STORAGE_PREFIX) || key.startsWith(FILE_CACHE_PREFIX))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } else {
    memoryStore.clear();
  }
}

/**
 * Initialize storage with default seed data if table is not already populated
 */
export function initializeStorage(seedDataMap = {}, force = false) {
  Object.entries(seedDataMap).forEach(([table, seedItems]) => {
    const existing = getItem(table, null);
    if (force || !existing || (Array.isArray(existing) && existing.length === 0)) {
      setItem(table, seedItems);
    }
  });
}

// ==========================================
// IndexedDB & Browser File Storage Service
// ==========================================

let idbPromise = null;

function getIndexedDB() {
  if (!isBrowser || typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }

  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (err) => {
        console.warn("IndexedDB open error:", err);
        resolve(null);
      };
    } catch (e) {
      console.warn("IndexedDB not supported or disabled:", e);
      resolve(null);
    }
  });

  return idbPromise;
}

/**
 * Convert File or Blob to Data URL
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (typeof file === "string") return resolve(file); // Already a Data URL or string URL
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Save file to IndexedDB and LocalStorage cache
 */
export async function saveFile(bucket, filePath, fileOrBlob) {
  const cleanPath = filePath.replace(/^\/+/, "");
  const fileId = `${bucket}/${cleanPath}`;
  const dataUrl = await fileToDataURL(fileOrBlob);

  const fileRecord = {
    id: fileId,
    bucket,
    path: cleanPath,
    dataUrl,
    name: fileOrBlob?.name || cleanPath.split("/").pop(),
    type: fileOrBlob?.type || "application/octet-stream",
    size: fileOrBlob?.size || dataUrl.length,
    updatedAt: new Date().toISOString(),
  };

  // 1. Try saving to IndexedDB
  try {
    const idb = await getIndexedDB();
    if (idb) {
      await new Promise((resolve, reject) => {
        const tx = idb.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(fileRecord);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
    }
  } catch (idbErr) {
    console.warn("IndexedDB save failed, falling back to LocalStorage:", idbErr);
  }

  // 2. Also keep in LocalStorage cache for instant synchronous retrieval
  try {
    if (isBrowser) {
      // If file is not too massive, store in LocalStorage for synchronous previews
      if (dataUrl.length < 2 * 1024 * 1024) {
        localStorage.setItem(`${FILE_CACHE_PREFIX}${fileId}`, dataUrl);
      }
    } else {
      memoryStore.set(`${FILE_CACHE_PREFIX}${fileId}`, dataUrl);
    }
  } catch (lsErr) {
    // Quota exceeded is normal for large files; IndexedDB handles persistence
  }

  return dataUrl;
}

/**
 * Retrieve file Data URL from IndexedDB or LocalStorage cache
 */
export async function getFile(bucket, filePath) {
  const cleanPath = filePath.replace(/^\/+/, "");
  const fileId = `${bucket}/${cleanPath}`;

  // Check LocalStorage cache first
  if (isBrowser) {
    const cached = localStorage.getItem(`${FILE_CACHE_PREFIX}${fileId}`);
    if (cached) return { dataUrl: cached, path: cleanPath };
  } else if (memoryStore.has(`${FILE_CACHE_PREFIX}${fileId}`)) {
    return { dataUrl: memoryStore.get(`${FILE_CACHE_PREFIX}${fileId}`), path: cleanPath };
  }

  // Check IndexedDB
  try {
    const idb = await getIndexedDB();
    if (idb) {
      const record = await new Promise((resolve) => {
        const tx = idb.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(fileId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (record) return record;
    }
  } catch (e) {
    console.warn("Error reading from IndexedDB:", e);
  }

  return null;
}

/**
 * Synchronous getFileUrl (checks LocalStorage cache or returns placeholder/path)
 */
export function getFileUrlSync(bucket, filePath) {
  const cleanPath = filePath.replace(/^\/+/, "");
  const fileId = `${bucket}/${cleanPath}`;
  if (isBrowser) {
    const cached = localStorage.getItem(`${FILE_CACHE_PREFIX}${fileId}`);
    if (cached) return cached;
  } else if (memoryStore.has(`${FILE_CACHE_PREFIX}${fileId}`)) {
    return memoryStore.get(`${FILE_CACHE_PREFIX}${fileId}`);
  }
  return cleanPath;
}

/**
 * Delete a file from IndexedDB and LocalStorage cache
 */
export async function deleteFile(bucket, filePath) {
  const cleanPath = filePath.replace(/^\/+/, "");
  const fileId = `${bucket}/${cleanPath}`;

  if (isBrowser) {
    localStorage.removeItem(`${FILE_CACHE_PREFIX}${fileId}`);
  } else {
    memoryStore.delete(`${FILE_CACHE_PREFIX}${fileId}`);
  }

  try {
    const idb = await getIndexedDB();
    if (idb) {
      const tx = idb.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(fileId);
    }
  } catch (e) {
    console.warn("Error deleting from IndexedDB:", e);
  }
}

// ==========================================
// Event Bus for Realtime Reactive State
// ==========================================

const listeners = new Set();

function notifyStorageChange(table, action, record) {
  const payload = { table, action, record, timestamp: Date.now() };

  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error("Storage subscriber error:", e);
    }
  });

  if (isBrowser && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(
      new CustomEvent("market_mode_db_change", { detail: payload })
    );
  }
}

export function subscribeToStorage(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

if (isBrowser) {
  window.addEventListener("storage", (event) => {
    if (event.key && event.key.startsWith(STORAGE_PREFIX)) {
      const table = event.key.slice(STORAGE_PREFIX.length);
      notifyStorageChange(table, "sync", null);
    }
  });
}

