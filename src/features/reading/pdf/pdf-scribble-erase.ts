import type { PdfPoint, PdfStroke } from "@/features/reading/pdf/pdf-annotations";

/**
 * Passes back over the same ground needed before a stroke reads as a
 * scribble. They are counted along the stroke's long axis: a scribble goes
 * back and forth across the ink, while writing (even a zigzag such as "mmm"
 * or "www") keeps moving on along that axis.
 */
const MIN_REVERSALS = 3;
/**
 * Ink length over the bounding-box diagonal. Four passes over the same
 * ground give about 4; looped handwriting such as "ooo" stays under 3.
 */
const MIN_PATH_TO_DIAGONAL = 3;
/** Share of an inked stroke's points inside the scribble for it to count as covered. */
const MIN_COVERED_SHARE = 1 / 3;

type Box = { minX: number; minY: number; maxX: number; maxY: number };

function boundingBox(points: readonly PdfPoint[], padding = 0): Box {
 const xs = points.map((point) => point.x);
 const ys = points.map((point) => point.y);
 return {
  minX: Math.min(...xs) - padding,
  minY: Math.min(...ys) - padding,
  maxX: Math.max(...xs) + padding,
  maxY: Math.max(...ys) + padding,
 };
}

const insideBox = (point: PdfPoint, box: Box) =>
 point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;

/**
 * Direction changes along one axis that travel back at least a third of the
 * stroke's extent, so the small back-steps of loops and letters do not count.
 */
function axisReversals(values: readonly number[], extent: number): number {
 const [first] = values;
 if (first === undefined) return 0;
 const step = Math.max(0.0015, extent / 3);
 let anchor = first;
 let direction = 0;
 let reversals = 0;
 for (const value of values) {
  const delta = value - anchor;
  if (Math.abs(delta) < step) continue;
  const sign = Math.sign(delta);
  if (direction !== 0 && sign !== direction) reversals += 1;
  direction = sign;
  anchor = value;
 }
 return reversals;
}

function pathLength(points: readonly PdfPoint[]): number {
 let length = 0;
 for (let index = 1; index < points.length; index += 1) {
  const previous = points[index - 1];
  const point = points[index];
  if (previous && point) length += Math.hypot(point.x - previous.x, point.y - previous.y);
 }
 return length;
}

/** Whether a pen or brush stroke is a quick back-and-forth scribble rather than writing. */
export function isPdfScribble(points: readonly PdfPoint[]): boolean {
 if (points.length < 8) return false;
 const box = boundingBox(points);
 const width = box.maxX - box.minX;
 const height = box.maxY - box.minY;
 const reversals =
  width >= height
   ? axisReversals(
      points.map((point) => point.x),
      width,
     )
   : axisReversals(
      points.map((point) => point.y),
      height,
     );
 if (reversals < MIN_REVERSALS) return false;
 const diagonal = Math.hypot(box.maxX - box.minX, box.maxY - box.minY);
 return diagonal > 0 && pathLength(points) / diagonal >= MIN_PATH_TO_DIAGONAL;
}

function distanceToSegment(point: PdfPoint, start: PdfPoint, end: PdfPoint): number {
 const dx = end.x - start.x;
 const dy = end.y - start.y;
 const lengthSquared = dx * dx + dy * dy;
 const t =
  lengthSquared === 0
   ? 0
   : Math.min(
      1,
      Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
     );
 return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function scribbleTouches(scribble: PdfStroke, point: PdfPoint, threshold: number): boolean {
 const { points } = scribble;
 if (points.length === 1 && points[0]) {
  return Math.hypot(point.x - points[0].x, point.y - points[0].y) <= threshold;
 }
 for (let index = 1; index < points.length; index += 1) {
  const start = points[index - 1];
  const end = points[index];
  if (start && end && distanceToSegment(point, start, end) <= threshold) return true;
 }
 return false;
}

/**
 * Scribble to erase: when `scribble` is a back-and-forth scribble drawn over
 * ink, the ids of the strokes it covers, which are erased together with the
 * scribble. A stroke is covered when the scribble crosses it and at least a
 * third of it lies within the scribbled area, so a long line the scribble
 * only clips survives. Empty when it is not a scribble or covers nothing;
 * the scribble then stays as ink.
 */
export function pdfStrokesErasedByScribble(
 strokes: readonly PdfStroke[],
 scribble: PdfStroke,
): string[] {
 if (scribble.tool === "highlighter" || !isPdfScribble(scribble.points)) return [];
 const scribbleRadius = scribble.width / 1000 / 2;
 return strokes
  .filter((stroke) => {
   if (stroke.id === scribble.id) return false;
   const threshold = scribbleRadius + Math.max(0.0025, stroke.width / 1000 / 2);
   const area = boundingBox(scribble.points, threshold);
   const inside = stroke.points.filter((point) => insideBox(point, area));
   return (
    inside.length >= stroke.points.length * MIN_COVERED_SHARE &&
    inside.some((point) => scribbleTouches(scribble, point, threshold))
   );
  })
  .map((stroke) => stroke.id);
}
