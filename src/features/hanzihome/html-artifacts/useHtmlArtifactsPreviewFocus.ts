"use client";

import { useEffect } from "react";
import { useSelector } from "@tanstack/react-store";

import { appShellStore } from "@/stores/shell/app-shell-store";

export function useHtmlArtifactsPreviewFocus() {
 const isPreviewFocused = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const { setContentFullscreen } = appShellStore.actions;

 useEffect(() => {
  return () => setContentFullscreen(false);
 }, [setContentFullscreen]);

 useEffect(() => {
  if (!isPreviewFocused) return;

  const exitOnEscape = (event: globalThis.KeyboardEvent) => {
   if (event.key === "Escape") setContentFullscreen(false);
  };

  window.addEventListener("keydown", exitOnEscape);
  return () => window.removeEventListener("keydown", exitOnEscape);
 }, [isPreviewFocused, setContentFullscreen]);

 return { isPreviewFocused, setContentFullscreen };
}
