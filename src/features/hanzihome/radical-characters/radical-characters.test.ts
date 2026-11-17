import { describe, expect, it } from "vitest";

import radicalCharacterForms from "../static-json/radical-character-forms.json";
import radicalCharacters from "../static-json/radical-characters.json";
import { explainedCharactersIn, radicalCharacterHref } from "./radical-character-forms";
import { buildRadicalCharacterIndex, findRadicalCharacterSet } from "./radical-character-index";
import { radicalCharactersContentSchema } from "./radical-characters.schemas";

const content = radicalCharactersContentSchema.parse(radicalCharacters);
const index = buildRadicalCharacterIndex(content);

describe("explained radical characters package", () => {
 it("holds all 228 reviewed radicals and every explained character row", () => {
  const rows = content.radicals.flatMap((set) => set.groups).flatMap((group) => group.characters);

  expect(content.radicals.map((set) => set.order)).toEqual(
   Array.from({ length: 228 }, (_, order) => order + 1),
  );
  expect(rows).toHaveLength(2757);
  expect(content.radicals.filter((set) => set.radicalId === "").map((set) => set.radical)).toEqual([
   "巾",
   "彳",
   "冫",
   "玉",
   "小",
   "入",
   "冂",
   "士",
   "夂",
   "夊",
   "寸",
   "尢",
   "屮",
   "巛",
   "工",
   "己",
   "幺",
   "廴",
   "廾",
   "弋",
   "弓",
   "彐",
   "彡",
   "爻",
   "爿",
   "片",
   "玄",
   "缶",
  ]);
  expect(rows.some((row) => /[`*]/u.test(row.components + row.explanation))).toBe(false);
 });

 it("keeps the membership list in sync with the detail package", () => {
  expect([...radicalCharacterForms.forms].sort()).toEqual([...index.notesByForm.keys()].sort());
  expect([...radicalCharacterForms.forms]).toHaveLength(2811);
 });

 it("finds explained characters of a word in reading order, once each", () => {
  expect(explainedCharactersIn("休息，休假")).toEqual(
   [..."休息假"].filter((character) => index.notesByForm.has(character)),
  );
  expect(explainedCharactersIn("abc 123")).toEqual([]);
  expect(radicalCharacterHref("休")).toBe("/radicals/characters/%E4%BC%91");
 });

 it("resolves a simplified or traditional form to its note and primary radical set", () => {
  const [note] = index.notesByForm.get("休") ?? [];
  expect(note).toMatchObject({
   character: { hanzi: "休", pinyin: "xiū", hanViet: "Hưu" },
   radical: { radical: "人", radicalId: "radical-001" },
  });
  expect(index.notesByForm.get("宮")?.[0]?.character.hanzi).toBe("宫");
  expect(findRadicalCharacterSet(index, "帽").map((set) => set.radical)).toEqual(["巾"]);
  expect(findRadicalCharacterSet(index, "解").map((set) => set.radical)).toEqual(["角"]);
  expect(findRadicalCharacterSet(index, "齿").map((set) => set.radical)).toEqual(["齒"]);
  expect(findRadicalCharacterSet(index, "雅").map((set) => set.radical)).toEqual(["隹"]);
  expect(findRadicalCharacterSet(index, "麵").map((set) => set.radical)).toEqual(["麥"]);
  expect(findRadicalCharacterSet(index, "觅").map((set) => set.radical)).toEqual(["見"]);
  expect(findRadicalCharacterSet(index, "房").map((set) => set.radical)).toEqual(["戶"]);
  // Simplified and traditional forms of one row can belong to different radicals.
  expect(findRadicalCharacterSet(index, "辭").map((set) => set.radical)).toEqual(["辛"]);
  expect(findRadicalCharacterSet(index, "離").map((set) => set.radical)).toEqual(["隹"]);
  expect(findRadicalCharacterSet(index, "离").map((set) => set.radical)).toEqual(["禸"]);
  expect(findRadicalCharacterSet(index, "?")).toEqual([]);
 });

 it("orders primary radical notes ahead of cross-reference entries in notesByForm", () => {
  const synthetic = radicalCharactersContentSchema.parse({
   radicals: [
    {
     order: 53,
     radical: "止",
     hanViet: "Chỉ",
     radicalId: "radical-126",
     groups: [
      {
       name: "Cross-ref",
       characters: [
        {
         hanzi: "齿",
         otherForms: [],
         pinyin: "chǐ",
         hanViet: "Xỉ",
         components: "止 + 凵",
         explanation: "[Tra bộ 齿] Cross-reference note under 止.",
        },
       ],
      },
     ],
    },
    {
     order: 54,
     radical: "見",
     hanViet: "Kiến",
     radicalId: "radical-038",
     groups: [
      {
       name: "Simplified radical",
       characters: [
        {
         hanzi: "觅",
         otherForms: ["覓"],
         pinyin: "mì",
         hanViet: "Mịch",
         components: "爫 + 见",
         explanation: "[Tra bộ 见] Primary note under 見/见.",
        },
       ],
      },
     ],
    },
    {
     order: 122,
     radical: "爪",
     hanViet: "Trảo",
     radicalId: "radical-037",
     groups: [
      {
       name: "Alt lookup",
       characters: [
        {
         hanzi: "觅",
         otherForms: [],
         pinyin: "mì",
         hanViet: "Mịch",
         components: "爫 + 见",
         explanation: "[Một số bảng tra Giản thể: bộ 爪(爫) / Khang Hy 覓: bộ 見] Secondary note.",
        },
       ],
      },
     ],
    },
    {
     order: 127,
     radical: "牙",
     hanViet: "Nha",
     radicalId: "radical-082",
     groups: [
      {
       name: "Contains component",
       characters: [
        {
         hanzi: "雅",
         otherForms: [],
         pinyin: "yǎ",
         hanViet: "Nhã",
         components: "牙 + 隹",
         explanation: "[Tra bộ 隹, chứa 牙] Cross-reference note containing 牙.",
        },
       ],
      },
     ],
    },
    {
     order: 176,
     radical: "隹",
     hanViet: "Chuy",
     radicalId: "radical-204",
     groups: [
      {
       name: "Primary",
       characters: [
        {
         hanzi: "雅",
         otherForms: [],
         pinyin: "yǎ",
         hanViet: "Nhã",
         components: "牙 + 隹",
         explanation: "[Tra bộ 隹] Primary note under 隹.",
        },
       ],
      },
     ],
    },
    {
     order: 211,
     radical: "齒",
     hanViet: "Xỉ",
     radicalId: "radical-083",
     groups: [
      {
       name: "Primary",
       characters: [
        {
         hanzi: "齿",
         otherForms: ["齒"],
         pinyin: "chǐ",
         hanViet: "Xỉ",
         components: "Độc thể",
         explanation: "[Tra bộ 齒 / 齿] Primary note under 齒.",
        },
       ],
      },
     ],
    },
   ],
  });

  const syntheticIndex = buildRadicalCharacterIndex(synthetic);

  expect(syntheticIndex.notesByForm.get("齿")?.map((item) => item.radical.order)).toEqual([
   211, 53,
  ]);
  expect(findRadicalCharacterSet(syntheticIndex, "齿").map((set) => set.order)).toEqual([211]);

  expect(syntheticIndex.notesByForm.get("雅")?.map((item) => item.radical.order)).toEqual([
   176, 127,
  ]);
  expect(findRadicalCharacterSet(syntheticIndex, "雅").map((set) => set.order)).toEqual([176]);

  expect(syntheticIndex.notesByForm.get("觅")?.map((item) => item.radical.order)).toEqual([
   54, 122,
  ]);
  expect(findRadicalCharacterSet(syntheticIndex, "觅").map((set) => set.order)).toEqual([54]);
 });
});
