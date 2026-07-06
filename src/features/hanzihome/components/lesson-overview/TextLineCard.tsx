import { cn } from "@/lib/utils";

import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "./types";
import { getHanziTypographyStyle } from "./hanzi-typography";

export function TextLineCard({
 speaker,
 zh,
 pinyin,
 vi,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
 variant = "card",
}: {
 speaker?: string;
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode?: LessonDisplayMode;
 variant?: "card" | "reader";
}) {
 return (
  <div
   className={cn(
    "grid gap-1",
    variant === "card"
     ? "study-content-surface rounded-xl border p-3"
     : "border-b border-border-default/70 py-2.5 last:border-b-0 sm:py-3",
   )}
  >
   {speaker && (
    <p className="text-xs font-black uppercase tracking-wide text-accent-text">{speaker}</p>
   )}
   <p className="whitespace-pre-wrap" lang="zh-CN" style={getHanziTypographyStyle(displayMode)}>
    {zh}
   </p>
   {displayMode.showPinyin && pinyin && (
    <p className="whitespace-pre-wrap text-xs font-bold italic text-text-muted sm:text-sm">
     {pinyin}
    </p>
   )}
   {displayMode.showMeaning && vi && (
    <p className="whitespace-pre-wrap font-semibold leading-snug text-text-secondary sm:leading-relaxed">
     {vi}
    </p>
   )}
  </div>
 );
}
