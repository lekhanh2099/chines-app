"use client";

import Select from "@/components/ui/select/index";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { IOption } from "@/types/option";

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
 const options: IOption[] = lessons.map((lesson) => ({
  value: lesson.id,
  label: lesson.title,
 }));

 const selectedOption =
  options.find((option) => option.value === selectedLessonId) ?? null;

 return (
  <Select
   selectValue={selectedOption}
   onChange={(option) => {
    if (typeof option?.value === "string") {
     onSelectLesson(option.value);
    }
   }}
   options={options}
   triggerPlaceholder="Chọn bài trong course"
  />
 );
}
