/**
 * Kaishu brush: the thick/thin profile of a regular-script stroke, predicted
 * from its shape alone (no pressure, no speed).
 *
 * A finished stroke is classified by geometry — direction of travel, sharp
 * turns (折) and a short final segment after a turn (钩) — and each segment
 * takes the median width profile that strokes of that kind have in a KaiTi
 * font (see scripts/pdf/build-kaishu-brush-templates.ts, which measures it
 * and evaluates this module on held-out characters).
 *
 * Coordinates are isotropic (one unit is the same length on both axes), with
 * y growing downwards, as on screen. Lengths that depend on the character's
 * size use `em`, its estimated size.
 *
 * Only relative imports: the template build script runs this file directly.
 */

export type BrushPoint = { x: number; y: number };

/** Bins per segment in a width template. */
export const BRUSH_TEMPLATE_BINS = 12;

/** Font-unit lengths (on a 1024 em) that the classifier was tuned with. */
const DOT_MAX_LENGTH = 140 / 1024;
const SHORT_NA_MAX_LENGTH = 300 / 1024;
/** A turn sharper than this, measured over a window, splits a stroke into segments. */
const CORNER_DEGREES = 55;
/** A last segment shorter than this share of the stroke, after a turn, is a hook. */
const HOOK_MAX_SHARE = 0.28;
const CLASSIFY_SAMPLES = 33;
const CORNER_WINDOW = 3;

export type BrushClass = { type: string; cuts: number[]; segments: string[] };

const distance = (a: BrushPoint, b: BrushPoint) => Math.hypot(b.x - a.x, b.y - a.y);

export function brushPathLength(points: readonly BrushPoint[]): number {
 let total = 0;
 for (let index = 1; index < points.length; index += 1) {
  const previous = points[index - 1];
  const point = points[index];
  if (previous && point) total += distance(previous, point);
 }
 return total;
}

/** `count` points evenly spaced along the polyline. */
export function resampleBrushPoints(points: readonly BrushPoint[], count: number): BrushPoint[] {
 const [first] = points;
 if (!first) return [];
 const cumulative = [0];
 for (let index = 1; index < points.length; index += 1) {
  const previous = points[index - 1] ?? first;
  const point = points[index] ?? previous;
  cumulative.push((cumulative[index - 1] ?? 0) + distance(previous, point));
 }
 const total = cumulative.at(-1) ?? 0;
 const resampled: BrushPoint[] = [];
 let segment = 1;
 for (let step = 0; step < count; step += 1) {
  const target = count === 1 ? 0 : (total * step) / (count - 1);
  while (segment < points.length - 1 && (cumulative[segment] ?? 0) < target) segment += 1;
  const start = points[segment - 1] ?? first;
  const end = points[segment] ?? start;
  const startAt = cumulative[segment - 1] ?? 0;
  const span = (cumulative[segment] ?? startAt) - startAt;
  const fraction = span > 0 ? (target - startAt) / span : 0;
  resampled.push({
   x: start.x + (end.x - start.x) * fraction,
   y: start.y + (end.y - start.y) * fraction,
  });
 }
 return resampled;
}

/** The basic stroke a straight run of ink reads as, from its direction of travel. */
function lineType(from: BrushPoint, to: BrushPoint): string {
 const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
 if (angle > -20 && angle <= 22) return "heng";
 if (angle > 22 && angle <= 68) return "na";
 if (angle > 68 && angle <= 105) return "shu";
 if (angle > 105 && angle <= 170) return "pie";
 if (angle > -75 && angle <= -20) return "ti";
 return "other";
}

function turnDegrees(points: readonly BrushPoint[], index: number): number {
 const before = points[index - CORNER_WINDOW];
 const at = points[index];
 const after = points[index + CORNER_WINDOW];
 if (!before || !at || !after) return 0;
 const ax = at.x - before.x;
 const ay = at.y - before.y;
 const bx = after.x - at.x;
 const by = after.y - at.y;
 const scale = Math.hypot(ax, ay) * Math.hypot(bx, by);
 if (scale === 0) return 0;
 return (Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / scale))) * 180) / Math.PI;
}

