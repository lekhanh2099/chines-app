import { describe, expect, it } from "vitest";

import type { ReaderSegment } from "../model/reader-document.types";
import { findReaderSegmentAtReadingLine } from "./useReaderPositionSync";

const segments: readonly ReaderSegment[] = [
 { id: "before", kind: "paragraph", zh: "第一段" },
 { id: "current", kind: "paragraph", zh: "第二段" },
 { id: "after", kind: "paragraph", zh: "第三段" },
];

describe("findReaderSegmentAtReadingLine", () => {
 it("selects the visible segment closest to the reading line", () => {
  const rects = new Map<string, { top: number; bottom: number }>([
   ["before", { top: 10, bottom: 40 }],
   ["current", { top: 45, bottom: 75 }],
   ["after", { top: 120, bottom: 150 }],
  ]);

  expect(
   findReaderSegmentAtReadingLine({
    segments,
    containerTop: 0,
    containerHeight: 200,
    getSegmentRect: (segmentId) => rects.get(segmentId) ?? null,
   }),
  ).toBe("current");
 });

 it("ignores segments outside the visible container", () => {
  const rects = new Map<string, { top: number; bottom: number }>([
   ["before", { top: -60, bottom: -10 }],
   ["current", { top: 20, bottom: 50 }],
   ["after", { top: 210, bottom: 240 }],
  ]);

  expect(
   findReaderSegmentAtReadingLine({
    segments,
    containerTop: 0,
    containerHeight: 200,
    getSegmentRect: (segmentId) => rects.get(segmentId) ?? null,
   }),
  ).toBe("current");
 });
});
