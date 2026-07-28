import type { JsonFieldValue } from "@/types/json";
import type { LessonDisplayMode } from "../types";
import { containsHanziText, getHanziTypographyStyle } from "../hanzi-typography";
import { arrayValue, asRecord, stringValue } from "../utils";
import { StudyDataTable, normalizedStudyTables } from "./StudyDataTable";

export function VocabularyComparisonCard({
 value,
 displayMode,
}: {
 value: JsonFieldValue;
 displayMode: LessonDisplayMode;
}) {
 const block = asRecord(value);
 const id = stringValue(block, "id") || "vocabulary-comparison";
 const title = stringValue(block, "title") || "词语辨析";
 const content = stringValue(block, "content_vi");
 const tables = normalizedStudyTables(block, id);
 const notes = arrayValue(block, "examples_and_notes")
  .map((entry) => {
   const record = asRecord(entry);
   return stringValue(record, "text") || (typeof entry === "string" ? entry : "");
  })
  .filter(Boolean);

 return (
  <article className="study-content-surface grid gap-3 rounded-xl border p-4">
   <h4
    className="font-black leading-tight text-text-primary"
    lang="zh-CN"
    style={getHanziTypographyStyle(displayMode, { size: "md" })}
   >
    {title}
   </h4>

   {content ? (
    <p className="whitespace-pre-wrap font-semibold leading-relaxed text-text-secondary">
     {content}
    </p>
   ) : null}

   {tables.map((table) => (
    <StudyDataTable key={table.id} table={table} displayMode={displayMode} />
   ))}

   {notes.length > 0 ? (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">Ví dụ & ghi chú</p>
     {notes.map((note, index) => {
      const hanzi = containsHanziText(note);
      return (
       <p
        key={`${id}-note-${index}`}
        className="whitespace-pre-wrap font-semibold leading-relaxed text-text-secondary"
        lang={hanzi ? "zh-CN" : undefined}
        style={hanzi ? getHanziTypographyStyle(displayMode, { size: "md" }) : undefined}
       >
        {note}
       </p>
      );
     })}
    </div>
   ) : null}
  </article>
 );
}
