import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/display/typography";
import type { ReadingItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";

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
 item,
 displayMode,
 debugMode = false,
}: {
 lessonId?: string;
 item: ReadingItem;
 displayMode: LessonDisplayMode;
 debugMode?: boolean;
}) {
 const record = asRecord(item);
 const instruction = asRecord(record.instruction);
 const instructionText = stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const passage = getPassageLikeValue(record, { includeText: true });
 const passageRecord = asRecord(passage);
 const passageTitle = stringValue(passageRecord, "title_vi") || stringValue(passageRecord, "title");
 const readingTitle = item.title_vi || item.title;
 const showPassageTitle = passageTitle !== readingTitle && passageTitle !== item.title;
 const clozeAnswers = getClozeAnswerValues(record);
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

 return (
  <article className="grid min-w-0 gap-3">
   {!passage || instructionText ? (
    <div>
     {!passage ? (
      <Typography as="h4" variant="cardTitle" tone="default" weight="black">
       {item.title_vi || item.title}
      </Typography>
     ) : null}
     {instructionText && (
      <StudyInstructionText tone="muted" weight="semibold">
       {instructionText}
      </StudyInstructionText>
     )}
    </div>
   ) : null}

   <PassageCard
    itemId={item.id}
    passage={passage}
    answers={clozeAnswers}
    displayMode={displayMode}
    lessonId={lessonId}
    showTitle={showPassageTitle}
    title={readingTitle || undefined}
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
        key={questionId}
        itemId={item.id}
        readingType={item.type}
        questionValue={questionValue}
        index={index}
        displayMode={displayMode}
        showAnswers={displayMode.showAnswers}
       />
      );

      // The lesson workspace renders cards directly; read-only previews keep a grid cell.
      return lessonId ? questionCard : <div key={questionId}>{questionCard}</div>;
     })}
    </div>
   )}

   <GeneratedQuestions
    itemId={item.id}
    values={generatedQuestions}
    showAnswers={displayMode.showAnswers}
    displayMode={displayMode}
   />

   <RetellOutline itemId={item.id} values={retellOutline} />

   <SampleRetelling
    value={record.sample_retelling}
    displayMode={displayMode}
    lessonId={lessonId}
    nodeId={`${item.id}-sample-retelling`}
   />

   <BaSentences itemId={item.id} values={baSentences} />

   {!passageOwnsClozeAnswers && (
    <AnswerKeyList itemId={item.id} values={answers} defaultOpen={displayMode.showAnswers} />
   )}

   {debugMode && <RawDataDetails value={item} label="Dữ liệu gốc của reading item" />}
  </article>
 );
}
