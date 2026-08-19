import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { ReaderDocumentResource } from "../reader-content-api";
import type { ReaderAnnotation, ReaderPronunciationAnalysis } from "../runtime/useReaderStudyState";

export function ReaderOverview({ resource }: { resource: ReaderDocumentResource }) {
 return (
  <div className="grid gap-4 lg:grid-cols-2">
   <Card variant="subtle" padding="lg" className="grid content-start gap-3">
    <Typography as="h2" variant="cardTitle" weight="black">
     Bài này là gì?
    </Typography>
    <Typography variant="bodySmall" weight="black">
     {resource.document.genre_vi || "Bài đọc"}
    </Typography>
    <Typography variant="bodySmall" tone="muted">
     {resource.document.analysis.mainIdeaVi ||
      "Đọc để nắm nội dung chính và cách triển khai của văn bản."}
    </Typography>
   </Card>
   <Card variant="subtle" padding="lg" className="grid content-start gap-3">
    <Typography as="h2" variant="cardTitle" weight="black">
     Mục tiêu bài học
    </Typography>
    {resource.document.objectives_vi.length > 0 ? (
     <ul className="grid gap-2 pl-5 text-sm text-foreground-muted">
      {resource.document.objectives_vi.map((item) => (
       <li key={item}>{item}</li>
      ))}
     </ul>
    ) : (
     <Typography variant="bodySmall" tone="muted">
      Đọc hiểu nội dung, nhận diện từ vựng trọng tâm và diễn đạt lại ý chính.
     </Typography>
    )}
   </Card>
  </div>
 );
}

export function ReaderDictation({ resource }: { resource: ReaderDocumentResource }) {
 const fullText = resource.paragraphs.map((paragraph) => paragraph.zh).join("\n");
 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <Badge variant="purple" className="justify-self-start">
    Luyện nghe chép
   </Badge>
   <Typography as="h3" variant="sectionTitle" weight="black">
    Nghe và chép lại bài đọc
   </Typography>
   <Typography variant="bodySmall" tone="muted">
    Mở workspace Dictation với toàn bộ nội dung Reader hiện tại.
   </Typography>
   <div className="flex flex-wrap gap-2">
    <Button type="button" asChild>
     <Link
      href={`/dictation?documentId=${encodeURIComponent(resource.document.id)}`}
      prefetch={false}
     >
      Mở chép chính tả →
     </Link>
    </Button>
    <Button type="button" variant="outline" asChild>
     <Link href={`/tts?text=${encodeURIComponent(fullText)}`} prefetch={false}>
      Mở tạo giọng đọc
     </Link>
    </Button>
   </div>
  </Card>
 );
}

export function ReaderAnalysis({
 resource,
 analysisBySegmentId,
}: {
 resource: ReaderDocumentResource;
 analysisBySegmentId: ReadonlyMap<string, ReaderPronunciationAnalysis>;
}) {
 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <Typography as="h3" variant="sectionTitle" weight="black">
    Phân tích bài đọc
   </Typography>
   <Typography variant="bodySmall" tone="muted">
    {resource.document.analysis.mainIdeaVi || "Chưa có mô tả phân tích chính."}
   </Typography>
   {resource.document.analysis.paragraphStructureVi.length > 0 ? (
    <ul className="grid gap-1 pl-5 text-sm text-foreground-muted">
     {resource.document.analysis.paragraphStructureVi.map((item) => (
      <li key={item}>{item}</li>
     ))}
    </ul>
   ) : null}
   {resource.document.analysis.logicChainVi.length > 0 ? (
    <Typography variant="bodySmall" tone="muted" wrapping="preWrap">
     {resource.document.analysis.logicChainVi.join("\n")}
    </Typography>
   ) : null}
   <div className="grid gap-2 border-t border-border-default pt-3">
    <Typography as="strong" variant="caption" tone="accent">
     Pinyin theo ngữ cảnh
    </Typography>
    {resource.paragraphs.map((paragraph, index) => {
     const analysis = analysisBySegmentId.get(paragraph.id);
     if (!analysis) return null;
     return (
      <div key={paragraph.id} className="flex flex-wrap items-center gap-2">
       <Typography as="span" variant="caption" tone="muted">
        Đoạn {index + 1}
       </Typography>
       <Badge variant={analysis.sourcePinyinStatus === "rejected" ? "warning" : "purple"}>
        {analysis.sourcePinyinStatus === "aligned"
         ? "Pinyin nguồn đã căn"
         : analysis.sourcePinyinStatus === "rejected"
           ? "Pinyin nguồn bị từ chối"
           : "Pinyin sinh theo ngữ cảnh"}
       </Badge>
       {analysis.unresolved.length > 0 ? (
        <Typography as="span" variant="caption" tone="danger">
         Chưa nhận diện: {analysis.unresolved.map((item) => item.text).join(" ")}
        </Typography>
       ) : null}
      </div>
     );
    })}
   </div>
  </Card>
 );
}

export function ReaderSummary({ resource }: { resource: ReaderDocumentResource }) {
 const summary = resource.document.summary;
 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <Typography as="h3" variant="sectionTitle" weight="black">
    Tóm tắt
   </Typography>
   {summary.modelZh ? (
    <Typography variant="body" lang="zh-CN" wrapping="preWrap">
     {summary.modelZh}
    </Typography>
   ) : null}
   {summary.rubricVi.length > 0 ? (
    <ul className="grid gap-1 pl-5 text-sm text-foreground-muted">
     {summary.rubricVi.map((item) => (
      <li key={item}>{item}</li>
     ))}
    </ul>
   ) : null}
   {!summary.modelZh && summary.rubricVi.length === 0 ? (
    <Typography variant="bodySmall" tone="muted">
     Bài này chưa có summary được review.
    </Typography>
   ) : null}
  </Card>
 );
}

export function ReaderNotes({
 annotations,
 onRemove,
}: {
 annotations: readonly ReaderAnnotation[];
 onRemove: (id: string, revision: number) => void;
}) {
 if (annotations.length === 0) {
  return (
   <Card variant="subtle" padding="md">
    <Typography variant="bodySmall" tone="muted">
     Đoạn hiện tại chưa có ghi chú hoặc đánh dấu.
    </Typography>
   </Card>
  );
 }
 return (
  <Card variant="subtle" padding="md" className="grid gap-2">
   <Typography as="h2" variant="cardTitle" weight="black">
    Ghi chú của đoạn này
   </Typography>
   {annotations.map((annotation) => (
    <div key={annotation.id} className="flex min-w-0 items-start justify-between gap-2">
     <div className="grid min-w-0 gap-1">
      <Typography as="p" variant="bodySmall" lang="zh-CN">
       {annotation.selected_text || "Đoạn đánh dấu"}
      </Typography>
      {annotation.note_text ? (
       <Typography as="p" variant="caption" tone="muted">
        {annotation.note_text}
       </Typography>
      ) : null}
     </div>
     <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => onRemove(annotation.id, annotation.revision)}
     >
      Xoá
     </Button>
    </div>
   ))}
  </Card>
 );
}
