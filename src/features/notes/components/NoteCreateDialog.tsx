"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import type { NoteCategory } from "@/types/database";

const noteCategoryOptions: Array<{ value: NoteCategory; label: string; helper: string }> = [
 { value: "general", label: "Chung", helper: "Ghi chú tự do, không gắn loại học cụ thể." },
 { value: "grammar", label: "Ngữ pháp", helper: "Công thức, ví dụ, lỗi sai hoặc cách dùng." },
 { value: "vocabulary", label: "Từ vựng", helper: "Từ mới, collocation, cách nhớ hoặc ví dụ." },
 { value: "culture", label: "Văn hóa", helper: "Văn cảnh dùng từ, mẹo học, ghi chú văn hóa." },
];

function parseTags(value: string): string[] {
 return value
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);
}

export function NoteCreateDialog() {
 const [isOpen, setIsOpen] = useState(false);
 const router = useRouter();
 const createNoteMutation = useCreateNote();

 const form = useForm({
  defaultValues: {
   title: "",
   tags: "",
   category: "general" as NoteCategory,
  },
  onSubmit: async ({ value }) => {
   createNoteMutation.mutate(
    {
     title: value.title.trim(),
     tags: parseTags(value.tags),
     category: value.category,
     content: {
      type: "doc",
      content: [{ type: "paragraph" }],
     },
    },
    {
     onSuccess: (note) => {
      setIsOpen(false);
      router.push(`/notes/${note.id}`);
     },
     onError: () => {
      toast.error("Không thể tạo ghi chú.");
     },
    },
   );
  },
 });

 return (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
   <DialogTrigger asChild>
    <Button size="lg" className="gap-2">
     <FilePlus2 className="h-4 w-4" />
     Tạo ghi chú
    </Button>
   </DialogTrigger>

   <DialogContent className="max-w-lg">
    <DialogHeader>
     <DialogTitle>Tạo ghi chú mới</DialogTitle>
     <DialogDescription>
      Chọn danh mục ngay từ đầu để sau này lọc và liên kết với bài học rõ hơn.
     </DialogDescription>
    </DialogHeader>

    <form
     onSubmit={(event) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
     }}
    >
     <DialogBody className="space-y-4">
      <form.Field
       name="title"
       validators={{
        onChange: ({ value }) => (!value.trim() ? "Nhập tiêu đề ghi chú." : undefined),
       }}
      >
       {(field) => (
        <div className="space-y-2">
         <label htmlFor={field.name} className="text-sm font-semibold text-text-primary">
          Tiêu đề
         </label>
         <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          placeholder="VD: Bài 6 - Chọn lọc ngữ pháp"
         />
         {field.state.meta.errors.length > 0 ? (
          <p className="text-xs font-medium text-danger">{field.state.meta.errors.join(", ")}</p>
         ) : null}
        </div>
       )}
      </form.Field>

      <form.Field name="category">
       {(field) => {
        const selectedOption = noteCategoryOptions.find(
         (option) => option.value === field.state.value,
        );

        return (
         <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary">Danh mục</label>
          <Select
           value={field.state.value}
           onValueChange={(value) => field.handleChange(value as NoteCategory)}
          >
           <SelectTrigger className="h-10 w-full bg-bg-primary">
            <SelectValue />
           </SelectTrigger>
           <SelectContent>
            {noteCategoryOptions.map((option) => (
             <SelectItem key={option.value} value={option.value}>
              {option.label}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
          {selectedOption ? (
           <p className="text-xs font-medium text-text-muted">{selectedOption.helper}</p>
          ) : null}
         </div>
        );
       }}
      </form.Field>

      <form.Field name="tags">
       {(field) => (
        <div className="space-y-2">
         <label htmlFor={field.name} className="text-sm font-semibold text-text-primary">
          Tag
         </label>
         <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          placeholder="VD: HSK3, lỗi sai, ôn thi"
         />
         <p className="text-xs font-medium text-text-muted">Dùng dấu phẩy nếu có nhiều tag.</p>
        </div>
       )}
      </form.Field>
     </DialogBody>

     <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
       Hủy
      </Button>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
       {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit || createNoteMutation.isPending}>
         {isSubmitting || createNoteMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
         ) : null}
         Tạo
        </Button>
       )}
      </form.Subscribe>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
