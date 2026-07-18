import { ExercisePill } from "../CommonCards";
import { answerToString } from "../utils";
import type { LessonDisplayMode } from "../types";

export function WordBank({
 values,
 displayMode,
}: {
 values: unknown[];
 displayMode: LessonDisplayMode;
}) {
 const words = values.map(answerToString).filter(Boolean);

 if (words.length === 0) return null;

 return (
  <div className="exercise-answer-surface grid gap-2 rounded-xl border p-3 sm:p-4">
   <p className="text-xs font-black uppercase tracking-[0.12em] text-accent-text">Từ cho sẵn</p>
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
