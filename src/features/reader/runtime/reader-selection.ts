import type { ReaderSegment } from "../model/reader-document.types";

export type ReaderSelection = {
 segmentId: ReaderSegment["id"];
 text: string;
 start: number;
 end: number;
 rect: DOMRect;
};

// Keep selection anchored to source text, never the ruby pronunciation layer.
export function captureReaderSelection(element: HTMLElement, segment: ReaderSegment) {
 const selection = element.ownerDocument.defaultView?.getSelection();
 if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
 const range = selection.getRangeAt(0);
 const source = element.querySelector<HTMLElement>("[data-reader-source]");
 if (!source || !source.contains(range.commonAncestorContainer)) return;
 if (source.hidden || source.getAttribute("aria-hidden") === "true") return;
 const beforeStart = element.ownerDocument.createRange();
 beforeStart.selectNodeContents(source);
 beforeStart.setEnd(range.startContainer, range.startOffset);
 const beforeEnd = element.ownerDocument.createRange();
 beforeEnd.selectNodeContents(source);
 beforeEnd.setEnd(range.endContainer, range.endOffset);
 const parts = [range, beforeStart, beforeEnd].map((part) => {
  const fragment = part.cloneContents();
  fragment
   .querySelectorAll('rt, rp, [data-reader-pinyin], [lang="zh-Latn-pinyin"]')
   .forEach((node) => node.remove());
  return fragment.textContent ?? "";
 });
 const selected = parts[0] ?? "";
 const text = selected.trim();
 if (!text) return;
 const start = (parts[1]?.length ?? 0) + selected.length - selected.trimStart().length;
 const end = (parts[2]?.length ?? 0) - selected.length + selected.trimEnd().length;
 if (segment.zh.slice(start, end) !== text) return;
 return {
  segmentId: segment.id,
  text,
  start,
  end,
  rect: range.getBoundingClientRect(),
 } satisfies ReaderSelection;
}
