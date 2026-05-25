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

import { useEffect, useMemo, useRef } from "react";
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

/* ── Types ── */
interface EditorProps {
 initialContent?: Record<string, unknown> | null;
 onChange?: (json: Record<string, unknown>) => void;
 readOnly?: boolean;
 seamless?: boolean;
}

function Placeholder() {
 return <div className="editor-placeholder">Bắt đầu nhập nội dung...</div>;
}

/* ── Restore initial editor state from JSON ── */
function RestoreStatePlugin({
 initialState,
}: {
 initialState?: Record<string, unknown> | null;
}) {
 const [editor] = useLexicalComposerContext();
 const hasRestored = useRef(false);

 useEffect(() => {
  if (!initialState || hasRestored.current) return;
  try {
   const editorState = editor.parseEditorState(JSON.stringify(initialState));
   editor.setEditorState(editorState);
   hasRestored.current = true;
  } catch (err) {
   console.warn("[Editor] Could not restore state:", err);
  }
 }, [editor, initialState]);

 return null;
}

/* ── Read-only toggle ── */
function EditablePlugin({ readOnly }: { readOnly: boolean }) {
 const [editor] = useLexicalComposerContext();
 useEffect(() => {
  editor.setEditable(!readOnly);
 }, [editor, readOnly]);
 return null;
}

/* ── Main Editor ── */
export function Editor({
 initialContent,
 onChange,
 readOnly = false,
 seamless = false,
}: EditorProps) {
 const initialConfig = useMemo(
  () => ({
   namespace: "ChineseAppEditor",
   theme,
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
    console.error("[LexicalEditor]", error);
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
    {!readOnly && <ToolbarPlugin />}

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

     {/* State management */}
     <RestoreStatePlugin initialState={initialContent} />
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
