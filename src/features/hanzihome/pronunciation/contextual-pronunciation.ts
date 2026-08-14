import { convert, pinyin, polyphonic } from "pinyin-pro";
import { z } from "zod";

const readingKeySchema = z.string().regex(/^[a-zv]+[1-5]$/u);
const tokenTypeSchema = z.enum(["hanzi", "latin", "number", "punctuation", "whitespace", "other"]);
const evidenceSchema = z.enum([
 "manual-override",
 "dictionary-exact",
 "source-pinyin",
 "context-library",
 "fallback",
]);

const requestSchema = z.strictObject({
 text: z.string().min(1).max(2_000),
 sourcePinyin: z.string().max(8_000).nullable().default(null),
 overrides: z
  .array(
   z.strictObject({
    id: z.string().min(1),
    text: z.string().min(1),
    readings: z.array(readingKeySchema).min(1),
    scope: z.enum(["character-global", "phrase", "sentence-instance"]),
    sentenceText: z.string().nullable().default(null),
    start: z.number().int().nonnegative().nullable().default(null),
    end: z.number().int().positive().nullable().default(null),
    updatedAt: z.string(),
   }),
  )
  .default([]),
});

export type ContextualPronunciationRequest = z.input<typeof requestSchema>;
export type PronunciationEvidence = z.infer<typeof evidenceSchema>;
export type PronunciationTokenType = z.infer<typeof tokenTypeSchema>;

export type PronunciationDictionaryEntry = {
 id: string;
 text: string;
 pinyin: string;
 priority: number;
};

export type PronunciationOverride = z.output<typeof requestSchema>["overrides"][number];

export type ContextualPronunciationGlyph = {
 text: string;
 start: number;
 end: number;
 lexicalPinyin: string | null;
 spokenPinyin: string | null;
 lexicalReadingKey: string | null;
 spokenReadingKey: string | null;
 isPolyphonic: boolean;
 alternatives: string[];
 confidence: number;
 evidence: PronunciationEvidence[];
};

export type ContextualPronunciationToken = {
 id: string;
 text: string;
 start: number;
 end: number;
 type: PronunciationTokenType;
 source: "dictionary-exact" | "intl-segmenter" | "grapheme";
 pinyin: string;
};

export type ContextualPronunciationAnalysis = {
 originalText: string;
 normalizedText: string;
 tokens: ContextualPronunciationToken[];
 glyphs: ContextualPronunciationGlyph[];
 unresolved: Array<{
  start: number;
  end: number;
  text: string;
  reason: "pronunciation-unavailable";
 }>;
 sourcePinyinStatus: "not-provided" | "aligned" | "rejected";
};

const hanziPattern = /\p{Script=Han}/u;
const latinPattern = /^\p{Script=Latin}+$/u;
const numberPattern = /^\p{Number}+$/u;
const punctuationPattern = /^[\p{Punctuation}\p{Symbol}]+$/u;

function classify(value: string): PronunciationTokenType {
 if (/^\s+$/u.test(value)) return "whitespace";
 if (hanziPattern.test(value)) return "hanzi";
 if (latinPattern.test(value)) return "latin";
 if (numberPattern.test(value)) return "number";
 if (punctuationPattern.test(value)) return "punctuation";
 return "other";
}

function normalizeReading(value: string): string | null {
 const direct = /^([a-zv]+)([1-5])$/u.exec(
  value.normalize("NFC").toLocaleLowerCase().replaceAll("u:", "v").replaceAll("ü", "v"),
 );
 if (direct !== null) return `${direct[1]}${direct[2]}`;
 const converted = convert(value, { format: "symbolToNum" });
 const compact = converted
  .normalize("NFC")
  .toLocaleLowerCase()
  .replaceAll("u:", "v")
  .replaceAll("ü", "v")
  .replace(/[^a-zv1-5]/gu, "");
 const match = /^([a-zv]+)([1-5])$/u.exec(compact);
 return match === null ? null : `${match[1]}${match[2]}`;
}

function displayPinyin(key: string | null): string | null {
 if (key === null) return null;
 return convert(key, { format: "numToSymbol" });
}

function readingKeys(value: string[] | undefined): string[] {
 if (value === undefined) return [];
 return value.flatMap((item) => {
  const key = normalizeReading(item);
  return key === null ? [] : [key];
 });
}

