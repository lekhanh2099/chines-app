"use client";

import type { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { ttsStudioTextSummary } from "./tts-studio-utils";

type MandarinTts = ReturnType<typeof useSharedMandarinTts>;
type TtsStudioTextSummary = ReturnType<typeof ttsStudioTextSummary>;

/** Step 1 and 2: the text to synthesize, its summary badges and the rate presets. */
export function TtsStudioContentCard({
 text,
 setText,
 characterCount,
 paragraphCount,
 sentenceCount,
 estimatedDuration,
 tts,
}: {
 text: string;
 setText: Dispatch<SetStateAction<string>>;
 characterCount: TtsStudioTextSummary["characterCount"];
 paragraphCount: TtsStudioTextSummary["paragraphCount"];
 sentenceCount: TtsStudioTextSummary["sentenceCount"];
 estimatedDuration: TtsStudioTextSummary["estimatedDuration"];
 tts: MandarinTts;
}) {
 const t = useTranslations("TtsStudio");
 const ttsRatePresets = [
  { label: t("natural"), rate: 1 },
  { label: t("slow"), rate: 0.9 },
  { label: t("conversation"), rate: 1.1 },
  { label: t("narration"), rate: 0.75 },
 ];

 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <Typography as="p" variant="overline" tone="accent" weight="black">
      {t("step", { number: 1 })}
     </Typography>
     <Typography as="h2" variant="sectionTitle" weight="black">
      {t("contentTitle")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("contentHelp")}
     </Typography>
    </div>
    <div className="flex flex-wrap gap-2" aria-label={t("summaryAria")}>
     <Badge casing="natural" size="lg">
      {t("characters", { count: characterCount })}
     </Badge>
     <Badge casing="natural" size="lg">
      {t("paragraphs", { count: paragraphCount })}
     </Badge>
     <Badge casing="natural" size="lg">
      {t("sentences", { count: sentenceCount })}
     </Badge>
     <Badge casing="natural" size="lg">
      ≈ {estimatedDuration}
     </Badge>
    </div>
   </div>

   <Textarea
    value={text}
    onChange={(event) => setText(event.target.value)}
    placeholder={t("textPlaceholder")}
    aria-label={t("textAria")}
    maxLength={10000}
    className="min-h-64"
   />

   <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
    <div className="grid gap-0.5">
     <Typography as="span" variant="caption" tone="accent" weight="black">
      {t("step", { number: 2 })}
     </Typography>
     <Typography as="span" variant="caption" tone="muted" weight="black">
      {t("rateTitle")}
     </Typography>
    </div>
    {ttsRatePresets.map((preset) => (
     <Button
      key={preset.label}
      type="button"
      size="sm"
      variant={tts.rate === preset.rate ? "active" : "ghost"}
      onClick={() => tts.setRate(preset.rate)}
     >
      {preset.label}
     </Button>
    ))}
   </Card>
  </Card>
 );
}
