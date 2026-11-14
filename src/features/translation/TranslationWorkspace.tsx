"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Typography } from "@/components/ui/display/typography";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { TranslationDirection } from "@/features/hanzihome/practice/translation-practice";
import type { HumanitiesDocumentResource } from "@/features/humanities/model/humanities-resource.schemas";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { HumanitiesPracticeTrack } from "@/features/humanities/humanities-practice-content";

import {
 createTranslationSubmission,
 translationResourceSegments,
 translationSourceKind,
 translationTrackDocuments,
} from "./translation-workspace-utils";
import { TranslationAnswerPanel } from "./TranslationAnswerPanel";
import { TranslationAttemptHistory } from "./TranslationAttemptHistory";
import { TranslationInterpretingPanel } from "./TranslationInterpretingPanel";
import { TranslationLessonGuide, TranslationLessonHeader } from "./TranslationLessonHeader";
import { TranslationSourcePanel } from "./TranslationSourcePanel";
import { TranslationTrackGuide } from "./TranslationTrackGuide";
import { useTranslationAnswerDrafts } from "./useTranslationAnswerDrafts";
import { useTranslationAttempts } from "./useTranslationAttempts";
import { useTranslationDocumentNavigation } from "./useTranslationDocumentNavigation";
import { useTranslationPreparation } from "./useTranslationPreparation";

