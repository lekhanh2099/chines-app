"use client";

import { Select } from "@/components/ui/select";
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
    value={selectedLessonId}
    onChange={(event) => onSelectLesson(event.target.value)}
    aria-label="Chọn bài HanziHome"
   >
    {lessons.map((lesson) => (
     <option key={lesson.id} value={lesson.id}>
      {lesson.title}
     </option>
    ))}
   </Select>
  </label>
 );
}
