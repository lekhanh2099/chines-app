"use client";

import { useTranslations } from "next-intl";
import { Pause, Play, Repeat2 } from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import type { useStudioDictationSession } from "./useStudioDictationSession";

type StudioDictationSession = ReturnType<typeof useStudioDictationSession>;

/** Playback, check/next and part navigation buttons with their shortcut hints. */
export function StudioDictationEditorControls({
 index,
 total,
 isLoading,
 isPaused,
 isSpeaking,
 isChecked,
 canAdvance,
 isCheckDisabled,
 onPlayToggle,
 onRepeat,
 confirmOrEdit,
 handlePrevious,
 handleNext,
}: {
 index: number;
 total: number;
 isLoading?: boolean;
 isPaused?: boolean;
 isSpeaking?: boolean;
 isChecked: StudioDictationSession["isChecked"];
 canAdvance: StudioDictationSession["canAdvance"];
 isCheckDisabled: StudioDictationSession["isCheckDisabled"];
 onPlayToggle: () => void;
 onRepeat: () => void;
 confirmOrEdit: StudioDictationSession["confirmOrEdit"];
 handlePrevious: StudioDictationSession["handlePrevious"];
 handleNext: StudioDictationSession["handleNext"];
}) {
 const t = useTranslations("Dictation");

 return (
  <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border-default pt-4 sm:flex-row sm:items-center">
   <div className="flex flex-wrap items-center gap-2">
    {onPlayToggle ? (
     <Button type="button" variant="outline" disabled={isLoading} onClick={onPlayToggle}>
      {isSpeaking && !isPaused ? (
       <Pause data-icon="inline-start" />
      ) : (
       <Play data-icon="inline-start" />
      )}
      {isLoading
       ? t("preparing")
       : isSpeaking && !isPaused
         ? t("pause")
         : isPaused
           ? t("resume")
           : t("listenPart")}
      <Badge size="sm" casing="natural">
       {isChecked ? "2 · Control" : "Control"}
      </Badge>
     </Button>
    ) : null}
    {onRepeat ? (
     <Button type="button" variant="ghost" onClick={onRepeat}>
      <Repeat2 data-icon="inline-start" />
      {t("replay")}
      <Badge size="sm" casing="natural">
       {isChecked ? "3 · Ctrl/⌘ R" : "Ctrl/⌘ R"}
      </Badge>
     </Button>
    ) : null}
    <Button type="button" disabled={isCheckDisabled} onClick={confirmOrEdit}>
     {isChecked ? (canAdvance ? t("nextPart") : t("editAgain")) : t("check")}
     <Badge size="sm" casing="natural">
      {isChecked ? "6 · Ctrl/⌘ ↵" : "Ctrl/⌘ ↵"}
     </Badge>
    </Button>
   </div>
   {total > 1 ? (
    <div className="flex flex-wrap gap-2 sm:ms-auto">
     <Button type="button" variant="ghost" disabled={index === 0} onClick={handlePrevious}>
      {t("previousArrow")}
      <Badge size="sm" casing="natural">
       {isChecked ? "1 · Ctrl/⌘ ←" : "Ctrl/⌘ ←"}
      </Badge>
     </Button>
     <Button type="button" variant="ghost" disabled={index >= total - 1} onClick={handleNext}>
      {t("nextArrow")}
      <Badge size="sm" casing="natural">
       {isChecked ? "4 · Ctrl/⌘ →" : "Ctrl/⌘ →"}
      </Badge>
     </Button>
    </div>
   ) : null}
  </div>
 );
}