/** Classifies a finished stroke; `em` is the character's estimated size. */
export function classifyBrushStroke(points: readonly BrushPoint[], em: number): BrushClass {
 const total = brushPathLength(points);
 if (total < DOT_MAX_LENGTH * em) return { type: "dian", cuts: [], segments: [] };
 const samples = resampleBrushPoints(points, CLASSIFY_SAMPLES);
 const first = samples[0];
 const last = samples.at(-1);
 if (!first || !last) return { type: "dian", cuts: [], segments: [] };
 const turns = samples.map((_, index) => turnDegrees(samples, index));
 const corners: number[] = [];
 for (let index = CORNER_WINDOW; index < samples.length - CORNER_WINDOW; index += 1) {
  const turn = turns[index] ?? 0;
  if (turn < CORNER_DEGREES) continue;
  if (turn < (turns[index - 1] ?? 0) || turn < (turns[index + 1] ?? 0)) continue;
  const previous = corners.at(-1);
  if (previous !== undefined && index - previous < 2 * CORNER_WINDOW) {
   if (turn > (turns[previous] ?? 0)) corners[corners.length - 1] = index;
   continue;
  }
  corners.push(index);
 }
 const cuts = corners
  .map((index) => index / (samples.length - 1))
  .filter((share) => share > 0.06 && share < 0.97);
 if (!cuts.length) {
  const type = lineType(first, last);
  if (type !== "na") return { type, cuts: [], segments: [] };
  // A flat 捺 swells towards its end; a steep, short one is closer to a long dot.
  const angle = (Math.atan2(last.y - first.y, last.x - first.x) * 180) / Math.PI;
  const steep = angle > 45 ? "steep" : "flat";
  const size = total < SHORT_NA_MAX_LENGTH * em ? "s" : "l";
  return { type: `na_${size}_${steep}`, cuts: [], segments: ["na"] };
 }
 const bounds = [0, ...cuts, 1].map(
  (share) => samples[Math.round(share * (samples.length - 1))] ?? first,
 );
 const segments = bounds.slice(1).map((end, index) => lineType(bounds[index] ?? first, end));
 const lastCut = cuts.at(-1) ?? 0;
 if (1 - lastCut < HOOK_MAX_SHARE) {
  return {
   type: `gou:${segments.slice(0, -1).join("-")}>${segments.at(-1) ?? ""}`,
   cuts,
   segments,
  };
 }
 // Bends that share basic directions still differ: 横折 and 横撇, or 竖折 and
 // 竖弯, are told apart by how steep and how long the last segment is.
 const lastStart = bounds.at(-2) ?? first;
 const lastAngle = (Math.atan2(last.y - lastStart.y, last.x - lastStart.x) * 180) / Math.PI;
 const angleBucket = Math.round(lastAngle / 20);
 const lengthBucket = Math.min(2, Math.floor((1 - lastCut) / 0.3));
 return { type: `zhe:${segments.join("-")}@${angleBucket}.${lengthBucket}`, cuts, segments };
}

/**
 * The character size, estimated from the lengths of strokes written around
 * it (the current one included): their median times how much larger than a
 * median stroke a KaiTi character is. Dots and short strokes are told apart
 * relative to it.
 */
export function estimateBrushEm(strokeLengths: readonly number[], emPerMedianStroke: number) {
 const sorted = [...strokeLengths].sort((left, right) => left - right);
 const middle = sorted[Math.floor(sorted.length / 2)] ?? 0;
 return middle * emPerMedianStroke;
}

/** Which segment a position along the stroke (0–1) falls in, and its place within it. */
export function brushSegmentAt(share: number, cuts: readonly number[]) {
 let segment = 0;
 while (segment < cuts.length && share > (cuts[segment] ?? 1)) segment += 1;
 const start = segment === 0 ? 0 : (cuts[segment - 1] ?? 0);
 const end = segment < cuts.length ? (cuts[segment] ?? 1) : 1;
 const local = end > start ? (share - start) / (end - start) : 0;
 const role = segment === 0 ? "first" : segment === cuts.length ? "last" : "mid";
 return { segment, local: Math.min(1, Math.max(0, local)), role };
}

/** Template key for an exact stroke kind, then the per-segment fallback. */
export const exactTemplateKey = (type: string, segment: number) => `${type}|${segment}`;
export const segmentTemplateKey = (segmentType: string, role: string) =>
 `seg:${segmentType}:${role}`;

type BrushTemplates = Readonly<Record<string, readonly number[]>>;

/** Linear interpolation between bin centres of one template. */
function templateValue(template: readonly number[], local: number): number {
 const position = local * BRUSH_TEMPLATE_BINS - 0.5;
 const low = Math.max(0, Math.min(template.length - 1, Math.floor(position)));
 const high = Math.min(template.length - 1, low + 1);
 const fraction = Math.min(1, Math.max(0, position - low));
 return (template[low] ?? 1) * (1 - fraction) + (template[high] ?? 1) * fraction;
}

/**
 * Width multiplier (around 1) at a position along a classified stroke. Falls
 * back from the exact stroke kind to the segment's basic kind, then to 1.
 */
export function brushWidthAt(share: number, stroke: BrushClass, templates: BrushTemplates) {
 const { segment, local, role } = brushSegmentAt(share, stroke.cuts);
 const exact = templates[exactTemplateKey(stroke.type, segment)];
 if (exact) return templateValue(exact, local);
 const fallback = templates[segmentTemplateKey(stroke.segments[segment] ?? stroke.type, role)];
 return fallback ? templateValue(fallback, local) : 1;
}

/** Width multipliers for each point of a finished stroke, rounded for storage. */
export function brushWidthsForStroke(
 points: readonly BrushPoint[],
 em: number,
 templates: BrushTemplates,
): number[] {
 const stroke = classifyBrushStroke(points, em);
 const total = brushPathLength(points);
 let travelled = 0;
 return points.map((point, index) => {
  const previous = points[index - 1];
  if (previous) travelled += distance(previous, point);
  const share = total > 0 ? travelled / total : 0.5;
  return Math.round(Math.max(0.05, brushWidthAt(share, stroke, templates)) * 100) / 100;
 });
}

