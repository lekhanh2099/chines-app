import type { ReadingItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import {
 AnswerKeyList,
 ExercisePill,
 ExerciseQuestionCard,
} from "./CommonCards";
import { PassageCard } from "./PassageCard";
import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import { answerToString, arrayValue, asRecord, stringValue } from "./utils";

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
 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];
 const supplementaryItems =
  supplementaryWords.length > 0
   ? supplementaryWords
   : arrayValue(record, "items");
 const questions = arrayValue(record, "questions");
 const answers =
  arrayValue(record, "answers").length > 0
   ? arrayValue(record, "answers")
   : arrayValue(record, "answer_key");
 const wordBank = arrayValue(record, "word_bank").filter(
  (word): word is string => typeof word === "string" && Boolean(word.trim()),
 );
 const exerciseRef = stringValue(record, "exercise_ref");
 const linkedReadingId = stringValue(record, "linked_reading_id");
 const retellOutline = arrayValue(record, "retell_outline").filter(
  (line): line is string => typeof line === "string" && Boolean(line.trim()),
 );
 const baSentences = arrayValue(record, "ba_sentences").filter(
  (line): line is string => typeof line === "string" && Boolean(line.trim()),
 );
 const generatedQuestions = arrayValue(
  record,
  "generated_comprehension_questions",
 );
 const sampleRetelling = asRecord(record.sample_retelling);
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

   <PassageCard
    itemId={item.id}
    passage={record.passage}
    displayMode={displayMode}
   />

   {wordBank.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {wordBank.map((word) => (
      <ExercisePill key={word}>{word}</ExercisePill>
     ))}
    </div>
   )}

   {(exerciseRef || linkedReadingId) && (
    <div className="rounded-xl border border-border-default bg-bg-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Liên kết trong bài
     </p>
     {exerciseRef && (
      <p className="mt-1 text-sm font-bold text-text-primary">
       Bài tập liên quan: {exerciseRef}
      </p>
     )}
     {linkedReadingId && (
      <p className="mt-1 text-sm font-bold text-text-primary">
       Bài đọc liên quan: {linkedReadingId}
      </p>
     )}
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

   {generatedQuestions.length > 0 && (
    <div className="grid gap-2">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Câu hỏi đọc hiểu
     </p>
     {generatedQuestions.map((questionValue, index) => {
      const question = asRecord(questionValue);
      return (
       <ExerciseQuestionCard
        key={
         stringValue(question, "id") || `${item.id}-generated-question-${index}`
        }
        index={index + 1}
        title={stringValue(question, "question") || "Câu hỏi"}
        answer={stringValue(question, "answer")}
        note={stringValue(question, "explanation_vi")}
       />
      );
     })}
    </div>
   )}

   {retellOutline.length > 0 && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Dàn ý kể lại
     </p>
     <div className="grid gap-2">
      {retellOutline.map((line, index) => (
       <p
        key={`${item.id}-retell-${index}`}
        className="rounded-lg bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary"
        lang="zh-CN"
       >
        {index + 1}. {line}
       </p>
      ))}
     </div>
    </div>
   )}

   {(stringValue(sampleRetelling, "zh") ||
    stringValue(sampleRetelling, "vi")) && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Bài kể mẫu
     </p>
     <TextLineCard
      zh={stringValue(sampleRetelling, "zh")}
      pinyin={stringValue(sampleRetelling, "pinyin")}
      vi={stringValue(sampleRetelling, "vi")}
      displayMode={displayMode}
     />
    </div>
   )}

   {baSentences.length > 0 && (
    <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">
      Câu 把 trọng tâm
     </p>
     <div className="flex flex-wrap gap-2">
      {baSentences.map((sentence, index) => (
       <ExercisePill key={`${item.id}-ba-${index}`}>{sentence}</ExercisePill>
      ))}
     </div>
    </div>
   )}
   {answers.length > 0 && (
    <div className="space-y-2">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">
      Đáp án
     </p>
     <div className="flex gap-2 ">
      {answers.map((answer, index) => (
       <p
        key={answer + index}
        className="text-sm font-bold text-accent-text rounded-xl border border-accent/30 bg-accent-subtle p-3"
       >
        {answer}
       </p>
      ))}
     </div>
    </div>
   )}

   <AnswerKeyList itemId={item.id} values={answers} />
  </article>
 );
}
