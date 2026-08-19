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
import type { HanziHomeLesson } from "@/features/hanzihome/types";

const formSchema = z.object({
 titleZh: z.string().trim().min(1),
 titlePinyin: z.string().trim(),
 titleVi: z.string().trim(),
 titleEn: z.string().trim(),
 tags: z.string(),
});

export function LessonCrudActions({ lesson }: { lesson: HanziHomeLesson }) {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const updatedAt = lesson.editMeta?.updatedAt;
 const order = lesson.lessonOrder ?? lesson.editMeta?.order;
 const form = useAppForm({
  defaultValues: {
   titleZh: lesson.titleZh,
   titlePinyin: lesson.titlePinyin ?? "",
   titleVi: lesson.title,
   titleEn: lesson.titleEn ?? "",
   tags: (lesson.tags ?? []).join("\n"),
  },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   if (!updatedAt) return;
   const changes = {
    ...(value.titleZh !== lesson.titleZh ? { title_zh: value.titleZh } : {}),
    ...(value.titlePinyin !== (lesson.titlePinyin ?? "")
     ? { title_pinyin: value.titlePinyin || null }
     : {}),
    ...(value.titleVi !== lesson.title ? { title_vi: value.titleVi || null } : {}),
    ...(value.titleEn !== (lesson.titleEn ?? "") ? { title_en: value.titleEn || null } : {}),
    ...(value.tags !== (lesson.tags ?? []).join("\n")
     ? {
        tags: value.tags
         .split("\n")
         .map((tag) => tag.trim())
         .filter(Boolean),
       }
     : {}),
   };
   if (Object.keys(changes).length === 0) {
    toast.info("Không có thay đổi để lưu.");
    return;
   }
   try {
    await updateCanonicalContent({
     entityType: "lesson",
     entityId: lesson.id,
     expectedUpdatedAt: updatedAt,
     reason: `Cập nhật bài ${lesson.lessonNumber}`,
     changes,
    });
    await invalidateLessonLibrary(queryClient, lesson.courseId);
    toast.success("Đã cập nhật bài học.");
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể cập nhật bài học.");
   }
  },
 });

 async function deleteLesson() {
  if (!updatedAt) return;
  try {
   await deleteCanonicalContent({
    entityType: "lesson",
    entityId: lesson.id,
    expectedUpdatedAt: updatedAt,
    reason: `Xóa bài ${lesson.lessonNumber}`,
   });
   await invalidateLessonLibrary(queryClient, lesson.courseId);
   toast.success("Đã xóa bài học.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa bài học.");
   throw error;
  }
 }

 async function reorderLesson(direction: ReorderDirection) {
  if (!updatedAt || !order) return;
  try {
   await reorderCanonicalContent({
    entityType: "lesson",
    entityId: lesson.id,
    expectedUpdatedAt: updatedAt,
    orderField: "lesson_order",
    order: order + direction,
    reason: `Sắp xếp bài ${lesson.lessonNumber}`,
   });
   await invalidateLessonLibrary(queryClient, lesson.courseId);
   toast.success("Đã cập nhật thứ tự bài học.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp bài học.");
  }
 }

 return (
  <>
   <LibraryCrudActionsMenu
    ariaLabel={`Tác vụ cho ${lesson.titleZh}`}
    itemType="bài học"
    itemLabel={lesson.titleZh}
    disabled={!updatedAt}
    canMoveUp={Boolean(order && order !== 1)}
    canMoveDown={Boolean(order)}
    onEdit={() => setOpen(true)}
    onMoveUp={() => void reorderLesson(-1)}
    onMoveDown={() => void reorderLesson(1)}
    onDelete={deleteLesson}
   />

   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>Sửa bài học</DialogTitle>
      <DialogDescription>Thay đổi được lưu trực tiếp vào Supabase.</DialogDescription>
     </DialogHeader>
     <form
      onSubmit={(event) => {
       event.preventDefault();
       void form.handleSubmit();
      }}
     >
      <DialogBody className="grid gap-4">
       <form.AppField name="titleZh">
        {(field) => <field.TextField label="Tiêu đề tiếng Trung" required />}
       </form.AppField>
       <form.AppField name="titleVi">
        {(field) => <field.TextField label="Tiêu đề tiếng Việt" />}
       </form.AppField>
       <form.AppField name="titlePinyin">
        {(field) => <field.TextField label="Pinyin tiêu đề" />}
       </form.AppField>
       <form.AppField name="titleEn">
        {(field) => <field.TextField label="Tiêu đề tiếng Anh" />}
       </form.AppField>
       <form.AppField name="tags">
        {(field) => <field.Textarea label="Tags" description="Mỗi dòng là một tag." />}
       </form.AppField>
      </DialogBody>
      <DialogFooter>
       <Button type="button" variant="outline" onClick={() => form.reset()}>
        Reset
       </Button>
       <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        Hủy
       </Button>
       <Button type="submit" disabled={!updatedAt}>
        Lưu
       </Button>
      </DialogFooter>
     </form>
    </DialogContent>
   </Dialog>
  </>
 );
}

async function invalidateLessonLibrary(
 queryClient: ReturnType<typeof useQueryClient>,
 courseId?: string,
) {
 await Promise.all([
  queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot }),
  queryClient.invalidateQueries({
   queryKey: courseId
    ? hanzihomeQueryKeys.courseLessons(courseId)
    : hanzihomeQueryKeys.courseLessonsRoot,
  }),
 ]);
}
