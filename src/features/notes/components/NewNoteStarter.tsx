"use client";

import { useRouter } from "next/navigation";
import { useSelector } from "@tanstack/react-store";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { focusModeStore } from "@/stores/focus-mode-store";

export function NewNoteStarter() {
 const router = useRouter();
 const createNoteMutation = useCreateNote();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 function handleCreate() {
  if (focusModeEnabled) {
   toast.warning("Focus mode đang bật. Không thể tạo ghi chú mới.");
   return;
  }

  createNoteMutation.mutate(
   {
    title: "Ghi chú đầu tiên của tôi",
    tags: [],
    category: "general",
    content: {
     type: "doc",
     content: [{ type: "paragraph" }],
    },
   },
   {
    onSuccess: (note) => {
     router.replace(`/notes/${note.id}`);
    },
   },
  );
 }

 return (
  <div className="flex h-full items-center justify-center px-6">
   <EmptyState
    className="max-w-md"
    size="spacious"
    icon={<FileText />}
    title="Tạo không gian ghi chú"
    description="Tạo ghi chú đầu tiên để lưu bài khóa, ngữ pháp, từ vựng hoặc ghi chú tự do."
    actions={
     <Button
      type="button"
      size="touch"
      onClick={handleCreate}
      disabled={createNoteMutation.isPending || focusModeEnabled}
     >
      {createNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Tạo ghi chú đầu tiên
     </Button>
    }
   />
  </div>
 );
}
