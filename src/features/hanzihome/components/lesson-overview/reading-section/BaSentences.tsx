import { ExercisePill } from "../CommonCards";
import { answerToString } from "../utils";

export function BaSentences({ itemId, values }: { itemId: string; values: unknown[] }) {
 const sentences = values.map(answerToString).filter(Boolean);

 if (sentences.length === 0) return null;

 return (
  <div className="exercise-answer-surface grid gap-2 rounded-xl border p-3">
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">Câu 把 trọng tâm</p>
   <div className="flex flex-wrap gap-2">
    {sentences.map((sentence, index) => (
     <ExercisePill key={`${itemId}-ba-${index}`}>{sentence}</ExercisePill>
    ))}
   </div>
  </div>
 );
}
