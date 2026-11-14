import type { z } from "zod";
import { buildCacheKey } from "@/lib/audio/tts-cache";
import { splitTtsStudioText, ttsClipDraftSchema, type TtsClipRow } from "./tts-studio.schemas";

export function ttsStudioTextSummary(text: TtsClipRow["text"]) {
 const characterCount = Array.from(text).length;
 const estimatedDurationSeconds = Math.max(0, Math.round(characterCount / 4));
 return {
  characterCount,
  sentenceCount: splitTtsStudioText(text, "sentence").length,
  paragraphCount: splitTtsStudioText(text, "paragraph").length,
  estimatedDuration: `${Math.floor(estimatedDurationSeconds / 60)}:${String(
   estimatedDurationSeconds % 60,
  ).padStart(2, "0")}`,
 };
}

export function ttsActiveSegmentIndex(index: number, segmentCount: number) {
 return Math.min(index, Math.max(0, segmentCount - 1));
}

export function createTtsClipDraft(input: Omit<z.output<typeof ttsClipDraftSchema>, "cacheKey">) {
 const text = input.text.trim();
 return ttsClipDraftSchema.safeParse({
  ...input,
  title: input.title.trim(),
  text,
  cacheKey: buildCacheKey(text, input.voice, input.rate),
 });
}

export function ttsClipDownloadFilename(title: TtsClipRow["title"]) {
 return `${title.trim() || "hanzihome-tts"}.mp3`;
}
