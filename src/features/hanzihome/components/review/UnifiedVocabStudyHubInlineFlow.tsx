"use client";

import { PictureInPicture2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { FastSpeechSuspendedContext } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { UniversalAmbientPip, type UniversalPipMode } from "./UniversalAmbientPip";
import type { useVocabStudyHubDeck } from "./useVocabStudyHubDeck";

type VocabStudyHubDeck = ReturnType<typeof useVocabStudyHubDeck>;

/** Inline study flow; stays mounted (hidden and muted) while the deck runs in PiP/floating mode. */
export function UnifiedVocabStudyHubInlineFlow({
 isExternalOpen,
 sourceMode,
 activeBundle,
 activeFlowMode,
 onCloseInline,
 onReturnFromExternal,
}: {
 isExternalOpen: boolean;
 sourceMode: VocabStudyHubDeck["sourceMode"];
 activeBundle: VocabStudyHubDeck["activeBundle"];
 activeFlowMode: UniversalPipMode;
 onCloseInline: () => void;
 onReturnFromExternal: () => void;
}) {
 const t = useTranslations("BusinessChinese");

 return (
  <div className="mx-auto w-full max-w-3xl pt-1">
   <Card variant="default" padding="none" className="min-h-[380px] overflow-hidden">
    <div hidden={isExternalOpen}>
     {/* Kept mounted to preserve progress, but muted while the same deck runs in
         the PiP/floating window; otherwise both cards read aloud at once. */}
     <FastSpeechSuspendedContext.Provider value={isExternalOpen}>
      <UniversalAmbientPip
       key={`${sourceMode}-${activeBundle.title}-${activeFlowMode}`}
       initialMode={activeFlowMode}
       lessonTitle={activeBundle.title}
       vocabItems={activeBundle.vocabItems}
       grammarItems={activeBundle.grammarItems}
       practiceItems={activeBundle.practiceItems}
       onClose={onCloseInline}
       isInline
      />
     </FastSpeechSuspendedContext.Provider>
    </div>
    {isExternalOpen ? (
     <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 p-8 text-center">
      <IconTile size="lg" tone="accent" className="mx-auto">
       <PictureInPicture2 />
      </IconTile>
      <div className="grid gap-1">
       <Typography variant="sectionTitle" weight="black">
        {t("vocabReview.pipActiveTitle")}
       </Typography>
       <Typography variant="bodySmall" tone="muted" className="max-w-md">
        {t("vocabReview.pipActiveDescription")}
       </Typography>
      </div>
      <Button type="button" variant="outline" size="compact" onClick={onReturnFromExternal}>
       {t("vocabReview.pipReturn")}
      </Button>
     </div>
    ) : null}
   </Card>
  </div>
 );
}
