import { describe, expect, it } from "vitest";

import { buildCacheKey } from "@/lib/tts-cache";
import { splitTtsStudioText, ttsClipDraftSchema } from "./tts-studio.schemas";

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
 });
});
