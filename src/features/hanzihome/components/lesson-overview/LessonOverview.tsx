"use client";

import { useMemo, type ReactNode } from "react";
import {
 BookOpenCheck,
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

import { BookSectionContent } from "./BookSectionContent";
import { sectionIcons } from "./section-icons";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type BookSection,
 type LessonDisplayMode,
} from "./types";
import { getBookSections } from "./utils";

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
 const sourceSections = useMemo(
  () => getBookSections(lesson.sourceLesson),
  [lesson.sourceLesson],
 );

 return (
  <div className="grid gap-3 sm:gap-4">
   {sourceSections.length > 0 && (
    <LessonSourceDataOverview sections={sourceSections} />
   )}

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

const OVERVIEW_DISPLAY_MODE: LessonDisplayMode = {
 ...DEFAULT_LESSON_DISPLAY_MODE,
 showPinyin: true,
 showMeaning: true,
};

function LessonSourceDataOverview({ sections }: { sections: BookSection[] }) {
 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
       <BookOpenCheck className="h-5 w-5" />
      </span>
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Nội dung JSON của bài
       </p>
       <h2 className="text-lg font-black text-text-primary">
        Render toàn bộ dữ liệu đang có
       </h2>
       <p className="mt-1 text-sm font-semibold text-text-muted">
        Chia theo cấu trúc sách, giữ pinyin và nghĩa để dễ rà data.
       </p>
      </div>
     </div>
     <span className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black uppercase tracking-wide text-text-muted">
      {sections.length} phần
     </span>
    </div>

    <div className="grid max-h-[72vh] gap-3 overflow-y-auto pr-1">
     {sections.map((section, index) => (
      <OverviewBookSection
       key={section.id}
       section={section}
       index={index}
      />
     ))}
    </div>
   </div>
  </Card>
 );
}

function OverviewBookSection({
 section,
 index,
}: {
 section: BookSection;
 index: number;
}) {
 const SectionIcon = sectionIcons[section.type] ?? BookOpenCheck;

 return (
  <article className="rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4">
   <div className="mb-3 flex min-w-0 items-start gap-3">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary">
     <SectionIcon className="h-4 w-4" />
    </span>
    <div className="min-w-0">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Phần {index + 1}
     </p>
     <h3 className="text-base font-black text-text-primary">
      {section.title}
     </h3>
     {section.subtitle && (
      <p className="text-sm font-semibold text-text-muted">
       {section.subtitle}
      </p>
     )}
    </div>
   </div>
   <BookSectionContent
    section={section.section}
    displayMode={OVERVIEW_DISPLAY_MODE}
   />
  </article>
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
