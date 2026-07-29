import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";
import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";
import { DataPill } from "./DataPill";

export function SupplementaryVocabulary({
 values,
 displayMode,
}: {
 values: JsonValue[];
 displayMode: LessonDisplayMode;
}) {
 const visibleValues = values.filter((value) => {
  if (answerToString(value)) return true;

  const record = asRecord(value);
  return Boolean(
   stringValue(record, "hanzi") ||
   stringValue(record, "text") ||
   stringValue(record, "zh") ||
   stringValue(record, "meaning_vi"),
  );
 });

 if (visibleValues.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3">
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
    {visibleValues.map((wordValue, index) => {
     const word = asRecord(wordValue);
     const label =
      stringValue(word, "hanzi") ||
      stringValue(word, "text") ||
      stringValue(word, "zh") ||
      answerToString(wordValue);
     const pinyin = stringValue(word, "pinyin");
     const meaning = stringValue(word, "meaning_vi");
     const pos = stringValue(word, "pos");

     return (
      <DataPill
       key={stringValue(word, "id") || `${label}-${index}`}
       label={label}
       pinyin={displayMode.showPinyin ? pinyin : ""}
       meaning={displayMode.showMeaning ? meaning : ""}
       extra={pos}
      />
     );
    })}
   </div>
  </div>
 );
}
