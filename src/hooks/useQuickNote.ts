"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";

export function useQuickNote() {
 const router = useRouter();
 const createNoteMutation = useCreateNote();

 const handleCreate = () => {
  if (createNoteMutation.isPending) return;

  const now = new Date();
  const title = `Ghi chú nhanh — ${now.toLocaleDateString("vi-VN", {
   day: "2-digit",
   month: "2-digit",
   year: "numeric",
   hour: "2-digit",
   minute: "2-digit",
  })}`;

  createNoteMutation.mutate(
   {
    title,
    tags: ["quick-note"],
    content: {
     type: "doc",
     content: [{ type: "paragraph" }],
    },
   },
   {
    onSuccess: (note) => {
     router.push(`/notes/${note.id}`);
    },
    onError: (error) => {
     console.error("Error creating quick note:", error);
     toast.error("Không thể tạo ghi chú nhanh");
    },
   },
  );
 };

 return { handleCreate, isCreating: createNoteMutation.isPending };
}