function sourcePinyinKeys(value: string): string[] {
 const converted = convert(value, { format: "symbolToNum" });
 const compact = (typeof converted === "string" ? converted : value)
  .normalize("NFC")
  .toLocaleLowerCase()
  .replaceAll("u:", "v")
  .replaceAll("ü", "v");
 return compact.split(/[\s'’-]+/u).flatMap((syllable) => {
  const match = /^([a-zv]+)([1-5])?$/u.exec(syllable.replace(/[^a-zv1-5]/gu, ""));
  if (match === null) return [];
  return [`${match[1]}${match[2] ?? "5"}`];
 });
}

function overrideReadingForGlyph(
 overrides: PronunciationOverride[],
 grapheme: { segment: string; index: number },
 sentenceText: string,
): { key: string } | null {
 const candidates: Array<{ key: string; override: PronunciationOverride }> = [];
 for (const override of overrides) {
  const starts: number[] = [];
  if (override.scope === "sentence-instance") {
   if (
    override.sentenceText?.normalize("NFC") === sentenceText.normalize("NFC") &&
    override.start !== null
   )
    starts.push(override.start);
  } else {
   for (
    let start = sentenceText.indexOf(override.text);
    start >= 0;
    start = sentenceText.indexOf(override.text, start + 1)
   ) {
    starts.push(start);
   }
  }
  for (const start of starts) {
   if (!sentenceText.startsWith(override.text, start)) continue;
   if (grapheme.index < start || grapheme.index >= start + override.text.length) continue;
   const phraseGraphemes = [
    ...new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(override.text),
   ];
   const offset = phraseGraphemes.findIndex((item) => item.index + start === grapheme.index);
   const key = offset >= 0 ? override.readings[offset] : undefined;
   if (key !== undefined) candidates.push({ key, override });
  }
 }
 candidates.sort(
  (left, right) =>
   right.override.text.length - left.override.text.length ||
   right.override.updatedAt.localeCompare(left.override.updatedAt),
 );
 const selected = candidates[0];
 return selected === undefined ? null : { key: selected.key };
}

function dictionaryToken(
 text: string,
 start: number,
 dictionary: PronunciationDictionaryEntry[],
): PronunciationDictionaryEntry | null {
 const candidates = dictionary
  .filter((entry) => text.startsWith(entry.text, start))
  .sort((left, right) => right.text.length - left.text.length || right.priority - left.priority);
 return candidates[0] ?? null;
}

function alignSourceKeys(
 keys: string[],
 lexicalReadings: string[],
 spokenReadings: string[],
 alternatives: string[][],
): string[] | null {
 if (keys.length !== lexicalReadings.length || keys.length !== spokenReadings.length) return null;
 return keys.every((key, index) => {
  const lexical = lexicalReadings[index];
  const spoken = spokenReadings[index];
  return key === lexical || key === spoken || (alternatives[index] ?? []).includes(key);
 })
  ? keys
  : null;
}

