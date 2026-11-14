import { buildCacheKey, getCachedAudio, setCachedAudio } from "@/lib/audio/tts-cache";
import { TTS_AUTH_ERROR_MESSAGE } from "./tts-contract";

/** Reads synthesized audio from the cache, or requests it from `/api/tts` and caches it. */
export async function loadTTSAudio(
 text: string,
 voiceName: string,
 synthesisRate: number,
 controller: AbortController,
): Promise<Blob> {
 const cacheKey = buildCacheKey(text, voiceName, synthesisRate);
 const cached = await getCachedAudio(cacheKey);
 if (controller.signal.aborted) throw new Error("TTS preparation cancelled");
 if (cached) return cached;
 const response = await fetch("/api/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text, voice: voiceName, rate: synthesisRate }),
  signal: controller.signal,
 });
 if (response.status === 401) throw new Error(TTS_AUTH_ERROR_MESSAGE);
 if (!response.ok) throw new Error(`TTS API ${response.status}`);
 const blob = await response.blob();
 if (controller.signal.aborted) throw new Error("TTS preparation cancelled");
 void setCachedAudio(cacheKey, blob);
 return blob;
}
