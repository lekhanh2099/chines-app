import { describe, expect, it } from "vitest";

import {
 latinTokens,
 splitPinyinSyllables,
 queryNeedles,
 tokenizeForIndex,
 tokenizePinyinForIndex,
 tokenizeQuery,
} from "./search-tokenizer";

describe("search tokenizer", () => {
 it("indexes Han runs as unigrams plus adjacent bigrams", () => {
  expect(tokenizeForIndex("一家人团聚")).toEqual([
   "一",
   "家",
   "人",
   "团",
   "聚",
   "一家",
   "家人",
   "人团",
   "团聚",
  ]);
 });

 it("does not create bigrams across punctuation or Latin text", () => {
  expect(tokenizeForIndex("过年，团聚 Tết")).toEqual([
   "过",
   "年",
   "过年",
   "团",
   "聚",
   "团聚",
   "tet",
  ]);
 });

 it("queries a multi-character Han run by bigrams and a single character by itself", () => {
  expect(tokenizeQuery("团聚")).toEqual(["团聚"]);
  expect(tokenizeQuery("年夜饭")).toEqual(["年夜", "夜饭"]);
  expect(tokenizeQuery("团")).toEqual(["团"]);
  expect(tokenizeQuery("团聚 đoàn tụ")).toEqual(["团聚", "doan", "tu"]);
 });

 it("folds Vietnamese diacritics and đ in Latin tokens", () => {
  expect(latinTokens("Đoàn tụ, GIA ĐÌNH!")).toEqual(["doan", "tu", "gia", "dinh"]);
  expect(tokenizeQuery("doan tu")).toEqual(tokenizeQuery("Đoàn Tụ"));
 });

 it("indexes toneless pinyin syllables and their space-free word form", () => {
  expect(tokenizePinyinForIndex("tuán jù")).toEqual(["tuan", "ju", "tuanju"]);
  expect(tokenizePinyinForIndex("tuánjù")).toEqual(["tuanju", "tuan", "ju"]);
  expect(tokenizePinyinForIndex("lǜsè")).toEqual(["luse", "lu", "se"]);
  expect(tokenizePinyinForIndex("Xi'ān")).toEqual(["xi", "an", "xian"]);
  expect(tokenizeQuery("tuanju")).toEqual(["tuanju"]);
  expect(tokenizeQuery("tuán jù")).toEqual(["tuan", "ju"]);
 });

 it("does not join long pinyin passages into a single token", () => {
  const passage = "Zhè lǐ de lù miàn xiǎo qiáo hé àn quán yóu";
  expect(tokenizePinyinForIndex(passage)).toEqual(latinTokens(passage));
 });

 it("orders snippet needles from whole runs to bigram fallbacks", () => {
  expect(queryNeedles("团聚了 Tết")).toEqual({
   phrase: [],
   primary: ["团聚了", "tet"],
   fallback: ["团聚", "聚了"],
  });
  expect(queryNeedles("ca nha doan tu").phrase).toEqual(["ca nha doan tu"]);
 });

 it("splits space-free pinyin into syllables and rejects non-pinyin words", () => {
  expect(splitPinyinSyllables("tuanju")).toEqual(["tuan", "ju"]);
  expect(splitPinyinSyllables("zhongguoren")).toEqual(["zhong", "guo", "ren"]);
  expect(splitPinyinSyllables("xian")).toEqual(["xian"]);
  expect(splitPinyinSyllables("hanzihome")).toEqual(["han", "zi", "ho", "me"]);
  expect(splitPinyinSyllables("vocabulary")).toEqual([]);
  expect(splitPinyinSyllables("")).toEqual([]);
 });
});
