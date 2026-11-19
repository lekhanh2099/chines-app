"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Spinner } from "@/components/ui/feedback/spinner";
import { EmptyState } from "@/components/patterns/empty-state";
import { cn } from "@/lib/utils";
import { usePdfInkTools } from "@/features/reading/pdf/usePdfPageInk";
import { usePdfPageViewport } from "@/features/reading/pdf/usePdfPageViewport";
import type { NotePdfAttachment } from "@/services/notes/note-pdf.service";
import { NotePdfPage } from "./NotePdfPage";
import { useNotePdfDocument } from "./useNotePdfDocument";

function lastPageKey(attachmentId: string) {
 return `hanzihome:note-pdf-page:${attachmentId}`;
}

function readLastPage(attachmentId: string, pageCount: number) {
 try {
  const stored = Number(window.localStorage.getItem(lastPageKey(attachmentId)));
  return Number.isInteger(stored) && stored >= 1 && stored <= pageCount ? stored : 1;
 } catch {
  return 1;
 }
}

/** A note's PDF: the open document, the current page and the ink tools shared by every page. */
export function NotePdfViewer({
 attachment,
 onReplace,
 onRemove,
}: {
 attachment: NotePdfAttachment;
 onReplace: () => void;
 onRemove: () => void;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const common = useTranslations("Common");
 const { document, failed, retry } = useNotePdfDocument(attachment);
 const pageCount = document?.numPages ?? attachment.page_count;
 const [pageNumber, setPageNumber] = useState(() =>
  readLastPage(attachment.id, attachment.page_count),
 );
 // Without an Apple Pencil the finger is the pen; two fingers scroll and zoom.
 const tools = usePdfInkTools({ fingerInk: true });
 const viewport = usePdfPageViewport();
 const { viewerRef, isFullscreen } = viewport;

 useEffect(() => {
  try {
   window.localStorage.setItem(lastPageKey(attachment.id), String(pageNumber));
  } catch {
   // Remembering the page is a convenience only.
  }
 }, [attachment.id, pageNumber]);

 const goToPage = (next: number) => {
  setPageNumber(Math.min(pageCount, Math.max(1, Math.round(next))));
 };
 const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === "ArrowLeft" || event.key === "PageUp") goToPage(pageNumber - 1);
  if (event.key === "ArrowRight" || event.key === "PageDown") goToPage(pageNumber + 1);
 };

 return (
  <section
   ref={viewerRef}
   aria-label={attachment.file_name}
   className={cn(
    "flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-bg-subtle",
    isFullscreen && "fixed inset-0 z-120 h-dvh w-dvw",
   )}
   onKeyDown={handleKeyDown}
  >
   {document ? (
    <NotePdfPage
     key={pageNumber}
     document={document}
     attachmentId={attachment.id}
     fileName={attachment.file_name}
     pageNumber={pageNumber}
     onGoToPage={goToPage}
     tools={tools}
     viewport={viewport}
     onReplace={onReplace}
     onRemove={onRemove}
    />
   ) : failed ? (
    <div className="grid flex-1 place-content-center p-4">
     <EmptyState
      surface="card"
      title={t("loadError")}
      description={t("loadErrorDescription")}
      actions={
       <Button type="button" variant="outline" onClick={retry}>
        {common("actions.retry")}
       </Button>
      }
     />
    </div>
   ) : (
    <div className="grid flex-1 place-content-center justify-items-center gap-2">
     <Spinner className="size-6" />
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("loading")}
     </Typography>
    </div>
   )}
  </section>
 );
}
