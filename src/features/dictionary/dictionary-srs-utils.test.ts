import { expect, it } from "vitest";
import { buildSavedItems, matchesQuery } from "./dictionary-srs-utils";

it("uses dictionary identity and analysis ahead of legacy vocabulary display fields", () => {
 const items = buildSavedItems({
  progressRows: [
   { vocab_id: "v1", dictionary_id: "d1", proficiency_level: 2, personal_note: "my note" },
  ],
  vocabRows: [{ id: "v1", hanzi: "旧", meaning: "legacy meaning", pinyin: "jiù" }],
  dictionaryRows: [
   {
    id: "d1",
    headword: "学习",
    pinyin: "xuéxí",
    ai_analysis: { meaning_summary: "học tập", han_viet: "HỌC TẬP" },
   },
  ],
 });
 expect(items).toEqual([
  {
   id: "v1",
   dictionaryId: "d1",
   hanzi: "学习",
   pinyin: "xuéxí",
   hanViet: "HỌC TẬP",
   meaning: "học tập",
   level: 2,
   saved: true,
   note: "my note",
   updatedAt: "",
  },
 ]);
 const item = items[0];
 if (!item) throw new Error("Missing saved item");
 expect(matchesQuery(item, "học", "vi")).toBe(true);
 expect(matchesQuery(item, "unrelated", "en")).toBe(false);
 expect(matchesQuery(item, "", "en")).toBe(true);
});
