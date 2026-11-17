import type { JsonObject } from "@/types/json";
import { splitBusinessChineseGrammarExample } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import { splitTrailingTranslation } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";

import type { LessonCoverage } from "./conversion-coverage";
import {
 asRecord,
 byOrder,
 cleanLines,
 cleanText,
 containsHan,
 firstText,
 recordList,
 textList,
 textOf,
 withoutAnswerArrow,
} from "./conversion-text";
import type { CourseExport } from "./course-export.schema";
import type { SectionWriter } from "./section-writer";

const GLUED_TRANSLATION_PATTERN = /^(.*[。！？!?…”"])\s*[(（]([^()（）]+)[)）]$/u;

export type GrammarTally = Pick<LessonCoverage, "grammarExamples" | "grammarExamplesInline">;

function parsesAsExample(text: string) {
 return Boolean(
  splitBusinessChineseGrammarExample(splitTrailingTranslation(text).source).translation,
 );
}

/** Writes an example in a form the reader's grammar-example parser splits, when one exists. */
function writeExample(
 writer: SectionWriter,
 tally: GrammarTally,
 index: number,
 sourceZh: string,
 sourceVi: string,
) {
 // Some imports left the Vietnamese glued to the sentence as `中文。(Tiếng Việt)`.
 const glued = sourceVi ? null : GLUED_TRANSLATION_PATTERN.exec(sourceZh);
 const gluedVi = glued?.[2] ?? "";
 const split = gluedVi !== "" && !containsHan(gluedVi);
 const zh = withoutAnswerArrow(split ? (glued?.[1] ?? "") : sourceZh);
 const vi = withoutAnswerArrow(split ? gluedVi : sourceVi);
 if (!zh) return;
 tally.grammarExamples += 1;
 const forms = vi ? [`(${index}) ${zh} ${vi}`, `${zh} → ${vi}`] : [];
 const inline = forms.find(parsesAsExample);
 if (inline) {
  tally.grammarExamplesInline += 1;
  writer.paragraph(inline);
 } else {
  writer.paragraph(`(${index}) ${zh}`, vi ? { translation: vi } : {});
 }
}

function writeExamples(
 writer: SectionWriter,
 tally: GrammarTally,
 examples: readonly JsonObject[],
) {
 examples.forEach((example, index) => {
  const note = firstText(example, ["note_vi", "explanation_vi", "note"]);
  const vi = [textOf(example.vi), note ? `(${note})` : ""].filter(Boolean).join(" ");
  writeExample(writer, tally, index + 1, textOf(example.zh), vi);
 });
}

function labelled(label: string, text: string) {
 return label && text ? `${label}: ${text}` : label || text;
}

function writeComparison(writer: SectionWriter, items: readonly JsonObject[]) {
 const first = items[0] ?? {};
 const leftLabel = textOf(asRecord(first.left).label);
 const rightLabel = textOf(asRecord(first.right).label);
 const cell = (item: JsonObject, side: string, header: string) => {
  const value = asRecord(item[side]);
  const label = textOf(value.label);
  return label && label !== header ? `${label}: ${textOf(value.value)}` : textOf(value.value);
 };
 writer.table([
  ["Tiêu chí", leftLabel || "A", rightLabel || "B"],
  ...items.map((item) => [
   textOf(item.aspect),
   cell(item, "left", leftLabel),
   cell(item, "right", rightLabel),
  ]),
 ]);
}

function writeGrammarBlock(writer: SectionWriter, tally: GrammarTally, block: JsonObject) {
 const type = textOf(block.type);
 const title = textOf(block.title);
 const items = recordList(block.items);
 if (type === "grammar_compare" || type === "grammar_comparison") {
  writer.paragraph(title);
  writeComparison(writer, items);
  return;
 }
 if (type === "grammar_common_mistakes") {
  writer.paragraph(title);
  writer.table([
   ["Câu sai", "Câu đúng", "Giải thích"],
   ...items.map((item) => [textOf(item.wrong), textOf(item.correct), textOf(item.explanation_vi)]),
  ]);
  return;
 }
 const prose = firstText(block, ["content_vi", "meaning_vi"]);
 writer.paragraph(withoutAnswerArrow(labelled(title, prose)));
 const pattern = textOf(block.pattern);
 if (pattern) writer.paragraph(`Cấu trúc: ${withoutAnswerArrow(pattern)}`);
 for (const formula of recordList(block.formulas)) {
  const label = textOf(formula.label);
  writer.paragraph(
   `Công thức: ${withoutAnswerArrow(textOf(formula.pattern))}${label ? ` (${label})` : ""}`,
  );
 }
 const wrongPattern = textOf(block.wrong_pattern);
 if (wrongPattern) writer.paragraph(`Không dùng: ${withoutAnswerArrow(wrongPattern)}`);
 writeExamples(writer, tally, [
  ...recordList(block.examples),
  ...recordList(block.correct_examples),
 ]);
 for (const wrong of recordList(block.wrong_examples)) {
  const note = firstText(wrong, ["explanation_vi", "vi"]);
  writer.paragraph(withoutAnswerArrow(`Câu sai: ${textOf(wrong.zh)}${note ? ` (${note})` : ""}`));
 }
 for (const note of textList(block.notes_vi)) {
  writer.paragraph(withoutAnswerArrow(`Lưu ý: ${note}`));
 }
}

type GrammarRows = Pick<CourseExport, "grammarPoints" | "grammarExamples" | "grammarDetails">;

/** A grammar point the section payload leaves empty, rebuilt from the grammar tables. */
function writeGrammarPointFromRows(
 writer: SectionWriter,
 tally: GrammarTally,
 point: GrammarRows["grammarPoints"][number],
 rows: GrammarRows,
) {
 const core = cleanLines(point.core ?? "");
 core.forEach((line) => writer.paragraph(withoutAnswerArrow(line)));
 for (const structure of point.structures_view ?? []) {
  const formula = `Cấu trúc: ${withoutAnswerArrow(cleanText(structure))}`;
  if (!core.includes(formula)) writer.paragraph(formula);
 }
 const details = rows.grammarDetails
  .filter((detail) => detail.grammar_point_id === point.id && detail.deleted_at === null)
  .sort((left, right) => left.section_order - right.section_order);
 for (const detail of details) {
  writer.paragraph(cleanText(detail.title));
  detail.lines.forEach((line) => writer.paragraph(withoutAnswerArrow(cleanText(line))));
 }
 rows.grammarExamples
  .filter((example) => example.grammar_point_id === point.id && example.deleted_at === null)
  .sort((left, right) => left.example_order - right.example_order)
  .forEach((example, index) => {
   const vi = [cleanText(example.vi ?? ""), example.note ? `(${cleanText(example.note)})` : ""]
    .filter(Boolean)
    .join(" ");
   writeExample(writer, tally, index + 1, cleanText(example.zh), vi);
  });
 (point.notes ?? []).forEach((note) =>
  writer.paragraph(withoutAnswerArrow(`Lưu ý: ${cleanText(note)}`)),
 );
}

/** One subheading per grammar point, then its blocks; thin points fall back to the tables. */
export function writeGrammarPoints(
 payload: JsonObject,
 lessonPoints: readonly GrammarRows["grammarPoints"][number][],
 rows: GrammarRows,
 writer: SectionWriter,
 tally: GrammarTally,
) {
 const points = byOrder(recordList(payload.items));
 const tablePoints = [...lessonPoints].sort((left, right) => left.point_order - right.point_order);
 points.forEach((point, index) => {
  const titleVi = textOf(point.title_vi);
  writer.subheading(textOf(point.title) || titleVi, titleVi ? { translation: titleVi } : {});
  const blocks = byOrder(recordList(point.blocks));
  const before = writer.blocks.length;
  blocks.forEach((block) => writeGrammarBlock(writer, tally, block));
  const tablePoint = tablePoints[index];
  if (writer.blocks.length === before && tablePoint) {
   writeGrammarPointFromRows(writer, tally, tablePoint, rows);
  }
 });
 if (points.length > 0) return;
 for (const point of tablePoints) {
  writer.subheading(
   cleanText(point.title),
   point.title_vi ? { translation: cleanText(point.title_vi) } : {},
  );
  writeGrammarPointFromRows(writer, tally, point, rows);
 }
}

/** The 注释 notes: a subheading per note, its structure, explanation and examples. */
export function writeNotes(payload: JsonObject, writer: SectionWriter, tally: GrammarTally) {
 for (const note of byOrder(recordList(payload.items))) {
  const title = textOf(note.title);
  writer.subheading(title);
  const structure = textOf(note.structure);
  if (structure) writer.paragraph(`Cấu trúc: ${withoutAnswerArrow(structure)}`);
  const meaning = textOf(note.meaning_vi);
  const explanation = /^\s*[:：]/u.test(
   meaning.startsWith(title) ? meaning.slice(title.length) : "",
  )
   ? meaning.slice(title.length).replace(/^[\s:：]+/u, "")
   : meaning;
  writer.paragraph(withoutAnswerArrow(explanation));
  writeExamples(writer, tally, recordList(note.examples));
 }
}
