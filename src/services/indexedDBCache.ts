const DB_NAME = "NatureRiskCache";
const DB_VERSION = 1;
const STORE_NAME = "files";

interface CacheEntry {
  key: string;
  data: ArrayBuffer | string;
  type: "json" | "blob";
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

export async function getCachedJSON<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry: CacheEntry | undefined = req.result;
        if (entry && entry.type === "json") {
          resolve(typeof entry.data === "string" ? JSON.parse(entry.data) : entry.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedJSON(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: CacheEntry = {
        key,
        data: JSON.stringify(data),
        type: "json",
        timestamp: Date.now(),
      };
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // silently fail — cache is best-effort
  }
}

export async function getCachedBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry: CacheEntry | undefined = req.result;
        if (entry && entry.type === "blob" && entry.data instanceof ArrayBuffer) {
          resolve(new Blob([entry.data]));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    // Close existing connection first
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
      dbPromise = null;
    }
    // Delete the entire database
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  } catch {
    // silently fail
  }
}

export async function setCachedBlob(key: string, blob: Blob): Promise<void> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: CacheEntry = {
        key,
        data: arrayBuffer,
        type: "blob",
        timestamp: Date.now(),
      };
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // silently fail
  }
}
