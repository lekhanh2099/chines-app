"use client";

import Select from "@/components/ui/select/index";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

type LessonPickerProps = {
 lessons: HanziHomeLesson[];
 selectedLessonId: string;
 onSelectLesson: (lessonId: string) => void;
};

export function LessonPicker({
 lessons,
 selectedLessonId,
 onSelectLesson,
}: LessonPickerProps) {
 return (
  <label className="flex min-w-0 flex-col gap-2">
   <span className="text-xs font-black uppercase tracking-wide text-text-muted">
    Chọn bài học
   </span>
   <Select
    selectValue={
     lessons.find((lesson) => lesson.id === selectedLessonId) ?? null
    }
    onChange={(event) => onSelectLesson(event?.value as string)}
    options={lessons.map((lesson) => ({
     value: lesson.id,
     label: lesson.title,
    }))}
    aria-label="Chọn bài HanziHome"
   />
  </label>
 );
}
