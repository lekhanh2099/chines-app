/**
 * PinyinNode — Custom Lexical DecoratorNode for <ruby> rendering.
 *
 * SMART PINYIN SYSTEM:
 *  - Global toggle: CSS class `.global-pinyin-hidden` on editor root hides all <rt>
 *  - Local override: `forceShow = true` adds `.force-pinyin` class → overrides global hide
 *  - Zero re-renders: visibility controlled entirely via CSS, not React state
 *
 * Serialized as JSON for Supabase storage. Fully round-trips through
 * editor.getEditorState().toJSON() → editor.setEditorState().
 */
import type {
 DOMConversionMap,
 DOMConversionOutput,
 DOMExportOutput,
 EditorConfig,
 LexicalNode,
 NodeKey,
 SerializedLexicalNode,
 Spread,
} from "lexical";
import { DecoratorNode, $getNodeByKey } from "lexical";
import { JSX } from "react";

/* ── Serialized shape (stored in Supabase JSONB) ── */
export type SerializedPinyinNode = Spread<
 {
  chinese: string;
  pinyin: string;
  forceShow: boolean;
 },
 SerializedLexicalNode
>;

/* ── React component for rendering ── */
function PinyinComponent({
 chinese,
 pinyin,
 forceShow,
 nodeKey,
}: {
 chinese: string;
 pinyin: string;
 forceShow: boolean;
 nodeKey: NodeKey;
}) {
 const chars = chinese.split("");
 const syllables = pinyin.split(" ");

 return (
  <span
   className={`pinyin-word${forceShow ? " force-pinyin" : ""}`}
   data-pinyin-key={nodeKey}
  >
   {chars.map((char, i) => (
    <ruby key={i} className="pinyin-ruby">
     {char}
     <rt className={`pinyin-rt${forceShow ? " force-visible" : ""}`}>
      {syllables[i] || ""}
     </rt>
    </ruby>
   ))}
  </span>
 );
}

/* ── DOM → Lexical conversion (paste support) ── */
function convertRubyElement(domNode: HTMLElement): DOMConversionOutput | null {
 const chars = Array.from(domNode.childNodes)
  .filter((n) => n.nodeType === 3)
  .map((n) => n.textContent)
  .join("")
  .trim();

 const rt = domNode.querySelector("rt");
 const pinyinText = rt?.textContent?.trim() || "";
 const forceShow = domNode.classList.contains("force-pinyin");

 if (!chars) return null;

 return {
  node: $createPinyinNode(chars, pinyinText, forceShow),
 };
}

/* ── The Node class ── */
export class PinyinNode extends DecoratorNode<JSX.Element> {
 __chinese: string;
 __pinyin: string;
 __forceShow: boolean;

 static getType(): string {
  return "pinyin";
 }

 static clone(node: PinyinNode): PinyinNode {
  return new PinyinNode(
   node.__chinese,
   node.__pinyin,
   node.__forceShow,
   node.__key,
  );
 }

 constructor(
  chinese: string,
  pinyin: string,
  forceShow: boolean = false,
  key?: NodeKey,
 ) {
  super(key);
  this.__chinese = chinese;
  this.__pinyin = pinyin;
  this.__forceShow = forceShow;
 }

 /* ── Serialization ── */
 static importJSON(serialized: SerializedPinyinNode): PinyinNode {
  return $createPinyinNode(
   serialized.chinese,
   serialized.pinyin,
   serialized.forceShow ?? false,
  );
 }

 exportJSON(): SerializedPinyinNode {
  return {
   type: "pinyin",
   version: 1,
   chinese: this.__chinese,
   pinyin: this.__pinyin,
   forceShow: this.__forceShow,
  };
 }

 /* ── DOM import (paste) ── */
 static importDOM(): DOMConversionMap | null {
  return {
   ruby: () => ({
    conversion: convertRubyElement,
    priority: 1,
   }),
  };
 }

 /* ── DOM export (copy) ── */
 exportDOM(): DOMExportOutput {
  const wrapper = document.createElement("span");
  wrapper.className = `pinyin-word${this.__forceShow ? " force-pinyin" : ""}`;
  const chars = this.__chinese.split("");
  const syllables = this.__pinyin.split(" ");

  chars.forEach((char, i) => {
   const ruby = document.createElement("ruby");
   ruby.className = "pinyin-ruby";
   ruby.appendChild(document.createTextNode(char));
   const rt = document.createElement("rt");
   rt.className = `pinyin-rt${this.__forceShow ? " force-visible" : ""}`;
   rt.textContent = syllables[i] || "";
   ruby.appendChild(rt);
   wrapper.appendChild(ruby);
  });

  return { element: wrapper };
 }

 /* ── DOM creation for Lexical internal rendering ── */
 createDOM(_config: EditorConfig): HTMLElement {
  const span = document.createElement("span");
  span.style.display = "inline";
  return span;
 }

 updateDOM(): boolean {
  return false;
 }

 /* ── Getters ── */
 getChinese(): string {
  return this.__chinese;
 }

 getPinyin(): string {
  return this.__pinyin;
 }

 getForceShow(): boolean {
  return this.__forceShow;
 }

 /* ── Setters (writable clone pattern) ── */
 setForceShow(forceShow: boolean): this {
  const writable = this.getWritable();
  writable.__forceShow = forceShow;
  return writable;
 }

 /* ── Text content for search/copy ── */
 getTextContent(): string {
  return this.__chinese;
 }

 isInline(): boolean {
  return true;
 }

 /* ── React render ── */
 decorate(): JSX.Element {
  return (
   <PinyinComponent
    chinese={this.__chinese}
    pinyin={this.__pinyin}
    forceShow={this.__forceShow}
    nodeKey={this.__key}
   />
  );
 }
}

/* ── Helper constructors ── */
export function $createPinyinNode(
 chinese: string,
 pinyin: string,
 forceShow: boolean = false,
): PinyinNode {
 return new PinyinNode(chinese, pinyin, forceShow);
}

export function $isPinyinNode(
 node: LexicalNode | null | undefined,
): node is PinyinNode {
 return node instanceof PinyinNode;
}

/** Toggle forceShow on a PinyinNode by key */
export function $togglePinyinForceShow(nodeKey: NodeKey): void {
 const node = $getNodeByKey(nodeKey);
 if ($isPinyinNode(node)) {
  node.setForceShow(!node.getForceShow());
 }
}
