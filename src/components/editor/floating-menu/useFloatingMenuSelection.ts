"use client";

import { useCallback, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { LexicalEditor } from "lexical";
import { $getSelection, $isRangeSelection } from "lexical";

import type { useFloatingMenuFormatting } from "./useFloatingMenuFormatting";

type SelectionAnchor = {
 getBoundingClientRect: () => DOMRect;
 contextElement?: Element;
};

export type DraftSelection = {
 text: string;
 contextSentence: string;
};

type FloatingMenuSelectionOptions = {
 editor: LexicalEditor;
 showNote: boolean;
 showLinkSearch: boolean;
 showInlineNote: boolean;
 resetPanels: () => void;
 setIsPinyinActive: Dispatch<SetStateAction<boolean>>;
 syncFormatsFromSelection: ReturnType<typeof useFloatingMenuFormatting>["syncFormatsFromSelection"];
};

/** Tracks the editor range selection: its draft text/context, popover anchor and visibility. */
export function useFloatingMenuSelection({
 editor,
 showNote,
 showLinkSearch,
 showInlineNote,
 resetPanels,
 setIsPinyinActive,
 syncFormatsFromSelection,
}: FloatingMenuSelectionOptions) {
 const [isViewportHidden, setIsViewportHidden] = useState(false);
 const [hasAnchor, setHasAnchor] = useState(false);
 const [draftSelection, setDraftSelection] = useState<DraftSelection>({
  text: "",
  contextSentence: "",
 });
 const selectionAnchorRef = useRef<SelectionAnchor>(null);
 const latestDraftRef = useRef<DraftSelection>({
  text: "",
  contextSentence: "",
 });

 const updateAnchorFromNativeSelection = useCallback(() => {
  const nativeSelection = window.getSelection();
  if (!nativeSelection || nativeSelection.isCollapsed || nativeSelection.rangeCount === 0) {
   selectionAnchorRef.current = null;
   setHasAnchor(false);
   return false;
  }

  const range = nativeSelection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const fallbackRect = Array.from(range.getClientRects()).find(
   (clientRect) => clientRect.width > 0 || clientRect.height > 0,
  );
  if (rect.width === 0 && rect.height === 0 && !fallbackRect) {
   selectionAnchorRef.current = null;
   setHasAnchor(false);
   return false;
  }

  selectionAnchorRef.current = {
   getBoundingClientRect: () => {
    const nextRect = range.getBoundingClientRect();
    if (nextRect.width > 0 || nextRect.height > 0) return nextRect;

    const nextFallbackRect = Array.from(range.getClientRects()).find(
     (clientRect) => clientRect.width > 0 || clientRect.height > 0,
    );
    return nextFallbackRect ?? nextRect;
   },
   contextElement: editor.getRootElement() ?? undefined,
  };
  setHasAnchor(true);
  return true;
 }, [editor]);

 const getAnchor = useCallback(() => selectionAnchorRef.current, []);

 const clearSelectionState = useCallback(() => {
  latestDraftRef.current = { text: "", contextSentence: "" };
  setDraftSelection({ text: "", contextSentence: "" });
  setIsViewportHidden(false);
  setHasAnchor(false);
  resetPanels();
  setIsPinyinActive(false);
  selectionAnchorRef.current = null;
 }, [resetPanels, setIsPinyinActive]);

 const updateSelectionState = useCallback(() => {
  const selection = $getSelection();
  const nativeSelection = window.getSelection();

  if (
   !$isRangeSelection(selection) ||
   selection.isCollapsed() ||
   !nativeSelection ||
   nativeSelection.isCollapsed
  ) {
   if ((showNote || showLinkSearch || showInlineNote) && latestDraftRef.current.text) return;
   clearSelectionState();
   return;
  }

  const nextText = nativeSelection.toString().trim() || selection.getTextContent().trim();
  if (!nextText) {
   clearSelectionState();
   return;
  }

  const anchorNode = selection.anchor.getNode();
  const blockText = anchorNode.getTopLevelElement()?.getTextContent().replace(/\s+/g, " ").trim();
  const nextDraft = {
   text: nextText,
   contextSentence: blockText && blockText.includes(nextText) ? blockText : nextText,
  };

  syncFormatsFromSelection(selection, anchorNode);

  if (!updateAnchorFromNativeSelection()) {
   clearSelectionState();
   return;
  }

  const hasChanged =
   latestDraftRef.current.text !== nextDraft.text ||
   latestDraftRef.current.contextSentence !== nextDraft.contextSentence;

  if (hasChanged) {
   latestDraftRef.current = nextDraft;
   setDraftSelection(nextDraft);
   setIsViewportHidden(false);
   resetPanels();
  }
 }, [
  clearSelectionState,
  resetPanels,
  showInlineNote,
  showLinkSearch,
  showNote,
  syncFormatsFromSelection,
  updateAnchorFromNativeSelection,
 ]);

 return {
  draftSelection,
  hasAnchor,
  isViewportHidden,
  setIsViewportHidden,
  getAnchor,
  updateSelectionState,
 };
}
