import type { ReadingItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { AnswerKeyList, ExercisePill, ExerciseQuestionCard } from "./CommonCards";
import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import {
 answerToString,
 arrayValue,
 asRecord,
 stringValue,
} from "./utils";

export function ReadingCard({
 item,
 displayMode,
}: {
 item: ReadingItem;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const paragraphs =
  "paragraphs" in item && Array.isArray(item.paragraphs)
   ? item.paragraphs.filter(
      (
       paragraph,
      ): paragraph is {
       id: string;
       zh: string;
       pinyin?: string;
       vi?: string;
      } =>
       Boolean(paragraph) &&
       typeof paragraph === "object" &&
       "id" in paragraph &&
       "zh" in paragraph &&
       typeof paragraph.id === "string" &&
       typeof paragraph.zh === "string",
     )
   : [];
 const flatText = stringValue(record, "text");
 const flatPinyin = stringValue(record, "pinyin");
 const flatMeaning = stringValue(record, "vi");
 const supplementaryWords = arrayValue(record, "supplementary_words");
 const supplementaryItems =
  supplementaryWords.length > 0
   ? supplementaryWords
   : arrayValue(record, "items");
 const questions = arrayValue(record, "questions");
 const answers =
  arrayValue(record, "answers").length > 0
   ? arrayValue(record, "answers")
   : arrayValue(record, "answer_key");
 const passage = asRecord(record.passage);
 const segments =
  arrayValue(passage, "segments").length > 0
   ? arrayValue(passage, "segments")
   : arrayValue(record, "cloze_segments");
 const passageText = typeof record.passage === "string" ? record.passage : "";
 const wordBank = arrayValue(record, "word_bank").filter(
  (word): word is string => typeof word === "string" && Boolean(word.trim()),
 );
 const instruction = asRecord(record.instruction);

 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">
     {item.title_vi || item.title}
    </h4>
    {(stringValue(instruction, "vi") || stringValue(instruction, "zh")) && (
     <p className="text-sm font-semibold text-text-muted">
      {stringValue(instruction, "vi") || stringValue(instruction, "zh")}
     </p>
    )}
   </div>

   {supplementaryItems.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {supplementaryItems.map((wordValue, index) => {
      const word = asRecord(wordValue);
      const hanzi =
       stringValue(word, "hanzi") ||
       stringValue(word, "text") ||
       answerToString(wordValue);
      const pinyin = stringValue(word, "pinyin");
      const meaning = stringValue(word, "meaning_vi");
      return (
       <ExercisePill
        key={stringValue(word, "id") || `${item.id}-word-${index}`}
       >
        {hanzi}
        {displayMode.showPinyin && pinyin && ` · ${pinyin}`}
        {displayMode.showMeaning && meaning && ` · ${meaning}`}
       </ExercisePill>
      );
     })}
    </div>
   )}

   {paragraphs.length === 0 && flatText && (
    <TextLineCard
     zh={flatText}
     pinyin={flatPinyin}
     vi={flatMeaning}
     displayMode={displayMode}
    />
   )}

   {paragraphs.length > 0 && (
    <div className="grid gap-2">
     {paragraphs.map((paragraph) => (
      <TextLineCard
       key={paragraph.id}
       zh={paragraph.zh}
       pinyin={paragraph.pinyin}
       vi={paragraph.vi}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {(segments.length > 0 || passageText) && (
    <div className="rounded-xl border border-border-default bg-bg-subtle p-4">
     <p
      className="whitespace-pre-wrap text-base font-bold leading-8 text-text-primary"
      lang="zh-CN"
     >
      {passageText ||
       segments
        .map((segmentValue, index) => {
         const segment = asRecord(segmentValue);
         if (stringValue(segment, "type") === "blank") {
          return ` ____(${stringValue(segment, "blank_id") || index + 1})____ `;
         }
         return stringValue(segment, "text");
        })
        .join("")}
     </p>
    </div>
   )}

   {wordBank.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {wordBank.map((word) => (
      <ExercisePill key={word}>{word}</ExercisePill>
     ))}
    </div>
   )}

   {questions.length > 0 && (
    <div className="grid gap-2">
     {questions.map((questionValue, index) => {
      const question = asRecord(questionValue);
      const choices = arrayValue(question, "choices")
       .map((choiceValue) => stringValue(asRecord(choiceValue), "text"))
       .filter(Boolean);
      const title =
       stringValue(question, "prompt") ||
       stringValue(asRecord(question.question), "zh") ||
       stringValue(asRecord(question.statement), "zh") ||
       stringValue(question, "text") ||
       "Câu hỏi";
      const answer =
       answerToString(question.answer) ||
       stringValue(asRecord(question.answer), "zh") ||
       stringValue(asRecord(question.answer), "vi") ||
       stringValue(question, "sample_answer") ||
       (typeof question.answer === "boolean"
        ? question.answer
          ? "Đúng"
          : "Sai"
        : "");

      return (
       <ExerciseQuestionCard
        key={stringValue(question, "id") || `${item.id}-question-${index}`}
        index={index + 1}
        title={choices.length > 0 ? `${title} (${choices.join(" / ")})` : title}
        answer={answer}
        note={stringValue(question, "explanation_vi")}
       />
      );
     })}
    </div>
   )}

   <AnswerKeyList itemId={item.id} values={answers} />
  </article>
 );
}
