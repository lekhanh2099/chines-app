"use client";

import { useEffect } from "react";

import { getHanziFontFamily } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { usePathname } from "@/i18n/navigation";

const defaultHanziFontFamily = getHanziFontFamily(DEFAULT_LESSON_DISPLAY_MODE.hanziFont);

export function HanziTypographyPreferenceBridge() {
 const pathname = usePathname();
 const shouldLoadRemoteState =
  pathname === "/hanzihome" ||
  pathname.startsWith("/hanzihome/") ||
  pathname.startsWith("/settings");
 const learning = useLearningState();
 const state = shouldLoadRemoteState ? learning.state : undefined;
 const displayMode = state?.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const fontFamily = getHanziFontFamily(displayMode.hanziFont);

 useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty("--font-hanzi", fontFamily);
  root.dataset.hanziReaderFont = displayMode.hanziFont;

  return () => {
   root.style.removeProperty("--font-hanzi");
   delete root.dataset.hanziReaderFont;
  };
 }, [displayMode.hanziFont, fontFamily]);

 return (
  <style>{`
   :root { --font-hanzi: ${defaultHanziFontFamily}; }
   :where([lang="zh-CN"]) { font-family: var(--font-hanzi); }
  `}</style>
 );
}
