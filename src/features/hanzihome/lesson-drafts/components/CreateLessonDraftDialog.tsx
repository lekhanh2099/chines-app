"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateLessonDraftForm } from "@/features/hanzihome/lesson-drafts/components/CreateLessonDraftForm";

type CreateLessonDraftDialogProps = {
  suggestedLessonNumber: number;
};

export function CreateLessonDraftDialog({
  suggestedLessonNumber,
}: CreateLessonDraftDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <FilePlus2 className="h-4 w-4" />
          Tạo bài mới
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo bài mới</DialogTitle>
          <DialogDescription>
            Tạo lesson draft trong Supabase. Sau khi tạo, bạn sẽ được chuyển sang trang soạn bài.
          </DialogDescription>
        </DialogHeader>

        <CreateLessonDraftForm
          suggestedLessonNumber={suggestedLessonNumber}
          onCreated={(draft) => {
            setOpen(false);
            router.push(`/hanzihome/drafts/${draft.id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
