import { expect, it } from "vitest";
import { buildCacheKey } from "@/lib/audio/tts-cache";
import {
 createTtsClipDraft,
 ttsActiveSegmentIndex,
 ttsClipDownloadFilename,
 ttsStudioTextSummary,
} from "./tts-studio-utils";

it("counts Unicode characters and segments without trimming the character total", () => {
 expect(ttsStudioTextSummary("𠮷。\n你好！")).toEqual({
  characterCount: 6,
  sentenceCount: 2,
  paragraphCount: 2,
  estimatedDuration: "0:02",
 });
 expect(ttsStudioTextSummary("")).toEqual({
  characterCount: 0,
  sentenceCount: 0,
  paragraphCount: 0,
  estimatedDuration: "0:00",
 });
 expect(ttsStudioTextSummary("你".repeat(240)).estimatedDuration).toBe("1:00");
});

it("builds the trimmed clip and its canonical cache identity and rejects invalid settings", () => {
 const input: Parameters<typeof createTtsClipDraft>[0] = {
  folderId: null,
  title: "  Lesson  ",
  text: "  你好。  ",
  voice: "zh-CN-XiaoxiaoNeural",
  rate: 1.25,
 };
 const result = createTtsClipDraft(input);
 expect(result.success).toBe(true);
 if (!result.success) throw new Error("Expected valid clip");
 expect(result.data).toEqual({
  ...input,
  title: "Lesson",
  text: "你好。",
  cacheKey: buildCacheKey("你好。", input.voice, 1.25),
 });
 expect(createTtsClipDraft({ ...input, rate: 0 }).success).toBe(false);
 expect(createTtsClipDraft({ ...input, rate: 3.1 }).success).toBe(false);
 expect(createTtsClipDraft({ ...input, text: "  " }).success).toBe(false);
 expect(createTtsClipDraft({ ...input, folderId: "invalid" }).success).toBe(false);
});

it("keeps selection valid after a shorter or empty source and retains download naming", () => {
 expect(ttsActiveSegmentIndex(4, 2)).toBe(1);
 expect(ttsActiveSegmentIndex(4, 0)).toBe(0);
 expect(ttsActiveSegmentIndex(0, 2)).toBe(0);
 expect(ttsClipDownloadFilename("  Lesson  ")).toBe("Lesson.mp3");
 expect(ttsClipDownloadFilename("  ")).toBe("hanzihome-tts.mp3");
});
