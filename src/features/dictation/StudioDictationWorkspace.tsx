"use client";

import { useTranslations } from "next-intl";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useClientSession } from "@/components/providers/QueryProvider";
import { useUnsavedDraftGuard } from "@/components/layout/navigation/UnsavedDraftNavigationGuard";
import type { SegmentedControlItem } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { StudioDictationModePicker } from "./StudioDictationModePicker";
import { StudioDictationPracticeView } from "./StudioDictationPracticeView";
import { StudioDictationResumeNotices } from "./StudioDictationResumeNotices";
import {
 StudioDictationLessonLoadStatus,
 StudioDictationSourcePicker,
} from "./StudioDictationSourcePicker";
import {
 type DictationSource,
 dictationSourceTypeFor,
 recentSourceFromSelection,
 recentSourceResumeSearch,
 recentSourceStoragePrefix,
} from "./studio-dictation-source-utils";
import { useDictationPlayback } from "./useDictationPlayback";
import {
 useStudioDictationPracticeFlow,
 useStudioDictationRecentSource,
} from "./useStudioDictationPracticeFlow";
import { useStudioDictationResume } from "./useStudioDictationResume";
import { useStudioDictationSource } from "./useStudioDictationSource";

export type StudioDictationWorkspaceProps = {
 initialReaderDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialReaderResource: ReaderDocumentResource | null;
 initialReaderCourseResource: ReaderDocumentResource | null;
 initialDictationLessons: ReadonlyArray<HanziHomeLesson>;
};

