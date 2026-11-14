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

/** Owns the ink tools, undo/redo history and pointer drawing for one PDF page. */
export function usePdfPageInk({
 strokes,
 replaceStrokes,
 canEdit,
}: {
 strokes: PdfAnnotations["strokes"];
 replaceStrokes: PdfAnnotations["replaceStrokes"];
 canEdit: PdfAnnotations["canEdit"];
}) {
 const activeStrokeRef = useRef("");
 const [drawingTool, setDrawingTool] = useState<PdfEditorTool | null>(null);
 const [touchInk, setTouchInk] = useState(false);
 const [color, setColor] = useState(PEN_COLORS[0] ?? "#ef4444");
 const [width, setWidth] = useState(4);
 const [eraserSize, setEraserSize] = useState(24);
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
  if (!pointerCanInk(event)) return;
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  checkpoint();
  const point = pointFromEvent(event);
  const tool = drawingTool;
  if (tool === "eraser") {
   activeStrokeRef.current = "eraser";
   replaceStrokes(erasePdfStrokesAtPoint(strokes, point, eraserSize / 1000));
   return;
  }
  if (tool === null) return;
  const stroke = createPdfStroke(
   tool,
   tool === "highlighter" ? "#facc15" : color,
   tool === "highlighter" ? Math.max(12, width * 4) : width,
   point,
  );
  replaceStrokes([...strokes, stroke]);
  activeStrokeRef.current = stroke.id;
 };
 const continueStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (!pointerCanInk(event) || !activeStrokeRef.current) return;
  event.preventDefault();
  const point = pointFromEvent(event);
  if (activeStrokeRef.current === "eraser") {
   replaceStrokes(erasePdfStrokesAtPoint(strokes, point, eraserSize / 1000));
   return;
  }
  replaceStrokes(updateStrokeAtId(strokes, activeStrokeRef.current, point));
 };
 const endStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
   event.currentTarget.releasePointerCapture(event.pointerId);
  }
  activeStrokeRef.current = "";
 };

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
