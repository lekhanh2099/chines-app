"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
 useReaderCommands,
 useReaderRegistry,
 useReaderSelector,
} from "@/features/reader/runtime/reader-context";
import { parseReaderSourceTarget } from "../model/reading-source-target";

// Source offsets, persisted marks and browser Text ranges all use UTF-16.
function textPointAt(root: HTMLElement, targetOffset: number) {
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
 let traversed = 0;
 let node = walker.nextNode();
 while (node) {
  if (node instanceof Text && !node.parentElement?.closest("rt, rp")) {
   if (targetOffset <= traversed + node.data.length) {
    return { node, offset: Math.max(0, targetOffset - traversed) };
   }
   traversed += node.data.length;
  }
  node = walker.nextNode();
 }
 return null;
}

export function useReadingSourceTarget(readerVisible: boolean) {
 const search = useSearchParams().toString();
 const target = useMemo(() => parseReaderSourceTarget(new URLSearchParams(search)), [search]);
 const commands = useReaderCommands();
 const registry = useReaderRegistry();
 const documentId = useReaderSelector((state) => state.content.id);
 const applied = useRef("");
 useEffect(() => {
  if (!readerVisible || !target || target.documentId !== documentId || !target.paragraphId) return;
  const key = [
   documentId,
   target.source,
   target.paragraphId,
   target.startOffset ?? "",
   target.endOffset ?? "",
  ].join(":");
  if (applied.current === key) return;
  const element = registry.get(target.paragraphId);
  if (!element) return;
  commands.selectSegment(target.paragraphId);
  if (target.startOffset === undefined || target.endOffset === undefined) {
   applied.current = key;
   return;
  }
  const { startOffset, endOffset } = target;
  const frame = requestAnimationFrame(() => {
   const source = element.querySelector<HTMLElement>("[data-reader-source]");
   if (!source) return;
   const start = textPointAt(source, startOffset);
   const end = textPointAt(source, endOffset);
   const selection = window.getSelection();
   if (!start || !end || !selection) return;
   const range = document.createRange();
   range.setStart(start.node, start.offset);
   range.setEnd(end.node, end.offset);
   selection.removeAllRanges();
   selection.addRange(range);
   applied.current = key;
  });
  return () => cancelAnimationFrame(frame);
 }, [commands, documentId, readerVisible, registry, target]);
}
