"use client";

import { useTranslations } from "next-intl";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import {
 SegmentedControl,
 type SegmentedControlItem,
} from "@/components/ui/forms/segmented-control";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { useHanziHomeListeningLesson } from "@/features/hanzihome/listening/useHanziHomeListeningLesson";
import type { DictationAttempt } from "@/features/dictation/dictation-session";
import { StudioDictationPracticePanel } from "@/features/dictation/StudioDictationPracticePanel";
import { StudioDictationReferencePanel } from "@/features/dictation/StudioDictationReferencePanel";
import type { StudioDictationScriptMode } from "@/features/dictation/StudioDictationSettingsMenu";
import {
 itemsForListeningSection,
 transcriptsForListeningSection,
} from "@/features/hanzihome/listening/listening.view-model";
import { useTtsLibrary } from "@/features/hanzihome/tts/useTtsLibrary";
import {
 dictationBookOptions,
 dictationLessonSelection,
 dictationReaderDocumentId,
 readerDictationEntries,
 customDictationEntries,
 dictationLessonLabel,
 externalDictationEntry,
 READER_DICTATION_BOOK_ID,
} from "./dictation-workspace-utils";
import { useDictationAttempts } from "./useDictationAttempts";
import { useDictationPlayback } from "./useDictationPlayback";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

type DictationSource = "lesson" | "library" | "custom" | "reader";

