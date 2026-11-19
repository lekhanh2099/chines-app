"use client";

import { useRef, useState, type PointerEvent } from "react";

import {
 createPdfStroke,
 erasePdfStrokesAtPoint,
 type PdfDrawingTool,
 type PdfStroke,
 updateStrokeAtId,
} from "@/features/reading/pdf/pdf-annotations";
import type { usePdfAnnotations } from "@/features/reading/pdf/usePdfAnnotations";
import { normalizedPdfPoint } from "@/features/reading/pdf/pdf-viewer-utils";

type PdfEditorTool = PdfDrawingTool | "eraser";

export const PEN_COLORS = ["#ef4444", "#2563eb", "#16a34a", "#f59e0b", "#111827"];

type PdfAnnotations = ReturnType<typeof usePdfAnnotations>;

/** Owns the ink tool choice (tool, colour, widths); it can outlive a single page. */
export function usePdfInkTools({ fingerInk = false }: { fingerInk?: boolean } = {}) {
 const [drawingTool, setDrawingTool] = useState<PdfEditorTool | null>(null);
 const [touchInk, setTouchInk] = useState(fingerInk);
 const [color, setColor] = useState(PEN_COLORS[0] ?? "#ef4444");
 const [width, setWidth] = useState(4);
 const [eraserSize, setEraserSize] = useState(24);

 return {
  drawingTool,
  setDrawingTool,
  touchInk,
  setTouchInk,
  color,
  setColor,
  width,
  setWidth,
  eraserSize,
  setEraserSize,
 };
}

/** Owns the undo/redo history and pointer drawing for one PDF page. */
export function usePdfPageInk({
 strokes,
 replaceStrokes,
 canEdit,
 tools,
}: {
 strokes: PdfAnnotations["strokes"];
 replaceStrokes: PdfAnnotations["replaceStrokes"];
 canEdit: PdfAnnotations["canEdit"];
 tools: ReturnType<typeof usePdfInkTools>;
}) {
 const activeStrokeRef = useRef("");
 // Touch pointers currently down: a second finger means pan/zoom, not ink.
 const touchPointersRef = useRef(new Set<number>());
 const strokesBeforeRef = useRef<PdfStroke[]>([]);
 // The stroke list of the gesture in progress. Pointer events can arrive
 // faster than React re-renders, so each move builds on this, not on the
 // `strokes` captured by the last render.
 const gestureStrokesRef = useRef<PdfStroke[]>([]);
 const replaceGestureStrokes = (next: PdfStroke[]) => {
  gestureStrokesRef.current = next;
  replaceStrokes(next);
 };
 const { drawingTool, touchInk, color, width, eraserSize } = tools;
 const [past, setPast] = useState<PdfStroke[][]>([]);
 const [future, setFuture] = useState<PdfStroke[][]>([]);

 const resetHistory = () => {
  setPast([]);
  setFuture([]);
  activeStrokeRef.current = "";
 };
 const checkpoint = () => {
  setPast((current) => [...current, strokes]);
  setFuture([]);
 };
 const undo = () => {
  const previous = past.at(-1);
  if (!previous) return;
  setPast((current) => current.slice(0, -1));
  setFuture((current) => [strokes, ...current]);
  replaceStrokes(previous);
 };
 const redo = () => {
  const next = future[0];
  if (!next) return;
  setFuture((current) => current.slice(1));
  setPast((current) => [...current, strokes]);
  replaceStrokes(next);
 };
 const clear = () => {
  if (!strokes.length) return;
  checkpoint();
  replaceStrokes([]);
 };
 const pointerCanInk = (event: PointerEvent<SVGSVGElement>) =>
  canEdit && drawingTool !== null && (event.pointerType !== "touch" || touchInk);
 const pointFromEvent = (event: PointerEvent<SVGSVGElement>) =>
  normalizedPdfPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
 const beginStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (event.pointerType === "touch") {
   // A primary pointer starts a new touch sequence: forget fingers whose
   // pointerup never reached the layer.
   if (event.isPrimary) touchPointersRef.current.clear();
   touchPointersRef.current.add(event.pointerId);
  }
  if (touchPointersRef.current.size > 1) {
   // The first finger's mark was the start of a two-finger gesture: take it back.
   if (activeStrokeRef.current) {
    setPast((current) => current.slice(0, -1));
    replaceStrokes(strokesBeforeRef.current);
    activeStrokeRef.current = "";
   }
   return;
  }
  if (!pointerCanInk(event)) return;
  event.preventDefault();
  strokesBeforeRef.current = strokes;
  gestureStrokesRef.current = strokes;
  checkpoint();
  const point = pointFromEvent(event);
  const tool = drawingTool;
  if (tool === "eraser") {
   activeStrokeRef.current = "eraser";
   replaceGestureStrokes(erasePdfStrokesAtPoint(strokes, point, eraserSize / 1000));
   return;
  }
  if (tool === null) return;
  const stroke = createPdfStroke(
   tool,
   tool === "highlighter" ? "#facc15" : color,
   tool === "highlighter" ? Math.max(12, width * 4) : width,
   point,
  );
  replaceGestureStrokes([...strokes, stroke]);
  activeStrokeRef.current = stroke.id;
 };
 const continueStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (touchPointersRef.current.size > 1) return;
  if (!pointerCanInk(event) || !activeStrokeRef.current) return;
  event.preventDefault();
  const point = pointFromEvent(event);
  const current = gestureStrokesRef.current;
  if (activeStrokeRef.current === "eraser") {
   const remaining = erasePdfStrokesAtPoint(current, point, eraserSize / 1000);
   if (remaining.length !== current.length) replaceGestureStrokes(remaining);
   return;
  }
  replaceGestureStrokes(updateStrokeAtId(current, activeStrokeRef.current, point));
 };
 const endStroke = (event: PointerEvent<SVGSVGElement>) => {
  touchPointersRef.current.delete(event.pointerId);
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
   event.currentTarget.releasePointerCapture(event.pointerId);
  }
  activeStrokeRef.current = "";
 };

 return {
  ...tools,
  past,
  future,
  resetHistory,
  undo,
  redo,
  clear,
  beginStroke,
  continueStroke,
  endStroke,
 };
}
