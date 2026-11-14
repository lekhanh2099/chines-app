"use client";

import { useCallback, useState } from "react";
import type { LexicalEditor, LexicalNode, RangeSelection, TextFormatType } from "lexical";
import { $getSelection, $isRangeSelection, $isTextNode, FORMAT_TEXT_COMMAND } from "lexical";
import { $patchStyleText } from "@lexical/selection";

import { $isSelectionInsidePinyin } from "../utils/pinyin-editor-actions";

const EDITOR_HIGHLIGHT_COLOR = "var(--warning-subtle)";

/** Format toggles reflected from the current range selection, and the commands that change them. */
export function useFloatingMenuFormatting(editor: LexicalEditor) {
 const [isBold, setIsBold] = useState(false);
 const [isItalic, setIsItalic] = useState(false);
 const [isUnderline, setIsUnderline] = useState(false);
 const [isStrikethrough, setIsStrikethrough] = useState(false);
 const [isSubscript, setIsSubscript] = useState(false);
 const [isSuperscript, setIsSuperscript] = useState(false);
 const [isCode, setIsCode] = useState(false);
 const [isHighlight, setIsHighlight] = useState(false);
 const [isPinyinActive, setIsPinyinActive] = useState(false);

 /** Must run inside an editor read/update with a non-collapsed range selection. */
 const syncFormatsFromSelection = useCallback(
  (selection: RangeSelection, anchorNode: LexicalNode) => {
   setIsBold(selection.hasFormat("bold"));
   setIsItalic(selection.hasFormat("italic"));
   setIsUnderline(selection.hasFormat("underline"));
   setIsStrikethrough(selection.hasFormat("strikethrough"));
   setIsSubscript(selection.hasFormat("subscript"));
   setIsSuperscript(selection.hasFormat("superscript"));
   setIsCode(selection.hasFormat("code"));
   setIsPinyinActive($isSelectionInsidePinyin());

   if ($isTextNode(anchorNode)) {
    setIsHighlight(anchorNode.getStyle().includes("background-color"));
   } else {
    setIsHighlight(false);
   }
  },
  [],
 );

 const formatText = useCallback(
  (format: TextFormatType) => {
   editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  },
  [editor],
 );

 const applyInlineStyle = useCallback(
  (styles: Parameters<typeof $patchStyleText>[1]) => {
   editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) $patchStyleText(selection, styles);
   });
  },
  [editor],
 );

 const toggleHighlight = useCallback(() => {
  applyInlineStyle({
   "background-color": isHighlight ? null : EDITOR_HIGHLIGHT_COLOR,
  });
 }, [applyInlineStyle, isHighlight]);

 const clearFormatting = useCallback(() => {
  editor.update(() => {
   const selection = $getSelection();
   if (!$isRangeSelection(selection)) return;

   for (const node of selection.getNodes()) {
    if ($isTextNode(node)) {
     if (node.getFormat() !== 0) node.setFormat(0);
     if (node.getStyle()) node.setStyle("");
    }
   }
  });
 }, [editor]);

 return {
  formats: {
   isBold,
   isItalic,
   isUnderline,
   isStrikethrough,
   isSubscript,
   isSuperscript,
   isCode,
   isHighlight,
  },
  isPinyinActive,
  setIsPinyinActive,
  syncFormatsFromSelection,
  formatText,
  toggleHighlight,
  clearFormatting,
 };
}
