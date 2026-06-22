"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
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
import {
 deleteCanonicalContent,
 reorderCanonicalContent,
 updateCanonicalContent,
} from "@/features/hanzihome/editing/direct-save";
import type { HanziHomeCatalogCourse } from "@/features/hanzihome/types";

const formSchema = z.object({
 title: z.string().trim().min(1),
 slug: z.string().trim().min(2),
 subtitle: z.string().trim(),
 type: z.string().trim().min(1),
});

export function CourseCrudActions({ course }: { course: HanziHomeCatalogCourse }) {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const form = useAppForm({
  defaultValues: {
   title: course.title,
   slug: course.slug,
   subtitle: course.subtitle ?? "",
   type: course.type,
  },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   if (!course.updatedAt) return;
   const changes = {
    ...(value.title !== course.title ? { title: value.title } : {}),
    ...(value.slug !== course.slug ? { slug: value.slug } : {}),
    ...(value.subtitle !== (course.subtitle ?? "") ? { subtitle: value.subtitle || null } : {}),
    ...(value.type !== course.type ? { type: value.type } : {}),
   };
   if (Object.keys(changes).length === 0) {
    toast.info("Không có thay đổi để lưu.");
    return;
   }
   try {
    await updateCanonicalContent({
     entityType: "course",
     entityId: course.id,
     expectedUpdatedAt: course.updatedAt,
     reason: `Cập nhật khóa học ${course.title}`,
     changes,
    });
    await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
    toast.success("Đã cập nhật khóa học.");
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể cập nhật khóa học.");
   }
  },
 });

 async function deleteCourse() {
  if (!course.updatedAt || !window.confirm(`Xóa mềm khóa học "${course.title}"?`)) return;
  try {
   await deleteCanonicalContent({
    entityType: "course",
    entityId: course.id,
    expectedUpdatedAt: course.updatedAt,
    reason: `Xóa khóa học ${course.title}`,
   });
   await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
   toast.success("Đã xóa khóa học. Có thể khôi phục trong Edit Mode.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa khóa học.");
  }
 }

 async function reorderCourse(direction: -1 | 1) {
  if (!course.updatedAt) return;
  try {
   await reorderCanonicalContent({
    entityType: "course",
    entityId: course.id,
    expectedUpdatedAt: course.updatedAt,
    orderField: "course_order",
    order: course.order + direction,
    reason: `Sắp xếp khóa học ${course.title}`,
   });
   await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
   toast.success("Đã cập nhật thứ tự khóa học.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp khóa học.");
  }
 }

 return (
  <div className="flex items-center gap-1">
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
     <Button type="button" size="icon" variant="ghost" aria-label={`Sửa ${course.title}`}>
      <Pencil className="h-4 w-4" />
     </Button>
    </DialogTrigger>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>Sửa khóa học</DialogTitle>
      <DialogDescription>Thay đổi được lưu trực tiếp vào Supabase.</DialogDescription>
     </DialogHeader>
     <form
      onSubmit={(event) => {
       event.preventDefault();
       void form.handleSubmit();
      }}
     >
      <DialogBody className="grid gap-4">
       <form.AppField name="title">
        {(field) => <field.TextField label="Tên khóa học" required />}
       </form.AppField>
       <form.AppField name="slug">
        {(field) => <field.TextField label="Slug" required />}
       </form.AppField>
       <form.AppField name="subtitle">
        {(field) => <field.TextField label="Mô tả ngắn" />}
       </form.AppField>
       <form.AppField name="type">
        {(field) => <field.TextField label="Loại" required />}
       </form.AppField>
      </DialogBody>
      <DialogFooter>
       <Button type="button" variant="outline" onClick={() => form.reset()}>
        Reset
       </Button>
       <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        Hủy
       </Button>
       <Button type="submit" disabled={!course.updatedAt}>
        Lưu
       </Button>
      </DialogFooter>
     </form>
    </DialogContent>
   </Dialog>
   <Button
    type="button"
    size="icon"
    variant="ghost"
    aria-label={`Đưa ${course.title} lên`}
    disabled={!course.updatedAt || course.order === 1}
    onClick={() => void reorderCourse(-1)}
   >
    <ArrowUp className="h-4 w-4" />
   </Button>
   <Button
    type="button"
    size="icon"
    variant="ghost"
    aria-label={`Đưa ${course.title} xuống`}
    disabled={!course.updatedAt}
    onClick={() => void reorderCourse(1)}
   >
    <ArrowDown className="h-4 w-4" />
   </Button>
   <Button
    type="button"
    size="icon"
    variant="ghost"
    aria-label={`Xóa ${course.title}`}
    disabled={!course.updatedAt}
    onClick={() => void deleteCourse()}
   >
    <Trash2 className="h-4 w-4 text-danger-text" />
   </Button>
  </div>
 );
}
