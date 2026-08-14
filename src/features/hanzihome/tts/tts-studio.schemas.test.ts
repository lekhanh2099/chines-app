import { describe, expect, it } from "vitest";

import { buildCacheKey } from "@/lib/tts-cache";
import { ttsClipDraftSchema } from "./tts-studio.schemas";

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
});
