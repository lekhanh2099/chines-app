"use client";

import { useEffect, useId } from "react";
import { useSelector } from "@tanstack/react-store";

import { readingFocusStore } from "@/stores/shell/reading-focus-store";

const OPEN_LAYER_SELECTOR =
 '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

/** Lets the mounted lesson workspace hide the app navigation, and Escape leave focus mode. */
export function useReadingFocusWorkspace() {
 const ownerId = useId();
 const enabled = useSelector(readingFocusStore, (state) => state.enabled);

 useEffect(() => {
  readingFocusStore.actions.claim(ownerId);
  return () => readingFocusStore.actions.release(ownerId);
 }, [ownerId]);

 useEffect(() => {
  if (!enabled) return;
  // Captured before an open layer handles the same Escape and leaves the DOM.
  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
   if (document.querySelector(OPEN_LAYER_SELECTOR)) return;
   if (event.target instanceof Element && event.target.closest(EDITABLE_SELECTOR)) return;
   readingFocusStore.actions.setEnabled(false);
  };
  window.addEventListener("keydown", handleKeyDown, true);
  return () => window.removeEventListener("keydown", handleKeyDown, true);
 }, [enabled]);
}