export function StudioDictationWorkspace({
 initialReaderDocuments,
 initialReaderResource,
 initialReaderCourseResource,
 initialDictationLessons,
}: {
 initialReaderDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialReaderResource: ReaderDocumentResource | null;
 initialReaderCourseResource: ReaderDocumentResource | null;
 initialDictationLessons: ReadonlyArray<HanziHomeLesson>;
}) {
 const t = useTranslations("Dictation");
 const tts = useSharedMandarinTts();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const requestedDocumentId = searchParams.get("documentId") ?? "";
 const requestedReaderDocumentId = searchParams.get("readerDocumentId") ?? "";
 const requestedClipId = searchParams.get("clipId") ?? "";
 const [selectedLessonIdState, setSelectedLessonId] = useState("");
 const [selectedBookIdState, setSelectedBookId] = useState("");
 const [selectedVolumeIdState, setSelectedVolumeId] = useState("");
 const [selectedSectionId, setSelectedSectionId] = useState("");
 const [selectedReaderDocumentIdState, setSelectedReaderDocumentId] = useState("");
 const [sourceType, setSourceType] = useState<DictationSource>(
  requestedDocumentId.length > 0 ? "reader" : requestedClipId.length > 0 ? "library" : "lesson",
 );
 const [selectedClipId, setSelectedClipId] = useState(requestedClipId);
 const [customText, setCustomText] = useState("");
 const [playbackMode, setPlaybackMode] = useState<"sentence" | "paragraph" | "passage">("sentence");
 const [modeConfirmed, setModeConfirmed] = useState(false);
 const [practiceStarted, setPracticeStarted] = useState(false);
 const [checkedEntryIds, setCheckedEntryIds] = useState<Set<string>>(() => new Set());
 const { persistAttempt: saveAttempt, attemptSaveError } = useDictationAttempts();
 const [scriptMode, setScriptMode] = useState<StudioDictationScriptMode>("hidden");
 const ttsLibraryQuery = useTtsLibrary(sourceType === "library");
 const bookOptions = useMemo(
  () => dictationBookOptions(initialDictationLessons),
  [initialDictationLessons],
 );
 const {
  selectedBookId,
  selectedBook,
  isReaderCoursePack,
  selectedVolumeId,
  visibleLessons,
  selectedLessonId,
 } = useMemo(
  () =>
   dictationLessonSelection(
    initialDictationLessons,
    bookOptions,
    selectedBookIdState,
    selectedVolumeIdState,
    selectedLessonIdState,
   ),
  [
   initialDictationLessons,
   bookOptions,
   selectedBookIdState,
   selectedVolumeIdState,
   selectedLessonIdState,
  ],
 );
 const selectedReaderDocumentId = dictationReaderDocumentId(
  initialReaderDocuments,
  selectedReaderDocumentIdState,
  requestedReaderDocumentId,
 );
 const selectedReaderResource =
  isReaderCoursePack && selectedReaderDocumentId === requestedReaderDocumentId
   ? initialReaderCourseResource
   : isReaderCoursePack && selectedReaderDocumentId === initialReaderDocuments[0]?.id
     ? initialReaderCourseResource
     : null;
 const bundleQuery = useHanziHomeListeningLesson(
  sourceType === "lesson" && !isReaderCoursePack ? selectedLessonId : "",
 );
 const selectedSection = useMemo(
  () =>
   bundleQuery.data?.sections.find((section) => section.id === selectedSectionId) ??
   bundleQuery.data?.sections[0],
  [bundleQuery.data?.sections, selectedSectionId],
 );
 const selectedItems = useMemo(
  () =>
   bundleQuery.data && selectedSection
    ? itemsForListeningSection(bundleQuery.data, selectedSection.id)
    : [],
  [bundleQuery.data, selectedSection],
 );
 const transcriptEntries = useMemo(
  () => (selectedSection ? transcriptsForListeningSection(selectedSection, selectedItems) : []),
  [selectedItems, selectedSection],
 );
 const effectiveSelectedClipId = selectedClipId || ttsLibraryQuery.data?.clips[0]?.id || "";
 const selectedClip = ttsLibraryQuery.data?.clips.find(
  (clip) => clip.id === effectiveSelectedClipId,
 );
 const sourceEntries = useMemo(() => {
  if (sourceType === "reader") {
   return readerDictationEntries(initialReaderResource?.paragraphs ?? [], (number) =>
    t("paragraph", { number }),
   );
  }
  if (sourceType === "lesson" && isReaderCoursePack) {
   return readerDictationEntries(selectedReaderResource?.paragraphs ?? [], (number) =>
    t("paragraph", { number }),
   );
  }
  if (sourceType === "lesson") return transcriptEntries;
  if (sourceType === "library") {
   return selectedClip === undefined
    ? []
    : [externalDictationEntry(`tts:${selectedClip.id}`, selectedClip.text, selectedClip.title)];
  }
  return customDictationEntries(customText, t("pasted"), practiceStarted);
 }, [
  customText,
  initialReaderResource?.paragraphs,
  selectedReaderResource?.paragraphs,
  isReaderCoursePack,
  selectedClip,
  sourceType,
  transcriptEntries,
  practiceStarted,
  t,
 ]);
 const {
  effectiveActiveEntryIndex,
  loopCurrent,
  autoAdvance,
  resetPlayback,
  selectTransportEntry,
  playTransport,
  toggleTransportPlayback,
  changeTransportLoop,
  changeTransportAutoAdvance,
 } = useDictationPlayback({
  entries: sourceEntries,
  enabled: practiceStarted,
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
 const resetPracticeFlow = () => {
  resetPlayback();
  setScriptMode("hidden");
  setModeConfirmed(false);
  setPracticeStarted(false);
  setCheckedEntryIds(new Set());
 };

 const persistAttempt = (attempt: DictationAttempt) => {
  setCheckedEntryIds((current) => new Set(current).add(attempt.entryId));
  saveAttempt(attempt);
 };

 const sourceOptions: SegmentedControlItem<DictationSource>[] = [
  { key: "lesson", label: t("lessonSource") },
  { key: "library", label: t("librarySource") },
  { key: "custom", label: t("customSource") },
 ];
 if (requestedDocumentId.length > 0) {
  sourceOptions.unshift({ key: "reader", label: t("readerSource") });
 }

 return (
  <div className="grid min-w-0 gap-4">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     {t("heading")}
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     {t("description")}
    </Typography>
   </div>

   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="muted" className="block">
       {practiceStarted ? t("stepPractice") : modeConfirmed ? t("stepMode") : t("stepSource")}
      </Typography>
      <Typography as="h2" variant="cardTitle" weight="black">
       {t("chooseContent")}
      </Typography>
     </div>
     {sourceType === "lesson" ? (
      <Badge casing="natural">
       {t("lessons", {
        count: isReaderCoursePack ? initialReaderDocuments.length : visibleLessons.length,
       })}
      </Badge>
     ) : null}
    </div>
    <Typography variant="bodySmall" tone="muted">
     {t("sourceHelp")}
    </Typography>
    {initialDictationLessons.length === 0 ? (
     <Typography variant="bodySmall" tone="muted">
      {t("emptyContent")}
     </Typography>
    ) : (
     <div className="grid gap-3">
      <SegmentedControl<DictationSource>
       value={sourceType}
       items={sourceOptions}
       onChange={(value) => {
        setSourceType(value);
        resetPracticeFlow();
       }}
       density="touch"
       layout="wrap"
       aria-label={t("sourceAria")}
      />
      {sourceType === "lesson" ? (
       <>
        <div className="grid gap-2" aria-label={t("bookAria")}>
         <Typography variant="caption" tone="muted" weight="black">
          {t("books")}
         </Typography>
         <div className="flex flex-wrap gap-2">
          {bookOptions.map((book) => (
           <Button
            key={book.id}
            type="button"
            size="sm"
            variant={selectedBookId === book.id ? "active" : "outline"}
            onClick={() => {
             setSelectedBookId(book.id);
             setSelectedVolumeId(book.volumes[0]?.id ?? "");
             setSelectedLessonId("");
             setSelectedReaderDocumentId("");
             setSelectedSectionId("");
             resetPracticeFlow();
            }}
           >
            {book.id === READER_DICTATION_BOOK_ID ? t("readerBook") : book.title}
           </Button>
          ))}
         </div>
        </div>
        {selectedBook && selectedBook.volumes.length > 1 ? (
         <div className="flex flex-wrap gap-2" aria-label={t("volumeAria")}>
          {selectedBook.volumes.map((volume) => (
           <Button
            key={volume.id}
            type="button"
            size="sm"
            variant={selectedVolumeId === volume.id ? "active" : "outline"}
            onClick={() => {
             setSelectedVolumeId(volume.id);
             setSelectedLessonId("");
             setSelectedSectionId("");
             resetPracticeFlow();
            }}
           >
            {volume.title}
           </Button>
          ))}
         </div>
        ) : null}
        {isReaderCoursePack && initialReaderDocuments.length > 0 ? (
         <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
           <Typography variant="caption" tone="muted" weight="black">
            {t("chooseLesson")}
           </Typography>
           <Typography variant="caption" tone="muted">
            {t("lessons", { count: initialReaderDocuments.length })}
           </Typography>
          </div>
          <Select
           value={selectedReaderDocumentId}
           onValueChange={(documentId) => {
            setSelectedReaderDocumentId(documentId);
            const next = new URLSearchParams(searchParams.toString());
            next.set("readerDocumentId", documentId);
            router.push(`${pathname}?${next.toString()}`, { scroll: false });
            resetPracticeFlow();
           }}
          >
           <SelectTrigger aria-label={t("readerLessonAria")}>
            <SelectValue placeholder={t("chooseLesson")} />
           </SelectTrigger>
           <SelectContent>
            <SelectGroup>
             {initialReaderDocuments.map((document) => (
              <SelectItem key={document.id} value={document.id}>
               {t("lessonNumber", { number: document.reading_number ?? "" })} · {document.title_zh}{" "}
               · {document.title_vi}
              </SelectItem>
             ))}
            </SelectGroup>
           </SelectContent>
          </Select>
         </div>
        ) : null}
        {!isReaderCoursePack && visibleLessons.length > 0 ? (
         <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
           <Typography variant="caption" tone="muted" weight="black">
            {t("chooseLesson")}
           </Typography>
           <Typography variant="caption" tone="muted">
            {t("lessons", { count: visibleLessons.length })}
           </Typography>
          </div>
          <Select
           value={selectedLessonId || visibleLessons[0]?.id}
           onValueChange={(lessonId) => {
            setSelectedLessonId(lessonId);
            setSelectedSectionId("");
            resetPracticeFlow();
           }}
          >
           <SelectTrigger aria-label={t("lessonAria")}>
            <SelectValue placeholder={t("chooseLesson")} />
           </SelectTrigger>
           <SelectContent>
            <SelectGroup>
             {visibleLessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
               {dictationLessonLabel(lesson)}
              </SelectItem>
             ))}
            </SelectGroup>
           </SelectContent>
          </Select>
         </div>
        ) : null}
       </>
      ) : null}
      {sourceType === "reader" ? (
       initialReaderResource === null ? (
        <Typography variant="bodySmall" tone="danger">
         {t("missingReader")}
        </Typography>
       ) : (
        <Typography variant="bodySmall" tone="muted">
         {initialReaderResource.document.title_zh} ·{" "}
         {t("paragraphs", { count: initialReaderResource.paragraphs.length })}
        </Typography>
       )
      ) : null}
      {sourceType === "library" ? (
       ttsLibraryQuery.isPending ? (
        <Typography variant="bodySmall" tone="muted">
         {t("libraryLoading")}
        </Typography>
       ) : ttsLibraryQuery.isError ? (
        <QueryErrorCard
         title={t("loadError")}
         description={t("loadErrorHelp")}
         retryLabel={t("retry")}
         onRetry={() => {
          void ttsLibraryQuery.refetch();
         }}
        />
       ) : ttsLibraryQuery.data?.clips.length === 0 ? (
        <Typography variant="bodySmall" tone="muted">
         {t("emptyLibrary")}
        </Typography>
       ) : (
        <Select
         value={selectedClipId || ttsLibraryQuery.data?.clips[0]?.id}
         onValueChange={(clipId) => {
          setSelectedClipId(clipId);
          resetPracticeFlow();
         }}
        >
         <SelectTrigger aria-label={t("clipAria")}>
          <SelectValue placeholder={t("chooseClip")} />
         </SelectTrigger>
         <SelectContent>
          <SelectGroup>
           {ttsLibraryQuery.data?.clips.map((clip) => (
            <SelectItem key={clip.id} value={clip.id}>
             {clip.title || clip.text.slice(0, 36)}
            </SelectItem>
           ))}
          </SelectGroup>
         </SelectContent>
        </Select>
       )
      ) : null}
      {sourceType === "custom" ? (
       <Textarea
        value={customText}
        onChange={(event) => {
         setCustomText(event.target.value);
         resetPracticeFlow();
        }}
        rows={5}
        lang="zh-CN"
        placeholder={t("customPlaceholder")}
        aria-label={t("customAria")}
       />
      ) : null}
      {sourceEntries.length > 0 && !modeConfirmed && !practiceStarted ? (
       <>
        <Typography variant="bodySmall" tone="muted">
         {t("nextStepHelp")}
        </Typography>
        <Button type="button" variant="default" onClick={() => setModeConfirmed(true)}>
         {t("enterPractice")}
        </Button>
       </>
      ) : null}
     </div>
    )}
   </Card>

   {sourceType === "lesson" &&
   !isReaderCoursePack &&
   selectedLessonId.length > 0 &&
   bundleQuery.isPending ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="muted">
      {t("lessonLoading")}
     </Typography>
    </Card>
   ) : null}
   {sourceType === "lesson" &&
   !isReaderCoursePack &&
   selectedLessonId.length > 0 &&
   bundleQuery.isError ? (
    <QueryErrorCard
     title={t("loadError")}
     description={t("loadErrorHelp")}
     retryLabel={t("retry")}
     onRetry={() => {
      void bundleQuery.refetch();
     }}
    />
   ) : null}
   {sourceEntries.length > 0 && modeConfirmed && !practiceStarted ? (
    <Card variant="section" padding="md" className="grid gap-4">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black">
       {t("chooseMode")}
      </Typography>
      <Typography variant="bodySmall" tone="muted">
       {t("modeHelp")}
      </Typography>
     </div>
     <div className="grid gap-2 sm:grid-cols-3">
      <Button
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant={playbackMode === "sentence" ? "active" : "surfaceCard"}
       onClick={() => setPlaybackMode("sentence")}
      >
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        {t("sentenceMode")}
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        {t("sentenceHelp")}
       </Typography>
      </Button>
      <Button
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant={playbackMode === "paragraph" ? "active" : "surfaceCard"}
       onClick={() => setPlaybackMode("paragraph")}
      >
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        {t("paragraphMode")}
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        {t("paragraphHelp")}
       </Typography>
      </Button>
      <Button
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant={playbackMode === "passage" ? "active" : "surfaceCard"}
       onClick={() => setPlaybackMode("passage")}
      >
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        {t("passageMode")}
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        {t("passageHelp")}
       </Typography>
      </Button>
     </div>
     <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
      <Typography variant="caption" tone="muted">
       {t("selected")}{" "}
       {playbackMode === "sentence"
        ? t("sentenceMode")
        : playbackMode === "paragraph"
          ? t("paragraphMode")
          : t("passageMode")}{" "}
       ·{" "}
       {initialReaderResource?.document.title_zh ??
        selectedReaderResource?.document.title_zh ??
        selectedSection?.titleZh ??
        selectedClip?.title ??
        t("customTitle")}{" "}
       · {t("sentences", { count: sourceEntries.length })}
      </Typography>
      <div className="flex flex-wrap gap-2">
       <Button type="button" variant="outline" onClick={resetPracticeFlow}>
        {t("changeSource")}
       </Button>
       <Button type="button" variant="default" onClick={() => setPracticeStarted(true)}>
        {t("start")}
       </Button>
      </div>
     </div>
    </Card>
   ) : null}
   {sourceEntries.length > 0 && practiceStarted ? (
    <div className="grid gap-4">
     <section className="flex flex-col gap-3 border-b border-border-default pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid min-w-0 gap-1">
       <Typography variant="overline" tone="accent" weight="black">
        {t("stepPractice")}
       </Typography>
       <Typography as="h2" variant="sectionTitle" weight="black" clamp="one">
        {initialReaderResource?.document.title_zh ??
         selectedReaderResource?.document.title_zh ??
         selectedSection?.titleZh ??
         selectedClip?.title ??
         t("customTitle")}
       </Typography>
       <Typography variant="bodySmall" tone="muted" clamp="one">
        {playbackMode === "sentence"
         ? t("sentenceMode")
         : playbackMode === "paragraph"
           ? t("paragraphMode")
           : t("passageMode")}{" "}
        ·{" "}
        {initialReaderResource?.document.title_vi ||
         selectedReaderResource?.document.title_vi ||
         selectedSection?.titleVi ||
         selectedClip?.title ||
         t("sourceFallback")}
       </Typography>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
       <Button type="button" variant="outline" onClick={() => setPracticeStarted(false)}>
        {t("changeMode")}
       </Button>
       <Button type="button" variant="outline" onClick={resetPracticeFlow}>
        {t("changeSource")}
       </Button>
      </div>
     </section>

     <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
       <StudioDictationPracticePanel
        activeIndex={effectiveActiveEntryIndex}
        autoAdvance={autoAdvance}
        checkedCount={checkedEntryIds.size}
        entries={sourceEntries}
        isLoading={tts.isLoading}
        isPaused={tts.isPaused}
        isSpeaking={tts.isSpeaking}
        loopCurrent={loopCurrent}
        rate={tts.rate}
        scriptMode={scriptMode}
        selectedVoiceName={tts.selectedVoiceName}
        voices={tts.voices}
        onAttempt={persistAttempt}
        onAutoAdvanceChange={changeTransportAutoAdvance}
        onLoopCurrentChange={changeTransportLoop}
        onNext={() =>
         selectTransportEntry(Math.min(sourceEntries.length - 1, effectiveActiveEntryIndex + 1))
        }
        onPlayToggle={toggleTransportPlayback}
        onPrevious={() => selectTransportEntry(Math.max(0, effectiveActiveEntryIndex - 1))}
        onRateChange={(next) => {
         tts.stop();
         tts.setRate(next);
        }}
        onRepeat={playTransport}
        onScriptModeChange={setScriptMode}
        onSelect={selectTransportEntry}
        onStop={tts.stop}
        onVoiceChange={(next) => {
         tts.stop();
         tts.setSelectedVoiceName(next);
        }}
       />
      </div>
      <aside className="min-w-0 xl:sticky xl:top-3 xl:self-start">
       <StudioDictationReferencePanel
        activeIndex={effectiveActiveEntryIndex}
        entries={sourceEntries}
        isPlaybackActive={tts.isLoading || tts.isPaused || tts.isSpeaking}
        sourceLabel={
         selectedBook?.title ||
         selectedSection?.titleVi ||
         selectedClip?.title ||
         t("currentLesson")
        }
        titleVi={
         initialReaderResource?.document.title_vi ||
         selectedReaderResource?.document.title_vi ||
         selectedSection?.titleVi ||
         selectedClip?.title ||
         t("sourceFallback")
        }
        titleZh={
         initialReaderResource?.document.title_zh ??
         selectedReaderResource?.document.title_zh ??
         selectedSection?.titleZh ??
         selectedClip?.title ??
         t("customTitle")
        }
       />
      </aside>
     </div>
     {attemptSaveError ? (
      <Typography variant="caption" tone="danger">
       {t("saveError")}
      </Typography>
     ) : null}
    </div>
   ) : null}
  </div>
 );
}
