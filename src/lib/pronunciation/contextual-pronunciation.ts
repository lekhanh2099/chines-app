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

export const CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH = 2_000;

const requestSchema = z.strictObject({
 text: z.string().min(1).max(CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH),
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
  .readonly()
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

// Phrase readings missing from pinyin-pro's built-in dictionary. Keep 得 scoped
// to a complete context: a character-wide replacement would break 得到 and 得去.
const contextualPhraseDictionary: PronunciationDictionaryEntry[] = [
 { id: "complement-listen", text: "听得入迷", pinyin: "tīng de rù mí", priority: 0 },
 { id: "complement-play", text: "吹得不比", pinyin: "chuī de bù bǐ", priority: 0 },
 { id: "complement-solid", text: "坚固得", pinyin: "jiān gù de", priority: 0 },
 { id: "modal-must-go", text: "我得去", pinyin: "wǒ děi qù", priority: 0 },
];

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

export type ContextualReadingUnit = Pick<
 ContextualPronunciationToken,
 "id" | "text" | "start" | "end" | "type"
>;

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

function preferredDisplayedPinyin(glyph: ContextualPronunciationGlyph): string | null {
 return glyph.evidence.includes("manual-override")
  ? (glyph.lexicalPinyin ?? glyph.spokenPinyin)
  : (glyph.spokenPinyin ?? glyph.lexicalPinyin);
}

const graphemeSegmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });
const wordSegmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });

// These are spelling boundaries, not pronunciation corrections. Keep the list
// constrained to the reviewed learner corpus; the contextual engine remains
// the authority for every glyph's reading.
const orthographicWords = [
 "不太",
 "一双",
 "一个",
 "伤心",
 "回答",
 "很清楚",
 "很高兴",
 "怎么",
 "我得去",
 "西安",
 "女儿",
 "听得入迷",
];

const orthographicWordCandidates = [...new Set(orthographicWords)].sort(
 (left, right) => right.length - left.length,
);

const orthographicCandidateSplits = new Map<string, readonly string[]>([
 ["一个", ["一", "个"]],
 ["一双", ["一", "双"]],
 ["一句", ["一", "句"]],
 ["一座", ["一", "座"]],
 ["一起", ["一", "起"]],
 ["一点", ["一", "点"]],
 ["一天", ["一", "天"]],
 ["一连", ["一", "连"]],
 ["两只", ["两", "只"]],
 ["不太", ["不", "太"]],
 ["不很", ["不", "很"]],
 ["不好", ["不", "好"]],
 ["不错", ["不", "错"]],
 ["不是", ["不", "是"]],
 ["不能", ["不", "能"]],
 ["不见", ["不", "见"]],
 ["不小", ["不", "小"]],
 ["不多", ["不", "多"]],
 ["不懂", ["不", "懂"]],
 ["不舒服", ["不", "舒服"]],
 ["不清楚", ["不", "清楚"]],
 ["不分明", ["不", "分明"]],
 ["不知道", ["不", "知道"]],
 ["很好", ["很", "好"]],
 ["我得去", ["我", "得", "去"]],
 ["听得入迷", ["听", "得", "入迷"]],
]);

function isHanzi(value: string): boolean {
 return classify(value) === "hanzi";
}

function orthographicUnitTexts(value: string): string[] {
 const candidateByStart = new Map(
  [...wordSegmenter.segment(value)].map((segment) => [segment.index, segment.segment]),
 );
 const units: string[] = [];
 let index = 0;

 while (index < value.length) {
  const knownWord = orthographicWordCandidates.find((word) => value.startsWith(word, index));
  if (knownWord !== undefined) {
   const split = orthographicCandidateSplits.get(knownWord);
   units.push(...(split ?? [knownWord]));
   index += knownWord.length;
   continue;
  }

  const candidate = candidateByStart.get(index);
  if (candidate !== undefined && isHanzi(candidate)) {
   const split = orthographicCandidateSplits.get(candidate);
   units.push(...(split ?? [candidate]));
   index += candidate.length;
   continue;
  }

  const grapheme = [...graphemeSegmenter.segment(value.slice(index))][0];
  if (grapheme === undefined) break;
  units.push(grapheme.segment);
  index += grapheme.segment.length;
 }

 return units;
}

