import { describe, expect, it } from "vitest";
import { cookReaderData } from "./cook-reader-data";

describe("Reader cooker", () => {
 it("generates long structured content without changing identity or truncating text", () => {
  const zh = "中国。".repeat(800);
  const content = cookReaderData([{ id: "long", zh }], { pronunciation: "generate-missing" });
  expect(content.segmentIds).toEqual(["long"]);
  expect(content.segmentsById.long?.zh).toBe(zh);
  expect(content.segmentsById.long?.pinyin).toBe("zhōngguó。".repeat(800));
 });

 it("keeps supplementary characters intact across pronunciation batches", () => {
  const zh = "A".repeat(1999) + "😀中国。";
  const content = cookReaderData([{ id: "unicode", zh }], { pronunciation: "generate-missing" });
  expect(content.segmentsById.unicode?.pinyin).toBe("A".repeat(1999) + "😀zhōngguó。");
 });
 it("splits raw sentences and paragraphs with punctuation and stable line endings", () => {
  const first = cookReaderData("你好！再见？\r\n\r\n中国。");
  expect(first.segmentIds.map((id) => first.segmentsById[id]?.zh)).toEqual([
   "你好！",
   "再见？",
   "中国。",
  ]);
  expect(first).toEqual(cookReaderData("你好！再见？\n\n中国。"));
 });
 it("preserves structured boundaries and aliases", () => {
  const content = cookReaderData([{ id: "a", hanzi: "你好。再见。", translation: "Hello" }]);
  expect(content.segmentIds).toEqual(["a"]);
  expect(content.segmentsById.a).toMatchObject({ zh: "你好。再见。", vi: "Hello" });
  expect(cookReaderData(["你好。再见。"]).segmentIds).toHaveLength(1);
 });
 it("handles empty content deterministically", () => {
  expect(cookReaderData("").segmentIds).toEqual([]);
  expect(cookReaderData("")).toEqual(cookReaderData(""));
 });
 it.each([
  { input: [{ zh: "你好", hanzi: "再见" }] },
  { input: [{ zh: "你好", vi: "A", translation: "B" }] },
  {
   input: [
    { id: "a", zh: "你好" },
    { id: "a", zh: "再见" },
   ],
  },
  { input: [{ zh: "你好", sectionId: "missing" }] },
 ])("rejects invalid structured input", ({ input }) => {
  expect(() => cookReaderData(input)).toThrow();
 });
 it("preserves all segment kinds, source identity and section order", () => {
  const content = cookReaderData({
   id: "source",
   language: "zh-CN",
   source: { kind: "article", sourceId: "original" },
   segments: [
    { id: "a", kind: "heading", zh: "中国" },
    { id: "b", kind: "quote", zh: "你好", sectionId: "section" },
    { id: "c", kind: "dialogue-turn", zh: "再见", speaker: { label: "A" } },
   ],
   sections: [{ id: "section", title: "Title", segmentIds: ["b"] }],
   metadata: [],
   capabilities: [],
  });
  expect(content.id).toBe("source");
  expect(content.segmentIds).toEqual(["a", "b", "c"]);
  expect(content.sectionIds).toEqual(["section"]);
  expect(content).not.toHaveProperty("segments");
 });
 it("preserves supplied pinyin and generates only missing readings", () => {
  const input = [
   { id: "a", zh: "中国", pinyin: "source" },
   { id: "b", zh: "你好" },
  ];
  expect(cookReaderData(input).segmentsById.b?.pinyin).toBeUndefined();
  const content = cookReaderData(input, { pronunciation: "generate-missing" });
  expect(content.segmentsById.a?.pinyin).toBe("source");
  expect(content.segmentsById.b?.pinyin).toBeTruthy();
 });

 it("rejects dangling section references and duplicate section IDs", () => {
  const document = {
   id: "document",
   language: "zh-CN",
   source: { kind: "article" },
   segments: [{ id: "a", kind: "paragraph", zh: "你好" }],
   sections: [{ id: "section", title: "Title", segmentIds: ["missing"] }],
   metadata: [],
   capabilities: [],
  };
  expect(() => cookReaderData(document)).toThrow("Invalid Reader section reference");
  expect(() =>
   cookReaderData({
    ...document,
    sections: [
     { id: "section", title: "One", segmentIds: [] },
     { id: "section", title: "Two", segmentIds: [] },
    ],
   }),
  ).toThrow("Duplicate Reader IDs");
 });

 it("does not mutate input while resolving title and segment pinyin", () => {
  const document = {
   id: "document",
   language: "zh-CN",
   source: { kind: "article" },
   title: "中国",
   titleVi: "Trung Quốc",
   segments: [{ id: "a", kind: "paragraph", zh: "你好" }],
   sections: [],
   metadata: [],
   capabilities: [],
  };
  const content = cookReaderData(document, { pronunciation: "generate-missing" });
  expect(document).not.toHaveProperty("titlePinyin");
  expect(document.segments[0]).not.toHaveProperty("pinyin");
  expect(content.title).toMatchObject({ zh: "中国", vi: "Trung Quốc" });
  expect(content.title?.pinyin).toBeTruthy();
  expect(content.capabilities).toContain("pinyin");
 });
});
