"use client";

import { Download, Info } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/overlays/base-popover";
import { cn } from "@/lib/utils";

import { PdfAnnotationConflict } from "@/features/reading/pdf/PdfAnnotationConflict";
import { PdfInkLayer } from "@/features/reading/pdf/PdfInkLayer";
import { PdfInkToolbar } from "@/features/reading/pdf/PdfInkToolbar";
import { PdfPageViewerHeader } from "@/features/reading/pdf/PdfPageViewerHeader";
import { usePdfAnnotations } from "@/features/reading/pdf/usePdfAnnotations";
import { usePdfInkTools, usePdfPageInk } from "@/features/reading/pdf/usePdfPageInk";
import { usePdfPageViewport } from "@/features/reading/pdf/usePdfPageViewport";
import {
 pdfPageWidthRem,
 pdfHref,
 importedPdfAssetId,
} from "@/features/reading/pdf/pdf-viewer-utils";
import type { ReaderPdfAsset } from "@/features/reading/model/reading-assets.schemas";

type PdfReaderWorkspaceProps = {
 initialAssetId?: string;
 heading?: string;
 description?: string;
 badgeLabel?: string;
 backHref?: string;
 backLabel?: string;
 metadata?: string;
 notice?: string;
 studyTasks?: string[];
 badges?: string[];
 initialAssets: ReadonlyArray<ReaderPdfAsset>;
 showAssetPicker?: boolean;
};

export function PdfReaderWorkspace({
 initialAssetId,
 heading,
 description,
 badgeLabel,
 backHref,
 backLabel,
 metadata,
 notice,
 studyTasks = [],
 badges = [],
 initialAssets,
 showAssetPicker = true,
}: PdfReaderWorkspaceProps) {
 const t = useTranslations("Reader.pdf");
 const resolvedHeading = heading ?? t("heading");
 const resolvedDescription = description ?? t("description");
 const resolvedBadgeLabel = badgeLabel ?? t("badge");
 const resolvedBackLabel = backLabel ?? t("back");
 const assets = initialAssets;
 const [selectedAssetId, setSelectedAssetId] = useState(initialAssetId ?? assets[0]?.id ?? "");
 const selectedAsset = useMemo(
  () => assets.find((asset) => asset.id === selectedAssetId) ?? assets[0],
  [assets, selectedAssetId],
 );

 if (!selectedAsset) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     {t("noAssets")}
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      {backHref ? (
       <Button
        type="button"
        variant="ghost"
        size="sm"
        asChild
        className="justify-self-start justify-self-start"
       >
        <a href={backHref}>{resolvedBackLabel}</a>
       </Button>
      ) : null}
      <Badge variant="purple" className="justify-self-start">
       {resolvedBadgeLabel}
      </Badge>
      <Typography as="h1" variant="sectionTitle" weight="black">
       {resolvedHeading}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {metadata ?? resolvedDescription}
      </Typography>
     </div>
     <div className="flex max-w-full flex-wrap items-start justify-end gap-2">
      {notice ? (
       <Popover.Root>
        <Popover.Trigger
         render={
          <Button type="button" variant="outline" size="sm">
           <Info data-icon="inline-start" />
           {t("guide")}
          </Button>
         }
        />
        <Popover.Portal>
         <BasePopoverPositioner side="bottom" align="end" sideOffset={8} collisionPadding={8}>
          <BasePopoverPopup variant="default" initialFocus={false} finalFocus={false}>
           <div className="grid max-w-sm gap-2 p-3 text-sm leading-6 text-foreground-muted">
            <Typography as="p" variant="bodySmall" tone="muted">
             {notice}
            </Typography>
            {studyTasks.length > 0 ? (
             <ol className="grid gap-1 ps-5">
              {studyTasks.map((task) => (
               <li key={task}>{task}</li>
              ))}
             </ol>
            ) : null}
           </div>
          </BasePopoverPopup>
         </BasePopoverPositioner>
        </Popover.Portal>
       </Popover.Root>
      ) : null}
      {badges.length > 0 ? (
       <div className="flex flex-wrap justify-end gap-1">
        {badges.map((badge) => (
         <Badge key={badge}>{badge}</Badge>
        ))}
       </div>
      ) : notice ? null : (
       <Badge>{t("previewPages", { count: assets.length })}</Badge>
      )}
     </div>
    </div>
    {showAssetPicker ? (
     <div
      className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-soft"
      aria-label={t("pagePicker")}
     >
      {assets.map((asset) => (
       <Button
        key={asset.id}
        type="button"
        size="sm"
        variant={asset.id === selectedAsset.id ? "active" : "outline"}
        aria-pressed={asset.id === selectedAsset.id}
        onClick={() => setSelectedAssetId(asset.id)}
       >
        {asset.title.replace("Hán ngữ · ", "")}
       </Button>
      ))}
     </div>
    ) : null}
   </Card>
   <PdfPageViewer key={selectedAsset.id} asset={selectedAsset} />
  </div>
 );
}

