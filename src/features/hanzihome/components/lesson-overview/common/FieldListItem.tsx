import { PassageCard } from "../PassageCard";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import {
 answerToString,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
 stringValue,
} from "../utils";
import { ExercisePill } from "./ExercisePill";

export function FieldListItem({
 value,
 displayMode,
 renderFallback,
}: {
 value: unknown;
 displayMode: LessonDisplayMode;
 renderFallback: (value: unknown) => React.ReactNode;
}) {
 const record = asRecord(value);
 const zh = stringValue(record, "zh") || stringValue(record, "text");
 const nestedPassage = getPassageLikeValue(record, { includeText: true });

 if (nestedPassage && !zh) {
  return (
   <PassageCard
    itemId={stringValue(record, "id") || "field-passage"}
    passage={nestedPassage}
    answers={getClozeAnswerValues(record)}
    displayMode={displayMode}
   />
  );
 }

 if (zh) {
  return (
   <TextLineCard
    zh={zh}
    pinyin={stringValue(record, "pinyin")}
    vi={
     stringValue(record, "vi") ||
     stringValue(record, "meaning_vi") ||
     stringValue(record, "translation_vi")
    }
    displayMode={displayMode}
   />
  );
 }

 const text = answerToString(value);
 if (text) return <ExercisePill>{text}</ExercisePill>;

 return <div className="rounded-lg bg-bg-primary px-3 py-2">{renderFallback(value)}</div>;
}
