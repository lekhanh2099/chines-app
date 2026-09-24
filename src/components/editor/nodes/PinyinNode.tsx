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
 LexicalNode,
 NodeKey,
 SerializedLexicalNode,
 Spread,
} from "lexical";
import { DecoratorNode, $getNodeByKey } from "lexical";
import { useCallback, useContext, useEffect, useState, type JSX } from "react";
import { LexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { Button } from "@/components/ui/button";
import { getPolyphonicAlternatives } from "@/lib/pronunciation/pinyin-engine";

/* ── Serialized shape (stored in Supabase JSONB) ── */
export type SerializedPinyinNode = Spread<
 {
  chinese: string;
  pinyin: string;
  forceShow: boolean;
 },
 SerializedLexicalNode
>;

/* ── Lightweight 1-Click Polyphone Picker ── */
function PolyphonePicker({
 char,
 currentSyllable,
 alternatives,
 onSelect,
 onClose,
}: {
 char: string;
 currentSyllable: string;
 alternatives: readonly string[];
 onSelect: (selected: string) => void;
 onClose: () => void;
}) {
 useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
   if (event.key === "Escape") onClose();
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [onClose]);

 return (
  <span
   className="pinyin-polyphone-popover"
   role="dialog"
   aria-label={`Chọn phát âm cho chữ ${char}`}
   onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
   }}
   onClick={(e) => e.stopPropagation()}
  >
   <span className="pinyin-polyphone-header">
    Đổi âm <strong>{char}</strong>
   </span>
   <span className="pinyin-polyphone-options">
    {alternatives.map((alt) => {
     const isActive = alt === currentSyllable;
     return (
      <Button
       key={alt}
       type="button"
       variant={isActive ? "active" : "outline"}
       size="compact"
       onClick={() => onSelect(alt)}
      >
       {alt}
      </Button>
     );
    })}
   </span>
  </span>
 );
}

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
 const composerContext = useContext(LexicalComposerContext);
 const editor = composerContext ? composerContext[0] : null;
 const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);

 const chars = Array.from(chinese);
 const syllables = pinyin.split(" ");

 const handleSelectPronunciation = useCallback(
  (charIndex: number, newSyllable: string) => {
   if (!editor) return;
   editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if ($isPinyinNode(node)) {
     const nextSyllables = [...syllables];
     while (nextSyllables.length < chars.length) {
      nextSyllables.push("");
     }
     nextSyllables[charIndex] = newSyllable;
     node.setPinyin(nextSyllables.join(" "));
    }
   });
   setActiveCharIndex(null);
  },
  [chars.length, editor, nodeKey, syllables],
 );

 const handleClose = useCallback(() => {
  setActiveCharIndex(null);
 }, []);

 return (
  <span className={`pinyin-word${forceShow ? " force-pinyin" : ""}`} data-pinyin-key={nodeKey}>
   {chars.map((char, i) => {
    const alternatives = getPolyphonicAlternatives(char);
    const isPolyphonic = alternatives.length > 1;
    const isPickerOpen = activeCharIndex === i;
    const syllable = syllables[i] || "";

    return (
     <ruby
      key={i}
      className={`pinyin-ruby${isPolyphonic ? " is-polyphonic" : ""}`}
      onClick={(e) => {
       if (!isPolyphonic || !editor || !editor.isEditable()) return;
       e.stopPropagation();
       setActiveCharIndex(isPickerOpen ? null : i);
      }}
      title={
       isPolyphonic
        ? `Chữ đa âm "${char}": nhấn để chọn âm đọc khác (${alternatives.join(", ")})`
        : undefined
      }
     >
      {char}
      <rt className={`pinyin-rt${forceShow ? " force-visible" : ""}`}>{syllable}</rt>
      {isPickerOpen ? (
       <PolyphonePicker
        char={char}
        currentSyllable={syllable}
        alternatives={alternatives}
        onSelect={(selected) => handleSelectPronunciation(i, selected)}
        onClose={handleClose}
       />
      ) : null}
     </ruby>
    );
   })}
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
  return new PinyinNode(node.__chinese, node.__pinyin, node.__forceShow, node.__key);
 }

 constructor(chinese: string, pinyin: string, forceShow: boolean = false, key?: NodeKey) {
  super(key);
  this.__chinese = chinese;
  this.__pinyin = pinyin;
  this.__forceShow = forceShow;
 }

 /* ── Serialization ── */
 static importJSON(serialized: SerializedPinyinNode): PinyinNode {
  return $createPinyinNode(serialized.chinese, serialized.pinyin, serialized.forceShow ?? false);
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
 createDOM(): HTMLElement {
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
 setPinyin(pinyin: string): this {
  const writable = this.getWritable();
  writable.__pinyin = pinyin;
  return writable;
 }

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

export function $isPinyinNode(node: LexicalNode | null | undefined): node is PinyinNode {
 return node instanceof PinyinNode;
}
