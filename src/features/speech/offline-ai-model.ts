"use client";

/**
 * Offline AI TTS Model Manager (Hugging Face VITS Chinese).
 * Manages caching and on-demand download of model assets in browser CacheStorage.
 */

const CACHE_NAME = "huggingface-offline-tts-v1";

export type AiModelFileDescriptor = {
 readonly name: string;
 readonly url: string;
 readonly approximateBytes: number;
};

export const AI_MODEL_FILES: readonly AiModelFileDescriptor[] = [
 {
  name: "model.onnx",
  url: "https://huggingface.co/csukuangfj/vits-zh-aishell3/resolve/main/vits-aishell3.onnx",
  approximateBytes: 42_000_000,
 },
 {
  name: "tokens.txt",
  url: "https://huggingface.co/csukuangfj/vits-zh-aishell3/resolve/main/tokens.txt",
  approximateBytes: 120_000,
 },
 {
  name: "lexicon.txt",
  url: "https://huggingface.co/csukuangfj/vits-zh-aishell3/resolve/main/lexicon.txt",
  approximateBytes: 850_000,
 },
];

export const TOTAL_APPROXIMATE_MODEL_BYTES = AI_MODEL_FILES.reduce(
 (sum, file) => sum + file.approximateBytes,
 0,
);

export type AiModelStatus = "not_downloaded" | "downloading" | "ready" | "error";

export async function checkAiModelReady(): Promise<boolean> {
 if (typeof window === "undefined" || !("caches" in window)) {
  return false;
 }

 try {
  const cache = await window.caches.open(CACHE_NAME);
  for (const file of AI_MODEL_FILES) {
   const match = await cache.match(file.url);
   if (!match) {
    return false;
   }
  }
  return true;
 } catch {
  return false;
 }
}

export async function getAiModelStorageEstimate(): Promise<{
 isReady: boolean;
 sizeBytes: number;
}> {
 if (typeof window === "undefined" || !("caches" in window)) {
  return { isReady: false, sizeBytes: 0 };
 }

 try {
  const cache = await window.caches.open(CACHE_NAME);
  let totalSize = 0;
  let allFound = true;

  for (const file of AI_MODEL_FILES) {
   const match = await cache.match(file.url);
   if (match) {
    const blob = await match.blob();
    totalSize += blob.size;
   } else {
    allFound = false;
   }
  }

  return {
   isReady: allFound,
   sizeBytes: totalSize,
  };
 } catch {
  return { isReady: false, sizeBytes: 0 };
 }
}

export async function downloadAiModel(
 onProgress?: (receivedBytes: number, totalBytes: number, percent: number) => void,
 signal?: AbortSignal,
): Promise<boolean> {
 if (typeof window === "undefined" || !("caches" in window)) {
  return false;
 }

 try {
  const cache = await window.caches.open(CACHE_NAME);
  let accumulatedBytes = 0;

  for (const file of AI_MODEL_FILES) {
   const existing = await cache.match(file.url);
   if (existing) {
    accumulatedBytes += file.approximateBytes;
    const pct = Math.min(100, Math.round((accumulatedBytes / TOTAL_APPROXIMATE_MODEL_BYTES) * 100));
    onProgress?.(accumulatedBytes, TOTAL_APPROXIMATE_MODEL_BYTES, pct);
    continue;
   }

   const response = await fetch(file.url, { signal, mode: "cors" });
   if (!response.ok) {
    return false;
   }

   await cache.put(file.url, response.clone());
   accumulatedBytes += file.approximateBytes;
   const pct = Math.min(100, Math.round((accumulatedBytes / TOTAL_APPROXIMATE_MODEL_BYTES) * 100));
   onProgress?.(accumulatedBytes, TOTAL_APPROXIMATE_MODEL_BYTES, pct);
  }

  return true;
 } catch {
  return false;
 }
}

export async function deleteAiModel(): Promise<void> {
 if (typeof window === "undefined" || !("caches" in window)) {
  return;
 }

 try {
  await window.caches.delete(CACHE_NAME);
 } catch {
  // Best-effort cleanup
 }
}
