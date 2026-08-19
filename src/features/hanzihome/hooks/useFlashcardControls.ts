"use client";

import { useEffect, useRef } from "react";

import type { ReviewResult } from "@/features/hanzihome/types";
import { z } from "zod";

type UseFlashcardControlsInput = {
 disabled?: boolean;
 canOpenDetail?: boolean;
 writingCharacterCount?: number;
 onReveal: () => void;
 onAnswer: (result: ReviewResult) => void;
 onPrevious?: () => void;
 onNext?: () => void;
 onOpenDetail?: () => void;
 onSelectWritingCharacter?: (index: number) => void;
};

type SwipeHandlers = {
 onTouchStart: React.TouchEventHandler<HTMLElement>;
 onTouchEnd: React.TouchEventHandler<HTMLElement>;
};

const SWIPE_DISTANCE = 56;
type TouchPoint = z.infer<z.ZodObject<{ x: z.ZodNumber; y: z.ZodNumber }>>;

function shouldIgnoreKeyboardTarget(target: KeyboardEvent["target"]) {
 return (
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable)
 );
}

export function useFlashcardControls({
 disabled,
 canOpenDetail,
 writingCharacterCount = 0,
 onReveal,
 onAnswer,
 onPrevious,
 onNext,
 onOpenDetail,
 onSelectWritingCharacter,
}: UseFlashcardControlsInput): SwipeHandlers {
 const touchStartRef = useRef<TouchPoint>(null);

 useEffect(() => {
  if (disabled) return;

  const handleKeyDown = (event: KeyboardEvent) => {
   if (shouldIgnoreKeyboardTarget(event.target)) return;

   if (event.code === "Space" || event.key === "Enter") {
    event.preventDefault();
    onReveal();
    return;
   }

   if (event.key.toLowerCase() === "d" && canOpenDetail && onOpenDetail) {
    event.preventDefault();
    onOpenDetail();
    return;
   }

   if (event.key.toLowerCase() === "p" && onPrevious) {
    event.preventDefault();
    onPrevious();
    return;
   }

   if (event.key.toLowerCase() === "n" && onNext) {
    event.preventDefault();
    onNext();
    return;
   }

   const numericIndex = Number(event.key) - 1;

   if (
    Number.isInteger(numericIndex) &&
    numericIndex >= 0 &&
    numericIndex < writingCharacterCount &&
    onSelectWritingCharacter
   ) {
    event.preventDefault();
    onSelectWritingCharacter(numericIndex);
    return;
   }

   if (event.key === "ArrowLeft") {
    event.preventDefault();
    onPrevious?.();
    return;
   }

   if (event.key === "ArrowDown") {
    event.preventDefault();
    onAnswer("hard");
    return;
   }

   if (event.key === "ArrowRight") {
    event.preventDefault();
    onNext?.();
   }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [
  canOpenDetail,
  disabled,
  onAnswer,
  onNext,
  onOpenDetail,
  onPrevious,
  onReveal,
  onSelectWritingCharacter,
  writingCharacterCount,
 ]);

 return {
  onTouchStart(event) {
   const touch = event.touches[0];
   if (!touch) return;

   touchStartRef.current = {
    x: touch.clientX,
    y: touch.clientY,
   };
  },

  onTouchEnd(event) {
   if (disabled || !touchStartRef.current) return;

   const touch = event.changedTouches[0];
   if (!touch) return;

   const deltaX = touch.clientX - touchStartRef.current.x;
   const deltaY = touch.clientY - touchStartRef.current.y;

   touchStartRef.current = null;

   const absX = Math.abs(deltaX);
   const absY = Math.abs(deltaY);

   if (absX < SWIPE_DISTANCE && absY < SWIPE_DISTANCE) return;

   if (absX > absY) {
    if (deltaX > 0) onPrevious?.();
    else onNext?.();
    return;
   }

   if (deltaY < 0) {
    onAnswer("hard");
   }
  },
 };
}
