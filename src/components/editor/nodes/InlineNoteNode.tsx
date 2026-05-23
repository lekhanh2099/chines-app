/**
 * InlineNoteNode — Custom Lexical DecoratorNode for inline annotations.
 *
 * Stores annotated text + a note. Renders as a highlighted span
 * with a tooltip that shows the note on hover.
 * Persisted in the document JSON → auto-saved to DB.
 */
import { useCallback, useRef, useState } from "react";
import type {
 DOMConversionMap,
 DOMConversionOutput,
 DOMExportOutput,
 LexicalNode,
 NodeKey,
 SerializedLexicalNode,
 Spread,
} from "lexical";
import { DecoratorNode, $applyNodeReplacement } from "lexical";
import type { JSX } from "react";

export type SerializedInlineNoteNode = Spread<
 {
  text: string;
  noteText: string;
 },
 SerializedLexicalNode
>;

/* ── React component ── */
function InlineNoteComponent({
 text,
 noteText,
}: {
 text: string;
 noteText: string;
 nodeKey: NodeKey;
}) {
 const [showTooltip, setShowTooltip] = useState(false);
 const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const spanRef = useRef<HTMLSpanElement | null>(null);

 const handleMouseEnter = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => setShowTooltip(true), 200);
 }, []);

 const handleMouseLeave = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => setShowTooltip(false), 150);
 }, []);

 return (
  <span
   ref={spanRef}
   className="relative inline cursor-default rounded-2xl -sm bg-sky-100 px-0.5 decoration-sky-300 decoration-wavy underline"
   data-inline-note="true"
   onMouseEnter={handleMouseEnter}
   onMouseLeave={handleMouseLeave}
  >
   {text}
   {showTooltip && (
    <span
     className="absolute bottom-full left-1/2 z-10000 mb-2 -translate-x-1/2 whitespace-pre-wrap rounded-2xl -lg border border-sky-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 shadow-lg"
     style={{ minWidth: 120, maxWidth: 280 }}
     onMouseEnter={handleMouseEnter}
     onMouseLeave={handleMouseLeave}
    >
     <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-sky-500">
      Ghi chú
     </span>
     {noteText}
     <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
    </span>
   )}
  </span>
 );
}

/* ── DOM → Lexical conversion ── */
function convertInlineNoteElement(
 domNode: HTMLElement,
): DOMConversionOutput | null {
 const text = domNode.textContent || "";
 const noteText = domNode.dataset.noteText || "";
 if (!text) return null;
 return { node: $createInlineNoteNode(text, noteText) };
}

/* ── The Node class ── */
export class InlineNoteNode extends DecoratorNode<JSX.Element> {
 __text: string;
 __noteText: string;

 static getType(): string {
  return "inline-note";
 }

 static clone(node: InlineNoteNode): InlineNoteNode {
  return new InlineNoteNode(node.__text, node.__noteText, node.__key);
 }

 constructor(text: string, noteText: string, key?: NodeKey) {
  super(key);
  this.__text = text;
  this.__noteText = noteText;
 }

 getText(): string {
  return this.__text;
 }

 getNoteText(): string {
  return this.__noteText;
 }

 createDOM(): HTMLElement {
  const span = document.createElement("span");
  span.style.display = "inline";
  return span;
 }

 updateDOM(): boolean {
  return false;
 }

 exportDOM(): DOMExportOutput {
  const el = document.createElement("span");
  el.dataset.inlineNote = "true";
  el.dataset.noteText = this.__noteText;
  el.className =
   "bg-sky-100 px-0.5 rounded-2xl -sm underline decoration-wavy decoration-sky-300";
  el.textContent = this.__text;
  return { element: el };
 }

 static importDOM(): DOMConversionMap | null {
  return {
   span: (domNode: HTMLElement) => {
    if (domNode.dataset.inlineNote === "true") {
     return {
      conversion: convertInlineNoteElement,
      priority: 1,
     };
    }
    return null;
   },
  };
 }

 static importJSON(json: SerializedInlineNoteNode): InlineNoteNode {
  return $createInlineNoteNode(json.text, json.noteText);
 }

 exportJSON(): SerializedInlineNoteNode {
  return {
   ...super.exportJSON(),
   type: "inline-note",
   text: this.__text,
   noteText: this.__noteText,
  };
 }

 getTextContent(): string {
  return this.__text;
 }

 isInline(): boolean {
  return true;
 }

 decorate(): JSX.Element {
  return (
   <InlineNoteComponent
    text={this.__text}
    noteText={this.__noteText}
    nodeKey={this.__key}
   />
  );
 }
}

export function $createInlineNoteNode(
 text: string,
 noteText: string,
): InlineNoteNode {
 return $applyNodeReplacement(new InlineNoteNode(text, noteText));
}

export function $isInlineNoteNode(
 node: LexicalNode | null | undefined,
): node is InlineNoteNode {
 return node instanceof InlineNoteNode;
}
