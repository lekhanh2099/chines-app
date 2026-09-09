import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type {
 ReaderAnnotation,
 ReaderPronunciationAnalysis,
} from "@/features/reading/hooks/useReaderStudyState";

export function ReaderOverview({ resource }: { resource: ReaderDocumentResource }) {
 const t = useTranslations("Reader.study.chrome.overview");
 const chromeT = useTranslations("Reader.study.chrome");
 return (
  <div className="grid gap-4 lg:grid-cols-2">
   <Card variant="subtle" padding="lg" className="grid content-start gap-3">
    <Typography as="h2" variant="cardTitle" weight="black">
     {t("whatIsThis")}
    </Typography>
    <Typography variant="bodySmall" weight="black">
     {resource.document.genre_vi || chromeT("defaultReading")}
    </Typography>
    <Typography variant="bodySmall" tone="muted">
     {resource.document.analysis.mainIdeaVi || t("defaultDescription")}
    </Typography>
   </Card>
   <Card variant="subtle" padding="lg" className="grid content-start gap-3">
    <Typography as="h2" variant="cardTitle" weight="black">
     {t("objectives")}
    </Typography>
    {resource.document.objectives_vi.length > 0 ? (
     <ul className="grid gap-2 pl-5 text-sm text-foreground-muted">
      {resource.document.objectives_vi.map((item) => (
       <li key={item}>{item}</li>
      ))}
     </ul>
    ) : (
     <Typography variant="bodySmall" tone="muted">
      {t("defaultObjectives")}
     </Typography>
    )}
   </Card>
  </div>
 );
}

export function ReaderDictation({ resource }: { resource: ReaderDocumentResource }) {
 const t = useTranslations("Reader.study.chrome.dictation");
 const fullText = resource.paragraphs.map((paragraph) => paragraph.zh).join("\n");
 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <Badge variant="purple" className="justify-self-start">
    {t("badge")}
   </Badge>
   <Typography as="h3" variant="sectionTitle" weight="black">
    {t("title")}
   </Typography>
   <Typography variant="bodySmall" tone="muted">
    {t("description")}
   </Typography>
   <div className="flex flex-wrap gap-2">
    <Button type="button" asChild>
     <Link
      href={`/dictation?documentId=${encodeURIComponent(resource.document.id)}`}
      prefetch={false}
     >
      {t("open")}
     </Link>
    </Button>
    <Button type="button" variant="outline" asChild>
     <Link href={`/tts?text=${encodeURIComponent(fullText)}`} prefetch={false}>
      {t("openTts")}
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
 const t = useTranslations("Reader.study.chrome.analysis");
 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <Typography as="h3" variant="sectionTitle" weight="black">
    {t("title")}
   </Typography>
   <Typography variant="bodySmall" tone="muted">
    {resource.document.analysis.mainIdeaVi || t("empty")}
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
     {t("contextualPinyin")}
    </Typography>
    {resource.paragraphs.map((paragraph, index) => {
     const analysis = analysisBySegmentId.get(paragraph.id);
     if (!analysis) return null;
     return (
      <div key={paragraph.id} className="flex flex-wrap items-center gap-2">
       <Typography as="span" variant="caption" tone="muted">
        {t("segment", { number: index + 1 })}
       </Typography>
       <Badge variant={analysis.sourcePinyinStatus === "rejected" ? "warning" : "purple"}>
        {analysis.sourcePinyinStatus === "aligned"
         ? t("sourceAligned")
         : analysis.sourcePinyinStatus === "rejected"
           ? t("sourceRejected")
           : t("generated")}
       </Badge>
       {analysis.unresolved.length > 0 ? (
        <Typography as="span" variant="caption" tone="danger">
         {t("unresolved", { items: analysis.unresolved.map((item) => item.text).join(" ") })}
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
 const t = useTranslations("Reader.study.chrome.summary");
 const summary = resource.document.summary;
 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <Typography as="h3" variant="sectionTitle" weight="black">
    {t("title")}
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
     {t("empty")}
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
 const t = useTranslations("Reader.study.chrome.notes");
 if (annotations.length === 0) {
  return (
   <Card variant="subtle" padding="md">
    <Typography variant="bodySmall" tone="muted">
     {t("empty")}
    </Typography>
   </Card>
  );
 }
 return (
  <Card variant="subtle" padding="md" className="grid gap-2">
   <Typography as="h2" variant="cardTitle" weight="black">
    {t("title")}
   </Typography>
   {annotations.map((annotation) => (
    <div key={annotation.id} className="flex min-w-0 items-start justify-between gap-2">
     <div className="grid min-w-0 gap-1">
      <Typography as="p" variant="bodySmall" lang="zh-CN">
       {annotation.selected_text || t("selectedFallback")}
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
      {t("delete")}
     </Button>
    </div>
   ))}
  </Card>
 );
}
