import { describe, expect, it } from "vitest";

import { buildCacheKey } from "@/lib/tts-cache";
import { splitTtsStudioText, ttsClipDraftSchema, ttsClipRowSchema } from "./tts-studio.schemas";

describe("HanziHome TTS Studio contracts", () => {
 it("uses the existing text/voice/rate cache contract for new clips", () => {
  const text = "你好，世界。";
  const voice = "zh-CN-XiaoxiaoNeural";
  const rate = 1;
  expect(
   ttsClipDraftSchema.safeParse({
    folderId: null,
    title: "Greeting",
    text,
    voice,
    rate,
    cacheKey: buildCacheKey(text, voice, rate),
   }).success,
  ).toBe(true);
  expect(
   ttsClipDraftSchema.safeParse({
    folderId: null,
    title: "Greeting",
    text,
    voice,
    rate,
    cacheKey: buildCacheKey(text, voice, 1.25),
   }).success,
  ).toBe(false);
 });

 it("keeps sentence and paragraph segmentation deterministic", () => {
  const text = "你好。\n\n世界！下一句？";
  expect(splitTtsStudioText(text, "paragraph")).toEqual(["你好。", "世界！下一句？"]);
  expect(splitTtsStudioText(text, "sentence")).toEqual(["你好。", "世界！", "下一句？"]);
  expect(splitTtsStudioText("第一段。\n第二段。", "paragraph")).toEqual(["第一段。", "第二段。"]);
 });

 it("keeps the optimistic-concurrency revision in the persisted clip contract", () => {
  const row = ttsClipRowSchema.safeParse({
   id: "00000000-0000-4000-8000-000000000001",
   user_id: "00000000-0000-4000-8000-000000000002",
   folder_id: null,
   title: "Greeting",
   text: "你好。",
   voice: "zh-CN-XiaoxiaoNeural",
   rate: 1,
   cache_key: buildCacheKey("你好。", "zh-CN-XiaoxiaoNeural", 1),
   revision: 0,
   created_at: "2026-08-14T00:00:00.000Z",
   updated_at: "2026-08-14T00:00:00.000Z",
  });

  expect(row.success).toBe(true);
 });
});
