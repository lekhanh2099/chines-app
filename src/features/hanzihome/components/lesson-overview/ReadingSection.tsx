import type { ReadingItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import {
 AnswerKeyList,
 ExercisePill,
 ExerciseQuestionCard,
} from "./CommonCards";
import { PassageCard } from "./PassageCard";
import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import {
 answerToString,
 arrayValue,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
 stringValue,
} from "./utils";

function formatAnswer(value: unknown): string {
 if (typeof value === "boolean") return value ? "Đúng" : "Sai";
 return answerToString(value);
}

function objectText(
 value: unknown,
 keys: string[] = ["zh", "vi", "text", "prompt", "question"],
) {
 const record = asRecord(value);

 for (const key of keys) {
  const text = stringValue(record, key);
  if (text) return text;
 }

 return "";
}

function ReadingQuestionCard({
 itemId,
 questionValue,
 index,
}: {
 itemId: string;
 questionValue: unknown;
 index: number;
}) {
 const question = asRecord(questionValue);
 const nestedQuestion = asRecord(question.question);
 const statement = asRecord(question.statement);
 const answerRecord = asRecord(question.answer);

 const choices = arrayValue(question, "choices")
  .map((choiceValue) => {
   const choice = asRecord(choiceValue);
   return (
    stringValue(choice, "text") ||
    stringValue(choice, "zh") ||
    stringValue(choice, "label") ||
    answerToString(choiceValue)
   );
  })
  .filter(Boolean);

 const title =
  stringValue(question, "prompt") ||
  stringValue(question, "question") ||
  stringValue(question, "text") ||
  stringValue(nestedQuestion, "zh") ||
  stringValue(nestedQuestion, "vi") ||
  stringValue(statement, "zh") ||
  stringValue(statement, "vi") ||
  "Câu hỏi";

 const answer =
  formatAnswer(question.answer) ||
  stringValue(answerRecord, "zh") ||
  stringValue(answerRecord, "vi") ||
  stringValue(question, "sample_answer") ||
  stringValue(question, "correct_answer_label") ||
  stringValue(question, "correct") ||
  stringValue(question, "correct_sentence");

 const note =
  stringValue(question, "explanation_vi") ||
  stringValue(question, "note_vi") ||
  objectText(question.evidence, ["quote"]);

 return (
  <ExerciseQuestionCard
   key={stringValue(question, "id") || `${itemId}-question-${index}`}
   index={index + 1}
   title={choices.length > 0 ? `${title} (${choices.join(" / ")})` : title}
   answer={answer}
   note={note}
  />
 );
}

function SupplementaryPills({
 itemId,
 values,
 displayMode,
}: {
 itemId: string;
 values: unknown[];
 displayMode: LessonDisplayMode;
}) {
 if (values.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Từ bổ sung
   </p>
   <div className="flex flex-wrap gap-2">
    {values.map((wordValue, index) => {
     const word = asRecord(wordValue);
     const hanzi =
      stringValue(word, "hanzi") ||
      stringValue(word, "text") ||
      stringValue(word, "zh") ||
      answerToString(wordValue);
     const pinyin = stringValue(word, "pinyin");
     const meaning = stringValue(word, "meaning_vi");
     const pos = stringValue(word, "pos");

     if (!hanzi) return null;

     return (
      <ExercisePill
       key={stringValue(word, "id") || `${itemId}-supplement-${index}`}
      >
       {hanzi}
       {displayMode.showPinyin && pinyin && ` · ${pinyin}`}
       {displayMode.showMeaning && meaning && ` · ${meaning}`}
       {pos && ` · ${pos}`}
      </ExercisePill>
     );
    })}
   </div>
  </div>
 );
}

function WordBank({ values }: { values: unknown[] }) {
 const words = values.map(answerToString).filter(Boolean);

 if (words.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Từ cho sẵn
   </p>
   <div className="flex flex-wrap gap-2">
    {words.map((word) => (
     <ExercisePill key={word}>{word}</ExercisePill>
    ))}
   </div>
  </div>
 );
}

function GeneratedQuestions({
 itemId,
 values,
}: {
 itemId: string;
 values: unknown[];
}) {
 if (values.length === 0) return null;

 return (
  <div className="grid gap-2">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Câu hỏi đọc hiểu
   </p>
   {values.map((questionValue, index) => {
    const question = asRecord(questionValue);
    const title =
     stringValue(question, "question") ||
     stringValue(question, "prompt") ||
     stringValue(question, "zh") ||
     "Câu hỏi";
    const answer =
     stringValue(question, "answer") ||
     stringValue(question, "answer_zh") ||
     stringValue(question, "sample_answer");

    return (
     <ExerciseQuestionCard
      key={
       stringValue(question, "id") || `${itemId}-generated-question-${index}`
      }
      index={index + 1}
      title={title}
      answer={answer}
      note={
       stringValue(question, "explanation_vi") ||
       stringValue(question, "note_vi")
      }
     />
    );
   })}
  </div>
 );
}

function RetellOutline({
 itemId,
 values,
}: {
 itemId: string;
 values: unknown[];
}) {
 const outline = values.map(answerToString).filter(Boolean);

 if (outline.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Dàn ý kể lại
   </p>
   <div className="grid gap-2">
    {outline.map((line, index) => (
     <p
      key={`${itemId}-retell-${index}`}
      className="rounded-lg bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary"
      lang="zh-CN"
     >
      {index + 1}. {line}
     </p>
    ))}
   </div>
  </div>
 );
}

function SampleRetelling({
 value,
 displayMode,
}: {
 value: unknown;
 displayMode: LessonDisplayMode;
}) {
 const sample = asRecord(value);
 const zh = stringValue(sample, "zh") || stringValue(sample, "text");
 const vi = stringValue(sample, "vi") || stringValue(sample, "meaning_vi");

 if (!zh && !vi) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Bài kể mẫu
   </p>
   <TextLineCard
    zh={zh || vi}
    pinyin={stringValue(sample, "pinyin")}
    vi={vi}
    displayMode={displayMode}
   />
  </div>
 );
}

