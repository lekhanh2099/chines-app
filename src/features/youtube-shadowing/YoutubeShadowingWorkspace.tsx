"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AudioLines, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";

import { ManualScriptDialog } from "./components/ManualScriptDialog";
import {
 ShadowingNoScriptPanel,
 noScriptPanelVariantSchema,
} from "./components/ShadowingNoScriptPanel";
import {
 ShadowingPlayerPanel,
 playbackRateKeySchema,
 type PlaybackRateKey,
} from "./components/ShadowingPlayerPanel";
import { ShadowingRecordings } from "./components/ShadowingRecordings";
import {
 ShadowingScriptList,
 scriptDisplayModeSchema,
 type ScriptDisplayMode,
} from "./components/ShadowingScriptList";
import { YoutubeLinkForm } from "./components/YoutubeLinkForm";
import { useShadowingSession } from "./hooks/useShadowingSession";
import { useYoutubePlayer } from "./hooks/useYoutubePlayer";
import { useYoutubeTranscript } from "./hooks/useYoutubeTranscript";
import type { ParsedManualScript } from "./model/manual-script";
import { findActiveSegmentIndex } from "./model/transcript-segments";
import {
 youtubeVideoIdSchema,
 type TranscriptSegment,
 type YoutubeTranscriptResponse,
} from "./model/youtube-transcript.schemas";

const RATE_VALUE_BY_KEY: Record<PlaybackRateKey, number> = {
 "0.5": 0.5,
 "0.75": 0.75,
 "1": 1,
};

const XL_MEDIA_QUERY = "(min-width: 1280px)";

function subscribeXlMedia(callback: () => void) {
 if (typeof window === "undefined") return () => {};
 const query = window.matchMedia(XL_MEDIA_QUERY);
 query.addEventListener("change", callback);
 return () => query.removeEventListener("change", callback);
}

function getXlSnapshot() {
 if (typeof window === "undefined") return false;
 return window.matchMedia(XL_MEDIA_QUERY).matches;
}

function getServerXlSnapshot() {
 return false;
}

function ScriptLoadingSkeleton() {
 return (
  <Card variant="section" padding="md" className="grid min-w-0 gap-3" aria-busy="true">
   <div className="h-9 w-2/3 animate-pulse rounded-lg bg-bg-subtle" />
   <div className="grid gap-2">
    <div className="h-12 w-full animate-pulse rounded-lg bg-bg-subtle" />
    <div className="h-12 w-full animate-pulse rounded-lg bg-bg-subtle" />
    <div className="h-12 w-full animate-pulse rounded-lg bg-bg-subtle" />
    <div className="h-12 w-full animate-pulse rounded-lg bg-bg-subtle" />
    <div className="h-12 w-full animate-pulse rounded-lg bg-bg-subtle" />
   </div>
  </Card>
 );
}

