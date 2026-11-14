import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";
import { answerToString } from "../utils";
import { DataPill } from "./DataPill";

export function WordBank({ words }: { words: JsonValue[] }) {
 const wordBank = words.map(answerToString).filter((word): word is string => Boolean(word));

 if (wordBank.length === 0) return null;

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Từ cho sẵn
   </StudyInstructionText>
   <div className="flex flex-wrap gap-2">
    {wordBank.map((word, index) => (
     <DataPill key={`${word}-${index}`} label={word} />
    ))}
   </div>
  </div>
 );
}
