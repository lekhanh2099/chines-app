import type { JsonFieldValue } from "@/types/json";
import type { LessonDisplayMode } from "../types";
import { containsHanziText, getHanziTypographyStyle } from "../hanzi-typography";
import { answerToString, asRecord, stringValue } from "../utils";

export type StudyTableData = {
 id: string;
 columns: string[];
 rows: string[][];
};

function textFromCell(value: JsonFieldValue): string {
 const record = asRecord(value);

 return (
  stringValue(record, "text") ||
  stringValue(record, "zh") ||
  stringValue(record, "value") ||
  answerToString(value)
 );
}

function rowFromValue(value: JsonFieldValue): string[] {
 if (Array.isArray(value)) return value.map(textFromCell);

 const record = asRecord(value);
 const cells = Array.isArray(record.cells) ? record.cells : [];
 return cells.map(textFromCell);
}

export function normalizedStudyTables(value: JsonFieldValue, itemId: string): StudyTableData[] {
 const record = asRecord(value);
 const columns = Array.isArray(record.columns) ? record.columns.map(textFromCell) : [];
 const rows = Array.isArray(record.rows)
  ? record.rows.map(rowFromValue).filter((row) => row.length)
  : [];

 if (columns.length || rows.length) {
  return [{ id: `${itemId}-table`, columns, rows }];
 }

 const sourceTables = Array.isArray(record.tables) ? record.tables : [];

 return sourceTables.flatMap((tableValue, tableIndex) => {
  if (!Array.isArray(tableValue)) return [];

  const tableRows = tableValue.map(rowFromValue).filter((row) => row.length);
  if (!tableRows.length) return [];

  return [
   {
    id: `${itemId}-table-${tableIndex}`,
    columns: tableRows[0],
    rows: tableRows.slice(1),
   },
  ];
 });
}

function StudyTableCell({
 text,
 displayMode,
 header = false,
}: {
 text: string;
 displayMode: LessonDisplayMode;
 header?: boolean;
}) {
 const hanzi = containsHanziText(text);
 const Element = header ? "th" : "td";

 return (
  <Element
   className={
    header
     ? "border-b border-border-default bg-bg-subtle px-3 py-2.5 text-left font-black text-text-primary"
     : "border-b border-border-default/70 px-3 py-2.5 align-top font-semibold leading-relaxed text-text-secondary last:border-b-0"
   }
   lang={hanzi ? "zh-CN" : undefined}
   style={hanzi ? getHanziTypographyStyle(displayMode, { size: "md" }) : undefined}
  >
   {text || "—"}
  </Element>
 );
}

export function StudyDataTable({
 table,
 displayMode,
}: {
 table: StudyTableData;
 displayMode: LessonDisplayMode;
}) {
 const columnCount = Math.max(table.columns.length, ...table.rows.map((row) => row.length), 1);
 const columns =
  table.columns.length > 0
   ? table.columns
   : Array.from({ length: columnCount }, (_, index) => `Cột ${index + 1}`);

 return (
  <div className="max-w-full overflow-x-auto rounded-xl border border-border-default bg-bg-primary">
   <table className="min-w-full border-collapse text-left text-sm">
    <thead>
     <tr>
      {columns.map((column, index) => (
       <StudyTableCell
        key={`${table.id}-heading-${index}`}
        text={column}
        displayMode={displayMode}
        header
       />
      ))}
     </tr>
    </thead>
    <tbody>
     {table.rows.map((row, rowIndex) => (
      <tr key={`${table.id}-row-${rowIndex}`} className="even:bg-bg-subtle/50">
       {Array.from({ length: columnCount }, (_, columnIndex) => (
        <StudyTableCell
         key={`${table.id}-row-${rowIndex}-cell-${columnIndex}`}
         text={row[columnIndex] ?? ""}
         displayMode={displayMode}
        />
       ))}
      </tr>
     ))}
    </tbody>
   </table>
  </div>
 );
}
