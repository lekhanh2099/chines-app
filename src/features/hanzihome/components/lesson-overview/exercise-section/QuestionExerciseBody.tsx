import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type {
 Exercise,
 ReadingItem,
 Section,
} from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { EmptySectionState, ExerciseQuestionCard, LooseItemGrid } from "../CommonCards";
import { PassageCard } from "../PassageCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { EditableAnswerKeyList } from "./EditableAnswerKeyList";
import { ExerciseRenderIssues } from "./ExerciseRenderIssues";
import { ExtraPayloadBlock } from "./ExtraPayloadBlock";
import { InfoBlock } from "./InfoBlock";
import { MatchingColumn } from "./MatchingColumn";
import { QuestionExerciseClozeEditControls } from "./QuestionExerciseClozeEditControls";
import { QuestionExerciseQuestionList } from "./QuestionExerciseQuestionList";
import { QuestionGroupCard } from "./QuestionGroupCard";
import { SupplementaryPills } from "./SupplementaryPills";
import { WordBank } from "./WordBank";
import { buildQuestionExerciseModel } from "./question-exercise-model";

type QuestionExerciseBodyProps = {
 lessonId?: string;
 itemPath?: EditableNodePath;
 item: Exercise;
 displayMode: LessonDisplayMode;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
};

export function QuestionExerciseBody({
 lessonId,
 itemPath,
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
  answerKeySource,
  wordBank,
  supplementaryWords,
  pattern,
  model,
  passage,
  showPassageTitle,
  clozeAnswers,
  passageSegments,
  clozeAnswerSource,
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

   {lessonId && itemPath && wordBank.length > 0 ? (
    <EditableNodeWrapper
     lessonId={lessonId}
     entityType="exercise_word_bank"
     entityId={`${item.id}-word-bank`}
     parentEntityType="exercise"
     parentEntityId={item.id}
     path={[...itemPath, "word_bank"]}
     value={wordBank}
     label="Từ cho sẵn"
    >
     <WordBank values={wordBank} displayMode={displayMode} />
    </EditableNodeWrapper>
   ) : (
    <WordBank values={wordBank} displayMode={displayMode} />
   )}

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

   {lessonId && itemPath ? (
    <QuestionExerciseClozeEditControls
     lessonId={lessonId}
     itemPath={itemPath}
     item={item}
     passageSegments={passageSegments}
     clozeAnswerSource={clozeAnswerSource}
    />
   ) : null}

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

   {items.length > 0 &&
    (lessonId && itemPath ? (
     <div className="grid gap-2">
      {items.map((entryValue, index) => {
       const entry = asRecord(entryValue);
       const entityId = stringValue(entry, "id") || `${item.id}-item-${index}`;

       return (
        <EditableNodeWrapper
         key={entityId}
         lessonId={lessonId}
         entityType="exercise_question"
         entityId={entityId}
         parentEntityType="exercise"
         parentEntityId={item.id}
         path={[...itemPath, "items", index]}
         value={entryValue}
         label={`Mục ${index + 1}`}
        >
         <LooseItemGrid items={[entryValue]} displayMode={displayMode} />
        </EditableNodeWrapper>
       );
      })}
     </div>
    ) : (
     <LooseItemGrid items={items} displayMode={displayMode} />
    ))}

   {parts.length > 0 && (
    <div className="grid gap-3">
     {parts.map((partValue, partIndex) => (
      <QuestionGroupCard
       key={stringValue(asRecord(partValue), "id") || `${item.id}-part-${partIndex}`}
       lessonId={lessonId}
       itemPath={itemPath}
       itemId={`${item.id}-part-${partIndex}`}
       exerciseType={item.type}
       parentExerciseId={item.id}
       groupPath={["parts", partIndex]}
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
      lessonId={lessonId}
      itemPath={itemPath}
      itemId={item.id}
      title="Cột A"
      values={leftItems}
      sourceKey={leftSource?.key ?? "left_items"}
      labelMode="number"
      displayMode={displayMode}
     />

     <MatchingColumn
      lessonId={lessonId}
      itemPath={itemPath}
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
       lessonId={lessonId}
       itemPath={itemPath}
       itemId={`${item.id}-group-${index}`}
       exerciseType={item.type}
       parentExerciseId={item.id}
       groupPath={["groups", index]}
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
     lessonId={lessonId}
     itemPath={itemPath}
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
    <EditableAnswerKeyList
     lessonId={lessonId}
     itemPath={itemPath}
     itemId={item.id}
     sourcePath={[answerKeySource]}
     values={answerKey}
     showAnswers={displayMode.showAnswers}
    />
   )}
  </div>
 );
}
