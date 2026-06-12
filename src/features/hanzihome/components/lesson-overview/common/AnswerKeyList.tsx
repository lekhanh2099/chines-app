import type { ReactNode } from "react";

import {
 answerToString,
 asRecord,
 stringValue,
} from "@/features/hanzihome/components/lesson-overview/utils";
import { AnswerReveal } from "./AnswerReveal";

export function AnswerKeyList({
 itemId,
 values,
 renderAnswer,
}: {
 itemId: string;
 values: unknown[];
 renderAnswer?: (value: unknown, index: number, content: ReactNode) => ReactNode;
}) {
 type AnswerEntry = {
  id: string;
  label: string;
  value: string;
  pinyin?: string;
  note?: string;
  sourceValue: unknown;
  sourceIndex: number;
 };

 const answers = values
  .map((answerValue, index): AnswerEntry | null => {
   const answer = asRecord(answerValue);
   const label =
    stringValue(answer, "blank_id") ||
    stringValue(answer, "question_id") ||
    stringValue(answer, "label") ||
    stringValue(answer, "id") ||
    `${index + 1}`;
   const value =
    answerToString(answer.answer) ||
    stringValue(answer, "sample_answer") ||
    stringValue(answer, "answer_zh") ||
    stringValue(answer, "value") ||
    stringValue(answer, "text") ||
    stringValue(answer, "zh") ||
    answerToString(answerValue);
   const pinyin = stringValue(answer, "answer_pinyin") || stringValue(answer, "pinyin");
   const note =
    stringValue(answer, "explanation_vi") ||
    stringValue(answer, "note_vi") ||
    stringValue(answer, "answer_vi") ||
    stringValue(answer, "usage_note_vi");

   return value
    ? {
       id: `${itemId}-answer-${index}`,
       label,
       value,
       pinyin: pinyin || undefined,
       note: note || undefined,
       sourceValue: answerValue,
       sourceIndex: index,
      }
    : null;
  })
  .filter((answer): answer is AnswerEntry => answer !== null);

 if (answers.length === 0) return null;

 return (
  <AnswerReveal label={`Xem ${answers.length} đáp án`}>
   {answers.map((answer) => (
    <span key={answer.id}>
     {renderAnswer ? (
      renderAnswer(
       answer.sourceValue,
       answer.sourceIndex,
       <p className=" font-bold text-accent-text">
        {answer.label}: {answer.value}
        {answer.pinyin && ` · ${answer.pinyin}`}
        {answer.note && ` — ${answer.note}`}
       </p>,
      )
     ) : (
      <p className=" font-bold text-accent-text">
       {answer.label}: {answer.value}
       {answer.pinyin && ` · ${answer.pinyin}`}
       {answer.note && ` — ${answer.note}`}
      </p>
     )}
    </span>
   ))}
  </AnswerReveal>
 );
}