export function getContextualReadingUnits(
 analysis: ContextualPronunciationAnalysis,
): ContextualReadingUnit[] {
 const graphemes = [...graphemeSegmenter.segment(analysis.normalizedText)];
 const units: ContextualReadingUnit[] = [];
 let graphemeIndex = 0;

 while (graphemeIndex < graphemes.length) {
  const grapheme = graphemes[graphemeIndex];
  if (grapheme === undefined) break;
  const type = classify(grapheme.segment);
  if (type !== "hanzi") {
   units.push({
    id: `reading:${grapheme.index}:${grapheme.index + grapheme.segment.length}`,
    text: grapheme.segment,
    start: grapheme.index,
    end: grapheme.index + grapheme.segment.length,
    type,
   });
   graphemeIndex += 1;
   continue;
  }

  const start = grapheme.index;
  let end = start;
  let nextGraphemeIndex = graphemeIndex;
  while (nextGraphemeIndex < graphemes.length) {
   const candidate = graphemes[nextGraphemeIndex];
   if (candidate === undefined || classify(candidate.segment) !== "hanzi") break;
   end = candidate.index + candidate.segment.length;
   nextGraphemeIndex += 1;
  }

  let offset = start;
  for (const text of orthographicUnitTexts(analysis.normalizedText.slice(start, end))) {
   units.push({
    id: `reading:${offset}:${offset + text.length}`,
    text,
    start: offset,
    end: offset + text.length,
    type: "hanzi",
   });
   offset += text.length;
  }
  graphemeIndex = nextGraphemeIndex;
 }

 return units;
}

export function shouldSeparatePinyinSyllables(previous: string, next: string): boolean {
 if (!previous || !next) return false;
 const initial = next.normalize("NFD")[0];
 return initial === "a" || initial === "e" || initial === "o";
}

function joinPinyinSyllables(readings: readonly string[]): string {
 let output = "";
 for (const reading of readings) {
  if (output && shouldSeparatePinyinSyllables(output, reading)) output += "'";
  output += reading;
 }
 return output;
}

function readingsForUnit(
 analysis: ContextualPronunciationAnalysis,
 unit: ContextualReadingUnit,
): string[] | null {
 const glyphs = analysis.glyphs.filter(
  (glyph) => glyph.start >= unit.start && glyph.end <= unit.end,
 );
 const readings = glyphs.map(preferredDisplayedPinyin);
 if (glyphs.length === 0 || readings.some((reading) => reading === null)) return null;
 return readings.filter((reading): reading is string => reading !== null);
}

export function formatContextualReadingUnitPinyin(
 analysis: ContextualPronunciationAnalysis,
 unit: ContextualReadingUnit,
): string | null {
 const readings = readingsForUnit(analysis, unit);
 return readings === null ? null : joinPinyinSyllables(readings);
}

export function formatContextualSpokenPinyin(analysis: ContextualPronunciationAnalysis): string {
 const glyphByStart = new Map(analysis.glyphs.map((glyph) => [glyph.start, glyph]));
 const graphemes = [...graphemeSegmenter.segment(analysis.normalizedText)];
 let output = "";
 let previousWasHanzi = false;

 for (const grapheme of graphemes) {
  const glyph = glyphByStart.get(grapheme.index);
  if (glyph !== undefined) {
   const reading = preferredDisplayedPinyin(glyph);
   if (reading !== null) {
    if (previousWasHanzi) output += " ";
    output += reading;
    previousWasHanzi = true;
    continue;
   }
  }

  output += grapheme.segment;
  previousWasHanzi = false;
 }

 return output;
}

export function formatContextualReadingPinyin(analysis: ContextualPronunciationAnalysis): string {
 const glyphByStart = new Map(analysis.glyphs.map((glyph) => [glyph.start, glyph]));
 let output = "";
 let previousWasHanzi = false;

 for (const unit of getContextualReadingUnits(analysis)) {
  if (unit.type === "hanzi") {
   const reading = formatContextualReadingUnitPinyin(analysis, unit);
   if (reading !== null) {
    if (previousWasHanzi) output += " ";
    output += reading;
    previousWasHanzi = true;
    continue;
   }

   for (const grapheme of graphemeSegmenter.segment(unit.text)) {
    const glyph = glyphByStart.get(unit.start + grapheme.index);
    if (glyph !== undefined) {
     const fallbackReading = preferredDisplayedPinyin(glyph);
     if (fallbackReading !== null) {
      if (previousWasHanzi) output += " ";
      output += fallbackReading;
      previousWasHanzi = true;
      continue;
     }
    }
    output += grapheme.segment;
    previousWasHanzi = false;
   }
   continue;
  }

  output += unit.text;
  previousWasHanzi = false;
 }

 return output;
}

