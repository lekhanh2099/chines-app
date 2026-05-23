"use client";

import Select from "@/components/ui/select/index";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { IOption } from "@/types/option";

type LessonPickerProps = {
  lessons: HanziHomeLesson[];
  selectedLessonId: string;
  onSelectLesson: (lessonId: string) => void;
};

function getLessonLabel(lesson: HanziHomeLesson) {
  const bookPrefix = lesson.bookTitle ? `${lesson.bookTitle} · ` : "";

  return `${bookPrefix}${lesson.title}`;
}

export function LessonPicker({
  lessons,
  selectedLessonId,
  onSelectLesson,
}: LessonPickerProps) {
  const options: IOption[] = lessons.map((lesson) => ({
    value: lesson.id,
    label: getLessonLabel(lesson),
  }));

  const selectedOption =
    options.find((option) => option.value === selectedLessonId) ?? null;

  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-text-muted">
        Chọn bài học
      </span>

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
    </label>
  );
}
