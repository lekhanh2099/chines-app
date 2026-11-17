import type { CourseBlock, CourseSection } from "./course-book.schema";
import { cleanText } from "./conversion-text";

type BlockExtras = Pick<CourseBlock, "translation" | "speaker">;

/** Collects the blocks of one output section and assigns their deterministic ids. */
export class SectionWriter {
 readonly blocks: CourseBlock[] = [];

 constructor(
  private readonly lessonId: string,
  private readonly sectionIndex: number,
 ) {}

 get sectionId() {
  return `${this.lessonId}-s${this.sectionIndex}`;
 }

 private nextId() {
  return `${this.sectionId}-b${String(this.blocks.length + 1).padStart(3, "0")}`;
 }

 private text(type: CourseBlock["type"], text: string, extras: BlockExtras) {
  if (!text) return;
  this.blocks.push({ id: this.nextId(), type, text, rows: [], ...extras });
 }

 subheading(text: string, extras: BlockExtras = {}) {
  this.text("subheading", cleanText(text), extras);
 }

 /** `text` is written as given, so callers keep intentional line breaks in answers. */
 paragraph(text: string, extras: BlockExtras = {}) {
  this.text("paragraph", text.trim(), extras);
 }

 table(rows: string[][], answerColumnIndexes: number[] = [], text = "") {
  if (rows.length < 2) return;
  this.blocks.push({
   id: this.nextId(),
   type: "table",
   text,
   rows,
   ...(answerColumnIndexes.length > 0 ? { answerColumnIndexes } : {}),
  });
 }

 toSection(title: string, category: CourseSection["category"]): CourseSection {
  return { id: this.sectionId, title, category, blocks: this.blocks };
 }
}
