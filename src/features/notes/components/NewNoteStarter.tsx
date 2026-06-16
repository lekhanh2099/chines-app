"use client";

import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";

export function NewNoteStarter() {
 const router = useRouter();
 const createNoteMutation = useCreateNote();

 function handleCreate() {
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
   <div className="max-w-md text-center">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-bg-subtle text-text-muted">
     <FileText className="h-7 w-7" />
    </div>
    <h2 className="text-2xl font-bold text-text-primary">Tạo không gian ghi chú</h2>
    <p className="mt-2 text-sm font-medium leading-relaxed text-text-muted">
     Tạo note đầu tiên để lưu bài khóa, ngữ pháp, từ vựng hoặc ghi chú tự do.
    </p>
    <Button
     type="button"
     size="lg"
     className="mt-7"
     onClick={handleCreate}
     disabled={createNoteMutation.isPending}
    >
     {createNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
     Tạo ghi chú đầu tiên
    </Button>
   </div>
  </div>
 );
}
