import { answerToString } from "../utils";
import { DataPill } from "./DataPill";

export function WordBank({ words }: { words: unknown[] }) {
 const wordBank = words.map(answerToString).filter((word): word is string => Boolean(word));

 if (wordBank.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Từ cho sẵn</p>
   <div className="flex flex-wrap gap-2">
    {wordBank.map((word) => (
     <DataPill key={word} label={word} />
    ))}
   </div>
  </div>
 );
}
