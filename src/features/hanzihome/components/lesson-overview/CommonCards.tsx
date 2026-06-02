import type { ReactNode } from "react";

import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import {
 answerToString,
 arrayValue,
 asRecord,
 nonEmptyStrings,
 stringValue,
} from "./utils";

export function EmptySectionState({ reason }: { reason?: string }) {
 return (
  <div className="rounded-xl border border-dashed border-border-default bg-bg-primary p-4">
   <p className="text-sm font-black text-text-primary">
    Không có dữ liệu cho phần này.
   </p>
   {reason && (
    <p className="mt-1 text-sm font-semibold text-text-muted">{reason}</p>
   )}
  </div>
 );
}

export function ExercisePill({ children }: { children: ReactNode }) {
 return (
  <span className="rounded-lg border border-border-default bg-bg-subtle px-3 py-2 text-sm font-bold text-text-primary">
   {children}
  </span>
 );
}

export function ExerciseQuestionCard({
 index,
 title,
 answer,
 note,
 children,
}: {
 index: number;
 title: string;
 answer?: string;
 note?: string;
 children?: ReactNode;
}) {
 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-sm font-black text-text-primary">
    {index}. {title}
   </p>
   {answer && (
    <p className="rounded-lg bg-accent-subtle px-3 py-2 text-sm font-bold text-accent-text">
     {answer}
    </p>
   )}
   {children}
   {note && (
    <p className="text-xs font-semibold leading-relaxed text-text-muted">
     {note}
    </p>
   )}
  </div>
 );
}

export function AnswerKeyList({
 itemId,
 values,
}: {
 itemId: string;
 values: unknown[];
}) {
 const answers = values
  .map((answerValue, index) => {
   const answer = asRecord(answerValue);
   const label =
    stringValue(answer, "blank_id") ||
    stringValue(answer, "question_id") ||
    stringValue(answer, "label") ||
    `${index + 1}`;
   const value =
    answerToString(answer.answer) || stringValue(answer, "sample_answer");
   const note = stringValue(answer, "explanation_vi");
   return value
    ? { id: `${itemId}-answer-${index}`, label, value, note }
    : null;
  })
  .filter(
   (
    answer,
   ): answer is { id: string; label: string; value: string; note: string } =>
    Boolean(answer),
  );

 if (answers.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">
    Đáp án
   </p>
   {answers.map((answer) => (
    <p key={answer.id} className="text-sm font-bold text-accent-text">
     {answer.label}: {answer.value}
     {answer.note && ` — ${answer.note}`}
    </p>
   ))}
  </div>
 );
}

export function GenericItemCard({
 value,
 displayMode,
}: {
 value: unknown;
 displayMode: LessonDisplayMode;
}) {
 const item = asRecord(value);
 const title = [item.title_vi, item.title, item.hanzi, item.id].find(
  (entry) => typeof entry === "string" && entry.trim(),
 ) as string | undefined;
 const pinyin = typeof item.pinyin === "string" ? item.pinyin : "";
 const meaning = typeof item.meaning_vi === "string" ? item.meaning_vi : "";
 const functionVi =
  typeof item.function_vi === "string" ? item.function_vi : "";
 const dialogue = Array.isArray(item.dialogue) ? item.dialogue : [];
 const practiceTasks = Array.isArray(item.practice_tasks)
  ? item.practice_tasks
  : [];

 return (
  <article className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <h4 className="text-base font-black text-text-primary">{title || "Mục"}</h4>
   {displayMode.showPinyin && pinyin && (
    <p className="text-sm font-bold italic text-text-muted">{pinyin}</p>
   )}
   {displayMode.showMeaning && meaning && (
    <p className="text-sm font-semibold text-text-secondary">{meaning}</p>
   )}
   {functionVi && (
    <p className="text-sm font-semibold text-text-secondary">{functionVi}</p>
   )}
   {dialogue.map((lineValue, index) => {
    const line = asRecord(lineValue);
    const zh =
     typeof line.zh === "string"
      ? line.zh
      : typeof line.text === "string"
        ? line.text
        : "";
    if (!zh) return null;
    return (
     <TextLineCard
      key={`${zh}-${index}`}
      speaker={typeof line.speaker === "string" ? line.speaker : undefined}
      zh={zh}
      pinyin={typeof line.pinyin === "string" ? line.pinyin : undefined}
      vi={typeof line.vi === "string" ? line.vi : undefined}
      displayMode={displayMode}
     />
    );
   })}
   {practiceTasks.length > 0 && (
    <div className="mt-2 grid gap-2">
     {practiceTasks.map((taskValue, index) => {
      const task = asRecord(taskValue);
      const instruction =
       typeof task.instruction_vi === "string" ? task.instruction_vi : "";
      const sampleAnswer = Array.isArray(task.sample_answer)
       ? task.sample_answer
          .filter(
           (line): line is string =>
            typeof line === "string" && Boolean(line.trim()),
          )
          .join(" / ")
       : "";

      return (
       <ExerciseQuestionCard
        key={typeof task.id === "string" ? task.id : `${title}-${index}`}
        index={index + 1}
        title={instruction || "Luyện tập"}
        answer={sampleAnswer}
       />
      );
     })}
    </div>
   )}
  </article>
 );
}

