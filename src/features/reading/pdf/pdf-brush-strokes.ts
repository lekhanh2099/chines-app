import type { PdfStroke } from "@/features/reading/pdf/pdf-annotations";
import {
 brushCharacterSizes,
 brushOutline,
 brushWidthsForStroke,
 estimateWritingEm,
 type BrushBox,
 type BrushPoint,
} from "@/features/reading/pdf/kaishu-brush";
import {
 KAISHU_BRUSH_TEMPLATES,
 KAISHU_EM_PER_CHARACTER_BOX,
 KAISHU_EM_PER_CHARACTER_HEIGHT,
 KAISHU_WIDTH_PER_EM,
} from "@/features/reading/pdf/kaishu-brush-templates";

/** Brush strokes looked back over to estimate the size of the characters being written. */
const SIZE_FROM_STROKES = 150;
/**
 * Finished characters are re-weighed for their own size when it is within
 * this range of the writing size: smaller is
 * punctuation (、，。) or a lone flat stroke such as 一.
 */
const OWN_SIZE_RANGE = { min: 0.4, max: 3 };
/** A group this much shorter than the character beside it, and this close to it, is part of it. */
const PART_HEIGHT_RATIO = 1.5;
const PART_MAX_GAP = 0.5;
/** Finished characters among this many latest strokes are re-weighed… */
const REWEIGH_STROKES = 60;
/** …when their weight is off by more than this share. */
const REWEIGH_TOLERANCE = 0.08;
/** The default pen-width setting; the brush weight scales with it. */
const DEFAULT_WIDTH_SETTING = 4;
/**
 * A brush is noticeably heavier than the printed KaiTi face the templates
 * come from; at its weight, handwriting-sized characters read like a pencil.
 */
const BRUSH_WEIGHT = 1.4;
/**
 * Written brush strokes contrast more than a printed face: the KaiTi swell
 * and taper are kept where they are and made this much stronger.
 */
const BRUSH_CONTRAST = 1.35;
const MIN_MULTIPLIER = 0.12;
const MAX_MULTIPLIER = 2.2;
const MAX_STROKE_WIDTH = 64;

/**
 * Page-normalised points in isotropic units: 1000 across the page, and the
 * same unit downwards (`aspect` is the page's height over its width).
 */
export function isotropicPoints(stroke: PdfStroke, aspect: number): BrushPoint[] {
 return stroke.points.map((point) => ({ x: point.x * 1000, y: point.y * 1000 * aspect }));
}

/**
 * When the group at `index` is a detached part of the character beside it
 * (口 on the left of 嚷), that character's height; otherwise nothing. A part
 * is clearly shorter than its neighbour, lies within its height, and sits
 * right next to it.
 */
function partOfNeighbour(boxes: readonly BrushBox[], index: number, typicalBox: number) {
 const part = boxes[index];
 if (!part) return undefined;
 const height = part.maxY - part.minY;
 const neighbours = [boxes[index - 1], boxes[index + 1]].filter((box) => box !== undefined);
 const hosts = neighbours.filter((host) => {
  const hostHeight = host.maxY - host.minY;
  const within = Math.min(part.maxY, host.maxY) - Math.max(part.minY, host.minY) >= height * 0.8;
  const gap = Math.max(host.minX - part.maxX, part.minX - host.maxX);
  return hostHeight >= height * PART_HEIGHT_RATIO && within && gap <= typicalBox * PART_MAX_GAP;
 });
 if (!hosts.length) return undefined;
 return Math.max(...hosts.map((host) => host.maxY - host.minY));
}

/** A clean width for the line drawn while a brush stroke is in progress. */
export function liveBrushWidth(strokes: readonly PdfStroke[], widthSetting: number): number {
 const previous = strokes.findLast((stroke) => stroke.tool === "brush");
 return previous?.width ?? widthSetting * 2;
}

/** Weights for smoothing the width along the stroke (a short binomial window). */
const WIDTH_SMOOTHING = [1, 4, 6, 4, 1];

