"use client";

import { useEffect } from "react";

export type ListeningHotkeyHandlers = {
 enabled?: boolean;
 onNext: () => void;
 onPlayToggle: () => void;
 onPrevious: () => void;
 onRepeat: () => void;
 onStop?: () => void;
 onToggleLoop?: () => void;
};

export type ListeningShortcutAction =
 | "next"
 | "play-toggle"
 | "previous"
 | "repeat"
 | "stop"
 | "toggle-loop";

type ListeningShortcutEvent = Pick<KeyboardEvent, "code" | "key">;

function isEditableTarget(target: EventTarget | null) {
 if (!(target instanceof HTMLElement)) return false;
 return (
  target.isContentEditable ||
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement
 );
}

export function resolveListeningShortcut(
 event: ListeningShortcutEvent,
): ListeningShortcutAction | null {
 switch (event.code) {
  case "Digit1":
  case "Numpad1":
   return "previous";
  case "Digit2":
  case "Numpad2":
   return "play-toggle";
  case "Digit3":
  case "Numpad3":
   return "repeat";
  case "Digit4":
  case "Numpad4":
   return "next";
  case "Digit5":
  case "Numpad5":
   return "toggle-loop";
  default:
   break;
 }

 if (event.key === "Escape") return "stop";
 if (event.code === "Space" || event.key === " ") return "play-toggle";
 if (event.key === "ArrowLeft") return "previous";
 if (event.key === "ArrowRight") return "next";
 if (event.key.toLocaleLowerCase("en") === "r") return "repeat";
 if (event.key.toLocaleLowerCase("en") === "l") return "toggle-loop";
 return null;
}

export function useListeningHotkeys({
 enabled = true,
 onNext,
 onPlayToggle,
 onPrevious,
 onRepeat,
 onStop,
 onToggleLoop,
}: ListeningHotkeyHandlers) {
 useEffect(() => {
  if (!enabled) return;

  const handleKeyDown = (event: KeyboardEvent) => {
   if (
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    isEditableTarget(event.target)
   )
    return;

   const action = resolveListeningShortcut(event);
   if (action === null) return;

   switch (action) {
    case "previous":
     onPrevious();
     break;
    case "play-toggle":
     onPlayToggle();
     break;
    case "repeat":
     onRepeat();
     break;
    case "next":
     onNext();
     break;
    case "toggle-loop":
     if (!onToggleLoop) return;
     onToggleLoop();
     break;
    case "stop":
     if (!onStop) return;
     onStop();
     break;
   }

   event.preventDefault();
  };

  document.addEventListener("keydown", handleKeyDown, true);
  return () => document.removeEventListener("keydown", handleKeyDown, true);
 }, [enabled, onNext, onPlayToggle, onPrevious, onRepeat, onStop, onToggleLoop]);
}