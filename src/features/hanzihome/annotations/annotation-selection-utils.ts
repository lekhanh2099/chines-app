import type { AnnotationAnchor } from "./types";

export type SelectionDraft = {
 anchor: AnnotationAnchor;
 rect: ReturnType<Range["getBoundingClientRect"]>;
 sourceText: string;
};

export function getSelectionOffsets(container: HTMLElement, range: Range) {
 if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
  return null;
 }

 const beforeStart = document.createRange();
 beforeStart.selectNodeContents(container);
 beforeStart.setEnd(range.startContainer, range.startOffset);
 const beforeEnd = document.createRange();
 beforeEnd.selectNodeContents(container);
 beforeEnd.setEnd(range.endContainer, range.endOffset);
 const sourceRange = document.createRange();
 sourceRange.selectNodeContents(container);
 const [precedingStart, precedingEnd, sourceText] = [beforeStart, beforeEnd, sourceRange].map(
  (part) => {
   const fragment = part.cloneContents();
   fragment.querySelectorAll("rt, rp").forEach((rubyText) => rubyText.remove());
   return fragment.textContent ?? "";
  },
 );

 return {
  startOffset: precedingStart.length,
  endOffset: precedingEnd.length,
  sourceText,
 };
}

function closestAnnotationTarget(node: Node) {
 const element = node instanceof Element ? node : node.parentElement;
 return element?.closest<HTMLElement>("[data-study-annotation-node]") || null;
}

export function selectionTarget(range: Range) {
 const startTarget = closestAnnotationTarget(range.startContainer);
 const endTarget = closestAnnotationTarget(range.endContainer);
 return startTarget && startTarget === endTarget ? startTarget : null;
}

export function getSelectionRect(range: Range) {
 const rects = Array.from(range.getClientRects()).filter((rect) => rect.width || rect.height);
 return (
  rects.at(-1) || (range.getBoundingClientRect().width ? range.getBoundingClientRect() : null)
 );
}
