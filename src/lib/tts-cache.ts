/**
 * IndexedDB-based audio cache for TTS.
 * Stores audio blobs keyed by text + voice to avoid redundant API calls.
 */

const DB_NAME = "tts-audio-cache";
const STORE_NAME = "audio";
const DB_VERSION = 1;
const MAX_ENTRIES = 500;

function openDb(): Promise<IDBDatabase> {
 return new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
   const db = request.result;
   if (!db.objectStoreNames.contains(STORE_NAME)) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
    store.createIndex("createdAt", "createdAt");
   }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
 });
}

export function buildCacheKey(text: string, voice?: string): string {
 return `${voice || "default"}::${text}`;
}

export async function getCachedAudio(key: string): Promise<Blob | null> {
 try {
  const db = await openDb();
  return new Promise((resolve) => {
   const tx = db.transaction(STORE_NAME, "readonly");
   const store = tx.objectStore(STORE_NAME);
   const request = store.get(key);
   request.onsuccess = () => {
    const result = request.result as
     | { key: string; blob: Blob; createdAt: number }
     | undefined;
    resolve(result?.blob ?? null);
   };
   request.onerror = () => resolve(null);
  });
 } catch {
  return null;
 }
}

export async function setCachedAudio(key: string, blob: Blob): Promise<void> {
 try {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put({ key, blob, createdAt: Date.now() });

  // Evict oldest entries if over limit
  const countReq = store.count();
  countReq.onsuccess = () => {
   if (countReq.result > MAX_ENTRIES) {
    const idx = store.index("createdAt");
    const cursor = idx.openCursor();
    let deleted = 0;
    const toDelete = countReq.result - MAX_ENTRIES;
    cursor.onsuccess = () => {
     const cur = cursor.result;
     if (cur && deleted < toDelete) {
      cur.delete();
      deleted++;
      cur.continue();
     }
    };
   }
  };
 } catch {
  // Caching is best-effort
 }
}
