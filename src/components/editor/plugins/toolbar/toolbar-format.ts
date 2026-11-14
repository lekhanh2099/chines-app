import {
 $createParagraphNode,
 $getSelection,
 $isRangeSelection,
 type LexicalEditor,
} from "lexical";
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";

/* ── Constants ── */

export const BLOCK_TYPES = {
 paragraph: "Normal",
 h1: "Heading 1",
 h2: "Heading 2",
 h3: "Heading 3",
 bullet: "Bullet List",
 number: "Numbered List",
 check: "Check List",
 quote: "Quote",
 code: "Code Block",
};

export const TEXT_COLORS = [
 { label: "Default", value: "" },
 { label: "Red", value: "#ef4444" },
 { label: "Orange", value: "#f97316" },
 { label: "Yellow", value: "#eab308" },
 { label: "Green", value: "#22c55e" },
 { label: "Blue", value: "#3b82f6" },
 { label: "Purple", value: "#a855f7" },
 { label: "Pink", value: "#ec4899" },
 { label: "Gray", value: "#6b7280" },
];

export const BG_COLORS = [
 { label: "Default", value: "" },
 { label: "Red", value: "#fef2f2" },
 { label: "Orange", value: "#fff7ed" },
 { label: "Yellow", value: "#fefce8" },
 { label: "Green", value: "#f0fdf4" },
 { label: "Blue", value: "#eff6ff" },
 { label: "Purple", value: "#faf5ff" },
 { label: "Pink", value: "#fdf2f8" },
 { label: "Gray", value: "#f9fafb" },
];

/* ════════════════════════════════════════════════════════
   Block Format Helpers
   ════════════════════════════════════════════════════════ */

export function formatParagraph(editor: LexicalEditor) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createParagraphNode());
  }
 });
}

export function formatHeading(editor: LexicalEditor, tag: HeadingTagType) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createHeadingNode(tag));
  }
 });
}

export function formatQuote(editor: LexicalEditor) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createQuoteNode());
  }
 });
}

export function formatCode(editor: LexicalEditor) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createCodeNode());
  }
 });
}
