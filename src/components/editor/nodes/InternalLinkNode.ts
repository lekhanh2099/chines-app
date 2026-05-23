/**
 * InternalLinkNode — Lexical node for links between notes.
 *
 * Renders as <a> with data-internal-link attribute.
 * Stores noteId and noteTitle for navigation.
 */

import {
 $applyNodeReplacement,
 type DOMConversionMap,
 type DOMConversionOutput,
 type DOMExportOutput,
 type EditorConfig,
 type LexicalNode,
 type NodeKey,
 type RangeSelection,
 type SerializedTextNode,
 type Spread,
 TextNode,
} from "lexical";

export type SerializedInternalLinkNode = Spread<
 {
  noteId: string;
  noteTitle: string;
 },
 SerializedTextNode
>;

export class InternalLinkNode extends TextNode {
 __noteId: string;
 __noteTitle: string;

 static getType(): string {
  return "internal-link";
 }

 static clone(node: InternalLinkNode): InternalLinkNode {
  return new InternalLinkNode(
   node.__noteId,
   node.__noteTitle,
   node.__text,
   node.__key,
  );
 }

 constructor(noteId: string, noteTitle: string, text: string, key?: NodeKey) {
  super(text, key);
  this.__noteId = noteId;
  this.__noteTitle = noteTitle;
 }

 getNoteId(): string {
  return this.__noteId;
 }

 getNoteTitle(): string {
  return this.__noteTitle;
 }

 createDOM(config: EditorConfig): HTMLElement {
  const dom = super.createDOM(config);
  const a = document.createElement("a");
  a.href = `/notes/${this.__noteId}`;
  a.dataset.internalLink = "true";
  a.dataset.noteId = this.__noteId;
  a.title = this.__noteTitle;
  a.className =
   "  underline decoration-accent/40 hover:decoration-accent cursor-pointer font-medium";
  a.textContent = dom.textContent;

  // Navigate via custom event — picked up by NoteTabContainer
  a.addEventListener("click", (e) => {
   e.preventDefault();
   const event = new CustomEvent("open-note-tab", {
    detail: { noteId: this.__noteId, noteTitle: this.__noteTitle },
   });
   window.dispatchEvent(event);
  });

  return a;
 }

 updateDOM(): boolean {
  // Always recreate
  return true;
 }

 exportDOM(): DOMExportOutput {
  const element = document.createElement("a");
  element.href = `/notes/${this.__noteId}`;
  element.dataset.internalLink = "true";
  element.dataset.noteId = this.__noteId;
  element.title = this.__noteTitle;
  element.textContent = this.__text;
  return { element };
 }

 static importDOM(): DOMConversionMap | null {
  return {
   a: (domNode: HTMLElement) => {
    if (domNode.dataset.internalLink === "true") {
     return {
      conversion: convertInternalLinkElement,
      priority: 1,
     };
    }
    return null;
   },
  };
 }

 static importJSON(
  serializedNode: SerializedInternalLinkNode,
 ): InternalLinkNode {
  return $createInternalLinkNode(
   serializedNode.noteId,
   serializedNode.noteTitle,
   serializedNode.text,
  );
 }

 exportJSON(): SerializedInternalLinkNode {
  return {
   ...super.exportJSON(),
   type: "internal-link",
   noteId: this.__noteId,
   noteTitle: this.__noteTitle,
  };
 }

 canInsertTextBefore(): boolean {
  return false;
 }

 canInsertTextAfter(): boolean {
  return false;
 }

 isTextEntity(): boolean {
  return true;
 }

 insertNewAfter(
  _selection: RangeSelection,
  restoreSelection?: boolean,
 ): null | TextNode {
  const textNode = $createTextNode(this.getTextContent());
  this.insertAfter(textNode, restoreSelection);
  return textNode;
 }
}

function convertInternalLinkElement(
 domNode: HTMLElement,
): DOMConversionOutput | null {
 const noteId = domNode.dataset.noteId;
 if (!noteId) return null;

 const text = domNode.textContent || "";
 const title = domNode.title || text;

 return {
  node: $createInternalLinkNode(noteId, title, text),
 };
}

function $createTextNode(text: string): TextNode {
 return new TextNode(text);
}

export function $createInternalLinkNode(
 noteId: string,
 noteTitle: string,
 text: string,
): InternalLinkNode {
 return $applyNodeReplacement(new InternalLinkNode(noteId, noteTitle, text));
}

export function $isInternalLinkNode(
 node: LexicalNode | null | undefined,
): node is InternalLinkNode {
 return node instanceof InternalLinkNode;
}