/** Stronger contrast after smoothing, so the weight flows along the stroke without jumps. */
function brushMultipliers(widths: readonly number[]): number[] {
 const reach = Math.floor(WIDTH_SMOOTHING.length / 2);
 return widths.map((width, index) => {
  let total = 0;
  let weight = 0;
  WIDTH_SMOOTHING.forEach((factor, offset) => {
   const neighbour = widths[index + offset - reach];
   if (neighbour === undefined) return;
   total += neighbour * factor;
   weight += factor;
  });
  const smoothed = weight > 0 ? total / weight : width;
  const contrasted = 1 + (smoothed - 1) * BRUSH_CONTRAST;
  return Math.round(Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, contrasted)) * 100) / 100;
 });
}

/** Fixes the Kaishu profile and weight of one brush stroke for a character size `em`. */
function weighBrushStroke(
 stroke: PdfStroke,
 em: number,
 aspect: number,
 widthSetting: number,
): PdfStroke {
 const widths = brushMultipliers(
  brushWidthsForStroke(isotropicPoints(stroke, aspect), em, KAISHU_BRUSH_TEMPLATES),
 );
 const natural = KAISHU_WIDTH_PER_EM * em * BRUSH_WEIGHT * (widthSetting / DEFAULT_WIDTH_SETTING);
 const width = Math.round(Math.min(MAX_STROKE_WIDTH, Math.max(1, natural)) * 100) / 100;
 return { ...stroke, width, widths };
}

/**
 * Finishes the brush stroke `strokeId`. It is weighed for the size of the
 * characters being written, and the finished characters before it are
 * re-weighed for their own size, so simple and dense characters, and a
 * change of writing size, all come out even. Other strokes are returned as
 * they are.
 */
export function finishPdfBrushStroke(
 strokes: readonly PdfStroke[],
 strokeId: string,
 aspect: number,
 widthSetting: number,
): PdfStroke[] {
 const recent = strokes.filter((stroke) => stroke.tool === "brush").slice(-SIZE_FROM_STROKES);
 const finished = recent.at(-1);
 // Only the stroke just drawn (the latest brush stroke) is finished here.
 if (!finished || finished.id !== strokeId) return [...strokes];
 const points = recent.map((stroke) => isotropicPoints(stroke, aspect));
 const em = estimateWritingEm(points, KAISHU_EM_PER_CHARACTER_BOX, KAISHU_EM_PER_CHARACTER_HEIGHT);
 const box = em / KAISHU_EM_PER_CHARACTER_BOX;
 // Re-weigh the finished characters among the latest strokes for their own
 // size, one weight per character, measured by its height.
 const { heights, boxes, members: characters } = brushCharacterSizes(points, box);
 const inProgress = characters.at(-1) ?? -1;
 const ownHeights = heights.map((height, index) => partOfNeighbour(boxes, index, box) ?? height);
 const reweighed = new Map<string, PdfStroke>();
 const firstChecked = Math.max(0, recent.length - REWEIGH_STROKES);
 recent.forEach((stroke, index) => {
  const character = characters[index] ?? -1;
  if (index < firstChecked || character < 0) return;
  // The character in progress follows the latest estimate, so its strokes
  // stay even with each other while it is written; finished characters take
  // their own height.
  const ownEm =
   character === inProgress ? em : (ownHeights[character] ?? 0) * KAISHU_EM_PER_CHARACTER_HEIGHT;
  const share = ownEm / em;
  if (share < OWN_SIZE_RANGE.min || share > OWN_SIZE_RANGE.max) return;
  const target = weighBrushStroke(stroke, ownEm, aspect, widthSetting);
  // Leave strokes that are already about right, so finished ink stays put.
  if (Math.abs(target.width - stroke.width) > stroke.width * REWEIGH_TOLERANCE) {
   reweighed.set(stroke.id, target);
  }
 });
 reweighed.set(strokeId, weighBrushStroke(finished, em, aspect, widthSetting));
 return strokes.map((stroke) => reweighed.get(stroke.id) ?? stroke);
}

/** The filled outline of a finished brush stroke, in isotropic units. */
export function pdfBrushOutlinePath(stroke: PdfStroke, aspect: number): string {
 const widths = stroke.widths ?? [];
 return brushOutline(
  isotropicPoints(stroke, aspect),
  widths.map((multiplier) => multiplier * stroke.width),
 );
}
