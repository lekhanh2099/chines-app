import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
 buildMeta,
 countFromRelation,
 entityLessonId,
 groupBy,
 isMissingRequiredText,
 matchesTextQuery,
 normalizeLevel,
 normalizePos,
 normalizeText,
} from "./supabase-hanzihome-content-utils";

describe("supabase HanziHome content utils", () => {
 it("groups rows by key while preserving input order", () => {
  const grouped = groupBy(
   [
    { lesson: "a", id: 1 },
    { lesson: "b", id: 2 },
    { lesson: "a", id: 3 },
   ],
   (row) => row.lesson,
  );

  expect(Array.from(grouped.keys())).toEqual(["a", "b"]);
  expect(grouped.get("a")?.map((row) => row.id)).toEqual([1, 3]);
 });

 it("reads relation counts with a zero fallback", () => {
  expect(countFromRelation([{ count: 7 }])).toBe(7);
  expect(countFromRelation([])).toBe(0);
 });

 it("normalizes optional text and detects missing required text", () => {
  expect(normalizeText("  你好 ")).toBe("你好");
  expect(normalizeText(null)).toBe("");
  expect(normalizeText(undefined)).toBe("");
  expect(isMissingRequiredText("   ")).toBe(true);
  expect(isMissingRequiredText("nǐ")).toBe(false);
 });

 it("normalizes part of speech and importance level to known enum values", () => {
  expect(normalizePos(" Noun ")).toBe("noun");
  expect(normalizePos("not a pos")).toBe("unknown");
  expect(normalizePos(null)).toBe("unknown");
  expect(normalizeLevel("A+")).toBe("A+");
  expect(normalizeLevel("Z")).toBe("unknown");
  expect(normalizeLevel(null)).toBe("unknown");
 });

 it("matches a case-insensitive text query and treats a blank query as a match", () => {
  expect(matchesTextQuery(["Xin Chào"], "chào")).toBe(true);
  expect(matchesTextQuery(["你好"], "再见")).toBe(false);
  expect(matchesTextQuery([], "  ")).toBe(true);
 });

 it("extracts the lesson id prefix from runtime entity ids", () => {
  expect(entityLessonId("lesson-1__vocab-2")).toBe("lesson-1");
  expect(entityLessonId("vocab-2")).toBe("");
 });

 it("builds dataset meta counts from lesson counts or loaded arrays", () => {
  const meta = buildMeta(
   [
    { vocabCount: 3, grammarCount: 2, vocab: [], grammar: [] },
    { vocab: [], grammar: [] },
   ].map((lesson, index) => ({
    id: `lesson-${index}`,
    lessonNumber: index + 1,
    titleZh: "",
    title: "",
    tags: [],
    vocabIds: [],
    grammarPointIds: [],
    ...lesson,
   })),
  );

  expect(meta.dataset).toBe("supabase");
  expect(meta.counts).toEqual({
   lessons: 2,
   vocab: 3,
   grammarPoints: 2,
   radicals: 0,
   flashcards: 0,
  });
 });
});
