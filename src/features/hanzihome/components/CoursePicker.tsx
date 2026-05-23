"use client";

import { BookMarked } from "lucide-react";

import Select from "@/components/ui/select/index";
import type { HanziHomeCourse } from "@/features/hanzihome/types";
import type { IOption } from "@/types/option";

type CoursePickerProps = {
 courses: HanziHomeCourse[];
 selectedCourseId: string;
 onSelectCourse: (courseId: string) => void;
};

export function CoursePicker({
 courses,
 selectedCourseId,
 onSelectCourse,
}: CoursePickerProps) {
 const selectedCourse =
  courses.find((course) => course.id === selectedCourseId) ?? courses[0];

 if (!selectedCourse) return null;

 if (courses.length <= 1) {
  return (
   <div className="grid gap-1">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
     Course hiện tại
    </p>

    <div className="flex h-9 min-w-0 items-center gap-2 rounded-2xl  border border-border-default bg-bg-subtle px-3 text-sm font-bold text-text-primary">
     <BookMarked className="h-4 w-4 shrink-0 text-text-muted" />
     <span className="truncate">{selectedCourse.title}</span>
    </div>
   </div>
  );
 }

 const options: IOption[] = courses.map((course) => ({
  value: course.id,
  label: course.title,
  icon: <BookMarked className="h-4 w-4" />,
 }));

 const selectedOption =
  options.find((option) => option.value === selectedCourse.id) ?? null;

 return (
  <label className="flex min-w-0 flex-col gap-2">
   <span className="text-xs font-black uppercase tracking-wide text-text-muted">
    Chọn course
   </span>

   <Select
    options={options}
    selectValue={selectedOption}
    triggerPlaceholder="Chọn course"
    onChange={(option: IOption | null) => {
     if (option?.value) onSelectCourse(String(option.value));
    }}
   />
  </label>
 );
}
