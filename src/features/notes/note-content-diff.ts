import { z } from "zod";

import type { NoteDraftRecord } from "@/features/notes/local/note-draft-store";

/**
 * Plain-text comparison of two note versions for the conflict / draft
 * recovery dialog. Lines are the editor's blocks (paragraphs, headings, list
 * items …); a changed line is compared again character by character, which
 * suits Chinese text without word boundaries.
 */

type LexicalNode = {
 type?: string;
 text?: string;
 children?: LexicalNode[];
};

const lexicalNodeSchema: z.ZodType<LexicalNode> = z.lazy(() =>
 z.object({
  type: z.string().optional(),
  text: z.string().optional(),
  children: z.array(lexicalNodeSchema).optional(),
 }),
);
const lexicalDocumentSchema = z.object({ root: lexicalNodeSchema });

const BLOCK_TYPES = new Set(["paragraph", "heading", "quote", "listitem", "code", "tablecell"]);
const NESTING_TYPES = new Set(["list", "table", "tablerow"]);

function inlineText(node: LexicalNode): string {
 if (node.type === "linebreak") return " ";
 return (node.text ?? "") + (node.children ?? []).map(inlineText).join("");
}

function blockLines(node: LexicalNode): string[] {
 const children = node.children ?? [];
 const hasNestedBlocks = children.some(
  (child) => BLOCK_TYPES.has(child.type ?? "") || NESTING_TYPES.has(child.type ?? ""),
 );
 if (BLOCK_TYPES.has(node.type ?? "") && !hasNestedBlocks) return [inlineText(node)];
 return children.flatMap(blockLines);
}

/** The non-empty text lines of an editor document (empty when there is none). */
export function noteContentLines(content: NoteDraftRecord["content"]): string[] {
 const parsed = lexicalDocumentSchema.safeParse(content);
 if (!parsed.success) return [];
 return blockLines(parsed.data.root)
  .map((line) => line.trim())
  .filter((line) => line.length > 0);
}

export const diffKindSchema = z.enum(["same", "added", "removed", "changed"]);
export type DiffKind = z.output<typeof diffKindSchema>;
/** A run of text; inside a "changed" line each part is same/added/removed. */
export type DiffPart = { kind: DiffKind; text: string };
/** One block of the comparison; only "changed" lines hold more than one part. */
export type DiffLine = { kind: DiffKind; parts: DiffPart[] };

// Longest-common-subsequence table cap; beyond it a block is shown as replaced.
const MAX_CELLS = 4_000_000;

function lcsDiff(before: readonly string[], after: readonly string[]): DiffPart[] {
 const rows = before.length;
 const columns = after.length;
 const { added, removed, same } = diffKindSchema.enum;
 if (rows * columns > MAX_CELLS) {
  return [
   ...before.map((text) => ({ kind: removed, text })),
   ...after.map((text) => ({ kind: added, text })),
  ];
 }
 // lengths[row * width + column] = LCS length of before[row..] and after[column..]
 const width = columns + 1;
 const lengths = new Uint32Array((rows + 1) * width);
 for (let row = rows - 1; row >= 0; row -= 1) {
  for (let column = columns - 1; column >= 0; column -= 1) {
   lengths[row * width + column] =
    before[row] === after[column]
     ? lengths[(row + 1) * width + column + 1] + 1
     : Math.max(lengths[(row + 1) * width + column], lengths[row * width + column + 1]);
  }
 }
 const parts: DiffPart[] = [];
 let row = 0;
 let column = 0;
 while (row < rows && column < columns) {
  if (before[row] === after[column]) {
   parts.push({ kind: same, text: before[row] });
   row += 1;
   column += 1;
  } else if (lengths[(row + 1) * width + column] >= lengths[row * width + column + 1]) {
   parts.push({ kind: removed, text: before[row] });
   row += 1;
  } else {
   parts.push({ kind: added, text: after[column] });
   column += 1;
  }
 }
 for (; row < rows; row += 1) parts.push({ kind: removed, text: before[row] });
 for (; column < columns; column += 1) parts.push({ kind: added, text: after[column] });
 return parts;
}

/** Merges neighbouring parts of the same kind (character runs into phrases). */
function mergeParts(parts: DiffPart[]): DiffPart[] {
 const merged: DiffPart[] = [];
 for (const part of parts) {
  const last = merged.at(-1);
  if (last && last.kind === part.kind) last.text += part.text;
  else merged.push({ ...part });
 }
 return merged;
}

/**
 * Line diff from `before` (server) to `after` (this device). Inside a run of
 * removed lines followed by added lines, the k-th removed and k-th added line
 * pair up as one "changed" line with a character-level diff.
 */
export function diffNoteLines(before: readonly string[], after: readonly string[]): DiffLine[] {
 const parts = lcsDiff(before, after);
 const lines: DiffLine[] = [];
 let index = 0;
 while (index < parts.length) {
  const part = parts[index];
  if (part.kind === "same") {
   lines.push({ kind: part.kind, parts: [part] });
   index += 1;
   continue;
  }
  const removed: DiffPart[] = [];
  const added: DiffPart[] = [];
  while (index < parts.length && parts[index].kind === "removed") {
   removed.push(parts[index]);
   index += 1;
  }
  while (index < parts.length && parts[index].kind === "added") {
   added.push(parts[index]);
   index += 1;
  }
  const paired = Math.min(removed.length, added.length);
  for (let pair = 0; pair < paired; pair += 1) {
   lines.push({
    kind: diffKindSchema.enum.changed,
    parts: mergeParts(lcsDiff(Array.from(removed[pair].text), Array.from(added[pair].text))),
   });
  }
  for (const rest of [...removed.slice(paired), ...added.slice(paired)]) {
   lines.push({ kind: rest.kind, parts: [rest] });
  }
 }
 return lines;
}
