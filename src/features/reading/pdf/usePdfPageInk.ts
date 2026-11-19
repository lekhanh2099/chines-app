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
import { createPdfInkPointerGate } from "@/features/reading/pdf/pdf-ink-pointer-gate";
import { normalizedPdfPoint } from "@/features/reading/pdf/pdf-viewer-utils";

type PdfEditorTool = PdfDrawingTool | "eraser";

export const PEN_COLORS = ["#ef4444", "#2563eb", "#16a34a", "#f59e0b", "#111827"];

type PdfAnnotations = ReturnType<typeof usePdfAnnotations>;

/** A finger must travel this far before it pans, so a palm settling does not scroll. */
const PAN_SLOP_PX = 8;

/** Owns the ink tool choice (tool, colour, widths); it can outlive a single page. */
export function usePdfInkTools({ fingerInk = false }: { fingerInk?: boolean } = {}) {
 const [drawingTool, setDrawingTool] = useState<PdfEditorTool | null>(null);
 const [touchInk, setTouchInk] = useState(fingerInk);
 const [color, setColor] = useState(PEN_COLORS[0] ?? "#ef4444");
 const [width, setWidth] = useState(4);
 const [eraserSize, setEraserSize] = useState(24);
 // The first stylus stroke switches finger ink off once, so a resting palm
 // cannot draw; turning it back on afterwards is the reader's choice.
 const penSeenRef = useRef(false);
 const preferPenInk = () => {
  if (penSeenRef.current) return;
  penSeenRef.current = true;
  setTouchInk(false);
 };

 return {
  drawingTool,
  setDrawingTool,
  touchInk,
  setTouchInk,
  preferPenInk,
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
 const [pointerGate] = useState(createPdfInkPointerGate);
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
 const checkpoint = (base: PdfStroke[] = strokes) => {
  setPast((current) => [...current, base]);
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
 const pointFromEvent = (event: PointerEvent<SVGSVGElement>) =>
  normalizedPdfPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
 // Where the panning finger last was, and whether it has moved far enough to
 // count as a pan rather than a palm settling on the screen.
 const panRef = useRef({ x: 0, y: 0, started: false });
 const beginStroke = (event: PointerEvent<SVGSVGElement>) => {
  const { draws, pans, discardActive, penArrived } = pointerGate.down(event, {
   canInk: canEdit && drawingTool !== null,
   touchInk,
  });
  if (penArrived) tools.preferPenInk();
  if (pans) panRef.current = { x: event.clientX, y: event.clientY, started: false };
  if (discardActive && activeStrokeRef.current) {
   // The touch stroke in progress was a resting palm or the first finger of
   // a pinch: take it back.
   setPast((current) => current.slice(0, -1));
   replaceGestureStrokes(strokesBeforeRef.current);
   activeStrokeRef.current = "";
  }
  if (!draws) return;
  event.preventDefault();
  const base = discardActive ? strokesBeforeRef.current : strokes;
  strokesBeforeRef.current = base;
  gestureStrokesRef.current = base;
  checkpoint(base);
  const point = pointFromEvent(event);
  const tool = drawingTool;
  if (tool === "eraser") {
   activeStrokeRef.current = "eraser";
   replaceGestureStrokes(erasePdfStrokesAtPoint(base, point, eraserSize / 1000));
   return;
  }
  if (tool === null) return;
  const stroke = createPdfStroke(
   tool,
   tool === "highlighter" ? "#facc15" : color,
   tool === "highlighter" ? Math.max(12, width * 4) : width,
   point,
  );
  replaceGestureStrokes([...base, stroke]);
  activeStrokeRef.current = stroke.id;
 };
 const panPage = (event: PointerEvent<SVGSVGElement>) => {
  const pan = panRef.current;
  const dx = event.clientX - pan.x;
  const dy = event.clientY - pan.y;
  if (!pan.started && Math.hypot(dx, dy) < PAN_SLOP_PX) return;
  panRef.current = { x: event.clientX, y: event.clientY, started: true };
  event.currentTarget.closest("[data-pdf-scroll]")?.scrollBy(-dx, -dy);
 };
 const continueStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (pointerGate.pans(event)) {
   panPage(event);
   return;
  }
  if (!pointerGate.inks(event) || !activeStrokeRef.current) return;
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
  // A palm lifting mid-stroke must not end the pen's stroke.
  const endsInk = pointerGate.inks(event);
  pointerGate.up(event);
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
   event.currentTarget.releasePointerCapture(event.pointerId);
  }
  if (endsInk) activeStrokeRef.current = "";
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
