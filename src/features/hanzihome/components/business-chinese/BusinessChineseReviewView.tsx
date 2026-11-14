"use client";

import { useTranslations } from "next-intl";
import { PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import {
 UniversalAmbientPip,
 type UniversalAmbientPipProps,
} from "@/features/hanzihome/components/review/UniversalAmbientPip";
import { FastSpeechSuspendedContext } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { BusinessChineseContextualDrills } from "./BusinessChineseContextualDrills";
import type { ContextualVocabDrillItem } from "./business-chinese-study-utils";
import type { BusinessChinesePipControls } from "./useBusinessChinesePip";

export type BusinessChineseReviewMode = "flashcard" | "dictation" | "drills";

/** The lesson "review" tab: flashcard/dictation deck or contextual drills, with PiP hand-off. */
export function BusinessChineseReviewView({
 lesson,
 reviewMode,
 onReviewModeChange,
 contextualDrills,
 pip,
 vocabItems,
 grammarItems,
 practiceItems,
}: {
 lesson: TextbookLesson;
 reviewMode: BusinessChineseReviewMode;
 onReviewModeChange: (mode: BusinessChineseReviewMode) => void;
 contextualDrills: readonly ContextualVocabDrillItem[];
 pip: BusinessChinesePipControls;
 vocabItems: UniversalAmbientPipProps["vocabItems"];
 grammarItems: UniversalAmbientPipProps["grammarItems"];
 practiceItems: UniversalAmbientPipProps["practiceItems"];
}) {
 const t = useTranslations("BusinessChinese");
 const { isPipOpen, closePip, isInAppFloatingOpen, setIsInAppFloatingOpen, handleTogglePip } = pip;

 return (
  <div data-textbook-document className="mx-auto grid w-full max-w-4xl min-w-0 gap-4">
   <Card
    variant="subtle"
    padding="sm"
    className="flex min-w-0 flex-wrap items-center justify-between gap-3"
   >
    <div className="flex min-w-0 items-center gap-2">
     <Typography variant="overline" tone="muted" weight="black" tracking="wide">
      {t("vocabReview.eyebrow")}
     </Typography>
     <Badge variant="accent" size="sm" casing="natural">
      {t("vocabReview.title", { count: lesson.vocab.length })}
     </Badge>
    </div>

    <div className="flex shrink-0 items-center gap-1.5">
     <Button
      type="button"
      size="compact"
      variant={reviewMode === "flashcard" ? "active" : "ghost"}
      onClick={() => onReviewModeChange("flashcard")}
     >
      {t("vocabReview.modeFlashcard")}
     </Button>
     <Button
      type="button"
      size="compact"
      variant={reviewMode === "dictation" ? "active" : "ghost"}
      onClick={() => onReviewModeChange("dictation")}
     >
      Chép từ
     </Button>
     {contextualDrills.length > 0 ? (
      <Button
       type="button"
       size="compact"
       variant={reviewMode === "drills" ? "active" : "ghost"}
       onClick={() => onReviewModeChange("drills")}
      >
       {t("vocabReview.modeDrills")}
      </Button>
     ) : null}

     <Button
      type="button"
      variant={isPipOpen || isInAppFloatingOpen ? "active" : "outline"}
      size="compact"
      onClick={() =>
       handleTogglePip(
        reviewMode === "dictation" ? "dictation" : reviewMode === "drills" ? "practice" : "vocab",
       )
      }
      title={t("vocabReview.pipTooltip")}
     >
      <PictureInPicture2 className="size-3.5" />
      <span>
       {isPipOpen || isInAppFloatingOpen ? t("vocabReview.pipActive") : t("vocabReview.pipButton")}
      </span>
     </Button>
    </div>
   </Card>

   {reviewMode === "drills" && contextualDrills.length > 0 ? (
    <BusinessChineseContextualDrills drills={contextualDrills} />
   ) : (
    <>
     <div hidden={isPipOpen || isInAppFloatingOpen}>
      {/* Kept mounted to preserve progress, but muted while the same deck
          runs in the PiP/floating window so the two never read at once. */}
      <FastSpeechSuspendedContext.Provider value={isPipOpen || isInAppFloatingOpen}>
       <UniversalAmbientPip
        key={reviewMode}
        initialMode={reviewMode === "dictation" ? "dictation" : "vocab"}
        lessonTitle={lesson.title}
        vocabItems={vocabItems}
        grammarItems={grammarItems}
        practiceItems={practiceItems}
        isInline
       />
      </FastSpeechSuspendedContext.Provider>
     </div>
     {isPipOpen || isInAppFloatingOpen ? (
      <Card
       variant="subtle"
       padding="lg"
       className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center"
      >
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
       <Button
        type="button"
        variant="outline"
        size="compact"
        onClick={() => {
         if (isPipOpen) closePip();
         if (isInAppFloatingOpen) setIsInAppFloatingOpen(false);
        }}
       >
        {t("vocabReview.pipReturn")}
       </Button>
      </Card>
     ) : null}
    </>
   )}
  </div>
 );
}
