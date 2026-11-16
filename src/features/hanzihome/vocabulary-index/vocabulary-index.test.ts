import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { VocabularyWordWorkspace } from "./VocabularyWordWorkspace";

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: ComponentProps<"a">) => createElement("a", { href }, children),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/features/hanzihome/listening/MandarinSpeakButton", () => ({
 MandarinSpeakButton: () => null,
}));

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
 it("renders every reading with its own lesson meanings on the word page", () => {
  const words = mergeVocabularyRecords([
   record("行", "xíng", "Hành", "đi trong bài một", "/lesson-1"),
   record("行", "háng", "Hàng", "ngành nghề trong bài hai", "/lesson-2"),
  ]);
  const markup = renderToStaticMarkup(
   createElement(
    QueryClientProvider,
    { client: new QueryClient() },
    createElement(VocabularyWordWorkspace, { entries: words }),
   ),
  );
  expect(markup).toContain("xíng");
  expect(markup).toContain("háng");
  expect(markup).toContain("đi trong bài một");
  expect(markup).toContain("ngành nghề trong bài hai");
  expect(markup.indexOf("xíng")).toBeLessThan(markup.indexOf("đi trong bài một"));
  expect(markup.indexOf("đi trong bài một")).toBeLessThan(markup.indexOf("háng"));
  expect(markup.indexOf("háng")).toBeLessThan(markup.indexOf("ngành nghề trong bài hai"));
  expect(markup.match(/<h1\b/gu)).toHaveLength(1);
 });

 it("keeps polyphonic readings and their lesson meanings separate", () => {
  const words = mergeVocabularyRecords([
   record("行", "xíng", "Hành", "đi", "/lesson-1"),
   record(" 行 ", " XÍNG ", "", "đi", "/lesson-1"),
   record("行", "háng", "Hàng", "hàng", "/lesson-1"),
   record("西安", "xī'ān", "", "Tây An", "/lesson-1"),
   record("西安", "XĪ ĀN", "", "Tây An", "/lesson-2"),
  ]);
  expect(words.map((entry) => [entry.hanzi, entry.pinyin])).toEqual([
   ["行", "xíng"],
   ["行", "háng"],
   ["西安", "xī'ān"],
  ]);
  expect(words.map((entry) => entry.occurrences.length)).toEqual([1, 1, 2]);
  expect(words[1]?.occurrences[0]?.meaning).toBe("hàng");
 });

 it("attaches empty pinyin to the first reading even when it appears before that reading", () => {
  const words = mergeVocabularyRecords([
   record("行", "", "", "ghi chú", "/notes"),
   record("行", "háng", "Hàng", "hàng", "/lesson-1"),
   record("行", "xíng", "Hành", "đi", "/lesson-2"),
   record("行", " ", "", "chú thích", "/notes"),
   record("未注音", "", "", "chưa có pinyin", "/notes"),
  ]);
  expect(words.map((entry) => entry.pinyin)).toEqual(["háng", "xíng", ""]);
  expect(words[0]?.occurrences.map((item) => item.meaning)).toEqual([
   "ghi chú",
   "hàng",
   "chú thích",
  ]);
  expect(words[1]?.occurrences.map((item) => item.meaning)).toEqual(["đi"]);
 });

 it("reuses one word for neutral-tone spellings and for a note listing several readings", () => {
  const words = mergeVocabularyRecords([
   record("传", "chuán / zhuàn", "Truyền", "ghi chú bộ thủ", "/radicals"),
   record("热闹", "rènào", "", "náo nhiệt", "/lesson-1"),
   record("热闹", "rènao", "", "nhộn nhịp", "/lesson-2"),
   record("传", "zhuàn", "", "truyện ký", "/lesson-3"),
   record("传", "chuán", "", "truyền", "/lesson-4"),
   record("得", "dé / de / děi", "", "ghi chú bộ thủ", "/radicals"),
  ]);
  expect(words.map((entry) => [entry.hanzi, entry.pinyin, entry.occurrences.length])).toEqual([
   ["传", "chuán", 2],
   ["热闹", "rènào", 2],
   ["传", "zhuàn", 1],
   ["得", "dé / de / děi", 1],
  ]);
  expect(combineVocabularyEntries(words, words).map((entry) => entry.pinyin)).toEqual(
   words.map((entry) => entry.pinyin),
  );
 });

 it("preserves separate readings when combining course and bundled entries", () => {
  const course = mergeVocabularyRecords([
   record("行", "xíng", "Hành", "đi", "/lesson-1"),
   record("行", "háng", "Hàng", "hàng", "/lesson-2"),
  ]);
  const bundled = mergeVocabularyRecords([
   record("行", " HÁNG ", "", "ngành", "/textbook"),
   record("行", "", "", "ghi chú", "/notes"),
  ]);
  const combined = combineVocabularyEntries(course, bundled);
  expect(combined.map((entry) => entry.pinyin)).toEqual(["xíng", "háng"]);
  expect(combined[0]?.occurrences.map((item) => item.meaning)).toEqual(["đi"]);
  expect(combined[1]?.occurrences.map((item) => item.meaning)).toEqual([
   "hàng",
   "ngành",
   "ghi chú",
  ]);
  expect(course[1]?.occurrences).toHaveLength(1);
 });

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
