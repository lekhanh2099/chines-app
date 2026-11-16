import { describe, expect, it } from "vitest";

import radicalCharacterForms from "../static-json/radical-character-forms.json";
import radicalCharacters from "../static-json/radical-characters.json";
import { explainedCharactersIn, radicalCharacterHref } from "./radical-character-forms";
import { buildRadicalCharacterIndex, findRadicalCharacterSet } from "./radical-character-index";
import { radicalCharactersContentSchema } from "./radical-characters.schemas";

const content = radicalCharactersContentSchema.parse(radicalCharacters);
const index = buildRadicalCharacterIndex(content);

describe("explained radical characters package", () => {
 it("holds the 69 reviewed radicals and every explained character row", () => {
  const rows = content.radicals.flatMap((set) => set.groups).flatMap((group) => group.characters);

  expect(content.radicals.map((set) => set.order)).toEqual(
   Array.from({ length: 69 }, (_, order) => order + 1),
  );
  expect(rows).toHaveLength(1298);
  expect(content.radicals.filter((set) => set.radicalId === "").map((set) => set.radical)).toEqual([
   "巾",
   "彳",
   "冫",
   "玉",
   "小",
  ]);
  expect(rows.some((row) => /[`*]/u.test(row.components + row.explanation))).toBe(false);
 });

 it("keeps the membership list in sync with the detail package", () => {
  expect([...radicalCharacterForms.forms].sort()).toEqual([...index.notesByForm.keys()].sort());
 });

 it("finds explained characters of a word in reading order, once each", () => {
  expect(explainedCharactersIn("休息，休假")).toEqual(
   [..."休息假"].filter((character) => index.notesByForm.has(character)),
  );
  expect(explainedCharactersIn("abc 123")).toEqual([]);
  expect(radicalCharacterHref("休")).toBe("/radicals/characters/%E4%BC%91");
 });

 it("resolves a simplified or traditional form to its note and radical set", () => {
  const [note] = index.notesByForm.get("休") ?? [];
  expect(note).toMatchObject({
   character: { hanzi: "休", pinyin: "xiū", hanViet: "Hưu" },
   radical: { radical: "人", radicalId: "radical-001" },
  });
  expect(index.notesByForm.get("宮")?.[0]?.character.hanzi).toBe("宫");
  expect(findRadicalCharacterSet(index, "帽").map((set) => set.radical)).toEqual(["巾"]);
  expect(findRadicalCharacterSet(index, "?")).toEqual([]);
 });
});
