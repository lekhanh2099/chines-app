/**
 * Lexical Editor — Playground-style editor with top toolbar.
 *
 * Features:
 *  - Rich text editing (headings, lists, quotes, code, checklists)
 *  - Playground-style toolbar (undo/redo, blocks, font, formatting, colors, alignment)
 *  - Draggable block reordering (+ button and grip handle)
 *  - PinyinNode for inline <ruby>/<rt> rendering
 *  - Auto-save via onChange callback
 */
"use client";

import { JsonObjectSchema, type JsonObject } from "@/types/json";
import { z } from "zod";
import { useEffect, useMemo } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { DEFAULT_TRANSFORMERS } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { $convertFromMarkdownString } from "@lexical/markdown";
import {
 $createParagraphNode,
 $getSelection,
 $isRangeSelection,
 $isTextNode,
 $setSelection,
 buildImportMap,
 COMMAND_PRIORITY_HIGH,
 PASTE_COMMAND,
 TextNode,
} from "lexical";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { logger } from "@/lib/logger";

import { PinyinNode } from "./nodes/PinyinNode";
import { InternalLinkNode } from "./nodes/InternalLinkNode";
import { InlineNoteNode } from "./nodes/InlineNoteNode";
import theme from "./theme";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import FloatingToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import AutoSavePlugin from "./plugins/AutoSavePlugin";
import TableActionPlugin from "./plugins/TableActionPlugin";
import NodeHoverPlugin from "./plugins/NodeHoverPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";

const URL_MATCHER = /https?:\/\/[^\s<>"'）)\]}]+/i;

const AUTO_LINK_MATCHERS = [
 (text: string) => {
  const match = URL_MATCHER.exec(text);

  if (match === null) return null;

  const url = match[0];

  return {
   index: match.index,
   length: url.length,
   text: url,
   url,
  };
 },
];

const SAFE_HTML_IMPORT = buildImportMap({
 span: (node) => {
  const defaultImporter = TextNode.importDOM()?.span?.(node);
  if (!defaultImporter) return null;

  return {
   conversion: (element) => {
    const output = defaultImporter.conversion(element);
    if (!output) return null;

    let safeStyle = "";
    if (element.style.color) safeStyle += `color: ${element.style.color};`;
    if (element.style.backgroundColor) {
     safeStyle += `background-color: ${element.style.backgroundColor};`;
    }
    if (element.style.fontFamily) safeStyle += `font-family: ${element.style.fontFamily};`;
    if (element.style.fontSize) safeStyle += `font-size: ${element.style.fontSize};`;
    if (!safeStyle) return output;

    const formatChild = output.forChild;
    return {
     ...output,
     forChild: (lexicalNode, parentLexicalNode) => {
      const formattedNode = formatChild ? formatChild(lexicalNode, parentLexicalNode) : lexicalNode;
      if ($isTextNode(formattedNode)) formattedNode.setStyle(safeStyle);
      return formattedNode;
     },
    };
   },
   priority: 1,
  };
 },
});

/* ── Types ── */
const InitialEditorContentSchema = JsonObjectSchema.nullable();

interface EditorProps {
 initialContent?: z.infer<typeof InitialEditorContentSchema>;
 onChange?: (json: JsonObject) => void;
 readOnly?: boolean;
 toolbarVisible?: boolean;
 seamless?: boolean;
}

function Placeholder() {
 return <div className="editor-placeholder">Bắt đầu nhập nội dung...</div>;
}

/* ── Read-only toggle ── */
function EditablePlugin({ readOnly }: { readOnly: boolean }) {
 const [editor] = useLexicalComposerContext();
 useEffect(() => {
  editor.setEditable(!readOnly);
 }, [editor, readOnly]);
 return null;
}

/* ── Prefer rich HTML, then convert plain clipboard Markdown ── */
function RichPastePlugin() {
 const [editor] = useLexicalComposerContext();

 useEffect(
  () =>
   editor.registerCommand(
    PASTE_COMMAND,
    (event) => {
     if (!(event instanceof ClipboardEvent) || !event.clipboardData) return false;
     if (event.clipboardData.getData("text/html").trim()) return false;

     const markdown = event.clipboardData.getData("text/plain");
     const selection = $getSelection();
     if (!markdown || !$isRangeSelection(selection)) return false;

     const insertionSelection = selection.clone();
     const markdownContainer = $createParagraphNode();
     $convertFromMarkdownString(markdown, DEFAULT_TRANSFORMERS, markdownContainer);
     const nodes = markdownContainer.getChildren();
     if (nodes.length === 0) return false;

     event.preventDefault();
     $setSelection(insertionSelection);
     insertionSelection.insertNodes(nodes);
     return true;
    },
    COMMAND_PRIORITY_HIGH,
   ),
  [editor],
 );

 return null;
}

/* ── Main Editor ── */
export function Editor({
 initialContent,
 onChange,
 readOnly = false,
 toolbarVisible = true,
 seamless = false,
}: EditorProps) {
 const initialConfig = useMemo<InitialConfigType>(
  () => ({
   namespace: "ChineseAppEditor",
   theme,
   html: {
    import: SAFE_HTML_IMPORT,
   },
   editorState: initialContent ? JSON.stringify(initialContent) : undefined,
   nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    LinkNode,
    AutoLinkNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    HorizontalRuleNode,
    PinyinNode,
    InternalLinkNode,
    InlineNoteNode,
   ],
   editable: !readOnly,
   onError: (error: Error) => {
    logger.error("[LexicalEditor]", error);
   },
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [],
 );

 return (
  <LexicalComposer initialConfig={initialConfig}>
   <div
    className="editor-shell"
    data-editor-wrapper
    data-no-inspector
    {...(seamless ? { "data-seamless": "" } : {})}
   >
    {/* Toolbar */}
    {!readOnly && toolbarVisible ? <ToolbarPlugin /> : null}

    {/* Editor body */}
    <div className="editor-container">
     <RichTextPlugin
      contentEditable={
       <ContentEditable
        className="editor-input"
        aria-placeholder="Bắt đầu nhập..."
        placeholder={<Placeholder />}
       />
      }
      placeholder={null}
      ErrorBoundary={LexicalErrorBoundary}
     />

     {/* Core plugins */}
     <HistoryPlugin />
     <ListPlugin />
     <CheckListPlugin />
     <TabIndentationPlugin />
     <HorizontalRulePlugin />
     <LinkPlugin />
     <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
     <RichPastePlugin />

     {/* State management */}
     <EditablePlugin readOnly={readOnly} />
     <AutoSavePlugin onChange={onChange} />

     {/* Interactive plugins */}
     {!readOnly && (
      <>
       <FloatingToolbarPlugin />
       <DraggableBlockPlugin />
       <TableActionPlugin />
       <NodeHoverPlugin />
      </>
     )}
    </div>
   </div>
  </LexicalComposer>
 );
}