export function LooseItemGrid({
 items,
 displayMode,
 emptyReason,
}: {
 items: unknown[];
 displayMode: LessonDisplayMode;
 emptyReason?: string;
}) {
 type LooseRenderedItem = {
  id: string;
  text: string;
  pinyin?: string;
  meaning?: string;
 };

 const renderedItems = items
  .flatMap<LooseRenderedItem>((entryValue, index) => {
   if (typeof entryValue === "string") {
    return [{ id: `string-${index}`, text: entryValue }];
   }

   if (Array.isArray(entryValue)) {
    return [
     { id: `array-${index}`, text: nonEmptyStrings(entryValue).join(" / ") },
    ];
   }

   const entry = asRecord(entryValue);
   const pairs = arrayValue(entry, "pairs");
   if (pairs.length > 0) {
    return pairs.map((pairValue, pairIndex) => ({
     id: `${stringValue(entry, "id") || index}-pair-${pairIndex}`,
     text: Array.isArray(pairValue)
      ? nonEmptyStrings(pairValue).join(" / ")
      : answerToString(pairValue),
    }));
   }

   const lines = arrayValue(entry, "lines");
   if (lines.length > 0) {
    return lines.map((lineValue, lineIndex) => ({
     id: `${stringValue(entry, "id") || index}-line-${lineIndex}`,
     text:
      answerToString(lineValue) || stringValue(asRecord(lineValue), "text"),
    }));
   }

   const content = arrayValue(entry, "content");
   if (content.length > 0) {
    return content.map((lineValue, lineIndex) => ({
     id: `${stringValue(entry, "id") || index}-content-${lineIndex}`,
     text: `${stringValue(entry, "title") ? `${stringValue(entry, "title")}: ` : ""}${answerToString(lineValue) || stringValue(asRecord(lineValue), "text")}`,
    }));
   }

   const dialogue = arrayValue(entry, "dialogue");
   if (dialogue.length > 0) {
    return dialogue.map((lineValue, lineIndex) => {
     const line = asRecord(lineValue);
     return {
      id: `${stringValue(entry, "id") || index}-dialogue-${lineIndex}`,
      text:
       answerToString(lineValue) ||
       stringValue(line, "text") ||
       stringValue(line, "zh"),
     };
    });
   }

   const substitutions = arrayValue(entry, "substitutions");
   if (substitutions.length > 0) {
    return substitutions.map((lineValue, lineIndex) => ({
     id: `${stringValue(entry, "id") || index}-substitution-${lineIndex}`,
     text: `${stringValue(entry, "title") ? `${stringValue(entry, "title")}: ` : ""}${answerToString(lineValue)}`,
    }));
   }

   const parts = asRecord(entry.parts);
   const partEntries = Object.entries(parts).filter(
    ([, value]) => typeof value === "string" && value.trim(),
   );
   if (partEntries.length > 0) {
    return partEntries.map(([label, value]) => ({
     id: `${stringValue(entry, "id") || index}-part-${label}`,
     text: `${label}. ${value}`,
    }));
   }

   const sentences = arrayValue(entry, "sentences");
   if (sentences.length > 0) {
    return sentences.map((sentenceValue, sentenceIndex) => {
     const sentence = asRecord(sentenceValue);
     return {
      id: `${stringValue(entry, "id") || index}-sentence-${sentenceIndex}`,
      text: `${stringValue(sentence, "id") || sentenceIndex + 1}. ${stringValue(sentence, "text")}`,
     };
    });
   }

   const text =
    stringValue(entry, "text") ||
    stringValue(entry, "prompt") ||
    stringValue(entry, "zh") ||
    stringValue(entry, "title") ||
    stringValue(entry, "substitution") ||
    stringValue(entry, "wrong_sentence") ||
    stringValue(entry, "correct_sentence") ||
    stringValue(entry, "sample_text") ||
    stringValue(entry, "answer");

   return text
    ? [
       {
        id: stringValue(entry, "id") || `object-${index}`,
        text,
        pinyin: stringValue(entry, "pinyin"),
        meaning: stringValue(entry, "vi") || stringValue(entry, "meaning_vi"),
       },
      ]
    : [];
  })
  .filter((entry) => entry.text);

 if (renderedItems.length === 0)
  return <EmptySectionState reason={emptyReason} />;

 return (
  <div className="flex flex-wrap gap-2">
   {renderedItems.map((entry) => (
    <ExercisePill key={entry.id}>
     {entry.text}
     {displayMode.showPinyin && entry.pinyin && ` · ${entry.pinyin}`}
     {displayMode.showMeaning && entry.meaning && ` · ${entry.meaning}`}
    </ExercisePill>
   ))}
  </div>
 );
}
