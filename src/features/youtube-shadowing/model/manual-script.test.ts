import { describe, expect, it } from "vitest";

import { parseManualScript } from "./manual-script";

describe("parseManualScript", () => {
 it("parses plain line-per-sentence script as untimed", () => {
  const result = parseManualScript("\n早上好，我是佳佳\n\n我刚刚送完孩子\n然后回家做饭\n");

  expect(result.isTimed).toBe(false);
  expect(result.timedCount).toBe(0);
  expect(result.segments).toEqual([
   { startMs: 0, endMs: 0, text: "早上好，我是佳佳" },
   { startMs: 0, endMs: 0, text: "我刚刚送完孩子" },
   { startMs: 0, endMs: 0, text: "然后回家做饭" },
  ]);
 });

 it("parses inline timestamps including hh:mm:ss format", () => {
  const result = parseManualScript(
   "00:05 早上好，我是佳佳\n01:23 今天我们一起去市场买菜\n1:02:03 最后回家休息一下",
   3_750_000,
  );

  expect(result.isTimed).toBe(true);
  expect(result.segments).toEqual([
   { startMs: 5000, endMs: 83000, text: "早上好，我是佳佳" },
   { startMs: 83000, endMs: 3723000, text: "今天我们一起去市场买菜" },
   { startMs: 3723000, endMs: 3750000, text: "最后回家休息一下" },
  ]);
 });

 it("parses YouTube Show Transcript two-line timestamp format and mixed formats", () => {
  const result = parseManualScript(
   "0:05\n早上好，我是佳佳\n\n0:10 刚刚出门去买咖啡\n0:16\n现在准备上班",
  );

  expect(result.isTimed).toBe(true);
  expect(result.segments).toEqual([
   { startMs: 5000, endMs: 10000, text: "早上好，我是佳佳" },
   { startMs: 10000, endMs: 16000, text: "刚刚出门去买咖啡" },
   { startMs: 16000, endMs: 21000, text: "现在准备上班" },
  ]);
 });

 it("falls back to untimed when fewer than 50% of lines have timestamps", () => {
  const result = parseManualScript("0:05 早上好\n今天天气不错\n我们出去散步吧");

  expect(result.isTimed).toBe(false);
  expect(result.timedCount).toBe(1);
  expect(result.segments).toEqual([
   { startMs: 0, endMs: 0, text: "早上好" },
   { startMs: 0, endMs: 0, text: "今天天气不错" },
   { startMs: 0, endMs: 0, text: "我们出去散步吧" },
  ]);
 });

 it("sorts out-of-order timed lines and merges short segments", () => {
  const result = parseManualScript("0:05 哎\n0:05 大家好欢迎来到频道\n0:01 先说一句开场白");

  expect(result.isTimed).toBe(true);
  expect(result.segments).toEqual([
   { startMs: 1000, endMs: 5000, text: "先说一句开场白" },
   { startMs: 5000, endMs: 10000, text: "哎，大家好欢迎来到频道" },
  ]);
 });
});
