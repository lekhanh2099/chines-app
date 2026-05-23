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
    const confirmed = window.confirm(`Xóa bài nháp "${title}"?`);

    if (!confirmed) return;

    await deleteMutation.mutateAsync(draftId);
    toast.success("Đã xóa bài nháp");
  };

  return (
    <Card padding="sm" className="rounded-2xl">
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              Bài tự tạo
            </p>
            <p className="mt-1 text-sm font-semibold text-text-muted">
              Draft lưu trong Supabase, không sửa JSON tĩnh.
            </p>
          </div>

          <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
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
          <div className="rounded-2xl border border-dashed border-border-default bg-bg-primary p-4 text-sm font-semibold text-text-muted">
            Chưa có bài tự tạo. Bấm “Tạo bài mới” ở header để tạo draft đầu tiên.
          </div>
        )}

        {drafts.length > 0 && (
          <div className="grid gap-2">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-default bg-bg-primary p-3"
              >
                <Link
                  href={`/hanzihome/drafts/${draft.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
                    <FilePlus2 className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-text-primary">
                      {draft.lessonNumber ? `Bài ${draft.lessonNumber}: ` : ""}
                      {draft.titleZh}
                    </p>
                    <p className="truncate text-xs font-semibold text-text-muted">
                      {draft.titleVi || draft.lessonKey} · {draft.status}
                    </p>
                  </div>
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
          </div>
        )}
      </div>
    </Card>
  );
}
