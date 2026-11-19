import { z } from "zod";

const pdfDrawingToolSchema = z.enum(["pen", "highlighter", "brush"]);
export type PdfDrawingTool = z.output<typeof pdfDrawingToolSchema>;

const pdfPointSchema = z.strictObject({
 x: z.number().min(0).max(1),
 y: z.number().min(0).max(1),
});
const pdfColorSchema = z.string().regex(/^#[0-9a-f]{6}$/iu);

const pdfStrokeSchema = z
 .strictObject({
  id: z.string().min(1),
  tool: pdfDrawingToolSchema,
  color: pdfColorSchema,
  width: z.number().min(1).max(64),
  points: z.array(pdfPointSchema).min(1),
  /** Kaishu brush: width multiplier at each point, fixed when the stroke is finished. */
  widths: z.array(z.number().min(0).max(8)).optional(),
 })
 .refine((stroke) => !stroke.widths || stroke.widths.length === stroke.points.length, {
  message: "A brush stroke needs one width per point",
  path: ["widths"],
 });

export type PdfPoint = z.output<typeof pdfPointSchema>;
export type PdfStroke = z.output<typeof pdfStrokeSchema>;

export const pdfAnnotationPayloadSchema = z.strictObject({
 strokes: z.array(pdfStrokeSchema),
});

export const pdfAnnotationRowSchema = z.strictObject({
 id: z.uuid(),
 user_id: z.uuid(),
 asset_id: z.string().min(1),
 page_number: z.number().int().positive(),
 payload: pdfAnnotationPayloadSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export type PdfAnnotationPayload = z.output<typeof pdfAnnotationPayloadSchema>;
export type PdfAnnotationRow = z.output<typeof pdfAnnotationRowSchema>;

export function equalPdfAnnotationPayloads(
 left: PdfAnnotationPayload,
 right: PdfAnnotationPayload,
): boolean {
 return (
  left.strokes.length === right.strokes.length &&
  left.strokes.every((stroke, index) => {
   const other = right.strokes[index];
   return Boolean(
    other &&
    stroke.id === other.id &&
    stroke.tool === other.tool &&
    stroke.color === other.color &&
    stroke.width === other.width &&
    stroke.points.length === other.points.length &&
    (stroke.widths ?? []).join() === (other.widths ?? []).join() &&
    stroke.points.every((point, pointIndex) => {
     const otherPoint = other.points[pointIndex];
     return otherPoint && point.x === otherPoint.x && point.y === otherPoint.y;
    }),
   );
  })
 );
}

export function createPdfStroke(
 tool: PdfDrawingTool,
 color: string,
 width: number,
 point: PdfPoint,
): PdfStroke {
 return pdfStrokeSchema.parse({
  id: crypto.randomUUID(),
  tool,
  color,
  width,
  points: [point],
 });
}

/**
 * Points closer than this (as a fraction of the page width) to the previous
 * one are dropped. The ink hook passes a smaller, zoom-aware value so a
 * zoomed-in page still records every visible movement.
 */
const DEFAULT_MIN_POINT_DISTANCE = 0.0015;

export function appendPdfStrokePoints(
 stroke: PdfStroke,
 points: readonly PdfPoint[],
 minDistance = DEFAULT_MIN_POINT_DISTANCE,
): PdfStroke {
 const next = [...stroke.points];
 for (const point of points) {
  const previous = next.at(-1);
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < minDistance) continue;
  next.push(point);
 }
 return next.length === stroke.points.length ? stroke : { ...stroke, points: next };
}

export function updateStrokeAtId(
 strokes: readonly PdfStroke[],
 id: PdfStroke["id"],
 points: readonly PdfPoint[],
 minDistance = DEFAULT_MIN_POINT_DISTANCE,
) {
 return strokes.map((stroke) =>
  stroke.id === id ? appendPdfStrokePoints(stroke, points, minDistance) : stroke,
 );
}

const pathNumber = (value: number) => Math.round(value * 1000 * 100) / 100;

/**
 * A smooth SVG path through the stroke: each recorded point is a quadratic
 * control point and the curve passes through the midpoints between them, so
 * fast pencil movement draws curves instead of a visible polyline.
 */
export function pdfStrokePath(stroke: PdfStroke): string {
 const [first, ...rest] = stroke.points;
 if (!first) return "";
 const start = `M ${pathNumber(first.x)} ${pathNumber(first.y)}`;
 const last = rest.at(-1);
 if (!last) return `${start} L ${pathNumber(first.x)} ${pathNumber(first.y)}`;
 const curves = rest.slice(0, -1).map((point, index) => {
  const next = rest[index + 1] ?? point;
  const midX = (point.x + next.x) / 2;
  const midY = (point.y + next.y) / 2;
  return `Q ${pathNumber(point.x)} ${pathNumber(point.y)} ${pathNumber(midX)} ${pathNumber(midY)}`;
 });
 return [start, ...curves, `L ${pathNumber(last.x)} ${pathNumber(last.y)}`].join(" ");
}

/**
 * Distance from `point` to the segment `start`–`end`, with page-normalised
 * coordinates made even: y is scaled by `aspect` (the page's height over its
 * width), so a distance means the same on screen in every direction.
 */
function evenDistanceToSegment(point: PdfPoint, start: PdfPoint, end: PdfPoint, aspect: number) {
 const dx = end.x - start.x;
 const dy = (end.y - start.y) * aspect;
 const px = point.x - start.x;
 const py = (point.y - start.y) * aspect;
 const lengthSquared = dx * dx + dy * dy;
 const along =
  lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, (px * dx + py * dy) / lengthSquared));
 return Math.hypot(px - along * dx, py - along * dy);
}

function strokeTouchesPoint(
 stroke: PdfStroke,
 point: PdfPoint,
 eraserRadius: number,
 aspect: number,
): boolean {
 // Half the drawn width, at its widest for a brush stroke.
 const widest = Math.max(1, ...(stroke.widths ?? [1]));
 const threshold = eraserRadius + Math.max(0.0025, (stroke.width * widest) / 1000 / 2);
 const [first] = stroke.points;
 if (!first) return false;
 if (stroke.points.length === 1)
  return evenDistanceToSegment(point, first, first, aspect) <= threshold;
 return stroke.points.some((end, index) => {
  const start = stroke.points[index - 1];
  return start !== undefined && evenDistanceToSegment(point, start, end, aspect) <= threshold;
 });
}

/**
 * Strokes left after erasing at `point`: those the eraser (a circle of
 * `eraserRadius`, in page widths) does not reach along any of their
 * segments. `aspect` is the page's height over its width, so the circle is
 * round on screen.
 */
export function erasePdfStrokesAtPoint(
 strokes: readonly PdfStroke[],
 point: PdfPoint,
 eraserRadius = 0.018,
 aspect = 1,
): PdfStroke[] {
 return strokes.filter((stroke) => !strokeTouchesPoint(stroke, point, eraserRadius, aspect));
}
