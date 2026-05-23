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
import type {
  HanziHomeCourse,
  HanziHomeCourseBook,
} from "@/features/hanzihome/types";

type CreateLessonDraftDialogProps = {
  suggestedLessonNumber: number;
  courses: HanziHomeCourse[];
  books: HanziHomeCourseBook[];
  selectedCourseId: string;
  selectedBookId?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
};

export function CreateLessonDraftDialog({
  suggestedLessonNumber,
  courses,
  books,
  selectedCourseId,
  selectedBookId,
  triggerVariant = "default",
}: CreateLessonDraftDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant}>
          <FilePlus2 className="h-4 w-4" />
          Tạo bài mới
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo bài mới</DialogTitle>
          <DialogDescription>
            Tạo lesson draft trong Supabase. Bài mới sẽ được gắn vào course/quyển đang chọn.
          </DialogDescription>
        </DialogHeader>

        <CreateLessonDraftForm
          suggestedLessonNumber={suggestedLessonNumber}
          courses={courses}
          books={books}
          selectedCourseId={selectedCourseId}
          selectedBookId={selectedBookId}
          onCreated={(draft) => {
            setOpen(false);
            router.push(`/hanzihome/drafts/${draft.id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
