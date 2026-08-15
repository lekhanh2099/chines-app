"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "@tanstack/react-store";
import { BookOpen } from "lucide-react";
import { z } from "zod";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/app-header-breadcrumb";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";

import type { ReaderDocumentRow } from "./reader.schemas";

const HEADER_OWNER_ID = "hanzihome-reader";

function readerRouteHref(backHref: string, document: ReaderDocumentRow) {
 if (backHref === "/reader") {
  return `/reader?collection=${document.kind}&document=${encodeURIComponent(document.id)}`;
 }
 const slug = document.kind === "hsk" ? document.slug.replace(/^hsk-/u, "") : document.slug;
 return `${backHref}/${slug}`;
}

function readMetadataNumber(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 if (typeof value === "number") return value;
 const counts = z.record(z.string(), z.number()).safeParse(document.source_metadata.counts);
 const nestedValue = counts.success ? counts.data[key] : undefined;
 return typeof nestedValue === "number" ? nestedValue : null;
}

function readerNavigationLabel(document: ReaderDocumentRow): string {
 const unit = document.unit_id?.replace(/^U/u, "") ?? "";
 if (document.kind === "core" && unit && document.reading_number !== null) {
  return `Chủ đề ${unit} · Bài đọc ${document.reading_number} — ${document.title_zh}`;
 }
 if (document.kind === "hsk") {
  const level = readMetadataNumber(document, "level");
  const lesson = readMetadataNumber(document, "lesson_number");
  const volume = level === null ? "HSK" : `HSK ${level}`;
  const lessonLabel = lesson === null ? "" : ` · Bài ${lesson}`;
  const readingLabel =
   document.reading_number === null ? "" : ` · Bài đọc ${document.reading_number}`;
  return `${volume}${lessonLabel}${readingLabel} — ${document.title_zh}`;
 }
 return `${document.title_zh}${document.title_vi ? ` — ${document.title_vi}` : ""}`;
}

export function ReaderHeaderContextBridge({
 backHref,
 backLabel,
 navigationDocuments,
 selectedDocument,
}: {
 backHref: string;
 backLabel: string;
 navigationDocuments: ReadonlyArray<ReaderDocumentRow>;
 selectedDocument: ReaderDocumentRow;
}) {
 const router = useRouter();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const selectedIndex = navigationDocuments.findIndex(
  (document) => document.id === selectedDocument.id,
 );
 const progressLabel = `${Math.max(1, selectedIndex + 1)}/${Math.max(1, navigationDocuments.length)}`;
 const sectionLabel = selectedDocument.kind === "hsk" ? "Đọc HSK" : "Bài học";
 const content = useMemo(
  () => (
   <AppHeaderBreadcrumb
    aria-label="Điều hướng bài đọc"
    className="min-w-0 max-w-[min(44rem,78vw)] justify-self-start md:max-w-[min(64rem,78vw)]"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
     <AppHeaderBreadcrumbLink href="/reader" disabled={focusModeEnabled} icon={<BookOpen />}>
      Học
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="hidden md:flex min-w-0">
     <AppHeaderBreadcrumbLink href={backHref} disabled={focusModeEnabled} title={backLabel}>
      {sectionLabel}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0 flex-1">
     {navigationDocuments.length > 0 ? (
      <div className="flex min-w-0 items-center gap-2">
       <Select
        value={selectedDocument.id}
        disabled={focusModeEnabled}
        onValueChange={(documentId) => {
         const nextDocument = navigationDocuments.find((document) => document.id === documentId);
         if (nextDocument === undefined) return;
         router.push(readerRouteHref(backHref, nextDocument), { scroll: false });
        }}
       >
        <SelectTrigger
         variant="breadcrumb"
         width="full"
         className="min-w-0 max-w-none"
         aria-label="Chọn bài đọc khác"
        >
         <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" className="min-w-[min(34rem,calc(100vw-2rem))]">
         <SelectGroup>
          {navigationDocuments.map((document) => (
           <SelectItem key={document.id} value={document.id}>
            {readerNavigationLabel(document)}
           </SelectItem>
          ))}
         </SelectGroup>
        </SelectContent>
       </Select>
       <Typography as="span" variant="caption" tone="muted" weight="black" className="shrink-0">
        {progressLabel}
       </Typography>
      </div>
     ) : (
      <AppHeaderBreadcrumbPage title={selectedDocument.title_zh}>
       {selectedDocument.title_zh}
      </AppHeaderBreadcrumbPage>
     )}
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ),
  [
   backHref,
   backLabel,
   focusModeEnabled,
   navigationDocuments,
   progressLabel,
   router,
   sectionLabel,
   selectedDocument,
  ],
 );

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(HEADER_OWNER_ID, content);
 }, [content]);

 useEffect(
  () => () => {
   headerToolbarStore.actions.clearOwnedContent(HEADER_OWNER_ID);
  },
  [],
 );

 return null;
}
