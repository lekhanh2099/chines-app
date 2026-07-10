"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { FilePlus2 } from "lucide-react";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import { cn } from "@/lib/utils";
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

export function NoteCreateDialog({
 triggerClassName,
 compactOnTablet = false,
}: {
 triggerClassName?: string;
 compactOnTablet?: boolean;
}) {
 const [isOpen, setIsOpen] = useState(false);
 const router = useRouter();
 const createNoteMutation = useCreateNote();
 const focusModeEnabled = useFocusModeStore((s) => s.enabled);

 const form = useForm({
  defaultValues: {
   title: "",
   tags: "",
   category: "general" as NoteCategory,
  },
  onSubmit: async ({ value }) => {
   if (focusModeEnabled) {
    toast.warning("Focus mode đang bật. Không thể tạo ghi chú mới.");
    return;
   }

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
    <Button
     size={compactOnTablet ? "icon-lg" : "lg"}
     disabled={focusModeEnabled}
     aria-label="Tạo ghi chú"
     title="Tạo ghi chú"
     className={cn(compactOnTablet && "2xl:w-auto 2xl:px-3", triggerClassName)}
    >
     <FilePlus2 className="h-4 w-4" />
     <span className={cn(compactOnTablet && "hidden 2xl:inline")}>Tạo ghi chú</span>
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
     <DialogBody>
      <FieldGroup>
       <form.Field
        name="title"
        validators={{
         onChange: ({ value }) => (!value.trim() ? "Nhập tiêu đề ghi chú." : undefined),
        }}
       >
        {(field) => (
         <Field data-invalid={field.state.meta.errors.length > 0}>
          <FieldLabel htmlFor={field.name}>Tiêu đề</FieldLabel>
          <Input
           id={field.name}
           name={field.name}
           value={field.state.value}
           onBlur={field.handleBlur}
           onChange={(event) => field.handleChange(event.target.value)}
           placeholder="VD: Bài 6 - Chọn lọc ngữ pháp"
           aria-invalid={field.state.meta.errors.length > 0}
          />
          {field.state.meta.errors.length > 0 ? (
           <FieldDescription className="text-danger">
            {field.state.meta.errors.join(", ")}
           </FieldDescription>
          ) : null}
         </Field>
        )}
       </form.Field>

       <form.Field name="category">
        {(field) => {
         const selectedOption = noteCategoryOptions.find(
          (option) => option.value === field.state.value,
         );

         return (
          <Field>
           <FieldLabel>Danh mục</FieldLabel>
           <Select
            value={field.state.value}
            onValueChange={(value) => field.handleChange(value as NoteCategory)}
           >
            <SelectTrigger className="h-10 w-full bg-bg-primary">
             <SelectValue />
            </SelectTrigger>
            <SelectContent>
             <SelectGroup>
              {noteCategoryOptions.map((option) => (
               <SelectItem key={option.value} value={option.value}>
                {option.label}
               </SelectItem>
              ))}
             </SelectGroup>
            </SelectContent>
           </Select>
           {selectedOption ? <FieldDescription>{selectedOption.helper}</FieldDescription> : null}
          </Field>
         );
        }}
       </form.Field>

       <form.Field name="tags">
        {(field) => (
         <Field>
          <FieldLabel htmlFor={field.name}>Tag</FieldLabel>
          <Input
           id={field.name}
           name={field.name}
           value={field.state.value}
           onBlur={field.handleBlur}
           onChange={(event) => field.handleChange(event.target.value)}
           placeholder="VD: HSK3, lỗi sai, ôn thi"
          />
          <FieldDescription>Dùng dấu phẩy nếu có nhiều tag.</FieldDescription>
         </Field>
        )}
       </form.Field>
      </FieldGroup>
     </DialogBody>

     <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
       Hủy
      </Button>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
       {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit || createNoteMutation.isPending}>
         {isSubmitting || createNoteMutation.isPending ? (
          <Spinner data-icon="inline-start" />
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
