"use client";

import { useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Typography } from "@/components/ui/display/typography";
import { notePdfAssetId } from "@/features/reading/pdf/note-pdf-asset-id";
import { PdfAnnotationConflict } from "@/features/reading/pdf/PdfAnnotationConflict";
import { PdfInkLayer } from "@/features/reading/pdf/PdfInkLayer";
import { PdfInkQuickActions } from "@/features/reading/pdf/PdfInkQuickActions";
import { usePdfAnnotations } from "@/features/reading/pdf/usePdfAnnotations";
import { usePdfPageInk, type usePdfInkTools } from "@/features/reading/pdf/usePdfPageInk";
import { NotePdfPageCanvas } from "./NotePdfPageCanvas";
import { NotePdfToolbar } from "./NotePdfToolbar";
import type { PdfDocument } from "./pdfjs-loader";

// Ink is pushed to the server this long after drawing pauses (and when the
// page scrolls far away, the app is hidden or the note closes).
const IDLE_SAVE_MS = 1500;

type ToolbarProps = Omit<
 ComponentProps<typeof NotePdfToolbar>,
 "ink" | "annotations" | "pageNumber"
>;

/**
 * One page of the vertically scrolling note PDF with its own ink. Mounted only
 * while near the viewport; the current page also renders the command bar into
 * the viewer's toolbar slot, so undo/redo and save state follow that page.
 */
export function NotePdfPage({
 document,
 attachmentId,
 pageNumber,
 aspectRatio,
 tools,
 isCurrent,
 toolbarSlot,
 toolbarProps,
}: {
 document: PdfDocument;
 attachmentId: string;
 pageNumber: number;
 /** First page's ratio, the box size until this page's own size is known. */
 aspectRatio: number;
 tools: ReturnType<typeof usePdfInkTools>;
 isCurrent: boolean;
 toolbarSlot: HTMLElement;
 toolbarProps: ToolbarProps;
}) {
 const t = useTranslations("Notes.editor.pdf");
 const reader = useTranslations("Reader.pdf");
 const annotations = usePdfAnnotations(
  { assetId: notePdfAssetId(attachmentId), pageNumber },
  { deferServerSave: true, idleSaveMs: IDLE_SAVE_MS },
 );
 const { strokes, replaceStrokes, canEdit, conflict } = annotations;
 const ink = usePdfPageInk({ strokes, replaceStrokes, canEdit, tools });
 const [pageFailed, setPageFailed] = useState(false);
 const [conflictOpen, setConflictOpen] = useState(true);
 const [resolvingConflict, setResolvingConflict] = useState(false);

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
   {isCurrent
    ? createPortal(
       <NotePdfToolbar
        {...toolbarProps}
        pageNumber={pageNumber}
        ink={ink}
        annotations={annotations}
       />,
       toolbarSlot,
      )
    : null}

   {conflict.active ? (
    <PdfAnnotationConflict
     pageBackground={<NotePdfPageCanvas document={document} pageNumber={pageNumber} />}
     strokes={strokes}
     conflict={conflict}
     open={conflictOpen}
     onOpenChange={setConflictOpen}
     resolving={resolvingConflict}
     onChoose={chooseConflict}
    />
   ) : null}

   {pageFailed ? (
    <div className="grid place-content-center bg-surface p-8 text-center" style={{ aspectRatio }}>
     <Typography variant="bodySmall" tone="muted">
      {t("pageError")}
     </Typography>
    </div>
   ) : (
    <>
     <NotePdfPageCanvas
      document={document}
      pageNumber={pageNumber}
      aspectRatioHint={aspectRatio}
      onFailed={() => setPageFailed(true)}
     />
     <PdfInkLayer ink={ink} strokes={strokes} />
     <PdfInkQuickActions ink={ink} />
    </>
   )}
  </>
 );
}
