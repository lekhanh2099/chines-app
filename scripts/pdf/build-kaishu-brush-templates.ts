/**
 * Measures how wide KaiTi strokes are along their length, writes the Kaishu
 * brush templates, and checks the brush on characters it did not learn from.
 *
 * Data: hanzi-writer-data (makemeahanzi; stroke outlines from Arphic KaiTi,
 * Arphic Public License) — `npm pack hanzi-writer-data@2.0.1` and unpack it.
 *
 *   npm run pdf:kaishu-templates -- <hanzi-writer-data/package>
 *
 * Every family of strokes must match the font within 20% on at least 70% of
 * held-out strokes, written with handwriting-like noise at a size estimated
 * the way the app estimates it; otherwise nothing is written.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import {
 BRUSH_TEMPLATE_BINS,
 brushPathLength,
 brushSegmentAt,
 brushWidthAt,
 classifyBrushStroke,
 estimateBrushEm,
 exactTemplateKey,
 resampleBrushPoints,
 segmentTemplateKey,
 type BrushClass,
 type BrushPoint,
} from "../../src/features/reading/pdf/kaishu-brush.ts";

const EM = 1024;
const SAMPLES = 48;
/** Every bin of a template needs this many measured widths, or the fallback is used. */
const MIN_SAMPLES_PER_BIN = 15;
const REQUIRED_SHARE = 0.7;
const OUTPUT = "src/features/reading/pdf/kaishu-brush-templates.ts";

