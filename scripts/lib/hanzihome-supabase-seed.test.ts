import { describe, expect, it } from "vitest";

import { materializeVocabEnrichment } from "./hanzihome-supabase-seed";

describe("materializeVocabEnrichment", () => {
 it("materializes examples and collocations for synthetic/proper-noun vocabulary items", () => {
  const result = materializeVocabEnrichment({
   lessonId: "boya-elementary-1-l01",
   importedAt: "2026-07-15T00:00:00.000Z",
   rawItem: {
    id: "boya-elementary-1-l01-pn01",
    hanzi: "大卫",
    pinyin: "dà wèi",
    meaning_vi: "David",
    pos: "proper_noun",
    examples: [
     {
      zh: "我叫大卫。",
      pinyin: "Wǒ jiào Dàwèi.",
      vi: "Tôi tên là David.",
     },
    ],
    collocations: [
     {
      zh: "大卫先生",
      pinyin: "Dàwèi xiānsheng",
      vi: "ông David",
      pattern: "专名 + 称谓",
     },
    ],
   },
  });

  expect(result.examples).toEqual([
   expect.objectContaining({
    id: "30aee97b-631d-5b55-97d1-0d01532db972",
    vocab_item_id: "boya-elementary-1-l01-pn01",
    lesson_id: "boya-elementary-1-l01",
    zh: "我叫大卫。",
    vi: "Tôi tên là David.",
   }),
  ]);
  expect(result.collocationDetail).toEqual(
   expect.objectContaining({
    vocab_item_id: "boya-elementary-1-l01-pn01",
    lesson_id: "boya-elementary-1-l01",
    section_key: "collocations",
    lines: ["大卫先生 · Dàwèi xiānsheng — ông David — 专名 + 称谓"],
   }),
  );
 });
});
