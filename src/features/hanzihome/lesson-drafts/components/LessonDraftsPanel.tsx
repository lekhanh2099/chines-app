"use client";

import { FilePlus2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateLessonDraftForm } from "@/features/hanzihome/lesson-drafts/components/CreateLessonDraftForm";
import {
 useDeleteLessonDraftMutation,
 useLessonDraftsQuery,
} from "@/features/hanzihome/lesson-drafts";
import type {
 HanziHomeCourse,
 HanziHomeCourseBook,
} from "@/features/hanzihome/types";

type LessonDraftsPanelProps = {
 suggestedLessonNumber: number;
 courses: HanziHomeCourse[];
 books: HanziHomeCourseBook[];
 selectedCourseId: string;
 selectedBookId?: string;
};

export function LessonDraftsPanel({
 suggestedLessonNumber,
 courses,
 books,
 selectedCourseId,
 selectedBookId,
}: LessonDraftsPanelProps) {
 const draftsQuery = useLessonDraftsQuery();
 const deleteMutation = useDeleteLessonDraftMutation();

 const drafts = draftsQuery.data ?? [];

 const handleDelete = async (draftId: string, title: string) => {
  const confirmed = window.confirm(`Xóa bài nháp "${title}"?`);

  if (!confirmed) return;

  await deleteMutation.mutateAsync(draftId);
  toast.success("Đã xóa bài nháp");
 };

 return (
  <Card padding="md" className="rounded-2xl -2xl">
   <div className="grid gap-5">
    <div className="grid gap-1">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Bài tự tạo
     </p>

     <h2 className="text-lg font-black text-text-primary">Tạo bài mới</h2>

     <p className="text-sm font-semibold text-text-muted">
      Bài mới sẽ được lưu vào Supabase dưới dạng draft và gắn vào course/quyển
      đang chọn.
     </p>
    </div>

    <div className="rounded-2xl border border-border-default bg-bg-primary p-4">
     <CreateLessonDraftForm
      suggestedLessonNumber={suggestedLessonNumber}
      courses={courses}
      books={books}
      selectedCourseId={selectedCourseId}
      selectedBookId={selectedBookId}
     />
    </div>

    <div className="grid gap-2">
     <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-black text-text-primary">Draft đã tạo</h3>

      <span className="text-xs font-black uppercase tracking-wide text-text-muted">
       {drafts.length} bài
      </span>
     </div>

     {draftsQuery.isLoading && (
      <p className="text-sm font-semibold text-text-muted">
       Đang tải bài nháp...
      </p>
     )}

     {draftsQuery.error && (
      <p role="alert" className="text-sm font-bold text-destructive">
       {draftsQuery.error.message}
      </p>
     )}

     {!draftsQuery.isLoading && !draftsQuery.error && drafts.length === 0 && (
      <div className="rounded-2xl border border-dashed border-border-default p-4 text-sm font-semibold text-text-muted">
       Chưa có bài tự tạo. Điền form phía trên để tạo lesson draft đầu tiên.
      </div>
     )}

     {drafts.map((draft) => (
      <div
       key={draft.id}
       className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-default bg-bg-primary p-3"
      >
       <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl -xl bg-bg-subtle">
         <FilePlus2 className="h-5 w-5" />
        </span>

        <div className="min-w-0">
         <p className="truncate text-sm font-black text-text-primary">
          {draft.lessonNumber ? `Bài ${draft.lessonNumber}: ` : ""}
          {draft.titleZh}
         </p>

         <p className="truncate text-xs font-semibold text-text-muted">
          {draft.content.lesson.bookTitle ||
           draft.content.lesson.courseTitle ||
           draft.titleVi ||
           draft.lessonKey}{" "}
          · {draft.status}
         </p>
        </div>
       </div>

       <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={deleteMutation.isPending}
        onClick={() => void handleDelete(draft.id, draft.titleZh)}
       >
        <Trash2 className="h-4 w-4" />
        Xóa
       </Button>
      </div>
     ))}
    </div>
   </div>
  </Card>
 );
}
