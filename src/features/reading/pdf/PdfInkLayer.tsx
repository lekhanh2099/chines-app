"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { pdfStrokePath, type PdfStroke } from "@/features/reading/pdf/pdf-annotations";
import type { usePdfPageInk } from "@/features/reading/pdf/usePdfPageInk";

type PdfPageInk = ReturnType<typeof usePdfPageInk>;

/**
 * Stroke overlay drawn over one PDF page.
 *
 * The global media reset (`svg { block-size: auto }`) is unlayered and beats
 * `size-full`, so without `fillPageHeight` the layer is a width-sized square at
 * the top of the page. The Reader keeps that geometry because its saved ink
 * was drawn in it; note PDFs fill the whole page.
 */
export function PdfInkLayer({
 ink,
 strokes,
 fillPageHeight = false,
}: {
 ink: PdfPageInk;
 strokes: readonly PdfStroke[];
 fillPageHeight?: boolean;
}) {
 const t = useTranslations("Reader.pdf");
 const { drawingTool, touchInk } = ink;
 const capturesTouch = drawingTool !== null && touchInk;

 return (
  <svg
   aria-label={t("annotationLayer")}
   className={cn(
    "pointer-events-none absolute inset-0 size-full",
    drawingTool !== null && "pointer-events-auto cursor-crosshair",
   )}
   viewBox="0 0 1000 1000"
   preserveAspectRatio="none"
   role="img"
   data-touch-ink={capturesTouch ? "" : undefined}
   onContextMenu={(event) => event.preventDefault()}
   onPointerDown={ink.beginStroke}
   onPointerMove={ink.continueStroke}
   onPointerUp={ink.endStroke}
   onPointerCancel={ink.endStroke}
   style={{
    touchAction: capturesTouch ? "none" : "pan-x pan-y",
    blockSize: fillPageHeight ? "100%" : undefined,
   }}
  >
   {strokes.map((stroke) => (
    <path
     key={stroke.id}
     d={pdfStrokePath(stroke)}
     fill="none"
     stroke={stroke.color}
     strokeLinecap="round"
     strokeLinejoin="round"
     strokeWidth={stroke.width}
     opacity={stroke.tool === "highlighter" ? 0.42 : 1}
    />
   ))}
  </svg>
 );
}
