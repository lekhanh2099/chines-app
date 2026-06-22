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
import type { HanziHomeCourseBook } from "@/features/hanzihome/types";

const formSchema = z.object({
 title: z.string().trim().min(1),
 shortTitle: z.string().trim(),
});

export function BookCrudActions({ book }: { book: HanziHomeCourseBook }) {
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
    await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
    toast.success("Đã cập nhật quyển.");
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể cập nhật quyển.");
   }
  },
 });

 async function deleteBook() {
  if (!book.updatedAt || !window.confirm(`Xóa mềm quyển "${book.title}"?`)) return;
  try {
   await deleteCanonicalContent({
    entityType: "book",
    entityId: book.id,
    expectedUpdatedAt: book.updatedAt,
    reason: `Xóa quyển ${book.title}`,
   });
   await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
   toast.success("Đã xóa quyển. Có thể khôi phục trong Edit Mode.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa quyển.");
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
   await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
   toast.success("Đã cập nhật thứ tự quyển.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp quyển.");
  }
 }

 return (
  <div className="flex items-center gap-0.5">
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
     <Button type="button" size="icon" variant="ghost" aria-label={`Sửa ${book.title}`}>
      <Pencil className="h-3.5 w-3.5" />
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
    disabled={!book.updatedAt || book.order === 1}
    onClick={() => void reorderBook(-1)}
   >
    <ArrowUp className="h-3.5 w-3.5" />
   </Button>
   <Button
    type="button"
    size="icon"
    variant="ghost"
    aria-label={`Đưa ${book.title} xuống`}
    disabled={!book.updatedAt}
    onClick={() => void reorderBook(1)}
   >
    <ArrowDown className="h-3.5 w-3.5" />
   </Button>
   <Button
    type="button"
    size="icon"
    variant="ghost"
    aria-label={`Xóa ${book.title}`}
    disabled={!book.updatedAt}
    onClick={() => void deleteBook()}
   >
    <Trash2 className="h-3.5 w-3.5 text-danger-text" />
   </Button>
  </div>
 );
}
