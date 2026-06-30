import { ExercisePill } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";

export function SupplementaryPills({
 itemId,
 values,
 displayMode,
}: {
 itemId: string;
 values: unknown[];
 displayMode: LessonDisplayMode;
}) {
 if (values.length === 0) return null;

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Từ bổ sung</p>
   <div className="flex flex-wrap gap-2">
    {values.map((wordValue, index) => {
     const word = asRecord(wordValue);
     const hanzi =
      stringValue(word, "hanzi") ||
      stringValue(word, "text") ||
      stringValue(word, "zh") ||
      answerToString(wordValue);
     const pinyin = stringValue(word, "pinyin");
     const meaning = stringValue(word, "meaning_vi");
     const pos = stringValue(word, "pos");

     if (!hanzi) return null;

     return (
      <ExercisePill key={stringValue(word, "id") || `${itemId}-word-${index}`}>
       {hanzi}
       {displayMode.showPinyin && pinyin && ` · ${pinyin}`}
       {displayMode.showMeaning && meaning && ` · ${meaning}`}
       {pos && ` · ${pos}`}
      </ExercisePill>
     );
    })}
   </div>
  </div>
 );
}
