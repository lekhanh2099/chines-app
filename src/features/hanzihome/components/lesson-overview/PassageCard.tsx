import type { ReactNode } from "react";

import { TextLineCard } from "./TextLineCard";
import { getHanziTypographyStyle } from "./hanzi-typography";
import type { LessonDisplayMode } from "./types";
import {
 answerToString,
 arrayValue,
 asRecord,
 hasClozeAnswerValue,
 stringValue,
} from "./utils";

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
 pinyin?: string;
 note?: string;
};

const BLANK_MARKER_SOURCE =
 "(?:([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\\d+)|[（(]\\s*(\\d+)\\s*[）)]|\\[\\s*(\\d+)\\s*\\])\\s*(?:[_＿]{2,}|…{2,}|\\.\\.\\.+)";

const PLAIN_BLANK_SOURCE = "[_＿]{2,}|…{2,}|\\.\\.\\.+";

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

function numberValue(
 record: Record<string, unknown>,
 key: string,
): number | null {
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
  stringValue(record, "blank_id") ||
  stringValue(record, "question_id") ||
  stringValue(record, "label");

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
   if (!answer) return null;

   const answerIndex = answerIndexFromRecord(record);
   const stableKey =
    stringValue(record, "blank_id") ||
    stringValue(record, "question_id") ||
    stringValue(record, "id") ||
    `${answerIndex ?? index + 1}`;

   return {
    key: stableKey,
    label: answerIndex ? `${answerIndex}` : stableKey,
    answer,
    pinyin:
     stringValue(record, "answer_pinyin") || stringValue(record, "pinyin"),
    note:
     stringValue(record, "explanation_vi") ||
     stringValue(record, "note_vi") ||
     stringValue(record, "answer_vi") ||
     stringValue(record, "usage_note_vi"),
   };
  })
  .filter((answer): answer is ClozeAnswer => Boolean(answer));
}

function firstNonEmptyAnswerSource(
 passageRecord: Record<string, unknown>,
 answers: unknown[],
) {
 if (answers.length > 0) return answers;

 const sourceKeys = [
  "blanks",
  "answers",
  "answer_key",
  "cloze_answers",
  "suggested_answers",
  "questions",
 ];

 for (const key of sourceKeys) {
  const values = arrayValue(passageRecord, key);
  if (values.some(hasClozeAnswerValue)) return values;
 }

 return [];
}

function clozeAnswersFromSources(
 passageRecord: Record<string, unknown>,
 answers: unknown[],
) {
 const normalizedAnswers = normalizeClozeAnswers(
  firstNonEmptyAnswerSource(passageRecord, answers),
 );
 const answerMap = new Map<string, ClozeAnswer>();

 for (const answer of normalizedAnswers) {
  if (!answerMap.has(answer.label)) answerMap.set(answer.label, answer);
  if (!answerMap.has(answer.key)) answerMap.set(answer.key, answer);
 }

 return {
  answerMap,
  answerList: normalizedAnswers,
 };
}

function getBlankMarkerFromMatch(match: RegExpMatchArray): string {
 return match[1] || match[2] || match[3] || "";
}

function hasBlankMarkers(text: string) {
 return new RegExp(BLANK_MARKER_SOURCE, "g").test(text);
}

function hasPlainBlanks(text: string) {
 return new RegExp(PLAIN_BLANK_SOURCE, "g").test(text);
}

function shouldRenderAsCloze(
 text: string,
 answerMap: Map<string, ClozeAnswer>,
 rendererId: string,
) {
 if (answerMap.size === 0) return false;
 if (hasBlankMarkers(text)) return true;

 const normalizedRendererId = rendererId.toLowerCase();
 return (
  hasPlainBlanks(text) &&
  (normalizedRendererId.includes("cloze") ||
   normalizedRendererId.includes("fill_blank") ||
   normalizedRendererId.includes("fill-blank"))
 );
}

function withMissingBlankNumbers(
 text: string,
 answerMap: Map<string, ClozeAnswer>,
 nextBlankNumber: () => number,
) {
 if (hasBlankMarkers(text) || answerMap.size === 0) return text;

 return text.replace(new RegExp(PLAIN_BLANK_SOURCE, "g"), (match) => {
  return `${nextBlankNumber()}${match}`;
 });
}

