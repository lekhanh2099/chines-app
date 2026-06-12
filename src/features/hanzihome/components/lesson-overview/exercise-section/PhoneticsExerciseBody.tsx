import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { LooseItemGrid } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";

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

    return (
     <div
      key={stringValue(part, "id") || `${item.id}-part-${partIndex}`}
      className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
     >
      <div>
       <h5 className="font-black text-text-primary">{title}</h5>
       {instruction && <p className=" font-semibold text-text-muted">{instruction}</p>}
      </div>

      <LooseItemGrid
       items={items.map((entryValue) => {
        const entry = asRecord(entryValue);

        if (type.includes("pair") || stringValue(entry, "left") || stringValue(entry, "right")) {
         return {
          id: stringValue(entry, "id"),
          text: `${stringValue(entry, "left")} / ${stringValue(entry, "right")}`,
         };
        }

        return entryValue;
       })}
       displayMode={displayMode}
      />
     </div>
    );
   })}
  </div>
 );
}
