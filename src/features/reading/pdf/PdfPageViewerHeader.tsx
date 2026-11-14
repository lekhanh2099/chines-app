"use client";

import { Expand, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import type { ReaderPdfAsset } from "@/features/reading/model/reading-assets.schemas";
import {
 nextPdfZoom,
 PDF_MAX_ZOOM,
 PDF_MIN_ZOOM,
 pdfHref,
 previousPdfZoom,
} from "@/features/reading/pdf/pdf-viewer-utils";
import type { usePdfPageViewport } from "@/features/reading/pdf/usePdfPageViewport";

type PdfPageViewport = ReturnType<typeof usePdfPageViewport>;

export function PdfPageViewerHeader({
 asset,
 zoom,
 setZoom,
 fitToContainer,
 setFitToContainer,
 toggleFullscreen,
}: {
 asset: ReaderPdfAsset;
 zoom: PdfPageViewport["zoom"];
 setZoom: PdfPageViewport["setZoom"];
 fitToContainer: PdfPageViewport["fitToContainer"];
 setFitToContainer: PdfPageViewport["setFitToContainer"];
 toggleFullscreen: PdfPageViewport["toggleFullscreen"];
}) {
 const t = useTranslations("Reader.pdf");

 return (
  <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
   <div className="min-w-0">
    <Typography as="p" variant="bodySmall" weight="black" clamp="one">
     {asset.title}
    </Typography>
    <Typography as="p" variant="caption" tone="muted">
     {t("pageLabel", { printed: asset.printedPage, pdf: asset.pdfPage })}
    </Typography>
   </div>
   <div className="flex min-w-0 flex-wrap items-center gap-1">
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={t("zoomOut")}
     disabled={!fitToContainer && zoom <= PDF_MIN_ZOOM}
     onClick={() => {
      setFitToContainer(false);
      setZoom(previousPdfZoom(zoom));
     }}
    >
     <ZoomOut />
    </Button>
    <output className="min-w-14 text-center text-xs font-bold" aria-live="polite">
     {fitToContainer ? t("fitWidth") : `${Math.round(zoom)}%`}
    </output>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={t("zoomIn")}
     disabled={!fitToContainer && zoom >= PDF_MAX_ZOOM}
     onClick={() => {
      setFitToContainer(false);
      setZoom(nextPdfZoom(zoom));
     }}
    >
     <ZoomIn />
    </Button>
    <Button
     type="button"
     variant={fitToContainer ? "active" : "outline"}
     size="sm"
     onClick={() => setFitToContainer((current) => !current)}
    >
     {t("fitPage")}
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={t("openOriginal")}
     asChild
    >
     <a href={pdfHref(asset)} target="_blank" rel="noreferrer">
      <ExternalLink />
     </a>
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={t("fullscreen")}
     onClick={() => void toggleFullscreen()}
    >
     <Expand />
    </Button>
   </div>
  </header>
 );
}
