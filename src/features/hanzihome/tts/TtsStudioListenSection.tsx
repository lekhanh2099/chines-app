"use client";

import type { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { TtsSegmentMode, splitTtsStudioText } from "./tts-studio.schemas";
import type { useTtsStudioPlayback } from "./useTtsStudioPlayback";

type MandarinTts = ReturnType<typeof useSharedMandarinTts>;

/** Step 3: segment mode, loop/auto-advance toggles, segment picker and preview transport. */
export function TtsStudioListenSection({
 mode,
 setMode,
 segments,
 effectiveActiveSegmentIndex,
 setActiveSegmentIndex,
 loopCurrent,
 setLoopCurrent,
 autoAdvance,
 setAutoAdvance,
 playSegmentAt,
 tts,
}: {
 mode: TtsSegmentMode;
 setMode: Dispatch<SetStateAction<TtsSegmentMode>>;
 segments: ReturnType<typeof splitTtsStudioText>;
 effectiveActiveSegmentIndex: number;
 setActiveSegmentIndex: Dispatch<SetStateAction<number>>;
 loopCurrent: boolean;
 setLoopCurrent: Dispatch<SetStateAction<boolean>>;
 autoAdvance: boolean;
 setAutoAdvance: Dispatch<SetStateAction<boolean>>;
 playSegmentAt: ReturnType<typeof useTtsStudioPlayback>["playSegmentAt"];
 tts: MandarinTts;
}) {
 const t = useTranslations("TtsStudio");

 return (
  <section className="grid gap-3">
   <div className="grid gap-1">
    <Typography as="p" variant="overline" tone="accent" weight="black">
     {t("step", { number: 3 })}
    </Typography>
    <Typography as="h2" variant="sectionTitle" weight="black">
     {t("listenTitle")}
    </Typography>
   </div>
   <Card variant="subtle" padding="sm" className="grid gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <Typography as="span" variant="overline" tone="accent" weight="black">
      {t("preview")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted" weight="black">
      {segments.length === 0
       ? t("noContent")
       : t("progress", { current: effectiveActiveSegmentIndex + 1, total: segments.length })}
     </Typography>
    </div>
    <div className="grid gap-2">
     <SegmentedControl
      value={mode}
      items={[
       { key: "sentence", label: t("sentenceMode") },
       { key: "paragraph", label: t("paragraphMode") },
      ]}
      onChange={setMode}
      aria-label={t("modeAria")}
     />
     <div className="flex flex-wrap items-center gap-2">
      <Button
       type="button"
       size="sm"
       variant={loopCurrent ? "active" : "outline"}
       aria-pressed={loopCurrent}
       onClick={() => setLoopCurrent((current) => !current)}
      >
       {t("loop")}
      </Button>
      <Button
       type="button"
       size="sm"
       variant={autoAdvance ? "active" : "outline"}
       aria-pressed={autoAdvance}
       onClick={() => setAutoAdvance((current) => !current)}
      >
       {t("autoAdvance")}
      </Button>
     </div>
    </div>
    <div className="flex flex-wrap gap-2" aria-label={t("segmentGroupAria")}>
     {segments.map((segment, index) => (
      <Button
       key={`${index}:${segment}`}
       type="button"
       size="icon"
       aria-label={t("segmentAria", { number: index + 1 })}
       variant={index === effectiveActiveSegmentIndex ? "active" : "outline"}
       onClick={() => setActiveSegmentIndex(index)}
      >
       {index + 1}
      </Button>
     ))}
    </div>
    {segments[effectiveActiveSegmentIndex] ? (
     <Card variant="default" padding="sm" className="flex min-w-0 flex-wrap items-center gap-2">
      <Typography as="p" variant="body" lang="zh-CN" className="min-w-0 flex-1">
       {segments[effectiveActiveSegmentIndex]}
      </Typography>
      <Button
       type="button"
       size="sm"
       disabled={tts.isLoading}
       onClick={() => playSegmentAt(effectiveActiveSegmentIndex)}
      >
       {tts.isSpeaking ? t("speaking") : t("listen")}
      </Button>
     </Card>
    ) : null}
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={effectiveActiveSegmentIndex === 0}
      onClick={() => {
       setActiveSegmentIndex((current) => Math.max(0, current - 1));
       playSegmentAt(Math.max(0, effectiveActiveSegmentIndex - 1));
      }}
     >
      {t("previous")}
     </Button>
     <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={segments.length === 0}
      onClick={() => playSegmentAt(effectiveActiveSegmentIndex)}
     >
      {t("replay")}
     </Button>
     <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={effectiveActiveSegmentIndex >= segments.length - 1}
      onClick={() => {
       setActiveSegmentIndex((current) => Math.min(segments.length - 1, current + 1));
       playSegmentAt(Math.min(segments.length - 1, effectiveActiveSegmentIndex + 1));
      }}
     >
      {t("next")}
     </Button>
    </div>
    <Typography as="span" variant="caption" tone="muted">
     {t("shortcuts")}
    </Typography>
   </Card>
  </section>
 );
}
