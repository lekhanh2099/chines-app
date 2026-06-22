"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { createCanonicalContent } from "@/features/hanzihome/editing/direct-save";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";

const formSchema = z.object({
 bookId: z.string().min(1),
 lessonNumber: z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, "Số bài phải là số nguyên dương"),
 titleZh: z.string().trim().min(1),
 titleVi: z.string().trim(),
});

type CreateLessonFormValues = z.input<typeof formSchema>;

export function CreateLessonDialog({
 courses,
 books,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
}) {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const firstBook = books[0];
 const form = useAppForm({
  defaultValues: {
   bookId: firstBook?.id ?? "",
   lessonNumber: "1",
   titleZh: "",
   titleVi: "",
  } satisfies CreateLessonFormValues,
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   try {
    await createCanonicalContent({
     entityType: "lesson",
     reason: `Tạo bài ${value.lessonNumber}: ${value.titleZh}`,
     changes: {
      course_id: books.find((book) => book.id === value.bookId)?.courseId,
      book_id: value.bookId,
      lesson_number: Number(value.lessonNumber),
      title_zh: value.titleZh,
      title_vi: value.titleVi,
     },
    });
    await Promise.all([
     queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] }),
     queryClient.invalidateQueries({ queryKey: ["hanzihome", "course-lessons"] }),
    ]);
    toast.success("Đã tạo bài học.");
    form.reset();
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể tạo bài học.");
   }
  },
 });
 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button type="button" size="sm" variant="outline" disabled={books.length === 0}>
     <FilePlus2 className="h-4 w-4" />
     Bài học
    </Button>
   </DialogTrigger>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Tạo bài học</DialogTitle>
     <DialogDescription>Bài mới được tạo trực tiếp trong Supabase.</DialogDescription>
    </DialogHeader>
    <form
     onSubmit={(event) => {
      event.preventDefault();
      void form.handleSubmit();
     }}
    >
     <DialogBody className="grid gap-4">
      <form.AppField name="bookId">
       {(field) => (
        <field.Select
         label="Quyển"
         required
         options={books.map((book) => ({
          value: book.id,
          label: `${courses.find((course) => course.id === book.courseId)?.title ?? book.courseId} · ${book.title}`,
         }))}
        />
       )}
      </form.AppField>
      <form.AppField name="lessonNumber">
       {(field) => <field.TextField label="Số bài" type="number" min={1} required />}
      </form.AppField>
      <form.AppField name="titleZh">
       {(field) => <field.TextField label="Tiêu đề tiếng Trung" required />}
      </form.AppField>
      <form.AppField name="titleVi">
       {(field) => <field.TextField label="Tiêu đề tiếng Việt" />}
      </form.AppField>
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
       Hủy
      </Button>
      <Button type="submit">Tạo</Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
