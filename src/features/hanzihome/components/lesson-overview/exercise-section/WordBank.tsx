import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";
import { ExercisePill } from "../CommonCards";
import { answerToString } from "../utils";
import type { LessonDisplayMode } from "../types";

export function WordBank({
 values,
 displayMode,
}: {
 values: JsonValue[];
 displayMode: LessonDisplayMode;
}) {
 const words = values.map(answerToString).filter(Boolean);

 if (words.length === 0) return null;

 return (
  <div className="exercise-answer-surface grid gap-2 rounded-xl border p-3 sm:p-4">
   <StudyInstructionText
    variant="overline"
    tone="accent"
    weight="black"
    tracking="medium"
    transform="uppercase"
   >
    Từ cho sẵn
   </StudyInstructionText>
   <div className="flex flex-wrap gap-2">
    {words.map((word, index) => (
     <ExercisePill key={`${word}-${index}`} displayMode={displayMode}>
      {word}
     </ExercisePill>
    ))}
   </div>
  </div>
 );
}
