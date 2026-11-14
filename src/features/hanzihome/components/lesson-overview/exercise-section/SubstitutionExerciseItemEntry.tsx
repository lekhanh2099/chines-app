import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { ExerciseQuestionCard } from "../CommonCards";
import { StudyInstructionText, ReaderHanziText } from "../hanzi-typography";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, stringValue } from "../utils";
import { promptToString } from "./exercise-utils";

/** One `items[]`/`questions[]` entry: an inline model + prompts drill or a prompt/answer card. */
export function SubstitutionItemEntry({
 lessonId,
 itemPath,
 itemId,
 displayMode,
 entryValue,
 entityId,
 index,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 itemId: string;
 displayMode: LessonDisplayMode;
 entryValue: ReturnType<typeof arrayValue>[number];
 entityId: string;
 index: number;
}) {
 const entry = asRecord(entryValue);
 const itemModel = arrayValue(entry, "model");
 const itemPrompts = arrayValue(entry, "prompts");

 // Items with inline model + prompts (substitution_drill variant)
 if (itemModel.length > 0 || itemPrompts.length > 0) {
  const expected = arrayValue(entry, "expected_dialogue")
   .filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
   .join(" / ");
  const answer = expected || stringValue(entry, "sample_answer") || answerToString(entry.answer);

  const content = (
   <ExerciseQuestionCard
    index={index + 1}
    title={stringValue(entry, "title_vi") || `Mẫu ${index + 1}`}
    answer={answer}
    showAnswer={displayMode.showAnswers}
    displayMode={displayMode}
   >
    {itemModel.length > 0 && (
     <div className="exercise-answer-surface grid gap-1.5 rounded-lg border p-3">
      <StudyInstructionText
       variant="overline"
       tone="accent"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       Mẫu
      </StudyInstructionText>
      {itemModel.map((line, li) => (
       <ReaderHanziText
        displayMode={displayMode}
        key={`${itemId}-model-${index}-${li}`}
        tone="default"
        weight="black"
        leading="learner"
       >
        {answerToString(line)}
       </ReaderHanziText>
      ))}
     </div>
    )}
    {itemPrompts.length > 0 && (
     <div className="grid gap-1.5">
      <StudyInstructionText
       variant="overline"
       tone="muted"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       Gợi ý thay thế
      </StudyInstructionText>
      <div className="flex flex-wrap gap-1.5">
       {itemPrompts.map((prompt, pi) => (
        <ReaderHanziText
         displayMode={displayMode}
         size="md"
         key={`${itemId}-prompt-${index}-${pi}`}
         variant="caption"
         tone="secondary"
         weight="bold"
         className="rounded-md border border-border-default bg-bg-card px-2 py-1"
        >
         {answerToString(prompt)}
        </ReaderHanziText>
       ))}
      </div>
     </div>
    )}
   </ExerciseQuestionCard>
  );

  return lessonId && itemPath ? (
   <EditableNodeWrapper
    lessonId={lessonId}
    entityType="exercise_question"
    entityId={entityId}
    parentEntityType="exercise"
    parentEntityId={itemId}
    path={[...itemPath, "items", index]}
    value={entryValue}
    label={`Mẫu ${index + 1}`}
   >
    {content}
   </EditableNodeWrapper>
  ) : (
   <div>{content}</div>
  );
 }

 // Standard items (prompt/answer based)
 const expected = arrayValue(entry, "expected_dialogue")
  .filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
  .join(" / ");
 const answer = expected || stringValue(entry, "sample_answer") || answerToString(entry.answer);

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
   displayMode={displayMode}
   note={stringValue(entry, "explanation_vi")}
  />
 );

 return lessonId && itemPath ? (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="exercise_question"
   entityId={entityId}
   parentEntityType="exercise"
   parentEntityId={itemId}
   path={[...itemPath, "items", index]}
   value={entryValue}
   label={`Câu ${index + 1}`}
  >
   {content}
  </EditableNodeWrapper>
 ) : (
  <div>{content}</div>
 );
}
