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
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
 $findMatchingParent,
 $getNearestNodeOfType,
 mergeRegister,
} from "@lexical/utils";
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
 X,
} from "lucide-react";

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
} as const;

const FONT_FAMILIES: [string, string][] = [
 ["", "Default"],
 ["Arial", "Arial"],
 ["Georgia", "Georgia"],
 ["Times New Roman", "Times New Roman"],
 ["Courier New", "Courier New"],
 ["'Noto Sans SC', sans-serif", "Noto Sans SC"],
 ["'Ma Shan Zheng', cursive", "Ma Shan Zheng"],
];

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
 className = "",
}: {
 active?: boolean;
 disabled?: boolean;
 onClick: () => void;
 title: string;
 children: React.ReactNode;
 className?: string;
}) {
 return (
  <button
   type="button"
   disabled={disabled}
   onMouseDown={pf}
   onClick={onClick}
   title={title}
   aria-label={title}
   className={[
    "toolbar-item",
    active ? "active" : "",
    disabled ? "disabled" : "",
    className,
   ]
    .filter(Boolean)
    .join(" ")}
  >
   {children}
  </button>
 );
}

function Divider() {
 return <div className="toolbar-divider" />;
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
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (!open) return;
  const close = (e: MouseEvent) => {
   if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  };
  document.addEventListener("mousedown", close);
  return () => document.removeEventListener("mousedown", close);
 }, [open]);

 return (
  <div ref={ref} className="toolbar-dropdown">
   <button
    type="button"
    disabled={disabled}
    onMouseDown={pf}
    onClick={() => setOpen(!open)}
    className="toolbar-item toolbar-dropdown-trigger"
    title={buttonTitle || buttonLabel}
   >
    {buttonIcon}
    <span className="toolbar-dropdown-label">{buttonLabel}</span>
    <ChevronDown className="toolbar-chevron" />
   </button>
   {open && (
    <div
     className="toolbar-dropdown-panel"
     onMouseDown={pf}
     onClick={() => setOpen(false)}
    >
     {children}
    </div>
   )}
  </div>
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
  <button
   type="button"
   onMouseDown={pf}
   onClick={onClick}
   style={style}
   className={`toolbar-dropdown-item ${active ? "active" : ""}`}
  >
   {children}
  </button>
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

 // Sync external changes
 useEffect(() => {
  setInputVal(fontSize.replace("px", ""));
 }, [fontSize]);

 const applySize = (val: string) => {
  let num = parseInt(val, 10);
  if (isNaN(num)) num = 16;
  num = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, num));
  setInputVal(String(num));
  applyFontSize(`${num}px`);
 };

 return (
  <div className="toolbar-font-size">
   <button
    type="button"
    disabled={disabled || parseInt(inputVal) <= MIN_FONT_SIZE}
    onMouseDown={pf}
    onClick={() => applySize(String(parseInt(inputVal) - 1))}
    className="toolbar-font-size-btn"
    title="Decrease font size"
   >
    <Minus className="w-3 h-3" />
   </button>
   <input
    type="text"
    value={inputVal}
    disabled={disabled}
    className="toolbar-font-size-input"
    onMouseDown={pf}
    onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ""))}
    onBlur={() => applySize(inputVal)}
    onKeyDown={(e) => {
     if (e.key === "Enter") {
      e.preventDefault();
      applySize(inputVal);
      (e.target as HTMLInputElement).blur();
     }
    }}
   />
   <button
    type="button"
    disabled={disabled || parseInt(inputVal) >= MAX_FONT_SIZE}
    onMouseDown={pf}
    onClick={() => applySize(String(parseInt(inputVal) + 1))}
    className="toolbar-font-size-btn"
    title="Increase font size"
   >
    <Plus className="w-3 h-3" />
   </button>
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
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (!open) return;
  const close = (e: MouseEvent) => {
   if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  };
  document.addEventListener("mousedown", close);
  return () => document.removeEventListener("mousedown", close);
 }, [open]);

 return (
  <div ref={ref} className="toolbar-dropdown">
   <button
    type="button"
    disabled={disabled}
    onMouseDown={pf}
    onClick={() => setOpen(!open)}
    className="toolbar-item toolbar-color-trigger"
    title={label}
   >
    <span className="toolbar-color-icon">
     {icon}
     <span
      className="toolbar-color-indicator"
      style={{
       backgroundColor:
        activeColor ||
        (label === "Text Color" ? "var(--text-primary)" : "transparent"),
       border: !activeColor ? "1px solid var(--border)" : "none",
      }}
     />
    </span>
    <ChevronDown className="toolbar-chevron" />
   </button>
   {open && (
    <div
     className="toolbar-dropdown-panel toolbar-color-panel"
     onMouseDown={pf}
    >
     <div className="toolbar-color-grid">
      {colors.map((c) => (
       <button
        key={c.value || "default"}
        type="button"
        onMouseDown={pf}
        onClick={() => {
         onSelect(c.value);
         setOpen(false);
        }}
        title={c.label}
        className={`toolbar-color-swatch ${activeColor === c.value ? "active" : ""}`}
        style={{
         backgroundColor:
          c.value ||
          (label === "Text Color" ? "var(--text-primary)" : "transparent"),
        }}
       >
        {!c.value && <span className="toolbar-color-reset">✕</span>}
       </button>
      ))}
     </div>
    </div>
   )}
  </div>
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

/* ── Insert Table Dialog (Playground-style) ── */

function InsertTableDialog({
 editor,
 onClose,
}: {
 editor: LexicalEditor;
 onClose: () => void;
}) {
 const [rows, setRows] = useState("5");
 const [columns, setColumns] = useState("5");

 const handleConfirm = () => {
  const r = parseInt(rows, 10);
  const c = parseInt(columns, 10);
  if (isNaN(r) || isNaN(c) || r < 1 || c < 1 || r > 500 || c > 50) return;
  editor.dispatchCommand(INSERT_TABLE_COMMAND, {
   columns: String(c),
   rows: String(r),
   includeHeaders: true,
  });
  onClose();
 };

 return (
  <div className="insert-table-dialog-overlay" onMouseDown={onClose}>
   <div
    className="insert-table-dialog"
    onMouseDown={(e) => e.stopPropagation()}
   >
    <div className="insert-table-dialog-header">
     <h3>Insert Table</h3>
     <button
      type="button"
      onClick={onClose}
      className="insert-table-dialog-close"
     >
      <X className="w-4 h-4" />
     </button>
    </div>
    <div className="insert-table-dialog-divider" />
    <div className="insert-table-dialog-body">
     <label className="insert-table-dialog-label">
      <span>Rows</span>
      <input
       type="number"
       min={1}
       max={500}
       value={rows}
       onChange={(e) => setRows(e.target.value)}
       className="insert-table-dialog-input"
      />
     </label>
     <label className="insert-table-dialog-label">
      <span>Columns</span>
      <input
       type="number"
       min={1}
       max={50}
       value={columns}
       onChange={(e) => setColumns(e.target.value)}
       className="insert-table-dialog-input"
       onKeyDown={(e) => {
        if (e.key === "Enter") handleConfirm();
       }}
      />
     </label>
    </div>
    <div className="insert-table-dialog-footer">
     <button
      type="button"
      onClick={handleConfirm}
      className="insert-table-dialog-confirm"
     >
      Confirm
     </button>
    </div>
   </div>
  </div>
 );
}

/* ── + Insert Dropdown (Playground-style) ── */

function InsertDropdown({
 editor,
 isEditable,
}: {
 editor: LexicalEditor;
 isEditable: boolean;
}) {
 const [open, setOpen] = useState(false);
 const [showTableDialog, setShowTableDialog] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (!open) return;
  const close = (e: MouseEvent) => {
   if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  };
  document.addEventListener("mousedown", close);
  return () => document.removeEventListener("mousedown", close);
 }, [open]);

 return (
  <>
   <div ref={ref} className="toolbar-dropdown">
    <button
     type="button"
     disabled={!isEditable}
     onMouseDown={pf}
     onClick={() => setOpen(!open)}
     className="toolbar-item toolbar-dropdown-trigger"
     title="Insert"
    >
     <Plus className="w-3.5 h-3.5" />
     <span className="toolbar-dropdown-label">Insert</span>
     <ChevronDown className="toolbar-chevron" />
    </button>
    {open && (
     <div className="toolbar-dropdown-panel" onMouseDown={pf}>
      <button
       type="button"
       onMouseDown={pf}
       onClick={() => {
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        setOpen(false);
       }}
       className="toolbar-dropdown-item"
      >
       <SeparatorHorizontal className="w-4 h-4 mr-2 shrink-0" />
       Horizontal Rule
      </button>
      <button
       type="button"
       onMouseDown={pf}
       onClick={() => {
        setShowTableDialog(true);
        setOpen(false);
       }}
       className="toolbar-dropdown-item"
      >
       <Table className="w-4 h-4 mr-2 shrink-0" />
       Table
      </button>
     </div>
    )}
   </div>
   {showTableDialog && (
    <InsertTableDialog
     editor={editor}
     onClose={() => setShowTableDialog(false)}
    />
   )}
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
 const [blockType, setBlockType] =
  useState<keyof typeof BLOCK_TYPES>("paragraph");

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
  setFontFamily(
   $getSelectionStyleValueForProperty(selection, "font-family", ""),
  );
  setFontSize(
   $getSelectionStyleValueForProperty(selection, "font-size", "16px"),
  );
  setFontColor($getSelectionStyleValueForProperty(selection, "color", ""));
  setBgColor(
   $getSelectionStyleValueForProperty(selection, "background-color", ""),
  );

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
   setBlockType(
    type === "number" ? "number" : type === "check" ? "check" : "bullet",
   );
  } else if ($isHeadingNode(element)) {
   setBlockType(element.getTag() as keyof typeof BLOCK_TYPES);
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
  (styles: Record<string, string | null>) => {
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
    formatHeading(editor, type as HeadingTagType);
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
  <div className="toolbar" onMouseDown={pf}>
   {/* ── Undo / Redo ── */}
   <ToolbarButton
    disabled={!canUndo || !isEditable}
    onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
    title="Undo (⌘Z)"
   >
    <Undo2 className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    disabled={!canRedo || !isEditable}
    onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
    title="Redo (⇧⌘Z)"
   >
    <Redo2 className="w-4 h-4" />
   </ToolbarButton>
   <Divider />

   {/* ── Block Type ── */}
   <Dropdown
    buttonLabel={BLOCK_TYPES[blockType] || "Normal"}
    buttonTitle="Block format"
    disabled={!isEditable}
   >
    {Object.entries(BLOCK_TYPES).map(([key, label]) => (
     <DropdownItem
      key={key}
      active={blockType === key}
      onClick={() => handleBlockFormat(key)}
     >
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
    <Bold className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={isItalic}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
    title="Italic (⌘I)"
   >
    <Italic className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={isUnderline}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
    title="Underline (⌘U)"
   >
    <Underline className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={isStrikethrough}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
    title="Strikethrough"
   >
    <Strikethrough className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={isCode}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
    title="Inline Code"
   >
    <Code className="w-4 h-4" />
   </ToolbarButton>
   <Divider />

   {/* ── Colors ── */}
   <ColorPicker
    label="Text Color"
    icon={<Type className="w-4 h-4" />}
    colors={TEXT_COLORS}
    activeColor={fontColor}
    onSelect={(c) => applyStyle({ color: c || null })}
    disabled={!isEditable}
   />
   <ColorPicker
    label="Background Color"
    icon={<Baseline className="w-4 h-4" />}
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
    <AlignLeft className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={elementFormat === "center"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
    title="Center Align"
   >
    <AlignCenter className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={elementFormat === "right"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
    title="Right Align"
   >
    <AlignRight className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={elementFormat === "justify"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")}
    title="Justify"
   >
    <AlignJustify className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
    title="Outdent"
   >
    <Outdent className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
    title="Indent"
   >
    <Indent className="w-4 h-4" />
   </ToolbarButton>
   <Divider />

   {/* ── Lists ── */}
   <ToolbarButton
    active={blockType === "bullet"}
    disabled={!isEditable}
    onClick={() =>
     editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
    title="Bullet List"
   >
    <List className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={blockType === "number"}
    disabled={!isEditable}
    onClick={() =>
     editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
    title="Numbered List"
   >
    <ListOrdered className="w-4 h-4" />
   </ToolbarButton>
   <ToolbarButton
    active={blockType === "check"}
    disabled={!isEditable}
    onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}
    title="Check List"
   >
    <ListChecks className="w-4 h-4" />
   </ToolbarButton>
   <Divider />

   {/* ── + Insert Dropdown ── */}
   <InsertDropdown editor={editor} isEditable={isEditable} />
   <Divider />

   <Divider />
  </div>
 );
}
