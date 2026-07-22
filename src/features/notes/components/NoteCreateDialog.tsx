"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { BookOpenText, ChevronDown, FilePlus2, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { cn } from "@/lib/utils";
import type { NoteFolder } from "@/services/notes.service";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import type { NoteCategory, ReadingStatus } from "@/types/database";

type CreateMode = "note" | "reading";

const noteCategoryOptions: Array<{ value: NoteCategory; label: string }> = [
 { value: "general", label: "Chung" },
 { value: "grammar", label: "Ngữ pháp" },
 { value: "vocabulary", label: "Từ vựng" },
 { value: "culture", label: "Văn hóa" },
];

function parseTags(value: string): string[] {
 return value
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);
}

export function NoteCreateDialog({
 folders = [],
 triggerClassName,
 compactOnTablet = false,
}: {
 folders?: NoteFolder[];
 triggerClassName?: string;
 compactOnTablet?: boolean;
}) {
 const [mode, setMode] = useState<CreateMode | null>(null);
 const router = useRouter();
 const createNoteMutation = useCreateNote();
 const focusModeEnabled = useFocusModeStore((state) => state.enabled);

 const form = useForm({
  defaultValues: {
   title: "",
   tags: "",
   category: "general" as NoteCategory,
   folderId: "unfiled",
   readingStatus: "reading" as ReadingStatus,
  },
  onSubmit: async ({ value }) => {
   if (!mode) return;
   if (focusModeEnabled) {
    toast.warning("Focus mode đang bật. Không thể tạo ghi chú mới.");
    return;
   }

   try {
    const emptyDocument = { type: "doc", content: [{ type: "paragraph" }] };
    const note = await createNoteMutation.mutateAsync({
     title: value.title.trim(),
     tags: parseTags(value.tags),
     category: value.category,
     content: emptyDocument,
     readingContent: mode === "reading" ? emptyDocument : undefined,
     splitViewEnabled: mode === "reading",
     folderId: value.folderId === "unfiled" ? null : value.folderId,
     readingStatus: mode === "reading" ? value.readingStatus : null,
     source: null,
    });

    setMode(null);
    form.reset();
    router.push(`/notes/${note.id}`);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể tạo ghi chú.");
   }
  },
 });

 const openMode = (nextMode: CreateMode) => {
  if (focusModeEnabled) return;
  form.reset();
  setMode(nextMode);
 };

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      size={compactOnTablet ? "responsive-action" : "lg"}
      disabled={focusModeEnabled}
      aria-label="Tạo ghi chú hoặc bài đọc"
      title="Tạo"
      className={triggerClassName}
     >
      <FilePlus2 data-icon="inline-start" />
      <span className={cn(compactOnTablet && "hidden 2xl:inline")}>Tạo</span>
      <ChevronDown data-icon="inline-end" className={cn(compactOnTablet && "hidden 2xl:block")} />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     <DropdownMenuItem onSelect={() => openMode("note")}>
      <NotebookPen />
      <span>
       <strong className="block">Ghi chú thường</strong>
       <span className="text-xs font-medium text-text-muted">Ý tưởng và ghi chú tự do.</span>
      </span>
     </DropdownMenuItem>
     <DropdownMenuItem onSelect={() => openMode("reading")}>
      <BookOpenText />
      <span>
       <strong className="block">Bài đọc</strong>
       <span className="text-xs font-medium text-text-muted">
        Tạo ghi chú đọc và thêm nội dung sau.
       </span>
      </span>
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>

   <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
    <DialogContent size="md">
     <DialogHeader>
      <DialogTitle icon={mode === "reading" ? <BookOpenText /> : <NotebookPen />}>
       {mode === "reading" ? "Tạo bài đọc" : "Tạo ghi chú"}
      </DialogTitle>
      <DialogDescription>
       {mode === "reading"
        ? "Tạo một bài đọc rỗng rồi thêm nội dung trong Split View."
        : "Tạo một ghi chú tự do trong thư viện."}
      </DialogDescription>
     </DialogHeader>

     <form
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
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
          onChange: ({ value }) => (!value.trim() ? "Nhập tiêu đề." : undefined),
         }}
        >
         {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
           <FieldLabel htmlFor={field.name}>Tiêu đề</FieldLabel>
           <Input
            id={field.name}
            required
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder={mode === "reading" ? "Tiêu đề bài đọc" : "Tiêu đề ghi chú"}
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

        <div className="grid gap-4 sm:grid-cols-2">
         <form.Field name="folderId">
          {(field) => (
           <Field>
            <FieldLabel>Folder</FieldLabel>
            <Select value={field.state.value} onValueChange={field.handleChange}>
             <SelectTrigger width="full">
              <SelectValue />
             </SelectTrigger>
             <SelectContent>
              <SelectGroup>
               <SelectItem value="unfiled">Chưa phân loại</SelectItem>
               {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                 {folder.parentId ? `↳ ${folder.name}` : folder.name}
                </SelectItem>
               ))}
              </SelectGroup>
             </SelectContent>
            </Select>
           </Field>
          )}
         </form.Field>

         {mode === "reading" ? (
          <form.Field name="readingStatus">
           {(field) => (
            <Field>
             <FieldLabel>Trạng thái</FieldLabel>
             <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as ReadingStatus)}
             >
              <SelectTrigger width="full">
               <SelectValue />
              </SelectTrigger>
              <SelectContent>
               <SelectItem value="inbox">Đọc sau</SelectItem>
               <SelectItem value="reading">Đang đọc</SelectItem>
               <SelectItem value="completed">Đã đọc</SelectItem>
              </SelectContent>
             </Select>
            </Field>
           )}
          </form.Field>
         ) : (
          <form.Field name="category">
           {(field) => (
            <Field>
             <FieldLabel>Danh mục</FieldLabel>
             <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as NoteCategory)}
             >
              <SelectTrigger width="full">
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
            </Field>
           )}
          </form.Field>
         )}
        </div>

        {mode !== "reading" ? (
         <form.Field name="tags">
          {(field) => (
           <Field>
            <FieldLabel htmlFor={field.name}>Tag</FieldLabel>
            <Input
             id={field.name}
             value={field.state.value}
             onChange={(event) => field.handleChange(event.target.value)}
             placeholder="HSK3, ôn thi"
            />
           </Field>
          )}
         </form.Field>
        ) : null}
       </FieldGroup>
      </DialogBody>

      <DialogFooter>
       <Button type="button" variant="outline" onClick={() => setMode(null)}>
        Hủy
       </Button>
       <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
         <Button type="submit" disabled={!canSubmit || createNoteMutation.isPending}>
          {isSubmitting || createNoteMutation.isPending ? (
           <Spinner data-icon="inline-start" />
          ) : null}
          {mode === "reading" ? "Tạo và mở" : "Tạo"}
         </Button>
        )}
       </form.Subscribe>
      </DialogFooter>
     </form>
    </DialogContent>
   </Dialog>
  </>
 );
}
