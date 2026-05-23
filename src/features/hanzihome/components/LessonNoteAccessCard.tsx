"use client";

import { StickyNote } from "lucide-react";

import { LessonLinkedRichContentCard } from "@/features/hanzihome/components/LessonLinkedRichContentCard";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

type LessonNoteAccessCardProps = {
  lesson: HanziHomeLesson;
};

export function LessonNoteAccessCard({ lesson }: LessonNoteAccessCardProps) {
  return (
    <LessonLinkedRichContentCard
      lesson={lesson}
      relationType="main"
      icon={StickyNote}
      eyebrow="Lesson note"
      title="Ghi chú riêng của bài"
      description="Note này dùng hệ ghi chú chính: rich editor, autosave, tab, split view."
      emptyText="Chưa có note cho bài này. Bấm “Tạo note cho bài” để tạo note bằng hệ ghi chú chính."
      createButtonLabel="Tạo note cho bài"
      editButtonLabel="Sửa note"
      toastSuccessText="Đã tạo note cho bài học"
      toastErrorText="Không tạo được note cho bài học"
      noteTitle={lesson.title}
      tags={["hanzihome", lesson.id, "lesson-note"]}
      placeholderText="Ghi nhanh điều cần nhớ cho bài này..."
    />
  );
}
