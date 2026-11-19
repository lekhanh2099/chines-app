import type { PdfStroke } from "@/features/reading/pdf/pdf-annotations";
import {
 brushOutline,
 brushPathLength,
 brushWidthsForStroke,
 estimateBrushEm,
 type BrushPoint,
} from "@/features/reading/pdf/kaishu-brush";
import {
 KAISHU_BRUSH_TEMPLATES,
 KAISHU_EM_PER_MEDIAN_STROKE,
 KAISHU_WIDTH_PER_EM,
} from "@/features/reading/pdf/kaishu-brush-templates";

/** Recent brush strokes on the page that the character size is estimated from. */
const SIZE_FROM_STROKES = 8;
/** The pen-width setting a brush stroke is sized at its natural KaiTi weight. */
const NATURAL_WIDTH_SETTING = 4;
const MAX_STROKE_WIDTH = 64;

/**
 * Page-normalised points in isotropic units: 1000 across the page, and the
 * same unit downwards (`aspect` is the page's height over its width).
 */
export function isotropicPoints(stroke: PdfStroke, aspect: number): BrushPoint[] {
 return stroke.points.map((point) => ({ x: point.x * 1000, y: point.y * 1000 * aspect }));
}

/** A clean width for the line drawn while a brush stroke is in progress. */
export function liveBrushWidth(strokes: readonly PdfStroke[], widthSetting: number): number {
 const previous = strokes.findLast((stroke) => stroke.tool === "brush");
 return previous?.width ?? widthSetting * 2;
}

/**
 * Finishes the brush stroke `strokeId`: estimates the character size from
 * the page's recent brush strokes, sizes the brush to it, and fixes the
 * Kaishu width profile into the stroke. Other strokes are returned as they are.
 */
export function finishPdfBrushStroke(
 strokes: readonly PdfStroke[],
 strokeId: string,
 aspect: number,
 widthSetting: number,
): PdfStroke[] {
 const brushStrokes = strokes.filter((stroke) => stroke.tool === "brush");
 const finished = brushStrokes.find((stroke) => stroke.id === strokeId);
 if (!finished) return [...strokes];
 const recent = brushStrokes
  .slice(-SIZE_FROM_STROKES)
  .map((stroke) => brushPathLength(isotropicPoints(stroke, aspect)));
 const em = estimateBrushEm(recent, KAISHU_EM_PER_MEDIAN_STROKE);
 const points = isotropicPoints(finished, aspect);
 const widths = brushWidthsForStroke(points, em, KAISHU_BRUSH_TEMPLATES);
 const width = Math.min(
  MAX_STROKE_WIDTH,
  Math.max(1, KAISHU_WIDTH_PER_EM * em * (widthSetting / NATURAL_WIDTH_SETTING)),
 );
 const rounded = Math.round(width * 100) / 100;
 return strokes.map((stroke) =>
  stroke.id === strokeId ? { ...stroke, width: rounded, widths } : stroke,
 );
}

/** The filled outline of a finished brush stroke, in isotropic units. */
export function pdfBrushOutlinePath(stroke: PdfStroke, aspect: number): string {
 const widths = stroke.widths ?? [];
 return brushOutline(
  isotropicPoints(stroke, aspect),
  widths.map((multiplier) => multiplier * stroke.width),
 );
}