function BaSentences({
 itemId,
 values,
}: {
 itemId: string;
 values: unknown[];
}) {
 const sentences = values.map(answerToString).filter(Boolean);

 if (sentences.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">
    Câu 把 trọng tâm
   </p>
   <div className="flex flex-wrap gap-2">
    {sentences.map((sentence, index) => (
     <ExercisePill key={`${itemId}-ba-${index}`}>{sentence}</ExercisePill>
    ))}
   </div>
  </div>
 );
}

function LinkedData({
 exerciseRef,
 linkedReadingId,
}: {
 exerciseRef: string;
 linkedReadingId: string;
}) {
 if (!exerciseRef && !linkedReadingId) return null;

 return (
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
 );
}

function RawDataDetails({ value }: { value: unknown }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
    Dữ liệu gốc của reading item
   </summary>
   <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
 );
}

export function ReadingCard({
 item,
 displayMode,
}: {
 item: ReadingItem;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const instruction = asRecord(record.instruction);
 const instructionText =
  stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const passage = getPassageLikeValue(record, { includeText: true });
 const clozeAnswers = getClozeAnswerValues(record);

 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];

 const questions = arrayValue(record, "questions");
 const answers =
  arrayValue(record, "blanks").length > 0
   ? arrayValue(record, "blanks")
   : arrayValue(record, "answers").length > 0
     ? arrayValue(record, "answers")
     : arrayValue(record, "answer_key");

 const wordBank = arrayValue(record, "word_bank");
 const exerciseRef = stringValue(record, "exercise_ref");
 const linkedReadingId = stringValue(record, "linked_reading_id");
 const retellOutline = arrayValue(record, "retell_outline");
 const baSentences = arrayValue(record, "ba_sentences");
 const generatedQuestions = arrayValue(
  record,
  "generated_comprehension_questions",
 );

 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">
     {item.title_vi || item.title}
    </h4>
    {instructionText && (
     <p className="text-sm font-semibold text-text-muted">{instructionText}</p>
    )}
   </div>

   <PassageCard
    itemId={item.id}
    passage={passage}
    answers={clozeAnswers}
    displayMode={displayMode}
   />

   {!passage && (
    <SupplementaryPills
     itemId={item.id}
     values={supplementaryWords}
     displayMode={displayMode}
    />
   )}

   {!passage && <WordBank values={wordBank} />}

   <LinkedData exerciseRef={exerciseRef} linkedReadingId={linkedReadingId} />

   {questions.length > 0 && (
    <div className="grid gap-2">
     {questions.map((questionValue, index) => (
      <ReadingQuestionCard
       key={stringValue(asRecord(questionValue), "id") || `${item.id}-${index}`}
       itemId={item.id}
       questionValue={questionValue}
       index={index}
      />
     ))}
    </div>
   )}

   <GeneratedQuestions itemId={item.id} values={generatedQuestions} />

   <RetellOutline itemId={item.id} values={retellOutline} />

   <SampleRetelling value={record.sample_retelling} displayMode={displayMode} />

   <BaSentences itemId={item.id} values={baSentences} />

   <AnswerKeyList itemId={item.id} values={answers} />

   <RawDataDetails value={item} />
  </article>
 );
}
