"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
 BookOpen,
 Check,
 ChevronRight,
 FileText,
 Play,
 RotateCcw,
 Search,
 Volume2,
 type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { Typography } from "@/components/ui/typography";
import { fetchLearningLoopItems } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { HanziAwareText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { JsonObjectSchema } from "@/types/json";

import type { ReaderDocumentResource } from "./reader-content-api";
import { ReaderDocumentStudy } from "./ReaderDocumentStudy";
import { PdfReaderWorkspace } from "./PdfReaderWorkspace";
import { readerKindSchema, type ReaderDocumentRow, type ReaderPdfAsset } from "./reader.schemas";

type ReaderSurface = "text" | "pdf";

type ReaderLibraryCardOption = {
 badge: string;
 badgeVariant: ComponentProps<typeof Badge>["variant"];
 description: string;
 glyph: string;
 href: string;
 icon: LucideIcon;
 label: string;
 title: string;
};

function metadataCount(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 if (typeof value === "number") return value;
 const counts = JsonObjectSchema.safeParse(document.source_metadata.counts);
 const nestedValue = counts.success ? counts.data[key] : undefined;
 return typeof nestedValue === "number" ? nestedValue : null;
}

const readerCollectionOptions: ReadonlyArray<
 { kind: ReaderDocumentRow["kind"] } & ReaderLibraryCardOption
> = [
 {
  kind: "daily",
  badge: "Mỗi ngày 1 bài mới",
  badgeVariant: "warning",
  description:
   "Đọc báo bản học tập, nghe, tra từ, làm câu hỏi và lưu toàn bộ lịch sử ngay trên thiết bị.",
  href: "/daily-reading",
  glyph: "报",
  icon: FileText,
  label: "今日阅读 · Bài đọc hôm nay",
  title: "今日阅读 · Bài đọc hôm nay",
 },
 {
  kind: "core",
  badge: "12 bài chính",
  badgeVariant: "success",
  description: "Đọc bài, làm bài tập, tra từ đúng vùng chọn, phân tích mạch bài và tóm tắt.",
  href: "/reader/course",
  glyph: "读",
  icon: BookOpen,
  label: "Giáo trình U3–U5",
  title: "Giáo trình U3–U5",
 },
 {
  kind: "hsk",
  badge: "50 đoạn HSK",
  badgeVariant: "success",
  description:
   "Đọc 50 đoạn văn HSK 3–4 với TTS chạy theo chữ, pinyin, nghĩa tiếng Việt và tra từ dùng chung.",
  href: "/reader/hsk",
  glyph: "阅",
  icon: BookOpen,
  label: "Đọc HSK",
  title: "Đọc HSK",
 },
 {
  kind: "reinforcement",
  badge: "24 bài PDF",
  badgeVariant: "warning",
  description: "PDF có phóng to, toàn màn hình, bút vẽ và đánh dấu lưu riêng theo từng trang.",
  href: "/reader/practice",
  glyph: "写",
  icon: FileText,
  label: "Luyện củng cố",
  title: "Luyện củng cố",
 },
 {
  kind: "mock",
  badge: "12 bài đọc lạ",
  badgeVariant: "success",
  description: "Luyện văn bản chưa gặp, bám cấu trúc kỹ năng của ba đơn nguyên.",
  href: "/reader/mock",
  glyph: "测",
  icon: Check,
  label: "Thi thử / đọc lạ",
  title: "Thi thử / đọc lạ",
 },
];

const readerUtilityOptions: ReadonlyArray<ReaderLibraryCardOption> = [
 {
  badge: "Theo ngữ cảnh",
  badgeVariant: "warning",
  description:
   "Xem âm đọc, nghĩa trong câu, các âm khác và dữ liệu bộ thủ được nguồn hiện có hỗ trợ.",
  href: "/inspector",
  glyph: "查",
  icon: Search,
  label: "Mở khu vực →",
  title: "Tra chữ trong câu",
 },
 {
  badge: "Tạo MP3",
  badgeVariant: "warning",
  description: "Dán bất kỳ đoạn tiếng Trung nào, chọn giọng và tốc độ rồi nghe hoặc tải MP3.",
  href: "/tts",
  glyph: "听",
  icon: Volume2,
  label: "Mở khu vực →",
  title: "TTS Studio",
 },
];

const readerLibraryOptions: ReadonlyArray<ReaderLibraryCardOption> = [
 ...readerCollectionOptions.slice(0, 3),
 ...readerUtilityOptions.slice(0, 1),
 ...readerCollectionOptions.slice(3),
 ...readerUtilityOptions.slice(1),
];

function ReaderLibraryCard({ option }: { option: ReaderLibraryCardOption }) {
 const Icon = option.icon;

 return (
  <Card variant="interactive" padding="lg" className="min-h-56 overflow-hidden sm:min-h-64">
   <Link
    href={option.href}
    prefetch={false}
    className="group relative grid min-h-48 min-w-0 content-between gap-3"
   >
    <span
     aria-hidden="true"
     className="pointer-events-none absolute -right-4 -bottom-12 select-none font-hanzi text-[8rem] leading-none font-bold text-text-muted/10 sm:text-[10rem]"
    >
     {option.glyph}
    </span>
    <div className="relative flex min-w-0 items-start justify-between gap-3">
     <Badge variant={option.badgeVariant} size="sm" casing="natural">
      {option.badge}
     </Badge>
     <IconTile tone="neutral" size="md">
      <Icon aria-hidden="true" />
     </IconTile>
    </div>
    <div className="relative grid min-w-0 max-w-[88%] gap-1.5">
     <HanziAwareText
      as="h2"
      text={option.title}
      variant="cardTitle"
      weight="black"
      className="text-left sm:text-2xl"
     />
     <Typography as="p" variant="bodySmall" tone="secondary" leading="standard">
      {option.description}
     </Typography>
    </div>
    <div className="relative flex items-center gap-1.5">
     <Typography as="span" variant="bodySmall" tone="accent" weight="bold">
      {option.label}
     </Typography>
     <ChevronRight
      className="size-4 text-primary transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
     />
    </div>
   </Link>
  </Card>
 );
}

function ReaderResumePanel() {
 const supabase = useMemo(() => createClient(), []);
 const sessionQuery = useQuery({
  queryKey: ["hanzihome", "reader-home-session-user"],
  queryFn: () => getClientSessionUser(supabase),
  staleTime: 60_000,
 });
 const learningLoopQuery = useQuery({
  queryKey: [...hanzihomeQueryKeys.root, "learning-loop"],
  queryFn: fetchLearningLoopItems,
  enabled: sessionQuery.data !== null && sessionQuery.data !== undefined,
  staleTime: 30_000,
 });
 const [now] = useState(() => Date.now());

 if (sessionQuery.isPending || !sessionQuery.data) return null;
 if (learningLoopQuery.isPending) {
  return (
   <Card variant="subtle" padding="lg" aria-label="Đang tải hoạt động học">
    <div className="h-20 animate-pulse rounded-lg bg-bg-card" />
   </Card>
  );
 }
 if (learningLoopQuery.isError) {
  return (
   <Card variant="subtle" padding="md" role="alert">
    <Typography variant="bodySmall" tone="warning">
     Không tải được trạng thái học tiếp. Các khu vực Reader vẫn sẵn sàng.
    </Typography>
   </Card>
  );
 }

 const items = learningLoopQuery.data;
 const dueCount = items.filter((item) => new Date(item.due_at).getTime() <= now).length;
 const resumeItem = items.find((item) => item.kind === "reading_bookmark") ?? items[0] ?? null;
 if (resumeItem === null && dueCount === 0) return null;

 return (
  <Card
   variant="subtle"
   padding="lg"
   className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
  >
   <div className="grid min-w-0 gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="warning" casing="natural">
      Học tiếp
     </Badge>
     {dueCount > 0 ? (
      <Badge variant="warning" casing="natural">
       {dueCount} mục đến hạn
      </Badge>
     ) : null}
    </div>
    {resumeItem ? (
     <div className="grid min-w-0 gap-1">
      <HanziAwareText as="h2" text={resumeItem.title_zh} variant="sectionTitle" weight="black" />
      <Typography as="p" variant="bodySmall" tone="secondary" clamp="one">
       {[resumeItem.title_vi, resumeItem.kind === "reading_bookmark" ? "Đọc bài" : "Learning Loop"]
        .filter(Boolean)
        .join(" · ")}
      </Typography>
     </div>
    ) : (
     <Typography as="h2" variant="sectionTitle" weight="black">
      Sẵn sàng ôn tập
     </Typography>
    )}
   </div>
   <div className="flex flex-wrap gap-2">
    {resumeItem ? (
     <Button type="button" variant="default" asChild>
      <Link href={resumeItem.source_href} prefetch={false}>
       <Play data-icon="inline-start" />
       Tiếp tục
      </Link>
     </Button>
    ) : null}
    {dueCount > 0 ? (
     <Button type="button" variant="outline" asChild>
      <Link href="/learning-loop" prefetch={false}>
       <RotateCcw data-icon="inline-start" />
       Ôn ngay
      </Link>
     </Button>
    ) : null}
   </div>
  </Card>
 );
}

export function ReaderWorkspace({
 initialDocuments,
 initialResource,
 initialPdfAssets,
}: {
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
 initialPdfAssets: ReadonlyArray<ReaderPdfAsset>;
}) {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const surface: ReaderSurface = searchParams.get("surface") === "pdf" ? "pdf" : "text";
 const parsedReaderKind = readerKindSchema.safeParse(searchParams.get("collection"));
 const readerKind: ReaderDocumentRow["kind"] = parsedReaderKind.success
  ? parsedReaderKind.data
  : "core";
 const requestedDocumentId = searchParams.get("document") ?? "";
 const showCollectionCatalog = parsedReaderKind.success || requestedDocumentId.length > 0;
 const documents = initialDocuments;
 const libraryCoreDocuments = useMemo(
  () => (showCollectionCatalog && readerKind !== "core" ? [] : initialDocuments),
  [initialDocuments, readerKind, showCollectionCatalog],
 );
 const selectedDocumentId = requestedDocumentId;
 const groupedDocuments = useMemo(() => {
  const groups = new Map<string, ReaderDocumentRow[]>();
  for (const document of documents) {
   const groupId = document.unit_id ?? "other";
   const current = groups.get(groupId) ?? [];
   current.push(document);
   groups.set(groupId, current);
  }
  return [...groups.entries()]
   .sort(([left], [right]) => {
    if (left === "other") return 1;
    if (right === "other") return -1;
    return left.localeCompare(right, undefined, { numeric: true });
   })
   .map(([id, documents]) => ({
    id,
    documents: documents.sort(
     (left, right) =>
      (left.reading_number ?? Number.MAX_SAFE_INTEGER) -
      (right.reading_number ?? Number.MAX_SAFE_INTEGER),
    ),
   }));
 }, [documents]);
 const unitSummaries = useMemo(() => {
  const units = new Map<
   string,
   { documents: ReaderDocumentRow[]; title: string; subtitle: string; description: string }
  >();
  for (const document of libraryCoreDocuments) {
   const id = document.unit_id ?? "other";
   const titleZh =
    typeof document.source_metadata.unit_title_zh === "string"
     ? document.source_metadata.unit_title_zh
     : null;
   const titleVi =
    typeof document.source_metadata.unit_title_vi === "string"
     ? document.source_metadata.unit_title_vi
     : null;
   const focusVi =
    typeof document.source_metadata.unit_focus_vi === "string"
     ? document.source_metadata.unit_focus_vi
     : null;
   const current = units.get(id) ?? {
    documents: [],
    title:
     id === "other"
      ? "Tài liệu khác"
      : `Đơn nguyên ${id.replace(/^U/u, "")} · ${titleZh ?? "Reader"}`,
    subtitle: titleVi ?? "",
    description: focusVi ?? "",
   };
   current.documents.push(document);
   units.set(id, current);
  }
  return [...units.entries()].sort(([left], [right]) =>
   left.localeCompare(right, undefined, { numeric: true }),
  );
 }, [libraryCoreDocuments]);
 const resource = selectedDocumentId.length > 0 ? initialResource : null;
 return (
  <div className="grid min-w-0 gap-5 sm:gap-7">
   {!showCollectionCatalog ? (
    <>
     <div className="flex min-w-0 items-start gap-3 border-b border-border-default pb-4">
      <IconTile tone="accent" size="md">
       <BookOpen aria-hidden="true" />
      </IconTile>
      <PageHeader
       title="Không gian học tiếng Trung"
       description="Đọc hiểu vẫn là lõi: 24 bài số hóa hiện có, 50 đoạn HSK 3–4, PDF luyện tập, TTS chạy theo chữ, dịch và chép chính tả HSK 3–6 dùng chung một không gian học."
       className="min-w-0 flex-1"
      />
     </div>
     <ReaderResumePanel />
    </>
   ) : null}

   {surface === "text" ? (
    <div className="grid min-w-0 gap-3">
     <div className="grid min-w-0 gap-5">
      <div className="grid min-w-0 gap-3">
       {!showCollectionCatalog ? (
        <>
         <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {readerLibraryOptions.map((option) => (
           <ReaderLibraryCard key={option.href} option={option} />
          ))}
         </div>
         <div className="grid gap-4 lg:grid-cols-3">
          {unitSummaries.map(([unitId, unit]) => (
           <Card key={unitId} variant="section" padding="lg" className="grid gap-3">
            <div className="flex items-start justify-between gap-3">
             <div className="grid min-w-0 gap-2">
              <HanziAwareText as="h2" text={unit.title} variant="cardTitle" weight="black" />
              <Typography as="p" variant="bodySmall" tone="secondary">
               {unit.subtitle ? <strong>{unit.subtitle}. </strong> : null}
               {unit.description}
              </Typography>
             </div>
             <Badge variant="accent" casing="natural">
              {unitId}
             </Badge>
            </div>
            <Typography as="p" variant="caption" tone="muted">
             {unit.documents.length} bài ·{" "}
             {unit.documents.map((document) => document.title_zh).join(" · ")}
            </Typography>
           </Card>
          ))}
         </div>
        </>
       ) : null}
       {showCollectionCatalog ? (
        <div className="grid min-w-0 gap-4" aria-label="Danh mục Reader đã nhập">
         <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
           type="button"
           size="sm"
           variant="ghost"
           onClick={() => {
            const next = new URLSearchParams(searchParams.toString());
            next.delete("collection");
            next.delete("document");
            router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, {
             scroll: false,
            });
           }}
          >
           ← Thư viện Reader
          </Button>
          <div
           className="flex min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-soft"
           aria-label="Bộ Reader"
          >
           {readerCollectionOptions.map((option) => (
            <Button
             key={option.kind}
             type="button"
             size="sm"
             variant={readerKind === option.kind ? "active" : "outline"}
             onClick={() => {
              const next = new URLSearchParams(searchParams.toString());
              next.set("collection", option.kind);
              next.delete("document");
              router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, {
               scroll: false,
              });
             }}
            >
             {option.label}
            </Button>
           ))}
          </div>
         </div>
         {requestedDocumentId.length === 0 ? (
          documents.length === 0 ? (
           <Typography variant="caption" tone="muted">
            Chưa có static Reader content trong app. Kiểm tra file JSON đã được đóng gói.
           </Typography>
          ) : (
           groupedDocuments.map((group) => (
            <Card key={group.id} variant="subtle" padding="md" className="grid gap-3">
             <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
              <div className="grid gap-1">
               <Typography as="h3" variant="cardTitle" weight="black">
                {group.id === "other" ? "Tài liệu khác" : `Đơn nguyên ${group.id}`}
               </Typography>
               <Typography as="p" variant="caption" tone="muted">
                Chọn một bài để mở Reader
               </Typography>
              </div>
              <Typography variant="caption" tone="muted">
               {group.documents.length} bài
              </Typography>
             </div>
             <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.documents.map((document) => (
               <Button
                key={document.id}
                type="button"
                size="lg"
                variant={selectedDocumentId === document.id ? "active" : "surfaceCard"}
                align="start"
                wrap="normal"
                layout="grid"
                onClick={() => {
                 const next = new URLSearchParams(searchParams.toString());
                 next.set("document", document.id);
                 router.push(`${pathname}?${next.toString()}`, { scroll: false });
                }}
               >
                <Typography
                 as="span"
                 variant="bodySmall"
                 weight="bold"
                 className="w-full text-left"
                >
                 {document.title_zh}
                </Typography>
                <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
                 {document.title_vi || document.genre_vi || document.kind.toUpperCase()}
                </Typography>
                <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
                 {metadataCount(document, "paragraphs") ?? 0} đoạn ·{" "}
                 {metadataCount(document, "vocabulary") ?? 0} từ ·{" "}
                 {metadataCount(document, "exercises") ?? 0} bài
                </Typography>
               </Button>
              ))}
             </div>
            </Card>
           ))
          )
         ) : null}
        </div>
       ) : null}
      </div>
     </div>
     {showCollectionCatalog && requestedDocumentId.length > 0 && resource === null ? (
      <Card variant="subtle" padding="lg">
       <Typography variant="bodySmall" tone="danger">
        Không tìm thấy tài liệu Reader trong static package.
       </Typography>
      </Card>
     ) : null}
     {showCollectionCatalog && resource ? (
      <ReaderDocumentStudy
       key={resource.document.id}
       resource={resource}
       navigationDocuments={documents}
      />
     ) : null}
    </div>
   ) : (
    <PdfReaderWorkspace initialAssets={initialPdfAssets} />
   )}
  </div>
 );
}
