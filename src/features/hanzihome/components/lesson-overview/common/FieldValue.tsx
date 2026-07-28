import type { JsonFieldValue } from "@/types/json";
import { PassageCard } from "../PassageCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, getClozeAnswerValues, getPassageLikeValue, stringValue } from "../utils";
import { FieldListItem } from "./FieldListItem";
import {
 fieldFallbackText,
 getFieldLabel,
 hasRenderableValue,
 primaryTextFromRecord,
} from "./generic-field-utils";

export function FieldValue({
 value,
 displayMode,
}: {
 value: JsonFieldValue;
 displayMode: LessonDisplayMode;
}) {
 if (typeof value === "string" || typeof value === "number") {
  return (
   <p className="whitespace-pre-wrap  font-semibold leading-relaxed text-text-secondary">{value}</p>
  );
 }

 if (typeof value === "boolean") {
  return <p className=" font-semibold text-text-secondary">{value ? "Có" : "Không"}</p>;
 }

 if (Array.isArray(value)) {
  return (
   <div className="grid gap-2">
    {value.map((entry, index) => (
     <FieldListItem
      key={`field-entry-${index}`}
      value={entry}
      displayMode={displayMode}
      renderFallback={(nestedValue) => <FieldValue value={nestedValue} displayMode={displayMode} />}
     />
    ))}
   </div>
  );
 }

 const record = asRecord(value);
 const nestedPassage = getPassageLikeValue(record);

 if (nestedPassage) {
  return (
   <PassageCard
    itemId={stringValue(record, "id") || "nested-passage"}
    passage={nestedPassage}
    answers={getClozeAnswerValues(record)}
    displayMode={displayMode}
   />
  );
 }

 const primary = primaryTextFromRecord(record) || fieldFallbackText(value);
 const secondary =
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "pinyin") ||
  stringValue(record, "explanation_vi") ||
  stringValue(record, "note_vi");

 return (
  <div className="grid gap-1  font-semibold text-text-secondary">
   {primary && <p className="text-text-primary">{primary}</p>}
   {displayMode.showMeaning && secondary && secondary !== primary && <p>{secondary}</p>}

   {!primary &&
    Object.entries(record)
     .filter(([, entryValue]) => hasRenderableValue(entryValue))
     .map(([key, entryValue]) => (
      <div key={key} className="grid gap-1 rounded-lg bg-bg-primary px-3 py-2">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        {getFieldLabel(key)}
       </p>
       <FieldValue value={entryValue} displayMode={displayMode} />
      </div>
     ))}
  </div>
 );
}
