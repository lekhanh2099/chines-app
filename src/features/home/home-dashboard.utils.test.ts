import type { HanziHomeCatalogData } from "@/features/hanzihome/types";
import { getTextbookCatalog } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { buildHomeCourseGroups } from "./home-dashboard.utils";
import { describe, expect, it } from "vitest";

import type { PracticeAttemptRow } from "@/features/hanzihome/practice/practice-attempt.schemas";
import { buildHomeRecentActivity, projectHomeReviewEvidence } from "./home-dashboard.utils";

const labels = {
 fallback: {
  vocab: "Từ vựng đã ôn",
  grammar: "Điểm ngữ pháp đã ôn",
  radical: "Bộ thủ đã ôn",
 },
 kind: {
  vocab: "Từ vựng",
  grammar: "Ngữ pháp",
  radical: "Bộ thủ",
 },
};

function reviewAttempt(input: {
 id: string;
 itemType: "vocab" | "grammar" | "radical";
 itemId: string;
 result: "again" | "hard" | "known";
 label?: string;
 createdAt: string;
}): PracticeAttemptRow {
 return {
  id: input.id,
  user_id: "00000000-0000-4000-8000-000000000001",
  surface: "review",
  content_id: `${input.itemType}:${input.itemId}`,
  direction: null,
  answer: {
   kind: "review",
   itemType: input.itemType,
   result: input.result,
   ...(input.label ? { label: input.label } : {}),
  },
  score: null,
  response_ms: null,
  created_at: input.createdAt,
 };
}

describe("buildHomeRecentActivity", () => {
 it("uses the immutable review attempt label without loading lesson content", () => {
  const attempts = [
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000002",
    itemType: "grammar",
    itemId: "lesson-1__grammar-1",
    label: "只有……才……",
    result: "hard",
    createdAt: "2026-08-17T02:00:00.000Z",
   }),
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000003",
    itemType: "vocab",
    itemId: "lesson-1__word-1",
    label: "坚持",
    result: "known",
    createdAt: "2026-08-17T01:00:00.000Z",
   }),
  ];

  expect(buildHomeRecentActivity(attempts, labels).map((item) => item.label)).toEqual([
   "只有……才……",
   "坚持",
  ]);
 });

 it("keeps backfilled review attempts readable when no label exists", () => {
  const attempts = [
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000004",
    itemType: "radical",
    itemId: "legacy-radical",
    result: "known",
    createdAt: "2026-08-17T03:00:00.000Z",
   }),
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000005",
    itemType: "grammar",
    itemId: "legacy-grammar",
    result: "hard",
    createdAt: "2026-08-17T02:00:00.000Z",
   }),
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000006",
    itemType: "vocab",
    itemId: "legacy-vocab",
    result: "again",
    createdAt: "2026-08-17T01:00:00.000Z",
   }),
  ];

  expect(buildHomeRecentActivity(attempts, labels).map((item) => item.label)).toEqual([
   "Bộ thủ đã ôn",
   "Điểm ngữ pháp đã ôn",
   "Từ vựng đã ôn",
  ]);
 });

 it("returns only the four newest attempt rows supplied by the bounded query", () => {
  const attempts = Array.from({ length: 6 }, (_, index) =>
   reviewAttempt({
    id: `00000000-0000-4000-8000-0000000000${index + 10}`,
    itemType: "vocab",
    itemId: `vocab-${index}`,
    label: `Từ ${index}`,
    result: "known",
    createdAt: `2026-08-17T0${5 - index}:00:00.000Z`,
   }),
  );

  expect(buildHomeRecentActivity(attempts, labels).map((item) => item.label)).toEqual([
   "Từ 0",
   "Từ 1",
   "Từ 2",
   "Từ 3",
  ]);
 });

 it("ignores non-review and malformed evidence rather than inventing activity", () => {
  const valid = reviewAttempt({
   id: "00000000-0000-4000-8000-000000000020",
   itemType: "vocab",
   itemId: "word",
   result: "known",
   createdAt: "2026-08-17T01:00:00.000Z",
  });
  const nonReview: PracticeAttemptRow = { ...valid, surface: "translation" };
  const malformed: PracticeAttemptRow = { ...valid, id: "bad", answer: { kind: "review" } };

  expect(projectHomeReviewEvidence([nonReview, malformed, valid], labels)).toHaveLength(1);
 });
});

describe("Home textbook continuation", () => {
 const catalog: HanziHomeCatalogData = {
  source: "db",
  radicals: [],
  meta: {
   app: "hanzihome",
   dataset: "test",
   version: "1",
   generatedAt: "",
   sourceFiles: [],
   counts: { lessons: 2, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
  },
  courses: [
   {
    id: "hanyu-q3",
    slug: "hanyu-q3",
    title: "Hán ngữ",
    type: "hanyu",
    order: 1,
    stats: { bookCount: 2, lessonCount: 2, vocabCount: 0, grammarCount: 0 },
   },
  ],
  books: [
   { id: "a", courseId: "hanyu-q3", title: "Thượng", order: 1 },
   { id: "b", courseId: "hanyu-q3", title: "Hạ", order: 2 },
  ],
  lessons: ["a", "b"].map((id) => ({
   id: `${id}1`,
   bookId: id,
   courseId: "hanyu-q3",
   lessonNumber: 1,
   title: id,
   titleZh: id,
   vocabIds: [],
   grammarPointIds: [],
   vocab: [],
   grammar: [],
  })),
 };
 it("groups all volumes and scopes duplicate lesson numbers to their book", () => {
  const groups = buildHomeCourseGroups(catalog, getTextbookCatalog(), {
   bookResume: { "catalog:b": { lessonId: "b1", module: "vocab" } },
  });
  expect(groups[0]?.books).toHaveLength(2);
  expect(groups[0]?.books[0]?.lesson?.isRecent).toBe(false);
  expect(groups[0]?.books[1]?.lesson?.href).toBe(
   "/hanzihome?courseId=hanyu-q3&bookId=b&lesson=1&module=vocab",
  );
  expect(groups).toHaveLength(4);
  expect(
   groups.flatMap((group) => group.books).some((book) => book.lesson?.href.includes("book=tm2")),
  ).toBe(false);
 });
 it("uses legacy continuation only for its actual book and rejects removed lessons", () => {
  const groups = buildHomeCourseGroups(catalog, [], {
   lastLessonId: "b1",
   lastModule: "grammar",
   bookResume: { "catalog:a": { lessonId: "removed", module: "vocab" } },
  });
  expect(groups[0]?.books[0]?.lesson).toMatchObject({ isRecent: false, module: "overview" });
  expect(groups[0]?.books[1]?.lesson).toMatchObject({ isRecent: true, module: "grammar" });
 });
 it("uses the default tab when a saved tab is removed instead of inheriting another session", () => {
  const groups = buildHomeCourseGroups(catalog, [], {
   lastLessonId: "b1",
   lastModule: "grammar",
   bookResume: { "catalog:b": { lessonId: "b1", module: "removed" } },
  });
  expect(groups[0]?.books[1]?.lesson?.module).toBe("overview");
 });
 it("keeps static books available when the DB catalog is empty", () => {
  const groups = buildHomeCourseGroups(
   { ...catalog, courses: [], books: [], lessons: [] },
   getTextbookCatalog(),
   {},
  );
  expect(groups).toHaveLength(3);
  expect(groups.every((group) => group.books[0]?.lesson?.isRecent === false)).toBe(true);
 });
});
