"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { pdfStrokePath, type PdfStroke } from "@/features/reading/pdf/pdf-annotations";
import type { usePdfPageInk } from "@/features/reading/pdf/usePdfPageInk";

type PdfPageInk = ReturnType<typeof usePdfPageInk>;

/**
 * Stroke overlay drawn over one PDF page; it fills the page box it is placed in.
 *
 * The global media reset (`svg { block-size: auto }`) is unlayered and beats
 * `size-full`, so the full height is set inline; otherwise the layer is a
 * width-sized square at the top of the page.
 */
export function PdfInkLayer({ ink, strokes }: { ink: PdfPageInk; strokes: readonly PdfStroke[] }) {
 const t = useTranslations("Reader.pdf");
 // With a tool active the layer takes every touch: iPad Safari applies
 // `touch-action` to Apple Pencil too, so native finger panning would make the
 // pencil scroll. The ink hook pans for fingers that do not draw.
 const capturesTouch = ink.drawingTool !== null;

 return (
  <svg
   aria-label={t("annotationLayer")}
   className={cn(
    "pointer-events-none absolute inset-0 size-full",
    capturesTouch && "pointer-events-auto cursor-crosshair",
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
    blockSize: "100%",
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
