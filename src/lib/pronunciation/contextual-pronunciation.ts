import { pinyin, polyphonic } from "pinyin-pro";

import {
 POLYPHONIC_DICTIONARY,
 ERHUA_WORDS,
 ensurePinyinEngineInitialized,
 getGrammarPinyin,
 getToneSandhiPinyin,
} from "./pinyin-engine.ts";
import {
 classify,
 displayPinyin,
 normalizeReading,
 normalizeSourcePinyin,
 readingKeys,
 requestSchema,
 sourcePinyinForms,
 type ContextualPronunciationAnalysis,
 type ContextualPronunciationGlyph,
 type ContextualPronunciationRequest,
 type ContextualPronunciationToken,
 type PronunciationDictionaryEntry,
 type PronunciationOverride,
} from "./contextual-pronunciation-model.ts";
import { wordSegmenter } from "./contextual-pronunciation-format.ts";

export {
 CONTEXTUAL_PRONUNCIATION_MAX_TEXT_LENGTH,
 formatContextualReading,
 type ContextualPronunciationAnalysis,
 type ContextualPronunciationGlyph,
 type ContextualPronunciationRequest,
 type ContextualPronunciationToken,
 type ContextualReadingUnit,
 type PronunciationDictionaryEntry,
 type PronunciationEvidence,
 type PronunciationOverride,
 type PronunciationTokenType,
} from "./contextual-pronunciation-model.ts";
export {
 formatContextualPinyinRange,
 formatContextualReadingPinyin,
 formatContextualReadingUnitPinyin,
 formatContextualSpokenPinyin,
 getContextualReadingUnits,
 shouldSeparatePinyinSyllables,
} from "./contextual-pronunciation-format.ts";

ensurePinyinEngineInitialized();

const engineEntries: PronunciationDictionaryEntry[] = Object.entries(POLYPHONIC_DICTIONARY).map(
 ([text, pinyin], index) => ({
  id: `polyphonic-engine-${index}`,
  text,
  pinyin,
  priority: text.length * 10,
 }),
);