/** Discs at the ends and where the stroke turns more than this between samples. */
const JOINT_TURN_DEGREES = 35;
const DISC_SIDES = 10;
/** Geometry samples per average width: dense enough for smooth sides, few enough for a light path. */
const SAMPLES_PER_WIDTH = 2.5;
const MAX_OUTLINE_SAMPLES = 96;

/** Signed area of a polygon; the shapes of an outline are all wound the same way. */
function signedArea(polygon: readonly BrushPoint[]): number {
 let area = 0;
 polygon.forEach((point, index) => {
  const next = polygon[(index + 1) % polygon.length] ?? point;
  area += point.x * next.y - next.x * point.y;
 });
 return area / 2;
}

function subpath(polygon: readonly BrushPoint[]): string {
 const wound = signedArea(polygon) < 0 ? [...polygon].reverse() : polygon;
 const format = (value: number) => Math.round(value * 10) / 10;
 return `M ${wound.map((point) => `${format(point.x)} ${format(point.y)}`).join(" L ")} Z`;
}

function disc(center: BrushPoint, radius: number): BrushPoint[] {
 return Array.from({ length: DISC_SIDES }, (_, side) => {
  const angle = (side / DISC_SIDES) * Math.PI * 2;
  return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
 });
}

/**
 * The filled shape of a variable-width stroke (`widths` are absolute): a
 * quadrilateral between each pair of samples plus discs at the ends and at
 * turns. Every shape is wound the same way, so with the default non-zero fill
 * they union cleanly — sharp bends and hooks leave no holes or spikes, which
 * a single offset outline cannot guarantee.
 */
export function brushOutline(points: readonly BrushPoint[], widths: readonly number[]): string {
 const [first] = points;
 if (!first) return "";
 if (points.length === 1) return subpath(disc(first, (widths[0] ?? 1) / 2));
 const total = brushPathLength(points);
 const meanWidth = widths.reduce((sum, width) => sum + width, 0) / Math.max(1, widths.length);
 const count = Math.max(
  2,
  Math.min(MAX_OUTLINE_SAMPLES, Math.ceil((total / Math.max(0.5, meanWidth)) * SAMPLES_PER_WIDTH)),
 );
 // Resample points and widths together along the stroke.
 const shares: number[] = [0];
 for (let index = 1; index < points.length; index += 1) {
  const previous = points[index - 1] ?? first;
  const point = points[index] ?? previous;
  shares.push((shares[index - 1] ?? 0) + distance(previous, point) / (total || 1));
 }
 const samples = resampleBrushPoints(points, count);
 let segment = 1;
 const sampleWidths = samples.map((_, step) => {
  const share = step / (count - 1);
  while (segment < shares.length - 1 && (shares[segment] ?? 1) < share) segment += 1;
  const startShare = shares[segment - 1] ?? 0;
  const span = (shares[segment] ?? 1) - startShare;
  const fraction = span > 0 ? (share - startShare) / span : 0;
  const from = widths[segment - 1] ?? widths[0] ?? 1;
  const to = widths[segment] ?? from;
  return from + (to - from) * fraction;
 });
 // One normal per sample, shared by the two quadrilaterals that meet there,
 // so neighbouring shapes share their corners and curves leave no seams.
 const normals = samples.map((point, index) => {
  const before = samples[Math.max(0, index - 1)] ?? point;
  const after = samples[Math.min(samples.length - 1, index + 1)] ?? point;
  const length = distance(before, after) || 1;
  return { x: -(after.y - before.y) / length, y: (after.x - before.x) / length };
 });
 const turnAt = (index: number) => {
  const before = samples[index - 1];
  const point = samples[index];
  const after = samples[index + 1];
  if (!before || !point || !after) return 180;
  const ax = point.x - before.x;
  const ay = point.y - before.y;
  const bx = after.x - point.x;
  const by = after.y - point.y;
  const scale = Math.hypot(ax, ay) * Math.hypot(bx, by);
  if (scale === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / scale))) * 180) / Math.PI;
 };
 const offset = (index: number, side: number) => {
  const point = samples[index] ?? first;
  const normal = normals[index] ?? { x: 0, y: 0 };
  const half = ((sampleWidths[index] ?? 1) / 2) * side;
  return { x: point.x + normal.x * half, y: point.y + normal.y * half };
 };
 const shapes: string[] = [];
 for (let index = 1; index < samples.length; index += 1) {
  shapes.push(
   subpath([offset(index - 1, 1), offset(index, 1), offset(index, -1), offset(index - 1, -1)]),
  );
 }
 samples.forEach((point, index) => {
  // Round ends, and a disc where a bend is too sharp for a shared normal.
  if (turnAt(index) > JOINT_TURN_DEGREES) {
   shapes.push(subpath(disc(point, (sampleWidths[index] ?? 1) / 2)));
  }
 });
 return shapes.join(" ");
}
