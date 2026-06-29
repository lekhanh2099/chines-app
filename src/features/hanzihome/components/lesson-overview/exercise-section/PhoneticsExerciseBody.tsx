import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { LooseItemGrid } from "../CommonCards";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, stringValue } from "../utils";

export function PhoneticsExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const parts = arrayValue(record, "parts");
 const fallbackItems = [
  ...arrayValue(record, "items"),
  ...arrayValue(record, "chunks"),
  ...arrayValue(record, "questions"),
 ];

 if (parts.length === 0) {
  return (
   <LooseItemGrid
    items={fallbackItems}
    displayMode={displayMode}
    emptyReason={stringValue(record, "empty_reason_vi")}
   />
  );
 }

 return (
  <div className="grid gap-3">
   {parts.map((partValue, partIndex) => {
    const part = asRecord(partValue);
    const title =
     stringValue(part, "title_vi") || stringValue(part, "title") || `Phần ${partIndex + 1}`;
    const instruction = stringValue(part, "instruction_vi");
    const items = arrayValue(part, "items");
    const type = stringValue(part, "type");

    const isPairGroup = type.includes("pair");

    return (
     <div
      key={stringValue(part, "id") || `${item.id}-part-${partIndex}`}
      className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle/60 p-3 sm:p-4"
     >
      <div>
       <h5 className="font-black text-text-primary">{title}</h5>
       {instruction && <p className=" font-semibold text-text-muted">{instruction}</p>}
      </div>

      {isPairGroup ? (
       <div className="grid gap-2 sm:grid-cols-2">
        {items.map((entryValue, index) => {
         const entry = asRecord(entryValue);
         const rawText = answerToString(entryValue);
         const [rawLeft = "", rawRight = ""] = rawText.split(/\s*\/\s*/, 2);
         const left = stringValue(entry, "left") || rawLeft;
         const right = stringValue(entry, "right") || rawRight;

         return (
          <div
           key={stringValue(entry, "id") || `${item.id}-pair-${partIndex}-${index}`}
           className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-border-default bg-bg-card px-3 py-3"
          >
           <span className="text-center font-black text-text-primary">{left}</span>
           <span className="text-xs font-black text-text-muted">/</span>
           <span className="text-center font-black text-text-primary">{right}</span>
          </div>
         );
        })}
       </div>
      ) : (
       <div className="grid gap-2 sm:grid-cols-2">
        {items.map((entryValue, index) => {
         const entry = asRecord(entryValue);
         const text =
          stringValue(entry, "text") ||
          stringValue(entry, "zh") ||
          stringValue(entry, "phrase") ||
          answerToString(entryValue);

         return (
          <TextLineCard
           key={stringValue(entry, "id") || `${item.id}-reading-${partIndex}-${index}`}
           zh={text}
           pinyin={stringValue(entry, "pinyin")}
           vi={stringValue(entry, "vi") || stringValue(entry, "meaning_vi")}
           displayMode={displayMode}
          />
         );
        })}
       </div>
      )}
     </div>
    );
   })}
  </div>
 );
}