export function formatContextualPinyinRange(
 analysis: ContextualPronunciationAnalysis,
 start: number,
 end: number,
): string {
 return analysis.glyphs
  .filter((glyph) => glyph.start >= start && glyph.end <= end)
  .map(preferredDisplayedPinyin)
  .filter((reading): reading is string => reading !== null)
  .join(" ");
}

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
 const direct = /^([a-zv]+)([0-5])$/u.exec(
  value.normalize("NFC").toLocaleLowerCase().replaceAll("u:", "v").replaceAll("ü", "v"),
 );
 if (direct !== null) return `${direct[1]}${direct[2] === "0" ? "5" : direct[2]}`;
 const converted = convert(value, { format: "symbolToNum" });
 const compact = converted
  .normalize("NFC")
  .toLocaleLowerCase()
  .replaceAll("u:", "v")
  .replaceAll("ü", "v")
  .replace(/[^a-zv0-5]/gu, "");
 const match = /^([a-zv]+)([0-5])$/u.exec(compact);
 return match === null ? null : `${match[1]}${match[2] === "0" ? "5" : match[2]}`;
}

function displayPinyin(key: string | null): string | null {
 if (key === null) return null;
 return convert(key, { format: "numToSymbol" }).replace(/([a-zv]+)5$/u, "$1");
}

export function formatContextualReading(readingKey: string): string {
 return displayPinyin(readingKey) ?? readingKey;
}

function readingKeys(value: string[] | undefined): string[] {
 if (value === undefined) return [];
 return value.flatMap((item) => {
  const key = normalizeReading(item);
  return key === null ? [] : [key];
 });
}

function normalizeSourcePinyin(value: string): string {
 const toneMarks = new Set([
  "ā",
  "á",
  "ǎ",
  "à",
  "ē",
  "é",
  "ě",
  "è",
  "ī",
  "í",
  "ǐ",
  "ì",
  "ō",
  "ó",
  "ǒ",
  "ò",
  "ū",
  "ú",
  "ǔ",
  "ù",
  "ǖ",
  "ǘ",
  "ǚ",
  "ǜ",
  "ü",
 ]);
 const normalized = value
  .normalize("NFC")
  .toLocaleLowerCase()
  .replaceAll("u:", "v")
  .replace(
   /([a-zvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]{2,}[0-5]?)r(?=$|[\s\p{Punctuation}\p{Symbol}])/gu,
   "$1er",
  );
 let compact = "";
 for (const character of normalized) {
  if (toneMarks.has(character) || /[a-zv0-5]/u.test(character)) compact += character;
 }
 return compact.replaceAll("ü", "v");
}

function sourcePinyinForms(key: string): string[] {
 const display = displayPinyin(key);
 const forms = [key, display === null ? null : normalizeSourcePinyin(display)];
 if (key.endsWith("5")) forms.push(key.slice(0, -1));
 if (key === "er2") forms.push("er");
 return [...new Set(forms)].filter((value): value is string => value !== null);
}

function overrideReadingForGlyph(
 overrides: readonly PronunciationOverride[],
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
 sourcePinyin: string,
 lexicalReadings: string[],
 spokenReadings: string[],
 alternatives: string[][],
): string[] | null {
 if (lexicalReadings.length !== spokenReadings.length) return null;
 const compactSource = normalizeSourcePinyin(sourcePinyin);
 const candidates = lexicalReadings.map((lexical, index) =>
  [
   ...new Set(
    [lexical, spokenReadings[index], ...(alternatives[index] ?? [])].flatMap((key) => [
     key,
     `${key.slice(0, -1)}5`,
    ]),
   ),
  ].sort((left, right) => right.length - left.length),
 );
 const memo = new Map<string, string[] | null>();

 function solve(index: number, offset: number): string[] | null {
  const memoKey = `${index}:${offset}`;
  const cached = memo.get(memoKey);
  if (cached !== undefined) return cached;
  if (index === candidates.length) {
   const result = offset === compactSource.length ? [] : null;
   memo.set(memoKey, result);
   return result;
  }

  for (const candidate of candidates[index] ?? []) {
   for (const form of sourcePinyinForms(candidate)) {
    if (!compactSource.startsWith(form, offset)) continue;
    const rest = solve(index + 1, offset + form.length);
    if (rest !== null) {
     const result = [candidate, ...rest];
     memo.set(memoKey, result);
     return result;
    }
   }
  }

  memo.set(memoKey, null);
  return null;
 }

 return solve(0, 0);
}

