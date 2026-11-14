"use client";

import { useEffect } from "react";

import type { useClientSession } from "@/components/providers/QueryProvider";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";

import type { useLearningLoopQueue } from "./useLearningLoopQueue";
import type { useLearningLoopRating } from "./useLearningLoopRating";

type LearningLoopRateItem = ReturnType<typeof useLearningLoopRating>["rateMutation"]["mutate"];

export function useLearningLoopKeyboardShortcuts({
 isPending,
 isQueryError,
 isResolved,
 isTtsLoading,
 item,
 rateItem,
 speakSequence,
 userId,
}: {
 isPending: boolean;
 isQueryError: boolean;
 isResolved: boolean;
 isTtsLoading: boolean;
 item: ReturnType<typeof useLearningLoopQueue>["item"];
 rateItem: LearningLoopRateItem;
 speakSequence: ReturnType<typeof useSharedMandarinTts>["speakSequence"];
 userId: ReturnType<typeof useClientSession>["userId"];
}) {
 useEffect(() => {
  if (item === null || !isResolved || !userId || isQueryError || isPending) return;

  const handleKeyDown = (event: KeyboardEvent) => {
   if (
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    (event.target instanceof HTMLElement &&
     event.target.closest(
      "a, button, input, textarea, select, [contenteditable='true'], [role='button'], [role='combobox'], [role='menuitem'], [role='option'], [role='tab']",
     ))
   )
    return;

   if (event.code === "Space" || event.key === " ") {
    if (isTtsLoading) return;
    event.preventDefault();
    speakSequence([item.prompt_zh]);
    return;
   }

   if (event.key === "1") {
    event.preventDefault();
    rateItem({ itemId: item.id, rating: "again", expectedRevision: item.revision });
   } else if (event.key === "2") {
    event.preventDefault();
    rateItem({ itemId: item.id, rating: "hard", expectedRevision: item.revision });
   } else if (event.key === "3") {
    event.preventDefault();
    rateItem({ itemId: item.id, rating: "good", expectedRevision: item.revision });
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isResolved, isTtsLoading, item, isQueryError, rateItem, isPending, speakSequence, userId]);
}
