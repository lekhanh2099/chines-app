import { describe, expect, it } from "vitest";
import { getItWebVocabCorpus } from "@/features/hanzihome/static-json/it-web-vocab-static-content";
import type { BookmarkedTextbookGroup } from "./vocab-hub-adapter";
import {
 buildCustomVaultBundle,
 buildItQuickBundle,
 parseSourceMode,
 selectBookmarkedLessons,
} from "./vocab-hub-model";

const lessonA = {
 id: "a-1",
 bookKey: "nhip-cau",
 bookLabel: "Nhịp cầu",
 number: 1,
 title: "Bài 1",
 vocabCount: 3,
} satisfies BookmarkedTextbookGroup["lessons"][number];
const lessonB = {
 ...lessonA,
 id: "b-1",
 bookKey: "doc-hieu",
 bookLabel: "Đọc hiểu",
} satisfies BookmarkedTextbookGroup["lessons"][number];
const groups: readonly BookmarkedTextbookGroup[] = [
 { bookKey: "nhip-cau", bookLabel: "Nhịp cầu", lessons: [lessonA], totalVocabCount: 3 },
 { bookKey: "doc-hieu", bookLabel: "Đọc hiểu", lessons: [lessonB], totalVocabCount: 3 },
];
const allLessons = [lessonA, lessonB];

describe("parseSourceMode", () => {
 it("accepts known modes and falls back to bookmarked lessons", () => {
  expect(parseSourceMode("it-quick")).toBe("it-quick");
  expect(parseSourceMode("custom-vault")).toBe("custom-vault");
  expect(parseSourceMode("lessons")).toBe("lessons");
  expect(parseSourceMode("unknown")).toBe("bookmarked-lessons");
 });
});

describe("selectBookmarkedLessons", () => {
 it("returns every lesson for 'all' and unknown selections", () => {
  expect(selectBookmarkedLessons("all", groups, allLessons)).toBe(allLessons);
  expect(selectBookmarkedLessons("other", groups, allLessons)).toBe(allLessons);
 });

 it("narrows to a book or a single lesson, falling back to all when missing", () => {
  expect(selectBookmarkedLessons("book:doc-hieu", groups, allLessons)).toEqual([lessonB]);
  expect(selectBookmarkedLessons("book:missing", groups, allLessons)).toBe(allLessons);
  expect(selectBookmarkedLessons("lesson:a-1", groups, allLessons)).toEqual([lessonA]);
  expect(selectBookmarkedLessons("lesson:missing", groups, allLessons)).toBe(allLessons);
 });
});

describe("buildItQuickBundle", () => {
 const corpus = getItWebVocabCorpus();

 it("labels preset decks and falls back to core20 for an unknown preset", () => {
  expect(buildItQuickBundle("preset:core20", corpus).title).toBe(
   "IT / Làm Web · 20 từ cốt lõi ngày đầu",
  );
  expect(buildItQuickBundle("preset:bogus", corpus).title).toBe(
   "IT / Làm Web · 20 từ cốt lõi ngày đầu",
  );
 });

 it("builds a single-group deck labelled by the group", () => {
  const group = corpus.groups[0];
  if (!group) throw new Error("IT corpus has no groups");
  const bundle = buildItQuickBundle(`group:${group.id}`, corpus);
  expect(bundle.title).toBe(`IT / Làm Web · ${group.label}`);
  expect(bundle.vocabItems).toHaveLength(group.items.length);
  expect(bundle.grammarItems).toEqual([]);
 });
});

describe("buildCustomVaultBundle", () => {
 it("returns an empty private-vault deck for no custom words", () => {
  expect(buildCustomVaultBundle([])).toEqual({
   title: "Kho từ vựng riêng",
   vocabItems: [],
   grammarItems: [],
   practiceItems: [],
  });
 });
});
