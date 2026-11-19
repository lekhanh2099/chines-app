"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Typography } from "@/components/ui/display/typography";
import { cn } from "@/lib/utils";
import { notePdfAssetId } from "@/features/reading/pdf/note-pdf-asset-id";
import { PdfAnnotationConflict } from "@/features/reading/pdf/PdfAnnotationConflict";
import { PdfInkLayer } from "@/features/reading/pdf/PdfInkLayer";
import { usePdfAnnotations } from "@/features/reading/pdf/usePdfAnnotations";
import { usePdfPageInk, type usePdfInkTools } from "@/features/reading/pdf/usePdfPageInk";
import type { usePdfPageViewport } from "@/features/reading/pdf/usePdfPageViewport";
import { pdfPageWidthRem } from "@/features/reading/pdf/pdf-viewer-utils";
import { NotePdfPageCanvas } from "./NotePdfPageCanvas";
import { NotePdfToolbar } from "./NotePdfToolbar";
import type { PdfDocument } from "./pdfjs-loader";

type PdfViewport = ReturnType<typeof usePdfPageViewport>;

/**
 * One page of a note PDF: the command bar and the page with its ink. Ink is
 * kept on the device as it is drawn and saved to the server when this page
 * unmounts (page change, closing the PDF or the note), when the app is hidden,
 * or from the cloud button.
 */
export function NotePdfPage({
 document,
 attachmentId,
 fileName,
 pageNumber,
 onGoToPage,
 tools,
 viewport,
 onReplace,
 onRemove,
}: {
 document: PdfDocument;
 attachmentId: string;
 fileName: string;
 pageNumber: number;
 onGoToPage: (page: number) => void;
 tools: ReturnType<typeof usePdfInkTools>;
 viewport: PdfViewport;
 onReplace: () => void;
 onRemove: () => void;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const reader = useTranslations("Reader.pdf");
 const annotations = usePdfAnnotations(
  { assetId: notePdfAssetId(attachmentId), pageNumber },
  { deferServerSave: true },
 );
 const { strokes, replaceStrokes, canEdit, conflict } = annotations;
 const ink = usePdfPageInk({ strokes, replaceStrokes, canEdit, tools });
 const [pageFailed, setPageFailed] = useState(false);
 const [conflictOpen, setConflictOpen] = useState(true);
 const [resolvingConflict, setResolvingConflict] = useState(false);
 const { zoom, fitToContainer, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd } =
  viewport;

 const chooseConflict = async (useServer: boolean) => {
  setResolvingConflict(true);
  try {
   await annotations.resolveConflict(useServer);
   if (useServer) ink.resetHistory();
   setConflictOpen(true);
  } catch {
   toast.error(reader("conflict.error"));
  } finally {
   setResolvingConflict(false);
  }
 };

 return (
  <>
   <NotePdfToolbar
    fileName={fileName}
    pageNumber={pageNumber}
    pageCount={document.numPages}
    onGoToPage={onGoToPage}
    ink={ink}
    annotations={annotations}
    viewport={viewport}
    onReplace={onReplace}
    onRemove={onRemove}
   />

   {conflict.active ? (
    <PdfAnnotationConflict
     pageBackground={<NotePdfPageCanvas document={document} pageNumber={pageNumber} />}
     fillPageHeight
     strokes={strokes}
     conflict={conflict}
     open={conflictOpen}
     onOpenChange={setConflictOpen}
     resolving={resolvingConflict}
     onChoose={chooseConflict}
    />
   ) : null}

   <div
    className="grid min-h-0 flex-1 content-start justify-items-center overflow-auto overscroll-contain px-2 py-4 sm:px-6"
    onWheel={handleWheel}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
   >
    <div
     className={cn(
      "relative min-w-[18.75rem] shadow-lg",
      fitToContainer ? "w-full max-w-[60rem]" : "max-w-none",
     )}
     style={fitToContainer ? undefined : { inlineSize: `${pdfPageWidthRem(zoom)}rem` }}
    >
     {pageFailed ? (
      <div className="grid aspect-[1/1.414] place-content-center bg-surface p-8 text-center">
       <Typography variant="bodySmall" tone="muted">
        {t("pageError")}
       </Typography>
      </div>
     ) : (
      <>
       <NotePdfPageCanvas
        document={document}
        pageNumber={pageNumber}
        onFailed={() => setPageFailed(true)}
       />
       <PdfInkLayer ink={ink} strokes={strokes} fillPageHeight />
      </>
     )}
    </div>
   </div>
  </>
 );
}
