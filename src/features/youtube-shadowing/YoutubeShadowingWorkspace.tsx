"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AudioLines, Clock, Headphones } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";

import { ManualScriptDialog } from "./components/ManualScriptDialog";
import { PracticeModeSwitch } from "./components/PracticeModeSwitch";
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
import { VideoDictationPanel } from "./components/VideoDictationPanel";
import { YoutubeLinkForm } from "./components/YoutubeLinkForm";
import { useSegmentPlayback } from "./hooks/useSegmentPlayback";
import { useShadowingSession } from "./hooks/useShadowingSession";
import { useVideoDictation } from "./hooks/useVideoDictation";
import { useYoutubePlayer } from "./hooks/useYoutubePlayer";
import { useYoutubeTranscript } from "./hooks/useYoutubeTranscript";
import type { ParsedManualScript } from "./model/manual-script";
import { parsePracticeMode, practiceModeSchema, type PracticeMode } from "./model/practice-mode";
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

function ScriptLoadingSkeleton() {
 return (
  <Card
   variant="section"
   padding="md"
   className="grid h-full min-h-0 min-w-0 content-start gap-3 overflow-y-auto"
   aria-busy="true"
  >
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
 requestedMode,
 transcriptData,
 isTranscriptPending,
 isTranscriptError,
 transcriptErrorCode,
 onRetryTranscript,
 onFocusLinkInput,
 onOpenChangeVideoDialog,
}: {
 videoId: string;
 requestedMode: PracticeMode;
 transcriptData?: YoutubeTranscriptResponse;
 isTranscriptPending: boolean;
 isTranscriptError: boolean;
 transcriptErrorCode: string;
 onRetryTranscript: () => void;
 onFocusLinkInput: () => void;
 onOpenChangeVideoDialog: () => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const player = useYoutubePlayer(videoId);

 const [manualScript, setManualScript] = useState<ParsedManualScript>({
  segments: [],
  isTimed: false,
  timedCount: 0,
 });
 const [displayMode, setDisplayMode] = useState<ScriptDisplayMode>(
  scriptDisplayModeSchema.enum.hanzi,
 );
 const [playbackRate, setPlaybackRate] = useState<PlaybackRateKey>(playbackRateKeySchema.enum["1"]);
 const [manualDialogOpen, setManualDialogOpen] = useState(false);
 const [recordingsDialogOpen, setRecordingsDialogOpen] = useState(false);

 const hasManualScript = manualScript.segments.length > 0;
 const effectiveSegments: TranscriptSegment[] = useMemo(() => {
  if (hasManualScript) return manualScript.segments;
  if (transcriptData?.outcome === "ready") return transcriptData.segments;
  return [];
 }, [hasManualScript, manualScript.segments, transcriptData]);
 const isTimed = hasManualScript ? manualScript.isTimed : transcriptData?.outcome === "ready";
 const canUseDictation = isTimed && effectiveSegments.length > 0;
 const isDictationMode = requestedMode === practiceModeSchema.enum.dictation && canUseDictation;
 const effectiveMode = isDictationMode
  ? practiceModeSchema.enum.dictation
  : practiceModeSchema.enum.shadowing;
 const scriptLanguage = hasManualScript
  ? t("script.manualBadge")
  : (transcriptData?.language ?? "");

 const playback = useSegmentPlayback({
  player,
  segments: effectiveSegments,
  isTimed,
 });

 const session = useShadowingSession({ player, activeIndex: playback.activeIndex });
 const dictation = useVideoDictation({
  segments: effectiveSegments,
  playSegment: playback.playSegment,
  cancelAutoStop: playback.cancelAutoStop,
 });

 const setPlayerRate = player.setRate;
 const handlePlaybackRateChange = useCallback(
  (nextRate: PlaybackRateKey) => {
   setPlaybackRate(nextRate);
   setPlayerRate(RATE_VALUE_BY_KEY[nextRate]);
  },
  [setPlayerRate],
 );

 const resetManualAndLoop = playback.resetManualAndLoop;
 const resetDictation = dictation.reset;
 const handleApplyManualScript = useCallback(
  (parsed: ParsedManualScript) => {
   setManualScript(parsed);
   resetManualAndLoop();
   resetDictation();
  },
  [resetDictation, resetManualAndLoop],
 );

 const stopShadowing = session.stopShadowing;
 const isShadowingOrRecording = session.isShadowing || session.isRecording;
 const disableLoop = playback.disableLoop;
 const cancelAutoStop = playback.cancelAutoStop;
 const handleBeforeModeChange = useCallback(
  (nextMode: PracticeMode) => {
   if (nextMode === practiceModeSchema.enum.dictation) {
    if (isShadowingOrRecording) stopShadowing();
    disableLoop();
   } else {
    cancelAutoStop();
   }
  },
  [cancelAutoStop, disableLoop, isShadowingOrRecording, stopShadowing],
 );

 const openManualDialog = useCallback(() => setManualDialogOpen(true), []);
 const openRecordingsDialog = useCallback(() => setRecordingsDialogOpen(true), []);

 const videoDurationMs =
  player.durationMs > 0 ? player.durationMs : (transcriptData?.lengthSeconds ?? 0) * 1000;

 return (
  <>
   <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden sm:gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:gap-4">
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
     recordings={session.recordings}
     canNavigateTimed={canUseDictation}
     loopEnabled={playback.loopEnabled}
     playbackRate={playbackRate}
     isDictationMode={isDictationMode}
     modeSwitchSlot={
      <PracticeModeSwitch
       value={effectiveMode}
       canUseDictation={canUseDictation}
       showUntimedHint={effectiveSegments.length > 0 && !isTimed}
       onBeforeChange={handleBeforeModeChange}
      />
     }
     dictationSlot={
      isDictationMode ? (
       <VideoDictationPanel
        currentIndex={dictation.currentIndex}
        totalSegments={effectiveSegments.length}
        expectedText={dictation.currentSegment?.text ?? ""}
        draft={dictation.draft}
        checked={dictation.checked}
        currentScore={dictation.currentResult?.score ?? 0}
        attemptedCount={dictation.summary.attempted}
        averageScore={dictation.summary.averageScore}
        playbackRate={playbackRate}
        hasPlayerError={player.errorCode !== 0}
        onDraftChange={dictation.setDraft}
        onCheck={dictation.check}
        onRetry={dictation.retry}
        onListen={dictation.listen}
        onPrevious={dictation.previous}
        onNext={dictation.next}
        onPlaybackRateChange={handlePlaybackRateChange}
       />
      ) : null
     }
     onStartShadowing={() => void session.startShadowing()}
     onStopShadowing={session.stopShadowing}
     onReplaySentence={playback.replayActive}
     onToggleLoop={playback.toggleLoop}
     onPlaybackRateChange={handlePlaybackRateChange}
     onDeleteRecording={session.deleteRecording}
     onOpenRecordingsDialog={openRecordingsDialog}
     onOpenChangeVideoDialog={onOpenChangeVideoDialog}
    />

    <div className="h-full min-h-0 min-w-0 overflow-hidden">
     {effectiveSegments.length > 0 ? (
      <ShadowingScriptList
       segments={effectiveSegments}
       isTimed={isTimed}
       language={scriptLanguage}
       activeIndex={isDictationMode ? dictation.currentIndex : playback.activeIndex}
       isPlaying={player.isPlaying}
       displayMode={displayMode}
       isDictationMode={isDictationMode}
       dictationScores={dictation.scores}
       onDisplayModeChange={setDisplayMode}
       onSelectSegment={isDictationMode ? dictation.goTo : playback.selectSegment}
       onOpenManualDialog={openManualDialog}
       onStepManual={playback.stepManual}
      />
     ) : isTranscriptPending ? (
      <ScriptLoadingSkeleton />
     ) : isTranscriptError ? (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain scrollbar-soft">
       <ShadowingNoScriptPanel
        variant={noScriptPanelVariantSchema.enum["fetch-error"]}
        errorCode={transcriptErrorCode}
        availableLanguages={[]}
        onOpenManualDialog={openManualDialog}
        onFocusLinkInput={onFocusLinkInput}
        onRetry={onRetryTranscript}
       />
      </div>
     ) : (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain scrollbar-soft">
       <ShadowingNoScriptPanel
        variant={noScriptPanelVariantSchema.enum["no-captions"]}
        availableLanguages={transcriptData?.availableLanguages ?? []}
        onOpenManualDialog={openManualDialog}
        onFocusLinkInput={onFocusLinkInput}
       />
      </div>
     )}
    </div>
   </div>

   <ManualScriptDialog
    open={manualDialogOpen}
    onOpenChange={setManualDialogOpen}
    durationMs={videoDurationMs}
    onApply={handleApplyManualScript}
   />

   <Dialog open={recordingsDialogOpen} onOpenChange={setRecordingsDialogOpen}>
    <DialogContent size="md" scrollMode="content" closeLabel={t("recordings.dialogClose")}>
     <DialogHeader>
      <DialogTitle>{t("recordings.dialogTitle")}</DialogTitle>
     </DialogHeader>
     <DialogBody>
      <Typography as="p" variant="caption" tone="muted" className="flex items-center gap-2">
       <Headphones aria-hidden="true" className="size-4 shrink-0" />
       <span>{t("hints.headphones")}</span>
      </Typography>
      <ShadowingRecordings recordings={session.recordings} onDelete={session.deleteRecording} />
     </DialogBody>
    </DialogContent>
   </Dialog>
  </>
 );
}

export function YoutubeShadowingWorkspace() {
 const t = useTranslations("YoutubeShadowing");
 const searchParams = useSearchParams();
 const linkInputRef = useRef<HTMLInputElement>(null);
 const [changeVideoOpen, setChangeVideoOpen] = useState(false);

 const rawVideoId = searchParams.get("v") ?? "";
 const parsedVideoId = youtubeVideoIdSchema.safeParse(rawVideoId);
 const videoId = parsedVideoId.success ? parsedVideoId.data : "";
 const requestedMode = parsePracticeMode(searchParams.get("mode") ?? "");

 const transcriptQuery = useYoutubeTranscript(videoId);
 const isTooLong = transcriptQuery.data?.outcome === "too-long";
 const tooLongMinutes = transcriptQuery.data
  ? Math.ceil(transcriptQuery.data.lengthSeconds / 60)
  : 0;

 const focusLinkInput = useCallback(() => {
  if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
   setChangeVideoOpen(true);
   return;
  }
  linkInputRef.current?.focus();
  linkInputRef.current?.select();
 }, []);

 const openChangeVideoDialog = useCallback(() => setChangeVideoOpen(true), []);

 if (!videoId) {
  return (
   <PageContainer>
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
   </PageContainer>
  );
 }

 if (isTooLong) {
  return (
   <PageContainer>
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
   </PageContainer>
  );
 }

 return (
  <div
   data-page
   className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-hidden px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 lg:px-5"
  >
   <div className="hidden shrink-0 lg:block">
    <YoutubeLinkForm
     key={`form-${videoId}`}
     initialValue={`https://www.youtube.com/watch?v=${videoId}`}
     density="compact"
     inputRef={linkInputRef}
    />
   </div>

   <ShadowingActiveSession
    key={videoId}
    videoId={videoId}
    requestedMode={requestedMode}
    transcriptData={transcriptQuery.data}
    isTranscriptPending={transcriptQuery.isPending}
    isTranscriptError={transcriptQuery.isError}
    transcriptErrorCode={transcriptQuery.error?.name ?? ""}
    onRetryTranscript={() => void transcriptQuery.refetch()}
    onFocusLinkInput={focusLinkInput}
    onOpenChangeVideoDialog={openChangeVideoDialog}
   />

   <Dialog open={changeVideoOpen} onOpenChange={setChangeVideoOpen}>
    <DialogContent size="md" scrollMode="content" closeLabel={t("changeVideoDialog.close")}>
     <DialogHeader>
      <DialogTitle>{t("changeVideoDialog.title")}</DialogTitle>
      <DialogDescription>{t("changeVideoDialog.description")}</DialogDescription>
     </DialogHeader>
     <DialogBody>
      <YoutubeLinkForm
       key={`dialog-form-${videoId}`}
       initialValue={`https://www.youtube.com/watch?v=${videoId}`}
       onSubmitted={() => setChangeVideoOpen(false)}
      />
     </DialogBody>
    </DialogContent>
   </Dialog>
  </div>
 );
}
