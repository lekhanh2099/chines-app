"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <FilePlus2 className="h-4 w-4" />
          Tạo bài mới
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo bài mới</DialogTitle>
          <DialogDescription>
            Bài mới sẽ được lưu vào Supabase dưới dạng draft, không sửa JSON tĩnh.
          </DialogDescription>
        </DialogHeader>

        <CreateLessonDraftForm
          suggestedLessonNumber={suggestedLessonNumber}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
