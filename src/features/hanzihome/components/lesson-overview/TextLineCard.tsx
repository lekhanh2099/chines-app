"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";

import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "./types";
import { ProgressiveStudyText } from "./ProgressiveStudyText";
import { z } from "zod";

const TextLineCardVariantSchema = z.enum(["card", "reader"]);

export function TextLineCard({
 speaker,
 zh,
 pinyin,
 vi,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
 variant = TextLineCardVariantSchema.enum.card,
 annotationTarget,
 interactiveReading = false,
 readingMode = false,
}: {
 speaker?: string;
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode?: LessonDisplayMode;
 variant?: z.infer<typeof TextLineCardVariantSchema>;
 annotationTarget?: { lessonId: string; nodeType: string; nodeId: string };
 interactiveReading?: boolean;
 readingMode?: boolean;
}) {
 const tts = useSharedMandarinTts();

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
    <Badge variant="purple" casing="natural" className="w-fit">
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
     annotationTarget={annotationTarget}
     readingPlayback={
      interactiveReading
       ? {
          canSpeak: Boolean(tts.selectedVoice),
          isSpeaking: tts.isSpeaking,
          progress: tts.progress,
          speakingText: tts.speakingText,
          speak: tts.speak,
         }
       : undefined
     }
     readingMode={readingMode}
    />
    <MandarinSpeakButton text={zh} disabled={readingMode} />
   </div>
  </div>
 );
}
