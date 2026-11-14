import { Typography } from "@/components/ui/display/typography";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { EmptySectionState, ExerciseQuestionCard, LooseItemGrid } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import { ModelBlock } from "./ModelBlock";
import { modelLineEntries, promptToString } from "./exercise-utils";

/** One `parts[]` group: title, its own model lines and its practice items. */
export function SubstitutionPartCard({
 lessonId,
 itemPath,
 itemId,
 displayMode,
 partValue,
 partIndex,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 itemId: string;
 displayMode: LessonDisplayMode;
 partValue: ReturnType<typeof arrayValue>[number];
 partIndex: number;
}) {
 const part = asRecord(partValue);
 const partModelEntries = modelLineEntries(part);
 const partItems = arrayValue(part, "items");
 const partTitle =
  stringValue(part, "title_vi") || stringValue(part, "title") || `Mẫu ${partIndex + 1}`;

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <Typography as="h5" variant="cardTitle" tone="default" weight="black">
    {partTitle}
   </Typography>

   <ModelBlock
    title="Mẫu trong phần"
    values={partModelEntries.map((entry) => entry.value)}
    displayMode={displayMode}
    renderValue={
     lessonId && itemPath
      ? (value, modelIndex, content) => (
         <EditableNodeWrapper
          lessonId={lessonId}
          entityType="exercise_question"
          entityId={`${itemId}-part-${partIndex}-model-${modelIndex}`}
          parentEntityType="exercise"
          parentEntityId={itemId}
          path={[...itemPath, "parts", partIndex, partModelEntries[modelIndex]?.key ?? "model"]}
          value={value}
          label={`Mẫu phần ${partIndex + 1}.${modelIndex + 1}`}
         >
          {content}
         </EditableNodeWrapper>
        )
      : undefined
    }
   />

   {lessonId && itemPath ? (
    <div className="grid gap-2">
     {partItems.map((partItemValue, partItemIndex) => {
      const partItem = asRecord(partItemValue);
      const entityId =
       stringValue(partItem, "id") || `${itemId}-part-${partIndex}-item-${partItemIndex}`;

      return (
       <EditableNodeWrapper
        key={entityId}
        lessonId={lessonId}
        entityType="exercise_question"
        entityId={entityId}
        parentEntityType="exercise"
        parentEntityId={itemId}
        path={[...itemPath, "parts", partIndex, "items", partItemIndex]}
        value={partItemValue}
        label={`Câu phần ${partIndex + 1}.${partItemIndex + 1}`}
       >
        <LooseItemGrid items={[partItemValue]} displayMode={displayMode} />
       </EditableNodeWrapper>
      );
     })}
    </div>
   ) : (
    <LooseItemGrid items={partItems} displayMode={displayMode} />
   )}
  </div>
 );
}

/** One `patterns[]` group: its model lines and the substitution prompts that follow them. */
export function SubstitutionPatternCard({
 lessonId,
 itemPath,
 itemId,
 displayMode,
 groupValue,
 groupIndex,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 itemId: string;
 displayMode: LessonDisplayMode;
 groupValue: ReturnType<typeof arrayValue>[number];
 groupIndex: number;
}) {
 const group = asRecord(groupValue);
 const groupModelEntries = modelLineEntries(group);
 const groupItems = arrayValue(group, "items");

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <ModelBlock
    title="Mẫu luyện"
    values={groupModelEntries.map((entry) => entry.value)}
    displayMode={displayMode}
    renderValue={
     lessonId && itemPath
      ? (value, modelIndex, content) => (
         <EditableNodeWrapper
          lessonId={lessonId}
          entityType="exercise_question"
          entityId={`${itemId}-pattern-${groupIndex}-model-${modelIndex}`}
          parentEntityType="exercise"
          parentEntityId={itemId}
          path={[
           ...itemPath,
           "patterns",
           groupIndex,
           groupModelEntries[modelIndex]?.key ?? "model",
          ]}
          value={value}
          label={`Mẫu nhóm ${groupIndex + 1}.${modelIndex + 1}`}
         >
          {content}
         </EditableNodeWrapper>
        )
      : undefined
    }
   />

   {groupItems.length > 0 ? (
    <div className="grid gap-2 md:grid-cols-2">
     {groupItems.map((entryValue, index) => {
      const entry = asRecord(entryValue);
      const title =
       promptToString(entry.prompt) ||
       stringValue(entry, "prompt") ||
       stringValue(entry, "substitution") ||
       stringValue(entry, "text") ||
       "Câu";
      const answer =
       stringValue(entry, "sample_answer") ||
       answerToString(entry.answer) ||
       nonEmptyStrings(arrayValue(entry, "expected_dialogue")).join(" / ");

      const entityId = stringValue(entry, "id") || `${itemId}-${groupIndex}-${index}`;
      const content = (
       <ExerciseQuestionCard
        index={index + 1}
        title={title}
        answer={answer}
        showAnswer={displayMode.showAnswers}
        note={stringValue(entry, "explanation_vi")}
        displayMode={displayMode}
       />
      );

      return lessonId && itemPath ? (
       <EditableNodeWrapper
        key={entityId}
        lessonId={lessonId}
        entityType="exercise_question"
        entityId={entityId}
        parentEntityType="exercise"
        parentEntityId={itemId}
        path={[...itemPath, "patterns", groupIndex, "items", index]}
        value={entryValue}
        label={`Câu nhóm ${groupIndex + 1}.${index + 1}`}
       >
        {content}
       </EditableNodeWrapper>
      ) : (
       <div key={entityId}>{content}</div>
      );
     })}
    </div>
   ) : (
    <EmptySectionState reason="Nhóm mẫu này chưa có câu luyện." />
   )}
  </div>
 );
}
