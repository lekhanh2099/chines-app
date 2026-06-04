import type { ReactNode } from "react";

import { TextLineCard } from "./TextLineCard";
import { getHanziTypographyStyle } from "./hanzi-typography";
import type { LessonDisplayMode } from "./types";
import { answerToString, arrayValue, asRecord, stringValue } from "./utils";

type PassageLine = {
 id: string;
 zh: string;
 pinyin?: string;
 vi?: string;
};

type ClozeAnswer = {
 key: string;
 label: string;
 answer: string;
 note?: string;
};

const BLANK_MARKER_SOURCE =
 "([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\\d+)[\\s　]*(?:[_＿]{2,}|____+|……+)";

const CIRCLED_NUMBER_MAP: Record<string, number> = {
 "①": 1,
 "②": 2,
 "③": 3,
 "④": 4,
 "⑤": 5,
 "⑥": 6,
 "⑦": 7,
 "⑧": 8,
 "⑨": 9,
 "⑩": 10,
 "⑪": 11,
 "⑫": 12,
 "⑬": 13,
 "⑭": 14,
 "⑮": 15,
 "⑯": 16,
 "⑰": 17,
 "⑱": 18,
 "⑲": 19,
 "⑳": 20,
};

function blankLabelToNumber(label: string): number | null {
 if (label in CIRCLED_NUMBER_MAP) return CIRCLED_NUMBER_MAP[label];
 const direct = Number.parseInt(label, 10);
 return Number.isFinite(direct) ? direct : null;
}

function numberValue(record: Record<string, unknown>, key: string): number | null {
 const value = record[key];
 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value !== "string") return null;

 const direct = Number.parseInt(value.trim(), 10);
 return Number.isFinite(direct) ? direct : null;
}

function numberFromLabelSuffix(label: string): number | null {
 const direct = Number.parseInt(label, 10);
 if (Number.isFinite(direct)) return direct;

 const suffix = label.match(/(\d+)$/)?.[1];
 const suffixNumber = suffix ? Number.parseInt(suffix, 10) : Number.NaN;
 return Number.isFinite(suffixNumber) ? suffixNumber : null;
}

function answerIndexFromRecord(record: Record<string, unknown>) {
 const directNumber =
  numberValue(record, "blank") ??
  numberValue(record, "index") ??
  numberValue(record, "number") ??
  numberValue(record, "order") ??
  numberValue(record, "blank_number");
 if (directNumber !== null) return directNumber;

 const label =
  stringValue(record, "blank_id") || stringValue(record, "question_id");
 if (label) return numberFromLabelSuffix(label);

 const id = stringValue(record, "id");
 return /^\d+$/.test(id) ? Number.parseInt(id, 10) : null;
}

function answerTextFromRecord(record: Record<string, unknown>) {
 return (
  stringValue(record, "answer") ||
  stringValue(record, "answer_zh") ||
  stringValue(record, "value") ||
  stringValue(record, "text") ||
  stringValue(record, "zh") ||
  stringValue(record, "sample_answer") ||
  arrayValue(record, "acceptable_answers")
   .map(answerToString)
   .filter(Boolean)
   .join(" / ")
 );
}

function normalizeClozeAnswers(values: unknown[]): ClozeAnswer[] {
 return values
  .map((value, index): ClozeAnswer | null => {
   if (typeof value === "string" || typeof value === "number") {
    const answer = answerToString(value);
    return answer
     ? {
        key: `${index + 1}`,
        label: `${index + 1}`,
        answer,
       }
     : null;
   }

   const record = asRecord(value);
   const answer = answerTextFromRecord(record);
   const answerIndex = answerIndexFromRecord(record) ?? index + 1;
   if (!answer) return null;

   return {
    key:
     stringValue(record, "id") ||
     stringValue(record, "blank_id") ||
     `${answerIndex}`,
    label: `${answerIndex}`,
    answer,
    note:
     stringValue(record, "explanation_vi") ||
     stringValue(record, "answer_vi") ||
     stringValue(record, "note_vi"),
   };
  })
  .filter((answer): answer is ClozeAnswer => Boolean(answer));
}