function passageLinesFromParagraphs(
 paragraphs: unknown[],
 itemId: string,
 answerMap: Map<string, ClozeAnswer>,
) {
 let plainBlankIndex = 0;
 const nextBlankNumber = () => {
  plainBlankIndex += 1;
  return plainBlankIndex;
 };

 return paragraphs
  .map((paragraphValue, index): PassageLine | null => {
   if (typeof paragraphValue === "string") {
    const text = withMissingBlankNumbers(
     paragraphValue.trim(),
     answerMap,
     nextBlankNumber,
    );

    return text
     ? {
        id: `${itemId}-passage-paragraph-${index}`,
        zh: text,
       }
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
    id: stringValue(paragraph, "id") || `${itemId}-passage-paragraph-${index}`,
    zh: withMissingBlankNumbers(zh, answerMap, nextBlankNumber),
    pinyin: stringValue(paragraph, "pinyin"),
    vi:
     stringValue(paragraph, "vi") ||
     stringValue(paragraph, "translation_vi") ||
     stringValue(paragraph, "meaning_vi"),
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

function ClozeText({
 text,
 answerMap,
 displayMode,
}: {
 text: string;
 answerMap: Map<string, ClozeAnswer>;
 displayMode: LessonDisplayMode;
}) {
 const paragraphs = text
  .split(/\n{2,}/)
  .filter((paragraph) => paragraph.trim());

 return (
  <div className="grid gap-3">
   {paragraphs.map((paragraph, paragraphIndex) => (
    <p
     key={`${paragraph.slice(0, 32)}-${paragraphIndex}`}
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
  const marker = getBlankMarkerFromMatch(match);
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

function DataPill({
 label,
 pinyin,
 meaning,
 extra,
}: {
 label: string;
 pinyin?: string;
 meaning?: string;
 extra?: string;
}) {
 if (!label) return null;

 return (
  <span className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary">
   {label}
   {pinyin && ` · ${pinyin}`}
   {meaning && ` · ${meaning}`}
   {extra && ` · ${extra}`}
  </span>
 );
}

function SupplementaryVocabulary({
 values,
 displayMode,
}: {
 values: unknown[];
 displayMode: LessonDisplayMode;
}) {
 const visibleValues = values.filter((value) => {
  if (answerToString(value)) return true;

  const record = asRecord(value);
  return Boolean(
   stringValue(record, "hanzi") ||
   stringValue(record, "text") ||
   stringValue(record, "zh") ||
   stringValue(record, "meaning_vi"),
  );
 });

 if (visibleValues.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Từ bổ sung
   </p>
   <div className="flex flex-wrap gap-2">
    {visibleValues.map((wordValue, index) => {
     const word = asRecord(wordValue);
     const label =
      stringValue(word, "hanzi") ||
      stringValue(word, "text") ||
      stringValue(word, "zh") ||
      answerToString(wordValue);
     const pinyin = stringValue(word, "pinyin");
     const meaning = stringValue(word, "meaning_vi");
     const pos = stringValue(word, "pos");

     return (
      <DataPill
       key={stringValue(word, "id") || `${label}-${index}`}
       label={label}
       pinyin={displayMode.showPinyin ? pinyin : ""}
       meaning={displayMode.showMeaning ? meaning : ""}
       extra={pos}
      />
     );
    })}
   </div>
  </div>
 );
}

function WordBank({ words }: { words: unknown[] }) {
 const wordBank = words
  .map(answerToString)
  .filter((word): word is string => Boolean(word));

 if (wordBank.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Từ cho sẵn
   </p>
   <div className="flex flex-wrap gap-2">
    {wordBank.map((word) => (
     <DataPill key={word} label={word} />
    ))}
   </div>
  </div>
 );
}

function AnswerList({ answers }: { answers: ClozeAnswer[] }) {
 if (answers.length === 0) return null;

 return (
  <details className="rounded-lg border border-accent/25 bg-bg-primary">
   <summary className="cursor-pointer list-none px-3 py-2 text-xs font-black uppercase tracking-wide text-accent-text marker:hidden">
    Xem đáp án ({answers.length})
   </summary>
   <div className="grid gap-1 border-t border-accent/20 bg-accent-subtle/55 px-3 py-2">
    {answers.map((answer) => (
     <p key={answer.key} className="text-sm font-bold text-accent-text">
      {answer.label}: {answer.answer}
      {answer.pinyin && ` · ${answer.pinyin}`}
      {answer.note && ` — ${answer.note}`}
     </p>
    ))}
   </div>
  </details>
 );
}

function PassageLineBlock({
 line,
 answerMap,
 rendererId,
 displayMode,
}: {
 line: PassageLine;
 answerMap: Map<string, ClozeAnswer>;
 rendererId: string;
 displayMode: LessonDisplayMode;
}) {
 const isCloze = shouldRenderAsCloze(line.zh, answerMap, rendererId);

 return (
  <div className="rounded-xl border border-border-default bg-bg-primary p-3">
   {isCloze ? (
    <>
     <ClozeText
      text={line.zh}
      answerMap={answerMap}
      displayMode={displayMode}
     />
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
    </>
   ) : (
    <TextLineCard
     zh={line.zh}
     pinyin={line.pinyin}
     vi={line.vi}
     displayMode={displayMode}
     variant="reader"
    />
   )}
  </div>
 );
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
 const rendering = asRecord(passageRecord.rendering);
 const rendererId = stringValue(rendering, "renderer");
 const instruction = asRecord(passageRecord.instruction);
 const instructionText =
  stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const { answerMap, answerList } = clozeAnswersFromSources(
  passageRecord,
  answers,
 );

 const segments = arrayValue(passageRecord, "segments");
 const passageTitle =
  stringValue(passageRecord, "title_vi") || stringValue(passageRecord, "title");

 const supplementaryVocabulary = [
  ...arrayValue(passageRecord, "supplementary_vocabulary"),
  ...arrayValue(passageRecord, "supplementary_words"),
  ...arrayValue(passageRecord, "supplementary_vocab"),
  ...arrayValue(passageRecord, "supplement_vocab"),
  ...arrayValue(passageRecord, "supplemental_vocab"),
 ];

 const wordBank = arrayValue(passageRecord, "word_bank");

 const passageLines = passageLinesFromParagraphs(
  arrayValue(passageRecord, "paragraphs"),
  itemId,
  answerMap,
 );

 let plainBlankIndex = 0;
 const nextBlankNumber = () => {
  plainBlankIndex += 1;
  return plainBlankIndex;
 };

 const passageText =
  typeof passage === "string"
   ? withMissingBlankNumbers(passage, answerMap, nextBlankNumber)
   : withMissingBlankNumbers(
      stringValue(passageRecord, "text_with_blanks") ||
       stringValue(passageRecord, "passage_with_blanks") ||
       stringValue(passageRecord, "passage_blanked") ||
       stringValue(passageRecord, "cloze_text") ||
       stringValue(passageRecord, "passage_text") ||
       stringValue(passageRecord, "text") ||
       stringValue(passageRecord, "zh"),
      answerMap,
      nextBlankNumber,
     );

 const completedPassageText =
  stringValue(passageRecord, "completed_text") ||
  stringValue(passageRecord, "completed_text_zh") ||
  stringValue(passageRecord, "completed_passage") ||
  stringValue(passageRecord, "passage_complete");

 const passagePinyin = stringValue(passageRecord, "pinyin");
 const passageMeaning =
  stringValue(passageRecord, "translation_vi") ||
  stringValue(passageRecord, "vi");

 const clozeText =
  segments.length > 0
   ? withMissingBlankNumbers(
      clozeTextFromSegments(segments),
      answerMap,
      nextBlankNumber,
     )
   : "";

 const hasMainPayload =
  Boolean(passageTitle) ||
  Boolean(instructionText) ||
  passageLines.length > 0 ||
  Boolean(passageText) ||
  Boolean(completedPassageText) ||
  Boolean(clozeText) ||
  supplementaryVocabulary.length > 0 ||
  wordBank.length > 0 ||
  answerList.length > 0;

 if (!hasMainPayload) return null;

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4">
   {(passageTitle || instructionText) && (
    <div className="grid gap-1">
     {passageTitle && (
      <h5 className="font-black text-text-primary">{passageTitle}</h5>
     )}
     {instructionText && (
      <p className="text-sm font-semibold text-text-muted">{instructionText}</p>
     )}
    </div>
   )}

   <SupplementaryVocabulary
    values={supplementaryVocabulary}
    displayMode={displayMode}
   />

   <WordBank words={wordBank} />

   {passageLines.length > 0 && (
    <div className="grid gap-2">
     {passageLines.map((line) => (
      <PassageLineBlock
       key={line.id}
       line={line}
       answerMap={answerMap}
       rendererId={rendererId}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {(passageText || clozeText) && passageLines.length === 0 && (
    <div className="rounded-xl border border-border-default bg-bg-primary p-3">
     {shouldRenderAsCloze(passageText || clozeText, answerMap, rendererId) ? (
      <>
       <ClozeText
        text={passageText || clozeText}
        answerMap={answerMap}
        displayMode={displayMode}
       />
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
      </>
     ) : (
      <TextLineCard
       zh={passageText || clozeText}
       pinyin={passagePinyin}
       vi={passageMeaning}
       displayMode={displayMode}
       variant="reader"
      />
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

   <AnswerList answers={answerList} />
  </div>
 );
}
