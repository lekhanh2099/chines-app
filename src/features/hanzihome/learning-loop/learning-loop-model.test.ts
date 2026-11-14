import { describe, expect, it } from "vitest";

import type { LearningLoopItemRow } from "./learning-loop-api";
import { restoreLearningLoopItem } from "./learning-loop-model";

function item(id: string): LearningLoopItemRow {
 return {
  user_id: "00000000-0000-4000-8000-000000000001",
  id,
  stable_key: `key-${id}`,
  kind: "vocabulary",
  source_id: "src-1",
  source_href: "/lesson/1",
  title_zh: "中文",
  title_vi: "Tiếng Trung",
  prompt_zh: "你好",
  pinyin: "nǐ hǎo",
  meaning_vi: "Xin chào",
  user_answer: "",
  error_key: "",
  state: "learning",
  due_at: "2026-09-10T00:00:00.000Z",
  interval_days: 1,
  correct_streak: 0,
  lapse_count: 0,
  revision: 1,
  created_at: "2026-09-10T00:00:00.000Z",
  updated_at: "2026-09-10T00:00:00.000Z",
 };
}

describe("restoreLearningLoopItem", () => {
 it("reinserts a rolled-back item at its previous index", () => {
  const current = [item("a"), item("c")];
  expect(restoreLearningLoopItem(current, item("b"), 1).map((row) => row.id)).toEqual([
   "a",
   "b",
   "c",
  ]);
  expect(current.map((row) => row.id)).toEqual(["a", "c"]);
 });

 it("falls back to the front when the index is out of range", () => {
  expect(restoreLearningLoopItem([item("a")], item("b"), 5).map((row) => row.id)).toEqual([
   "b",
   "a",
  ]);
  expect(restoreLearningLoopItem([item("a")], item("b"), -1).map((row) => row.id)).toEqual([
   "b",
   "a",
  ]);
 });

 it("keeps the cache unchanged when the item is already present", () => {
  const current = [item("a")];
  expect(restoreLearningLoopItem(current, item("a"), 0)).toBe(current);
 });
});
