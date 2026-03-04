/**
 * FloatingToolbarPlugin — Playground-style floating toolbar on text selection.
 *
 * Appears above selected text with inline formatting options:
 * Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
 * Highlight (bg-color), Inline Code, Clear Formatting.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
 $getSelection,
 $isRangeSelection,
 $isTextNode,
 FORMAT_TEXT_COMMAND,
 SELECTION_CHANGE_COMMAND,
 COMMAND_PRIORITY_LOW,
 type TextFormatType,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
 Bold,
 Italic,
 Underline,
 Strikethrough,
 Subscript,
 Superscript,
 Highlighter,
 Code,
 RemoveFormatting,
} from "lucide-react";

const pf = (e: React.MouseEvent) => e.preventDefault();

function FloatingToolbar({
 editor,
}: {
 editor: ReturnType<typeof useLexicalComposerContext>[0];
}) {
 const toolbarRef = useRef<HTMLDivElement>(null);
 const [isVisible, setIsVisible] = useState(false);
 const [pos, setPos] = useState({ top: 0, left: 0 });

 // Format states
 const [isBold, setIsBold] = useState(false);
 const [isItalic, setIsItalic] = useState(false);
 const [isUnderline, setIsUnderline] = useState(false);
 const [isStrikethrough, setIsStrikethrough] = useState(false);
 const [isSubscript, setIsSubscript] = useState(false);
 const [isSuperscript, setIsSuperscript] = useState(false);
 const [isCode, setIsCode] = useState(false);
 const [isHighlight, setIsHighlight] = useState(false);

 const updatePosition = useCallback(() => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
   setIsVisible(false);
   return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
   setIsVisible(false);
   return;
  }

  const toolbar = toolbarRef.current;
  const toolbarWidth = toolbar?.offsetWidth || 340;
  const toolbarHeight = toolbar?.offsetHeight || 40;

  let top = rect.top - toolbarHeight - 8 + window.scrollY;
  let left = rect.left + rect.width / 2 - toolbarWidth / 2 + window.scrollX;

  // Keep within viewport
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));
  if (top < window.scrollY + 8) {
   top = rect.bottom + 8 + window.scrollY;
  }

  setPos({ top, left });
  setIsVisible(true);
 }, []);

 const $updateState = useCallback(() => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) {
   setIsVisible(false);
   return;
  }

  // Check if selection has actual text
  const text = selection.getTextContent();
  if (!text.trim()) {
   setIsVisible(false);
   return;
  }

  setIsBold(selection.hasFormat("bold"));
  setIsItalic(selection.hasFormat("italic"));
  setIsUnderline(selection.hasFormat("underline"));
  setIsStrikethrough(selection.hasFormat("strikethrough"));
  setIsSubscript(selection.hasFormat("subscript"));
  setIsSuperscript(selection.hasFormat("superscript"));
  setIsCode(selection.hasFormat("code"));

  // Check highlight via style
  const anchor = selection.anchor.getNode();
  if ($isTextNode(anchor)) {
   const style = anchor.getStyle();
   setIsHighlight(style.includes("background-color"));
  } else {
   setIsHighlight(false);
  }

  // Defer position update to after DOM paint
  requestAnimationFrame(updatePosition);
 }, [updatePosition]);

 useEffect(() => {
  return mergeRegister(
   editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
     $updateState();
     return false;
    },
    COMMAND_PRIORITY_LOW,
   ),
   editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => $updateState());
   }),
  );
 }, [editor, $updateState]);

 // Hide on scroll/resize
 useEffect(() => {
  if (!isVisible) return;
  const hide = () => setIsVisible(false);
  window.addEventListener("scroll", hide, { capture: true, passive: true });
  window.addEventListener("resize", hide);
  return () => {
   window.removeEventListener("scroll", hide, { capture: true });
   window.removeEventListener("resize", hide);
  };
 }, [isVisible]);

 const formatText = useCallback(
  (format: TextFormatType) => {
   editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  },
  [editor],
 );

 const toggleHighlight = useCallback(() => {
  editor.update(() => {
   const selection = $getSelection();
   if ($isRangeSelection(selection)) {
    $patchStyleText(selection, {
     "background-color": isHighlight ? null : "#fef08a",
    });
   }
  });
 }, [editor, isHighlight]);

 const clearFormatting = useCallback(() => {
  editor.update(() => {
   const selection = $getSelection();
   if (!$isRangeSelection(selection)) return;

   const nodes = selection.getNodes();
   for (const node of nodes) {
    if ($isTextNode(node)) {
     // Reset all formats
     const format = node.getFormat();
     if (format !== 0) node.setFormat(0);
     // Reset all styles
     const style = node.getStyle();
     if (style) node.setStyle("");
    }
   }
  });
 }, [editor]);

 if (!isVisible) return null;

 return createPortal(
  <div
   ref={toolbarRef}
   className="floating-toolbar"
   data-no-inspector
   style={{ top: pos.top, left: pos.left }}
   onMouseDown={pf}
  >
   <FTButton active={isBold} onClick={() => formatText("bold")} title="Bold">
    <Bold className="w-4 h-4" />
   </FTButton>
   <FTButton
    active={isItalic}
    onClick={() => formatText("italic")}
    title="Italic"
   >
    <Italic className="w-4 h-4" />
   </FTButton>
   <FTButton
    active={isUnderline}
    onClick={() => formatText("underline")}
    title="Underline"
   >
    <Underline className="w-4 h-4" />
   </FTButton>
   <FTButton
    active={isStrikethrough}
    onClick={() => formatText("strikethrough")}
    title="Strikethrough"
   >
    <Strikethrough className="w-4 h-4" />
   </FTButton>
   <FTButton
    active={isSubscript}
    onClick={() => formatText("subscript")}
    title="Subscript"
   >
    <Subscript className="w-4 h-4" />
   </FTButton>
   <FTButton
    active={isSuperscript}
    onClick={() => formatText("superscript")}
    title="Superscript"
   >
    <Superscript className="w-4 h-4" />
   </FTButton>
   <div className="floating-toolbar-divider" />
   <FTButton active={isHighlight} onClick={toggleHighlight} title="Highlight">
    <Highlighter className="w-4 h-4" />
   </FTButton>
   <FTButton
    active={isCode}
    onClick={() => formatText("code")}
    title="Inline Code"
   >
    <Code className="w-4 h-4" />
   </FTButton>
   <div className="floating-toolbar-divider" />
   <FTButton onClick={clearFormatting} title="Clear Formatting">
    <RemoveFormatting className="w-4 h-4" />
   </FTButton>
  </div>,
  document.body,
 );
}

function FTButton({
 active,
 onClick,
 title,
 children,
}: {
 active?: boolean;
 onClick: () => void;
 title: string;
 children: React.ReactNode;
}) {
 return (
  <button
   type="button"
   onMouseDown={pf}
   onClick={onClick}
   title={title}
   aria-label={title}
   className={`floating-toolbar-btn ${active ? "active" : ""}`}
  >
   {children}
  </button>
 );
}

export default function FloatingToolbarPlugin() {
 const [editor] = useLexicalComposerContext();
 const [mounted, setMounted] = useState(() => {
  // SSR-safe: only mount on client
  return typeof window !== "undefined";
 });

 if (!mounted) return null;

 return <FloatingToolbar editor={editor} />;
}
