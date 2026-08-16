"use client";

import { useMemo, useRef, useState } from "react";

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
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

import {
 clampTranslationIndex,
 createTranslationAttempt,
 emptyTranslationPracticeState,
 orderedTranslationSegments,
 scoreTranslationAttempt,
 translationReferenceText,
 translationSegmentsFromLesson,
 translationSourceText,
 type TranslationDirection,
 type TranslationPracticeState,
} from "./translation-practice";
import { savePracticeAttempt } from "./practice-attempt-api";

export function TranslationPracticeWorkspace() {
 const runtime = useHanziHomeRuntime();
 const displayMode = useHanziHomeFeatureSelector((state) => state.lessonTextDisplayMode);
 const segments = useMemo(
  () => orderedTranslationSegments(translationSegmentsFromLesson(runtime.lesson.sourceLesson)),
  [runtime.lesson.sourceLesson],
 );
 const [activeIndex, setActiveIndex] = useState(0);
 const [direction, setDirection] = useState<TranslationDirection>("zh-vi");
 const [state, setState] = useState<TranslationPracticeState>(emptyTranslationPracticeState);
 const [attemptSaveError, setAttemptSaveError] = useState("");
 const startedAtRef = useRef<Record<string, number>>({});
 const segment = segments[activeIndex];

 if (!segment) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography as="p" variant="bodySmall" tone="muted" weight="semibold">
     Bài này chưa có đoạn dịch song ngữ để luyện tập.
    </Typography>
   </Card>
  );
 }

 const key = `${segment.id}:${direction}`;
 const draft = state.drafts[key] ?? "";
 const checked = state.checked[key] === true;
 const score = checked ? scoreTranslationAttempt(segment, direction, draft) : null;
 const sourceText = translationSourceText(segment, direction);
 const referenceText = translationReferenceText(segment, direction);
 const completedCount = segments.filter(
  (candidate) => state.checked[`${candidate.id}:${direction}`] === true,
 ).length;

 const updateDraft = (value: string) => {
  if (value.trim() && startedAtRef.current[key] === undefined) {
   startedAtRef.current[key] = Date.now();
  }
  setState((current) => ({
   ...current,
   drafts: { ...current.drafts, [key]: value },
   checked: { ...current.checked, [key]: false },
  }));
 };

 const checkAnswer = () => {
  const startedAt = startedAtRef.current[key];
  const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
  const attempt = createTranslationAttempt(segment, direction, draft, responseMs);
  delete startedAtRef.current[key];
  setAttemptSaveError("");
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
   checked: { ...current.checked, [key]: true },
  }));
 };

 const move = (index: number) => {
  setActiveIndex(clampTranslationIndex(index, segments.length));
  setAttemptSaveError("");
 };

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <Badge variant="purple" className="w-fit">
       Translation Studio
      </Badge>
      <Typography as="h2" variant="sectionTitle" weight="black">
       Luyện dịch hai chiều
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Chấm điểm deterministic, không gọi AI và không đọc dữ liệu progress của Studio.
      </Typography>
     </div>
     <Badge>
      {completedCount}/{segments.length} đoạn
     </Badge>
    </div>

    <SegmentedControl
     value={direction}
     items={[
      { key: "zh-vi", label: "中文 → Tiếng Việt" },
      { key: "vi-zh", label: "Tiếng Việt → 中文" },
     ]}
     onChange={(nextDirection) => {
      setDirection(nextDirection);
      setAttemptSaveError("");
     }}
     aria-label="Hướng dịch"
    />

    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8" aria-label="Đoạn dịch">
     {segments.map((candidate, index) => (
      <Button
       key={candidate.id}
       type="button"
       size="sm"
       variant={
        index === activeIndex
         ? "active"
         : state.checked[`${candidate.id}:${direction}`] === true
           ? "success"
           : "outline"
       }
       aria-current={index === activeIndex ? "step" : undefined}
       onClick={() => move(index)}
      >
       {candidate.order}
      </Button>
     ))}
    </div>
   </Card>

   <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
    <Card variant="section" padding="md" className="grid min-w-0 content-start gap-3">
     <div className="flex items-center justify-between gap-2 text-sm text-foreground-muted">
      <span>Đoạn {segment.order}</span>
      <span>{Array.from(sourceText).length} ký tự</span>
     </div>
     {direction === "zh-vi" ? (
      <ReaderHanziText displayMode={displayMode} size="lg" leading="relaxed" wrapping="preWrap">
       {sourceText}
      </ReaderHanziText>
     ) : (
      <Typography as="p" variant="body" wrapping="preWrap" leading="relaxed">
       {sourceText}
      </Typography>
     )}
     {direction === "zh-vi" && segment.pinyin ? (
      <Card asChild variant="subtle" padding="none">
       <details className="grid gap-2">
        <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
         <Typography as="span" variant="bodySmall" tone="muted" weight="black">
          Xem pinyin khi bí
         </Typography>
        </summary>
        <PinyinText
         variant="bodySmall"
         tone="accent"
         weight="semibold"
         wrapping="preWrap"
         className="border-t border-border-default px-3 pb-3"
        >
         {segment.pinyin}
        </PinyinText>
       </details>
      </Card>
     ) : null}
     <Typography as="p" variant="caption" tone="muted">
      Bản dịch tham chiếu sẽ hiện sau khi bạn kiểm tra câu trả lời.
     </Typography>
    </Card>

    <Card variant="subtle" padding="md" className="grid min-w-0 content-start gap-3">
     <Typography as="h3" variant="cardTitle" weight="black">
      Bản dịch của bạn
     </Typography>
     <Textarea
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      placeholder={direction === "zh-vi" ? "Nhập bản dịch tiếng Việt…" : "Nhập câu tiếng Trung…"}
      aria-label="Câu trả lời dịch"
      className="min-h-36"
      autoCapitalize="off"
      autoCorrect="off"
     />
     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!draft.trim()} onClick={checkAnswer}>
       Kiểm tra
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex === 0}
       onClick={() => move(activeIndex - 1)}
      >
       Đoạn trước
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex >= segments.length - 1}
       onClick={() => move(activeIndex + 1)}
      >
       Đoạn sau
      </Button>
     </div>
     {attemptSaveError ? (
      <Typography as="p" variant="caption" tone="danger">
       {attemptSaveError}
      </Typography>
     ) : null}
     {checked ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography as="p" variant="bodySmall" weight="black">
        Điểm: {score ?? 0}/100
       </Typography>
       <TranslationText variant="bodySmall" tone="muted">
        Đáp án tham chiếu: {referenceText}
       </TranslationText>
      </Card>
     ) : null}
    </Card>
   </div>
  </div>
 );
}
