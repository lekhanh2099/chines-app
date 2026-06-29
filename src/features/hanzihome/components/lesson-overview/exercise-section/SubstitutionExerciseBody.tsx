import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { EmptySectionState, ExerciseQuestionCard, LooseItemGrid } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import { EditableAnswerKeyList } from "./EditableAnswerKeyList";
import { ModelBlock } from "./ModelBlock";
import { SupplementaryPills } from "./SupplementaryPills";
import { firstArraySource, modelLineEntries, promptToString } from "./exercise-utils";

export function SubstitutionExerciseBody({
 lessonId,
 itemPath,
 item,
 displayMode,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const modelSource = firstArraySource(record, ["model"]);
 const modelsSource = firstArraySource(record, ["models"]);
 const model = modelSource?.values ?? [];
 const models = modelsSource?.values ?? [];
 const patternGroups = arrayValue(record, "patterns");
 const partGroups = arrayValue(record, "parts");
 const items = [...arrayValue(record, "items"), ...arrayValue(record, "questions")];
 const answerKey = arrayValue(record, "answer_key");
 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];

 return (
  <div className="grid gap-3">
   <SupplementaryPills itemId={item.id} values={supplementaryWords} displayMode={displayMode} />

   <ModelBlock
    values={[...model, ...models]}
    displayMode={displayMode}
    renderValue={
     lessonId && itemPath
      ? (value, index, content) => {
         const source = index < model.length ? modelSource : modelsSource;
         const sourceIndex = index < model.length ? index : index - model.length;
         const valueRecord = asRecord(value);
         const entityId =
          stringValue(valueRecord, "id") || `${item.id}-${source?.key ?? "model"}-${sourceIndex}`;

         return (
          <EditableNodeWrapper
           lessonId={lessonId}
           entityType="exercise_question"
           entityId={entityId}
           parentEntityType="exercise"
           parentEntityId={item.id}
           path={[...itemPath, source?.key ?? "model", sourceIndex]}
           value={value}
           label={`Mẫu ${sourceIndex + 1}`}
          >
           {content}
          </EditableNodeWrapper>
         );
        }
      : undefined
    }
   />

   {partGroups.length > 0 && (
    <div className="grid gap-3">
     {partGroups.map((partValue, partIndex) => {
      const part = asRecord(partValue);
      const partModelEntries = modelLineEntries(part);
      const partItems = arrayValue(part, "items");
      const partTitle =
       stringValue(part, "title_vi") || stringValue(part, "title") || `Mẫu ${partIndex + 1}`;

      return (
       <div
        key={stringValue(part, "id") || `${item.id}-part-${partIndex}`}
        className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
       >
        <h5 className="font-black text-text-primary">{partTitle}</h5>

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
               entityId={`${item.id}-part-${partIndex}-model-${modelIndex}`}
               parentEntityType="exercise"
               parentEntityId={item.id}
               path={[
                ...itemPath,
                "parts",
                partIndex,
                partModelEntries[modelIndex]?.key ?? "model",
               ]}
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
            stringValue(partItem, "id") || `${item.id}-part-${partIndex}-item-${partItemIndex}`;

           return (
            <EditableNodeWrapper
             key={entityId}
             lessonId={lessonId}
             entityType="exercise_question"
             entityId={entityId}
             parentEntityType="exercise"
             parentEntityId={item.id}
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
     })}
    </div>
   )}

   {patternGroups.length > 0 && (
    <div className="grid gap-3">
     {patternGroups.map((groupValue, groupIndex) => {
      const group = asRecord(groupValue);
      const groupModelEntries = modelLineEntries(group);
      const groupItems = arrayValue(group, "items");

      return (
       <div
        key={stringValue(group, "id") || `${item.id}-pattern-${groupIndex}`}
        className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
       >
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
               entityId={`${item.id}-pattern-${groupIndex}-model-${modelIndex}`}
               parentEntityType="exercise"
               parentEntityId={item.id}
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

           const entityId = stringValue(entry, "id") || `${item.id}-${groupIndex}-${index}`;
           const content = (
            <ExerciseQuestionCard
             index={index + 1}
             title={title}
             answer={answer}
             showAnswer={displayMode.showAnswers}
             note={stringValue(entry, "explanation_vi")}
            />
           );

           return lessonId && itemPath ? (
            <EditableNodeWrapper
             key={entityId}
             lessonId={lessonId}
             entityType="exercise_question"
             entityId={entityId}
             parentEntityType="exercise"
             parentEntityId={item.id}
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
     })}
    </div>
   )}

   {items.length > 0 ? (
    <div className="grid gap-2 md:grid-cols-2">
     {items.map((entryValue, index) => {
      const entry = asRecord(entryValue);
      const expected = arrayValue(entry, "expected_dialogue")
       .filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
       .join(" / ");
      const answer =
       expected || stringValue(entry, "sample_answer") || answerToString(entry.answer);

      const entityId = stringValue(entry, "id") || `${item.id}-${index}`;
      const content = (
       <ExerciseQuestionCard
        index={index + 1}
        title={
         promptToString(entry.prompt) ||
         stringValue(entry, "substitution") ||
         stringValue(entry, "prompt") ||
         stringValue(entry, "text") ||
         answer ||
         "Câu"
       }
        answer={answer}
        showAnswer={displayMode.showAnswers}
        note={stringValue(entry, "explanation_vi")}
       />
      );

      return lessonId && itemPath ? (
       <EditableNodeWrapper
        key={entityId}
        lessonId={lessonId}
        entityType="exercise_question"
        entityId={entityId}
        parentEntityType="exercise"
        parentEntityId={item.id}
        path={[...itemPath, "items", index]}
        value={entryValue}
        label={`Câu ${index + 1}`}
       >
        {content}
       </EditableNodeWrapper>
      ) : (
       <div key={entityId}>{content}</div>
      );
     })}
    </div>
   ) : (
    patternGroups.length === 0 &&
    partGroups.length === 0 && <EmptySectionState reason={stringValue(record, "empty_reason_vi")} />
   )}

   <EditableAnswerKeyList
    lessonId={lessonId}
    itemPath={itemPath}
    itemId={item.id}
   sourcePath={["answer_key"]}
   values={answerKey}
   showAnswers={displayMode.showAnswers}
  />
  </div>
 );
}