export function analyzeContextualPronunciation(
 input: ContextualPronunciationRequest,
 dictionary: PronunciationDictionaryEntry[] = [],
): ContextualPronunciationAnalysis {
 const request = requestSchema.parse(input);
 const originalText = request.text;
 const normalizedText = originalText.normalize("NFC");
 const graphemes = [
  ...new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(normalizedText),
 ];
 const hanziCount = graphemes.filter((item) => classify(item.segment) === "hanzi").length;
 let lexicalValues: string[] = [];
 let spokenValues: string[] = [];
 let alternatives: string[][] = [];
 try {
  const lexical = pinyin(normalizedText, {
   type: "array",
   toneType: "num",
   toneSandhi: false,
   nonZh: "removed",
   v: true,
  });
  const spoken = pinyin(normalizedText, {
   type: "array",
   toneType: "num",
   toneSandhi: true,
   nonZh: "removed",
   v: true,
  });
  const polyphonicValues = polyphonic(normalizedText, {
   type: "array",
   toneType: "num",
   nonZh: "removed",
   v: true,
  });
  if (!Array.isArray(lexical) || !Array.isArray(spoken) || !Array.isArray(polyphonicValues)) {
   throw new Error("pinyin-pro returned a non-array result");
  }
  lexicalValues = lexical.flatMap((item) =>
   normalizeReading(item) === null ? [] : [normalizeReading(item) ?? ""],
  );
  spokenValues = spoken.flatMap((item) =>
   normalizeReading(item) === null ? [] : [normalizeReading(item) ?? ""],
  );
  alternatives = polyphonicValues.map((item) => readingKeys(item));
 } catch {
  lexicalValues = [];
  spokenValues = [];
  alternatives = [];
 }

 const readingsAligned =
  lexicalValues.length === hanziCount &&
  spokenValues.length === hanziCount &&
  alternatives.length === hanziCount;
 const sourceKeys = request.sourcePinyin === null ? null : sourcePinyinKeys(request.sourcePinyin);
 const sourceAlignment =
  sourceKeys === null
   ? null
   : alignSourceKeys(sourceKeys, lexicalValues, spokenValues, alternatives);
 const sourceAligned = sourceKeys === null || sourceAlignment !== null;
 const glyphs: ContextualPronunciationGlyph[] = [];
 let hanziIndex = 0;
 for (const item of graphemes) {
  const type = classify(item.segment);
  if (type !== "hanzi") continue;
  const lexicalKey = readingsAligned ? (lexicalValues[hanziIndex] ?? null) : null;
  const spokenKey = readingsAligned ? (spokenValues[hanziIndex] ?? null) : null;
  const keys = readingsAligned ? (alternatives[hanziIndex] ?? []) : [];
  const overrideMatch = overrideReadingForGlyph(request.overrides, item, originalText);
  const overrideKey = overrideMatch?.key ?? null;
  const sourceKey =
   sourceAligned && sourceAlignment !== null ? (sourceAlignment[hanziIndex] ?? null) : null;
  const sourceLexicalKey = item.segment === "一" || item.segment === "不" ? lexicalKey : sourceKey;
  const selectedLexicalKey = overrideKey ?? sourceLexicalKey;
  const selectedSpokenKey = spokenKey;
  const selectedAlternatives = [
   ...new Set([selectedLexicalKey, ...keys].filter((key): key is string => key !== null)),
  ];
  glyphs.push({
   text: item.segment,
   start: item.index,
   end: item.index + item.segment.length,
   lexicalPinyin: displayPinyin(selectedLexicalKey),
   spokenPinyin: displayPinyin(selectedSpokenKey),
   lexicalReadingKey: selectedLexicalKey,
   spokenReadingKey: selectedSpokenKey,
   isPolyphonic: selectedAlternatives.length > 1,
   alternatives: selectedAlternatives,
   confidence: overrideKey === null ? (readingsAligned && sourceAligned ? 0.94 : 0) : 1,
   evidence:
    overrideKey === null
     ? sourceKeys !== null && sourceAligned
      ? ["source-pinyin"]
      : readingsAligned
        ? ["context-library"]
        : ["fallback"]
     : ["manual-override"],
  });
  hanziIndex += 1;
 }

 const tokens: ContextualPronunciationToken[] = [];
 let index = 0;
 while (index < normalizedText.length) {
  const entry = dictionaryToken(normalizedText, index, dictionary);
  if (entry !== null) {
   tokens.push({
    id: `token:${index}:${index + entry.text.length}`,
    text: entry.text,
    start: index,
    end: index + entry.text.length,
    type: "hanzi",
    source: "dictionary-exact",
    pinyin: entry.pinyin,
   });
   index += entry.text.length;
   continue;
  }
  const segment = graphemes.find((item) => item.index === index);
  if (segment === undefined) break;
  tokens.push({
   id: `token:${segment.index}:${segment.index + segment.segment.length}`,
   text: segment.segment,
   start: segment.index,
   end: segment.index + segment.segment.length,
   type: classify(segment.segment),
   source: "grapheme",
   pinyin: "",
  });
  index += segment.segment.length;
 }

 const unresolvedReason: ContextualPronunciationAnalysis["unresolved"][number]["reason"] =
  "pronunciation-unavailable";
 return {
  originalText,
  normalizedText,
  tokens,
  glyphs,
  unresolved: glyphs
   .filter((glyph) => glyph.lexicalPinyin === null)
   .map((glyph) => ({
    start: glyph.start,
    end: glyph.end,
    text: glyph.text,
    reason: unresolvedReason,
   })),
  sourcePinyinStatus:
   request.sourcePinyin === null ? "not-provided" : sourceAligned ? "aligned" : "rejected",
 };
}
