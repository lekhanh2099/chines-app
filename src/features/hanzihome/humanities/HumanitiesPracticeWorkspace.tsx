"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 ReaderHanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import {
 fetchPracticeAttempts,
 savePracticeAttempt,
} from "@/features/hanzihome/practice/practice-attempt-api";
import {
 createTranslationAttempt,
 scoreTranslationAttempt,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { ReaderDocumentResource } from "@/features/hanzihome/reader/reader-content-api";
import type { ReaderDocumentRow } from "@/features/hanzihome/reader/reader.schemas";
import { useShadowingRecorder } from "@/features/hanzihome/reader/useShadowingRecorder";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { evaluateHumanitiesAnswer, type HumanitiesEvaluationResult } from "./humanities-evaluator";
import {
 humanitiesPracticeContent,
 type HumanitiesPracticeTrack,
} from "./humanities-practice-content";

function sourceKind(resource: ReaderDocumentResource["document"]): string {
 const value = resource.source_metadata.source_kind;
 return typeof value === "string" ? value : "humanities";
}

function courseModuleOrder(track: HumanitiesPracticeTrack, lessonIndex: number): number {
 if (track === "translation") {
  if (lessonIndex === 1) return 1;
  if (lessonIndex <= 6) return 6;
  if (lessonIndex <= 10) return 7;
  if (lessonIndex <= 15) return 8;
  return 9;
 }
 if (lessonIndex === 1) return 1;
 if (lessonIndex <= 3) return 10;
 if (lessonIndex <= 5) return 11;
 return 12;
}

type HumanitiesUnitMark = "kept" | "partial" | "missed" | "unsure";
const interpretingMarks = [
 "kept",
 "partial",
 "missed",
 "unsure",
] satisfies readonly HumanitiesUnitMark[];

export function HumanitiesPracticeWorkspace({
 initialDocuments,
 initialResource,
}: {
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
}) {
 const t = useTranslations("HumanitiesPractice");
 const tts = useSharedMandarinTts();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [activeTrack, setActiveTrack] = useState<HumanitiesPracticeTrack>(() =>
  searchParams.get("track") === "interpreting" ? "interpreting" : "translation",
 );
 const [directionPreference, setDirectionPreference] = useState<TranslationDirection | null>(null);
 const [activeIndex, setActiveIndex] = useState(0);
 const [drafts, setDrafts] = useState<Record<string, string>>({});
 const [backTranslations, setBackTranslations] = useState<Record<string, string>>({});
 const [checked, setChecked] = useState<Record<string, boolean>>({});
 const [humanitiesResult, setHumanitiesResult] = useState<HumanitiesEvaluationResult | null>(null);
 const [replayCount, setReplayCount] = useState(0);
 const [preparationState, setPreparationState] = useState({ key: "", remaining: 0 });
 const [interpretingNotes, setInterpretingNotes] = useState("");
 const [learnerTranscript, setLearnerTranscript] = useState("");
 const [unitMarks, setUnitMarks] = useState<Record<string, HumanitiesUnitMark>>({});
 const [saveError, setSaveError] = useState("");
 const startedAtRef = useRef<Record<string, number>>({});
 const lastRecordingRef = useRef<Blob | null>(null);
 const recorder = useShadowingRecorder();
 const requestedDocumentId = searchParams.get("document") ?? "";
 const selectedIdValue = initialDocuments.some((document) => document.id === requestedDocumentId)
  ? requestedDocumentId
  : "";
 const resource = selectedIdValue.length > 0 ? initialResource : null;
 const content = humanitiesPracticeContent[activeTrack];
 const trackTitle =
  activeTrack === "translation" ? t("tracks.translation.title") : t("tracks.interpreting.title");
 const trackDescription =
  activeTrack === "translation"
   ? t("tracks.translation.description")
   : t("tracks.interpreting.description");
 const markLabel = (mark: HumanitiesUnitMark) => {
  if (mark === "kept") return t("answer.marks.kept");
  if (mark === "partial") return t("answer.marks.partial");
  if (mark === "missed") return t("answer.marks.missed");
  return t("answer.marks.unsure");
 };
 const selectDocument = (documentId: string) => {
  const next = new URLSearchParams(searchParams.toString());
  next.set("document", documentId);
  router.push(`${pathname}?${next.toString()}`, { scroll: false });
 };
 const clearDocument = () => {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("document");
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };
 const segments = useMemo(
  () =>
   resource?.paragraphs.map((paragraph) => ({
    id: paragraph.id,
    order: paragraph.paragraph_order,
    sourceLabel: "Bài đọc Humanities",
    zh: paragraph.zh,
    pinyin: paragraph.pinyin,
    vi: paragraph.vi,
   })) ?? [],
  [resource],
 );
 const segment = segments[activeIndex];
 const evaluation = resource?.exerciseItems.find((item) => item.payload.evaluation)?.payload
  .evaluation;
 const direction = directionPreference ?? evaluation?.direction ?? "zh-vi";
 const humanitiesEvaluation =
  evaluation !== undefined && evaluation.direction === direction ? evaluation : undefined;
 const isInterpreting = humanitiesEvaluation?.mode === "interpreting";
 const preparationKey = `${segment?.id ?? ""}:${direction}`;
 const preparationLimit = isInterpreting ? (humanitiesEvaluation.preparationSeconds ?? 0) : 0;
 const preparationRemaining =
  preparationState.key === preparationKey ? preparationState.remaining : preparationLimit;
 const key = segment ? `${segment.id}:${direction}` : "";
 const historyQuery = useQuery({
  queryKey: hanzihomeQueryKeys.practiceAttempts("translation", segment?.id ?? ""),
  queryFn: () => fetchPracticeAttempts({ surface: "translation", contentId: segment?.id ?? "" }),
  enabled: segment !== undefined,
  staleTime: 0,
 });
 const draft = key ? (drafts[key] ?? "") : "";
 const backTranslation = key ? (backTranslations[key] ?? "") : "";
 const isChecked = key ? checked[key] === true : false;
 const score =
  segment && isChecked
   ? (humanitiesResult?.score ?? scoreTranslationAttempt(segment, direction, draft))
   : null;

 useEffect(() => {
  if (!isInterpreting || preparationRemaining <= 0) return;
  const timer = window.setTimeout(
   () =>
    setPreparationState((current) => ({
     key: preparationKey,
     remaining: Math.max(
      0,
      (current.key === preparationKey ? current.remaining : preparationLimit) - 1,
     ),
    })),
   1_000,
  );
  return () => window.clearTimeout(timer);
 }, [isInterpreting, preparationKey, preparationLimit, preparationRemaining]);

 useEffect(() => {
  if (!isInterpreting || segment === undefined || recorder.audioBlob === null) return;
  if (lastRecordingRef.current === recorder.audioBlob) return;
  lastRecordingRef.current = recorder.audioBlob;
  void savePracticeAttempt({
   surface: "translation",
   contentId: segment.id,
   direction,
   answer: {
    kind: "interpreting-recording",
    transcript: learnerTranscript,
    notes: interpretingNotes,
    unitMarks,
    durationSeconds: recorder.durationSeconds,
   },
   scorePercent: null,
   responseMs: recorder.durationSeconds * 1_000,
  }).catch((error: Error) => setSaveError(error.message));
 }, [
  direction,
  interpretingNotes,
  isInterpreting,
  learnerTranscript,
  recorder.audioBlob,
  recorder.durationSeconds,
  segment,
  unitMarks,
 ]);

 const updateDraft = (value: string) => {
  if (!key) return;
  if (value.trim() && startedAtRef.current[key] === undefined)
   startedAtRef.current[key] = Date.now();
  setDrafts((current) => ({ ...current, [key]: value }));
  setChecked((current) => ({ ...current, [key]: false }));
  setHumanitiesResult(null);
 };

 const checkAnswer = (submittedAt: number) => {
  if (!segment || !key || !draft.trim()) return;
  const startedAt = startedAtRef.current[key];
  const responseMs = startedAt === undefined ? null : Math.max(0, submittedAt - startedAt);
  const attempt = createTranslationAttempt(segment, direction, draft, responseMs);
  const evaluationResult =
   humanitiesEvaluation === undefined
    ? null
    : evaluateHumanitiesAnswer(draft, humanitiesEvaluation);
  delete startedAtRef.current[key];
  setHumanitiesResult(evaluationResult);
  setChecked((current) => ({ ...current, [key]: true }));
  setSaveError("");
  void savePracticeAttempt({
   surface: "translation",
   contentId: segment.id,
   direction,
   answer: {
    answer: attempt.answer,
    reference:
     humanitiesEvaluation?.references[0]?.text ?? (direction === "zh-vi" ? segment.vi : segment.zh),
    missingUnitIds: evaluationResult?.missingRequiredUnitIds ?? [],
   },
   scorePercent: evaluationResult?.score ?? attempt.score,
   responseMs: attempt.responseMs,
  })
   .then(() => historyQuery.refetch())
   .catch((error: Error) => setSaveError(error.message));
 };

 const trackDocuments = initialDocuments.filter((document) => sourceKind(document) === activeTrack);
 if (trackDocuments.length === 0) {
  return (
   <Typography variant="bodySmall" tone="muted">
    {t("empty")}
   </Typography>
  );
 }

 if (selectedIdValue.length === 0) {
  return (
   <div className="grid min-w-0 gap-5">
    <header className="grid gap-2">
     <Typography as="span" variant="overline" tone="accent" weight="black">
      {t("eyebrow")}
     </Typography>
     <Typography as="h1" variant="pageTitle" weight="black">
      {trackTitle}
     </Typography>
     <Typography as="p" variant="body" tone="muted" className="max-w-3xl">
      {trackDescription}
     </Typography>
    </header>
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t("nav.aria")}>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/humanities">{t("nav.humanities")}</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/reader">{t("nav.reader")}</Link>
     </Button>
     <div className="col-span-2 sm:col-span-3">
      <SegmentedControl<HumanitiesPracticeTrack>
       value={activeTrack}
       items={[
        { key: "translation", label: t("tracks.translation.title") },
        { key: "interpreting", label: t("tracks.interpreting.title") },
       ]}
       onChange={setActiveTrack}
       aria-label={t("nav.chooseTrack")}
      />
     </div>
    </nav>
    <Card variant="section" padding="md" className="grid gap-3">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="grid gap-1">
       <Typography as="span" variant="caption" tone="accent" weight="black">
        {t("guide.beginner")}
       </Typography>
       <Typography as="h2" variant="sectionTitle" weight="black">
        {trackTitle}
       </Typography>
      </div>
      <Badge>{t("guide.count", { count: trackDocuments.length })}</Badge>
     </div>
     <Typography as="p" variant="bodySmall" tone="muted">
      {content.definition}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("guide.chooseFoundation")}
     </Typography>
     <Card variant="subtle" padding="sm" className="grid gap-1">
      <Typography as="strong" variant="caption" tone="accent" weight="black">
       {t("guide.startHere")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {content.beginnerStart}
      </Typography>
     </Card>
    </Card>
    <section className="grid gap-3" aria-labelledby="humanities-practice-levels">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-practice-levels">
       {t("guide.levelsTitle")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("guide.levelsDescription")}
      </Typography>
     </div>
     <div className="grid gap-3 md:grid-cols-3">
      {content.levels.map((level, index) => (
       <Card key={level.title} variant="subtle" padding="md" className="grid gap-2">
        <Badge variant="purple" className="justify-self-start">
         {index + 1}
        </Badge>
        <Typography as="h3" variant="cardTitle" weight="black">
         {level.title}
        </Typography>
        <Typography as="p" variant="bodySmall" tone="muted">
         {level.description}
        </Typography>
       </Card>
      ))}
     </div>
    </section>
    <section className="grid gap-3" aria-labelledby="humanities-foundation-lessons">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-foundation-lessons">
       {t("guide.foundationTitle")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("guide.foundationDescription")}
      </Typography>
     </div>
     <div className="grid gap-2">
      {content.foundationLessons.map((lesson, index) => (
       <Card asChild key={lesson.title} variant="default" padding="none" className="group">
        <details open={index === 0}>
         <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 p-3 [&::-webkit-details-marker]:hidden">
          <Badge variant="purple">{index + 1}</Badge>
          <span className="grid gap-1">
           <Typography as="strong" variant="bodySmall" weight="black">
            {lesson.title}
           </Typography>
           <Typography as="span" variant="caption" tone="muted">
            {lesson.question}
           </Typography>
          </span>
         </summary>
         <div className="grid gap-2 border-t border-border-default p-4">
          <Typography as="p" variant="bodySmall" tone="muted">
           {lesson.explanation}
          </Typography>
          <Typography as="p" variant="caption" tone="muted">
           {t("guide.understood")}
          </Typography>
         </div>
        </details>
       </Card>
      ))}
     </div>
    </section>
    <section className="grid gap-3 lg:grid-cols-2">
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       {t("guide.knowledge")}
      </Typography>
      {content.knowledge.map((item) => (
       <Typography key={item} as="p" variant="bodySmall" tone="muted">
        ✓ {item}
       </Typography>
      ))}
     </Card>
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       {t("guide.skills")}
      </Typography>
      {content.skills.map((item) => (
       <Typography key={item} as="p" variant="bodySmall" tone="muted">
        ✓ {item}
       </Typography>
      ))}
     </Card>
    </section>
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       {t("guide.workflow")}
      </Typography>
      {content.workflow.map((step, index) => (
       <Typography key={step} as="p" variant="bodySmall" tone="muted">
        {index + 1}. {step}
       </Typography>
      ))}
     </Card>
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       {t("guide.mistakes")}
      </Typography>
      {content.mistakes.map((item) => (
       <Typography key={item} as="p" variant="caption" tone="muted">
        • {item}
       </Typography>
      ))}
     </Card>
    </section>
    <section className="grid gap-3" aria-labelledby="humanities-library">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black" id="humanities-library">
       {t("guide.library")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("guide.libraryDescription")}
      </Typography>
     </div>
     <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {trackDocuments.map((document, index) => {
       const lessonIndex = index + 1;
       const directionLabel = document.genre_vi || t("guide.defaultGenre");
       return (
        <Button
         key={document.id}
         type="button"
         size="lg"
         align="start"
         wrap="normal"
         layout="grid"
         variant="surfaceCard"
         onClick={() => {
          selectDocument(document.id);
          setActiveIndex(0);
          setDirectionPreference(null);
          setHumanitiesResult(null);
          setReplayCount(0);
          setPreparationState({ key: "", remaining: 0 });
          setInterpretingNotes("");
          setLearnerTranscript("");
          setUnitMarks({});
          recorder.clear();
         }}
        >
         <Typography
          as="span"
          variant="caption"
          tone="accent"
          weight="black"
          className="w-full text-left"
         >
          {t("guide.moduleLesson", {
           module: courseModuleOrder(activeTrack, lessonIndex),
           lesson: lessonIndex,
           total: trackDocuments.length,
          })}
         </Typography>
         <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
          {document.title_zh}
         </Typography>
         <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
          {document.title_vi} · {directionLabel}
         </Typography>
        </Button>
       );
      })}
     </div>
    </section>
   </div>
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
   <Card variant="section" padding="md" className="grid gap-3">
    <Button
     type="button"
     variant="ghost"
     align="start"
     className="justify-self-start"
     onClick={() => {
      clearDocument();
      setActiveIndex(0);
      setHumanitiesResult(null);
     }}
    >
     {t("detail.back", { track: trackTitle })}
    </Button>
    <div className="grid gap-1">
     <Badge variant="purple" className="justify-self-start">
      {t("detail.moduleLesson", {
       module: courseModuleOrder(activeTrack, selectedLessonIndex),
       lesson: selectedLessonIndex,
       total: trackDocuments.length,
      })}
     </Badge>
     <Typography as="h1" variant="sectionTitle" weight="black">
      {resource.document.title_zh}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {resource.document.title_vi} · {resource.document.genre_vi}
     </Typography>
    </div>
   </Card>
   <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t("nav.aria")}>
    <Button type="button" variant="outline" onClick={clearDocument}>
     {t("nav.lessonList")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={selectedLessonIndex <= 1}
     onClick={() => {
      const previous = trackDocuments[selectedLessonIndex - 2];
      if (previous !== undefined) selectDocument(previous.id);
     }}
    >
     {t("nav.previous")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={selectedLessonIndex >= trackDocuments.length}
     onClick={() => {
      const next = trackDocuments[selectedLessonIndex];
      if (next !== undefined) selectDocument(next.id);
     }}
    >
     {t("nav.next")}
    </Button>
    <Button
     type="button"
     variant={activeTrack === "translation" ? "active" : "outline"}
     onClick={() => {
      setActiveTrack("translation");
      clearDocument();
     }}
    >
     {t("tracks.translation.title")}
    </Button>
    <Button
     type="button"
     variant={activeTrack === "interpreting" ? "active" : "outline"}
     onClick={() => {
      setActiveTrack("interpreting");
      clearDocument();
     }}
    >
     {t("tracks.interpreting.title")}
    </Button>
   </nav>
   <Card variant="subtle" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="accent" weight="black">
       {t("detail.beginner")}
      </Typography>
      <Typography as="strong" variant="bodySmall" weight="black">
       {content.beginnerStart}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {content.detailStart}
      </Typography>
     </div>
     <Badge>{t("guide.count", { count: trackDocuments.length })}</Badge>
    </div>
    <div className="grid gap-2">
     <Typography as="strong" variant="caption" weight="black">
      {t("detail.order")}
     </Typography>
     <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {content.workflow.map((step, index) => (
       <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <Badge variant="purple">{index + 1}</Badge>
        <Typography as="span" variant="caption" tone="muted">
         {step}
        </Typography>
       </li>
      ))}
     </ol>
    </div>
   </Card>
   {practiceMetadata !== undefined && humanitiesEvaluation !== undefined ? (
    <Card variant="section" padding="md" className="grid gap-3">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="accent" weight="black">
       {t("detail.newbieGuide")}
      </Typography>
      <Typography as="h2" variant="sectionTitle" weight="black">
       {activeTrack === "translation"
        ? t("detail.translationPrinciple")
        : t("detail.interpretingPrinciple")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {activeTrack === "translation"
        ? t("detail.translationPrincipleDescription")
        : t("detail.interpretingPrincipleDescription")}
      </Typography>
     </div>
     <Typography as="strong" variant="bodySmall" weight="black">
      {t("detail.requiredUnits", { count: humanitiesEvaluation.informationUnits.length })}
     </Typography>
     <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {content.workflow.slice(0, 5).map((step, index) => (
       <li key={step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <Badge variant="purple">{index + 1}</Badge>
        <Typography as="span" variant="caption" tone="muted">
         {step}
        </Typography>
       </li>
      ))}
     </ol>
     <Typography as="p" variant="caption" tone="muted">
      {t("detail.referenceNotice")}
     </Typography>
    </Card>
   ) : null}
   {historyQuery.data && historyQuery.data.length > 0 ? (
    <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
     <Typography as="p" variant="caption" tone="muted" weight="black">
      {t("detail.history", { count: historyQuery.data.length })}
     </Typography>
     {historyQuery.data.slice(0, 3).map((attempt) => (
      <Badge key={attempt.id}>
       {attempt.score === null ? t("detail.review") : `${Math.round(attempt.score * 100)}/100`}
      </Badge>
     ))}
    </Card>
   ) : null}
   <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
    <Card variant="section" padding="md" className="grid min-w-0 content-start gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       {t("source.title")}
      </Typography>
      <Badge>{direction === "zh-vi" ? t("source.directionZhVi") : t("source.directionViZh")}</Badge>
     </div>
     <Typography as="p" variant="caption" tone="muted">
      {t("source.segment", {
       order: segment.order,
       total: segments.length,
       source: sourceKind(resource.document),
      })}
     </Typography>
     {direction === "zh-vi" ? (
      <ReaderHanziText
       displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin: true, showMeaning: false }}
       leading="learner"
       wrapping="preWrap"
      >
       {segment.zh}
      </ReaderHanziText>
     ) : (
      <Typography as="p" variant="body" wrapping="preWrap" leading="relaxed">
       {segment.vi || resource.document.title_vi}
      </Typography>
     )}
     {segment.pinyin ? (
      <PinyinText variant="bodySmall" tone="accent" weight="semibold">
       {segment.pinyin}
      </PinyinText>
     ) : null}
     <div className="grid gap-2 border-t border-border-default pt-3">
      <Typography as="span" variant="caption" tone="muted" weight="black">
       {t("source.glossary")}
      </Typography>
      {selectedPayload?.glossary === undefined || selectedPayload.glossary.length === 0 ? (
       <Typography as="p" variant="caption" tone="muted">
        {t("source.noGlossary")}
       </Typography>
      ) : (
       selectedPayload.glossary.map((entry) => (
        <div
         key={entry.id}
         className="grid gap-1 border-b border-border-default pb-2 last:border-0"
        >
         <Typography as="strong" variant="bodySmall" weight="black">
          {entry.headword} {entry.pinyin === null ? "" : entry.pinyin}
         </Typography>
         <Typography as="p" variant="caption" tone="muted">
          {entry.meaningVi}
         </Typography>
         <Typography as="p" variant="caption" tone="muted">
          {entry.noteVi}
         </Typography>
        </div>
       ))
      )}
     </div>
     <div className="grid grid-cols-2 gap-2">
      <Button
       type="button"
       variant={direction === "zh-vi" ? "active" : "outline"}
       onClick={() => {
        setDirectionPreference("zh-vi");
        setHumanitiesResult(null);
       }}
      >
       {t("source.zhViButton")}
      </Button>
      <Button
       type="button"
       variant={direction === "vi-zh" ? "active" : "outline"}
       onClick={() => {
        setDirectionPreference("vi-zh");
        setHumanitiesResult(null);
       }}
      >
       {t("source.viZhButton")}
      </Button>
     </div>
    </Card>
    <Card variant="subtle" padding="md" className="grid min-w-0 content-start gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="grid gap-0.5">
       <Typography as="strong" variant="bodySmall" weight="black">
        {t("answer.title")}
       </Typography>
       <Typography as="span" variant="caption" tone="muted">
        {t("answer.unsaved")}
       </Typography>
      </div>
      <Button
       type="button"
       variant="outline"
       disabled={!draft.trim()}
       onClick={() => {
        if (!segment || !draft.trim()) return;
        void savePracticeAttempt({
         surface: "translation",
         contentId: segment.id,
         direction,
         answer: { answer: draft, reference: null, missingUnitIds: [] },
         scorePercent: null,
         responseMs: null,
        })
         .then(() => historyQuery.refetch())
         .catch((error: Error) => setSaveError(error.message));
       }}
      >
       {t("answer.saveRevision")}
      </Button>
     </div>
     <Typography as="p" variant="caption" tone="muted">
      {content.sourceReminder}
     </Typography>
     {isInterpreting ? (
      <Card variant="subtle" padding="sm" className="grid gap-3">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography as="p" variant="caption" weight="black">
         {t("answer.interpreting")}
        </Typography>
        <Badge>
         {preparationRemaining > 0
          ? t("answer.preparing", { seconds: preparationRemaining })
          : t("answer.ready")}
        </Badge>
       </div>
       {humanitiesEvaluation.noteTakingAllowed !== false ? (
        <Textarea
         value={interpretingNotes}
         onChange={(event) => setInterpretingNotes(event.target.value)}
         placeholder={t("answer.notesPlaceholder")}
         aria-label={t("answer.notesAria")}
         rows={2}
        />
       ) : null}
       <div className="flex flex-wrap items-center gap-2">
        {recorder.isRecording ? (
         <Button type="button" variant="destructive" onClick={recorder.stop}>
          <Square data-icon="inline-start" />
          {t("answer.stopRecording", { seconds: recorder.durationSeconds })}
         </Button>
        ) : (
         <Button
          type="button"
          disabled={recorder.isRequesting || !recorder.isSupported}
          onClick={() => {
           recorder.clear();
           void recorder.start();
          }}
         >
          <Mic data-icon="inline-start" />
          {recorder.isRequesting ? t("answer.requestingPermission") : t("answer.startRecording")}
         </Button>
        )}
        {recorder.audioUrl ? (
         <audio
          controls
          preload="metadata"
          src={recorder.audioUrl}
          className="min-w-0 max-w-full"
         />
        ) : null}
       </div>
       <Textarea
        value={learnerTranscript}
        onChange={(event) => setLearnerTranscript(event.target.value)}
        placeholder={t("answer.transcriptPlaceholder")}
        aria-label={t("answer.transcriptAria")}
        rows={2}
       />
       {humanitiesEvaluation.informationUnits.length > 0 ? (
        <div className="grid gap-2">
         <Typography as="p" variant="caption" tone="muted" weight="black">
          {t("answer.selfMark")}
         </Typography>
         {humanitiesEvaluation.informationUnits.map((unit) => (
          <div key={unit.id} className="flex min-w-0 flex-wrap items-center gap-1">
           <Typography as="span" variant="caption" className="min-w-40">
            {unit.canonicalMeaningVi}
           </Typography>
           {interpretingMarks.map((mark) => (
            <Button
             key={mark}
             type="button"
             size="sm"
             variant={unitMarks[unit.id] === mark ? "active" : "outline"}
             onClick={() => {
              const nextMarks = { ...unitMarks, [unit.id]: mark };
              setUnitMarks(nextMarks);
              void savePracticeAttempt({
               surface: "translation",
               contentId: segment.id,
               direction,
               answer: { kind: "interpreting-self-mark", unitMarks: nextMarks },
               scorePercent: null,
               responseMs: null,
              }).catch((error: Error) => setSaveError(error.message));
             }}
            >
             {markLabel(mark)}
            </Button>
           ))}
          </div>
         ))}
        </div>
       ) : null}
       {recorder.error ? (
        <Typography as="p" variant="caption" tone="danger">
         {t("answer.recordingError")}
        </Typography>
       ) : null}
      </Card>
     ) : null}
     <Textarea
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      placeholder={t("answer.translationPlaceholder")}
      aria-label={t("answer.translationAria")}
      className="min-h-32"
     />
     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!draft.trim()} onClick={() => checkAnswer(Date.now())}>
       {t("answer.check")}
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex === 0}
       onClick={() => {
        tts.stop();
        setHumanitiesResult(null);
        setActiveIndex((index) => index - 1);
       }}
      >
       {t("answer.previousSegment")}
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex >= segments.length - 1}
       onClick={() => {
        tts.stop();
        setHumanitiesResult(null);
        setActiveIndex((index) => index + 1);
       }}
      >
       {t("answer.nextSegment")}
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={
        humanitiesEvaluation?.mode === "interpreting" &&
        humanitiesEvaluation.replayLimit !== null &&
        replayCount >= humanitiesEvaluation.replayLimit
       }
       onClick={() => {
        setReplayCount((count) => count + 1);
        tts.speakSequence([segment.zh]);
       }}
      >
       {t("answer.playSource")}
       {humanitiesEvaluation?.mode === "interpreting" && humanitiesEvaluation.replayLimit !== null
        ? ` (${replayCount}/${humanitiesEvaluation.replayLimit})`
        : ""}
      </Button>
     </div>
     {saveError ? (
      <Typography as="p" variant="caption" tone="danger">
       {saveError}
      </Typography>
     ) : null}
     <Typography as="p" variant="caption" tone="muted">
      {t("answer.evaluationNotice")}
     </Typography>
     {activeTrack === "translation" ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography as="strong" variant="bodySmall" weight="black">
        {t("answer.backTranslationTitle")}
       </Typography>
       <Typography as="span" variant="caption" tone="muted">
        {t("answer.backTranslationDescription")}
       </Typography>
       <Textarea
        value={backTranslation}
        onChange={(event) =>
         setBackTranslations((current) => ({ ...current, [key]: event.target.value }))
        }
        placeholder={t("answer.backTranslationPlaceholder")}
        aria-label={t("answer.backTranslationAria")}
        rows={3}
       />
      </Card>
     ) : null}
     {isChecked ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography as="p" variant="bodySmall" weight="black">
        {t("answer.score", { score: score ?? 0 })}
       </Typography>
       <TranslationText variant="bodySmall" tone="muted">
        {t("answer.reference")}{" "}
        {humanitiesEvaluation?.references[0]?.text ??
         (direction === "zh-vi" ? segment.vi : segment.zh)}
       </TranslationText>
       {humanitiesResult ? (
        <div className="grid gap-1">
         {humanitiesResult.unitResults.map((unit) => (
          <Typography
           key={unit.unitId}
           as="p"
           variant="caption"
           tone={
            unit.status === "covered" ? "success" : unit.status === "missing" ? "danger" : "muted"
           }
          >
           {unit.status === "covered" ? "✓" : "•"} {unit.messageVi}
          </Typography>
         ))}
        </div>
       ) : null}
      </Card>
     ) : null}
    </Card>
   </div>
  </div>
 );
}
