import { describe, expect, it } from "vitest";

import {
 buildReaderSelectionLoopItem,
 HIGHLIGHT_COLORS,
 removeById,
 upsertById,
} from "./reader-selection-model";

describe("reader selection model", () => {
 it("replaces an existing item in place", () => {
  const items = [
   { id: "a", value: 1 },
   { id: "b", value: 2 },
  ];
  const next = upsertById(items, { id: "a", value: 3 });
  expect(next).toEqual([
   { id: "a", value: 3 },
   { id: "b", value: 2 },
  ]);
  expect(next).not.toBe(items);
 });

 it("appends a new item", () => {
  expect(upsertById([{ id: "a" }], { id: "b" })).toEqual([{ id: "a" }, { id: "b" }]);
 });

 it("removes only the matching item", () => {
  expect(removeById([{ id: "a" }, { id: "b" }], "a")).toEqual([{ id: "b" }]);
  expect(removeById([{ id: "a" }], "missing")).toEqual([{ id: "a" }]);
 });

 it("builds a new learning-loop item keyed by the selection", () => {
  const item = buildReaderSelectionLoopItem({
   stableKey: "reader-selection:doc-1:seg-1:0",
   kind: "vocabulary",
   documentModel: {
    id: "doc-1",
    language: "zh-CN",
    source: { kind: "lesson", sourceId: "lesson-1", href: "/hsk/lesson", label: "Lesson 1" },
    titleVi: "Tiêu đề",
    sections: [],
    segments: [],
    metadata: [],
    capabilities: [],
   },
   sourceHref: "/hsk/lesson?source=reader-selection",
   promptZh: "你好",
   pinyin: "nǐ hǎo",
   meaningVi: "xin chào",
   now: "2026-09-10T00:00:00.000Z",
  });
  expect(item).toEqual({
   id: "reader-selection:doc-1:seg-1:0",
   stable_key: "reader-selection:doc-1:seg-1:0",
   kind: "vocabulary",
   source_id: "doc-1",
   source_href: "/hsk/lesson?source=reader-selection",
   title_zh: "",
   title_vi: "Tiêu đề",
   prompt_zh: "你好",
   pinyin: "nǐ hǎo",
   meaning_vi: "xin chào",
   user_answer: "",
   error_key: "",
   state: "new",
   due_at: "2026-09-10T00:00:00.000Z",
   interval_days: 0,
   correct_streak: 0,
   lapse_count: 0,
   revision: 0,
  });
 });

 it("keeps the four highlight colors in display order", () => {
  expect(HIGHLIGHT_COLORS.map(({ color }) => color)).toEqual(["yellow", "green", "blue", "pink"]);
 });
});
