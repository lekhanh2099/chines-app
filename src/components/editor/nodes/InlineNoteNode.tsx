/**
 * InlineNoteNode — Custom Lexical DecoratorNode for inline annotations.
 *
 * Stores annotated text + a note. Renders as a highlighted span
 * with a tooltip that shows the note on hover.
 * Persisted in the document JSON → auto-saved to DB.
 */
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import type { JSX, ReactNode } from "react";

export type SerializedInlineNoteNode = Spread<
 {
  text: string;
  noteText: string;
 },
 SerializedLexicalNode
>;

const urlPattern = /https?:\/\/[^\s<>"'）)\]}]+/gi;

function renderLinkifiedText(value: string): ReactNode[] {
 const parts: ReactNode[] = [];
 let lastIndex = 0;
 let index = 0;

 for (const match of value.matchAll(urlPattern)) {
  const rawUrl = match[0];
  const start = match.index ?? 0;

  if (start > lastIndex) {
   parts.push(value.slice(lastIndex, start));
  }

  let url = rawUrl;
  let trailing = "";

  while (/[.,!?;:，。！？；：]+$/.test(url)) {
   trailing = url.slice(-1) + trailing;
   url = url.slice(0, -1);
  }

  parts.push(
   <a
    key={`inline-note-url-${index}`}
    href={url}
    target="_blank"
    rel="noreferrer"
    className="break-all font-bold text-sky-600 underline underline-offset-2 hover:text-sky-700"
    onClick={(event) => event.stopPropagation()}
   >
    {url}
   </a>,
  );

  if (trailing) {
   parts.push(trailing);
  }

  lastIndex = start + rawUrl.length;
  index += 1;
 }

 if (lastIndex < value.length) {
  parts.push(value.slice(lastIndex));
 }

 return parts;
}

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
 const [tooltipPosition, setTooltipPosition] = useState<{
  top: number;
  left: number;
  placement: "top" | "bottom";
 } | null>(null);
 const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const spanRef = useRef<HTMLSpanElement | null>(null);

 const handleMouseEnter = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => setShowTooltip(true), 200);
 }, []);

 const updateTooltipPosition = useCallback(() => {
  const rect = spanRef.current?.getBoundingClientRect();

  if (!rect) return;

  const hasEnoughTopSpace = rect.top > 140;
  const placement = hasEnoughTopSpace ? "top" : "bottom";

  setTooltipPosition({
   left: rect.left + rect.width / 2,
   top: placement === "top" ? rect.top - 10 : rect.bottom + 10,
   placement,
  });
 }, []);

 const handleMouseLeave = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => setShowTooltip(false), 150);
 }, []);

 useLayoutEffect(() => {
  if (!showTooltip) return;

  updateTooltipPosition();

  window.addEventListener("scroll", updateTooltipPosition, true);
  window.addEventListener("resize", updateTooltipPosition);

  return () => {
   window.removeEventListener("scroll", updateTooltipPosition, true);
   window.removeEventListener("resize", updateTooltipPosition);
  };
 }, [showTooltip, updateTooltipPosition]);

 return (
  <span
   ref={spanRef}
   className="relative inline cursor-default rounded-2xl -sm bg-sky-100 px-0.5 decoration-sky-300 decoration-wavy underline"
   data-inline-note="true"
   onMouseEnter={handleMouseEnter}
   onMouseLeave={handleMouseLeave}
  >
   {text}
   {showTooltip &&
    tooltipPosition &&
    typeof document !== "undefined" &&
    createPortal(
     <span
      className="fixed z-[100000] whitespace-pre-wrap rounded-xl border border-border-default bg-bg-elevated px-3 py-2 text-xs leading-relaxed text-text-secondary shadow-theme-lg"
      style={{
       left: tooltipPosition.left,
       top: tooltipPosition.top,
       minWidth: 120,
       maxWidth: 280,
       transform:
        tooltipPosition.placement === "top"
         ? "translate(-50%, -100%)"
         : "translate(-50%, 0)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
     >
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-sky-500">
       Ghi chú
      </span>
      {renderLinkifiedText(noteText)}
      <span
       className={[
        "absolute left-1/2 -translate-x-1/2 border-4 border-transparent",
        tooltipPosition.placement === "top"
         ? "top-full border-t-bg-elevated"
         : "bottom-full border-b-bg-elevated",
       ].join(" ")}
      />
     </span>,
     document.body,
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
