"use client";

import { createStore } from "@tanstack/react-store";
import { useRef, useState, type PointerEvent } from "react";
import { z } from "zod";

import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/storage/versioned-storage";

import {
 createPdfStroke,
 erasePdfStrokesAtPoint,
 type PdfDrawingTool,
 type PdfPoint,
 type PdfStroke,
 updateStrokeAtId,
} from "@/features/reading/pdf/pdf-annotations";
import type { usePdfAnnotations } from "@/features/reading/pdf/usePdfAnnotations";
import { createPdfInkPointerGate } from "@/features/reading/pdf/pdf-ink-pointer-gate";
import { finishPdfBrushStroke, liveBrushWidth } from "@/features/reading/pdf/pdf-brush-strokes";
import { pdfStrokesErasedByScribble } from "@/features/reading/pdf/pdf-scribble-erase";
import { normalizedPdfPoint } from "@/features/reading/pdf/pdf-viewer-utils";

type PdfEditorTool = PdfDrawingTool | "eraser";

export const PEN_COLORS = ["#ef4444", "#2563eb", "#16a34a", "#f59e0b", "#111827"];

type PdfAnnotations = ReturnType<typeof usePdfAnnotations>;

/** Handwriting on a tablet is about this tall on screen (CSS pixels) until the writer's own size is known. */
const DEFAULT_SCREEN_EM_PX = 40;
/** The remembered on-screen character size is updated when it moves by more than this share. */
const SCREEN_EM_CHANGE = 0.1;

/** Holding the pen this long without moving opens the quick-action menu (0 turns it off)… */
const DEFAULT_QUICK_ACTIONS_HOLD_MS = 2000;
/** …as long as it stays within this many pixels of where it pressed. */
const QUICK_ACTIONS_SLOP_PX = 6;

/** A finger must travel this far before it pans, so a palm settling does not scroll. */
const PAN_SLOP_PX = 8;

/** Four decimals of the page is well under a pixel even zoomed in, and keeps saved ink small. */
const roundedPdfPoint = (point: PdfPoint): PdfPoint => ({
 x: Math.round(point.x * 10_000) / 10_000,
 y: Math.round(point.y * 10_000) / 10_000,
});

/**
 * What the ink layer shows on top of the saved ink: the gesture in progress,
 * the eraser's reach while erasing (radius 0 when hidden, in page widths) and
 * the quick-action menu opened by holding the pen still.
 */
type LiveInk = {
 active: boolean;
 strokes: PdfStroke[];
 eraser: { x: number; y: number; radius: number };
 menu: { open: boolean; x: number; y: number };
};

const createLiveInkStore = () => {
 const idle: LiveInk = {
  active: false,
  strokes: [],
  eraser: { x: 0, y: 0, radius: 0 },
  menu: { open: false, x: 0, y: 0 },
 };
 return createStore(idle);
};

/** A remembered on/off ink preference; storage is a convenience, so failures fall back. */
function useStoredSwitch(key: string, fallback: boolean) {
 const config = { key, version: 1, schema: z.boolean(), fallback };
 const [value, setValue] = useState(() => readVersionedStorage(getBrowserStorage(), config));
 const update = (next: boolean) => {
  setValue(next);
  writeVersionedStorage(getBrowserStorage(), config, next);
 };
 return { value, update };
}

/**
 * The writer's usual Kaishu character size on screen, in CSS pixels: people
 * keep writing at about the same size on the glass whatever the zoom, so it
 * sizes the first strokes of a page before any character there is finished.
 */
function useStoredScreenEm() {
 const config = {
  key: "hanzihome-pdf-brush-screen-em",
  version: 1,
  schema: z.number().positive(),
  fallback: DEFAULT_SCREEN_EM_PX,
 };
 const [value, setValue] = useState(() => readVersionedStorage(getBrowserStorage(), config));
 const update = (next: number) => {
  // Only a real change is remembered, not every stroke's rounding.
  if (Math.abs(next - value) < value * SCREEN_EM_CHANGE) return;
  setValue(next);
  writeVersionedStorage(getBrowserStorage(), config, next);
 };
 return { value, update };
}

/** How long holding the pen still opens the quick-action menu, remembered (0 turns it off). */
function useStoredHold() {
 const config = {
  key: "hanzihome-pdf-quick-actions-hold",
  version: 1,
  schema: z.number().int().min(0).max(10_000),
  fallback: DEFAULT_QUICK_ACTIONS_HOLD_MS,
 };
 const [value, setValue] = useState(() => readVersionedStorage(getBrowserStorage(), config));
 const update = (next: number) => {
  setValue(next);
  writeVersionedStorage(getBrowserStorage(), config, next);
 };
 return { value, update };
}

