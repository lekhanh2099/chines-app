import { describe, expect, it } from "vitest";
import { SmartSelectionResultSchema } from "@/types/database";
import { getDictionaryDisplayMeaning, getUniqueChineseCharacters } from "./utils";

const selection = SmartSelectionResultSchema.parse({
 mode: "word",
 selection: "你好",
 context_sentence: "你好。",
 entry: { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "entry meaning" },
 radicals: [],
 components: [],
 definitions: [],
 meaning_summary: "summary meaning",
 etymology: "",
 mnemonic_story: "",
 translation: "sentence translation",
 grammar_points: [],
 isSaved: false,
 found: true,
 personal_note: "",
 personal_note_mode: "important",
});

describe("dictionary display meaning", () => {
 it("uses translation for sentences and summary for words", () => {
  expect(getDictionaryDisplayMeaning("sentence", selection)).toBe("sentence translation");
  expect(getDictionaryDisplayMeaning("word", selection)).toBe("summary meaning");
 });

 it("falls back through definition meaning, text, then the entry", () => {
  const withoutSummary = { ...selection, meaning_summary: "" };
  expect(
   getDictionaryDisplayMeaning("word", {
    ...withoutSummary,
    definitions: [{ meaning: "definition meaning", text: "definition text" }],
   }),
  ).toBe("definition meaning");
  expect(
   getDictionaryDisplayMeaning("word", {
    ...withoutSummary,
    definitions: [{ text: "definition text" }],
   }),
  ).toBe("definition text");
  expect(getDictionaryDisplayMeaning("word", withoutSummary)).toBe("entry meaning");
  expect(getDictionaryDisplayMeaning("sentence", { ...selection, translation: "" })).toBe(
   "entry meaning",
  );
 });

 it("keeps the empty meaning and ordered unique Chinese-character policy", () => {
  const empty = {
   ...selection,
   entry: { ...selection.entry, meaning: "" },
   meaning_summary: "",
   translation: "",
  };
  expect(getDictionaryDisplayMeaning("word", empty)).toBe("");
  expect(getDictionaryDisplayMeaning("sentence", empty)).toBe("");
  expect(getUniqueChineseCharacters("A你好，你好。中國 / 中")).toEqual(["你", "好", "中", "國"]);
 });
});
