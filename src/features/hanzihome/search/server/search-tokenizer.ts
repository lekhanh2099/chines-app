import { normalizeSearchText } from "../normalize";

const hanCharacterPattern = /\p{Script=Han}/u;
const textSegmentPattern = /\p{Script=Han}+|[^\p{Script=Han}]+/gu;
const latinTokenPattern = /[\p{L}\p{N}]+/gu;
/** Space-free pinyin is only meaningful for word-sized values such as "tuán jù". */
const MAX_COMPACT_PINYIN_SYLLABLES = 6;

export function isHanText(value: string) {
 return hanCharacterPattern.test(value);
}

function textSegments(text: string) {
 return text.match(textSegmentPattern) ?? [];
}

/** Diacritic-insensitive Vietnamese/pinyin word tokens ("Đoàn tụ" → ["doan", "tu"]). */
export function latinTokens(text: string) {
 return Array.from(normalizeSearchText(text).matchAll(latinTokenPattern), (match) => match[0]);
}

function hanCharacters(run: string) {
 return Array.from(run);
}

function hanBigrams(characters: readonly string[]) {
 const bigrams: string[] = [];
 for (let index = 0; index < characters.length - 1; index += 1) {
  bigrams.push(`${characters[index]}${characters[index + 1]}`);
 }
 return bigrams;
}

/** Index side: every Han run contributes its characters and adjacent pairs. */
export function tokenizeForIndex(text: string) {
 const tokens: string[] = [];
 for (const segment of textSegments(text)) {
  if (isHanText(segment)) {
   const characters = hanCharacters(segment);
   tokens.push(...characters, ...hanBigrams(characters));
  } else {
   tokens.push(...latinTokens(segment));
  }
 }
 return tokens;
}

const pinyinSyllablePattern =
 /^(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(?:iang|iong|uang|ueng|ang|eng|ing|ong|iao|ian|uai|uan|ai|ei|ao|ou|an|en|er|ia|ie|iu|in|ua|uo|ui|un|ue|ve|a|o|e|i|u|v)$/u;
const MAX_PINYIN_SYLLABLE_LENGTH = 6;
const MAX_SPLIT_PINYIN_LENGTH = 36;

/**
 * Splits space-free toneless pinyin ("tuanju") into syllables (["tuan", "ju"]),
 * preferring longer syllables and backtracking; empty when it is not pinyin.
 */
export function splitPinyinSyllables(token: string): string[] {
 if (!token || token.length > MAX_SPLIT_PINYIN_LENGTH || !/^[a-z]+$/u.test(token)) return [];
 for (let length = Math.min(MAX_PINYIN_SYLLABLE_LENGTH, token.length); length > 0; length -= 1) {
  const syllable = token.slice(0, length);
  if (!pinyinSyllablePattern.test(syllable)) continue;
  if (length === token.length) return [syllable];
  const rest = splitPinyinSyllables(token.slice(length));
  if (rest.length > 0) return [syllable, ...rest];
 }
 return [];
}

/**
 * Toneless pinyin for the pinyin field: syllables, the space-free word form of
 * short values ("tuán jù" → "tuanju") and the syllables of space-free words
 * ("tuánjù" → "tuan", "ju"), so either spelling of a query matches.
 */
export function tokenizePinyinForIndex(text: string) {
 const words = latinTokens(text);
 const tokens = [...words];
 if (words.length > 1 && words.length <= MAX_COMPACT_PINYIN_SYLLABLES) {
  tokens.push(words.join(""));
 }
 if (words.length <= MAX_COMPACT_PINYIN_SYLLABLES) {
  for (const word of words) {
   const syllables = splitPinyinSyllables(word);
   if (syllables.length > 1) tokens.push(...syllables);
  }
 }
 return tokens;
}

/**
 * Query side: a Han run of two or more characters is represented by its
 * bigrams only, so AND-combining the terms requires adjacent characters
 * instead of matching every document that contains one of them.
 */
export function tokenizeQuery(text: string) {
 const tokens: string[] = [];
 for (const segment of textSegments(text)) {
  if (isHanText(segment)) {
   const characters = hanCharacters(segment);
   tokens.push(...(characters.length === 1 ? characters : hanBigrams(characters)));
  } else {
   tokens.push(...latinTokens(segment));
  }
 }
 return [...new Set(tokens)];
}

/**
 * Text fragments used to locate a match for snippets and highlighting, most
 * specific first: a multi-word Latin phrase, whole Han runs and Latin words,
 * then Han bigrams.
 */
export function queryNeedles(text: string) {
 const primary: string[] = [];
 const fallback: string[] = [];
 for (const segment of textSegments(text)) {
  if (isHanText(segment)) {
   primary.push(segment);
   fallback.push(...hanBigrams(hanCharacters(segment)));
  } else {
   primary.push(...latinTokens(segment));
  }
 }
 const phrase = primary.length > 1 && !isHanText(text) ? [primary.join(" ")] : [];
 return { phrase, primary, fallback };
}
