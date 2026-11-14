"use client";

import { useEffect, useRef } from "react";
import {
 DEFAULT_VIETNAMESE_VOICE,
 prefetchMandarinAudio,
} from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import type { AmbientPipDictationSession } from "./useAmbientPipDictationSession";

/**
 * Window-level Enter / Escape / Ctrl+R shortcuts scoped to the card's own document, and input
 * focus when the word changes or editing resumes. Returns the card root ref.
 */
export function useAmbientPipDictationKeyboard({
 handleCheck,
 handleEditAgain,
 handleNext,
 isChecked,
 isCompleted,
 playCurrentAudio,
 currentIndex,
 inputRef,
}: AmbientPipDictationSession) {
 const rootRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const targetWindow = rootRef.current?.ownerDocument.defaultView;
  if (!targetWindow) return;

  const handleWindowKeyDown = (event: KeyboardEvent) => {
   if (event.isComposing || isCompleted) return;

   const root = rootRef.current;
   if (
    root &&
    event.target instanceof targetWindow.Node &&
    event.target !== root.ownerDocument.body &&
    !root.contains(event.target)
   ) {
    return;
   }

   if (
    event.target instanceof targetWindow.HTMLInputElement ||
    event.target instanceof targetWindow.HTMLTextAreaElement ||
    event.target instanceof targetWindow.HTMLButtonElement ||
    event.target instanceof targetWindow.HTMLSelectElement ||
    event.target instanceof targetWindow.HTMLAnchorElement ||
    (event.target instanceof targetWindow.HTMLElement && event.target.isContentEditable)
   ) {
    return;
   }

   if (event.key === "Enter") {
    event.preventDefault();
    if (isChecked) {
     handleNext();
    } else {
     handleCheck();
    }
    return;
   }

   if (event.key === "Escape" && isChecked) {
    event.preventDefault();
    handleEditAgain();
    return;
   }

   if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
    event.preventDefault();
    playCurrentAudio();
   }
  };

  targetWindow.addEventListener("keydown", handleWindowKeyDown);
  return () => targetWindow.removeEventListener("keydown", handleWindowKeyDown);
 }, [handleCheck, handleEditAgain, handleNext, isChecked, isCompleted, playCurrentAudio]);

 // Focus input when card changes or when editing again
 useEffect(() => {
  if (!isChecked && !isCompleted) {
   inputRef.current?.focus();
  }
 }, [currentIndex, isChecked, isCompleted, inputRef]);

 return rootRef;
}

/** Auto-speaks each new word, prefetches the next two, and stops speech on unmount. */
export function useAmbientPipDictationSpeech({
 isAutoSpeak,
 currentItem,
 isCompleted,
 dictationMode,
 speak,
 speechRate,
 currentIndex,
 activeItems,
 totalCount,
 cancelAutoNext,
 stop,
}: AmbientPipDictationSession) {
 // Speak audio on word load
 useEffect(() => {
  if (isAutoSpeak && currentItem && !isCompleted) {
   if (dictationMode === "vi-to-zh") {
    const viMeaning = getVocabDisplayMeaning(currentItem);
    if (viMeaning) {
     speak(viMeaning, { rate: speechRate, lang: "vi-VN", voice: DEFAULT_VIETNAMESE_VOICE });
    }
   } else if (currentItem.hanzi) {
    speak(currentItem.hanzi, { rate: speechRate, lang: "zh-CN" });
   }
  }
 }, [currentIndex, currentItem, dictationMode, isAutoSpeak, isCompleted, speak, speechRate]);

 // Background prefetch upcoming audio
 useEffect(() => {
  if (totalCount === 0 || isCompleted) return;
  const upcoming = activeItems.slice(currentIndex + 1, currentIndex + 3);
  if (dictationMode === "vi-to-zh") {
   const viTexts = upcoming.map((it) => getVocabDisplayMeaning(it)).filter(Boolean);
   prefetchMandarinAudio(viTexts, DEFAULT_VIETNAMESE_VOICE, speechRate);
  } else {
   const zhTexts = upcoming.map((it) => it?.hanzi).filter(Boolean);
   prefetchMandarinAudio(zhTexts, undefined, speechRate);
  }
 }, [currentIndex, activeItems, totalCount, isCompleted, speechRate, dictationMode]);

 useEffect(() => {
  return () => {
   cancelAutoNext();
   stop();
  };
 }, [cancelAutoNext, stop]);
}
