import { parsePracticeExerciseItem } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";

import type { ExerciseCoverage } from "./conversion-coverage";
import { cleanText, normalizeBlanks, withoutAnswerArrow } from "./conversion-text";
import type { SourceAnswer } from "./exercise-answers";
import { answerOnOneLine, hasAnswer } from "./exercise-answers";
import type { SectionWriter } from "./section-writer";

export type QuestionDraft = {
 prompt: string;
 translation: string;
 /** Choice texts in A, B, C… order. */
 choices: string[];
 /** `A`–`D` when the source answer names one of `choices`. */
 answerLetter: string;
 answer: SourceAnswer;
};

function promptText(value: string) {
 return withoutAnswerArrow(normalizeBlanks(cleanText(value)));
}

function choiceLabel(index: number) {
 return String.fromCharCode(65 + index);
}

/** Writes one exercise (or reading/communication item) and counts what it produced. */
export class ExerciseOutput {
 private readonly written = new Set<string>();

 constructor(
  private readonly writer: SectionWriter,
  readonly coverage: ExerciseCoverage,
 ) {}

 private push(content: boolean, write: () => void) {
  const before = this.writer.blocks.length;
  write();
  const added = this.writer.blocks.length - before;
  this.coverage.blocks += added;
  if (content) this.coverage.contentBlocks += added;
 }

 private firstTime(text: string) {
  if (!text || this.written.has(text)) return false;
  this.written.add(text);
  return true;
 }

 heading(text: string, translation: string) {
  const title = promptText(text);
  this.written.add(title);
  this.written.add(translation);
  this.push(false, () =>
   this.writer.subheading(title, translation && translation !== title ? { translation } : {}),
  );
 }

 /** Title/instruction prose; repeated lines inside one exercise are written once. */
 instruction(text: string, translation = "") {
  const line = promptText(text);
  if (!this.firstTime(line)) return;
  const extra = translation && this.firstTime(translation) ? { translation } : {};
  this.push(false, () => this.writer.paragraph(line, extra));
 }

 /** Supporting prose (model sentences, notes); repeated lines are written once. */
 note(text: string, translation = "") {
  const line = promptText(text);
  if (!this.firstTime(line)) return;
  this.push(true, () => this.writer.paragraph(line, translation ? { translation } : {}));
 }

 /** Passage and dialogue lines, always written. */
 line(text: string, translation = "") {
  const line = promptText(text);
  this.push(true, () => this.writer.paragraph(line, translation ? { translation } : {}));
 }

 wordBank(words: readonly string[]) {
  const bank = words.map(promptText).filter(Boolean);
  if (bank.length > 0) this.push(true, () => this.writer.paragraph(bank.join(" | ")));
 }

 table(rows: string[][], answerColumnIndexes: number[] = []) {
  this.push(true, () => this.writer.table(rows, answerColumnIndexes));
 }

 /** Rows of a table whose answer columns stay hidden until revealed. */
 answerTable(rows: string[][], answerColumnIndexes: number[], answeredRows: number) {
  this.table(rows, answerColumnIndexes);
  this.coverage.questions += rows.length - 1;
  this.coverage.answered += answeredRows;
  this.coverage.tableAnswers += answeredRows;
  this.coverage.unanswered += rows.length - 1 - answeredRows;
 }

 question(draft: QuestionDraft) {
  const stem = promptText(draft.prompt);
  const choices = draft.choices
   .map((choice, index) => `${choiceLabel(index)}. ${promptText(choice)}`)
   .join(" ");
  const prompt = [stem, choices].filter(Boolean).join(" ");
  if (!prompt) return;
  this.coverage.questions += 1;
  if (!hasAnswer(draft.answer)) {
   this.coverage.unanswered += 1;
   this.push(true, () =>
    this.writer.paragraph(prompt, draft.translation ? { translation: draft.translation } : {}),
   );
   return;
  }
  const answerLines = draft.answerLetter
   ? [`Đáp án: ${draft.answerLetter}`, ...draft.answer.notes]
   : [draft.answer.text, ...draft.answer.notes];
  if (draft.translation) answerLines.push(`Dịch đề: ${draft.translation}`);
  const answer = answerLines.join("\n");
  this.coverage.answered += 1;
  if (parsePracticeExerciseItem(prompt, answer).correctChoice) this.coverage.choiceAnswers += 1;
  this.push(true, () => this.writer.paragraph(`${prompt} → ${answer}`));
 }

 /** Answers that belong to the blanks/lines above rather than to one prompt block. */
 answerKey(label: string, answers: readonly SourceAnswer[], lineLabels: readonly string[] = []) {
  const lines = answers
   .map((answer, index) => {
    const numbering = lineLabels[index] || (answers.length > 1 ? `(${index + 1})` : "");
    return [numbering, answerOnOneLine(answer)].join(" ").trim();
   })
   .filter(Boolean);
  if (lines.length === 0) return;
  this.coverage.keyBlockAnswers += lines.length;
  this.push(true, () => this.writer.paragraph(`${label}: → ${lines.join("\n")}`));
 }
}
