import { extractChinese } from "@/lib/chinese-utils";
import type { ExampleItem } from "@/features/dictionary/types";

export const HANZI_CHAR_REGEX = /[\u4e00-\u9fff]/;

export function getUniqueChineseCharacters(text: string): string[] {
 return Array.from(
  new Set(
   Array.from(extractChinese(text)).filter((character) =>
    HANZI_CHAR_REGEX.test(character),
   ),
  ),
 );
}

export function isSentenceLikeQuery(text: string): boolean {
 const normalized = text.trim();
 const chineseOnly = extractChinese(normalized);
 return (
  /[\s\n，。！？；：、,.!?;:]/.test(normalized) || chineseOnly.length >= 6
 );
}

export function normalizeExample(example: {
 cn?: string;
 zh?: string;
 pinyin?: string;
 py?: string;
 vi?: string;
}): ExampleItem {
 return {
  zh: example.zh || example.cn || "",
  pinyin: example.pinyin || example.py || "",
  vi: example.vi || "",
 };
}

export function getExampleKey(example: ExampleItem): string {
 return `${example.zh}|${example.pinyin}|${example.vi}`;
}

export function getToneLabel(pinyin: string | null | undefined): string {
 if (!pinyin) return "Chưa rõ";

 const toneMap: Record<string, string> = {
  ā: "1",
  ē: "1",
  ī: "1",
  ō: "1",
  ū: "1",
  ǖ: "1",
  á: "2",
  é: "2",
  í: "2",
  ó: "2",
  ú: "2",
  ǘ: "2",
  ǎ: "3",
  ě: "3",
  ǐ: "3",
  ǒ: "3",
  ǔ: "3",
  ǚ: "3",
  à: "4",
  è: "4",
  ì: "4",
  ò: "4",
  ù: "4",
  ǜ: "4",
 };

 const tones = Array.from(
  new Set(
   Array.from(pinyin)
    .map((character) => toneMap[character])
    .filter((tone): tone is string => Boolean(tone)),
  ),
 );

 if (!tones.length) return "Thanh nhẹ";
 if (tones.length === 1) return `Thanh ${tones[0]}`;
 return `Thanh ${tones.join(", ")}`;
}