function clozeAnswersFromSources(
 passageRecord: Record<string, unknown>,
 answers: unknown[],
) {
 const sources = [
  ...answers,
  ...arrayValue(passageRecord, "blanks"),
  ...arrayValue(passageRecord, "answers"),
  ...arrayValue(passageRecord, "answer_key"),
  ...arrayValue(passageRecord, "cloze_answers"),
 ];
 const answerMap = new Map<string, ClozeAnswer>();

 for (const answer of normalizeClozeAnswers(sources)) {
  if (!answerMap.has(answer.label)) answerMap.set(answer.label, answer);
 }

 return answerMap;
}

function hasBlankMarkers(text: string) {
 return new RegExp(BLANK_MARKER_SOURCE).test(text);
}

function passageLinesFromParagraphs(
 paragraphs: unknown[],
 itemId: string,
 answerMap: Map<string, ClozeAnswer>,
) {
 return paragraphs
  .map((paragraphValue, index): PassageLine | null => {
   if (typeof paragraphValue === "string") {
    const text = fillMissingBlankNumbers(paragraphValue.trim(), answerMap);
    return text
     ? { id: `${itemId}-passage-paragraph-${index}`, zh: text }
     : null;
   }

   const paragraph = asRecord(paragraphValue);
   const zh =
    stringValue(paragraph, "zh") ||
    stringValue(paragraph, "text") ||
    stringValue(paragraph, "text_with_blanks") ||
    stringValue(paragraph, "completed_text");

   if (!zh) return null;

   return {
    id:
     stringValue(paragraph, "id") || `${itemId}-passage-paragraph-${index}`,
    zh: fillMissingBlankNumbers(zh, answerMap),
    pinyin: stringValue(paragraph, "pinyin"),
    vi: stringValue(paragraph, "vi"),
   };
  })
  .filter((line): line is PassageLine => Boolean(line));
}

function clozeTextFromSegments(segments: unknown[]) {
 return segments
  .map((segmentValue, index) => {
   const segment = asRecord(segmentValue);
   if (stringValue(segment, "type") === "blank") {
    const marker = answerIndexFromRecord(segment) ?? index + 1;
    return ` ${marker}______ `;
   }
   return (
    stringValue(segment, "text") ||
    stringValue(segment, "zh") ||
    answerToString(segmentValue)
   );
  })
  .join("");
}

function fillMissingBlankNumbers(
 text: string,
 answerMap: Map<string, ClozeAnswer>,
) {
 if (hasBlankMarkers(text) || answerMap.size === 0) return text;
 let blankIndex = 0;
 return text.replace(/[_＿]{2,}|____+|……+/g, (match) => {
  blankIndex += 1;
  return `${blankIndex}${match}`;
 });
}

function ClozeText({
 text,
 answerMap,
 displayMode,
}: {
 text: string;
 answerMap: Map<string, ClozeAnswer>;
 displayMode: LessonDisplayMode;
}) {
 const paragraphs = text.split(/\n{2,}/).filter((paragraph) => paragraph.trim());

 return (
  <div className="grid gap-3">
   {paragraphs.map((paragraph, paragraphIndex) => (
    <p
     key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}
     className="whitespace-pre-wrap leading-relaxed text-text-primary"
     lang="zh-CN"
     style={getHanziTypographyStyle(displayMode)}
    >
     <ClozeInlineText text={paragraph} answerMap={answerMap} />
    </p>
   ))}
  </div>
 );
}

function ClozeInlineText({
 text,
 answerMap,
}: {
 text: string;
 answerMap: Map<string, ClozeAnswer>;
}) {
 const nodes: ReactNode[] = [];
 let lastIndex = 0;

 for (const match of text.matchAll(new RegExp(BLANK_MARKER_SOURCE, "g"))) {
  const marker = match[1] || "";
  const matchText = match[0];
  const matchIndex = match.index ?? 0;
  const blankNumber = blankLabelToNumber(marker);
  const label = blankNumber ? `${blankNumber}` : marker;
  const answer = answerMap.get(label);

  if (matchIndex > lastIndex) {
   nodes.push(text.slice(lastIndex, matchIndex));
  }

  nodes.push(
   <span
    key={`${label}-${matchIndex}`}
    className="mx-1 inline-flex translate-y-[-0.08em] items-center gap-1 rounded-lg border border-accent/35 bg-accent-subtle px-2 py-0.5 text-[0.62em] font-black leading-none text-accent-text shadow-sm"
    title={answer?.note}
   >
    <span className="text-[0.78em] opacity-75">{marker}</span>
    <span>{answer?.answer || matchText}</span>
   </span>,
  );
  lastIndex = matchIndex + matchText.length;
 }

 if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
 return <>{nodes}</>;
}

