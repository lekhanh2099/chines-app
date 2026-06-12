import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";
import { EmptySectionState } from "./EmptySectionState";
import { ExercisePill } from "./ExercisePill";
import { GenericItemCard } from "./GenericItemCard";
import { hasRenderableValue } from "./generic-field-utils";

export function LooseItemGrid({
 items,
 displayMode,
 emptyReason,
}: {
 items: unknown[];
 displayMode: LessonDisplayMode;
 emptyReason?: string;
}) {
 const visibleItems = items.filter(hasRenderableValue);

 if (visibleItems.length === 0) {
  return <EmptySectionState reason={emptyReason} />;
 }

 return (
  <div className="grid gap-2 sm:grid-cols-2">
   {visibleItems.map((item, index) => {
    const text = answerToString(item);

    if (text) {
     return <ExercisePill key={`${text}-${index}`}>{text}</ExercisePill>;
    }

    const record = asRecord(item);
    const compactText =
     stringValue(record, "text") ||
     stringValue(record, "substitution") ||
     stringValue(record, "prompt") ||
     stringValue(record, "answer");

    if (compactText && Object.keys(record).length <= 3) {
     return <ExercisePill key={`${compactText}-${index}`}>{compactText}</ExercisePill>;
    }

    return (
     <GenericItemCard
      key={stringValue(record, "id") || `${index}`}
      value={item}
      displayMode={displayMode}
     />
    );
   })}
  </div>
 );
}
