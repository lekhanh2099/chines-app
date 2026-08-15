"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { getHanziFontFamily } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { loadLearningStateLocalFirst } from "@/features/hanzihome/local/learning-state-local-first";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

const learningStateQueryKey = ["hanzihome", "learning-state"];
const defaultHanziFontFamily = getHanziFontFamily(DEFAULT_LESSON_DISPLAY_MODE.hanziFont);

export function HanziTypographyPreferenceBridge() {
 const pathname = usePathname();
 const shouldLoadRemoteState =
  pathname === "/hanzihome" ||
  pathname.startsWith("/hanzihome/") ||
  pathname.startsWith("/settings");
 const learningStateQuery = useQuery({
  queryKey: learningStateQueryKey,
  queryFn: loadLearningStateLocalFirst,
  enabled: shouldLoadRemoteState,
 });
 const state = useMemo(
  () => normalizeLearningState(learningStateQuery.data ?? emptyLearningState),
  [learningStateQuery.data],
 );
 const displayMode = state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
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