export function PassageCard({
 itemId,
 passage,
 answers = [],
 displayMode,
}: {
 itemId: string;
 passage: unknown;
 answers?: unknown[];
 displayMode: LessonDisplayMode;
}) {
 const passageRecord = asRecord(passage);
 const answerMap = clozeAnswersFromSources(passageRecord, answers);
 const segments =
  arrayValue(passageRecord, "segments").length > 0
   ? arrayValue(passageRecord, "segments")
   : [];
 const passageTitle =
  stringValue(passageRecord, "title_vi") || stringValue(passageRecord, "title");
 const passageLines = passageLinesFromParagraphs(
  arrayValue(passageRecord, "paragraphs"),
  itemId,
  answerMap,
 );
 const passageText =
  typeof passage === "string"
   ? fillMissingBlankNumbers(passage, answerMap)
  : fillMissingBlankNumbers(
     stringValue(passageRecord, "text_with_blanks") ||
      stringValue(passageRecord, "text") ||
      stringValue(passageRecord, "zh"),
     answerMap,
     );
 const completedPassageText = stringValue(passageRecord, "completed_text");
 const passagePinyin = stringValue(passageRecord, "pinyin");
 const passageMeaning = stringValue(passageRecord, "vi");
 const clozeText =
  segments.length > 0
   ? fillMissingBlankNumbers(clozeTextFromSegments(segments), answerMap)
   : "";

 if (
  !passageTitle &&
  passageLines.length === 0 &&
  !passageText &&
  !completedPassageText &&
  !clozeText
 ) {
  return null;
 }

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4">
   {passageTitle && (
    <h5 className="font-black text-text-primary">{passageTitle}</h5>
   )}

   {passageLines.length > 0 && (
    <div className="grid gap-2">
     {passageLines.map((line) => (
      <div
       key={line.id}
       className="rounded-xl border border-border-default bg-bg-primary p-3"
      >
       {answerMap.size > 0 && hasBlankMarkers(line.zh) ? (
        <ClozeText
         text={line.zh}
         answerMap={answerMap}
         displayMode={displayMode}
        />
       ) : (
        <TextLineCard
         zh={line.zh}
         pinyin={line.pinyin}
         vi={line.vi}
         displayMode={displayMode}
         variant="reader"
        />
       )}
       {displayMode.showPinyin && line.pinyin && (
        <p className="mt-2 text-xs font-bold italic text-text-muted sm:text-sm">
         {line.pinyin}
        </p>
       )}
       {displayMode.showMeaning && line.vi && (
        <p className="mt-2 text-sm font-semibold leading-relaxed text-text-secondary">
         {line.vi}
        </p>
       )}
      </div>
     ))}
    </div>
   )}

   {(passageText || clozeText) && passageLines.length === 0 && (
    <div className="rounded-xl border border-border-default bg-bg-primary p-3">
     {answerMap.size > 0 && hasBlankMarkers(passageText || clozeText) ? (
      <ClozeText
       text={passageText || clozeText}
       answerMap={answerMap}
       displayMode={displayMode}
      />
     ) : (
      <TextLineCard
       zh={passageText || clozeText}
       pinyin={passagePinyin}
       vi={passageMeaning}
       displayMode={displayMode}
       variant="reader"
      />
     )}
     {displayMode.showPinyin && passagePinyin && (
      <p className="mt-2 text-xs font-bold italic text-text-muted sm:text-sm">
       {passagePinyin}
      </p>
     )}
     {displayMode.showMeaning && passageMeaning && (
      <p className="mt-2 text-sm font-semibold leading-relaxed text-text-secondary">
       {passageMeaning}
      </p>
     )}
    </div>
   )}

   {completedPassageText && completedPassageText !== passageText && (
    <div className="rounded-lg border border-accent/30 bg-accent-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">
      Bản hoàn chỉnh
     </p>
     <p
      className="mt-2 whitespace-pre-wrap leading-8 text-accent-text"
      lang="zh-CN"
      style={getHanziTypographyStyle(displayMode, { size: "lg" })}
     >
      {completedPassageText}
     </p>
    </div>
   )}
  </div>
 );
}
