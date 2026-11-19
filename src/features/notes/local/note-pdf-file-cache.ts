"use client";

/**
 * Device copy of note PDFs in Cache Storage, keyed by attachment id. An
 * attachment is immutable (a new PDF gets a new id), so a cached copy never
 * goes stale. Storage can be unavailable (private mode, quota, previews): every
 * call degrades to "not cached" instead of failing the viewer.
 */
const CACHE_NAME = "hanzihome-note-pdfs-v1";

function cacheKey(ownerUserId: string, attachmentId: string) {
 return `/__note-pdf-cache/${ownerUserId}/${attachmentId}.pdf`;
}

function cacheAvailable() {
 return typeof window !== "undefined" && "caches" in window;
}

/** The cached file as a Blob, or undefined when this device has no copy. */
export async function readCachedNotePdf(ownerUserId: string, attachmentId: string) {
 if (!cacheAvailable()) return undefined;
 try {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(cacheKey(ownerUserId, attachmentId));
  return await response?.blob();
 } catch {
  return undefined;
 }
}

export async function writeCachedNotePdf(
 ownerUserId: string,
 attachmentId: string,
 file: Blob,
): Promise<void> {
 if (!cacheAvailable()) return;
 try {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
   cacheKey(ownerUserId, attachmentId),
   new Response(file, { headers: { "Content-Type": "application/pdf" } }),
  );
 } catch {
  // A missing device copy only means the next open downloads the file again.
 }
}

export async function deleteCachedNotePdf(ownerUserId: string, attachmentId: string) {
 if (!cacheAvailable()) return;
 try {
  const cache = await caches.open(CACHE_NAME);
  await cache.delete(cacheKey(ownerUserId, attachmentId));
 } catch {
  // Nothing to clean up when Cache Storage is unavailable.
 }
}