function PdfPageViewer({ asset }: { asset: ReaderPdfAsset }) {
 const t = useTranslations("Reader.pdf");
 const pageRef = useRef<HTMLDivElement>(null);
 const common = useTranslations("Common");
 const {
  strokes,
  replaceStrokes,
  retrySave,
  saveFailed,
  isSaving,
  isQueued,
  canEdit,
  loadFailed,
  retryLoad,
  conflict,
  resolveConflict,
 } = usePdfAnnotations({ assetId: importedPdfAssetId(asset), pageNumber: asset.pdfPage });
 const {
  viewerRef,
  zoom,
  setZoom,
  fitToContainer,
  setFitToContainer,
  isFullscreen,
  toggleFullscreen,
  scrollAreaRef,
 } = usePdfPageViewport();
 const [imageFailed, setImageFailed] = useState(false);
 const tools = usePdfInkTools();
 const ink = usePdfPageInk({ strokes, replaceStrokes, canEdit, tools });
 const [conflictOpen, setConflictOpen] = useState(true);
 const [resolvingConflict, setResolvingConflict] = useState(false);
 const chooseConflict = async (useServer: boolean) => {
  setResolvingConflict(true);
  try {
   await resolveConflict(useServer);
   if (useServer) {
    ink.resetHistory();
   }
   setConflictOpen(true);
  } catch {
   toast.error(t("conflict.error"));
  } finally {
   setResolvingConflict(false);
  }
 };

 return (
  <section
   ref={viewerRef}
   className={cn(
    "relative flex min-h-[36rem] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-bg-subtle shadow-lg",
    isFullscreen && "fixed inset-0 z-120 h-dvh w-dvw rounded-none",
   )}
   data-pdf-viewer
  >
   <PdfPageViewerHeader
    asset={asset}
    zoom={zoom}
    setZoom={setZoom}
    fitToContainer={fitToContainer}
    setFitToContainer={setFitToContainer}
    toggleFullscreen={toggleFullscreen}
   />

   {isQueued && !saveFailed ? (
    <Typography as="p" variant="caption" tone="muted" role="status" className="px-3 pt-2 sm:px-4">
     {t("annotationQueued")}
    </Typography>
   ) : null}

   {loadFailed || (saveFailed && !conflict.active) ? (
    <div role="alert" className="flex items-center gap-2 px-3 pt-2 sm:px-4">
     <Typography as="p" variant="caption" tone="danger">
      {t(loadFailed ? "annotationError" : "annotationSaveError")}
     </Typography>
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isSaving}
      onClick={() => {
       void (loadFailed ? retryLoad() : retrySave()).catch(() => {});
      }}
     >
      {common("actions.retry")}
     </Button>
    </div>
   ) : null}

   {conflict.active ? (
    <PdfAnnotationConflict
     pageBackground={
      // oxlint-disable-next-line next/no-img-element -- same local PDF page geometry as the annotation canvas
      <img src={asset.imageSrc} alt="" className="block h-auto w-full" />
     }
     strokes={strokes}
     conflict={conflict}
     open={conflictOpen}
     onOpenChange={setConflictOpen}
     resolving={resolvingConflict}
     onChoose={chooseConflict}
    />
   ) : null}

   <div
    className="relative grid min-h-0 flex-1 gap-2 overflow-auto overscroll-contain bg-bg-subtle px-3 py-4 sm:px-6"
    data-pdf-scroll
    ref={scrollAreaRef}
   >
    <PdfInkToolbar ink={ink} canEdit={canEdit} strokeCount={strokes.length} />

    <div className="grid justify-items-center gap-3 pt-4">
     <div
      ref={pageRef}
      className={cn(
       "relative min-w-[18.75rem] bg-surface shadow-lg",
       fitToContainer ? "w-full max-w-[60rem]" : "max-w-none",
      )}
      style={fitToContainer ? undefined : { inlineSize: `${pdfPageWidthRem(zoom)}rem` }}
     >
      {imageFailed ? (
       <div className="grid min-h-[60dvh] place-content-center gap-3 p-8 text-center">
        <Typography variant="bodySmall" tone="muted">
         {t("previewError")}
        </Typography>
        <Button type="button" variant="outline" asChild>
         <a href={pdfHref(asset)} target="_blank" rel="noreferrer">
          <Download data-icon="inline-start" />
          {t("originalPdf")}
         </a>
        </Button>
       </div>
      ) : (
       <>
        {/* oxlint-disable-next-line next/no-img-element -- local pre-rendered PDF page keeps the annotation canvas aligned */}
        <img
         src={asset.imageSrc}
         alt={`${asset.title}, trang PDF ${asset.pdfPage}`}
         className="block h-auto w-full select-none"
         draggable={false}
         onError={() => setImageFailed(true)}
        />
        <PdfInkLayer ink={ink} strokes={strokes} />
       </>
      )}
     </div>
     <Typography as="p" variant="caption" tone="muted" className="text-center">
      Ctrl/Cmd + wheel hoặc pinch để zoom · bật “Cho phép viết bằng cảm ứng” khi dùng bút trên iPad.
     </Typography>
    </div>
   </div>
  </section>
 );
}
