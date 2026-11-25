"use client";

import { useSyncExternalStore, type ReactNode, type Ref } from "react";
import { ExternalLink, Headphones, Mic, Repeat, RotateCcw, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 SegmentedControl,
 type SegmentedControlItem,
} from "@/components/ui/forms/segmented-control";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";

import { formatDurationSeconds } from "../model/time-format";

export const playbackRateKeySchema = z.enum(["0.5", "0.75", "1"]);
export type PlaybackRateKey = z.infer<typeof playbackRateKeySchema>;

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

function subscribeDesktopMedia(callback: () => void) {
 if (typeof window === "undefined") return () => {};
 const query = window.matchMedia(DESKTOP_MEDIA_QUERY);
 query.addEventListener("change", callback);
 return () => query.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
 if (typeof window === "undefined") return false;
 return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getServerDesktopSnapshot() {
 return false;
}

export function ShadowingPlayerPanel({
 videoId,
 videoTitle,
 playerContainerRef,
 playerErrorCode,
 isShadowing,
 isRecording,
 isRequestingMic,
 isRecorderSupported,
 recordingDurationSeconds,
 recorderErrorCode,
 needsTapToPlay,
 canNavigateTimed,
 loopEnabled,
 playbackRate,
 onStartShadowing,
 onStopShadowing,
 onReplaySentence,
 onToggleLoop,
 onPlaybackRateChange,
 recordingsSlot,
}: {
 videoId: string;
 videoTitle: string;
 playerContainerRef: Ref<HTMLDivElement>;
 playerErrorCode: number;
 isShadowing: boolean;
 isRecording: boolean;
 isRequestingMic: boolean;
 isRecorderSupported: boolean;
 recordingDurationSeconds: number;
 recorderErrorCode: string;
 needsTapToPlay: boolean;
 canNavigateTimed: boolean;
 loopEnabled: boolean;
 playbackRate: PlaybackRateKey;
 onStartShadowing: () => void;
 onStopShadowing: () => void;
 onReplaySentence: () => void;
 onToggleLoop: () => void;
 onPlaybackRateChange: (rate: PlaybackRateKey) => void;
 recordingsSlot?: ReactNode;
}) {
 const t = useTranslations("YoutubeShadowing");
 const isDesktop = useSyncExternalStore(
  subscribeDesktopMedia,
  getDesktopSnapshot,
  getServerDesktopSnapshot,
 );

 const buttonSize = isDesktop ? "toolbar" : "touch";
 const iconButtonSize = isDesktop ? "icon-toolbar" : "icon";
 const segmentedDensity = isDesktop ? "toolbar" : "touch";
 const hasPlayerError = playerErrorCode !== 0;

 const speedItems: SegmentedControlItem<PlaybackRateKey>[] = [
  { key: "0.5", label: t("controls.speed05") },
  { key: "0.75", label: t("controls.speed075") },
  { key: "1", label: t("controls.speed1") },
 ];

 const playerErrorText =
  playerErrorCode === 101 || playerErrorCode === 150
   ? t("playerErrors.embedDisabled")
   : playerErrorCode === 100
     ? t("playerErrors.unavailable")
     : t("playerErrors.generic");

 const recorderErrorText =
  recorderErrorCode === "permission-denied"
   ? t("recorderErrors.permissionDenied")
   : recorderErrorCode === "unsupported"
     ? t("recorderErrors.unsupported")
     : recorderErrorCode === "recording-failed"
       ? t("recorderErrors.recordingFailed")
       : "";

 const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

 return (
  <Card variant="section" padding="md" className="grid min-w-0 gap-3 xl:sticky xl:top-0">
   <div className="aspect-video w-full overflow-hidden rounded-lg bg-bg-subtle">
    {hasPlayerError ? (
     <div className="flex size-full flex-col items-center justify-center gap-3 p-4 text-center">
      <Typography as="p" variant="bodySmall" tone="danger" role="alert">
       {playerErrorText}
      </Typography>
      <Button type="button" variant="outline" size={buttonSize} asChild>
       <a href={watchUrl} target="_blank" rel="noreferrer">
        <ExternalLink data-icon="inline-start" aria-hidden="true" />
        {t("playerErrors.openOnYoutube")}
       </a>
      </Button>
     </div>
    ) : (
     <div ref={playerContainerRef} className="size-full" />
    )}
   </div>

   {videoTitle ? (
    <Typography as="h2" variant="cardTitle" clamp="two">
     {videoTitle}
    </Typography>
   ) : null}

   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-2">
     {isShadowing || isRecording ? (
      <Button
       type="button"
       variant="destructive"
       size={buttonSize}
       aria-pressed="true"
       className="flex-1 sm:flex-none"
       onClick={onStopShadowing}
      >
       <Square data-icon="inline-start" aria-hidden="true" />
       {t("controls.stop")}
      </Button>
     ) : (
      <Button
       type="button"
       variant="default"
       size={buttonSize}
       aria-pressed="false"
       disabled={hasPlayerError || !isRecorderSupported || isRequestingMic}
       className="flex-1 sm:flex-none"
       onClick={onStartShadowing}
      >
       <Mic data-icon="inline-start" aria-hidden="true" />
       {isRequestingMic ? t("controls.requestingMic") : t("controls.shadow")}
      </Button>
     )}

     <Button
      type="button"
      variant="outline"
      size={iconButtonSize}
      disabled={!canNavigateTimed || hasPlayerError}
      aria-label={t("controls.replaySentence")}
      title={t("controls.replaySentence")}
      onClick={onReplaySentence}
     >
      <RotateCcw aria-hidden="true" />
     </Button>

     <Button
      type="button"
      variant={loopEnabled ? "active" : "outline"}
      size={iconButtonSize}
      disabled={!canNavigateTimed || hasPlayerError}
      aria-pressed={loopEnabled}
      aria-label={t("controls.loopSentence")}
      title={t("controls.loopSentence")}
      onClick={onToggleLoop}
     >
      <Repeat aria-hidden="true" />
     </Button>
    </div>

    <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
     <Typography as="span" variant="caption" tone="muted" className="sm:hidden">
      {t("controls.speedLabel")}
     </Typography>
     <div className="min-w-0">
      <SegmentedControl
       value={playbackRate}
       items={speedItems}
       density={segmentedDensity}
       layout="wrap"
       aria-label={t("controls.speedAria")}
       onChange={onPlaybackRateChange}
      />
     </div>
    </div>
   </div>

   <div aria-live="polite" className="grid min-w-0 gap-1">
    {isRecording ? (
     <Typography as="p" variant="caption" tone="danger" className="flex items-center gap-2">
      <span aria-hidden="true" className="size-2 shrink-0 animate-pulse rounded-full bg-danger" />
      {t("status.recording", { duration: formatDurationSeconds(recordingDurationSeconds) })}
     </Typography>
    ) : null}

    {needsTapToPlay ? (
     <Typography as="p" variant="bodySmall" tone="warning">
      {t("status.tapToPlay")}
     </Typography>
    ) : null}

    {recorderErrorText ? (
     <Typography as="p" variant="bodySmall" tone="danger" role="alert">
      {recorderErrorText}
     </Typography>
    ) : null}
   </div>

   <Typography as="p" variant="caption" tone="muted" className="flex items-center gap-2">
    <Headphones aria-hidden="true" className="size-4 shrink-0" />
    <span>{t("hints.headphones")}</span>
   </Typography>

   {recordingsSlot ? (
    <>
     <Separator />
     {recordingsSlot}
    </>
   ) : null}
  </Card>
 );
}
