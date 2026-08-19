import { describe, expect, it } from "vitest";

import { buildCacheKey } from "./tts-cache";

describe("buildCacheKey", () => {
 it("separates cached audio by text, voice, and rate", () => {
  expect(buildCacheKey("你好", "zh-CN-XiaoxiaoNeural", 1)).not.toBe(
   buildCacheKey("你好", "zh-CN-XiaoxiaoNeural", 0.9),
  );
  expect(buildCacheKey("你好", "zh-CN-XiaoxiaoNeural", 1)).not.toBe(
   buildCacheKey("你好", "zh-CN-YunxiNeural", 1),
  );
  expect(buildCacheKey("你好", "zh-CN-XiaoxiaoNeural", 1)).not.toBe(
   buildCacheKey("您好", "zh-CN-XiaoxiaoNeural", 1),
  );
 });
});
