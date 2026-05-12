/**
 * ReadingHighlightPlugin — Highlights Chinese characters in the reading pane.
 *
 * When the user clicks or selects text in the reading pane:
 * - Single click on a Chinese character/word → highlight it with light blue bg
 * - Click on an already-highlighted word → open the Inspector (vocab lookup)
 * - Selection → highlight the selected text range
 *
 * Highlights are stored as background-color inline styles on TextNodes.
 */
"use client";

import { useCallback, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
 $getSelection,
 $isRangeSelection,
 $isTextNode,
 CLICK_COMMAND,
 COMMAND_PRIORITY_LOW,
} from "lexical";
import { $patchStyleText } from "@lexical/selection";

const HIGHLIGHT_COLOR = "rgba(147, 197, 253, 0.4)"; // blue-300/40

/** Check if a character is a CJK character */
function isChinese(char: string): boolean {
 const code = char.charCodeAt(0);
 return (
  (code >= 0x4e00 && code <= 0x9fff) ||
  (code >= 0x3400 && code <= 0x4dbf) ||
  (code >= 0x20000 && code <= 0x2a6df) ||
  (code >= 0xf900 && code <= 0xfaff)
 );
}

/** Check if text contains any Chinese characters */
function containsChinese(text: string): boolean {
 return [...text].some(isChinese);
}

export default function ReadingHighlightPlugin() {
 const [editor] = useLexicalComposerContext();

 const handleClick = useCallback(() => {
  editor.update(() => {
   const selection = $getSelection();
   if (!$isRangeSelection(selection)) return;

   // If user has a collapsed selection (just clicked), check the node
   if (selection.isCollapsed()) {
    const node = selection.anchor.getNode();
    if (!$isTextNode(node)) return;

    const text = node.getTextContent();
    if (!containsChinese(text)) return;

    // Check if already highlighted
    const currentBg = node.getStyle()?.includes(HIGHLIGHT_COLOR);
    if (currentBg) {
     // Already highlighted → dispatch custom event for Inspector
     const word = text.trim();
     if (word) {
      window.dispatchEvent(
       new CustomEvent("reading-highlight-click", {
        detail: { word },
       }),
      );
     }
    } else {
     // Highlight the word — expand selection to word boundary
     // For Chinese text, each character or consecutive Chinese chars form a "word"
     $patchStyleText(selection, { "background-color": HIGHLIGHT_COLOR });
    }
    return;
   }

   // User has a range selection → highlight it
   const selectedText = selection.getTextContent();
   if (containsChinese(selectedText)) {
    $patchStyleText(selection, { "background-color": HIGHLIGHT_COLOR });
   }
  });
  return false;
 }, [editor]);

 useEffect(() => {
  return editor.registerCommand(
   CLICK_COMMAND,
   handleClick,
   COMMAND_PRIORITY_LOW,
  );
 }, [editor, handleClick]);

 return null;
}
