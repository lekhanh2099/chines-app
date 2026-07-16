import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { LooseItemGrid } from "../CommonCards";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";
import { EditableAnswerKeyList } from "./EditableAnswerKeyList";
import { QuestionExerciseBody } from "./QuestionExerciseBody";

function dialogueLineText(value: unknown) {
 if (typeof value === "string") return value.trim();

 const line = asRecord(value);
 return stringValue(line, "zh") || stringValue(line, "text");
}

function dialogueAnswerValues(dialogue: Record<string, unknown>) {
 const sampleAnswers = arrayValue(dialogue, "sample_answers");
 if (sampleAnswers.length > 0) return sampleAnswers;

 const answerHint = stringValue(dialogue, "answer_hint");
 if (answerHint) return [answerHint];

 const answer = stringValue(dialogue, "answer");
 return answer ? [answer] : [];
}

export function CompleteDialogueExerciseBody({
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
 const dialogues = arrayValue(record, "dialogues");
 const fallbackItems = [...arrayValue(record, "items"), ...arrayValue(record, "questions")];

 if (dialogues.length === 0 && arrayValue(record, "questions").length > 0) {
  return (
   <QuestionExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 return (
  <div className="grid gap-3">
   {dialogues.map((dialogueValue, index) => {
    const dialogue = asRecord(dialogueValue);
    const lines = arrayValue(dialogue, "lines");
    const answers = dialogueAnswerValues(dialogue);

    return (
     <div
      key={stringValue(dialogue, "id") || `${item.id}-${index}`}
      className="exercise-card-surface grid gap-2 rounded-xl border p-3"
     >
      {lines.map((lineValue, lineIndex) => {
       const line = asRecord(lineValue);

       const lineCard = (
        <TextLineCard
         speaker={stringValue(line, "speaker")}
         zh={dialogueLineText(lineValue)}
         pinyin={stringValue(line, "pinyin")}
         vi={stringValue(line, "vi")}
         displayMode={displayMode}
        />
       );
       const lineId = stringValue(line, "id") || `${item.id}-line-${lineIndex}`;

       return lessonId && itemPath ? (
        <EditableNodeWrapper
         key={lineId}
         lessonId={lessonId}
         entityType="exercise_dialogue_line"
         entityId={lineId}
         parentEntityType="exercise"
         parentEntityId={item.id}
         path={[...itemPath, "dialogues", index, "lines", lineIndex]}
         value={lineValue}
         label={`Dòng hội thoại ${lineIndex + 1}`}
        >
         {lineCard}
        </EditableNodeWrapper>
       ) : (
        <div key={lineId}>{lineCard}</div>
       );
      })}

      <EditableAnswerKeyList
       lessonId={lessonId}
       itemPath={itemPath}
       itemId={`${item.id}-dialogue-${index}`}
       sourcePath={["dialogues", index, "sample_answers"]}
       values={answers}
       showAnswers={displayMode.showAnswers}
      />
     </div>
    );
   })}

   {dialogues.length === 0 && (
    <LooseItemGrid
     items={fallbackItems}
     displayMode={displayMode}
     emptyReason={stringValue(record, "empty_reason_vi")}
    />
   )}

   <EditableAnswerKeyList
    lessonId={lessonId}
    itemPath={itemPath}
    itemId={item.id}
    sourcePath={["answer_key"]}
    values={arrayValue(record, "answer_key")}
    showAnswers={displayMode.showAnswers}
   />
  </div>
 );
}
