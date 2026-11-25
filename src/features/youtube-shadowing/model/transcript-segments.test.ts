import { describe, expect, it } from "vitest";

import {
 findActiveSegmentIndex,
 mergeShortSegments,
 normalizeTimedTextSegments,
} from "./transcript-segments";

describe("normalizeTimedTextSegments", () => {
 it("joins segs, replaces newlines, trims, drops empty events, and sorts by startMs", () => {
  const result = normalizeTimedTextSegments(
   [
    { tStartMs: 8000, dDurationMs: 2500, segs: [{ utf8: "然后回家\n做饭" }] },
    { tStartMs: 2000, dDurationMs: 2000, segs: [{ utf8: "   " }] },
    { tStartMs: 3000, dDurationMs: 2500, segs: [{ utf8: "早上好，" }, { utf8: "我是佳佳" }] },
   ],
   30,
  );

  expect(result).toEqual([
   { startMs: 3000, endMs: 5500, text: "早上好，我是佳佳" },
   { startMs: 8000, endMs: 10500, text: "然后回家 做饭" },
  ]);
 });

 it("derives endMs from next startMs or lengthSeconds when duration is missing", () => {
  const result = normalizeTimedTextSegments(
   [
    { tStartMs: 1000, dDurationMs: 0, segs: [{ utf8: "今天天气很好" }] },
    { tStartMs: 4500, dDurationMs: 0, segs: [{ utf8: "我们一起去公园" }] },
   ],
   10,
  );

  expect(result).toEqual([
   { startMs: 1000, endMs: 4500, text: "今天天气很好" },
   { startMs: 4500, endMs: 10000, text: "我们一起去公园" },
  ]);
 });
});

describe("mergeShortSegments", () => {
 it("merges short duration or short text segments when gap <= 400ms and combined <= 40 chars", () => {
  const result = mergeShortSegments([
   { startMs: 0, endMs: 200, text: "哎" },
   { startMs: 300, endMs: 500, text: "啊" },
   { startMs: 700, endMs: 2500, text: "大家好欢迎回来" },
   { startMs: 4000, endMs: 6000, text: "今天我们聊一聊日常" },
  ]);

  expect(result).toEqual([
   { startMs: 0, endMs: 2500, text: "哎，啊，大家好欢迎回来" },
   { startMs: 4000, endMs: 6000, text: "今天我们聊一聊日常" },
  ]);
 });

 it("does not add duplicate punctuation when first segment already ends with punctuation", () => {
  const result = mergeShortSegments([
   { startMs: 0, endMs: 500, text: "好！" },
   { startMs: 600, endMs: 2500, text: "我们现在开始练习" },
  ]);

  expect(result).toEqual([{ startMs: 0, endMs: 2500, text: "好！我们现在开始练习" }]);
 });

 it("does not merge when gap exceeds 400ms", () => {
  const result = mergeShortSegments([
   { startMs: 0, endMs: 300, text: "嗨" },
   { startMs: 800, endMs: 2800, text: "今天我们一起学习" },
  ]);

  expect(result).toHaveLength(2);
 });

 it("does not merge when combined length exceeds 40 characters", () => {
  const longNext = "一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九";
  const result = mergeShortSegments([
   { startMs: 0, endMs: 300, text: "你好" },
   { startMs: 400, endMs: 3000, text: longNext },
  ]);

  expect(result).toHaveLength(2);
  expect(result[0]?.text).toBe("你好");
  expect(result[1]?.text).toBe(longNext);
 });
});

describe("findActiveSegmentIndex", () => {
 const segments = [
  { startMs: 1000, endMs: 3000, text: "第一句" },
  { startMs: 4000, endMs: 6000, text: "第二句" },
  { startMs: 6000, endMs: 9000, text: "第三句" },
 ];

 it("returns -1 for empty list or before the first segment", () => {
  expect(findActiveSegmentIndex([], 1500)).toBe(-1);
  expect(findActiveSegmentIndex(segments, 0)).toBe(-1);
  expect(findActiveSegmentIndex(segments, 999)).toBe(-1);
 });

 it("finds the latest segment started at or before currentMs", () => {
  expect(findActiveSegmentIndex(segments, 1000)).toBe(0);
  expect(findActiveSegmentIndex(segments, 3500)).toBe(0);
  expect(findActiveSegmentIndex(segments, 4000)).toBe(1);
  expect(findActiveSegmentIndex(segments, 6000)).toBe(2);
  expect(findActiveSegmentIndex(segments, 12000)).toBe(2);
 });
});
