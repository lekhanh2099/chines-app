import type { JsonFieldValue } from "@/types/json";
import type { LessonDisplayMode } from "../types";
import { containsHanziText, ReaderHanziText, StudyInstructionText } from "../hanzi-typography";
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
   <ReaderHanziText as="h4" displayMode={displayMode} size="md" weight="black" leading="tight">
    {title}
   </ReaderHanziText>

   {content ? (
    <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed" wrapping="preWrap">
     {content}
    </StudyInstructionText>
   ) : null}

   {tables.map((table) => (
    <StudyDataTable key={table.id} table={table} displayMode={displayMode} />
   ))}

   {notes.length > 0 ? (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     <StudyInstructionText
      variant="overline"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      Ví dụ & ghi chú
     </StudyInstructionText>
     {notes.map((note, index) => {
      const hanzi = containsHanziText(note);
      return hanzi ? (
       <ReaderHanziText
        as="p"
        key={`${id}-note-${index}`}
        displayMode={displayMode}
        size="md"
        weight="semibold"
        leading="relaxed"
        wrapping="preLine"
       >
        {note}
       </ReaderHanziText>
      ) : (
       <StudyInstructionText
        key={`${id}-note-${index}`}
        weight="semibold"
        leading="relaxed"
        wrapping="preLine"
       >
        {note}
       </StudyInstructionText>
      );
     })}
    </div>
   ) : null}
  </article>
 );
}
