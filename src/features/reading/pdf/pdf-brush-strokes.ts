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
 * A finished character tells the size of the next one when it is within
 * this range of the writing size: smaller is punctuation (、，。) or a lone
 * flat stroke such as 一.
 */
const OWN_SIZE_RANGE = { min: 0.25, max: 3 };
/** A group this much shorter than the character beside it, and this close to it, is part of it. */
const PART_HEIGHT_RATIO = 1.5;
const PART_MAX_GAP = 0.5;
/** A stroke further than this (in character sizes) from the writing just before starts somewhere new. */
const NEIGHBOUR_REACH_IN_EM = 1.5;
/** A stroke this close to the character just written, and not to its right, continues it. */
const CONTINUE_GAP_IN_EM = 0.3;
/** Characters just written that must all agree before the weight follows a new writing size… */
const SIZE_WITNESSES = 3;
/** …each this much larger or smaller than the page's size. */
const SIZE_CHANGE = 0.35;
/** Strokes the first character at a new place needs before the next one follows its size. */
const OPENING_CHARACTER_STROKES = 3;
/** A stroke this close to the right of the character just written is a separate part of it. */
const SAME_CHARACTER_GAP_IN_EM = 0.08;
/** The weight in use is kept while it is this close to the size the writing calls for. */
const KEEP_WEIGHT = 0.15;
/** Strokes a character needs before a stroke to its right is taken for the next character. */
const MIN_CHARACTER_STROKES = 2;
/** A stroke "starts to the right" even if it overlaps the character's right edge by this share. */
const RIGHT_OVERLAP = 0.1;
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

/** The character size a finished brush stroke was weighed for, from its width. */
function emOfWeight(stroke: PdfStroke, widthSetting: number): number {
 return (
  stroke.width / (KAISHU_WIDTH_PER_EM * BRUSH_WEIGHT * (widthSetting / DEFAULT_WIDTH_SETTING))
 );
}

function boxOf(points: readonly BrushPoint[]): BrushBox {
 return {
  minX: Math.min(...points.map((point) => point.x)),
  minY: Math.min(...points.map((point) => point.y)),
  maxX: Math.max(...points.map((point) => point.x)),
  maxY: Math.max(...points.map((point) => point.y)),
 };
}

function boxGap(first: BrushBox, second: BrushBox): number {
 const dx = Math.max(second.minX - first.maxX, 0, first.minX - second.maxX);
 const dy = Math.max(second.minY - first.maxY, 0, first.minY - second.maxY);
 return Math.hypot(dx, dy);
}

/**
 * The size the latest stroke is weighed for, decided from the writing just
 * before it — handwriting drifts and slants, so no line is assumed, only
 * writing order, closeness and that characters follow each other rightwards:
 * - inside or over the character just written: another stroke of it, at the
 *   size the previous stroke was given, so a character is even;
 * - starting to its right: the next character (or a separate right part of
 *   the same one, such as 尔 in 你), at the same weight while that stays near
 *   the page's size, or the new size when the writing changed size;
 * - anywhere else: `pageEm`.
 */
