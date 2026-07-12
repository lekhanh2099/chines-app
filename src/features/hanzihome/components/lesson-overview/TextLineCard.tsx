import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
   {speaker ? (
    <Badge variant="purple" className="w-fit normal-case tracking-normal">
     {speaker}
    </Badge>
   ) : null}
   <p
    className="whitespace-pre-wrap leading-[1.7] text-text-primary"
    lang="zh-CN"
    style={getHanziTypographyStyle(displayMode)}
   >
    {zh}
   </p>
   {displayMode.showPinyin && pinyin && (
    <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-accent-text">
     {pinyin}
    </p>
   )}
   {displayMode.showMeaning && vi && (
    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-text-muted sm:text-base">
     {vi}
    </p>
   )}
  </div>
 );
}
