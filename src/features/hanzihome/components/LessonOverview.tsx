"use client";

import {
 BookOpen,
 CheckCircle2,
 GraduationCap,
 Layers3,
 RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
 HanziHomeLesson,
 HanziHomeModule,
 UserLearningState,
} from "@/features/hanzihome/types";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};

export function LessonOverview({
 lesson,
 learningState,
 onOpenModule,
}: LessonOverviewProps) {
 const vocabProgress = learningState.progress.vocab || {};
 const grammarProgress = learningState.progress.grammar || {};
 const knownVocab = lesson.vocab.filter(
  (word) => vocabProgress[word.id]?.status === "known",
 ).length;
 const knownGrammar = lesson.grammar.filter(
  (point) => grammarProgress[point.id]?.status === "known",
 ).length;
 const hardCount =
  lesson.vocab.filter((word) => vocabProgress[word.id]?.status === "hard")
   .length +
  lesson.grammar.filter((point) => grammarProgress[point.id]?.status === "hard")
   .length;
 const stats = [
  {
   label: "Từ vựng",
   value: lesson.vocab.length,
   icon: BookOpen,
   module: "vocab" as const,
  },
  {
   label: "Ngữ pháp",
   value: lesson.grammar.length,
   icon: GraduationCap,
   module: "grammar" as const,
  },
  {
   label: "Mục cần ôn",
   value: lesson.vocab.length + lesson.grammar.length,
   icon: RotateCcw,
   module: "review" as const,
  },
 ];
 const actions = [
  {
   title: "Học từ vựng",
   description:
    "Xem danh sách theo nhóm, đọc nghĩa sâu, ví dụ và ghi chú lỗi sai.",
   icon: BookOpen,
   module: "vocab" as const,
  },
  {
   title: "Học ngữ pháp",
   description: "Đọc công thức, logic cốt lõi, ví dụ nhanh và bẫy sai của bài.",
   icon: GraduationCap,
   module: "grammar" as const,
  },
  {
   title: "Ôn tập bài này",
   description: "Lật thẻ vocab và grammar, ưu tiên mục còn khó hoặc đang học.",
   icon: RotateCcw,
   module: "review" as const,
  },
 ];

 return (
  <div className="grid gap-4">
   <Card padding="lg" className="rounded-2xl">
    <div className="grid gap-5">
     <div className="min-w-0">
      <Badge variant="accent">Hán ngữ 2</Badge>
      <h2 className="mt-3 text-3xl font-black tracking-normal text-text-primary">
       {lesson.title}
      </h2>
      <p className="mt-2 max-w-3xl text-base font-semibold leading-relaxed text-text-secondary">
       Bắt đầu từ bài học, rồi đi qua từ vựng, ngữ pháp và ôn tập trong cùng một
       workspace.
      </p>
     </div>

     <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => {
       const Icon = stat.icon;
       return (
        <button
         key={stat.label}
         type="button"
         onClick={() => onOpenModule(stat.module)}
         className="flex min-w-0 items-center gap-3 rounded-2xl border-2 border-border-default bg-bg-subtle p-4 text-left transition-colors hover:border-accent-muted hover:bg-accent-subtle"
        >
         <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white   shadow-theme-sm">
          <Icon className="h-5 w-5" />
         </span>
         <span className="min-w-0">
          <span className="block text-2xl font-black text-text-primary">
           {stat.value}
          </span>
          <span className="block truncate text-sm font-bold text-text-muted">
           {stat.label}
          </span>
         </span>
        </button>
       );
      })}
     </div>

     <div className="grid gap-3 sm:grid-cols-3">
      <ProgressTile
       label="Từ đã biết"
       value={`${knownVocab}/${lesson.vocab.length}`}
      />
      <ProgressTile
       label="Ngữ pháp đã biết"
       value={`${knownGrammar}/${lesson.grammar.length}`}
      />
      <ProgressTile label="Cần chú ý" value={String(hardCount)} />
     </div>
    </div>
   </Card>

   <div className="grid gap-3 md:grid-cols-3">
    {actions.map((action) => {
     const Icon = action.icon;
     return (
      <button
       key={action.title}
       type="button"
       onClick={() => onOpenModule(action.module)}
       className="group flex min-h-40 min-w-0 flex-col justify-between rounded-2xl border-2 border-border-default bg-bg-card p-5 text-left shadow-theme-sm transition-colors hover:border-accent-muted hover:bg-accent-subtle"
      >
       <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-subtle   group-hover:bg-white">
        <Icon className="h-5 w-5" />
       </span>
       <span className="grid gap-2">
        <span className="text-lg font-black text-text-primary">
         {action.title}
        </span>
        <span className="text-sm font-semibold leading-relaxed text-text-secondary">
         {action.description}
        </span>
       </span>
      </button>
     );
    })}
   </div>

   <button
    type="button"
    onClick={() => onOpenModule("radicals")}
    className="group flex min-w-0 items-center gap-4 rounded-2xl border-2 border-border-default bg-bg-card p-5 text-left shadow-theme-sm transition-colors hover:border-accent-muted hover:bg-accent-subtle"
   >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle   group-hover:bg-white">
     <Layers3 className="h-5 w-5" />
    </span>
    <span className="min-w-0">
     <span className="block text-lg font-black text-text-primary">
      Thư viện bộ thủ
     </span>
     <span className="block text-sm font-semibold leading-relaxed text-text-secondary">
      Khu riêng trong HanziHome, không phụ thuộc bài đang chọn.
     </span>
    </span>
   </button>
  </div>
 );
}

function ProgressTile({ label, value }: { label: string; value: string }) {
 return (
  <div className="flex items-center gap-3 rounded-2xl bg-bg-subtle p-4">
   <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
   <div>
    <p className="text-xl font-black text-text-primary">{value}</p>
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
     {label}
    </p>
   </div>
  </div>
 );
}