export function StudioDictationWorkspace({
 initialReaderDocuments,
 initialReaderResource,
 initialReaderCourseResource,
 initialDictationLessons,
}: StudioDictationWorkspaceProps) {
 const t = useTranslations("Dictation");
 const requestNavigation = useUnsavedDraftGuard(false);
 const { userId, isResolved } = useClientSession();
 const recentSourceStorageKey = `${recentSourceStoragePrefix}:${userId ?? "guest"}`;
 const tts = useSharedMandarinTts();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const requestedDocumentId = searchParams.get("documentId") ?? "";
 const requestedReaderDocumentId = searchParams.get("readerDocumentId") ?? "";
 const requestedClipId = searchParams.get("clipId") ?? "";
 const resumeRequested = searchParams.get("resume") === "1";
 const recent = useStudioDictationRecentSource(recentSourceStorageKey, isResolved);
 const { recentSource, ownerReady, hasCurrentRecentSource } = recent;
 const flow = useStudioDictationPracticeFlow();
 const {
  resumePending,
  setResumePending,
  resumeUnavailable,
  setResumeUnavailable,
  manualSelectionOpen,
  setManualSelectionOpen,
  playbackMode,
  setPlaybackMode,
  modeConfirmed,
  setModeConfirmed,
  practiceStarted,
  setPracticeStarted,
 } = flow;
 const source = useStudioDictationSource({
  initialReaderDocuments,
  initialReaderResource,
  initialReaderCourseResource,
  initialDictationLessons,
  requestedDocumentId,
  requestedReaderDocumentId,
  requestedClipId,
  practiceStarted,
  t,
 });
 const { currentReaderResource, selectedSection, selectedClip, sourceEntries } = source;
 const playback = useDictationPlayback({
  entries: sourceEntries,
  enabled: practiceStarted && ownerReady,
  playWholePassage: playbackMode === "passage",
  loadVoices: tts.loadVoices,
  stop: tts.stop,
  speakSequence: tts.speakSequence,
  pause: tts.pause,
  resume: tts.resume,
  isLoading: tts.isLoading,
  isPaused: tts.isPaused,
  isSpeaking: tts.isSpeaking,
 });
 const { resetPlayback } = playback;
 const resetPracticeFlow = () => {
  resetPlayback();
  flow.setScriptMode("hidden");
  setModeConfirmed(false);
  setPracticeStarted(false);
  flow.setCheckedEntryIds(new Set());
  setResumePending(false);
  setResumeUnavailable(false);
 };

 useStudioDictationResume({
  isResolved,
  recentSourceStorageKey,
  requestedDocumentId,
  requestedReaderDocumentId,
  requestedClipId,
  resumeRequested,
  initialDictationLessons,
  initialReaderDocuments,
  recent,
  flow,
  source,
  resetPlayback,
  tts,
 });

 const resumeRecent = () => {
  source.setSelectedBookId(recentSource.bookId);
  source.setSelectedVolumeId(recentSource.volumeId);
  source.setSelectedLessonId(recentSource.lessonId);
  source.setSelectedSectionId(recentSource.sectionId);
  source.setSelectedReaderDocumentId(recentSource.readerDocumentId);
  source.setSelectedClipId(recentSource.clipId);
  source.setSourceType(dictationSourceTypeFor(recentSource.documentId, recentSource.clipId));
  resetPracticeFlow();
  setManualSelectionOpen(false);
  setModeConfirmed(true);
  setResumePending(true);
  router.push(`${pathname}?${recentSourceResumeSearch(recentSource)}`, { scroll: false });
 };
 const selectReaderDocument = (documentId: string) => {
  source.setSelectedReaderDocumentId(documentId);
  const next = new URLSearchParams(searchParams.toString());
  next.set("readerDocumentId", documentId);
  router.push(`${pathname}?${next.toString()}`, { scroll: false });
  resetPracticeFlow();
 };
 const startPractice = () => {
  if (isResolved && source.sourceType !== "custom") {
   recent.rememberRecentSource(recentSourceFromSelection(source, requestedDocumentId));
  }
  setResumeUnavailable(false);
  setPracticeStarted(true);
 };
 const openSourcePicker = () => {
  setManualSelectionOpen(true);
  resetPracticeFlow();
 };

 const sourceOptions: SegmentedControlItem<DictationSource>[] = [
  { key: "lesson", label: t("lessonSource") },
  { key: "library", label: t("librarySource") },
  { key: "custom", label: t("customSource") },
 ];
 if (requestedDocumentId.length > 0) {
  sourceOptions.unshift({ key: "reader", label: t("readerSource") });
 }
 const sourcePickerVisible =
  !resumePending &&
  (!practiceStarted || sourceEntries.length === 0) &&
  (!hasCurrentRecentSource ||
   manualSelectionOpen ||
   (practiceStarted && sourceEntries.length === 0) ||
   (!resumeRequested &&
    (requestedDocumentId.length > 0 ||
     requestedReaderDocumentId.length > 0 ||
     requestedClipId.length > 0)));
 const playbackModeLabel =
  playbackMode === "sentence"
   ? t("sentenceMode")
   : playbackMode === "paragraph"
     ? t("paragraphMode")
     : t("passageMode");
 const titleZh =
  currentReaderResource?.document.title_zh ??
  selectedSection?.titleZh ??
  selectedClip?.title ??
  t("customTitle");
 const titleVi =
  currentReaderResource?.document.title_vi ||
  selectedSection?.titleVi ||
  selectedClip?.title ||
  t("sourceFallback");

 return (
  <div className="grid min-w-0 gap-4" style={{ display: ownerReady ? undefined : "none" }}>
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     {t("heading")}
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     {t("description")}
    </Typography>
   </div>

   <StudioDictationResumeNotices
    showRecentSource={hasCurrentRecentSource && !practiceStarted && !resumePending}
    recentTitle={recentSource.title}
    manualSelectionOpen={manualSelectionOpen}
    resumePending={resumePending}
    resumeUnavailable={resumeUnavailable}
    onResumeRecent={resumeRecent}
    onToggleManualSelection={() => setManualSelectionOpen((current) => !current)}
    onCancelResume={() => {
     setManualSelectionOpen(true);
     resetPracticeFlow();
     router.replace(pathname, { scroll: false });
    }}
   />

   <StudioDictationSourcePicker
    source={source}
    visible={sourcePickerVisible}
    practiceStarted={practiceStarted}
    modeConfirmed={modeConfirmed}
    sourceOptions={sourceOptions}
    initialDictationLessons={initialDictationLessons}
    initialReaderDocuments={initialReaderDocuments}
    onReaderDocumentChange={selectReaderDocument}
    onReset={resetPracticeFlow}
    onConfirmSource={() => setModeConfirmed(true)}
   />

   <StudioDictationLessonLoadStatus source={source} />
   {sourceEntries.length > 0 && modeConfirmed && !practiceStarted && !resumePending ? (
    <StudioDictationModePicker
     playbackMode={playbackMode}
     playbackModeLabel={playbackModeLabel}
     titleZh={titleZh}
     entryCount={sourceEntries.length}
     onPlaybackModeChange={setPlaybackMode}
     onChangeSource={openSourcePicker}
     onStart={startPractice}
    />
   ) : null}
   {sourceEntries.length > 0 && practiceStarted ? (
    <StudioDictationPracticeView
     source={source}
     flow={flow}
     playback={playback}
     tts={tts}
     titleZh={titleZh}
     titleVi={titleVi}
     playbackModeLabel={playbackModeLabel}
     onChangeMode={() => requestNavigation(() => setPracticeStarted(false))}
     onChangeSource={() => requestNavigation(openSourcePicker)}
    />
   ) : null}
  </div>
 );
}
