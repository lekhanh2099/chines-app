"use client";

import {
 useState,
 useSyncExternalStore,
 type ComponentProps,
 type ReactNode,
 type Ref,
} from "react";
import {
 ExternalLink,
 Headphones,
 Link2,
 Mic,
 Play,
 Repeat,
 RotateCcw,
 Square,
 Volume2,
} from "lucide-react";
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

import type { ShadowingRecordingItem } from "../hooks/useShadowingSession";
import { formatDurationSeconds } from "../model/time-format";
import { ShadowingRecordings } from "./ShadowingRecordings";

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

function ShadowingStatusLine({
 isRecording,
 recordingDurationSeconds,
 showLatestBanner,
 latestRecording,
 isPlayingLatest,
 needsTapToPlay,
 recorderErrorCode,
 buttonSize,
 onTogglePlayLatest,
}: {
 isRecording: boolean;
 recordingDurationSeconds: number;
 showLatestBanner: boolean;
 latestRecording?: ShadowingRecordingItem;
 isPlayingLatest: boolean;
 needsTapToPlay: boolean;
 recorderErrorCode: string;
 buttonSize: ComponentProps<typeof Button>["size"];
 onTogglePlayLatest: () => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const recorderErrorText =
  recorderErrorCode === "permission-denied"
   ? t("recorderErrors.permissionDenied")
   : recorderErrorCode === "unsupported"
     ? t("recorderErrors.unsupported")
     : recorderErrorCode === "recording-failed"
       ? t("recorderErrors.recordingFailed")
       : "";

 return (
  <div aria-live="polite" className="grid min-w-0 gap-1">
   {isRecording ? (
    <Typography as="p" variant="caption" tone="danger" className="flex items-center gap-2">
     <span aria-hidden="true" className="size-2 shrink-0 animate-pulse rounded-full bg-danger" />
     {t("status.recording", { duration: formatDurationSeconds(recordingDurationSeconds) })}
    </Typography>
   ) : null}

   {showLatestBanner && latestRecording ? (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
     <Typography as="p" variant="caption" tone="secondary" clamp="one">
      {t("status.recordedLatest", {
       number: latestRecording.attemptNumber,
       duration: formatDurationSeconds(latestRecording.durationSeconds),
      })}
     </Typography>
     <Button
      type="button"
      variant={isPlayingLatest ? "active" : "outline"}
      size={buttonSize}
      aria-pressed={isPlayingLatest}
      onClick={onTogglePlayLatest}
     >
      {isPlayingLatest ? (
       <Square data-icon="inline-start" aria-hidden="true" />
      ) : (
       <Play data-icon="inline-start" aria-hidden="true" />
      )}
      {isPlayingLatest ? t("status.stopLatest") : t("status.playLatest")}
     </Button>
    </div>
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
 );
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
 recordings,
 canNavigateTimed,
 loopEnabled,
 playbackRate,
 modeSwitchSlot,
 dictationSlot,
 isDictationMode = false,
 onStartShadowing,
 onStopShadowing,
 onReplaySentence,
 onToggleLoop,
 onPlaybackRateChange,
 onDeleteRecording,
 onOpenRecordingsDialog,
 onOpenChangeVideoDialog,
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
 recordings: ShadowingRecordingItem[];
 canNavigateTimed: boolean;
 loopEnabled: boolean;
 playbackRate: PlaybackRateKey;
 modeSwitchSlot?: ReactNode;
 dictationSlot?: ReactNode;
 isDictationMode?: boolean;
 onStartShadowing: () => void;
 onStopShadowing: () => void;
 onReplaySentence: () => void;
 onToggleLoop: () => void;
 onPlaybackRateChange: (rate: PlaybackRateKey) => void;
 onDeleteRecording: (id: string) => void;
 onOpenRecordingsDialog: () => void;
 onOpenChangeVideoDialog: () => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const isDesktop = useSyncExternalStore(
  subscribeDesktopMedia,
  getDesktopSnapshot,
  getServerDesktopSnapshot,
 );
 const [playingLatestId, setPlayingLatestId] = useState("");

 const buttonSize = isDesktop ? "toolbar" : "touch";
 const iconButtonSize = isDesktop ? "icon-toolbar" : "icon";
 const segmentedDensity = isDesktop ? "toolbar" : "touch";
 const hasPlayerError = playerErrorCode !== 0;

 const latestRecording = recordings[0];
 const showLatestBanner =
  !isDesktop && !isDictationMode && !isShadowing && !isRecording && Boolean(latestRecording);
 const isPlayingLatest = Boolean(latestRecording && playingLatestId === latestRecording.id);

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

 const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

 return (
  <Card
   variant="section"
   padding="sm"
   className={
    isDictationMode
     ? "grid min-h-0 min-w-0 content-start gap-2 overflow-y-auto scrollbar-soft lg:h-full lg:gap-3"
     : "grid min-w-0 gap-2 lg:h-full lg:min-h-0 lg:content-start lg:gap-3 lg:overflow-y-auto lg:scrollbar-soft"
   }
  >
   {modeSwitchSlot ? (
    <div className="flex min-w-0 items-start justify-between gap-2">
     <div className="min-w-0 flex-1">{modeSwitchSlot}</div>
     <Button
      type="button"
      variant="outline"
      size="icon-toolbar"
      aria-label={t("controls.changeVideo")}
      title={t("controls.changeVideo")}
      className="shrink-0 lg:hidden"
      onClick={onOpenChangeVideoDialog}
     >
      <Link2 aria-hidden="true" />
     </Button>
    </div>
   ) : null}

   <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] sm:items-start sm:gap-3 lg:grid-cols-1">
    <div
     className={
      isDictationMode
       ? "flex w-full justify-center overflow-hidden rounded-lg bg-bg-subtle"
       : "aspect-video w-full overflow-hidden rounded-lg bg-bg-subtle"
     }
    >
     <div
      className={isDictationMode ? "aspect-video h-36 max-w-full sm:h-auto sm:w-full" : "size-full"}
     >
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
    </div>

    <div className="grid min-w-0 gap-2">
     {videoTitle ? (
      <Typography as="h2" variant="cardTitle" clamp="two" className="hidden lg:block">
       {videoTitle}
      </Typography>
     ) : null}

     {isDictationMode && dictationSlot ? (
      dictationSlot
     ) : (
      <>
       <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
         {isShadowing || isRecording ? (
          <Button
           type="button"
           variant="destructive"
           size={buttonSize}
           aria-pressed="true"
           className="flex-1 lg:flex-none"
           onClick={() => {
            setPlayingLatestId("");
            onStopShadowing();
           }}
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
           className="flex-1 lg:flex-none"
           onClick={() => {
            setPlayingLatestId("");
            onStartShadowing();
           }}
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

         {!modeSwitchSlot ? (
          <Button
           type="button"
           variant="outline"
           size={iconButtonSize}
           aria-label={t("controls.changeVideo")}
           title={t("controls.changeVideo")}
           className="lg:hidden"
           onClick={onOpenChangeVideoDialog}
          >
           <Link2 aria-hidden="true" />
          </Button>
         ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
         <Button
          type="button"
          variant="outline"
          size={buttonSize}
          disabled={recordings.length === 0}
          className="lg:hidden"
          onClick={onOpenRecordingsDialog}
         >
          <Volume2 data-icon="inline-start" aria-hidden="true" />
          {t("controls.recordingsButton", { count: recordings.length })}
         </Button>

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

       <ShadowingStatusLine
        isRecording={isRecording}
        recordingDurationSeconds={recordingDurationSeconds}
        showLatestBanner={showLatestBanner}
        latestRecording={latestRecording}
        isPlayingLatest={isPlayingLatest}
        needsTapToPlay={needsTapToPlay}
        recorderErrorCode={recorderErrorCode}
        buttonSize={buttonSize}
        onTogglePlayLatest={() => {
         if (!latestRecording) return;
         setPlayingLatestId((current) =>
          current === latestRecording.id ? "" : latestRecording.id,
         );
        }}
       />

       <Typography
        as="p"
        variant="caption"
        tone="muted"
        className="hidden items-center gap-2 lg:flex"
       >
        <Headphones aria-hidden="true" className="size-4 shrink-0" />
        <span>{t("hints.headphones")}</span>
       </Typography>
      </>
     )}
    </div>
   </div>

   {!isDictationMode && isDesktop ? (
    <div className="grid min-w-0 gap-3">
     <Separator />
     <ShadowingRecordings recordings={recordings} onDelete={onDeleteRecording} />
    </div>
   ) : null}

   {isPlayingLatest && latestRecording ? (
    <audio
     hidden
     autoPlay
     src={latestRecording.url}
     onEnded={() => setPlayingLatestId("")}
     onError={() => setPlayingLatestId("")}
    />
   ) : null}
  </Card>
 );
}
