import type { JsonFieldValue, JsonObject } from "@/types/json";

import { asRecord, isRecordValue, recordList, textList, textOf } from "./conversion-text";
import type { SectionWriter } from "./section-writer";

const LISTS = [
 { keys: ["grammar_points", "main_grammar", "grammar_main"], label: "Ngữ pháp chính" },
 {
  keys: ["key_patterns", "main_patterns", "sentence_patterns", "key_sentence_patterns"],
  label: "Mẫu câu chính",
 },
 { keys: ["key_sentences"], label: "Câu quan trọng" },
 { keys: ["idioms"], label: "Thành ngữ" },
];

type SummaryLine = { text: string; translation: string };

function summaryLines(value: JsonFieldValue): SummaryLine[] {
 if (!Array.isArray(value)) return [];
 return value
  .map((entry) => {
   if (!isRecordValue(entry)) return { text: textOf(entry), translation: "" };
   const record = asRecord(entry);
   const text = textOf(record.zh) || textOf(record.title) || textOf(record.pattern);
   return { text, translation: textOf(record.vi) || textOf(record.title_vi) };
  })
  .filter((line) => line.text.length > 0);
}

function writeSummaryLists(record: JsonObject, writer: SectionWriter, written: Set<string>) {
 for (const list of LISTS) {
  const lines = list.keys
   .flatMap((key) => summaryLines(record[key]))
   .filter((line) => !written.has(`${list.label}:${line.text}`));
  if (lines.length === 0) continue;
  if (!written.has(list.label)) writer.subheading(list.label);
  written.add(list.label);
  for (const line of lines) {
   written.add(`${list.label}:${line.text}`);
   writer.paragraph(line.text, line.translation ? { translation: line.translation } : {});
  }
 }
}

function writeComparisonBlock(block: JsonObject, writer: SectionWriter) {
 writer.subheading(textOf(block.title));
 const rows = recordList(block.rows).map((row) => textList(row.cells));
 writer.table([textList(block.columns), ...rows]);
 for (const note of recordList(block.examples_and_notes)) {
  writer.paragraph(textOf(note.text));
 }
}

/**
 * The lesson summary: word-comparison tables and the lists of main grammar
 * points, sentence patterns and key sentences. Import bookkeeping
 * (`lesson_parts`, coverage flags, exercise type lists) is not lesson content.
 */
export function writeSummary(payload: JsonObject, writer: SectionWriter) {
 recordList(payload.blocks).forEach((block) => writeComparisonBlock(block, writer));
 const written = new Set<string>();
 const records = [payload, asRecord(payload.summary), asRecord(payload.content)];
 records.forEach((record) => writeSummaryLists(record, writer, written));
 for (const item of recordList(payload.items)) {
  writeSummaryLists(item, writer, written);
  const title = textOf(item.title);
  const entries = textList(item.items);
  if (title && entries.length > 0) {
   writer.subheading(title);
   writer.paragraph(entries.join(" · "));
  }
 }
}
