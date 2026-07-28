"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
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
import type { HanziHomeEditableRecordMeta } from "@/features/hanzihome/types";

const formSchema = z
 .object({
  kind: z.enum(["example", "detail"]),
  zh: z.string().trim(),
  pinyin: z.string().trim(),
  vi: z.string().trim(),
  note: z.string().trim(),
  sectionKey: z.string().trim(),
  title: z.string().trim(),
  lines: z.string(),
 })
 .superRefine((value, context) => {
  if (value.kind === "example" && !value.zh) {
   context.addIssue({ code: "custom", path: ["zh"], message: "Câu tiếng Trung là bắt buộc" });
  }
  if (value.kind === "detail" && !value.title) {
   context.addIssue({ code: "custom", path: ["title"], message: "Tiêu đề là bắt buộc" });
  }
 });
const NormalizedChildFamilySchema = z.enum(["vocab", "grammar"]);

type NormalizedChildFormValues = z.input<typeof formSchema>;

export function CreateNormalizedChildDialog({
 family,
 lessonId,
 parent,
}: {
 family: z.infer<typeof NormalizedChildFamilySchema>;
 lessonId: string;
 parent: HanziHomeEditableRecordMeta;
}) {
 const [open, setOpen] = useState(false);
 const queryClient = useQueryClient();
 const defaultValues: NormalizedChildFormValues = {
  kind: "example",
  zh: "",
  pinyin: "",
  vi: "",
  note: "",
  sectionKey: family === "vocab" ? "notes" : "usage",
  title: "",
  lines: "",
 };
 const form = useAppForm({
  defaultValues,
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   const isExample = value.kind === "example";
   const isVocab = family === "vocab";
   try {
    await createCanonicalContent({
     entityType: isVocab
      ? isExample
        ? "vocab_example"
        : "vocab_detail_section"
      : isExample
        ? "grammar_example"
        : "grammar_detail_section",
     reason: `Thêm ${isExample ? "ví dụ" : "chi tiết"} ${isVocab ? "từ vựng" : "ngữ pháp"} ${parent.dbId}`,
     changes: {
      ...(isVocab ? { vocab_item_id: parent.dbId } : { grammar_point_id: parent.dbId }),
      lesson_id: lessonId,
      ...(isExample
       ? {
          zh: value.zh,
          pinyin: value.pinyin || null,
          vi: value.vi || null,
          note: value.note || null,
         }
       : {
          section_key: value.sectionKey,
          title: value.title,
          lines: value.lines
           .split("\n")
           .map((line) => line.trim())
           .filter(Boolean),
         }),
     },
    });
    await queryClient.invalidateQueries({
     queryKey: hanzihomeQueryKeys.lessonResource(lessonId, isVocab ? "vocabulary" : "grammar"),
    });
    toast.success("Đã thêm nội dung.");
    form.reset();
    setOpen(false);
   } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể thêm nội dung.");
   }
  },
 });
 const kind = useSelector(form.store, (state) => state.values.kind);

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button type="button" variant="outline" size="sm">
     <Plus className="h-4 w-4" />
     Thêm nội dung
    </Button>
   </DialogTrigger>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Thêm nội dung {family === "vocab" ? "từ vựng" : "ngữ pháp"}</DialogTitle>
     <DialogDescription>Lưu trực tiếp node con vào Supabase.</DialogDescription>
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
         label="Loại"
         options={[
          { value: "example", label: "Ví dụ" },
          { value: "detail", label: "Chi tiết" },
         ]}
        />
       )}
      </form.AppField>
      {kind === "example" ? (
       <>
        <form.AppField name="zh">
         {(field) => <field.Textarea label="Tiếng Trung" required />}
        </form.AppField>
        <form.AppField name="pinyin">{(field) => <field.TextField label="Pinyin" />}</form.AppField>
        <form.AppField name="vi">{(field) => <field.Textarea label="Tiếng Việt" />}</form.AppField>
        <form.AppField name="note">{(field) => <field.Textarea label="Ghi chú" />}</form.AppField>
       </>
      ) : (
       <>
        <form.AppField name="sectionKey">
         {(field) => (
          <field.Select
           label="Loại section"
           options={
            family === "vocab"
             ? [
                { value: "meaning", label: "Nghĩa" },
                { value: "word_formation", label: "Logic / cấu tạo" },
                { value: "comparison", label: "So sánh" },
                { value: "collocations", label: "Kết hợp thường gặp" },
                { value: "culture", label: "Văn hóa và ngữ cảnh" },
                { value: "warnings", label: "Lưu ý lỗi sai" },
                { value: "notes", label: "Ghi chú" },
                { value: "custom", label: "Khác" },
               ]
             : [
                { value: "usage", label: "Cách dùng" },
                { value: "examples", label: "Ví dụ" },
                { value: "notes", label: "Ghi chú" },
               ]
           }
          />
         )}
        </form.AppField>
        <form.AppField name="title">
         {(field) => <field.TextField label="Tiêu đề" required />}
        </form.AppField>
        <form.AppField name="lines">
         {(field) => <field.Textarea label="Nội dung, mỗi dòng một mục" />}
        </form.AppField>
       </>
      )}
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
