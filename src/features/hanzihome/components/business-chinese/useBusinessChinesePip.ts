"use client";

import { useCallback, useState } from "react";
import type { UniversalPipMode } from "@/features/hanzihome/components/review/UniversalAmbientPip";
import { useDocumentPip } from "@/features/hanzihome/hooks/useDocumentPip";

/**
 * Owns the lesson's Document Picture-in-Picture window and its in-app floating
 * fallback, plus which ambient review mode either surface shows.
 */
export function useBusinessChinesePip() {
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
  [closePip, isInAppFloatingOpen, isPipOpen, isPipSupported, openPip, pipMode],
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

export type BusinessChinesePipControls = ReturnType<typeof useBusinessChinesePip>;
