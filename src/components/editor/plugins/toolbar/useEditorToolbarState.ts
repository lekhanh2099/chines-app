import { useCallback, useEffect, useState } from "react";
import {
 $getSelection,
 $isRangeSelection,
 $isRootOrShadowRoot,
 $isElementNode,
 SELECTION_CHANGE_COMMAND,
 COMMAND_PRIORITY_CRITICAL,
 CAN_UNDO_COMMAND,
 CAN_REDO_COMMAND,
 type LexicalEditor,
 type ElementFormatType,
} from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { $isCodeNode } from "@lexical/code";
import { $isListNode, ListNode } from "@lexical/list";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import type { BLOCK_TYPES } from "./toolbar-format";

/** Toolbar state synced from the editor selection, history and editable listeners. */
export function useEditorToolbarState(editor: LexicalEditor) {
 // Undo/Redo
 const [canUndo, setCanUndo] = useState(false);
 const [canRedo, setCanRedo] = useState(false);

 // Text format
 const [isBold, setIsBold] = useState(false);
 const [isItalic, setIsItalic] = useState(false);
 const [isUnderline, setIsUnderline] = useState(false);
 const [isStrikethrough, setIsStrikethrough] = useState(false);
 const [isCode, setIsCode] = useState(false);

 // Block type
 const [blockType, setBlockType] = useState<keyof typeof BLOCK_TYPES>("paragraph");

 // Font
 const [fontFamily, setFontFamily] = useState("");
 const [fontSize, setFontSize] = useState("16px");

 // Colors
 const [fontColor, setFontColor] = useState("");
 const [bgColor, setBgColor] = useState("");

 // Alignment
 const [elementFormat, setElementFormat] = useState<ElementFormatType>("left");

 // Pinyin toggle

 // Editable
 const [isEditable, setIsEditable] = useState(() => editor.isEditable());

 /* ── Sync toolbar state from selection ── */
 const $updateToolbar = useCallback(() => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;

  // Text format state
  setIsBold(selection.hasFormat("bold"));
  setIsItalic(selection.hasFormat("italic"));
  setIsUnderline(selection.hasFormat("underline"));
  setIsStrikethrough(selection.hasFormat("strikethrough"));
  setIsCode(selection.hasFormat("code"));

  // Inline style state
  setFontFamily($getSelectionStyleValueForProperty(selection, "font-family", ""));
  setFontSize($getSelectionStyleValueForProperty(selection, "font-size", "16px"));
  setFontColor($getSelectionStyleValueForProperty(selection, "color", ""));
  setBgColor($getSelectionStyleValueForProperty(selection, "background-color", ""));

  // Block type
  const anchorNode = selection.anchor.getNode();
  let element =
   anchorNode.getKey() === "root"
    ? anchorNode
    : $findMatchingParent(anchorNode, (e) => {
       const parent = e.getParent();
       return parent !== null && $isRootOrShadowRoot(parent);
      });

  if (element === null) {
   element = anchorNode.getTopLevelElementOrThrow();
  }

  // Alignment
  if ($isElementNode(element)) {
   setElementFormat(element.getFormatType() || "left");
  }

  // Detect block type
  if ($isListNode(element)) {
   const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
   const type = parentList ? parentList.getListType() : element.getListType();
   setBlockType(type === "number" ? "number" : type === "check" ? "check" : "bullet");
  } else if ($isHeadingNode(element)) {
   const heading = element.getTag();
   setBlockType(heading === "h1" || heading === "h2" || heading === "h3" ? heading : "paragraph");
  } else if ($isCodeNode(element)) {
   setBlockType("code");
  } else {
   setBlockType("paragraph");
  }
 }, []);

 /* ── Register listeners ── */
 useEffect(() => {
  return mergeRegister(
   editor.registerEditableListener((editable) => setIsEditable(editable)),
   editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
     $updateToolbar();
     return false;
    },
    COMMAND_PRIORITY_CRITICAL,
   ),
   editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => $updateToolbar());
   }),
   editor.registerCommand<boolean>(
    CAN_UNDO_COMMAND,
    (payload) => {
     setCanUndo(payload);
     return false;
    },
    COMMAND_PRIORITY_CRITICAL,
   ),
   editor.registerCommand<boolean>(
    CAN_REDO_COMMAND,
    (payload) => {
     setCanRedo(payload);
     return false;
    },
    COMMAND_PRIORITY_CRITICAL,
   ),
  );
 }, [editor, $updateToolbar]);

 return {
  canUndo,
  canRedo,
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough,
  isCode,
  blockType,
  fontFamily,
  fontSize,
  fontColor,
  bgColor,
  elementFormat,
  isEditable,
 };
}
