"use client";

import { useEffect } from "react";

import type { TranslationAnswerActions } from "./TranslationPracticePanels";
import type { ComponentProps } from "react";

type TranslationAnswerActionsProps = ComponentProps<typeof TranslationAnswerActions>;

export function useLessonTranslationShortcuts({
 activeIndex,
 checked,
 draft,
 score,
 segmentCount,
 onCheckAnswer,
 onEditAgain,
 onMove,
}: TranslationAnswerActionsProps) {
 useEffect(() => {
  const handleKeyDown = (event: globalThis.KeyboardEvent) => {
   const isModifier = event.ctrlKey || event.metaKey;
   if (isModifier && event.key === "Enter") {
    event.preventDefault();
    if (!checked) {
     if (draft.trim()) {
      onCheckAnswer();
     }
    } else if (score === 100 && activeIndex < segmentCount - 1) {
     onMove(activeIndex + 1);
    } else {
     onEditAgain();
    }
    return;
   }

   if (isModifier && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    if (event.key === "ArrowLeft" && activeIndex > 0) {
     onMove(activeIndex - 1);
    } else if (event.key === "ArrowRight" && activeIndex < segmentCount - 1) {
     onMove(activeIndex + 1);
    }
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [checked, draft, score, activeIndex, segmentCount, onCheckAnswer, onMove, onEditAgain]);
}
