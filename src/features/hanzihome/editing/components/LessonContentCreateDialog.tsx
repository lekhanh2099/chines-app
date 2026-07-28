"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { JsonObjectSchema } from "@/types/json";
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
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import type { EditingToolsPresentation } from "@/features/hanzihome/context/types";
import { createCanonicalContent } from "@/features/hanzihome/editing/direct-save";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

const formSchema = z.object({
 kind: z.enum(["section", "vocab_item", "grammar_point"]),
 title: z.string().trim().min(1),
 secondary: z.string().trim(),
 detail: z.string().trim(),
 sectionType: z.enum([
  "text",
  "notes",
  "exercises",
  "reading",
  "character_writing",
  "proper_nouns",
  "communication",
  "summary",
 ]),
});

type LessonContentFormValues = z.input<typeof formSchema>;

export function LessonContentCreateDialog({
 presentation = "toolbar",
}: {
 presentation?: EditingToolsPresentation;
}) {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const { lesson } = useHanziHomeRuntime();
 const defaultValues: LessonContentFormValues = {
  kind: "vocab_item",
  title: "",
  secondary: "",
  detail: "",
  sectionType: "text",
 };
 const form = useAppForm({
  defaultValues,
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   if (!lesson.courseId || !lesson.bookId) {
    toast.error("Bài học chưa có course/book canonical.");
    return;
   }
   try {
    const changes =
     value.kind === "section"
      ? {
         lesson_id: lesson.id,
         section_type: value.sectionType,
         title: value.title,
         title_vi: value.secondary,
        }
      : value.kind === "vocab_item"
        ? {
           lesson_id: lesson.id,
           course_id: lesson.courseId,
           book_id: lesson.bookId,
           word: value.title,
           pinyin: value.secondary,
           han_viet: "",
           meaning: value.detail,
           category: "Từ vựng",
          }
        : {
           lesson_id: lesson.id,
           course_id: lesson.courseId,
           book_id: lesson.bookId,
           title: value.title,
           clean_title: value.title,
           core: value.detail,
           content_md: "",
           structures_view: value.secondary ? [value.secondary] : [],
           notes: [],
          };

    await createCanonicalContent({
     entityType: value.kind,
     changes: JsonObjectSchema.parse(changes),
     reason: `Tạo ${value.kind} trong bài ${lesson.lessonNumber}`,
    });
    await queryClient.invalidateQueries({
     queryKey: hanzihomeQueryKeys.lessonDetail(lesson.id),
    });
    toast.success("Đã tạo nội dung.");
    form.reset();
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể tạo nội dung.");
   }
  },
 });
 const kind = useSelector(form.store, (state) => state.values.kind);

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button
     type="button"
     variant={presentation === "menu" ? "menu" : "outline"}
     size="sm"
     role={presentation === "menu" ? "menuitem" : undefined}
    >
     <Plus className="h-4 w-4" />
     Thêm nội dung
    </Button>
   </DialogTrigger>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Thêm nội dung bài học</DialogTitle>
     <DialogDescription>Dữ liệu được lưu trực tiếp vào Supabase.</DialogDescription>
    </DialogHeader>
    <form
     onSubmit={(event) => {
      event.preventDefault();
      void form.handleSubmit();
     }}
    >
     <DialogBody className="grid gap-4">
      <form.AppField name="kind">
       {(field) => (
        <field.Select
         label="Loại nội dung"
         options={[
          { value: "vocab_item", label: "Từ vựng" },
          { value: "grammar_point", label: "Ngữ pháp" },
          { value: "section", label: "Đề mục bài học" },
         ]}
        />
       )}
      </form.AppField>
      {kind === "section" ? (
       <form.AppField name="sectionType">
        {(field) => (
         <field.Select
          label="Dạng đề mục"
          options={[
           { value: "text", label: "Bài khóa" },
           { value: "notes", label: "Chú thích" },
           { value: "exercises", label: "Bài tập" },
           { value: "reading", label: "Đọc hiểu" },
           { value: "character_writing", label: "Viết chữ Hán" },
           { value: "proper_nouns", label: "Tên riêng" },
           { value: "communication", label: "Giao tiếp" },
           { value: "summary", label: "Tổng kết" },
          ]}
         />
        )}
       </form.AppField>
      ) : null}
      <form.AppField name="title">
       {(field) => (
        <field.TextField label={kind === "vocab_item" ? "Chữ Hán" : "Tiêu đề"} required />
       )}
      </form.AppField>
      <form.AppField name="secondary">
       {(field) => (
        <field.TextField
         label={
          kind === "vocab_item"
           ? "Pinyin"
           : kind === "grammar_point"
             ? "Công thức chính"
             : "Tiêu đề tiếng Việt"
         }
         required={kind === "vocab_item"}
        />
       )}
      </form.AppField>
      {kind !== "section" ? (
       <form.AppField name="detail">
        {(field) => (
         <field.Textarea
          label={kind === "vocab_item" ? "Nghĩa tiếng Việt" : "Ý nghĩa chính"}
          required
         />
        )}
       </form.AppField>
      ) : null}
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
