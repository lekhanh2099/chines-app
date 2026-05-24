"use client";

import { BookOpen, FileText, GraduationCap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
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

const overviewActions = [
 {
  module: "lessonText" as const,
  title: "Bài khóa",
  description: "Đọc hoặc soạn nội dung bài học.",
  icon: FileText,
 },
 {
  module: "vocab" as const,
  title: "Học từ vựng",
  description: "Ôn từ theo nhóm và trạng thái học.",
  icon: BookOpen,
 },
 {
  module: "grammar" as const,
  title: "Học ngữ pháp",
  description: "Đọc giải thích, ví dụ, bài đọc áp dụng.",
  icon: GraduationCap,
 },
 {
  module: "review" as const,
  title: "Ôn tập bài này",
  description: "Làm queue vocab và grammar của bài.",
  icon: RotateCcw,
 },
];

export function LessonOverview({
 lesson,
 learningState,
 onOpenModule,
}: LessonOverviewProps) {
 const vocabProgress = learningState.progress.vocab ?? {};
 const grammarProgress = learningState.progress.grammar ?? {};
 const knownVocabCount = lesson.vocab.filter(
  (word) => vocabProgress[word.id]?.status === "known",
 ).length;
 const knownGrammarCount = lesson.grammar.filter(
  (point) => grammarProgress[point.id]?.status === "known",
 ).length;

 return (
  <div className="grid gap-3">
   <Card
    padding="md"
    className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
   >
    <div className="grid gap-3">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Bài {lesson.lessonNumber}
      </p>
      <h2 className="text-xl font-black text-text-primary">
       {lesson.titleZh || lesson.title}
      </h2>
      <p className="text-sm font-semibold text-text-muted">
       {lesson.title}
      </p>
     </div>

     <div className="grid gap-2 sm:grid-cols-2">
      <Stat label="Từ vựng" value={`${knownVocabCount}/${lesson.vocab.length}`} />
      <Stat
       label="Ngữ pháp"
       value={`${knownGrammarCount}/${lesson.grammar.length}`}
      />
     </div>
    </div>
   </Card>

   <LessonNoteAccessCard lesson={lesson} />

   <div className="grid gap-2 sm:grid-cols-2">
    {overviewActions.map((action) => {
     const Icon = action.icon;

     return (
      <Button
       key={action.module}
       type="button"
       variant="outline"
       className="h-auto justify-start rounded-xl border-border-default bg-bg-primary p-3 text-left shadow-theme-sm hover:border-accent-muted hover:bg-accent-subtle"
       onClick={() => onOpenModule(action.module)}
      >
       <Icon className="h-4 w-4" />
       <span className="min-w-0">
        <span className="block font-black">{action.title}</span>
        <span className="block text-xs font-semibold opacity-80">
         {action.description}
        </span>
       </span>
      </Button>
     );
    })}
   </div>
  </div>
 );
}

function Stat({ label, value }: { label: string; value: string }) {
 return (
  <div className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    {label}
   </p>
   <p className="text-lg font-black text-text-primary">{value}</p>
  </div>
 );
}
