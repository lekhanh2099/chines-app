import type { JsonValue } from "@/types/json";
import { ExercisePill } from "../CommonCards";
import { answerToString } from "../utils";

export function WordBank({ values }: { values: JsonValue[] }) {
 const words = values.map(answerToString).filter(Boolean);

 if (words.length === 0) return null;

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Từ cho sẵn</p>
   <div className="flex flex-wrap gap-2">
    {words.map((word, index) => (
     <ExercisePill key={`${word}-${index}`}>{word}</ExercisePill>
    ))}
   </div>
  </div>
 );
}
