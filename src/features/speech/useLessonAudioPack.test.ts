import { afterEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({ stored: new Map<string, Blob>() }));
vi.mock("@/lib/audio/tts-cache", async (importOriginal) => ({
 ...(await importOriginal<typeof import("@/lib/audio/tts-cache")>()),
 getCachedAudio: async (key: string) => cache.stored.get(key) ?? null,
 setCachedAudio: async (key: string, blob: Blob) => {
  cache.stored.set(key, blob);
 },
}));

import { fetchMandarinAudioBlob } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { DEFAULT_MANDARIN_VOICE } from "@/hooks/useTTS";
import { extractLessonMandarinTexts, lessonAudioPackEntries } from "./useLessonAudioPack";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

describe("useLessonAudioPack", () => {
 const lesson = getTextbookLesson("nhip-cau", 4);
 if (!lesson) throw new Error("Lesson 4 not found");

 it("extracts unique Mandarin texts from vocab and dictation sentences", () => {
  const texts = extractLessonMandarinTexts(lesson);
  expect(texts.length).toBeGreaterThan(50);
  // Contains vocabulary words
  expect(texts).toContain("醉");
  // Contains sentences from lesson text
  expect(texts.some((t) => t.includes("春夜"))).toBe(true);
 });

 it("handles null or undefined lesson gracefully", () => {
  expect(extractLessonMandarinTexts(null)).toEqual([]);
  expect(extractLessonMandarinTexts(undefined)).toEqual([]);
 });
 describe("cache keys", () => {
  afterEach(() => {
   cache.stored.clear();
   vi.unstubAllGlobals();
  });

  it("checks the same key the audio writer stores, for every text of a real lesson", async () => {
   vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(new Blob(["audio"], { type: "audio/mpeg" }))),
   );
   const texts = extractLessonMandarinTexts(lesson);
   const entries = lessonAudioPackEntries(texts, DEFAULT_MANDARIN_VOICE);

   for (const entry of entries) {
    await fetchMandarinAudioBlob(entry.text, DEFAULT_MANDARIN_VOICE, 1.0);
   }
   // Let fire-and-forget cache writes settle.
   await Promise.resolve();

   const missing = entries.filter((entry) => !cache.stored.has(entry.cacheKey));
   expect(entries.length).toBeGreaterThan(50);
   expect(missing).toEqual([]);
  });
 });
});
