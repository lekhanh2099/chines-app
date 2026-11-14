"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useUnsavedDraftGuard } from "@/components/layout/navigation/UnsavedDraftNavigationGuard";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import { analyzeContextualPronunciation } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import {
 clampTranslationIndex,
 createTranslationAttempt,
 emptyTranslationPracticeState,
 orderedTranslationSegments,
 scoreTranslationAttempt,
 translationReferenceText,
 translationSourceText,
 translationAttemptKey,
 type TranslationAttempt,
 type TranslationDirection,
 type TranslationPracticeState,
 type TranslationSegment,
} from "./translation-practice";
import { savePracticeAttempt } from "./practice-attempt-api";
import { useLessonTranslationShortcuts } from "./useLessonTranslationShortcuts";
import { TranslationEvaluationCard } from "./TranslationEvaluationCard";
import {
 TranslationAnswerActions,
 TranslationSegmentNavigator,
 TranslationSourceCard,
} from "./TranslationPracticePanels";
import { buildTranslationDiff, summarizeTranslationDiff } from "./translation-comparison";

type LessonTranslationWorkspaceProps = {
 segments: readonly TranslationSegment[];
 displayMode?: LessonDisplayMode;
};

export function LessonTranslationWorkspace({
 segments: rawSegments,
 displayMode: propDisplayMode = DEFAULT_LESSON_DISPLAY_MODE,
}: LessonTranslationWorkspaceProps) {
 const segments = useMemo(() => orderedTranslationSegments(rawSegments), [rawSegments]);
 const [activeIndex, setActiveIndex] = useState(0);
 const [direction, setDirection] = useState<TranslationDirection>("zh-vi");
 const [state, setState] = useState<TranslationPracticeState>(emptyTranslationPracticeState);
 const [attemptHistory, setAttemptHistory] = useState<Record<string, TranslationAttempt[]>>({});
 const displayMode = useMemo<LessonDisplayMode>(
  () => ({
   ...DEFAULT_LESSON_DISPLAY_MODE,
   ...propDisplayMode,
  }),
  [propDisplayMode],
 );
 const [showPinyin, setShowPinyin] = useState(displayMode.showPinyin);
 const [attemptSaveError, setAttemptSaveError] = useState("");
 useUnsavedDraftGuard(
  Object.entries(state.drafts).some(
   ([key, value]) =>
    value.trim().length > 0 && (!state.checked[key] || attemptSaveError.length > 0),
  ),
 );
 const startedAtRef = useRef<Record<string, number>>({});
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const segment = segments[activeIndex];

 const effectiveDisplayMode = useMemo<LessonDisplayMode>(
  () => ({
   ...displayMode,
   autoDetectPinyin: displayMode.autoDetectPinyin ?? true,
   showPinyin,
  }),
  [displayMode, showPinyin],
 );

 const sourceAnalysis = useMemo(() => {
  if (!segment || direction !== "zh-vi") return null;
  return analyzeContextualPronunciation({
   text: segment.zh,
   sourcePinyin: segment.pinyin.trim() ? segment.pinyin : null,
  });
 }, [direction, segment]);

 const referenceAnalysis = useMemo(() => {
  if (!segment || direction !== "vi-zh") return null;
  return analyzeContextualPronunciation({
   text: segment.zh,
   sourcePinyin: segment.pinyin.trim() ? segment.pinyin : null,
  });
 }, [direction, segment]);

 const key = segment ? translationAttemptKey(segment.id, direction) : "";
 const draft = key ? (state.drafts[key] ?? "") : "";
 const checked = key ? state.checked[key] === true : false;
 const score = checked && segment ? scoreTranslationAttempt(segment, direction, draft) : null;
 const sourceText = segment ? translationSourceText(segment, direction) : "";
 const referenceText = segment ? translationReferenceText(segment, direction) : "";
 const completedCount = segments.filter(
  (candidate) => state.checked[translationAttemptKey(candidate.id, direction)] === true,
 ).length;
 const history = key ? (attemptHistory[key] ?? []) : [];

 const updateDraft = (value: string) => {
  if (!key) return;
  if (value.trim() && startedAtRef.current[key] === undefined) {
   startedAtRef.current[key] = Date.now();
  }
  setState((current) => ({
   ...current,
   drafts: { ...current.drafts, [key]: value },
   checked: { ...current.checked, [key]: false },
  }));
 };

 const checkAnswer = useCallback(() => {
  if (!segment) return;
  const targetKey = translationAttemptKey(segment.id, direction);
  const startedAt = startedAtRef.current[targetKey];
  const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
  const attempt = createTranslationAttempt(segment, direction, draft, responseMs);
  delete startedAtRef.current[targetKey];
  setAttemptSaveError("");
  setAttemptHistory((current) => ({
   ...current,
   [targetKey]: [...(current[targetKey] ?? []), attempt],
  }));
  void savePracticeAttempt({
   surface: "translation",
   contentId: segment.id,
   direction,
   answer: {
    answer: attempt.answer,
    reference: referenceText,
   },
   scorePercent: attempt.score,
   responseMs: attempt.responseMs,
  }).catch((error: Error) => setAttemptSaveError(error.message));
  setState((current) => ({
   ...current,
   checked: { ...current.checked, [targetKey]: true },
  }));
 }, [segment, direction, draft, referenceText]);

 const editAgain = useCallback(() => {
  if (!segment) return;
  const targetKey = translationAttemptKey(segment.id, direction);
  setState((current) => ({
   ...current,
   checked: { ...current.checked, [targetKey]: false },
  }));
  setTimeout(() => {
   textareaRef.current?.focus();
  }, 50);
 }, [segment, direction]);

 const move = useCallback(
  (index: number) => {
   setActiveIndex(clampTranslationIndex(index, segments.length));
   setAttemptSaveError("");
  },
  [segments.length],
 );

 useEffect(() => {
  textareaRef.current?.focus();
 }, [activeIndex, direction]);

 useLessonTranslationShortcuts({
  activeIndex,
  checked,
  draft,
  score,
  segmentCount: segments.length,
  onCheckAnswer: checkAnswer,
  onEditAgain: editAgain,
  onMove: move,
 });

 const diff = useMemo(() => {
  if (!checked || !referenceText) return [];
  return buildTranslationDiff(referenceText, draft, direction);
 }, [checked, referenceText, draft, direction]);

 const summary = useMemo(() => {
  if (!checked) return null;
  return summarizeTranslationDiff(diff, direction);
 }, [checked, diff, direction]);

 if (!segment) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography as="p" variant="bodySmall" tone="muted" weight="semibold">
     Bài này chưa có đoạn dịch song ngữ để luyện tập.
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-3">
   <TranslationSegmentNavigator
    activeIndex={activeIndex}
    completedCount={completedCount}
    direction={direction}
    segment={segment}
    segments={segments}
    state={state}
    onDirectionChange={(nextDirection) => {
     setDirection(nextDirection);
     setAttemptSaveError("");
    }}
    onMove={move}
   />

   <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
    <TranslationSourceCard
     direction={direction}
     effectiveDisplayMode={effectiveDisplayMode}
     segment={segment}
     showPinyin={showPinyin}
     sourceAnalysis={sourceAnalysis}
     sourceText={sourceText}
     onTogglePinyin={() => setShowPinyin((prev) => !prev)}
    />

    <Card variant="subtle" padding="md" className="grid min-w-0 content-start gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography as="h3" variant="cardTitle" weight="black">
       Bản dịch của bạn
      </Typography>
      <Typography variant="caption" tone="muted">
       Ctrl/⌘ ↵ kiểm tra · Ctrl/⌘ ←/→ chuyển đoạn
      </Typography>
     </div>
     <Textarea
      ref={textareaRef}
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      placeholder={direction === "zh-vi" ? "Nhập bản dịch tiếng Việt…" : "Nhập câu tiếng Trung…"}
      aria-label="Câu trả lời dịch"
      className="min-h-36"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
     />
     <TranslationAnswerActions
      activeIndex={activeIndex}
      checked={checked}
      draft={draft}
      score={score}
      segmentCount={segments.length}
      onCheckAnswer={checkAnswer}
      onEditAgain={editAgain}
      onMove={move}
     />
     {attemptSaveError ? (
      <Typography as="p" variant="caption" tone="danger">
       {attemptSaveError}
      </Typography>
     ) : null}
     {checked && score !== null && summary !== null ? (
      <TranslationEvaluationCard
       score={score}
       history={history}
       diff={diff}
       summary={summary}
       direction={direction}
       referenceText={referenceText}
       referenceAnalysis={referenceAnalysis}
       effectiveDisplayMode={effectiveDisplayMode}
       showPinyin={showPinyin}
       sourcePinyin={segment.pinyin}
       onEditAgain={editAgain}
       onNextSegment={() => move(activeIndex + 1)}
       hasNext={activeIndex < segments.length - 1}
      />
     ) : null}
    </Card>
   </div>
  </div>
 );
}
