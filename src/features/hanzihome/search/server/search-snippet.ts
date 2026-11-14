import { isHanText } from "./search-tokenizer";

const LATIN_CONTEXT = { before: 25, after: 45 };
/** Han characters render about twice as wide, so a CJK snippet keeps fewer of them. */
const HAN_CONTEXT = { before: 12, after: 24 };
const ELLIPSIS = "…";

function foldCharacter(character: string) {
 return character
  .toLocaleLowerCase("vi-VN")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/đ/g, "d");
}

/** Lowercased, diacritic-free text plus the original offset of every folded code unit. */
function foldWithOffsets(text: string) {
 let folded = "";
 const offsets: number[] = [];
 let originalOffset = 0;
 for (const character of text) {
  const foldedCharacter = foldCharacter(character);
  for (let index = 0; index < foldedCharacter.length; index += 1) offsets.push(originalOffset);
  folded += foldedCharacter;
  originalOffset += character.length;
 }
 offsets.push(originalOffset);
 return { folded, offsets };
}

const wordCharacterPattern = /[\p{L}\p{N}]/u;

/** First occurrence of a needle; a Latin needle must start at a word boundary. */
function indexOfNeedle(folded: string, needle: string) {
 const requiresBoundary = !isHanText(needle);
 for (let index = folded.indexOf(needle); index >= 0; index = folded.indexOf(needle, index + 1)) {
  if (!requiresBoundary || index === 0 || !wordCharacterPattern.test(folded[index - 1] ?? "")) {
   return index;
  }
 }
 return -1;
}

/** Earliest match of any needle; `index` is -1 when none occurs. */
function findFirstMatch(folded: string, needles: readonly string[]) {
 const best = { index: -1, length: 0 };
 for (const needle of needles) {
  const foldedNeedle = Array.from(needle, foldCharacter).join("");
  if (!foldedNeedle) continue;
  const index = indexOfNeedle(folded, foldedNeedle);
  if (index >= 0 && (best.index < 0 || index < best.index)) {
   best.index = index;
   best.length = foldedNeedle.length;
  }
 }
 return best;
}

export function textContainsNeedle(text: string, needles: readonly string[]) {
 return findFirstMatch(foldWithOffsets(text).folded, needles).index >= 0;
}

/**
 * Returns a short window of the original text around the first match of the
 * most specific needle tier, or undefined when no needle occurs in the text.
 */
export function buildSearchSnippet(text: string, needleTiers: readonly (readonly string[])[]) {
 if (!text) return undefined;
 const { folded, offsets } = foldWithOffsets(text);
 for (const needles of needleTiers) {
  const match = findFirstMatch(folded, needles);
  if (match.index < 0) continue;

  const start = offsets[match.index] ?? 0;
  const end = offsets[match.index + match.length] ?? text.length;
  const matchedText = text.slice(start, end);
  const context = isHanText(matchedText) ? HAN_CONTEXT : LATIN_CONTEXT;
  const windowStart = Math.max(0, start - context.before);
  const windowEnd = Math.min(text.length, end + context.after);
  const body = text.slice(windowStart, windowEnd).replace(/\s+/g, " ").trim();
  return {
   snippet: `${windowStart > 0 ? ELLIPSIS : ""}${body}${windowEnd < text.length ? ELLIPSIS : ""}`,
   matchedText,
  };
 }
 return undefined;
}
