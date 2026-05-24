"use client";

import Link from "next/link";
import { FilePlus2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 useDeleteLessonDraftMutation,
 useLessonDraftsQuery,
} from "@/features/hanzihome/lesson-drafts";

export function LessonDraftsCompactList() {
 const draftsQuery = useLessonDraftsQuery();
 const deleteMutation = useDeleteLessonDraftMutation();

 const drafts = draftsQuery.data ?? [];

 const handleDelete = async (draftId: string, title: string) => {
  const confirmed = window.confirm(`Xóa bài nháp"${title}"?`);

  if (!confirmed) return;

  await deleteMutation.mutateAsync(draftId);
  toast.success("Đã xóa bài nháp");
 };

 return (
  <Card padding="md" className="h-full rounded-xl">
   <div className="grid gap-4">
    <div className="flex items-start justify-between gap-3">
     <div className="flex min-w-0 gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
       <FilePlus2 className="h-5 w-5" />
      </span>

      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Bài tự tạo
       </p>
       <h2 className="text-lg font-black text-text-primary">
        Draft Supabase
       </h2>
       <p className="text-sm font-semibold text-text-muted">
        Bài custom, không sửa JSON tĩnh.
       </p>
      </div>
     </div>

     <span className="shrink-0 rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
      {drafts.length} bài
     </span>
    </div>

    {draftsQuery.isLoading && (
     <p className="text-sm font-semibold text-text-muted">
      Đang tải bài tự tạo...
     </p>
    )}

    {draftsQuery.error && (
     <p role="alert" className="text-sm font-bold text-destructive">
      {draftsQuery.error.message}
     </p>
    )}

    {!draftsQuery.isLoading && !draftsQuery.error && drafts.length === 0 && (
     <div className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      Chưa có bài tự tạo.
     </div>
    )}

    {drafts.length > 0 && (
     <div className="grid gap-2">
      {drafts.slice(0, 3).map((draft) => (
       <div
        key={draft.id}
        className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-bg-subtle p-3"
       >
        <Link href={`/hanzihome/drafts/${draft.id}`} className="min-w-0 flex-1">
         <p className="truncate text-sm font-black text-text-primary">
          {draft.lessonNumber ? `Bài ${draft.lessonNumber}: ` : ""}
          {draft.titleZh}
         </p>

         <p className="truncate text-xs font-semibold text-text-muted">
          {draft.content.lesson.bookTitle ||
           draft.content.lesson.courseTitle ||
           draft.lessonKey}{" "}
          · {draft.status}
         </p>
        </Link>

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

      {drafts.length > 3 && (
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        +{drafts.length - 3} bài khác
       </p>
      )}
     </div>
    )}
   </div>
  </Card>
 );
}
