"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { LinkedContentSkeleton } from "@/features/hanzihome/components/LinkedContentSkeleton";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";

import { LessonSplitNoteEditor } from "./LessonSplitNoteEditor";
import { createPersonalNoteContent } from "./lessonNoteContent";

export function LessonNoteAccessCard({ compact = false }: { compact?: boolean }) {
 const { lesson } = useHanziHomeRuntime();
 const linkedNoteQuery = useLessonLinkedNote(
  lesson.id,
  "main",
  lesson.legacyLessonId ? [lesson.legacyLessonId] : [],
 );
 const createNoteMutation = useCreateLessonLinkedNote();
 const note = linkedNoteQuery.data;
 const isCreating = createNoteMutation.isPending;

 const handleCreate = () => {
  createNoteMutation.mutate(
   {
    lessonId: lesson.id,
    relationType: "main",
    title: `${lesson.bookTitle ? `${lesson.bookTitle} · ` : ""}Bài ${lesson.lessonNumber} · ${lesson.title}`,
    category: "general",
    tags: ["hanzihome", lesson.id, "lesson-note"],
    content: createPersonalNoteContent(lesson),
   },
   {
    onSuccess: () => toast.success("Đã tạo ghi chú cho bài học"),
    onError: () => toast.error("Không tạo được ghi chú cho bài học"),
   },
  );
 };

 return (
  <Card padding="lg" className={compact ? "h-full min-h-0 rounded-xl" : "rounded-xl"}>
   <div className={compact ? "grid h-full min-h-0 gap-4" : "grid gap-4"}>
    {linkedNoteQuery.isLoading ? (
     <LinkedContentSkeleton label="Đang kiểm tra ghi chú của bài" />
    ) : note ? (
     <LessonSplitNoteEditor noteId={note.id} fillHeight={compact} />
    ) : (
     <button
      type="button"
      onClick={handleCreate}
      disabled={isCreating}
      className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4 text-left  font-semibold text-text-muted transition-colors hover:border-accent-muted hover:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-60"
     >
      {isCreating ? (
       <span className="inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tạo ghi chú cho bài...
       </span>
      ) : (
       "Chưa có ghi chú riêng cho bài này. Bấm để tạo ghi chú liên kết với bài học."
      )}
     </button>
    )}
   </div>
  </Card>
 );
}
