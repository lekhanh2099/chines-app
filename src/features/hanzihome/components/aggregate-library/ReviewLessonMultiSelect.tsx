import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AggregateKind } from "./aggregate-utils";
import { formatLessonHeading } from "./aggregate-utils";

export function ReviewLessonMultiSelect({
 kind,
 selectedLessonIds,
 lessons,
 activeLessonTitle,
 onToggleLesson,
 onStartReview,
 onCloseReview,
}: {
 kind: AggregateKind;
 selectedLessonIds: string[];
 lessons: Array<{
  id: string;
  lessonNumber: number;
  title: string;
  titleZh: string;
 }>;
 activeLessonTitle: string;
 onToggleLesson: (lessonId: string) => void;
 onStartReview: () => void;
 onCloseReview: () => void;
}) {
 return (
  <TooltipProvider>
   <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div className="flex flex-wrap items-center gap-1.5">
     <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-black text-text-muted">
      {selectedLessonIds.length}
     </span>
     {lessons.map((lesson) => {
      const selected = selectedLessonIds.includes(lesson.id);
      const fullTitle = formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title);

      return (
       <Tooltip key={lesson.id}>
        <TooltipTrigger asChild>
         <Button
          type="button"
          size="xs"
          variant={selected ? "default" : "outline"}
          title={fullTitle}
          aria-pressed={selected}
          onClick={() => onToggleLesson(lesson.id)}
          className="h-7 rounded-lg px-2.5 font-black"
         >
          Bài {lesson.lessonNumber}
         </Button>
        </TooltipTrigger>
        <TooltipContent>{fullTitle}</TooltipContent>
       </Tooltip>
      );
     })}
    </div>

    <div className="flex flex-wrap justify-end gap-2">
     {activeLessonTitle && (
      <Button type="button" size="sm" variant="outline" onClick={onCloseReview}>
       Đóng ôn
      </Button>
     )}
     <Button
      type="button"
      size="sm"
      disabled={selectedLessonIds.length === 0}
      onClick={onStartReview}
     >
      <RotateCcw className="h-4 w-4" />
      {kind === "vocab" ? "Ôn từ vựng" : "Ôn ngữ pháp"}
     </Button>
    </div>
   </div>
  </TooltipProvider>
 );
}
