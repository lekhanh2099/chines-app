"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 restoreCanonicalContent,
 restoreNestedSectionNode,
} from "@/features/hanzihome/editing/direct-save";
import { editableEntityTypes } from "@/features/hanzihome/editing/store/types";

const deletedContentResponseSchema = z.object({
 items: z.array(
  z.discriminatedUnion("kind", [
   z.object({
    kind: z.literal("canonical"),
    entityType: z.enum([
     "course",
     "book",
     "lesson",
     "section",
     "lesson_text",
     "vocab_item",
     "vocab_example",
     "vocab_detail_section",
     "grammar_point",
     "grammar_example",
     "grammar_detail_section",
    ]),
    entityId: z.string(),
    label: z.string(),
    parentEntityId: z.string().optional(),
    deletedAt: z.string(),
    updatedAt: z.string(),
   }),
   z.object({
    kind: z.literal("nested"),
    entityType: z.enum(editableEntityTypes),
    entityId: z.string(),
    label: z.string(),
    parentEntityId: z.string().optional(),
    sectionId: z.string(),
    deletedAt: z.string(),
    updatedAt: z.string(),
   }),
  ]),
 ),
});

const entityLabels: Partial<Record<string, string>> = {
 course: "Khóa học",
 book: "Quyển",
 lesson: "Bài học",
 section: "Đề mục",
 lesson_text: "Bài khóa",
 vocab_item: "Từ vựng",
 vocab_example: "Ví dụ từ vựng",
 vocab_detail_section: "Chi tiết từ vựng",
 grammar_point: "Điểm ngữ pháp",
 grammar_example: "Ví dụ ngữ pháp",
 grammar_detail_section: "Chi tiết ngữ pháp",
 proper_noun: "Tên riêng",
 character_writing_item: "Chữ luyện viết",
 grammar_block: "Khối ngữ pháp",
 grammar_formula: "Công thức ngữ pháp",
 grammar_block_item: "Mục ngữ pháp",
 exercise: "Bài tập",
 exercise_question: "Câu hỏi",
 exercise_matching_item: "Mục nối cặp",
 exercise_answer_key: "Đáp án",
 exercise_word_bank: "Từ cho sẵn",
 exercise_dialogue_line: "Dòng hội thoại",
 exercise_cloze_segment: "Đoạn điền khuyết",
 exercise_cloze_answer: "Đáp án điền khuyết",
 reading_item: "Bài đọc",
 reading_question: "Câu hỏi đọc hiểu",
 text_block: "Khối bài khóa",
 text_line: "Dòng bài khóa",
 text_paragraph: "Đoạn bài khóa",
};

function entityLabel(entityType: string) {
 return entityLabels[entityType] ?? "Nội dung";
}

async function getDeletedContent() {
 const response = await fetch("/api/hanzihome/content/deleted", {
  headers: { Accept: "application/json" },
 });
 const payload: unknown = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không thể tải nội dung đã xóa");
 return deletedContentResponseSchema.parse(payload).items;
}

export function DeletedContentDialog() {
 const [open, setOpen] = useState(false);
 const [restoringId, setRestoringId] = useState<string | null>(null);
 const queryClient = useQueryClient();
 const deletedQuery = useQuery({
  queryKey: ["hanzihome", "deleted-content"],
  queryFn: getDeletedContent,
  enabled: open,
 });

 async function restoreItem(item: NonNullable<typeof deletedQuery.data>[number]) {
  setRestoringId(item.entityId);
  try {
   if (item.kind === "nested") {
    await restoreNestedSectionNode({
     sectionId: item.sectionId,
     entityType: item.entityType,
     entityId: item.entityId,
     expectedUpdatedAt: item.updatedAt,
     reason: `Khôi phục ${entityLabel(item.entityType)}: ${item.label}`,
    });
   } else {
    await restoreCanonicalContent({
     entityType: item.entityType,
     entityId: item.entityId,
     expectedUpdatedAt: item.updatedAt,
     reason: `Khôi phục ${entityLabel(item.entityType)}: ${item.label}`,
    });
   }
   await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["hanzihome", "deleted-content"] }),
    queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] }),
    queryClient.invalidateQueries({ queryKey: ["hanzihome", "course-lessons"] }),
    queryClient.invalidateQueries({ queryKey: ["hanzihome", "lesson-detail"] }),
    queryClient.invalidateQueries({ queryKey: ["hanzihome", "aggregate-vocab"] }),
    queryClient.invalidateQueries({ queryKey: ["hanzihome", "aggregate-grammar"] }),
    queryClient.invalidateQueries({ queryKey: ["hanzihome", "search-index"] }),
   ]);
   toast.success("Đã khôi phục nội dung.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể khôi phục nội dung.");
  } finally {
   setRestoringId(null);
  }
 }

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button type="button" variant="outline" size="sm" className="h-8">
     <Trash2 className="h-4 w-4" />
     Đã xóa
    </Button>
   </DialogTrigger>
   <DialogContent className="max-w-3xl">
    <DialogHeader>
     <DialogTitle>Nội dung đã xóa</DialogTitle>
     <DialogDescription>Khôi phục các node đã xóa mềm trong thư viện dùng chung.</DialogDescription>
    </DialogHeader>
    <DialogBody className="max-h-[65vh] overflow-y-auto">
     {deletedQuery.isPending ? (
      <p className="text-sm text-text-muted">Đang tải...</p>
     ) : deletedQuery.isError ? (
      <p className="text-sm text-danger-text">{deletedQuery.error.message}</p>
     ) : deletedQuery.data?.length ? (
      <div className="grid gap-2">
       {deletedQuery.data.map((item) => (
        <div
         key={`${item.entityType}:${item.entityId}`}
         className="flex items-center justify-between gap-3 rounded-lg border border-border-default p-3"
        >
         <div className="min-w-0">
          <p className="truncate font-bold text-text-primary">{item.label}</p>
          <p className="text-xs text-text-muted">
           {entityLabel(item.entityType)} · {new Date(item.deletedAt).toLocaleString("vi-VN")}
          </p>
         </div>
         <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={restoringId === item.entityId}
          onClick={() => void restoreItem(item)}
         >
          <RotateCcw className="h-4 w-4" />
          Khôi phục
         </Button>
        </div>
       ))}
      </div>
     ) : (
      <p className="text-sm text-text-muted">Không có nội dung đã xóa.</p>
     )}
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
