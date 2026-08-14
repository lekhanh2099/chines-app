import { z } from "zod";

export const pdfDrawingToolSchema = z.enum(["pen", "highlighter"]);
export type PdfDrawingTool = z.output<typeof pdfDrawingToolSchema>;

const pdfPointSchema = z.strictObject({
 x: z.number().min(0).max(1),
 y: z.number().min(0).max(1),
});
const pdfColorSchema = z.string().regex(/^#[0-9a-f]{6}$/iu);

export const pdfStrokeSchema = z.strictObject({
 id: z.string().min(1),
 tool: pdfDrawingToolSchema,
 color: pdfColorSchema,
 width: z.number().min(1).max(64),
 points: z.array(pdfPointSchema).min(1),
});

export type PdfPoint = z.output<typeof pdfPointSchema>;
export type PdfStroke = z.output<typeof pdfStrokeSchema>;

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

export function appendPdfStrokePoint(stroke: PdfStroke, point: PdfPoint): PdfStroke {
 const previous = stroke.points.at(-1);
 if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.0015) {
  return stroke;
 }
 return { ...stroke, points: [...stroke.points, point] };
}

export function pdfStrokePath(stroke: PdfStroke): string {
 const path = stroke.points
  .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x * 1000} ${point.y * 1000}`)
  .join(" ");
 const first = stroke.points[0];
 if (stroke.points.length === 1 && first) {
  return `${path} L ${first.x * 1000} ${first.y * 1000}`;
 }
 return path;
}

export function strokeTouchesPoint(
 stroke: PdfStroke,
 point: PdfPoint,
 eraserRadius = 0.018,
): boolean {
 const strokeRadius = Math.max(0.0025, stroke.width / 1000 / 2);
 const threshold = eraserRadius + strokeRadius;
 return stroke.points.some(
  (candidate) => Math.hypot(candidate.x - point.x, candidate.y - point.y) <= threshold,
 );
}

export function erasePdfStrokesAtPoint(
 strokes: readonly PdfStroke[],
 point: PdfPoint,
 eraserRadius = 0.018,
): PdfStroke[] {
 return strokes.filter((stroke) => !strokeTouchesPoint(stroke, point, eraserRadius));
}
