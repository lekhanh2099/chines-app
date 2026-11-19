"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { PdfDocument } from "./pdfjs-loader";

type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

// iPad Safari refuses canvases above ~16.7M pixels and caps total canvas
// memory, so one page bitmap stays well below that at any zoom.
const MAX_CANVAS_PIXELS = 8_000_000;
// While pinch-zooming the old bitmap is stretched; re-render once it settles.
const RENDER_SETTLE_MS = 140;
// A4 portrait until the real page size is known.
const DEFAULT_ASPECT_RATIO = 1 / Math.SQRT2;

/** Renders one PDF page into a canvas that fills the page box it creates. */
export function NotePdfPageCanvas({
 document,
 pageNumber,
 className,
 onFailed,
}: {
 document: PdfDocument;
 pageNumber: number;
 className?: string;
 onFailed?: () => void;
}) {
 const boxRef = useRef<HTMLDivElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const [page, setPage] = useState<PdfPage>();
 const [cssWidth, setCssWidth] = useState(0);
 const [rendered, setRendered] = useState(false);
 const onFailedRef = useRef(onFailed);
 useEffect(() => {
  onFailedRef.current = onFailed;
 });

 useEffect(() => {
  let active = true;
  document.getPage(pageNumber).then(
   (loaded) => {
    if (active) setPage(loaded);
   },
   () => {
    if (active) onFailedRef.current?.();
   },
  );
  return () => {
   active = false;
  };
 }, [document, pageNumber]);

 useEffect(() => {
  const box = boxRef.current;
  if (!box) return;
  const observer = new ResizeObserver(([entry]) => {
   if (entry) setCssWidth(Math.round(entry.contentRect.width));
  });
  observer.observe(box);
  return () => observer.disconnect();
 }, []);

 useEffect(() => {
  const canvas = canvasRef.current;
  if (!page || !canvas || cssWidth === 0) return;
  const tasks: Array<ReturnType<PdfPage["render"]>> = [];
  const timer = window.setTimeout(() => {
   const viewport = page.getViewport({ scale: cssWidth / page.getViewport({ scale: 1 }).width });
   const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height)),
   );
   canvas.width = Math.floor(viewport.width * pixelRatio);
   canvas.height = Math.floor(viewport.height * pixelRatio);
   const task = page.render({
    canvas,
    viewport,
    transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
   });
   tasks.push(task);
   task.promise.then(
    () => setRendered(true),
    (error) => {
     // A newer size cancels the running render; only real failures surface.
     if (error instanceof Error && error.name === "RenderingCancelledException") return;
     onFailedRef.current?.();
    },
   );
  }, RENDER_SETTLE_MS);
  return () => {
   window.clearTimeout(timer);
   for (const task of tasks) task.cancel();
  };
 }, [cssWidth, page]);

 const base = page?.getViewport({ scale: 1 });

 return (
  <div
   ref={boxRef}
   className={cn("relative w-full bg-surface", className)}
   style={{ aspectRatio: base ? base.width / base.height : DEFAULT_ASPECT_RATIO }}
  >
   <canvas
    ref={canvasRef}
    aria-hidden="true"
    className={cn(
     "absolute inset-0 size-full transition-opacity duration-150",
     rendered ? "opacity-100" : "opacity-0",
    )}
   />
  </div>
 );
}
