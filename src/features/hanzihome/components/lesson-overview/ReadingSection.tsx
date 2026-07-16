import type { ReadingItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import {
 EditableNodeWrapper,
 NestedEditControls,
 type EditableNodePath,
} from "@/features/hanzihome/editing";

import { AnswerKeyList, RawDataDetails } from "./CommonCards";
import { PassageCard } from "./PassageCard";
import { BaSentences } from "./reading-section/BaSentences";
import { GeneratedQuestions } from "./reading-section/GeneratedQuestions";
import { LinkedData } from "./reading-section/LinkedData";
import { ReadingQuestionCard } from "./reading-section/ReadingQuestionCard";
import { RetellOutline } from "./reading-section/RetellOutline";
import { SampleRetelling } from "./reading-section/SampleRetelling";
import { SupplementaryPills } from "./reading-section/SupplementaryPills";
import { WordBank } from "./reading-section/WordBank";
import type { LessonDisplayMode } from "./types";
import {
 arrayValue,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
 hasClozeAnswerValue,
 stringValue,
} from "./utils";

export function ReadingCard({
 lessonId,
 parentSectionId,
 path,
 item,
 displayMode,
 debugMode = false,
}: {
 lessonId?: string;
 parentSectionId?: string;
 path?: EditableNodePath;
 item: ReadingItem;
 displayMode: LessonDisplayMode;
 debugMode?: boolean;
}) {
 const record = asRecord(item);
 const instruction = asRecord(record.instruction);
 const instructionText = stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const passage = getPassageLikeValue(record, { includeText: true });
 const clozeAnswers = getClozeAnswerValues(record);
 const directPassage = asRecord(record.passage);
 const passageSegments =
  arrayValue(directPassage, "segments").length > 0
   ? {
      path: ["passage", "segments"] as EditableNodePath,
      values: arrayValue(directPassage, "segments"),
     }
   : arrayValue(record, "segments").length > 0
     ? {
        path: ["segments"] as EditableNodePath,
        values: arrayValue(record, "segments"),
       }
     : null;
 const clozeAnswerSource = [
  "blanks",
  "answers",
  "answer_key",
  "cloze_answers",
  "suggested_answers",
  "questions",
 ]
  .map((key) => ({ key, values: arrayValue(record, key) }))
  .find(({ values }) => values.some(hasClozeAnswerValue));

 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];

 const questions = arrayValue(record, "questions");
 const questionsOnlyProvideClozeAnswers =
  item.type === "reading_cloze" &&
  questions.length > 0 &&
  questions.every((questionValue) => {
   const question = asRecord(questionValue);

   return (
    hasClozeAnswerValue(questionValue) &&
    !stringValue(question, "prompt") &&
    !stringValue(question, "question") &&
    !stringValue(question, "text") &&
    !stringValue(asRecord(question.statement), "zh") &&
    !stringValue(asRecord(question.statement), "vi")
   );
  });
 const visibleQuestions = questionsOnlyProvideClozeAnswers ? [] : questions;
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
 const generatedQuestions = arrayValue(record, "generated_comprehension_questions");
 const passageOwnsClozeAnswers = Boolean(passage) && clozeAnswers.length > 0;

 const content = (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">{item.title_vi || item.title}</h4>
    {instructionText && <p className=" font-semibold text-text-muted">{instructionText}</p>}
   </div>

   {lessonId && path && passageSegments ? (
    <NestedEditControls
     lessonId={lessonId}
     parentEntityType="reading_item"
     parentEntityId={item.id}
     title="Cloze segments"
     nodes={passageSegments.values.map((segment, index) => {
      const segmentRecord = asRecord(segment);
      return {
       entityType: "exercise_cloze_segment",
       entityId: stringValue(segmentRecord, "id") || `${item.id}-segment-${index}`,
       path: [...path, ...passageSegments.path, index],
       value: segment,
       label: `Segment ${index + 1}`,
      };
     })}
    />
   ) : null}

   {lessonId && path && clozeAnswerSource ? (
    <NestedEditControls
     lessonId={lessonId}
     parentEntityType="reading_item"
     parentEntityId={item.id}
     title="Đáp án cloze"
     nodes={clozeAnswerSource.values.map((answer, index) => {
      const answerRecord = asRecord(answer);
      return {
       entityType: "exercise_cloze_answer",
       entityId:
        stringValue(answerRecord, "id") ||
        stringValue(answerRecord, "blank_id") ||
        `${item.id}-cloze-answer-${index}`,
       path: [...path, clozeAnswerSource.key, index],
       value: answer,
       label: `Đáp án ${index + 1}`,
      };
     })}
    />
   ) : null}

   <PassageCard
    itemId={item.id}
    passage={passage}
    answers={clozeAnswers}
    displayMode={displayMode}
   />

   {!passage && (
    <SupplementaryPills itemId={item.id} values={supplementaryWords} displayMode={displayMode} />
   )}

   {!passage && <WordBank values={wordBank} />}

   <LinkedData exerciseRef={exerciseRef} linkedReadingId={linkedReadingId} />

   {visibleQuestions.length > 0 && (
    <div className="grid gap-2">
     {visibleQuestions.map((questionValue, index) => {
      const questionId = stringValue(asRecord(questionValue), "id") || `${item.id}-${index}`;
      const questionCard = (
       <ReadingQuestionCard
        itemId={item.id}
        readingType={item.type}
        questionValue={questionValue}
        index={index}
        showAnswers={displayMode.showAnswers}
       />
      );

      return lessonId && path ? (
       <EditableNodeWrapper
        key={questionId}
        lessonId={lessonId}
        entityType="reading_question"
        entityId={questionId}
        parentEntityType="reading_item"
        parentEntityId={item.id}
        path={[...path, "questions", index]}
        value={questionValue}
        label={`Câu đọc hiểu ${index + 1}`}
       >
        {questionCard}
       </EditableNodeWrapper>
      ) : (
       <div key={questionId}>{questionCard}</div>
      );
     })}
    </div>
   )}

   <GeneratedQuestions
    itemId={item.id}
    values={generatedQuestions}
    showAnswers={displayMode.showAnswers}
   />

   <RetellOutline itemId={item.id} values={retellOutline} />

   <SampleRetelling value={record.sample_retelling} displayMode={displayMode} />

   <BaSentences itemId={item.id} values={baSentences} />

   {!passageOwnsClozeAnswers && (
    <AnswerKeyList itemId={item.id} values={answers} defaultOpen={displayMode.showAnswers} />
   )}

   {debugMode && <RawDataDetails value={item} label="Dữ liệu gốc của reading item" />}
  </article>
 );

 if (!lessonId || !path) return content;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="reading_item"
   entityId={item.id}
   parentEntityType="section"
   parentEntityId={parentSectionId}
   path={path}
   value={item}
   label={item.title_vi || item.title}
   editLabel="Sửa bài đọc"
  >
   {content}
  </EditableNodeWrapper>
 );
}
