"use client";

import { isPinyinSelectionActive } from "@/features/reader/runtime/pinyin-selection";
import { useCallback, useEffect, useState } from "react";

import { containsChinese } from "@/lib/text/chinese-utils";

import { createAnnotationAnchor } from "./annotation-anchor";
import type { Nullable } from "./annotation-note-dialog-model";
import {
 getSelectionOffsets,
 getSelectionRect,
 selectionTarget,
 type SelectionDraft,
} from "./annotation-selection-utils";

export function useLessonAnnotationSelection(lessonId: string) {
 const [selectionDraft, setSelectionDraft] = useState<Nullable<SelectionDraft>>(null);
 const selectionAnchor = useCallback(
  () =>
   selectionDraft
    ? {
       getBoundingClientRect: () => selectionDraft.rect,
       contextElement: document.body,
      }
    : null,
  [selectionDraft],
 );
 const closeSelectionMenu = useCallback(() => setSelectionDraft(null), []);

 useEffect(() => {
  const selectionTimer = { current: 0 };
  const captureSelection = (delay = 120) => {
   window.clearTimeout(selectionTimer.current);
   selectionTimer.current = window.setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;
    if (isPinyinSelectionActive()) return;

    const range = selection.getRangeAt(0);
    const target = selectionTarget(range);
    if (!target || target.dataset.lessonId !== lessonId) return;
    if (target.getAttribute("aria-hidden") === "true") return;

    const offsets = getSelectionOffsets(target, range);
    if (!offsets) return;
    const { sourceText, startOffset, endOffset } = offsets;
    if (!containsChinese(sourceText.slice(startOffset, endOffset))) return;

    const anchor = createAnnotationAnchor({
     lessonId,
     nodeType: target.dataset.nodeType || "text",
     nodeId: target.dataset.nodeId || "",
     text: sourceText,
     startOffset,
     endOffset,
    });
    const rect = getSelectionRect(range);
    if (!anchor || !anchor.nodeId || !rect) return;

    setSelectionDraft({ anchor, rect, sourceText });
   }, delay);
  };

  const handleSelectionChange = () => captureSelection();
  const captureSettledSelection = (event: Event) => {
   const target = event.target;
   if (
    target instanceof Element &&
    target.closest("[data-no-inspector]") &&
    !target.closest("[data-study-annotation-node]")
   )
    return;
   captureSelection(0);
  };

  document.addEventListener("selectionchange", handleSelectionChange);
  document.addEventListener("pointerup", captureSettledSelection);
  document.addEventListener("keyup", captureSettledSelection);
  return () => {
   window.clearTimeout(selectionTimer.current);
   document.removeEventListener("selectionchange", handleSelectionChange);
   document.removeEventListener("pointerup", captureSettledSelection);
   document.removeEventListener("keyup", captureSettledSelection);
  };
 }, [lessonId]);

 return { selectionDraft, selectionAnchor, closeSelectionMenu };
}