function ShadowingActiveSession({
 videoId,
 transcriptData,
 isTranscriptPending,
 isTranscriptError,
 transcriptErrorCode,
 onRetryTranscript,
 onFocusLinkInput,
}: {
 videoId: string;
 transcriptData?: YoutubeTranscriptResponse;
 isTranscriptPending: boolean;
 isTranscriptError: boolean;
 transcriptErrorCode: string;
 onRetryTranscript: () => void;
 onFocusLinkInput: () => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const player = useYoutubePlayer(videoId);

 const [manualScript, setManualScript] = useState<ParsedManualScript>({
  segments: [],
  isTimed: false,
  timedCount: 0,
 });
 const [manualActiveIndex, setManualActiveIndex] = useState(0);
 const [displayMode, setDisplayMode] = useState<ScriptDisplayMode>(
  scriptDisplayModeSchema.enum.hanzi,
 );
 const [loopEnabled, setLoopEnabled] = useState(false);
 const [loopIndex, setLoopIndex] = useState(-1);
 const [playbackRate, setPlaybackRate] = useState<PlaybackRateKey>(playbackRateKeySchema.enum["1"]);
 const [manualDialogOpen, setManualDialogOpen] = useState(false);

 const hasManualScript = manualScript.segments.length > 0;
 const effectiveSegments: TranscriptSegment[] = useMemo(() => {
  if (hasManualScript) return manualScript.segments;
  if (transcriptData?.outcome === "ready") return transcriptData.segments;
  return [];
 }, [hasManualScript, manualScript.segments, transcriptData]);
 const isTimed = hasManualScript ? manualScript.isTimed : transcriptData?.outcome === "ready";
 const scriptLanguage = hasManualScript
  ? t("script.manualBadge")
  : (transcriptData?.language ?? "");

 const timedActiveIndex = isTimed
  ? findActiveSegmentIndex(effectiveSegments, player.currentMs)
  : -1;
 const activeIndex = isTimed
  ? timedActiveIndex
  : effectiveSegments.length > 0
    ? Math.min(manualActiveIndex, effectiveSegments.length - 1)
    : -1;

 const session = useShadowingSession({ player, activeIndex });

 useEffect(() => {
  if (!loopEnabled || !isTimed || !player.isPlaying) return;
  const targetSegment = effectiveSegments[loopIndex];
  if (!targetSegment || targetSegment.endMs <= targetSegment.startMs) return;
  if (player.currentMs >= targetSegment.endMs) {
   player.seekTo(targetSegment.startMs);
  }
 }, [effectiveSegments, isTimed, loopEnabled, loopIndex, player]);

 const handlePlaybackRateChange = useCallback(
  (nextRate: PlaybackRateKey) => {
   setPlaybackRate(nextRate);
   player.setRate(RATE_VALUE_BY_KEY[nextRate]);
  },
  [player],
 );

 const handleReplaySentence = useCallback(() => {
  if (!isTimed || effectiveSegments.length === 0) return;
  const targetIndex = activeIndex >= 0 ? activeIndex : 0;
  const segment = effectiveSegments[targetIndex];
  if (!segment) return;
  player.seekTo(segment.startMs);
  player.play();
 }, [activeIndex, effectiveSegments, isTimed, player]);

 const handleToggleLoop = useCallback(() => {
  if (!isTimed || effectiveSegments.length === 0) return;
  setLoopEnabled((current) => {
   const next = !current;
   if (next) {
    setLoopIndex(activeIndex >= 0 ? activeIndex : 0);
   }
   return next;
  });
 }, [activeIndex, effectiveSegments.length, isTimed]);

 const handleSelectSegment = useCallback(
  (index: number) => {
   const segment = effectiveSegments[index];
   if (!segment) return;
   if (isTimed) {
    if (loopEnabled) setLoopIndex(index);
    player.seekTo(segment.startMs);
   } else {
    setManualActiveIndex(index);
   }
  },
  [effectiveSegments, isTimed, loopEnabled, player],
 );

 const handleStepManual = useCallback(
  (delta: number) => {
   setManualActiveIndex((current) =>
    Math.max(0, Math.min(effectiveSegments.length - 1, current + delta)),
   );
  },
  [effectiveSegments.length],
 );

 const handleApplyManualScript = useCallback((parsed: ParsedManualScript) => {
  setManualScript(parsed);
  setManualActiveIndex(0);
  setLoopEnabled(false);
  setLoopIndex(-1);
 }, []);

 const videoDurationMs =
  player.durationMs > 0 ? player.durationMs : (transcriptData?.lengthSeconds ?? 0) * 1000;
 const isXlLayout = useSyncExternalStore(subscribeXlMedia, getXlSnapshot, getServerXlSnapshot);
 const recordingsView = (
  <ShadowingRecordings recordings={session.recordings} onDelete={session.deleteRecording} />
 );

 return (
  <>
   <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
    <ShadowingPlayerPanel
     videoId={videoId}
     videoTitle={transcriptData?.title ?? ""}
     playerContainerRef={player.containerRef}
     playerErrorCode={player.errorCode}
     isShadowing={session.isShadowing}
     isRecording={session.isRecording}
     isRequestingMic={session.isRequestingMic}
     isRecorderSupported={session.isRecorderSupported}
     recordingDurationSeconds={session.recordingDurationSeconds}
     recorderErrorCode={session.recorderErrorCode}
     needsTapToPlay={session.needsTapToPlay}
     canNavigateTimed={isTimed && effectiveSegments.length > 0}
     loopEnabled={loopEnabled}
     playbackRate={playbackRate}
     onStartShadowing={() => void session.startShadowing()}
     onStopShadowing={session.stopShadowing}
     onReplaySentence={handleReplaySentence}
     onToggleLoop={handleToggleLoop}
     onPlaybackRateChange={handlePlaybackRateChange}
     recordingsSlot={isXlLayout ? recordingsView : undefined}
    />

    <div className="min-w-0">
     {effectiveSegments.length > 0 ? (
      <ShadowingScriptList
       segments={effectiveSegments}
       isTimed={isTimed}
       language={scriptLanguage}
       activeIndex={activeIndex}
       isPlaying={player.isPlaying}
       displayMode={displayMode}
       onDisplayModeChange={setDisplayMode}
       onSelectSegment={handleSelectSegment}
       onOpenManualDialog={() => setManualDialogOpen(true)}
       onStepManual={handleStepManual}
      />
     ) : isTranscriptPending ? (
      <ScriptLoadingSkeleton />
     ) : isTranscriptError ? (
      <ShadowingNoScriptPanel
       variant={noScriptPanelVariantSchema.enum["fetch-error"]}
       errorCode={transcriptErrorCode}
       availableLanguages={[]}
       onOpenManualDialog={() => setManualDialogOpen(true)}
       onFocusLinkInput={onFocusLinkInput}
       onRetry={onRetryTranscript}
      />
     ) : (
      <ShadowingNoScriptPanel
       variant={noScriptPanelVariantSchema.enum["no-captions"]}
       availableLanguages={transcriptData?.availableLanguages ?? []}
       onOpenManualDialog={() => setManualDialogOpen(true)}
       onFocusLinkInput={onFocusLinkInput}
      />
     )}
    </div>

    {!isXlLayout ? (
     <Card variant="section" padding="md" className="min-w-0">
      {recordingsView}
     </Card>
    ) : null}
   </div>

   <ManualScriptDialog
    open={manualDialogOpen}
    onOpenChange={setManualDialogOpen}
    durationMs={videoDurationMs}
    onApply={handleApplyManualScript}
   />
  </>
 );
}

export function YoutubeShadowingWorkspace() {
 const t = useTranslations("YoutubeShadowing");
 const searchParams = useSearchParams();
 const linkInputRef = useRef<HTMLInputElement>(null);

 const rawVideoId = searchParams.get("v") ?? "";
 const parsedVideoId = youtubeVideoIdSchema.safeParse(rawVideoId);
 const videoId = parsedVideoId.success ? parsedVideoId.data : "";

 const transcriptQuery = useYoutubeTranscript(videoId);
 const isTooLong = transcriptQuery.data?.outcome === "too-long";
 const tooLongMinutes = transcriptQuery.data
  ? Math.ceil(transcriptQuery.data.lengthSeconds / 60)
  : 0;

 const focusLinkInput = useCallback(() => {
  linkInputRef.current?.focus();
  linkInputRef.current?.select();
 }, []);

 if (!videoId) {
  return (
   <div className="grid min-w-0 gap-5">
    <div className="flex min-w-0 items-start gap-3 border-b border-border-default pb-4">
     <IconTile tone="accent" size="md">
      <AudioLines aria-hidden="true" />
     </IconTile>
     <PageHeader
      title={t("empty.title")}
      description={t("empty.description")}
      className="min-w-0 flex-1"
     />
    </div>

    <Card variant="section" padding="lg" className="grid min-w-0 gap-4">
     <YoutubeLinkForm inputRef={linkInputRef} />
     <ul className="grid gap-1.5">
      <li>
       <Typography as="span" variant="bodySmall" tone="secondary">
        {t("empty.tip1")}
       </Typography>
      </li>
      <li>
       <Typography as="span" variant="bodySmall" tone="secondary">
        {t("empty.tip2")}
       </Typography>
      </li>
      <li>
       <Typography as="span" variant="bodySmall" tone="secondary">
        {t("empty.tip3")}
       </Typography>
      </li>
     </ul>
    </Card>
   </div>
  );
 }

 if (isTooLong) {
  return (
   <div className="grid min-w-0 gap-5">
    <Card variant="section" padding="lg" className="grid min-w-0 gap-4">
     <div className="flex min-w-0 items-start gap-3">
      <IconTile tone="warning" size="md">
       <Clock aria-hidden="true" />
      </IconTile>
      <div className="grid min-w-0 gap-1">
       <Typography as="h1" variant="sectionTitle">
        {t("tooLong.title")}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="secondary" role="alert">
        {t("tooLong.description", { minutes: tooLongMinutes })}
       </Typography>
      </div>
     </div>
     <YoutubeLinkForm inputRef={linkInputRef} />
    </Card>
   </div>
  );
 }

 return (
  <div className="grid min-w-0 gap-4">
   <YoutubeLinkForm
    key={`form-${videoId}`}
    initialValue={`https://www.youtube.com/watch?v=${videoId}`}
    density="compact"
    inputRef={linkInputRef}
   />

   <ShadowingActiveSession
    key={videoId}
    videoId={videoId}
    transcriptData={transcriptQuery.data}
    isTranscriptPending={transcriptQuery.isPending}
    isTranscriptError={transcriptQuery.isError}
    transcriptErrorCode={transcriptQuery.error?.name ?? ""}
    onRetryTranscript={() => void transcriptQuery.refetch()}
    onFocusLinkInput={focusLinkInput}
   />
  </div>
 );
}
