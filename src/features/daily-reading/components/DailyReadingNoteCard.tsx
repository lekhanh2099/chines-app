"use client";

import { useMemo } from "react";
import { BookOpen, FileEdit, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { LinkedContentSkeleton } from "@/features/hanzihome/components/LinkedContentSkeleton";
import { LessonSplitNoteEditor } from "@/features/hanzihome/components/notes/LessonSplitNoteEditor";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";
import type { JsonObject } from "@/types/json";

function textNode(text: string, format = 0) {
 return {
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
 };
}

function paragraph(text: string) {
 return {
  children: [textNode(text)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
  textFormat: 0,
  textStyle: "",
 };
}

function heading(text: string, tag: "h1" | "h2" | "h3" = "h2") {
 return {
  children: [textNode(text, 1)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "heading",
  tag,
  version: 1,
 };
}

export function createDailyReadingReadingContent(reading: DailyReading): JsonObject {
 const vocabLines =
  reading.enrichment.vocabulary.status === "ready"
   ? reading.enrichment.vocabulary.data.items
      .slice(0, 15)
      .map((word, index) => `${index + 1}. ${word.hanzi} — ${word.meaningVi}`)
   : [];

 const grammarLines =
  reading.enrichment.grammar.status === "ready"
   ? reading.enrichment.grammar.data.items
      .slice(0, 8)
      .map((point, index) => `${index + 1}. ${point.patternZh} — ${point.explanationVi}`)
   : [];

 return {
  root: {
   children: [
    heading(reading.article.titleZh, "h1"),
    paragraph(
     reading.enrichment.translation.status === "ready"
      ? reading.enrichment.translation.data.titleVi
      : "",
    ),
    paragraph(""),
    heading("Nội dung bài đọc", "h2"),
    ...reading.article.paragraphs.map((p) => paragraph(p.zh)),
    paragraph(""),
    ...(vocabLines.length > 0
     ? [heading("Từ vựng trọng tâm", "h2"), ...vocabLines.map(paragraph), paragraph("")]
     : []),
    ...(grammarLines.length > 0
     ? [heading("Ngữ pháp bài đọc", "h2"), ...grammarLines.map(paragraph), paragraph("")]
     : []),
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

export function createDailyReadingPersonalNoteContent(reading: DailyReading): JsonObject {
 return {
  root: {
   children: [
    heading(`Ghi chú bài đọc: ${reading.article.titleZh}`, "h1"),
    paragraph("Viết ghi chú cá nhân, phân tích cấu trúc câu và từ mới tại đây..."),
    paragraph(""),
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

export function DailyReadingNoteCard({
 reading,
 compact = false,
}: {
 reading: DailyReading;
 compact?: boolean;
}) {
 const noteLessonId = `daily:${reading.id}`;
 const linkedNoteQuery = useLessonLinkedNote(noteLessonId, "main");
 const createNoteMutation = useCreateLessonLinkedNote();
 const note = linkedNoteQuery.data;
 const isCreating = createNoteMutation.isPending;

 const defaultReadingContent = useMemo(() => createDailyReadingReadingContent(reading), [reading]);

 const handleCreate = () => {
  createNoteMutation.mutate(
   {
    lessonId: noteLessonId,
    relationType: "main",
    title: `Ghi chú: ${reading.article.titleZh}`,
    category: "general",
    tags: ["daily-reading", reading.id, reading.classification.topic],
    content: createDailyReadingPersonalNoteContent(reading),
   },
   {
    onSuccess: () => toast.success("Đã tạo ghi chú cho bài đọc"),
    onError: () => toast.error("Không tạo được ghi chú cho bài đọc"),
   },
  );
 };

 return (
  <Card padding="lg" className={compact ? "h-full min-h-0" : undefined}>
   <div className={compact ? "grid h-full min-h-0 gap-4" : "grid gap-4"}>
    {linkedNoteQuery.isLoading ? (
     <LinkedContentSkeleton label="Đang kiểm tra ghi chú của bài đọc..." />
    ) : note ? (
     <LessonSplitNoteEditor
      key={note.id}
      noteId={note.id}
      fillHeight={compact}
      defaultReadingContent={defaultReadingContent}
     />
    ) : (
     <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
       <FileEdit className="size-6" />
      </div>
      <div className="grid max-w-md gap-1">
       <Typography weight="bold">Chưa có ghi chú cho bài đọc này</Typography>
       <Typography variant="bodySmall" tone="muted">
        Bạn có thể tạo ghi chú liên kết trực tiếp với bài viết để lưu lại các mẫu câu hay, phân tích
        ngữ pháp hoặc phản tư khi đọc.
       </Typography>
      </div>
      <Button type="button" onClick={handleCreate} disabled={isCreating} size="toolbar">
       {isCreating ? (
        <span className="inline-flex items-center gap-2">
         <Loader2 className="animate-spin size-4" />
         Đang tạo ghi chú...
        </span>
       ) : (
        <span className="inline-flex items-center gap-2">
         <BookOpen className="size-4" />
         Tạo ghi chú cho bài đọc này
        </span>
       )}
      </Button>
     </div>
    )}
   </div>
  </Card>
 );
}
