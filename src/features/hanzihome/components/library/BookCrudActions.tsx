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
import { SoftDeleteConfirmDialog } from "@/features/hanzihome/editing/components/SoftDeleteConfirmDialog";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { HanziHomeCourseBook } from "@/features/hanzihome/types";

const formSchema = z.object({
 title: z.string().trim().min(1),
 shortTitle: z.string().trim(),
});

export function BookCrudActions({
 book,
 canMoveUp = true,
 canMoveDown = true,
}: {
 book: HanziHomeCourseBook;
 canMoveUp?: boolean;
 canMoveDown?: boolean;
}) {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const form = useAppForm({
  defaultValues: { title: book.title, shortTitle: book.shortTitle ?? "" },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   if (!book.updatedAt) return;
   const changes = {
    ...(value.title !== book.title ? { title: value.title } : {}),
    ...(value.shortTitle !== (book.shortTitle ?? "")
     ? { short_title: value.shortTitle || null }
     : {}),
   };
   if (Object.keys(changes).length === 0) {
    toast.info("Không có thay đổi để lưu.");
    return;
   }
   try {
    await updateCanonicalContent({
     entityType: "book",
     entityId: book.id,
     expectedUpdatedAt: book.updatedAt,
     reason: `Cập nhật quyển ${book.title}`,
     changes,
    });
    await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
    toast.success("Đã cập nhật quyển.");
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể cập nhật quyển.");
   }
  },
 });

 async function deleteBook() {
  if (!book.updatedAt) return;
  try {
   await deleteCanonicalContent({
    entityType: "book",
    entityId: book.id,
    expectedUpdatedAt: book.updatedAt,
    reason: `Xóa quyển ${book.title}`,
   });
   await Promise.all([
    queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot }),
    queryClient.invalidateQueries({
     queryKey: hanzihomeQueryKeys.courseLessons(book.courseId),
    }),
   ]);
   toast.success("Đã xóa quyển. Có thể khôi phục trong Edit Mode.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa quyển.");
   throw error;
  }
 }

 async function reorderBook(direction: -1 | 1) {
  if (!book.updatedAt) return;
  try {
   await reorderCanonicalContent({
    entityType: "book",
    entityId: book.id,
    expectedUpdatedAt: book.updatedAt,
    orderField: "book_order",
    order: book.order + direction,
    reason: `Sắp xếp quyển ${book.title}`,
   });
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
   toast.success("Đã cập nhật thứ tự quyển.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp quyển.");
  }
 }

 return (
  <div className="flex shrink-0 items-center gap-1">
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
     <Button type="button" size="sm" variant="outline" aria-label={`Sửa ${book.title}`}>
      <Pencil />
      <span className="hidden sm:inline">Sửa</span>
     </Button>
    </DialogTrigger>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>Sửa quyển</DialogTitle>
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
        {(field) => <field.TextField label="Tên quyển" required />}
       </form.AppField>
       <form.AppField name="shortTitle">
        {(field) => <field.TextField label="Tên ngắn" />}
       </form.AppField>
      </DialogBody>
      <DialogFooter>
       <Button type="button" variant="outline" onClick={() => form.reset()}>
        Reset
       </Button>
       <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        Hủy
       </Button>
       <Button type="submit" disabled={!book.updatedAt}>
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
    aria-label={`Đưa ${book.title} lên`}
    disabled={!book.updatedAt || !canMoveUp}
    onClick={() => void reorderBook(-1)}
   >
    <ArrowUp />
   </Button>
   <Button
    type="button"
    size="icon"
    variant="ghost"
    aria-label={`Đưa ${book.title} xuống`}
    disabled={!book.updatedAt || !canMoveDown}
    onClick={() => void reorderBook(1)}
   >
    <ArrowDown />
   </Button>
   <SoftDeleteConfirmDialog
    itemType="quyển"
    itemLabel={book.title}
    onConfirm={deleteBook}
    trigger={
     <Button
      type="button"
      size="icon"
      variant="destructive"
      aria-label={`Xóa ${book.title}`}
      disabled={!book.updatedAt}
     >
      <Trash2 />
     </Button>
    }
   />
  </div>
 );
}
