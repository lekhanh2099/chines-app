import { Fragment } from "react";
import type { JsonFieldValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { AnswerKeyList, LooseItemGrid } from "../CommonCards";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";
import { QuestionExerciseBody } from "./QuestionExerciseBody";

function dialogueLineText(value: JsonFieldValue) {
 if (typeof value === "string") return value.trim();

 const line = asRecord(value);
 return stringValue(line, "zh") || stringValue(line, "text");
}

function dialogueAnswerValues(dialogue: JsonObject) {
 const sampleAnswers = arrayValue(dialogue, "sample_answers");
 if (sampleAnswers.length > 0) return sampleAnswers;

 const answerHint = stringValue(dialogue, "answer_hint");
 if (answerHint) return [answerHint];

 const answer = stringValue(dialogue, "answer");
 return answer ? [answer] : [];
}

export function CompleteDialogueExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const dialogues = arrayValue(record, "dialogues");
 const fallbackItems = [...arrayValue(record, "items"), ...arrayValue(record, "questions")];

 if (dialogues.length === 0 && arrayValue(record, "questions").length > 0) {
  return <QuestionExerciseBody item={item} displayMode={displayMode} />;
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

       return <Fragment key={lineId}>{lineCard}</Fragment>;
      })}

      <AnswerKeyList
       defaultOpen={displayMode.showAnswers}
       itemId={`${item.id}-dialogue-${index}`}
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

   <AnswerKeyList
    defaultOpen={displayMode.showAnswers}
    itemId={item.id}
    values={arrayValue(record, "answer_key")}
   />
  </div>
 );
}
