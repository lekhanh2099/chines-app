import { describe, expect, it } from "vitest";
import {
 analyzeContextualPronunciation,
 formatContextualPinyinRange,
 formatContextualSpokenPinyin,
} from "./contextual-pronunciation";

describe("HanziHome contextual pronunciation", () => {
 it("keeps lexical and tone-sandhi readings aligned to Hanzi graphemes", () => {
  const result = analyzeContextualPronunciation({ text: "一不" });
  expect(result.glyphs).toHaveLength(2);
  expect(result.glyphs[0]?.lexicalReadingKey).toBe("yi1");
  expect(result.glyphs[0]?.spokenReadingKey).toBe("yi2");
  expect(result.glyphs[1]?.lexicalReadingKey).toBe("bu4");
  expect(result.glyphs[1]?.spokenReadingKey).toBe("bu4");
 });

 it("accepts exact source pinyin and reports rejected alignment", () => {
  const aligned = analyzeContextualPronunciation({ text: "中国", sourcePinyin: "Zhōng guó" });
  expect(aligned.sourcePinyinStatus).toBe("aligned");
  expect(aligned.glyphs.map((glyph) => glyph.evidence[0])).toEqual([
   "source-pinyin",
   "source-pinyin",
  ]);

  const rejected = analyzeContextualPronunciation({ text: "中国", sourcePinyin: "hǎo" });
  expect(rejected.sourcePinyinStatus).toBe("rejected");
  expect(rejected.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["zhong1", "guo2"]);
  expect(rejected.unresolved).toHaveLength(0);

  const concatenated = analyzeContextualPronunciation({
   text: "浙江省",
   sourcePinyin: "Zhèjiāng shěng",
  });
  expect(concatenated.sourcePinyinStatus).toBe("aligned");

  const erhua = analyzeContextualPronunciation({
   text: "哪儿，这儿。",
   sourcePinyin: "nǎ'er, zhèr.",
  });
  expect(erhua.sourcePinyinStatus).toBe("aligned");
  expect(erhua.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([
   "na3",
   "er2",
   "zhe4",
   "er2",
  ]);
 });

 it("lets an explicit manual confirmation override the displayed pronunciation", () => {
  const result = analyzeContextualPronunciation({
   text: "行",
   overrides: [
    {
     id: "override-1",
     text: "行",
     readings: ["xing2"],
     scope: "character-global",
     sentenceText: null,
     start: null,
     end: null,
     updatedAt: "2026-08-14T00:00:00.000Z",
    },
   ],
  });
  expect(result.glyphs[0]?.lexicalReadingKey).toBe("xing2");
  expect(result.glyphs[0]?.spokenReadingKey).toBe("xing2");
  expect(result.glyphs[0]?.confidence).toBe(1);
  expect(result.glyphs[0]?.evidence).toEqual(["manual-override"]);
  expect(formatContextualSpokenPinyin(result)).toBe("xíng");
 });

 it("applies phrase overrides one Hanzi at a time", () => {
  const result = analyzeContextualPronunciation({
   text: "银行",
   overrides: [
    {
     id: "phrase-1",
     text: "银行",
     readings: ["yin2", "yin2"],
     scope: "phrase",
     sentenceText: null,
     start: null,
     end: null,
     updatedAt: "2026-08-14T00:00:00.000Z",
    },
   ],
  });
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["yin2", "yin2"]);
  expect(result.glyphs.map((glyph) => glyph.spokenReadingKey)).toEqual(["yin2", "yin2"]);
  expect(result.glyphs.every((glyph) => glyph.evidence[0] === "manual-override")).toBe(true);
 });

 it("does not present unresolved polyphonic output as certain", () => {
  const result = analyzeContextualPronunciation({ text: "行" });
  expect(result.glyphs[0]?.isPolyphonic).toBe(true);
  expect(result.glyphs[0]?.confidence).toBe(0.55);
 });

 it("uses an aligned lesson-vocabulary phrase before the contextual fallback", () => {
  const result = analyzeContextualPronunciation({ text: "银行行长。", sourcePinyin: null }, [
   { id: "bank", text: "银行", pinyin: "yín háng", priority: 2 },
   { id: "manager", text: "行长", pinyin: "háng zhǎng", priority: 1 },
  ]);
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([
   "yin2",
   "hang2",
   "hang2",
   "zhang3",
  ]);
  expect(result.glyphs.slice(2, 4).map((glyph) => glyph.evidence)).toEqual([
   ["dictionary-exact"],
   ["dictionary-exact"],
  ]);

  const sourceWins = analyzeContextualPronunciation({ text: "行长", sourcePinyin: "xíng cháng" }, [
   { id: "manager", text: "行长", pinyin: "háng zhǎng", priority: 1 },
  ]);
  expect(sourceWins.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual(["xing2", "chang2"]);
  expect(sourceWins.glyphs.map((glyph) => glyph.evidence)).toEqual([
   ["source-pinyin"],
   ["source-pinyin"],
  ]);
 });

 it("preserves the curated polyphonic and tone-sandhi corpus readings", () => {
  const result = analyzeContextualPronunciation({
   text: "银行行长还没有还钱。",
   sourcePinyin: "yín háng háng zhǎng hái méi yǒu huán qián。",
  });
  expect(result.sourcePinyinStatus).toBe("aligned");
  expect(result.glyphs.map((glyph) => glyph.lexicalReadingKey)).toEqual([
   "yin2",
   "hang2",
   "hang2",
   "zhang3",
   "hai2",
   "mei2",
   "you3",
   "huan2",
   "qian2",
  ]);
  expect(result.glyphs[1]?.alternatives).toContain("xing2");

  const classifier = analyzeContextualPronunciation({ text: "一个", sourcePinyin: "yī gè" });
  expect(classifier.glyphs[0]?.lexicalReadingKey).toBe("yi1");
  expect(classifier.glyphs[0]?.spokenReadingKey).toBe("yi2");
 });

 it("formats contextual spoken pinyin without losing punctuation", () => {
  const analysis = analyzeContextualPronunciation({ text: "一个人。" });
  expect(formatContextualSpokenPinyin(analysis)).toBe("yí gè rén。");
 });

 it("formats the selected pinyin range for the Reader selection toolbar", () => {
  const analysis = analyzeContextualPronunciation({
   text: "浙江省绍",
   sourcePinyin: "Zhèjiāng shěng shào",
  });
  expect(formatContextualPinyinRange(analysis, 0, 4)).toBe("zhè jiāng shěng shào");
 });
});