function strokeEm(
 recent: readonly PdfStroke[],
 points: readonly BrushPoint[][],
 pageEm: number,
 widthSetting: number,
): number {
 const before = points.slice(0, -1);
 const previous = recent.at(-2);
 const stroke = points.at(-1);
 if (!before.length || !previous?.widths || !stroke?.length) return pageEm;
 // Group what came before at the larger of the weight in use and the page's
 // size. Grouping too small splits characters (李 into 木 and 子) and
 // under-measures them; grouping large only joins neighbours side by side,
 // which keeps the height. So neither a weight left small by smaller writing
 // nor a page size dipping for a moment can mis-measure what follows.
 const current = emOfWeight(previous, widthSetting);
 const box = Math.max(current, pageEm) / KAISHU_EM_PER_CHARACTER_BOX;
 const { heights, boxes, members } = brushCharacterSizes(before, box);
 const index = boxes.length - 1;
 const written = boxes[index];
 if (!written) return pageEm;
 const sizeOf = (group: number) =>
  (partOfNeighbour(boxes, group, box) ?? heights[group] ?? 0) * KAISHU_EM_PER_CHARACTER_HEIGHT;
 const ownEm = sizeOf(index);
 const share = ownEm / pageEm;
 const sized = share >= OWN_SIZE_RANGE.min && share <= OWN_SIZE_RANGE.max;
 const scale = sized ? ownEm : pageEm;
 const next = boxOf(stroke);
 const gap = boxGap(next, written);
 if (gap > scale * NEIGHBOUR_REACH_IN_EM) return pageEm;
 const startsRight = next.minX >= written.maxX - (written.maxX - written.minX) * RIGHT_OVERLAP;
 // A single stroke is not a character yet: what follows continues it.
 const formed = members.filter((member) => member === index).length >= MIN_CHARACTER_STROKES;
 if (!(startsRight && formed) && gap <= scale * CONTINUE_GAP_IN_EM) return current;
 // Right against it: a separate right part of the same character (青 in 情).
 if (gap <= scale * SAME_CHARACTER_GAP_IN_EM) return current;
 // The writing changed size only when the three characters just written all
 // measure clearly bigger or smaller than the page's size — one or two
 // oddly grouped characters (the top of 鼎 on its own) are not enough.
 // The character just written opened a new place (a new line, a note in the
 // margin): it is the only word on the size there, so the next character
 // follows it once it is formed.
 const before2 = boxes[index - 1];
 const opened = !before2 || boxGap(before2, written) > scale * NEIGHBOUR_REACH_IN_EM;
 const established =
  members.filter((member) => member === index).length >= OPENING_CHARACTER_STROKES;
 if (sized && opened && established) {
  return Math.abs(current / ownEm - 1) > KEEP_WEIGHT ? ownEm : current;
 }
 const witnesses = [ownEm];
 for (let group = index - 1; sized && group >= 0 && witnesses.length < SIZE_WITNESSES; group -= 1) {
  const candidate = boxes[group];
  const later = boxes[group + 1];
  if (!candidate || !later || boxGap(candidate, later) > scale * NEIGHBOUR_REACH_IN_EM) break;
  witnesses.push(sizeOf(group));
 }
 const complete = sized && witnesses.length >= SIZE_WITNESSES;
 const changedSize =
  complete &&
  (witnesses.every((em) => em < pageEm * (1 - SIZE_CHANGE)) ||
   witnesses.every((em) => em > pageEm * (1 + SIZE_CHANGE)));
 // The next character — or the separate right part of the same character —
 // keeps the weight in use, so neighbours and parts stay even. It moves to
 // the new size when the writing changed size, or back to the page's size
 // when the weight has drifted away from it and the two characters just
 // written agree with the page rather than with the weight (right after a
 // few characters the page's size is still unsteady).
 if (changedSize) {
  const size = [...witnesses].sort((low, high) => low - high)[1] ?? ownEm;
  return Math.abs(current / size - 1) > KEEP_WEIGHT ? size : current;
 }
 const drifted = Math.abs(current / pageEm - 1) > KEEP_WEIGHT;
 const pageAgrees =
  witnesses.length >= 2 &&
  witnesses.slice(0, 2).every((em) => Math.abs(em - pageEm) < Math.abs(em - current));
 return drifted && pageAgrees ? pageEm : current;
}

/**
 * Finishes the brush stroke `strokeId` once and for all: strokes already on
 * the page never change. The stroke is weighed for the size of the character
 * it belongs to —
 * - a later stroke of a character takes the size its first stroke was given,
 *   so a character is even;
 * - a character's first stroke takes the size of the characters written
 *   just before it when it is close to them (their own height), else the
 *   size estimated from the
 *   characters on the page, else `priorEm` (the writer's usual size, 0 when
 *   unknown), else a first guess from the strokes so far.
 *
 * `learnedEm` is the settled size of the writing (0 until enough characters
 * are finished), for remembering the writer's usual size.
 */
export function finishPdfBrushStroke(
 strokes: readonly PdfStroke[],
 strokeId: string,
 aspect: number,
 widthSetting: number,
 priorEm: number,
): { strokes: PdfStroke[]; learnedEm: number } {
 const recent = strokes.filter((stroke) => stroke.tool === "brush").slice(-SIZE_FROM_STROKES);
 const finished = recent.at(-1);
 // Only the stroke just drawn (the latest brush stroke) is finished here.
 if (!finished || finished.id !== strokeId) return { strokes: [...strokes], learnedEm: 0 };
 const points = recent.map((stroke) => isotropicPoints(stroke, aspect));
 const estimate = estimateWritingEm(
  points,
  KAISHU_EM_PER_CHARACTER_BOX,
  KAISHU_EM_PER_CHARACTER_HEIGHT,
 );
 const pageEm = estimate.settled ? estimate.em : priorEm || estimate.em;
 const em = strokeEm(recent, points, pageEm, widthSetting);
 const weighed = weighBrushStroke(finished, em, aspect, widthSetting);
 return {
  strokes: strokes.map((stroke) => (stroke.id === strokeId ? weighed : stroke)),
  learnedEm: estimate.settled ? estimate.em : 0,
 };
}

/** The filled outline of a finished brush stroke, in isotropic units. */
export function pdfBrushOutlinePath(stroke: PdfStroke, aspect: number): string {
 const widths = stroke.widths ?? [];
 return brushOutline(
  isotropicPoints(stroke, aspect),
  widths.map((multiplier) => multiplier * stroke.width),
 );
}
