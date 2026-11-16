const toneMarks = new Map(
 [
  ["āáǎà", "a"],
  ["ēéěè", "e"],
  ["īíǐì", "i"],
  ["ōóǒò", "o"],
  ["ūúǔù", "u"],
  ["ǖǘǚǜ", "ü"],
  ["ńňǹ", "n"],
 ].flatMap(([marked, plain]) => [...marked].map((letter) => [letter, plain])),
);

/**
 * The reading half of a canonical word identity; mirrors the SQL function
 * `public.hanzihome_word_pinyin_key`. Multi-character words ignore tone marks so
 * neutral-tone and tone-sandhi spellings reuse one word; a single character keeps
 * its tones, where they separate real readings. A list of readings
 * ("chuán / zhuàn") is keyed by the first one.
 */
export function wordPinyinKey(word: string, pinyin: string): string {
 const [first = ""] = pinyin.split("/");
 const key = first
  .trim()
  .normalize("NFC")
  .toLowerCase()
  .replace(/[\s'’·-]+/gu, "");
 if ([...word.trim()].length <= 1) return key;
 return [...key].map((letter) => toneMarks.get(letter) ?? letter).join("");
}
