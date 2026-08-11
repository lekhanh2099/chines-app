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
    queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.courseLessons(book.courseId) }),
   ]);
   toast.success("Đã xóa quyển. Có thể khôi phục trong Edit Mode.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa quyển.");
   throw error;
  }
 }

 async function reorderBook(direction: ReorderDirection) {
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
  <>
   <LibraryCrudActionsMenu
    ariaLabel={`Tác vụ cho ${book.title}`}
    itemType="quyển"
    itemLabel={book.title}
    disabled={!book.updatedAt}
    canMoveUp={canMoveUp}
    canMoveDown={canMoveDown}
    onEdit={() => setOpen(true)}
    onMoveUp={() => void reorderBook(-1)}
    onMoveDown={() => void reorderBook(1)}
    onDelete={deleteBook}
   />

   <Dialog open={open} onOpenChange={setOpen}>
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
  </>
 );
}
