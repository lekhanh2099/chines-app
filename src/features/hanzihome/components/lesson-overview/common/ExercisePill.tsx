import type { ReactNode } from "react";
import { containsHanziText, getHanziTypographyStyle } from "../hanzi-typography";
import type { LessonDisplayMode } from "../types";

export function ExercisePill({
 children,
 displayMode,
}: {
 children: ReactNode;
 displayMode?: LessonDisplayMode;
}) {
 const hanzi = typeof children === "string" && containsHanziText(children);

 return (
  <span
   className="study-content-surface rounded-lg border px-3 py-2 font-bold leading-[1.7]"
   lang={hanzi ? "zh-CN" : undefined}
   style={hanzi && displayMode ? getHanziTypographyStyle(displayMode) : undefined}
  >
   {children}
  </span>
 );
}
