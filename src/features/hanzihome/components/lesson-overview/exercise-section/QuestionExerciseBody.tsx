import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type {
 Exercise,
 ReadingItem,
 Section,
} from "@/features/hanzihome/schemas/hanyu-lesson.types";

import {
 AnswerKeyList,
 EmptySectionState,
 ExerciseQuestionCard,
 LooseItemGrid,
} from "../CommonCards";
import { PassageCard } from "../PassageCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { ExerciseRenderIssues } from "./ExerciseRenderIssues";
import { ExtraPayloadBlock } from "./ExtraPayloadBlock";
import { InfoBlock } from "./InfoBlock";
import { MatchingColumn } from "./MatchingColumn";
import { QuestionExerciseQuestionList } from "./QuestionExerciseQuestionList";
import { QuestionGroupCard } from "./QuestionGroupCard";
import { SupplementaryPills } from "./SupplementaryPills";
import { WordBank } from "./WordBank";
import { buildQuestionExerciseModel } from "./question-exercise-model";

type QuestionExerciseBodyProps = {
 item: Exercise;
 displayMode: LessonDisplayMode;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
};

export function QuestionExerciseBody({
 item,
 displayMode,
 readingItems,
 readingSections,
}: QuestionExerciseBodyProps) {
 const {
  record,
  questions,
  items,
  groups,
  parts,
  leftSource,
  leftItems,
  rightSource,
  rightItems,
  answerKey,
  wordBank,
  supplementaryWords,
  pattern,
  model,
  passage,
  showPassageTitle,
  clozeAnswers,
  isReadingCloze,
  questionsOnlyProvideClozeAnswers,
  hasStructuredQuestionGroups,
  isReadingExercise,
  shouldRenderAggregateAnswerKey,
  scenarioText,
  functionText,
  extraPayloads,
  hasStructuredPayload,
 } = buildQuestionExerciseModel({ item, readingItems, readingSections });

 return (
  <div className="grid gap-3">
   <SupplementaryPills itemId={item.id} values={supplementaryWords} displayMode={displayMode} />

   <WordBank values={wordBank} displayMode={displayMode} />

   <InfoBlock title="Tình huống" value={scenarioText} />
   <InfoBlock title="Chức năng giao tiếp" value={functionText} />

   {pattern && (
    <StudyInstructionText
     tone="accent"
     weight="black"
     className="exercise-answer-surface rounded-xl border p-3"
    >
     {pattern}
    </StudyInstructionText>
   )}

   {(stringValue(model, "prompt") || stringValue(model, "answer")) && (
    <ExerciseQuestionCard
     index={0}
     title={stringValue(model, "prompt") || "Mẫu"}
     answer={stringValue(model, "answer")}
     showAnswer={displayMode.showAnswers}
     displayMode={displayMode}
    />
   )}

   {passage ? (
    <PassageCard
     itemId={item.id}
     passage={passage}
     answers={clozeAnswers}
     displayMode={displayMode}
     showTitle={showPassageTitle}
    />
   ) : null}

   <ExerciseRenderIssues
    item={item}
    passage={passage}
    answers={clozeAnswers}
    hasStructuredQuestionGroups={hasStructuredQuestionGroups}
   />

   {items.length > 0 && <LooseItemGrid items={items} displayMode={displayMode} />}

   {parts.length > 0 && (
    <div className="grid gap-3">
     {parts.map((partValue, partIndex) => (
      <QuestionGroupCard
       key={stringValue(asRecord(partValue), "id") || `${item.id}-part-${partIndex}`}
       itemId={`${item.id}-part-${partIndex}`}
       exerciseType={item.type}
       groupValue={partValue}
       index={partIndex}
       fallbackTitle={`Phần ${partIndex + 1}`}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {(leftItems.length > 0 || rightItems.length > 0) && (
    <div className="grid gap-2 md:grid-cols-2">
     <MatchingColumn
      itemId={item.id}
      title="Cột A"
      values={leftItems}
      sourceKey={leftSource?.key ?? "left_items"}
      labelMode="number"
      displayMode={displayMode}
     />

     <MatchingColumn
      itemId={item.id}
      title="Cột B"
      values={rightItems}
      sourceKey={rightSource?.key ?? "right_items"}
      labelMode="letter"
      displayMode={displayMode}
     />
    </div>
   )}

   {extraPayloads.map((payload) => (
    <ExtraPayloadBlock
     key={payload.title}
     title={payload.title}
     value={payload.value}
     displayMode={displayMode}
    />
   ))}

   {groups.length > 0 && (
    <div className="grid gap-2">
     {groups.map((groupValue, index) => (
      <QuestionGroupCard
       key={stringValue(asRecord(groupValue), "id") || `${item.id}-group-${index}`}
       itemId={`${item.id}-group-${index}`}
       exerciseType={item.type}
       groupValue={groupValue}
       index={index}
       fallbackTitle="Nhóm câu"
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {questions.length > 0 && (!isReadingCloze || !questionsOnlyProvideClozeAnswers) ? (
    <QuestionExerciseQuestionList
     item={item}
     displayMode={displayMode}
     questions={questions}
     answerKey={answerKey}
     isReadingExercise={isReadingExercise}
    />
   ) : !hasStructuredPayload ? (
    <EmptySectionState reason={stringValue(record, "empty_reason_vi")} />
   ) : null}

   {shouldRenderAggregateAnswerKey && (
    <AnswerKeyList defaultOpen={displayMode.showAnswers} itemId={item.id} values={answerKey} />
   )}
  </div>
 );
}
