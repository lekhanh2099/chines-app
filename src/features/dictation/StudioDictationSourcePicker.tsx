"use client";

import { useTranslations } from "next-intl";
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
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { StudioDictationLessonPicker } from "./StudioDictationLessonPicker";
import type { DictationSource } from "./studio-dictation-source-utils";
import type { StudioDictationSourceState } from "./useStudioDictationSource";

/** Step 1: choose the dictation content (lesson, Reader, TTS library clip or pasted text). */
export function StudioDictationSourcePicker({
 source,
 visible,
 practiceStarted,
 modeConfirmed,
 sourceOptions,
 initialDictationLessons,
 initialReaderDocuments,
 onReaderDocumentChange,
 onReset,
 onConfirmSource,
}: {
 source: StudioDictationSourceState;
 visible: boolean;
 practiceStarted: boolean;
 modeConfirmed: boolean;
 sourceOptions: SegmentedControlItem<DictationSource>[];
 initialDictationLessons: ReadonlyArray<HanziHomeLesson>;
 initialReaderDocuments: ReadonlyArray<ReaderDocumentRow>;
 onReaderDocumentChange: (documentId: string) => void;
 onReset: () => void;
 onConfirmSource: () => void;
}) {
 const t = useTranslations("Dictation");
 const {
  sourceType,
  setSourceType,
  isReaderCoursePack,
  visibleLessons,
  currentReaderResource,
  ttsLibraryQuery,
  selectedClipId,
  setSelectedClipId,
  customText,
  setCustomText,
  sourceEntries,
 } = source;
 return (
  <Card
   variant="section"
   padding="md"
   className="grid gap-3"
   style={{ display: visible ? undefined : "none" }}
  >
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
       onReset();
      }}
      density="touch"
      layout="wrap"
      aria-label={t("sourceAria")}
     />
     {sourceType === "lesson" ? (
      <StudioDictationLessonPicker
       source={source}
       initialReaderDocuments={initialReaderDocuments}
       onReaderDocumentChange={onReaderDocumentChange}
       onReset={onReset}
      />
     ) : null}
     {sourceType === "reader" ? (
      currentReaderResource === null ? (
       <Typography variant="bodySmall" tone="danger">
        {t("missingReader")}
       </Typography>
      ) : (
       <Typography variant="bodySmall" tone="muted">
        {currentReaderResource.document.title_zh} ·{" "}
        {t("paragraphs", { count: currentReaderResource.paragraphs.length })}
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
         onReset();
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
        onReset();
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
       <Button type="button" variant="default" onClick={onConfirmSource}>
        {t("enterPractice")}
       </Button>
      </>
     ) : null}
    </div>
   )}
  </Card>
 );
}

/** Loading and error states for the selected HanziHome lesson's listening bundle. */
export function StudioDictationLessonLoadStatus({
 source,
}: {
 source: StudioDictationSourceState;
}) {
 const t = useTranslations("Dictation");
 const { sourceType, isReaderCoursePack, selectedLessonId, bundleQuery } = source;
 const lessonBundleRequested =
  sourceType === "lesson" && !isReaderCoursePack && selectedLessonId.length > 0;
 return (
  <>
   {lessonBundleRequested && bundleQuery.isPending ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="muted">
      {t("lessonLoading")}
     </Typography>
    </Card>
   ) : null}
   {lessonBundleRequested && bundleQuery.isError ? (
    <QueryErrorCard
     title={t("loadError")}
     description={t("loadErrorHelp")}
     retryLabel={t("retry")}
     onRetry={() => {
      void bundleQuery.refetch();
     }}
    />
   ) : null}
  </>
 );
}
