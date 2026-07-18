import { GenericItemCard } from "../CommonCards";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { StudyDataTable, normalizedStudyTables } from "./StudyDataTable";

function PreparationItem({
 value,
 index,
 displayMode,
 debugMode,
}: {
 value: unknown;
 index: number;
 displayMode: LessonDisplayMode;
 debugMode: boolean;
}) {
 const item = asRecord(value);
 const id = stringValue(item, "id") || `preparation-${index}`;
 const type = stringValue(item, "type");
 const zh = stringValue(item, "zh");
 const pinyin = stringValue(item, "pinyin");
 const vi = stringValue(item, "vi");

 if (type === "preparation_table") {
  const tables = normalizedStudyTables(item, id);
  return tables.map((table) => (
   <StudyDataTable key={table.id} table={table} displayMode={displayMode} />
  ));
 }

 if (type === "preparation_note" || type === "preparation_question") {
  if (zh) {
   return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
     <span className="study-chip-accent flex h-7 min-w-7 items-center justify-center rounded-lg border px-2 text-xs font-black">
      {index + 1}
     </span>
     <TextLineCard zh={zh} pinyin={pinyin} vi={vi} displayMode={displayMode} variant="reader" />
    </div>
   );
  }

  if (vi) {
   return (
    <p className="rounded-xl border border-border-default bg-bg-subtle px-4 py-3 font-semibold leading-relaxed text-text-secondary">
     {vi}
    </p>
   );
  }
 }

 return <GenericItemCard value={value} displayMode={displayMode} debugMode={debugMode} />;
}

export function PreparationSectionView({
 items,
 displayMode,
 debugMode,
}: {
 items: unknown[];
 displayMode: LessonDisplayMode;
 debugMode: boolean;
}) {
 return (
  <div className="grid gap-3">
   {items.map((item, index) => (
    <PreparationItem
     key={stringValue(asRecord(item), "id") || `preparation-${index}`}
     value={item}
     index={index}
     displayMode={displayMode}
     debugMode={debugMode}
    />
   ))}
  </div>
 );
}
