"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookPlus } from "lucide-react";
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
import type { HanziHomeCatalogCourse } from "@/features/hanzihome/types";

const formSchema = z.object({
 courseId: z.string().min(1),
 title: z.string().trim().min(1),
 shortTitle: z.string().trim(),
});

export function CreateBookDialog({ courses }: { courses: HanziHomeCatalogCourse[] }) {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const form = useAppForm({
  defaultValues: { courseId: courses[0]?.id ?? "", title: "", shortTitle: "" },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   try {
    await createCanonicalContent({
     entityType: "book",
     reason: `Tạo quyển ${value.title}`,
     changes: {
      course_id: value.courseId,
      title: value.title,
      short_title: value.shortTitle || null,
     },
    });
    await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
    toast.success("Đã tạo quyển.");
    form.reset();
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể tạo quyển.");
   }
  },
 });

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button type="button" size="sm" variant="outline" disabled={courses.length === 0}>
     <BookPlus className="h-4 w-4" />
     Quyển
    </Button>
   </DialogTrigger>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Tạo quyển</DialogTitle>
     <DialogDescription>Quyển mới thuộc một khóa học hiện có.</DialogDescription>
    </DialogHeader>
    <form
     onSubmit={(event) => {
      event.preventDefault();
      void form.handleSubmit();
     }}
    >
     <DialogBody className="grid gap-4">
      <form.AppField name="courseId">
       {(field) => (
        <field.Select
         label="Khóa học"
         required
         options={courses.map((course) => ({ value: course.id, label: course.title }))}
        />
       )}
      </form.AppField>
      <form.AppField name="title">
       {(field) => <field.TextField label="Tên quyển" required />}
      </form.AppField>
      <form.AppField name="shortTitle">
       {(field) => <field.TextField label="Tên ngắn" />}
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
