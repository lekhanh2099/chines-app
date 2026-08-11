"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { LibraryCrudActionsMenu } from "@/features/hanzihome/components/library/LibraryCrudActionsMenu";
import {
 deleteCanonicalContent,
 reorderCanonicalContent,
 type ReorderDirection,
 updateCanonicalContent,
} from "@/features/hanzihome/editing/direct-save";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
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
    await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
    toast.success("Đã cập nhật khóa học.");
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể cập nhật khóa học.");
   }
  },
 });

 async function deleteCourse() {
  if (!course.updatedAt) return;
  try {
   await deleteCanonicalContent({
    entityType: "course",
    entityId: course.id,
    expectedUpdatedAt: course.updatedAt,
    reason: `Xóa khóa học ${course.title}`,
   });
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
   toast.success("Đã xóa khóa học. Có thể khôi phục trong Edit Mode.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa khóa học.");
   throw error;
  }
 }

 async function reorderCourse(direction: ReorderDirection) {
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
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
   toast.success("Đã cập nhật thứ tự khóa học.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp khóa học.");
  }
 }

 return (
  <>
   <LibraryCrudActionsMenu
    ariaLabel={`Tác vụ cho ${course.title}`}
    itemType="khóa học"
    itemLabel={course.title}
    disabled={!course.updatedAt}
    canMoveUp={course.order !== 1}
    onEdit={() => setOpen(true)}
    onMoveUp={() => void reorderCourse(-1)}
    onMoveDown={() => void reorderCourse(1)}
    onDelete={deleteCourse}
   />

   <Dialog open={open} onOpenChange={setOpen}>
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
  </>
 );
}