function dictionaryReadingsByGlyphStart(
 text: string,
 graphemes: Intl.SegmentData[],
 lexicalValues: string[],
 spokenValues: string[],
 alternatives: string[][],
 dictionary: PronunciationDictionaryEntry[],
): ReadonlyMap<number, string> {
 const hanziIndexByStart = new Map<number, number>();
 let hanziIndex = 0;
 for (const grapheme of graphemes) {
  if (classify(grapheme.segment) !== "hanzi") continue;
  hanziIndexByStart.set(grapheme.index, hanziIndex);
  hanziIndex += 1;
 }

 const readingsByStart = new Map<number, string>();
 for (const grapheme of graphemes) {
  const entry = dictionaryToken(text, grapheme.index, dictionary);
  if (entry === null) continue;
  const phraseGraphemes = [
   ...new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(entry.text),
  ].filter((item) => classify(item.segment) === "hanzi");
  const firstHanziIndex = hanziIndexByStart.get(grapheme.index);
  if (firstHanziIndex === undefined || phraseGraphemes.length === 0) continue;
  const matchedReadings = alignSourceKeys(
   entry.pinyin,
   lexicalValues.slice(firstHanziIndex, firstHanziIndex + phraseGraphemes.length),
   spokenValues.slice(firstHanziIndex, firstHanziIndex + phraseGraphemes.length),
   alternatives.slice(firstHanziIndex, firstHanziIndex + phraseGraphemes.length),
  );
  if (matchedReadings === null || matchedReadings.length !== phraseGraphemes.length) continue;

  for (const [index, phraseGrapheme] of phraseGraphemes.entries()) {
   const start = grapheme.index + phraseGrapheme.index;
   if (!readingsByStart.has(start)) readingsByStart.set(start, matchedReadings[index]);
  }
 }

 return readingsByStart;
}

export function analyzeContextualPronunciation(
 input: ContextualPronunciationRequest,
 dictionary: PronunciationDictionaryEntry[] = [],
): ContextualPronunciationAnalysis {
 const request = requestSchema.parse(input);
 const pronunciationDictionary = [...dictionary, ...contextualPhraseDictionary];
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
 const sourceAlignment =
  request.sourcePinyin === null
   ? null
   : alignSourceKeys(request.sourcePinyin, lexicalValues, spokenValues, alternatives);
 const sourceAligned = request.sourcePinyin === null || sourceAlignment !== null;
 const dictionaryReadings = readingsAligned
  ? dictionaryReadingsByGlyphStart(
     normalizedText,
     graphemes,
     lexicalValues,
     spokenValues,
     alternatives,
     pronunciationDictionary,
    )
  : new Map<number, string>();
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
  const dictionaryKey = dictionaryReadings.get(item.index) ?? null;
  const sourceLexicalKey = sourceKey;
  const selectedLexicalKey = overrideKey ?? sourceLexicalKey ?? dictionaryKey ?? lexicalKey;
  const selectedSpokenKey =
   overrideKey ??
   sourceLexicalKey ??
   (selectedLexicalKey === lexicalKey ? spokenKey : selectedLexicalKey);
  const selectedAlternatives = [
   ...new Set([selectedLexicalKey, ...keys].filter((key): key is string => key !== null)),
  ];
  const isPolyphonic = selectedAlternatives.length > 1;
  const confidence =
   overrideKey !== null
    ? 1
    : sourceLexicalKey !== null || dictionaryKey !== null
      ? 0.95
      : isPolyphonic
        ? 0.55
        : readingsAligned
          ? 0.8
          : 0;
  glyphs.push({
   text: item.segment,
   start: item.index,
   end: item.index + item.segment.length,
   lexicalPinyin: displayPinyin(selectedLexicalKey),
   spokenPinyin: displayPinyin(selectedSpokenKey),
   lexicalReadingKey: selectedLexicalKey,
   spokenReadingKey: selectedSpokenKey,
   isPolyphonic,
   alternatives: selectedAlternatives,
   confidence,
   evidence:
    overrideKey === null
     ? sourceLexicalKey !== null
      ? ["source-pinyin"]
      : dictionaryKey !== null
        ? ["dictionary-exact"]
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
  const entry = dictionaryToken(normalizedText, index, pronunciationDictionary);
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
