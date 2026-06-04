"use client";

import type { ReactNode } from "react";
import {
 GraduationCap,
 Tags,
 type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 HanziHomeModule,
 HanziHomeVocabItem,
 UserLearningState,
} from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};

export function LessonOverview({
 lesson,
 onOpenModule,
}: LessonOverviewProps) {
 const fallbackMarkdown = lesson.notes?.overviewMarkdown?.trim();

 return (
  <div className="grid gap-3 sm:gap-4">
   {(lesson.vocab.length > 0 || lesson.grammar.length > 0) && (
    <div className="grid gap-3 lg:grid-cols-2">
     {lesson.vocab.length > 0 && (
      <LessonPreviewCard
       icon={Tags}
       eyebrow="Từ vựng bài này"
       title={`${lesson.vocab.length} từ chính`}
       actionLabel="Mở từ vựng"
       onAction={() => onOpenModule("vocab")}
      >
       <div className="grid max-h-[32rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {lesson.vocab.map((word) => (
         <VocabPreviewRow key={word.runtimeId} word={word} />
        ))}
       </div>
      </LessonPreviewCard>
     )}

     {lesson.grammar.length > 0 && (
      <LessonPreviewCard
       icon={GraduationCap}
       eyebrow="Ngữ pháp bài này"
       title={`${lesson.grammar.length} điểm cần nắm`}
       actionLabel="Mở ngữ pháp"
       onAction={() => onOpenModule("grammar")}
      >
       <div className="grid max-h-[32rem] gap-2 overflow-y-auto pr-1">
        {lesson.grammar.map((point, index) => (
         <GrammarPreviewRow key={point.id} point={point} index={index} />
        ))}
       </div>
      </LessonPreviewCard>
     )}
    </div>
   )}

   {fallbackMarkdown && !lesson.sourceLesson && (
    <Card padding="lg" className="rounded-xl">
     <MarkdownContent content={fallbackMarkdown} />
    </Card>
   )}

   <LessonNoteAccessCard lesson={lesson} />
  </div>
 );
}

function LessonPreviewCard({
 icon: Icon,
 eyebrow,
 title,
 actionLabel,
 onAction,
 children,
}: {
 icon: LucideIcon;
 eyebrow: string;
 title: string;
 actionLabel: string;
 onAction: () => void;
 children: ReactNode;
}) {
 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-3">
    <div className="flex items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
       <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        {eyebrow}
       </p>
       <h2 className="text-lg font-black text-text-primary">{title}</h2>
      </div>
     </div>
     <Button type="button" variant="outline" size="sm" onClick={onAction}>
      {actionLabel}
     </Button>
    </div>
    {children}
   </div>
  </Card>
 );
}

function VocabPreviewRow({ word }: { word: HanziHomeVocabItem }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3">
   <div className="flex min-w-0 items-baseline gap-2">
    <span className="truncate text-lg font-black text-text-primary" lang="zh-CN">
     {word.hanzi}
    </span>
    <span className="truncate text-sm font-bold text-primary">
     {word.pinyin}
    </span>
   </div>
   <p className="mt-1 truncate text-xs font-bold uppercase tracking-wide text-text-muted">
    {word.meaning.hanviet || word.category}
   </p>
   <p className="mt-1 line-clamp-2 text-sm font-semibold text-text-secondary">
    {getVocabDisplayMeaning(word)}
   </p>
  </div>
 );
}

function GrammarPreviewRow({
 point,
 index,
}: {
 point: GrammarViewModel;
 index: number;
}) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Điểm {index + 1}
   </p>
   <h3 className="mt-1 truncate text-base font-black text-text-primary">
    {point.cleanTitle}
   </h3>
   <p className="mt-1 line-clamp-2 text-sm font-semibold text-text-secondary">
    {point.core || point.structuresView[0] || "Chưa có mô tả"}
   </p>
   {point.structuresView[0] && (
    <p className="mt-2 truncate rounded-lg border border-info/25 bg-info-subtle px-2 py-1 text-sm font-black text-info-text">
     {point.structuresView[0]}
    </p>
   )}
  </div>
 );
}
