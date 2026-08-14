"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  setState((current) => ({
   ...current,
   drafts: { ...current.drafts, [key]: value },
   checked: { ...current.checked, [key]: false },
  }));
 };

 const checkAnswer = () => {
  createTranslationAttempt(segment, direction, draft, null);
  setState((current) => ({
   ...current,
   checked: { ...current.checked, [key]: true },
  }));
 };

 const move = (index: number) => {
  setActiveIndex(clampTranslationIndex(index, segments.length));
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

    <div className="grid grid-cols-2 gap-2" aria-label="Hướng dịch">
     <Button
      type="button"
      variant={direction === "zh-vi" ? "active" : "outline"}
      onClick={() => setDirection("zh-vi")}
     >
      中文 → Tiếng Việt
     </Button>
     <Button
      type="button"
      variant={direction === "vi-zh" ? "active" : "outline"}
      onClick={() => setDirection("vi-zh")}
     >
      Tiếng Việt → 中文
     </Button>
    </div>

    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8" aria-label="Đoạn dịch">
     {segments.map((candidate, index) => (
      <Button
       key={candidate.id}
       type="button"
       size="sm"
       variant={index === activeIndex ? "active" : "outline"}
       aria-current={index === activeIndex ? "step" : undefined}
       onClick={() => move(index)}
      >
       {candidate.order}
      </Button>
     ))}
    </div>
   </Card>

   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex items-center justify-between gap-2 text-sm text-foreground-muted">
     <span>Đoạn {segment.order}</span>
     <span>{Array.from(sourceText).length} ký tự</span>
    </div>
    {direction === "zh-vi" ? (
     <ReaderHanziText displayMode={displayMode} leading="learner" wrapping="preWrap">
      {sourceText}
     </ReaderHanziText>
    ) : (
     <Typography as="p" variant="body" wrapping="preWrap" leading="relaxed">
      {sourceText}
     </Typography>
    )}
    {segment.pinyin ? (
     <PinyinText variant="bodySmall" tone="accent" weight="semibold">
      {segment.pinyin}
     </PinyinText>
    ) : null}
   </Card>

   <Card variant="subtle" padding="md" className="grid gap-3">
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
    {checked ? (
     <div className="grid gap-2 rounded-control border border-border bg-surface p-3">
      <Typography as="p" variant="bodySmall" weight="black">
       Điểm: {score ?? 0}/100
      </Typography>
      <TranslationText variant="bodySmall" tone="muted">
       Đáp án tham chiếu: {referenceText}
      </TranslationText>
     </div>
    ) : null}
   </Card>
  </div>
 );
}