// Phrase readings missing from pinyin-pro's built-in dictionary. Keep 得 scoped
// to a complete context: a character-wide replacement would break 得到 and 得去.
const contextualPhraseDictionary: PronunciationDictionaryEntry[] = [
 { id: "complement-listen", text: "听得入迷", pinyin: "tīng de rù mí", priority: 100 },
 { id: "complement-play", text: "吹得不比", pinyin: "chuī de bù bǐ", priority: 100 },
 { id: "complement-solid", text: "坚固得", pinyin: "jiān gù de", priority: 100 },
 { id: "complement-think-through", text: "想得通", pinyin: "xiǎng de tōng", priority: 100 },
 { id: "complement-take-lightly", text: "看得开", pinyin: "kàn de kāi", priority: 100 },
 { id: "modal-must-go", text: "我得去", pinyin: "wǒ děi qù", priority: 100 },
 ...engineEntries,
];

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
 erhuaIndices: ReadonlySet<number>,
 spellings: Map<number, string>,
): string[] | null {
 if (
  lexicalReadings.length !== spokenReadings.length ||
  lexicalReadings.some((reading) => reading === "") ||
  spokenReadings.some((reading) => reading === "")
 )
  return null;
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
    if (form === "r" && !erhuaIndices.has(index)) continue;
    if (!compactSource.startsWith(form, offset)) continue;
    const rest = solve(index + 1, offset + form.length);
    if (rest !== null) {
     if (form === "r") spellings.set(index, "r");
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
 spellingsByStart: Map<number, string>,
 lexicalErStarts: ReadonlySet<number>,
 providedDictionary: PronunciationDictionaryEntry[],
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
  if (
   /^儿[子女童歌科戏媳孙郎化音时]/u.test(entry.text) &&
   !lexicalErStarts.has(grapheme.index) &&
   !providedDictionary.includes(entry)
  )
   continue;
  const phraseGraphemes = [
   ...new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(entry.text),
  ].filter((item) => classify(item.segment) === "hanzi");
  const firstHanziIndex = hanziIndexByStart.get(grapheme.index);
  if (firstHanziIndex === undefined || phraseGraphemes.length === 0) continue;
  const spellings = new Map<number, string>();
  const matchedReadings = alignSourceKeys(
   entry.pinyin,
   lexicalValues.slice(firstHanziIndex, firstHanziIndex + phraseGraphemes.length),
   spokenValues.slice(firstHanziIndex, firstHanziIndex + phraseGraphemes.length),
   alternatives.slice(firstHanziIndex, firstHanziIndex + phraseGraphemes.length),
   new Set(phraseGraphemes.flatMap((item, index) => (item.segment === "儿" ? [index] : []))),
   spellings,
  );
  if (matchedReadings === null || matchedReadings.length !== phraseGraphemes.length) continue;

  for (const [index, phraseGrapheme] of phraseGraphemes.entries()) {
   const start = grapheme.index + phraseGrapheme.index;
   if (!readingsByStart.has(start)) {
    readingsByStart.set(start, matchedReadings[index]);
    const spelling = spellings.get(index);
    if (spelling !== undefined) spellingsByStart.set(start, spelling);
   }
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
 const chineseChars = graphemes.map((item) => item.segment);
 const lexicalErStarts = new Set(
  [...wordSegmenter.segment(normalizedText)].flatMap((item) =>
   /^儿[子女童歌科戏媳孙郎化音时]/u.test(item.segment) ? [item.index] : [],
  ),
 );
 const hanziGraphemes = graphemes.filter((item) => classify(item.segment) === "hanzi");
 const hanziCount = hanziGraphemes.length;
 let lexicalValues: string[] = [];
 let spokenValues: string[] = [];
 let alternatives: string[][] = [];
 try {
  const lexical = pinyin(normalizedText, {
   type: "array",
   toneType: "num",
   toneSandhi: false,
   nonZh: "removed",
   nonZhScope: /\P{Script=Han}/u,
   v: true,
  });
  const spoken = pinyin(normalizedText, {
   type: "array",
   toneType: "num",
   toneSandhi: true,
   nonZh: "removed",
   nonZhScope: /\P{Script=Han}/u,
   v: true,
  });
  const polyphonicValues = polyphonic(normalizedText, {
   type: "array",
   toneType: "num",
   nonZh: "removed",
   nonZhScope: /\P{Script=Han}/u,
   v: true,
  });
  if (!Array.isArray(lexical) || !Array.isArray(spoken) || !Array.isArray(polyphonicValues)) {
   throw new Error("pinyin-pro returned a non-array result");
  }
  // Unsupported Han must keep its position without inventing a reading.
  lexicalValues = lexical.map((item) => normalizeReading(item) ?? "");
  spokenValues = spoken.map((item) => normalizeReading(item) ?? "");
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
 const sourceSpellings = new Map<number, string>();
 const dictionarySpellings = new Map<number, string>();
 const providedDictionarySpellings = new Map<number, string>();
 const sourceAlignment =
  request.sourcePinyin === null
   ? null
   : alignSourceKeys(
      request.sourcePinyin,
      lexicalValues,
      spokenValues,
      alternatives,
      new Set(hanziGraphemes.flatMap((item, index) => (item.segment === "儿" ? [index] : []))),
      sourceSpellings,
     );
 const sourceAligned = request.sourcePinyin === null || sourceAlignment !== null;
 const dictionaryReadings = readingsAligned
  ? dictionaryReadingsByGlyphStart(
     normalizedText,
     graphemes,
     lexicalValues,
     spokenValues,
     alternatives,
     pronunciationDictionary,
     dictionarySpellings,
     lexicalErStarts,
     dictionary,
    )
  : new Map<number, string>();
 const providedDictionaryReadings =
  readingsAligned && dictionary.length > 0
   ? dictionaryReadingsByGlyphStart(
      normalizedText,
      graphemes,
      lexicalValues,
      spokenValues,
      alternatives,
      dictionary,
      providedDictionarySpellings,
      lexicalErStarts,
      dictionary,
     )
   : new Map<number, string>();
 const glyphs: ContextualPronunciationGlyph[] = [];
 let hanziIndex = 0;
 for (const [graphemeIndex, item] of graphemes.entries()) {
  const type = classify(item.segment);
  if (type !== "hanzi") continue;
  const lexicalKey = readingsAligned ? lexicalValues[hanziIndex] || null : null;
  const spokenKey = readingsAligned ? spokenValues[hanziIndex] || null : null;
  const readingAvailable = lexicalKey !== null && spokenKey !== null;
  const keys = readingsAligned ? (alternatives[hanziIndex] ?? []) : [];
  const overrideMatch = overrideReadingForGlyph(request.overrides, item, originalText);
  const overrideKey = overrideMatch?.key ?? null;
  const sourceKey =
   sourceAligned && sourceAlignment !== null ? (sourceAlignment[hanziIndex] ?? null) : null;
  const grammarKey =
   readingAvailable && !providedDictionaryReadings.has(item.index)
    ? normalizeReading(getGrammarPinyin(chineseChars, graphemeIndex))
    : null;
  const dictionaryKey =
   providedDictionaryReadings.get(item.index) ??
   (grammarKey !== null && dictionaryReadings.get(item.index) !== grammarKey
    ? null
    : (dictionaryReadings.get(item.index) ?? null));
  const contextualLexicalKey = grammarKey ?? lexicalKey;
  const contextualSpokenKey =
   grammarKey ?? normalizeReading(getToneSandhiPinyin(chineseChars, graphemeIndex)) ?? spokenKey;
  const sourceLexicalKey = sourceKey;
  const selectedLexicalKey =
   overrideKey ?? sourceLexicalKey ?? dictionaryKey ?? contextualLexicalKey;
  const selectedSpokenKey =
   overrideKey ??
   sourceLexicalKey ??
   providedDictionaryReadings.get(item.index) ??
   (selectedLexicalKey === contextualLexicalKey ? contextualSpokenKey : selectedLexicalKey);
  // 儿 keeps its citation key and character offset; rhotic spelling is only r.
  // Explicit source/dictionary spelling and manual readings remain authoritative.
  const spokenSpelling =
   overrideKey !== null
    ? null
    : sourceKey !== null
      ? sourceSpellings.get(hanziIndex)
      : providedDictionaryReadings.has(item.index)
        ? providedDictionarySpellings.get(item.index)
        : dictionaryKey !== null
          ? dictionarySpellings.get(item.index)
          : item.segment === "儿" &&
              !lexicalErStarts.has(item.index) &&
              ERHUA_WORDS.some((word) =>
               normalizedText.endsWith(word, item.index + item.segment.length),
              )
            ? "r"
            : null;
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
        : readingAvailable
          ? 0.8
          : 0;
  glyphs.push({
   text: item.segment,
   start: item.index,
   end: item.index + item.segment.length,
   lexicalPinyin: displayPinyin(selectedLexicalKey),
   spokenPinyin: spokenSpelling ?? displayPinyin(selectedSpokenKey),
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
        : readingAvailable
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
