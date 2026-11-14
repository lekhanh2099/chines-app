"use client";

/**
 * ToolbarPlugin — Playground-style toolbar for the Lexical editor.
 *
 * Features:
 *  - Undo / Redo
 *  - Block type (Paragraph, H1-H3, Bullet, Numbered, Check, Quote, Code)
 *  - Font family picker
 *  - Font size with +/- buttons
 *  - Bold, Italic, Underline, Strikethrough, Code
 *  - Text color & background color pickers
 *  - Text alignment (Left, Center, Right, Justify)
 *  - Global Pinyin toggle
 */
import { useCallback } from "react";
import {
 $getSelection,
 FORMAT_TEXT_COMMAND,
 FORMAT_ELEMENT_COMMAND,
 UNDO_COMMAND,
 REDO_COMMAND,
 INDENT_CONTENT_COMMAND,
 OUTDENT_CONTENT_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
 INSERT_ORDERED_LIST_COMMAND,
 INSERT_UNORDERED_LIST_COMMAND,
 INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { $patchStyleText } from "@lexical/selection";
import {
 Undo2,
 Redo2,
 Bold,
 Italic,
 Underline,
 Strikethrough,
 Code,
 Type,
 Baseline,
} from "lucide-react";
import { FONT_FAMILIES } from "../toolbar-options";
import {
 BG_COLORS,
 BLOCK_TYPES,
 TEXT_COLORS,
 formatCode,
 formatHeading,
 formatParagraph,
 formatQuote,
} from "./toolbar/toolbar-format";
import {
 ColorPicker,
 Divider,
 Dropdown,
 DropdownItem,
 FontSizeControl,
 ToolbarButton,
 pf,
} from "./toolbar/ToolbarControls";
import { InsertDropdown } from "./toolbar/ToolbarInsertDropdown";
import { AlignDropdown, ListDropdown, PinyinToolbarDropdown } from "./toolbar/ToolbarMenus";
import { useEditorToolbarState } from "./toolbar/useEditorToolbarState";

/* ════════════════════════════════════════════════════════
   Main Plugin
   ════════════════════════════════════════════════════════ */

export default function ToolbarPlugin() {
 const [editor] = useLexicalComposerContext();

 const {
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
 } = useEditorToolbarState(editor);

 /* ── Style helpers ── */
 const applyStyle = useCallback(
  (styles: Parameters<typeof $patchStyleText>[1]) => {
   editor.update(() => {
    const selection = $getSelection();
    if (selection !== null) {
     $patchStyleText(selection, styles);
    }
   });
  },
  [editor],
 );

 /* ── Block format handler ── */
 const handleBlockFormat = useCallback(
  (type: string) => {
   if (type === "paragraph") {
    formatParagraph(editor);
   } else if (type === "h1" || type === "h2" || type === "h3") {
    formatHeading(editor, type);
   } else if (type === "quote") {
    formatQuote(editor);
   } else if (type === "code") {
    formatCode(editor);
   } else if (type === "bullet") {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
   } else if (type === "number") {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
   } else if (type === "check") {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
   }
  },
  [editor],
 );

 /* ════════════════════════════════════════════════════════
    Render
    ════════════════════════════════════════════════════════ */

 return (
  <div
   role="group"
   aria-label="Công cụ định dạng ghi chú"
   className="toolbar flex flex-nowrap items-center gap-1 overflow-x-auto"
   onMouseDown={pf}
  >
   {/* ── Undo / Redo ── */}
   <ToolbarButton
    disabled={!canUndo || !isEditable}
    onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
    title="Undo (⌘Z)"
   >
    <Undo2 />
   </ToolbarButton>
   <ToolbarButton
    disabled={!canRedo || !isEditable}
    onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
    title="Redo (⇧⌘Z)"
   >
    <Redo2 />
   </ToolbarButton>
   <Divider />

   {/* ── Block Type ── */}
   <Dropdown
    buttonLabel={BLOCK_TYPES[blockType] || "Normal"}
    buttonTitle="Block format"
    disabled={!isEditable}
   >
    {Object.entries(BLOCK_TYPES).map(([key, label]) => (
     <DropdownItem key={key} active={blockType === key} onClick={() => handleBlockFormat(key)}>
      {label}
     </DropdownItem>
    ))}
   </Dropdown>
   <Divider />

   {/* ── Font Family ── */}
   <Dropdown
    buttonLabel={FONT_FAMILIES.find(([v]) => v === fontFamily)?.[1] || "Font"}
    buttonTitle="Font family"
    disabled={!isEditable}
   >
    {FONT_FAMILIES.map(([value, label]) => (
     <DropdownItem
      key={value}
      active={fontFamily === value}
      onClick={() => applyStyle({ "font-family": value || null })}
      style={value ? { fontFamily: value } : undefined}
     >
      {label}
     </DropdownItem>
    ))}
   </Dropdown>
   <Divider />

   {/* ── Font Size ── */}
   <FontSizeControl
    key={fontSize}
    fontSize={fontSize}
    disabled={!isEditable}
    applyFontSize={(size) => applyStyle({ "font-size": size })}
   />
   <Divider />

   {/* ── Text Format ── */}
   <ToolbarButton
    active={isBold}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
    title="Bold (⌘B)"
   >
    <Bold />
   </ToolbarButton>
   <ToolbarButton
    active={isItalic}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
    title="Italic (⌘I)"
   >
    <Italic />
   </ToolbarButton>
   <ToolbarButton
    active={isUnderline}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
    title="Underline (⌘U)"
   >
    <Underline />
   </ToolbarButton>
   <ToolbarButton
    active={isStrikethrough}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
    title="Strikethrough"
   >
    <Strikethrough />
   </ToolbarButton>
   <ToolbarButton
    active={isCode}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
    title="Inline Code"
   >
    <Code />
   </ToolbarButton>
   <Divider />

   {/* ── Colors ── */}
   <ColorPicker
    label="Text Color"
    icon={<Type />}
    colors={TEXT_COLORS}
    activeColor={fontColor}
    onSelect={(c) => applyStyle({ color: c || null })}
    disabled={!isEditable}
   />
   <ColorPicker
    label="Background Color"
    icon={<Baseline />}
    colors={BG_COLORS}
    activeColor={bgColor}
    onSelect={(c) => applyStyle({ "background-color": c || null })}
    disabled={!isEditable}
   />
   <Divider />

   {/* ── Alignment & Indent ── */}
   <AlignDropdown
    format={elementFormat}
    isEditable={isEditable}
    onFormat={(fmt) => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, fmt)}
    onIndent={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
    onOutdent={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
   />
   <Divider />

   {/* ── Lists ── */}
   <ListDropdown
    blockType={blockType}
    isEditable={isEditable}
    onSelect={(type) => handleBlockFormat(type)}
   />
   <Divider />

   {/* ── + Insert Dropdown ── */}
   <InsertDropdown editor={editor} isEditable={isEditable} />
   <Divider />

   {/* ── Pinyin Dropdown ── */}
   <PinyinToolbarDropdown editor={editor} isEditable={isEditable} />
  </div>
 );
}
