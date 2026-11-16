import { describe, expect, it } from "vitest";

import {
 VOCABULARY_PAGE_SIZE,
 mergeVocabularyRecords,
 paginateVocabularyEntries,
 buildVocabularySearchIndex,
 combineVocabularyEntries,
 searchVocabularyIndex,
 type VocabularyRecord,
} from "./vocabulary-index";

const record = (
 hanzi: string,
 pinyin: string,
 hanViet: string,
 meaning: string,
 href: string,
): VocabularyRecord => ({ hanzi, pinyin, hanViet, meaning, source: { label: href, href } });

const entries = mergeVocabularyRecords([
 record("健康", "", "", "sức khỏe", "/radicals"),
 record(" 健康 ", "jiànkāng", "Kiện khang", "Sức khỏe", "/notes"),
 record("健康", "jiànkāng", "", "khỏe mạnh", "/notes"),
 record("休息", "xiūxi", "Hưu tức", "nghỉ ngơi", "/radicals"),
 record("休", "xiū", "Hưu", "nghỉ", "/radicals"),
 record("", "x", "", "bỏ qua", "/notes"),
]);

describe("unified vocabulary store", () => {
 it("reuses one entry per word and keeps the meaning of each source", () => {
  expect(entries.map((entry) => entry.hanzi)).toEqual(["健康", "休息", "休"]);
  expect(entries[0]).toEqual({
   hanzi: "健康",
   pinyin: "jiànkāng",
   hanViet: "Kiện khang",
   occurrences: [
    { meaning: "sức khỏe", source: { label: "/radicals", href: "/radicals" } },
    { meaning: "Sức khỏe", source: { label: "/notes", href: "/notes" } },
    { meaning: "khỏe mạnh", source: { label: "/notes", href: "/notes" } },
   ],
  });
 });

 it("matches by word, toneless pinyin, Hán-Việt and unaccented meaning, best match first", () => {
  const found = (query: string) =>
   searchVocabularyIndex(buildVocabularySearchIndex(entries), query).map((e) => e.hanzi);

  expect(found("休")).toEqual(["休", "休息"]);
  expect(found("jiankang")).toEqual(["健康"]);
  expect(found("xiu xi")).toEqual(["休息"]);
  expect(found("huu")).toEqual(["休息", "休"]);
  expect(found("suc khoe")).toEqual(["健康"]);
  expect(found("không có")).toEqual([]);
  expect(found("  ")).toEqual(["健康", "休息", "休"]);
 });

 it("joins course and bundled stores without dropping either side", () => {
  const course = mergeVocabularyRecords([record("健康", "", "", "mạnh khỏe", "/hanzihome")]);
  const combined = combineVocabularyEntries(course, entries);

  expect(combined.map((entry) => entry.hanzi)).toEqual(["健康", "休息", "休"]);
  expect(combined[0]).toMatchObject({ pinyin: "jiànkāng", hanViet: "Kiện khang" });
  expect(combined[0]?.occurrences.map((occurrence) => occurrence.meaning)).toEqual([
   "mạnh khỏe",
   "sức khỏe",
   "Sức khỏe",
   "khỏe mạnh",
  ]);
  expect(entries[0]?.occurrences).toHaveLength(3);
 });

 it("clamps the requested page to the available range", () => {
  const many = mergeVocabularyRecords(
   Array.from({ length: VOCABULARY_PAGE_SIZE + 5 }, (_, index) =>
    record(`字${index}`, "", "", "x", "/radicals"),
   ),
  );

  expect(paginateVocabularyEntries(many, 2)).toMatchObject({ page: 2, pageCount: 2, total: 65 });
  expect(paginateVocabularyEntries(many, 2).items).toHaveLength(5);
  expect(paginateVocabularyEntries(many, 99).page).toBe(2);
  expect(paginateVocabularyEntries(many, Number.NaN).page).toBe(1);
  expect(paginateVocabularyEntries([], 1)).toMatchObject({ page: 1, pageCount: 1, total: 0 });
 });
});
