"use client";

import { useCallback, useState } from "react";

import type { UniversalPipMode } from "@/features/hanzihome/components/review/UniversalAmbientPip";
import { useDocumentPip } from "@/features/hanzihome/hooks/useDocumentPip";

/**
 * Owns the Daily Reading vocabulary PiP surface: the Document PiP window, the
 * in-app floating fallback and the requested PiP mode.
 */
export function useDailyReadingPip() {
 const {
  isSupported: isPipSupported,
  isOpen: isPipOpen,
  pipWindow,
  openPip,
  closePip,
 } = useDocumentPip();
 const [isInAppFloatingOpen, setIsInAppFloatingOpen] = useState(false);
 const [pipMode, setPipMode] = useState<UniversalPipMode>("vocab");

 const handleTogglePip = useCallback(
  async (targetMode: UniversalPipMode = "vocab") => {
   setPipMode(targetMode);
   if (isPipOpen) {
    if (pipMode === targetMode) {
     closePip();
    }
    return;
   }
   if (isInAppFloatingOpen) {
    if (pipMode === targetMode) {
     setIsInAppFloatingOpen(false);
    }
    return;
   }
   if (isPipSupported) {
    const win = await openPip({ width: 440, height: 380 });
    if (!win) {
     setIsInAppFloatingOpen(true);
    }
   } else {
    setIsInAppFloatingOpen(true);
   }
  },
  [
   closePip,
   isInAppFloatingOpen,
   isPipOpen,
   isPipSupported,
   openPip,
   pipMode,
   setIsInAppFloatingOpen,
  ],
 );

 return {
  isPipOpen,
  pipWindow,
  closePip,
  isInAppFloatingOpen,
  setIsInAppFloatingOpen,
  pipMode,
  handleTogglePip,
 };
}
