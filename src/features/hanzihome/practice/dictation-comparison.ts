import { normalizeChineseAnswer } from "./text-comparison";

export type DictationDiffKind = "match" | "missing" | "extra" | "replace" | "transpose";

export type DictationDiffToken = {
 actual?: string;
 expected?: string;
 kind: DictationDiffKind;
 value: string;
};

export type DictationDiffSummary = {
 correct: number;
 extra: number;
 missing: number;
 replaced: number;
 transposed: number;
 totalExpected: number;
};

type EditOperation = "match" | "delete" | "insert" | "replace" | "transpose";
type MatrixCell = { cost: number; operation: EditOperation };

function cell(matrix: MatrixCell[][], row: number, column: number): MatrixCell {
 const value = matrix[row]?.[column];
 if (value === undefined) throw new RangeError(`Invalid diff matrix position: ${row},${column}`);
 return value;
}

export function buildDictationDiff(expected: string, actual: string): DictationDiffToken[] {
 const left = Array.from(normalizeChineseAnswer(expected));
 const right = Array.from(normalizeChineseAnswer(actual));
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
   const same = left[row - 1] === right[column - 1];
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
    left[row - 1] === right[column - 2] &&
    left[row - 2] === right[column - 1]
   ) {
    candidates.push({ cost: cell(matrix, row - 2, column - 2).cost + 1, operation: "transpose" });
   }
   const target = matrix[row];
   if (target !== undefined)
    target[column] = candidates.reduce((best, candidate) =>
     candidate.cost < best.cost ? candidate : best,
    );
  }
 }

 const reversed: DictationDiffToken[] = [];
 let row = left.length;
 let column = right.length;
 while (row > 0 || column > 0) {
  const operation = cell(matrix, row, column).operation;
  if (operation === "match") {
   const value = left[row - 1] ?? "";
   reversed.push({ kind: "match", value, expected: value, actual: value });
   row -= 1;
   column -= 1;
  } else if (operation === "replace") {
   const expectedValue = left[row - 1] ?? "";
   const actualValue = right[column - 1] ?? "";
   reversed.push({
    kind: "replace",
    value: actualValue,
    expected: expectedValue,
    actual: actualValue,
   });
   row -= 1;
   column -= 1;
  } else if (operation === "delete") {
   const value = left[row - 1] ?? "";
   reversed.push({ kind: "missing", value, expected: value });
   row -= 1;
  } else if (operation === "insert") {
   const value = right[column - 1] ?? "";
   reversed.push({ kind: "extra", value, actual: value });
   column -= 1;
  } else {
   const expectedValue = `${left[row - 2] ?? ""}${left[row - 1] ?? ""}`;
   const actualValue = `${right[column - 2] ?? ""}${right[column - 1] ?? ""}`;
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
 return reversed
  .reverse()
  .filter((token) => token.value.length > 0 || token.expected !== undefined);
}

export function summarizeDictationDiff(tokens: DictationDiffToken[]): DictationDiffSummary {
 const summary: DictationDiffSummary = {
  correct: 0,
  extra: 0,
  missing: 0,
  replaced: 0,
  transposed: 0,
  totalExpected: 0,
 };
 for (const token of tokens) {
  const expectedLength = Array.from(token.expected ?? "").length;
  summary.totalExpected += expectedLength;
  if (token.kind === "match") summary.correct += expectedLength;
  if (token.kind === "missing") summary.missing += expectedLength;
  if (token.kind === "extra") summary.extra += Array.from(token.actual ?? token.value).length;
  if (token.kind === "replace") summary.replaced += Math.max(expectedLength, 1);
  if (token.kind === "transpose") summary.transposed += Math.max(expectedLength, 2);
 }
 return summary;
}
