import { beforeEach, describe, expect, it, vi } from "vitest";

const { tables, rows } = vi.hoisted(() => ({
 tables: new Array<string>(),
 rows: new Array<object>(),
}));

// Chainable PostgREST stand-in: records the queried tables and resolves every
// query with the fixture rows.
function recordingClient() {
 return {
  from(table: string) {
   tables.push(table);
   const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    range: () => builder,
    limit: () => builder,
    then: (resolve: (value: { data: object[]; error: null; count: number }) => void) =>
     resolve({ data: rows, error: null, count: rows.length }),
   };
   return builder;
  },
 };
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => recordingClient()) }));

import { getAggregateItems, getAggregateVocabRevision } from "./supabase-hanzihome-vocabulary";

const allLessons = { courseId: "", bookId: "", lessonId: "", q: "" };
// Lesson 12 of 汉语教程 第三册 上 in `static-json/courses/legacy-routes.json`.
const convertedLessonId = "02fe6df4-83d4-4c2d-9cce-e119bdd63a11";
const vocabRow = (id: string, lessonId: string) => ({
 id,
 word_id: null,
 lesson_id: lessonId,
 course_id: "hanyu-q3",
 book_id: "hanyu-q3-shang",
 item_order: 1,
 word: "团聚",
 pinyin: "tuánjù",
 han_viet: "Đoàn tụ",
 meaning: "sum họp",
 category: "Từ vựng",
 level: null,
 pos_vi: null,
 pos_zh: null,
 updated_at: "2026-11-16T00:00:00.000Z",
});

describe("vocabulary store rows", () => {
 beforeEach(() => {
  tables.length = 0;
  rows.length = 0;
 });

 it("names the converted course lesson of a row without reading lesson tables", async () => {
  rows.push(vocabRow("vocab-1", convertedLessonId), vocabRow("vocab-2", "not-a-converted-lesson"));

  const items = await getAggregateItems({ kind: "vocab", filters: allLessons });

  expect(items).toEqual([
   expect.objectContaining({
    id: `${convertedLessonId}__vocab-1`,
    bookId: "hanyu-q3-shang",
    lessonNumber: 12,
    word: "团聚",
   }),
  ]);
  expect(items[0]?.lessonTitle).not.toBe("");
  expect(new Set(tables)).toEqual(new Set(["hanzihome_vocab_items"]));
 });

 it("fingerprints the vocabulary rows only", async () => {
  rows.push({ updated_at: "2026-11-16T00:00:00.000Z" });

  await expect(getAggregateVocabRevision()).resolves.toBe("1@2026-11-16T00:00:00.000Z");
  expect(tables).toEqual(["hanzihome_vocab_items"]);
 });
});
