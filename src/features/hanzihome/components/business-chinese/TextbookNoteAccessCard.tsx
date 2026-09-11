"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkedContentSkeleton } from "@/features/hanzihome/components/LinkedContentSkeleton";
import { LessonSplitNoteEditor } from "@/features/hanzihome/components/notes/LessonSplitNoteEditor";
import {
 createTextbookPersonalNoteContent,
 createTextbookReadingContent,
} from "@/features/hanzihome/components/notes/lessonNoteContent";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";

export function TextbookNoteAccessCard({
 lesson,
 compact = false,
}: {
 lesson: TextbookLesson;
 compact?: boolean;
}) {
 const linkedNoteQuery = useLessonLinkedNote(lesson.id, "main");
 const createNoteMutation = useCreateLessonLinkedNote();
 const note = linkedNoteQuery.data;
 const isCreating = createNoteMutation.isPending;

 const defaultReadingContent = useMemo(() => createTextbookReadingContent(lesson), [lesson]);

 const handleCreate = () => {
  createNoteMutation.mutate(
   {
    lessonId: lesson.id,
    relationType: "main",
    title: `${lesson.bookLabel} · Bài ${lesson.number} · ${lesson.title}`,
    category: "general",
    tags: ["textbook", lesson.bookKey, lesson.id, "lesson-note"],
    content: createTextbookPersonalNoteContent(lesson),
   },
   {
    onSuccess: () => toast.success("Đã tạo ghi chú cho bài học"),
    onError: () => toast.error("Không tạo được ghi chú cho bài học"),
   },
  );
 };

 return (
  <Card padding="lg" className={compact ? "h-full min-h-0" : undefined}>
   <div className={compact ? "grid h-full min-h-0 gap-4" : "grid gap-4"}>
    {linkedNoteQuery.isLoading ? (
     <LinkedContentSkeleton label="Đang kiểm tra ghi chú của bài" />
    ) : note ? (
     <LessonSplitNoteEditor
      noteId={note.id}
      fillHeight={compact}
      defaultReadingContent={defaultReadingContent}
     />
    ) : (
     <Button
      type="button"
      onClick={handleCreate}
      disabled={isCreating}
      variant="outline"
      align="start"
      wrap="normal"
     >
      {isCreating ? (
       <span className="inline-flex items-center gap-2">
        <Loader2 className="animate-spin" />
        Đang tạo ghi chú cho bài...
       </span>
      ) : (
       "Chưa có ghi chú riêng cho bài này. Bấm để tạo ghi chú liên kết với bài học."
      )}
     </Button>
    )}
   </div>
  </Card>
 );
}
