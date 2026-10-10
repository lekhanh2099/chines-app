import { describe, expect, it } from "vitest";
import {
 analyzeContextualPronunciation,
 formatContextualPinyinRange,
 formatContextualReadingPinyin,
 formatContextualReadingUnitPinyin,
 formatContextualSpokenPinyin,
 getContextualReadingUnits,
} from "./contextual-pronunciation";

describe("HanziHome contextual pronunciation", () => {
 it("accepts source neutral tones without discarding the rest of a reading paragraph", () => {
  const result = analyzeContextualPronunciation({
   text: "国王的乐队有三百个吹竽的人，优美的音乐让他听得入迷。",
   sourcePinyin:
    "guó wáng de yuè duì yǒu sān bǎi ge chuī yú de rén，yōu měi de yīn yuè ràng tā tīng de rù mí。",
  });
  expect(result.sourcePinyinStatus).toBe("aligned");
  expect(result.glyphs.find((glyph) => glyph.text === "个")?.spokenReadingKey).toBe("ge5");
  expect(result.glyphs.find((glyph) => glyph.text === "得")?.spokenReadingKey).toBe("de5");
  expect(result.glyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))).toBe(true);
 });

 it.each([
  ["优美的音乐让他听得入迷。", "de5"],
  ["而且吹得不比他们中的任何一位差。", "de5"],
  ["既然你的盾坚固得什么矛都刺不进去。", "de5"],
  ["想得通", "de5"],
  ["看得开", "de5"],
  ["他得到了奖品。", "de2"],
  ["我得去上课。", "dei3"],
 ])("resolves 得 in its phrase context: %s", (text, reading) => {
  const result = analyzeContextualPronunciation({ text });
  expect(result.glyphs.find((glyph) => glyph.text === "得")?.spokenReadingKey).toBe(reading);
 });

 it("reads potential complements in the actual 差不多先生 paragraph", () => {
  const text =
   "他死后，大家都称赞差不多先生样样事情看得开，想得通；大家都说他一生不肯认真，不肯算账，不肯计较，真是一位有德行的人。于是大家给他取了个死后的法号，叫他圆通大师。";
  const result = analyzeContextualPronunciation({ text });
  const complements = result.glyphs.filter((glyph) => glyph.text === "得");
  expect(complements.map((glyph) => glyph.spokenReadingKey)).toEqual(["de5", "de5"]);
  expect(complements.map((glyph) => glyph.evidence)).toEqual([
   ["dictionary-exact"],
   ["dictionary-exact"],
  ]);
  const phraseStart = text.indexOf("看得开");
  expect(formatContextualPinyinRange(result, phraseStart, phraseStart + 3)).toBe("kàn de kāi");
  const thinkStart = text.indexOf("想得通");
  expect(formatContextualPinyinRange(result, thinkStart, thinkStart + 3)).toBe("xiǎng de tōng");
  expect(result.glyphs.find((glyph) => glyph.text === "德")?.spokenReadingKey).toBe("de2");
 });

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
  expect(classifier.glyphs[0]?.spokenReadingKey).toBe("yi1");

  const autoDetected = analyzeContextualPronunciation({ text: "一个" });
  expect(autoDetected.glyphs[0]?.spokenReadingKey).toBe("yi2");
 });

 it("resolves 还款 phrases to huán even without source pinyin", () => {
  const sentence = analyzeContextualPronunciation({
   text: "谢谢。我想再了解一下还款方式。",
  });
  const huanGlyph = sentence.glyphs.find((glyph) => glyph.text === "还");
  const kuanGlyph = sentence.glyphs.find((glyph) => glyph.text === "款");
  expect(huanGlyph?.spokenPinyin).toBe("huán");
  expect(huanGlyph?.lexicalReadingKey).toBe("huan2");
  expect(kuanGlyph?.spokenPinyin).toBe("kuǎn");
 });

 it("distinguishes 还 (hái) vs 还 (huán) in complex sentences", () => {
  const sentence = analyzeContextualPronunciation({
   text: "银行职员还介绍了两种还款方式。",
  });
  const huanGlyphs = sentence.glyphs.filter((glyph) => glyph.text === "还");
  expect(huanGlyphs).toHaveLength(2);
  expect(huanGlyphs[0]?.spokenPinyin).toBe("hái");
  expect(huanGlyphs[1]?.spokenPinyin).toBe("huán");
 });

 it("formats contextual spoken pinyin without losing punctuation", () => {
  const analysis = analyzeContextualPronunciation({ text: "一个人。" });
  expect(formatContextualSpokenPinyin(analysis)).toBe("yí gè rén。");
 });

 it.each([
  ["他不太伤心。", ["他", "不", "太", "伤心", "。"], "tā bú tài shāngxīn。"],
  ["我不知道怎么回答。", ["我", "不", "知道", "怎么", "回答", "。"], "wǒ bù zhīdào zěnme huídá。"],
  ["一个人。", ["一", "个", "人", "。"], "yí gè rén。"],
  ["我得去上课。", ["我", "得", "去", "上课", "。"], "wǒ děi qù shàngkè。"],
  ["听得入迷", ["听", "得", "入迷"], "tīng de rùmí"],
  ["很好的朋友", ["很", "好", "的", "朋友"], "hěn hǎo de péngyou"],
  ["我明白", ["我", "明白"], "wǒ míngbai"],
 ])("groups reviewed reading units for %s", (text, units, pinyin) => {
  const analysis = analyzeContextualPronunciation({ text });
  expect(getContextualReadingUnits(analysis).map((unit) => unit.text)).toEqual(units);
  expect(formatContextualReadingPinyin(analysis)).toBe(pinyin);
 });

 it("keeps textbook compound words together when ICU splits their characters", () => {
  const analysis = analyzeContextualPronunciation({ text: "下班骑自行车回家，冰激凌" });
  const units = getContextualReadingUnits(analysis);
  const bicycle = units.find((unit) => unit.text === "自行车");
  const iceCream = units.find((unit) => unit.text === "冰激凌");

  expect(units.map((unit) => unit.text)).toEqual(["下班", "骑", "自行车", "回家", "，", "冰激凌"]);
  if (bicycle === undefined || iceCream === undefined) {
   throw new Error("Expected both textbook compound words to have reading units.");
  }
  expect(formatContextualReadingUnitPinyin(analysis, bicycle)).toBe("zìxíngchē");
  expect(formatContextualReadingUnitPinyin(analysis, iceCream)).not.toBeNull();
 });

 it("keeps source-selected readings while grouping auto pinyin", () => {
  const analysis = analyzeContextualPronunciation({
   text: "他不太伤心。",
   sourcePinyin: "tā bù tài shāng xīn。",
  });
  expect(analysis.sourcePinyinStatus).toBe("aligned");
  expect(formatContextualReadingPinyin(analysis)).toBe("tā bù tài shāngxīn。");
 });

 it("keeps pinyin separators in the annotation layer", () => {
  const analysis = analyzeContextualPronunciation({ text: "西安女儿。" });
  expect(getContextualReadingUnits(analysis).map((unit) => unit.text)).toEqual([
   "西安",
   "女儿",
   "。",
  ]);
  expect(formatContextualReadingPinyin(analysis)).toBe("xī'ān nǚ'ér。");
  expect(analysis.normalizedText).toBe("西安女儿。");
 });

 it("preserves non-Hanzi source text while grouping Hanzi units", () => {
  const analysis = analyzeContextualPronunciation({ text: "HSK 4，2026年。" });
  expect(formatContextualReadingPinyin(analysis)).toBe("HSK 4，2026nián。");
 });

 it("keeps pronunciation review tokens independent from reading units", () => {
  const analysis = analyzeContextualPronunciation({ text: "我得去上课。" });
  expect(analysis.tokens.map((token) => token.text)).toEqual(["我得去", "上", "课", "。"]);
  expect(getContextualReadingUnits(analysis).map((unit) => unit.text)).toEqual([
   "我",
   "得",
   "去",
   "上课",
   "。",
  ]);
 });

 it("formats the selected pinyin range for the Reader selection toolbar", () => {
  const analysis = analyzeContextualPronunciation({
   text: "浙江省绍",
   sourcePinyin: "Zhèjiāng shěng shào",
  });
  expect(formatContextualPinyinRange(analysis, 0, 4)).toBe("zhè jiāng shěng shào");
 });
});
