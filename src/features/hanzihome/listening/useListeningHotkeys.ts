"use client";

import { useEffect } from "react";

export type ListeningHotkeyHandlers = {
 enabled?: boolean;
 onConfirm?: () => void;
 onNext: () => void;
 onPlayToggle: () => void;
 onPrevious: () => void;
 onRepeat: () => void;
 onStop?: () => void;
 onToggleLoop?: () => void;
};

type ListeningHotkeyHandlerValues = {
 onConfirm: (() => void) | undefined;
 onNext: () => void;
 onPlayToggle: () => void;
 onPrevious: () => void;
 onRepeat: () => void;
 onStop: (() => void) | undefined;
 onToggleLoop: (() => void) | undefined;
};

export function createListeningHotkeyHandlers({
 onConfirm,
 onNext,
 onPlayToggle,
 onPrevious,
 onRepeat,
 onStop,
 onToggleLoop,
}: ListeningHotkeyHandlerValues): ListeningHotkeyHandlers {
 return {
  onNext,
  onPlayToggle,
  onPrevious,
  onRepeat,
  ...(onConfirm === undefined ? {} : { onConfirm }),
  ...(onStop === undefined ? {} : { onStop }),
  ...(onToggleLoop === undefined ? {} : { onToggleLoop }),
 };
}

export enum ListeningShortcutAction {
 Confirm = "confirm",
 Next = "next",
 PlayToggle = "play-toggle",
 Previous = "previous",
 Repeat = "repeat",
 Stop = "stop",
 ToggleLoop = "toggle-loop",
}

type ListeningShortcutEvent = Pick<
 KeyboardEvent,
 "altKey" | "code" | "ctrlKey" | "key" | "metaKey" | "shiftKey"
>;

function isEditableTarget(target: EventTarget | null): boolean {
 if (!(target instanceof HTMLElement)) return false;
 return (
  target.isContentEditable ||
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement
 );
}

function resolveNumberShortcutValue(value: string): ListeningShortcutAction | null {
 switch (value) {
  case "Digit1":
  case "Numpad1":
  case "1":
   return ListeningShortcutAction.Previous;
  case "Digit2":
  case "Numpad2":
  case "2":
   return ListeningShortcutAction.PlayToggle;
  case "Digit3":
  case "Numpad3":
  case "3":
   return ListeningShortcutAction.Repeat;
  case "Digit4":
  case "Numpad4":
  case "4":
   return ListeningShortcutAction.Next;
  case "Digit5":
  case "Numpad5":
  case "5":
   return ListeningShortcutAction.ToggleLoop;
  case "Digit6":
  case "Numpad6":
  case "6":
   return ListeningShortcutAction.Confirm;
  default:
   return null;
 }
}

function resolveNumberShortcut(event: ListeningShortcutEvent): ListeningShortcutAction | null {
 return resolveNumberShortcutValue(event.code) ?? resolveNumberShortcutValue(event.key);
}

export function resolveListeningShortcut(
 event: ListeningShortcutEvent,
 editable: boolean,
): ListeningShortcutAction | null {
 const modifier = event.ctrlKey || event.metaKey;
 if (modifier && event.key === "Enter") return ListeningShortcutAction.Confirm;
 if (event.key === "Escape") return ListeningShortcutAction.Stop;

 const numberShortcut = resolveNumberShortcut(event);
 if (numberShortcut !== null) return numberShortcut;

 if (editable && !event.altKey) return null;
 if (event.code === "Space" || event.key === " ") return ListeningShortcutAction.PlayToggle;
 if (event.key === "ArrowLeft") return ListeningShortcutAction.Previous;
 if (event.key === "ArrowRight") return ListeningShortcutAction.Next;
 if (event.key.toLocaleLowerCase("en") === "r") return ListeningShortcutAction.Repeat;
 if (event.key.toLocaleLowerCase("en") === "l") return ListeningShortcutAction.ToggleLoop;
 return null;
}

export function runListeningShortcutAction(
 action: ListeningShortcutAction,
 handlers: ListeningHotkeyHandlers,
): boolean {
 switch (action) {
  case ListeningShortcutAction.Confirm:
   if (handlers.onConfirm === undefined) return false;
   handlers.onConfirm();
   return true;
  case ListeningShortcutAction.Next:
   handlers.onNext();
   return true;
  case ListeningShortcutAction.PlayToggle:
   handlers.onPlayToggle();
   return true;
  case ListeningShortcutAction.Previous:
   handlers.onPrevious();
   return true;
  case ListeningShortcutAction.Repeat:
   handlers.onRepeat();
   return true;
  case ListeningShortcutAction.Stop:
   if (handlers.onStop === undefined) return false;
   handlers.onStop();
   return true;
  case ListeningShortcutAction.ToggleLoop:
   if (handlers.onToggleLoop === undefined) return false;
   handlers.onToggleLoop();
   return true;
 }
}

export function useListeningHotkeys({
 enabled = true,
 onConfirm,
 onNext,
 onPlayToggle,
 onPrevious,
 onRepeat,
 onStop,
 onToggleLoop,
}: ListeningHotkeyHandlers): void {
 useEffect(() => {
  if (!enabled) return;

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.defaultPrevented || event.isComposing || isEditableTarget(event.target)) return;
   const action = resolveListeningShortcut(event, false);
   if (action === null) return;
   const handled = runListeningShortcutAction(
    action,
    createListeningHotkeyHandlers({
     onConfirm,
     onNext,
     onPlayToggle,
     onPrevious,
     onRepeat,
     onStop,
     onToggleLoop,
    }),
   );
   if (!handled) return;
   event.preventDefault();
  };

  document.addEventListener("keydown", handleKeyDown, true);
  return () => document.removeEventListener("keydown", handleKeyDown, true);
 }, [enabled, onConfirm, onNext, onPlayToggle, onPrevious, onRepeat, onStop, onToggleLoop]);
}