"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

const formSchema = z.object({
 slug: z.string().trim().min(2),
 title: z.string().trim().min(1),
 subtitle: z.string().trim(),
 type: z.string().trim().min(1),
});

export function CreateCourseDialog() {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const form = useAppForm({
  defaultValues: { slug: "", title: "", subtitle: "", type: "custom" },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   try {
    await createCanonicalContent({
     entityType: "course",
     reason: `Tạo khóa học ${value.title}`,
     changes: {
      slug: value.slug,
      title: value.title,
      subtitle: value.subtitle || null,
      type: value.type,
     },
    });
    await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
    toast.success("Đã tạo khóa học.");
    form.reset();
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể tạo khóa học.");
   }
  },
 });

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button type="button" size="sm">
     <Plus className="h-4 w-4" />
     Khóa học
    </Button>
   </DialogTrigger>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Tạo khóa học</DialogTitle>
     <DialogDescription>Tạo trực tiếp trong thư viện Supabase dùng chung.</DialogDescription>
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
       {(field) => <field.TextField label="Slug" required placeholder="hanyu-custom" />}
      </form.AppField>
      <form.AppField name="subtitle">
       {(field) => <field.TextField label="Mô tả ngắn" />}
      </form.AppField>
      <form.AppField name="type">
       {(field) => (
        <field.Select
         label="Loại"
         options={[
          { value: "custom", label: "Tự tạo" },
          { value: "hanyu", label: "Hán ngữ" },
          { value: "hsk", label: "HSK" },
          { value: "listening", label: "Nghe" },
         ]}
        />
       )}
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
