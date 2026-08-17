"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { useCallback, useEffect, useState } from "react";
import {
 $getSelection,
 $isRangeSelection,
 $isRootOrShadowRoot,
 $createParagraphNode,
 $isElementNode,
 FORMAT_TEXT_COMMAND,
 FORMAT_ELEMENT_COMMAND,
 SELECTION_CHANGE_COMMAND,
 COMMAND_PRIORITY_CRITICAL,
 CAN_UNDO_COMMAND,
 CAN_REDO_COMMAND,
 UNDO_COMMAND,
 REDO_COMMAND,
 INDENT_CONTENT_COMMAND,
 OUTDENT_CONTENT_COMMAND,
 type LexicalEditor,
 type ElementFormatType,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
 $isHeadingNode,
 $createHeadingNode,
 $createQuoteNode,
 type HeadingTagType,
} from "@lexical/rich-text";
import { $isCodeNode, $createCodeNode } from "@lexical/code";
import {
 $isListNode,
 INSERT_ORDERED_LIST_COMMAND,
 INSERT_UNORDERED_LIST_COMMAND,
 INSERT_CHECK_LIST_COMMAND,
 ListNode,
} from "@lexical/list";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
 $patchStyleText,
 $getSelectionStyleValueForProperty,
 $setBlocksType,
} from "@lexical/selection";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
 Undo2,
 Redo2,
 Bold,
 Italic,
 Underline,
 Strikethrough,
 Code,
 AlignLeft,
 AlignCenter,
 AlignRight,
 AlignJustify,
 List,
 ListOrdered,
 ListChecks,
 ChevronDown,
 Type,
 Baseline,
 Minus,
 Plus,
 Indent,
 Outdent,
 Table,
 SeparatorHorizontal,
} from "lucide-react";
import { FONT_FAMILIES } from "../toolbar-options";

/* ── Constants ── */

const BLOCK_TYPES = {
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

const TEXT_COLORS = [
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

const BG_COLORS = [
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

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

/** Prevent native mousedown from stealing editor focus */
const pf = (e: React.MouseEvent) => e.preventDefault();

/* ════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════ */

function ToolbarButton({
 active,
 disabled,
 onClick,
 title,
 children,
}: {
 active?: boolean;
 disabled?: boolean;
 onClick: () => void;
 title: string;
 children: React.ReactNode;
}) {
 return (
  <Button
   type="button"
   variant={active ? "active" : "ghost"}
   size="icon-toolbar"
   disabled={disabled}
   onMouseDown={pf}
   onClick={onClick}
   title={title}
   aria-label={title}
   aria-pressed={active === undefined ? undefined : active}
  >
   {children}
  </Button>
 );
}

function Divider() {
 return <Separator orientation="vertical" />;
}

/* ── Dropdown ── */

function Dropdown({
 buttonLabel,
 buttonIcon,
 buttonTitle,
 disabled,
 children,
}: {
 buttonLabel: string;
 buttonIcon?: React.ReactNode;
 buttonTitle?: string;
 disabled?: boolean;
 children: React.ReactNode;
}) {
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     disabled={disabled}
     onMouseDown={pf}
     variant="ghost"
     size="toolbar"
     title={buttonTitle || buttonLabel}
    >
     {buttonIcon}
     <span className="max-w-24 truncate">{buttonLabel}</span>
     <ChevronDown data-icon="inline-end" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start">{children}</DropdownMenuContent>
  </DropdownMenu>
 );
}

function DropdownItem({
 active,
 onClick,
 children,
 style,
}: {
 active?: boolean;
 onClick: () => void;
 children: React.ReactNode;
 style?: React.CSSProperties;
}) {
 return (
  <DropdownMenuItem tone={active ? "accent" : "default"} onSelect={onClick} style={style}>
   {children}
  </DropdownMenuItem>
 );
}

/* ── Font Size Control (Playground-style +/- input) ── */

function FontSizeControl({
 fontSize,
 disabled,
 applyFontSize,
}: {
 fontSize: string;
 disabled?: boolean;
 applyFontSize: (size: string) => void;
}) {
 const [inputVal, setInputVal] = useState(() => fontSize.replace("px", ""));

 const applySize = (val: string) => {
  let num = parseInt(val, 10);
  if (isNaN(num)) num = 16;
  num = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, num));
  setInputVal(String(num));
  applyFontSize(`${num}px`);
 };

 return (
  <div className="toolbar-font-size">
   <Button
    type="button"
    disabled={disabled || parseInt(inputVal) <= MIN_FONT_SIZE}
    onMouseDown={pf}
    onClick={() => applySize(String(parseInt(inputVal) - 1))}
    variant="ghost"
    size="icon-toolbar"
    aria-label="Giảm cỡ chữ"
    title="Giảm cỡ chữ"
   >
    <Minus />
   </Button>
   {inputVal}
   {/* <Input
    type="text"
    value={inputVal}
    disabled={disabled}
    density="compact"
    className="toolbar-font-size-input w-14! h-auto! text-center! text-sm! font-medium!"
    onMouseDown={pf}
    onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ""))}
    onBlur={() => applySize(inputVal)}
    onKeyDown={(e) => {
     if (e.key === "Enter") {
      e.preventDefault();
      applySize(inputVal);
      if (e.target instanceof HTMLInputElement) e.target.blur();
     }
    }}
   /> */}
   <Button
    type="button"
    disabled={disabled || parseInt(inputVal) >= MAX_FONT_SIZE}
    onMouseDown={pf}
    onClick={() => applySize(String(parseInt(inputVal) + 1))}
    variant="ghost"
    size="icon-toolbar"
    aria-label="Tăng cỡ chữ"
    title="Tăng cỡ chữ"
   >
    <Plus />
   </Button>
  </div>
 );
}

