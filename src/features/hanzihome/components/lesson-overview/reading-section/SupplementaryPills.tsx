import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";
import { ExercisePill } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";

export function SupplementaryPills({
 itemId,
 values,
 displayMode,
}: {
 itemId: string;
 values: JsonValue[];
 displayMode: LessonDisplayMode;
}) {
 if (values.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Từ bổ sung
   </StudyInstructionText>
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
      <ExercisePill key={stringValue(word, "id") || `${itemId}-supplement-${index}`}>
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
