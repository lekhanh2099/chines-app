import { describe, expect, it, vi } from "vitest";

import { HanziHomeSearchRequestSchema, HanziHomeSearchResponseSchema } from "../types";
import { collectReaderDocuments } from "./collect-reader-documents";
import { collectTextbookDocuments } from "./collect-textbook-documents";
import { createSearchEngine, prepareSearchQuery, type SearchDocument } from "./search-engine";
import { rankSearchHits } from "./search-ranking";

vi.mock("server-only", () => ({}));

function fixtureDocument(
 id: string,
 kind: SearchDocument["item"]["kind"],
 title: string,
 body: string,
 extra: Partial<Omit<SearchDocument, "item">> = {},
): SearchDocument {
 return {
  item: {
   id,
   kind,
   title,
   courseId: "course-1",
   lessonId: id === "vocab-budan" ? "lesson-1" : "lesson-2",
  },
  title,
  pinyin: "",
  subtitle: "",
  body,
  ...extra,
 };
}

const fixtureEngine = createSearchEngine([
 fixtureDocument("vocab-budan", "vocab", "不但……而且……", "khong nhung ma con", {
  pinyin: "bùdàn érqiě",
 }),
 fixtureDocument(
  "exercise-1",
  "exercise",
  "Sửa câu sai",
  "Chọn đáp án đúng: 他不但聪明而且很努力 trong ngữ cảnh này",
 ),
 fixtureDocument("grammar-1", "grammar", "Câu chữ 把", "Cấu trúc chủ ngữ + 把 + tân ngữ + động từ"),
]);

function search(q: string, overrides: Record<string, string> = {}, engines = [fixtureEngine]) {
 const request = HanziHomeSearchRequestSchema.parse({ q, ...overrides });
 return HanziHomeSearchResponseSchema.parse(
  rankSearchHits(engines, prepareSearchQuery(request.q), request),
 );
}

describe("rankSearchHits on fixtures", () => {
 it("ranks a title match above a body-only match and gives the body match a snippet", () => {
  const response = search("不但");
  expect(response.results.map((result) => result.item.id)).toEqual(["vocab-budan", "exercise-1"]);
  expect(response.results[0]?.matchedSnippet).toBeUndefined();
  expect(response.results[1]?.matchedSnippet).toContain("不但");
  expect(response.results[1]?.matchedText).toBe("不但");
 });

 it("finds a Vietnamese phrase without diacritics and highlights the original text", () => {
  const response = search("dap an dung");
  expect(response.results.map((result) => result.item.id)).toEqual(["exercise-1"]);
  expect(response.results[0]?.matchedSnippet).toContain("đáp án đúng");
  expect(response.results[0]?.matchedText).toBe("đáp án đúng");
  expect(search("cau chu").results.map((result) => result.item.id)).toEqual(["grammar-1"]);
 });

 it("requires adjacent Han characters for a multi-character query", () => {
  expect(search("但而").results).toEqual([]);
 });

 it("filters by category while counting every category", () => {
  const response = search("不但", { category: "exercise" });
  expect(response.results.map((result) => result.item.id)).toEqual(["exercise-1"]);
  expect(response.counts).toEqual(expect.objectContaining({ all: 2, vocab: 1, exercise: 1 }));
 });

 it("does not turn a lesson boost into a match and caps the result count", () => {
  expect(search("missing-phrase", { lessonId: "lesson-1", courseId: "course-1" }).results).toEqual(
   [],
  );
  expect(search("不但", { limit: "1" }).results).toHaveLength(1);
  expect(search("不但", { limit: "1" }).counts.all).toBe(2);
 });

 it("boosts the active lesson among equal matches", () => {
  const engine = createSearchEngine([
   fixtureDocument("other", "lesson_text", "A", "团聚"),
   fixtureDocument("vocab-budan", "lesson_text", "A", "团聚"),
  ]);
  const response = search("团聚", { lessonId: "lesson-1" }, [engine]);
  expect(response.results[0]?.item.id).toBe("vocab-budan");
 });

 it("matches a misspelled long Latin word and a typed prefix", () => {
  expect(search("dongtu").results).toEqual([]);
  expect(search("canh nay").results.map((result) => result.item.id)).toEqual(["exercise-1"]);
  expect(search("ngu canh n").results.map((result) => result.item.id)).toEqual(["exercise-1"]);
  expect(search("truc").results.map((result) => result.item.id)).toEqual(["grammar-1"]);
  expect(search("cautruc").results).toEqual([]);
  expect(search("cấu trúx").results.map((result) => result.item.id)).toEqual(["grammar-1"]);
 });
});

describe("rankSearchHits on the static corpus", async () => {
 const engine = createSearchEngine([
  ...collectTextbookDocuments(),
  ...(await collectReaderDocuments()),
 ]);

 it("finds the Đọc hiểu vocabulary, text and exercise for 团聚", () => {
  const response = search("团聚", {}, [engine]);
  const ids = response.results.map((result) => result.item.id);
  expect(response.results[0]?.item.title).toBe("团聚");
  expect(ids).toContain("textbook-vocab:doc-hieu-unit-02-vocab-row-54");
  expect(ids).toContain("textbook-block:doc-hieu-unit-02-article-01-text-block-012");
  expect(ids).toContain("textbook-block:doc-hieu-unit-02-article-01-practice-block-052");
  const text = response.results.find(
   (result) => result.item.id === "textbook-block:doc-hieu-unit-02-article-01-text-block-012",
  );
  expect(text?.item.href).toBe(
   "/hsk/doc-hieu?lesson=2&tab=text#doc-hieu-unit-02-article-01-text-block-012",
  );
  expect(text?.matchedSnippet).toContain("团聚");
  expect(text?.matchedText).toBe("团聚");
  expect(response.counts.exercise).toBeGreaterThan(0);
  expect(response.counts.lesson).toBeGreaterThan(0);
 });

 it("finds 团聚 by toneless pinyin with and without spaces", () => {
  for (const query of ["tuanju", "tuán jù", "tuan ju"]) {
   expect(search(query, {}, [engine]).results[0]?.item.title).toBe("团聚");
  }
 });

 it("finds Vietnamese text with diacritics from a query without them", () => {
  const response = search("ca nha doan tu", {}, [engine]);
  expect(response.results.map((result) => result.item.id)).toContain(
   "textbook-block:doc-hieu-unit-02-article-01-text-block-012",
  );
  const text = response.results.find(
   (result) => result.item.id === "textbook-block:doc-hieu-unit-02-article-01-text-block-012",
  );
  expect(text?.matchedText?.toLocaleLowerCase("vi-VN")).toBe("cả nhà đoàn tụ");
 });

 it("ranks a verbatim Vietnamese phrase above scattered syllables", () => {
  expect(search("doan tu", {}, [engine]).results[0]?.item.title).toBe("团聚");
 });

 it("finds Studio Reader paragraphs and links to the Reader document", () => {
  const response = search("鉴湖", { category: "reading" }, [engine]);
  expect(response.results.length).toBeGreaterThan(0);
  expect(response.results.every((result) => result.item.kind === "reader_document")).toBe(true);
  expect(response.results[0]?.item.href).toMatch(/^\/(reader|hsk|humanities|personal-learning)/u);
 });
});
