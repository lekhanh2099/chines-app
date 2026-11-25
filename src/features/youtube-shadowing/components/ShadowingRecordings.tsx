"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";

import type { ShadowingRecordingItem } from "../hooks/useShadowingSession";
import { formatDurationSeconds } from "../model/time-format";

export function ShadowingRecordings({
 recordings,
 onDelete,
}: {
 recordings: ShadowingRecordingItem[];
 onDelete: (id: string) => void;
}) {
 const t = useTranslations("YoutubeShadowing");

 return (
  <div className="grid min-w-0 gap-2">
   <div className="flex min-w-0 items-center justify-between gap-2">
    <Typography as="h3" variant="label" tone="default">
     {t("recordings.title", { count: recordings.length })}
    </Typography>
    <Typography as="span" variant="caption" tone="muted">
     {t("recordings.memoryHint")}
    </Typography>
   </div>

   {recordings.length === 0 ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("recordings.empty")}
    </Typography>
   ) : (
    <div className="grid min-w-0 gap-2">
     {recordings.map((recording) => {
      const durationLabel = formatDurationSeconds(recording.durationSeconds);
      const label =
       recording.startedAtIndex >= 0
        ? t("recordings.itemWithSentence", {
           number: recording.attemptNumber,
           duration: durationLabel,
           sentence: recording.startedAtIndex + 1,
          })
        : t("recordings.item", {
           number: recording.attemptNumber,
           duration: durationLabel,
          });

      return (
       <Card key={recording.id} variant="subtle" padding="sm" className="grid min-w-0 gap-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
         <Typography as="span" variant="caption" tone="secondary" clamp="one">
          {label}
         </Typography>
         <Button
          type="button"
          variant="ghost"
          size="icon-toolbar"
          aria-label={t("recordings.deleteAria", { number: recording.attemptNumber })}
          onClick={() => onDelete(recording.id)}
         >
          <Trash2 aria-hidden="true" />
         </Button>
        </div>
        <audio
         controls
         preload="metadata"
         src={recording.url}
         aria-label={t("recordings.audioAria", { number: recording.attemptNumber })}
         className="w-full min-w-0"
        />
       </Card>
      );
     })}
    </div>
   )}
  </div>
 );
}
