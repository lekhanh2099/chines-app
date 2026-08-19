import type { JsonFieldValue, JsonValue } from "@/types/json";
import type { ReactNode } from "react";

import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";
import { StudyInstructionText, ReaderHanziText } from "../hanzi-typography";

export function ModelBlock({
 title = "Mẫu",
 values,
 displayMode,
 renderValue,
}: {
 title?: string;
 values: JsonValue[];
 displayMode: LessonDisplayMode;
 renderValue?: (value: JsonFieldValue, index: number, content: ReactNode) => ReactNode;
}) {
 const visibleValues = values.filter((value) => {
  if (answerToString(value)) return true;

  const record = asRecord(value);
  return Boolean(
   stringValue(record, "zh") ||
   stringValue(record, "text") ||
   stringValue(record, "prompt") ||
   stringValue(record, "answer"),
  );
 });

 if (visibleValues.length === 0) return null;

 return (
  <div className="exercise-answer-surface grid gap-2 rounded-xl border p-3">
   <StudyInstructionText
    variant="overline"
    tone="accent"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    {title}
   </StudyInstructionText>
   <div className="grid gap-2">
    {visibleValues.map((value, index) => {
     const record = asRecord(value);
     const key = stringValue(record, "id") || `${title}-${answerToString(value) || index}-${index}`;
     const zh =
      stringValue(record, "zh") ||
      stringValue(record, "text") ||
      stringValue(record, "prompt") ||
      answerToString(value);
     const pinyin = stringValue(record, "pinyin");
     const vi =
      stringValue(record, "vi") ||
      stringValue(record, "meaning_vi") ||
      stringValue(record, "answer");

     if (!zh) return null;

     if (typeof value === "string") {
      const content = (
       <ReaderHanziText displayMode={displayMode} tone="default" weight="black" leading="learner">
        {zh}
       </ReaderHanziText>
      );

      return <div key={key}>{renderValue ? renderValue(value, index, content) : content}</div>;
     }

     const content = <TextLineCard zh={zh} pinyin={pinyin} vi={vi} displayMode={displayMode} />;

     return <div key={key}>{renderValue ? renderValue(value, index, content) : content}</div>;
    })}
   </div>
  </div>
 );
}
