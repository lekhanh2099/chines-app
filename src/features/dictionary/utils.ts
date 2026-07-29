import { extractChinese } from "@/lib/chinese-utils";
import type { ExampleItem } from "@/features/dictionary/types";

export const HANZI_CHAR_REGEX = /[\u4e00-\u9fff]/;

export function getUniqueChineseCharacters(text: string): string[] {
 return Array.from(
  new Set(Array.from(extractChinese(text)).filter((character) => HANZI_CHAR_REGEX.test(character))),
 );
}

export function isSentenceLikeQuery(text: string): boolean {
 const normalized = text.trim();
 const chineseOnly = extractChinese(normalized);
 return /[\s\n，。！？；：、,.!?;:]/.test(normalized) || chineseOnly.length >= 6;
}

export function normalizeExample(example: {
 cn?: string;
 zh?: string;
 pinyin?: string;
 py?: string;
 vi?: string;
 note?: string;
}): ExampleItem {
 return {
  zh: example.zh || example.cn || "",
  pinyin: example.pinyin || example.py || "",
  vi: example.vi || "",
  note: example.note || undefined,
 };
}

export function getExampleKey(example: ExampleItem): string {
 return `${example.zh}|${example.pinyin}|${example.vi}`;
}
