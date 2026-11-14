import { ERHUA_WORDS } from "./pinyin-engine.ts";
import {
 classify,
 type ContextualPronunciationAnalysis,
 type ContextualPronunciationGlyph,
 type ContextualReadingUnit,
} from "./contextual-pronunciation-model.ts";

function preferredDisplayedPinyin(glyph: ContextualPronunciationGlyph): string | null {
 return glyph.evidence.includes("manual-override")
  ? (glyph.lexicalPinyin ?? glyph.spokenPinyin)
  : (glyph.spokenPinyin ?? glyph.lexicalPinyin);
}

const graphemeSegmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });
export const wordSegmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });

// These are spelling boundaries, not pronunciation corrections. Keep the list
// constrained to the reviewed learner corpus; the contextual engine remains
// the authority for every glyph's reading.
const orthographicWords = [
 ...ERHUA_WORDS,
 "自行车",
 "冰激凌",
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
 ["一会儿", ["一", "会儿"]],
 ["一点儿", ["一", "点儿"]],
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
  const knownWord = orthographicWordCandidates.find(
   (word) =>
    value.startsWith(word, index) &&
    !(
     word.endsWith("儿") &&
     /^儿[子女童歌科戏媳孙郎化音时]/u.test(candidateByStart.get(index + word.length - 1) ?? "")
    ),
  );
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
    if (previousWasHanzi && reading !== "r") output += " ";
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
    if (previousWasHanzi && reading !== "r") output += " ";
    output += reading;
    previousWasHanzi = true;
    continue;
   }

   for (const grapheme of graphemeSegmenter.segment(unit.text)) {
    const glyph = glyphByStart.get(unit.start + grapheme.index);
    if (glyph !== undefined) {
     const fallbackReading = preferredDisplayedPinyin(glyph);
     if (fallbackReading !== null) {
      if (previousWasHanzi && fallbackReading !== "r") output += " ";
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
  .join(" ")
  .replace(/ r(?= |$)/gu, "r");
}