/* ── Color Picker ── */

function ColorPicker({
 colors,
 activeColor,
 onSelect,
 icon,
 label,
 disabled,
}: {
 colors: { label: string; value: string }[];
 activeColor: string;
 onSelect: (color: string) => void;
 icon: React.ReactNode;
 label: string;
 disabled?: boolean;
}) {
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     disabled={disabled}
     onMouseDown={pf}
     variant="ghost"
     size="icon-toolbar"
     title={label}
     aria-label={label}
    >
     <span className="grid gap-0.5">
      {icon}
      <span
       aria-hidden="true"
       className="h-1 w-4 rounded-full border border-border-default"
       style={{
        backgroundColor:
         activeColor || (label === "Text Color" ? "var(--text-primary)" : "transparent"),
       }}
      />
     </span>
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start">
    <DropdownMenuRadioGroup value={activeColor} onValueChange={onSelect}>
     {colors.map((color) => (
      <DropdownMenuRadioItem key={color.value || "default"} value={color.value}>
       <span
        aria-hidden="true"
        className="size-4 rounded-full border border-border-default"
        style={{
         backgroundColor:
          color.value || (label === "Text Color" ? "var(--text-primary)" : "transparent"),
        }}
       />
       {color.label}
      </DropdownMenuRadioItem>
     ))}
    </DropdownMenuRadioGroup>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}

/* ════════════════════════════════════════════════════════
   Block Format Helpers
   ════════════════════════════════════════════════════════ */

function formatParagraph(editor: LexicalEditor) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createParagraphNode());
  }
 });
}

function formatHeading(editor: LexicalEditor, tag: HeadingTagType) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createHeadingNode(tag));
  }
 });
}

function formatQuote(editor: LexicalEditor) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createQuoteNode());
  }
 });
}

function formatCode(editor: LexicalEditor) {
 editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
   $setBlocksType(selection, () => $createCodeNode());
  }
 });
}

/* ── Insert Table Dialog ── */

