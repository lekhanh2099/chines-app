import { ExercisePill } from "../CommonCards";
import { answerToString } from "../utils";

export function BaSentences({ itemId, values }: { itemId: string; values: unknown[] }) {
 const sentences = values.map(answerToString).filter(Boolean);

 if (sentences.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">Câu 把 trọng tâm</p>
   <div className="flex flex-wrap gap-2">
    {sentences.map((sentence, index) => (
     <ExercisePill key={`${itemId}-ba-${index}`}>{sentence}</ExercisePill>
    ))}
   </div>
  </div>
 );
}
