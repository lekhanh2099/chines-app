import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";
import { ExercisePill } from "../CommonCards";
import { answerToString } from "../utils";

export function BaSentences({ itemId, values }: { itemId: string; values: JsonValue[] }) {
 const sentences = values.map(answerToString).filter(Boolean);

 if (sentences.length === 0) return null;

 return (
  <div className="exercise-answer-surface grid gap-2 rounded-xl border p-3">
   <StudyInstructionText
    variant="overline"
    tone="accent"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Câu 把 trọng tâm
   </StudyInstructionText>
   <div className="flex flex-wrap gap-2">
    {sentences.map((sentence, index) => (
     <ExercisePill key={`${itemId}-ba-${index}`}>{sentence}</ExercisePill>
    ))}
   </div>
  </div>
 );
}
