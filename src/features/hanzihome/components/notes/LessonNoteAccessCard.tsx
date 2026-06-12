"use client";

import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";

import { LessonSplitNoteEditor } from "./LessonSplitNoteEditor";
import { createPersonalNoteContent } from "./lessonNoteContent";

export function LessonNoteAccessCard() {
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
    title: `Ghi chú: ${lesson.title}`,
    category: "general",
    tags: ["hanzihome", lesson.id, "lesson-note"],
    content: createPersonalNoteContent(lesson),
   },
   {
    onSuccess: () => toast.success("Đã tạo note cho bài học"),
    onError: () => toast.error("Không tạo được note cho bài học"),
   },
  );
 };

 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
       <FileText className="h-5 w-5" />
      </span>
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Lesson note
       </p>
       <h2 className="text-xl font-black text-text-primary">
        Ghi chú riêng của bài
       </h2>
      </div>
     </div>
     {!note ? (
      <Button
       type="button"
       disabled={linkedNoteQuery.isLoading || isCreating}
       onClick={handleCreate}
      >
       {linkedNoteQuery.isLoading || isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
       ) : (
        <Plus className="h-4 w-4" />
       )}
       Tạo note cho bài
      </Button>
     ) : null}
    </div>

    {linkedNoteQuery.isLoading ? (
     <div className="rounded-xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      Đang kiểm tra note...
     </div>
    ) : note ? (
     <LessonSplitNoteEditor noteId={note.id} />
    ) : (
     <button
      type="button"
      onClick={handleCreate}
      disabled={isCreating}
      className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4 text-left text-sm font-semibold text-text-muted transition-colors hover:border-accent-muted hover:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-60"
     >
      Chưa có note cho bài này. Bấm để tạo split note.
     </button>
    )}
   </div>
  </Card>
 );
}