const characterSchema = z.object({
 strokes: z.array(z.string()),
 medians: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

const dataDir = process.argv[2];
if (!dataDir) throw new Error("Usage: build-kaishu-brush-templates.ts <hanzi-writer-data dir>");

// ---- outline geometry -------------------------------------------------------
const flip = (x: number, y: number): BrushPoint => ({ x, y: 900 - y });

function outlinePolygon(path: string): BrushPoint[] {
 const tokens = path.match(/[MLQCZ]|-?\d+(?:\.\d+)?/g) ?? [];
 const points: BrushPoint[] = [];
 let index = 0;
 let command = "";
 let current = flip(0, 0);
 const next = () => Number(tokens[index++]);
 const point = () => {
  const x = next();
  return flip(x, next());
 };
 while (index < tokens.length) {
  const token = tokens[index] ?? "";
  if (/[MLQCZ]/.test(token)) {
   command = token;
   index += 1;
   if (command === "Z") continue;
  }
  if (command === "M" || command === "L") {
   current = point();
   points.push(current);
  } else if (command === "Q") {
   const control = point();
   const end = point();
   for (let t = 0.125; t <= 1; t += 0.125) {
    const u = 1 - t;
    points.push({
     x: u * u * current.x + 2 * u * t * control.x + t * t * end.x,
     y: u * u * current.y + 2 * u * t * control.y + t * t * end.y,
    });
   }
   current = end;
  } else if (command === "C") {
   const first = point();
   const second = point();
   const end = point();
   for (let t = 0.125; t <= 1; t += 0.125) {
    const u = 1 - t;
    points.push({
     x: u ** 3 * current.x + 3 * u * u * t * first.x + 3 * u * t * t * second.x + t ** 3 * end.x,
     y: u ** 3 * current.y + 3 * u * u * t * first.y + 3 * u * t * t * second.y + t ** 3 * end.y,
    });
   }
   current = end;
  } else {
   index += 1;
  }
 }
 return points;
}

function distanceToSegment(point: BrushPoint, start: BrushPoint, end: BrushPoint): number {
 const dx = end.x - start.x;
 const dy = end.y - start.y;
 const lengthSquared = dx * dx + dy * dy;
 const along =
  lengthSquared === 0
   ? 0
   : Math.max(
      0,
      Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
     );
 return Math.hypot(point.x - (start.x + along * dx), point.y - (start.y + along * dy));
}

/**
 * True width at evenly spaced points of the median: the diameter of the
 * largest circle there that stays inside the outline. A ray across the
 * stroke would run along the other arm at a bend or hook and report it as
 * width.
 */
function trueWidths(median: readonly BrushPoint[], polygon: readonly BrushPoint[]): number[] {
 const samples = resampleBrushPoints(median, SAMPLES + 2).slice(1, -1);
 return samples.map((point) => {
  let nearest = Infinity;
  polygon.forEach((start, index) => {
   const end = polygon[(index + 1) % polygon.length] ?? start;
   nearest = Math.min(nearest, distanceToSegment(point, start, end));
  });
  return nearest * 2;
 });
}

// ---- handwriting-like input ---------------------------------------------------
let seed = 7;
const random = () => {
 seed = (seed * 1103515245 + 12345) % 2 ** 31;
 return (seed / 2 ** 31) * 2 - 1;
};
/** Slant (±8°), a shaky hand (±6 units) and stylus-like sampling that rounds corners. */
function handwritten(median: readonly BrushPoint[]): BrushPoint[] {
 const [origin] = median;
 if (!origin) return [];
 const slant = (random() * 8 * Math.PI) / 180;
 const shaken = resampleBrushPoints(median, 20).map((point) => {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
   x: origin.x + dx * Math.cos(slant) - dy * Math.sin(slant) + random() * 6,
   y: origin.y + dx * Math.sin(slant) + dy * Math.cos(slant) + random() * 6,
  };
 });
 return shaken.map((point, index) => {
  const before = shaken[index - 1];
  const after = shaken[index + 1];
  if (!before || !after) return point;
  return { x: (before.x + 2 * point.x + after.x) / 4, y: (before.y + 2 * point.y + after.y) / 4 };
 });
}

// ---- load -------------------------------------------------------------------
type Sample = { train: boolean; seen: BrushPoint[]; truth: number[]; character: number };
const samples: Sample[] = [];
const lengthsByCharacter = new Map<number, number[]>();
let widthSum = 0;
let widthCount = 0;

readdirSync(dataDir)
 .filter((file) => file.endsWith(".json") && [...file.replace(".json", "")].length === 1)
 .forEach((file, character) => {
  const data = characterSchema.parse(JSON.parse(readFileSync(join(dataDir, file), "utf8")));
  data.strokes.forEach((path, strokeIndex) => {
   const median = (data.medians[strokeIndex] ?? []).map(([x, y]) => flip(x, y));
   if (median.length < 2) return;
   const widths = trueWidths(median, outlinePolygon(path));
   const finite = widths.filter(Number.isFinite);
   if (finite.length < SAMPLES * 0.8) return;
   const mean = finite.reduce((sum, width) => sum + width, 0) / finite.length;
   widthSum += mean;
   widthCount += 1;
   const seen = handwritten(median);
   lengthsByCharacter.set(character, [
    ...(lengthsByCharacter.get(character) ?? []),
    brushPathLength(seen),
   ]);
   samples.push({
    train: character % 2 === 0,
    seen,
    truth: widths.map((width) => width / mean),
    character,
   });
  });
 });

// How much larger than its median stroke a character is (learned on the training half).
const ratios = [...lengthsByCharacter.entries()]
 .filter(([character]) => character % 2 === 0)
 .map(([, lengths]) => EM / estimateBrushEm(lengths, 1))
 .filter(Number.isFinite)
 .sort((left, right) => left - right);
const emPerMedianStroke = ratios[Math.floor(ratios.length / 2)] ?? 3;
const emOf = (sample: Sample) =>
 estimateBrushEm(lengthsByCharacter.get(sample.character) ?? [EM], emPerMedianStroke);

// ---- templates ----------------------------------------------------------------
const shareAt = (index: number) => (index + 1) / (SAMPLES + 1);

function learn(from: readonly Sample[]) {
 const bins = new Map<string, number[][]>();
 const add = (key: string, bin: number, width: number) => {
  const slots = bins.get(key) ?? Array.from({ length: BRUSH_TEMPLATE_BINS }, (): number[] => []);
  slots[bin]?.push(width);
  bins.set(key, slots);
 };
 for (const sample of from) {
  const stroke = classifyBrushStroke(sample.seen, emOf(sample));
  sample.truth.forEach((width, index) => {
   if (!Number.isFinite(width)) return;
   const { segment, local, role } = brushSegmentAt(shareAt(index), stroke.cuts);
   const bin = Math.min(BRUSH_TEMPLATE_BINS - 1, Math.floor(local * BRUSH_TEMPLATE_BINS));
   add(exactTemplateKey(stroke.type, segment), bin, width);
   add(segmentTemplateKey(stroke.segments[segment] ?? stroke.type, role), bin, width);
  });
 }
 const templates: Record<string, number[]> = {};
 for (const [key, slots] of bins) {
  const counts = slots.map((slot) => slot.length);
  if (Math.min(...counts) < MIN_SAMPLES_PER_BIN) continue;
  templates[key] = slots.map((slot) => {
   const sorted = [...slot].sort((left, right) => left - right);
   return Math.round((sorted[Math.floor(sorted.length / 2)] ?? 1) * 100) / 100;
  });
 }
 return templates;
}

// ---- evaluate on held-out characters ---------------------------------------------
const family = (stroke: BrushClass) => {
 if (stroke.type.startsWith("zhe:")) return "zhe";
 if (stroke.type.startsWith("gou:")) return "gou";
 if (stroke.type.startsWith("na_")) return "na";
 return stroke.type;
};
const trained = learn(samples.filter((sample) => sample.train));
const results = new Map<string, { total: number; within: number }>();
for (const sample of samples.filter((candidate) => !candidate.train)) {
 const stroke = classifyBrushStroke(sample.seen, emOf(sample));
 const predicted = sample.truth.map((_, index) => brushWidthAt(shareAt(index), stroke, trained));
 const mean = predicted.reduce((sum, width) => sum + width, 0) / predicted.length;
 const pairs = sample.truth
  .map((truth, index) => ({ truth, predicted: (predicted[index] ?? 1) / mean }))
  .filter(({ truth }) => Number.isFinite(truth));
 const error =
  pairs.reduce((sum, pair) => sum + Math.abs(pair.predicted - pair.truth) / pair.truth, 0) /
  pairs.length;
 const name = family(stroke);
 const result = results.get(name) ?? { total: 0, within: 0 };
 result.total += 1;
 if (error <= 0.2) result.within += 1;
 results.set(name, result);
}
const report = [...results.entries()]
 .filter(([, result]) => result.total >= 50)
 .map(([name, result]) => ({
  family: name,
  strokes: result.total,
  within20: Math.round((result.within / result.total) * 100),
 }));
console.table(report);
const failing = report.filter((row) => row.within20 < REQUIRED_SHARE * 100);
if (failing.length) {
 throw new Error(`Below ${REQUIRED_SHARE * 100}%: ${failing.map((row) => row.family).join(", ")}`);
}

// ---- write the templates learned from every character ------------------------------
const templates = learn(samples);
const widthPerEm = Math.round((widthSum / widthCount / EM) * 1000) / 1000;
const body = Object.entries(templates)
 .sort(([left], [right]) => left.localeCompare(right))
 .map(([key, values]) => ` ${JSON.stringify(key)}: [${values.join(", ")}],`)
 .join("\n");
writeFileSync(
 OUTPUT,
 `// Generated by scripts/pdf/build-kaishu-brush-templates.ts from hanzi-writer-data
// (makemeahanzi, stroke outlines from Arphic KaiTi, Arphic Public License).
// Median KaiTi width profiles; do not edit by hand.

/** A character is this many times longer than its median stroke. */
export const KAISHU_EM_PER_MEDIAN_STROKE = ${Math.round(emPerMedianStroke * 1000) / 1000};
/** Mean KaiTi stroke width as a share of the character size. */
export const KAISHU_WIDTH_PER_EM = ${widthPerEm};

export const KAISHU_BRUSH_TEMPLATES: Readonly<Record<string, readonly number[]>> = {
${body}
};
`,
);
console.log(`Wrote ${Object.keys(templates).length} templates to ${OUTPUT}`);
