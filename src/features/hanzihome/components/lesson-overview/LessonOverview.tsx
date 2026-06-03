"use client";

import {
 BookOpen,
 FileText,
 GraduationCap,
 RotateCcw,
 Sparkles,
 type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import { getHanyuLessonMeta } from "@/features/hanzihome/static-json/hanyu-lesson-meta";
import type {
 HanziHomeLesson,
 HanziHomeModule,
 UserLearningState,
} from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";

import { sectionIcons } from "./section-icons";
import { getBookSections } from "./utils";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};

type ActionCard = {
 module: HanziHomeModule;
 title: string;
 description: string;
 meta: string;
 icon: LucideIcon;
 tone: "primary" | "blue" | "green" | "amber";
};

const sectionModuleMap: Partial<Record<string, HanziHomeModule>> = {
 text: "lessonText",
 vocabulary: "vocab",
 proper_nouns: "lessonText",
 notes: "lessonText",
 grammar: "grammar",
 exercises: "lessonText",
 communication: "lessonText",
 reading: "lessonText",
 character_writing: "lessonText",
 summary: "lessonText",
};

export function LessonOverview({
 lesson,
 learningState,
 onOpenModule,
}: LessonOverviewProps) {
 const fallbackMarkdown = lesson.notes?.overviewMarkdown?.trim();
 const sourceSections = getBookSections(lesson.sourceLesson);
 const lessonMeta = lesson.sourceLesson
  ? getHanyuLessonMeta(lesson.sourceLesson)
  : null;
 const knownVocab = lesson.vocab.filter(
  (word) => learningState.progress.vocab?.[word.runtimeId]?.status === "known",
 ).length;
 const learningVocab = lesson.vocab.filter((word) => {
  const status = learningState.progress.vocab?.[word.runtimeId]?.status;

  return status === "learning" || status === "hard";
 }).length;
 const knownGrammar = lesson.grammar.filter(
  (point) => learningState.progress.grammar?.[point.id]?.status === "known",
 ).length;
 const actionCards: ActionCard[] = [
  {
   module: "lessonText",
   title: "Đọc bài khóa",
   description: "Đọc theo sách, bật/tắt pinyin và nghĩa khi cần.",
   meta: `${sourceSections.filter((section) => section.type === "text").length || 1} phần bài khóa`,
   icon: FileText,
   tone: "primary",
  },
  {
   module: "vocab",
   title: "Học từ vựng",
   description: "Tra nhanh, xem cấu tạo, ví dụ và lỗi sai.",
   meta: `${lesson.vocab.length} từ · ${knownVocab} đã biết`,
   icon: BookOpen,
   tone: "blue",
  },
  {
   module: "grammar",
   title: "Nắm ngữ pháp",
   description: "Công thức, ý nghĩa, ví dụ và bẫy sai.",
   meta: `${lesson.grammar.length} điểm · ${knownGrammar} đã biết`,
   icon: GraduationCap,
   tone: "green",
  },
  {
   module: "review",
   title: "Ôn chủ động",
   description: "Flashcard từ vựng và ngữ pháp trong bài.",
   meta: `${learningVocab} mục cần ôn`,
   icon: RotateCcw,
   tone: "amber",
  },
 ];

 return (
  <div className="grid gap-3 sm:gap-4">
   <Card
    padding="lg"
    className="overflow-hidden rounded-xl border-border-default bg-bg-primary"
   >
    <div className="grid gap-4">
     <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid min-w-0 gap-2">
       <Badge variant="accent" className="w-fit">
        Bài học
       </Badge>
       <div>
        <h1
         className="text-2xl font-black leading-tight text-text-primary sm:text-3xl"
         lang="zh-CN"
        >
         {lesson.titleZh}
        </h1>
        <p className="mt-1 text-sm font-bold text-text-muted sm:text-base">
         {lessonMeta?.volumeVi || lesson.bookTitle || lesson.courseTitle}
         {lessonMeta?.titlePinyin ? ` · ${lessonMeta.titlePinyin}` : ""}
        </p>
       </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
       <LessonMetric label="Từ" value={lesson.vocab.length} />
       <LessonMetric label="Ngữ pháp" value={lesson.grammar.length} />
       <LessonMetric label="Phần" value={sourceSections.length || 0} />
      </div>
     </div>

     <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {actionCards.map((action) => (
       <button
        key={action.module}
        type="button"
        onClick={() => onOpenModule(action.module)}
        className={cn(
         "group grid min-h-34 content-between gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-theme-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
         action.tone === "primary" &&
          "border-primary/25 bg-primary/8 hover:border-primary/45",
         action.tone === "blue" &&
          "border-info/25 bg-info-subtle/55 hover:border-info/45",
         action.tone === "green" &&
          "border-success/25 bg-success-subtle/45 hover:border-success/45",
         action.tone === "amber" &&
          "border-warning/25 bg-warning-subtle/45 hover:border-warning/45",
        )}
       >
        <span className="flex items-start justify-between gap-3">
         <span>
          <span className="block text-base font-black text-text-primary">
           {action.title}
          </span>
          <span className="mt-1 block text-sm font-semibold leading-relaxed text-text-muted">
           {action.description}
          </span>
         </span>
         <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-primary text-primary shadow-theme-sm">
          <action.icon className="h-5 w-5" />
         </span>
        </span>
        <span className="text-xs font-black uppercase tracking-wide text-text-muted">
         {action.meta}
        </span>
       </button>
      ))}
     </div>
    </div>
   </Card>

   {sourceSections.length > 0 && (
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Lộ trình bài này
        </p>
        <h2 className="text-xl font-black text-text-primary">
         Học theo đúng cấu trúc sách
        </h2>
       </div>
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onOpenModule("lessonText")}
       >
        Mở bài khóa
       </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
       {sourceSections.map((section, index) => {
        const Icon = sectionIcons[section.type] ?? Sparkles;
        const targetModule = sectionModuleMap[section.type] ?? "lessonText";

        return (
         <button
          key={section.id}
          type="button"
          onClick={() => onOpenModule(targetModule)}
          className="flex min-w-0 gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left transition-colors hover:border-primary/35 hover:bg-bg-primary"
         >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary">
           <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
           <span className="block truncate text-sm font-black text-text-primary">
            {index + 1}. {section.title}
           </span>
           {section.subtitle && (
            <span className="mt-0.5 block truncate text-xs font-bold text-text-muted">
             {section.subtitle}
            </span>
           )}
          </span>
         </button>
        );
       })}
      </div>
     </div>
    </Card>
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

function LessonMetric({ label, value }: { label: string; value: number }) {
 return (
  <div className="min-w-18 rounded-xl border border-border-default bg-bg-subtle px-3 py-2">
   <p className="text-xl font-black leading-none text-text-primary">{value}</p>
   <p className="mt-1 text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
    {label}
   </p>
  </div>
 );
}