/** Owns the ink tool choice (tool, colour, widths); it can outlive a single page. */
export function usePdfInkTools({ fingerInk = false }: { fingerInk?: boolean } = {}) {
 const [drawingTool, setDrawingToolState] = useState<PdfEditorTool | null>(null);
 // The tool picked before the eraser, which the eraser hands back to.
 const toolBeforeEraserRef = useRef<typeof drawingTool>(null);
 const setDrawingTool = (tool: typeof drawingTool) => {
  if (tool === "eraser" && drawingTool !== "eraser") toolBeforeEraserRef.current = drawingTool;
  setDrawingToolState(tool);
 };
 // Scribbling back and forth over ink with the pen erases it.
 const { value: scribbleErase, update: setScribbleErase } = useStoredSwitch(
  "hanzihome-pdf-scribble-erase",
  true,
 );
 // After an erase stroke, go back to the tool used before the eraser.
 const { value: eraserReturns, update: setEraserReturns } = useStoredSwitch(
  "hanzihome-pdf-eraser-returns",
  false,
 );
 const { value: brushScreenEm, update: rememberBrushScreenEm } = useStoredScreenEm();
 const { value: quickActionsHoldMs, update: setQuickActionsHoldMs } = useStoredHold();
 const finishEraseStroke = () => {
  if (eraserReturns) setDrawingToolState(toolBeforeEraserRef.current);
 };
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
  scribbleErase,
  setScribbleErase,
  eraserReturns,
  setEraserReturns,
  finishEraseStroke,
  brushScreenEm,
  rememberBrushScreenEm,
  quickActionsHoldMs,
  setQuickActionsHoldMs,
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
 // What the ink layer shows while a gesture is in progress. Only the layer
 // subscribes, so a pencil move repaints the strokes and nothing else; the
 // page's annotations (and their device outbox write) change once, when the
 // gesture ends.
 const [liveInk] = useState(createLiveInkStore);
 const replaceGestureStrokes = (next: PdfStroke[]) => {
  gestureStrokesRef.current = next;
  liveInk.setState((state) => ({ ...state, active: true, strokes: next }));
 };
 const endLiveInk = () =>
  liveInk.setState((state) => ({
   ...state,
   active: false,
   strokes: [],
   eraser: { x: 0, y: 0, radius: 0 },
  }));
 const showEraser = (point: PdfPoint, radius: number) =>
  liveInk.setState((state) => ({ ...state, eraser: { x: point.x, y: point.y, radius } }));
 const closeQuickActions = () =>
  liveInk.setState((state) => ({ ...state, menu: { ...state.menu, open: false } }));
 /** Saves the gesture's strokes once; a gesture that changed nothing leaves no undo step. */
 const commitGesture = () => {
  if (!liveInk.state.active) return;
  const next = gestureStrokesRef.current;
  if (next === strokesBeforeRef.current) setPast((current) => current.slice(0, -1));
  else replaceStrokes(next);
  endLiveInk();
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
  roundedPdfPoint(
   normalizedPdfPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()),
  );
 /**
  * Every sample since the last move: Apple Pencil reports up to 240 per
  * second but moves arrive once per frame, and the skipped samples are what
  * keeps a fast curve round.
  */
 const pointsFromMove = (event: PointerEvent<SVGSVGElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const native = event.nativeEvent;
  const samples = "getCoalescedEvents" in native ? native.getCoalescedEvents() : [];
  return (samples.length ? samples : [native]).map((sample) =>
   roundedPdfPoint(normalizedPdfPoint(sample.clientX, sample.clientY, rect)),
  );
 };
 /** About one screen pixel on the page as rendered, so zooming in keeps detail. */
 const minPointDistance = (event: PointerEvent<SVGSVGElement>) =>
  1 / Math.max(1, event.currentTarget.getBoundingClientRect().width);
 /**
  * The eraser's reach in page widths: its size is a diameter in screen
  * pixels, so it erases the same area on screen at any zoom.
  */
 const eraserReach = (event: PointerEvent<SVGSVGElement>) => {
  const page = event.currentTarget.getBoundingClientRect();
  return {
   radius: eraserSize / 2 / Math.max(1, page.width),
   aspect: page.width > 0 ? page.height / page.width : 1,
  };
 };
 // Holding the pen still opens the quick-action menu where it presses.
 const holdTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
 const holdStartRef = useRef({ x: 0, y: 0, pointerId: -1 });
 const cancelHold = () => {
  clearTimeout(holdTimerRef.current);
  holdStartRef.current = { x: 0, y: 0, pointerId: -1 };
 };
 const openQuickActions = (at: PdfPoint) => {
  holdStartRef.current = { x: 0, y: 0, pointerId: -1 };
  // The press was for the menu, not ink: take back what it drew or erased.
  if (activeStrokeRef.current) {
   setPast((current) => current.slice(0, -1));
   gestureStrokesRef.current = strokesBeforeRef.current;
   endLiveInk();
   activeStrokeRef.current = "";
  }
  liveInk.setState((state) => ({ ...state, menu: { open: true, x: at.x, y: at.y } }));
 };
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
   gestureStrokesRef.current = strokesBeforeRef.current;
   endLiveInk();
   activeStrokeRef.current = "";
  }
  if (!draws) return;
  event.preventDefault();
  // A press on the page must not start (or keep) a native text selection.
  window.getSelection()?.removeAllRanges();
  // While the quick-action menu is open, a press elsewhere only closes it.
  if (liveInk.state.menu.open) {
   closeQuickActions();
   return;
  }
  const base = discardActive ? strokesBeforeRef.current : strokes;
  strokesBeforeRef.current = base;
  gestureStrokesRef.current = base;
  checkpoint(base);
  const point = pointFromEvent(event);
  cancelHold();
  holdStartRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  if (tools.quickActionsHoldMs > 0) {
   holdTimerRef.current = setTimeout(() => openQuickActions(point), tools.quickActionsHoldMs);
  }
  const tool = drawingTool;
  if (tool === "eraser") {
   activeStrokeRef.current = "eraser";
   const { radius, aspect } = eraserReach(event);
   const remaining = erasePdfStrokesAtPoint(base, point, radius, aspect);
   replaceGestureStrokes(remaining.length === base.length ? base : remaining);
   showEraser(point, radius);
   return;
  }
  if (tool === null) return;
  const strokeWidth =
   tool === "highlighter"
    ? Math.max(12, width * 4)
    : tool === "brush"
      ? liveBrushWidth(base, width)
      : width;
  const stroke = createPdfStroke(
   tool,
   tool === "highlighter" ? "#facc15" : color,
   strokeWidth,
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
  pointerGate.track(event);
  if (pointerGate.pans(event)) {
   panPage(event);
   return;
  }
  const hold = holdStartRef.current;
  if (
   hold.pointerId === event.pointerId &&
   Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > QUICK_ACTIONS_SLOP_PX
  ) {
   cancelHold();
  }
  if (!pointerGate.inks(event) || !activeStrokeRef.current) return;
  event.preventDefault();
  const points = pointsFromMove(event);
  const current = gestureStrokesRef.current;
  if (activeStrokeRef.current === "eraser") {
   const { radius, aspect } = eraserReach(event);
   const remaining = points.reduce<PdfStroke[]>(
    (left, point) => erasePdfStrokesAtPoint(left, point, radius, aspect),
    current,
   );
   if (remaining.length !== current.length) replaceGestureStrokes(remaining);
   const last = points.at(-1);
   if (last) showEraser(last, radius);
   return;
  }
  const next = updateStrokeAtId(current, activeStrokeRef.current, points, minPointDistance(event));
  if (next.some((stroke, index) => stroke !== current[index])) replaceGestureStrokes(next);
 };
 /** Scribble to erase: a pen scribble over ink removes that ink and itself. */
 const eraseScribbledInk = (strokeId: string) => {
  if (!tools.scribbleErase) return;
  const current = gestureStrokesRef.current;
  const scribble = current.find((stroke) => stroke.id === strokeId);
  if (!scribble) return;
  const erased = new Set(pdfStrokesErasedByScribble(current, scribble));
  if (!erased.size) return;
  erased.add(strokeId);
  replaceGestureStrokes(current.filter((stroke) => !erased.has(stroke.id)));
 };
 const endStroke = (event: PointerEvent<SVGSVGElement>) => {
  if (holdStartRef.current.pointerId === event.pointerId) cancelHold();
  // A palm lifting mid-stroke must not end the pen's stroke.
  const endsInk = pointerGate.inks(event);
  const { tapFingers } = pointerGate.up(event);
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
   event.currentTarget.releasePointerCapture(event.pointerId);
  }
  // Two-finger tap undoes, three-finger tap redoes (as in GoodNotes).
  if (tapFingers === 2) undo();
  if (tapFingers === 3) redo();
  if (!endsInk) return;
  const finished = activeStrokeRef.current;
  activeStrokeRef.current = "";
  if (finished !== "eraser" && finished) {
   // A deliberate lift may be a scribble; a cancelled stroke (the system took
   // the touch) is kept as written.
   if (event.type === "pointerup") eraseScribbledInk(finished);
   const page = event.currentTarget.getBoundingClientRect();
   const stillThere = gestureStrokesRef.current.some((stroke) => stroke.id === finished);
   if (page.width > 0 && drawingTool === "brush" && stillThere) {
    // Page units per CSS pixel: 1000 across the page as it is drawn now.
    const unitsPerPixel = 1000 / page.width;
    const result = finishPdfBrushStroke(
     gestureStrokesRef.current,
     finished,
     page.height / page.width,
     width,
     tools.brushScreenEm * unitsPerPixel,
    );
    replaceGestureStrokes(result.strokes);
    if (result.learnedEm > 0) tools.rememberBrushScreenEm(result.learnedEm / unitsPerPixel);
   }
  }
  commitGesture();
  if (finished === "eraser") tools.finishEraseStroke();
 };

 return {
  ...tools,
  liveInk,
  closeQuickActions,
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
