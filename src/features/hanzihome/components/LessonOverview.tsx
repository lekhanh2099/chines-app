"use client";

import { BookOpen, GraduationCap, Layers3, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HanziHomeLesson, HanziHomeModule } from "@/features/hanzihome/types";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 onOpenModule: (module: HanziHomeModule) => void;
};

export function LessonOverview({ lesson, onOpenModule }: LessonOverviewProps) {
 const stats = [
  { label: "Từ vựng", value: lesson.vocab.length, icon: BookOpen, module: "vocab" as const },
  {
   label: "Ngữ pháp",
   value: lesson.grammar.length,
   icon: GraduationCap,
   module: "grammar" as const,
  },
  { label: "Bộ thủ", value: lesson.radicals.length, icon: Layers3, module: "radicals" as const },
 ];

 return (
  <div className="grid gap-5">
   <Card padding="lg" className="rounded-2xl">
    <div className="flex flex-col gap-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
       <Badge variant="accent">Hán ngữ 2</Badge>
       <h1 className="mt-3 text-3xl font-black tracking-normal text-text-primary sm:text-4xl">
        {lesson.title}
       </h1>
       <p className="mt-2 text-sm font-semibold text-text-secondary">
        Nội dung học lấy trực tiếp từ JSON tĩnh. Chọn phần bên dưới để học theo bài.
       </p>
      </div>
      <Button onClick={() => onOpenModule("review")}>
       <RotateCcw className="h-4 w-4" />
       Ôn tập bài này
      </Button>
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
         <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-accent shadow-theme-sm">
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
    </div>
   </Card>
  </div>
 );
}
