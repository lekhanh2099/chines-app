import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";

import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "./types";
import { getHanziTypographyStyle } from "./hanzi-typography";
import { ProgressiveStudyText } from "./ProgressiveStudyText";
import { z } from "zod";

const TextLineCardVariantSchema = z.enum(["card", "reader"]);

export function TextLineCard({
 speaker,
 zh,
 pinyin,
 vi,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
 variant = "card",
 annotationTarget,
}: {
 speaker?: string;
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode?: LessonDisplayMode;
 variant?: z.infer<typeof TextLineCardVariantSchema>;
 annotationTarget?: { lessonId: string; nodeType: string; nodeId: string };
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
   <div className="flex min-w-0 items-start gap-1.5">
    <ProgressiveStudyText
     key={displayMode.revealMode}
     className="flex-1"
     zh={zh}
     pinyin={pinyin}
     vi={vi}
     displayMode={displayMode}
     hanziStyle={getHanziTypographyStyle(displayMode)}
     annotationTarget={annotationTarget}
    />
    <NativeMandarinSpeakButton text={zh} />
   </div>
  </div>
 );
}
