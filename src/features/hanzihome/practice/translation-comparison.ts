import type { TranslationDirection } from "./translation-practice";
import {
 buildDictationDiff,
 summarizeDictationDiff,
 type DictationDiffKind,
 type DictationDiffSummary,
 type DictationDiffToken,
} from "./dictation-comparison";
import { normalizeVietnameseAnswer } from "./text-comparison";

export type TranslationDiffToken = DictationDiffToken;
export type TranslationDiffSummary = DictationDiffSummary;
export type TranslationDiffKind = DictationDiffKind;

type EditOperation = "match" | "delete" | "insert" | "replace" | "transpose";
type MatrixCell = { cost: number; operation: EditOperation };

function cell(matrix: MatrixCell[][], row: number, column: number): MatrixCell {
 const value = matrix[row]?.[column];
 if (value === undefined) throw new RangeError(`Invalid diff matrix position: ${row},${column}`);
 return value;
}

export function buildVietnameseWordDiff(expected: string, actual: string): TranslationDiffToken[] {
 const left = expected.trim().split(/\s+/).filter(Boolean);
 const right = actual.trim().split(/\s+/).filter(Boolean);

 if (left.length === 0 && right.length === 0) return [];
 if (left.length === 0) {
  return right.map((val) => ({ kind: "extra", value: val, actual: val }));
 }
 if (right.length === 0) {
  return left.map((val) => ({ kind: "missing", value: val, expected: val }));
 }

 const matrix: MatrixCell[][] = Array.from({ length: left.length + 1 }, () =>
  Array.from({ length: right.length + 1 }, () => ({ cost: 0, operation: "match" })),
 );

 for (let row = 1; row <= left.length; row += 1) {
  const target = matrix[row];
  if (target !== undefined) target[0] = { cost: row, operation: "delete" };
 }

 const firstRow = matrix[0];
 if (firstRow !== undefined) {
  for (let column = 1; column <= right.length; column += 1) {
   firstRow[column] = { cost: column, operation: "insert" };
  }
 }

 for (let row = 1; row <= left.length; row += 1) {
  for (let column = 1; column <= right.length; column += 1) {
   const leftWord = left[row - 1] ?? "";
   const rightWord = right[column - 1] ?? "";
   const same = normalizeVietnameseAnswer(leftWord) === normalizeVietnameseAnswer(rightWord);

   const candidates: MatrixCell[] = [
    { cost: cell(matrix, row - 1, column).cost + 1, operation: "delete" },
    { cost: cell(matrix, row, column - 1).cost + 1, operation: "insert" },
    {
     cost: cell(matrix, row - 1, column - 1).cost + (same ? 0 : 1),
     operation: same ? "match" : "replace",
    },
   ];

   if (
    row > 1 &&
    column > 1 &&
    normalizeVietnameseAnswer(left[row - 1] ?? "") ===
     normalizeVietnameseAnswer(right[column - 2] ?? "") &&
    normalizeVietnameseAnswer(left[row - 2] ?? "") ===
     normalizeVietnameseAnswer(right[column - 1] ?? "")
   ) {
    candidates.push({
     cost: cell(matrix, row - 2, column - 2).cost + 1,
     operation: "transpose",
    });
   }

   const target = matrix[row];
   if (target !== undefined) {
    target[column] = candidates.reduce((best, candidate) =>
     candidate.cost < best.cost ? candidate : best,
    );
   }
  }
 }

 const reversed: TranslationDiffToken[] = [];
 let row = left.length;
 let column = right.length;

 while (row > 0 || column > 0) {
  const operation = cell(matrix, row, column).operation;
  if (operation === "match") {
   const leftWord = left[row - 1] ?? "";
   const rightWord = right[column - 1] ?? "";
   reversed.push({
    kind: "match",
    value: rightWord,
    expected: leftWord,
    actual: rightWord,
   });
   row -= 1;
   column -= 1;
  } else if (operation === "replace") {
   const leftWord = left[row - 1] ?? "";
   const rightWord = right[column - 1] ?? "";
   reversed.push({
    kind: "replace",
    value: rightWord,
    expected: leftWord,
    actual: rightWord,
   });
   row -= 1;
   column -= 1;
  } else if (operation === "delete") {
   const leftWord = left[row - 1] ?? "";
   reversed.push({
    kind: "missing",
    value: leftWord,
    expected: leftWord,
   });
   row -= 1;
  } else if (operation === "insert") {
   const rightWord = right[column - 1] ?? "";
   reversed.push({
    kind: "extra",
    value: rightWord,
    actual: rightWord,
   });
   column -= 1;
  } else {
   const expectedValue = `${left[row - 2] ?? ""} ${left[row - 1] ?? ""}`;
   const actualValue = `${right[column - 2] ?? ""} ${right[column - 1] ?? ""}`;
   reversed.push({
    kind: "transpose",
    value: actualValue,
    expected: expectedValue,
    actual: actualValue,
   });
   row -= 2;
   column -= 2;
  }
 }

 return reversed.reverse();
}

export function summarizeWordDiff(tokens: TranslationDiffToken[]): TranslationDiffSummary {
 const summary: TranslationDiffSummary = {
  correct: 0,
  extra: 0,
  missing: 0,
  replaced: 0,
  transposed: 0,
  totalExpected: 0,
 };
 for (const token of tokens) {
  if (token.kind === "match") {
   summary.correct += 1;
   summary.totalExpected += 1;
  } else if (token.kind === "missing") {
   summary.missing += 1;
   summary.totalExpected += 1;
  } else if (token.kind === "extra") {
   summary.extra += 1;
  } else if (token.kind === "replace") {
   summary.replaced += 1;
   summary.totalExpected += 1;
  } else if (token.kind === "transpose") {
   summary.transposed += 2;
   summary.totalExpected += 2;
  }
 }
 return summary;
}

export function buildTranslationDiff(
 expected: string,
 actual: string,
 direction: TranslationDirection,
): TranslationDiffToken[] {
 if (direction === "vi-zh") {
  return buildDictationDiff(expected, actual);
 }
 return buildVietnameseWordDiff(expected, actual);
}

export function summarizeTranslationDiff(
 tokens: TranslationDiffToken[],
 direction: TranslationDirection,
): TranslationDiffSummary {
 if (direction === "vi-zh") {
  return summarizeDictationDiff(tokens);
 }
 return summarizeWordDiff(tokens);
}

export function translationScoreBadgeVariant(score: number): "success" | "warning" | "danger" {
 if (score === 100) return "success";
 if (score >= 70) return "warning";
 return "danger";
}

export function translationScoreLabel(score: number): string {
 if (score === 100) return "Chính xác · 100%";
 if (score >= 85) return `Rất tốt · ${score}%`;
 if (score >= 70) return `Khá tốt · ${score}%`;
 return `Cần cải thiện · ${score}%`;
}