function InsertTableDialog({ editor, onClose }: { editor: LexicalEditor; onClose: () => void }) {
 const [rows, setRows] = useState("5");
 const [columns, setColumns] = useState("5");

 const handleConfirm = () => {
  const rowCount = parseInt(rows, 10);
  const columnCount = parseInt(columns, 10);
  if (
   isNaN(rowCount) ||
   isNaN(columnCount) ||
   rowCount < 1 ||
   columnCount < 1 ||
   rowCount > 500 ||
   columnCount > 50
  )
   return;
  editor.dispatchCommand(INSERT_TABLE_COMMAND, {
   columns: String(columnCount),
   rows: String(rowCount),
   includeHeaders: true,
  });
  onClose();
 };

 return (
  <Dialog
   open
   onOpenChange={(open) => {
    if (!open) onClose();
   }}
  >
   <DialogContent size="sm">
    <DialogHeader>
     <DialogTitle>Chèn bảng</DialogTitle>
     <DialogDescription>Chọn số hàng và cột cho bảng mới.</DialogDescription>
    </DialogHeader>
    <DialogBody>
     <Label variant="label" className="grid gap-1.5">
      <span>Số hàng</span>
      <Input
       type="number"
       min={1}
       max={500}
       value={rows}
       onChange={(event) => setRows(event.target.value)}
      />
     </Label>
     <Label variant="label" className="grid gap-1.5">
      <span>Số cột</span>
      <Input
       type="number"
       min={1}
       max={50}
       value={columns}
       onChange={(event) => setColumns(event.target.value)}
       onKeyDown={(event) => {
        if (event.key === "Enter") handleConfirm();
       }}
      />
     </Label>
    </DialogBody>
    <DialogFooter>
     <Button type="button" variant="outline" onClick={onClose}>
      Hủy
     </Button>
     <Button type="button" onClick={handleConfirm}>
      Chèn bảng
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

/* ── + Insert Dropdown ── */

function InsertDropdown({ editor, isEditable }: { editor: LexicalEditor; isEditable: boolean }) {
 const [showTableDialog, setShowTableDialog] = useState(false);

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      disabled={!isEditable}
      onMouseDown={pf}
      variant="ghost"
      size="toolbar"
      title="Chèn nội dung"
     >
      <Plus data-icon="inline-start" />
      Chèn
      <ChevronDown data-icon="inline-end" />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
     <DropdownMenuItem
      onSelect={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}
     >
      <SeparatorHorizontal />
      Đường phân cách
     </DropdownMenuItem>
     <DropdownMenuItem onSelect={() => setShowTableDialog(true)}>
      <Table />
      Bảng
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>
   {showTableDialog ? (
    <InsertTableDialog editor={editor} onClose={() => setShowTableDialog(false)} />
   ) : null}
  </>
 );
}

/* ════════════════════════════════════════════════════════
   Main Plugin
   ════════════════════════════════════════════════════════ */

export default function ToolbarPlugin() {
 const [editor] = useLexicalComposerContext();

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
  <Card
   role="group"
   aria-label="Công cụ định dạng ghi chú"
   variant="section"
   padding="sm"
   className="flex flex-nowrap items-center gap-1 overflow-x-auto md:flex-wrap"
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

   {/* ── Alignment ── */}
   <ToolbarButton
    active={elementFormat === "left"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
    title="Left Align"
   >
    <AlignLeft />
   </ToolbarButton>
   <ToolbarButton
    active={elementFormat === "center"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
    title="Center Align"
   >
    <AlignCenter />
   </ToolbarButton>
   <ToolbarButton
    active={elementFormat === "right"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
    title="Right Align"
   >
    <AlignRight />
   </ToolbarButton>
   <ToolbarButton
    active={elementFormat === "justify"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")}
    title="Justify"
   >
    <AlignJustify />
   </ToolbarButton>
   <ToolbarButton
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
    title="Outdent"
   >
    <Outdent />
   </ToolbarButton>
   <ToolbarButton
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
    title="Indent"
   >
    <Indent />
   </ToolbarButton>
   <Divider />

   {/* ── Lists ── */}
   <ToolbarButton
    active={blockType === "bullet"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
    title="Bullet List"
   >
    <List />
   </ToolbarButton>
   <ToolbarButton
    active={blockType === "number"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
    title="Numbered List"
   >
    <ListOrdered />
   </ToolbarButton>
   <ToolbarButton
    active={blockType === "check"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}
    title="Check List"
   >
    <ListChecks />
   </ToolbarButton>
   <Divider />

   {/* ── + Insert Dropdown ── */}
   <InsertDropdown editor={editor} isEditable={isEditable} />
  </Card>
 );
}
