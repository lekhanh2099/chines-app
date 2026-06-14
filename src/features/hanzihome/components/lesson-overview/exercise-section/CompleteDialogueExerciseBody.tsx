import { EditableNodeWrapper, type DraftPatchPath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { LooseItemGrid } from "../CommonCards";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";
import { EditableAnswerKeyList } from "./EditableAnswerKeyList";

export function CompleteDialogueExerciseBody({
 lessonId,
 itemPath,
 item,
 displayMode,
}: {
 lessonId?: string;
 itemPath?: DraftPatchPath;
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const dialogues = arrayValue(record, "dialogues");
 const fallbackItems = [...arrayValue(record, "items"), ...arrayValue(record, "questions")];

 return (
  <div className="grid gap-3">
   {dialogues.map((dialogueValue, index) => {
    const dialogue = asRecord(dialogueValue);
    const lines = arrayValue(dialogue, "lines");
    const answers = arrayValue(dialogue, "sample_answers");

    return (
     <div
      key={stringValue(dialogue, "id") || `${item.id}-${index}`}
      className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
     >
      {lines.map((lineValue, lineIndex) => {
       const line = asRecord(lineValue);

       const lineCard = (
        <TextLineCard
         speaker={stringValue(line, "speaker")}
         zh={stringValue(line, "zh") || stringValue(line, "text")}
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
   />
  </div>
 );
}