export function TranslationWorkspace({
 initialDocuments,
 initialResource,
}: {
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: HumanitiesDocumentResource | null;
}) {
 const t = useTranslations("HumanitiesPractice");
 const tts = useSharedMandarinTts();
 const searchParams = useSearchParams();
 const [activeTrack, setActiveTrack] = useState<HumanitiesPracticeTrack>(() =>
  searchParams.get("track") === "interpreting" ? "interpreting" : "translation",
 );
 const [directionPreference, setDirectionPreference] = useState<TranslationDirection | null>(null);
 const [activeIndex, setActiveIndex] = useState(0);
 const [replayCount, setReplayCount] = useState(0);
 const requestedDocumentId = searchParams.get("document") ?? "";
 const selectedIdValue = initialDocuments.some((document) => document.id === requestedDocumentId)
  ? requestedDocumentId
  : "";
 const resource = selectedIdValue.length > 0 ? initialResource : null;
 const trackTitle =
  activeTrack === "translation" ? t("tracks.translation.title") : t("tracks.interpreting.title");
 const segments = useMemo(
  () => (resource ? translationResourceSegments(resource) : []),
  [resource],
 );
 const segment = segments[activeIndex];
 const evaluation = resource?.exerciseItems.find((item) => item.payload.evaluation)?.payload
  .evaluation;
 const direction = directionPreference ?? evaluation?.direction ?? "zh-vi";
 const humanitiesEvaluation =
  evaluation !== undefined && evaluation.direction === direction ? evaluation : undefined;
 const isInterpreting = humanitiesEvaluation?.mode === "interpreting";
 const preparation = useTranslationPreparation(segment?.id ?? "", direction, humanitiesEvaluation);
 const key = segment ? `${segment.id}:${direction}` : "";
 const { historyQuery, submitAttempt, saveError, clearSaveError } = useTranslationAttempts(
  segment?.id ?? "",
 );
 const answerDrafts = useTranslationAnswerDrafts({
  selectedIdValue,
  recordingContext: { contentId: segment?.id ?? "", direction },
  submitAttempt,
  saveError,
  clearSaveError,
 });
 const {
  drafts,
  setDrafts,
  backTranslations,
  setBackTranslations,
  checked,
  setChecked,
  startedAtRef,
  requestNavigation,
  recorder,
  resetDocumentDrafts,
 } = answerDrafts;
 const draft = key ? (drafts[key] ?? "") : "";
 const backTranslation = key ? (backTranslations[key] ?? "") : "";
 const isChecked = key ? checked[key] === true : false;

 const { selectDocument, clearDocument } = useTranslationDocumentNavigation({
  resetDocumentDrafts,
  clearSaveError,
 });

 const updateDraft = (value: string) => {
  if (!key) return;
  if (value.trim() && startedAtRef.current[key] === undefined)
   startedAtRef.current[key] = Date.now();
  setDrafts((current) => ({ ...current, [key]: value }));
  setChecked((current) => ({ ...current, [key]: false }));
 };

 const checkAnswer = (submittedAt: number) => {
  if (!segment || !key || !draft.trim()) return;
  const startedAt = startedAtRef.current[key];
  const responseMs = startedAt === undefined ? null : Math.max(0, submittedAt - startedAt);
  const { payload } = createTranslationSubmission(
   segment,
   direction,
   draft,
   responseMs,
   humanitiesEvaluation,
  );
  delete startedAtRef.current[key];
  setChecked((current) => ({ ...current, [key]: true }));
  clearSaveError();
  submitAttempt(payload);
 };

 const trackDocuments = translationTrackDocuments(initialDocuments, activeTrack);
 if (trackDocuments.length === 0) {
  return (
   <Typography variant="bodySmall" tone="muted">
    {t("empty")}
   </Typography>
  );
 }

 if (selectedIdValue.length === 0) {
  return (
   <TranslationTrackGuide
    activeTrack={activeTrack}
    trackTitle={trackTitle}
    trackDocuments={trackDocuments}
    onTrackChange={setActiveTrack}
    onSelectDocument={(documentId) => {
     requestNavigation(() => {
      selectDocument(documentId);
      setActiveIndex(0);
      setDirectionPreference(null);
      setReplayCount(0);
      preparation.reset();
      answerDrafts.setUnitMarks({});
      recorder.clear();
     });
    }}
   />
  );
 }

 if (resource === null || segment === undefined) {
  return (
   <Typography variant="bodySmall" tone="muted">
    {t("detail.missingContent")}
   </Typography>
  );
 }
 const selectedLessonIndex = Math.max(
  1,
  trackDocuments.findIndex((document) => document.id === selectedIdValue) + 1,
 );
 const selectedPayload = resource.exerciseItems.find((item) => item.payload.evaluation)?.payload;
 const practiceMetadata = selectedPayload?.translation ?? selectedPayload?.interpreting;

 return (
  <div className="grid min-w-0 gap-3">
   <TranslationLessonHeader
    activeTrack={activeTrack}
    trackTitle={trackTitle}
    document={resource.document}
    trackDocuments={trackDocuments}
    selectedLessonIndex={selectedLessonIndex}
    onBack={() => {
     requestNavigation(() => {
      clearDocument();
      setActiveIndex(0);
     });
    }}
    onLessonList={() => requestNavigation(clearDocument)}
    onOpenDocument={(documentId) => requestNavigation(() => selectDocument(documentId))}
    onSelectTrack={(track) => {
     requestNavigation(() => {
      setActiveTrack(track);
      clearDocument();
     });
    }}
   />
   <TranslationLessonGuide
    activeTrack={activeTrack}
    lessonCount={trackDocuments.length}
    hasPracticeMetadata={practiceMetadata !== undefined}
    humanitiesEvaluation={humanitiesEvaluation}
   />
   <TranslationAttemptHistory historyQuery={historyQuery} />
   <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
    <TranslationSourcePanel
     segment={segment}
     direction={direction}
     titleVi={resource.document.title_vi}
     sourceKind={translationSourceKind(resource.document)}
     totalSegments={segments.length}
     glossary={selectedPayload?.glossary}
     onDirectionChange={setDirectionPreference}
    />
    <TranslationAnswerPanel
     activeTrack={activeTrack}
     segment={segment}
     direction={direction}
     humanitiesEvaluation={humanitiesEvaluation}
     interpretingPanel={
      isInterpreting ? (
       <TranslationInterpretingPanel
        context={{ contentId: segment.id, direction }}
        evaluation={humanitiesEvaluation}
        preparationRemaining={preparation.remaining}
        interpretingNotes={answerDrafts.interpretingNotes}
        learnerTranscript={answerDrafts.learnerTranscript}
        unitMarks={answerDrafts.unitMarks}
        recorder={recorder}
        startRecording={answerDrafts.startRecording}
        submitAttempt={submitAttempt}
        onInterpretingNotesChange={answerDrafts.setInterpretingNotes}
        onLearnerTranscriptChange={answerDrafts.setLearnerTranscript}
        onUnitMarksChange={answerDrafts.setUnitMarks}
       />
      ) : null
     }
     draft={draft}
     backTranslation={backTranslation}
     isChecked={isChecked}
     saveError={saveError}
     activeIndex={activeIndex}
     segmentCount={segments.length}
     replayCount={replayCount}
     submitAttempt={submitAttempt}
     onDraftChange={updateDraft}
     onCheck={() => checkAnswer(Date.now())}
     onPreviousSegment={() => {
      tts.stop();
      setActiveIndex((index) => index - 1);
     }}
     onNextSegment={() => {
      tts.stop();
      setActiveIndex((index) => index + 1);
     }}
     onPlaySource={() => {
      setReplayCount((count) => count + 1);
      tts.speakSequence([segment.zh]);
     }}
     onBackTranslationChange={(value) =>
      setBackTranslations((current) => ({ ...current, [key]: value }))
     }
    />
   </div>
  </div>
 );
}
