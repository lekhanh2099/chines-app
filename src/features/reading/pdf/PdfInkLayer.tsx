"use client";

import { useSelector } from "@tanstack/react-store";
import { useTranslations } from "next-intl";
import { memo, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { pdfStrokePath, type PdfStroke } from "@/features/reading/pdf/pdf-annotations";
import { pdfBrushOutlinePath } from "@/features/reading/pdf/pdf-brush-strokes";
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
 // During a gesture the live strokes repaint here alone; finished strokes keep
 // their identity, so only the stroke being drawn recomputes its path.
 const live = useSelector(ink.liveInk, (state) => state);
 const shown = live.active ? live.strokes : strokes;
 const layerRef = useRef<SVGSVGElement>(null);
 // Page height over width: brush outlines are built in isotropic units and
 // scaled back into the stretched 1000×1000 view box.
 const [aspect, setAspect] = useState(0);

 useLayoutEffect(() => {
  const layer = layerRef.current;
  if (!layer) return;
  const measure = () => {
   const { width, height } = layer.getBoundingClientRect();
   if (width > 0) setAspect(height / width);
  };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(layer);
  return () => observer.disconnect();
 }, []);

 useLayoutEffect(() => {
  const layer = layerRef.current;
  if (!layer || !capturesTouch) return;
  // iPad Safari turns quick taps and presses into text selection (double or
  // triple tap selects the page, a long press shows the callout). Pointer
  // `preventDefault()` does not stop that; cancelling the touch does, and
  // pointer events still arrive.
  const cancelNativeGestures = (event: TouchEvent) => event.preventDefault();
  layer.addEventListener("touchstart", cancelNativeGestures, { passive: false });
  return () => layer.removeEventListener("touchstart", cancelNativeGestures);
 }, [capturesTouch]);

 return (
  <svg
   ref={layerRef}
   aria-label={t("annotationLayer")}
   className={cn(
    "pointer-events-none absolute inset-0 size-full select-none",
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
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
   }}
  >
   {shown.map((stroke) => (
    <PdfStrokePath key={stroke.id} stroke={stroke} aspect={aspect} />
   ))}
   {live.eraser.radius > 0 && aspect > 0 ? (
    // The eraser's reach, round on screen in the stretched view box.
    <ellipse
     className="text-muted-foreground"
     cx={live.eraser.x * 1000}
     cy={live.eraser.y * 1000}
     rx={live.eraser.radius * 1000}
     ry={(live.eraser.radius * 1000) / aspect}
     fill="currentColor"
     fillOpacity={0.12}
     stroke="currentColor"
     strokeOpacity={0.6}
     strokeWidth={1}
     vectorEffect="non-scaling-stroke"
    />
   ) : null}
  </svg>
 );
}

const PdfStrokePath = memo(function PdfStrokePath({
 stroke,
 aspect,
}: {
 stroke: PdfStroke;
 aspect: number;
}) {
 if (stroke.widths && aspect > 0) {
  return (
   <g transform={`scale(1 ${1 / aspect})`}>
    <path d={pdfBrushOutlinePath(stroke, aspect)} fill={stroke.color} />
   </g>
  );
 }
 return (
  <path
   d={pdfStrokePath(stroke)}
   fill="none"
   stroke={stroke.color}
   strokeLinecap="round"
   strokeLinejoin="round"
   strokeWidth={stroke.width}
   opacity={stroke.tool === "highlighter" ? 0.42 : 1}
  />
 );
});
