import { describe, expect, it } from "vitest";

import {
 buildReaderSourceHref,
 parseReaderSourceTarget,
} from "@/features/reading/model/reading-source-target";

describe("reader source targets", () => {
 it.each([
  "/hsk/han-thuong-mai?book=tm2&lesson=1",
  "/hsk/nhip-cau-han-ngu?lesson=2",
  "/hsk/doc-hieu?lesson=3",
 ])("preserves the textbook route and lesson for %s", (baseHref) => {
  const target = {
   source: "reader-highlight",
   documentId: "textbook:text",
   paragraphId: "paragraph-2",
   startOffset: 2,
   endOffset: 4,
  } satisfies Parameters<typeof buildReaderSourceHref>[0];
  const href = new URL(buildReaderSourceHref(target, baseHref), "https://app.example");
  const base = new URL(baseHref, "https://app.example");
  expect(href.pathname).toBe(base.pathname);
  expect(href.searchParams.get("lesson")).toBe(base.searchParams.get("lesson"));
  expect(href.searchParams.get("book")).toBe(base.searchParams.get("book"));
  expect(parseReaderSourceTarget(href.searchParams)).toEqual(target);
 });
 it("round-trips a document paragraph and selected range", () => {
  const href = buildReaderSourceHref({
   source: "reader-selection",
   documentId: "doc-1",
   paragraphId: "paragraph-2",
   startOffset: 4,
   endOffset: 9,
  });
  const target = parseReaderSourceTarget(new URL(href, "https://app.example").searchParams);

  expect(target).toEqual({
   source: "reader-selection",
   documentId: "doc-1",
   paragraphId: "paragraph-2",
   startOffset: 4,
   endOffset: 9,
  });
 });

 it("round-trips paragraph-only shadowing context", () => {
  const href = buildReaderSourceHref({
   source: "shadowing",
   documentId: "doc-2",
   paragraphId: "paragraph-3",
  });

  expect(parseReaderSourceTarget(new URL(href, "https://app.example").searchParams)).toEqual({
   source: "shadowing",
   documentId: "doc-2",
   paragraphId: "paragraph-3",
  });
 });

 it("rejects incomplete and reversed ranges", () => {
  expect(
   parseReaderSourceTarget(
    new URLSearchParams({
     source: "reader-selection",
     document: "doc-1",
     paragraph: "p-1",
     start: "5",
    }),
   ),
  ).toBeNull();
  expect(
   parseReaderSourceTarget(
    new URLSearchParams({
     source: "reader-selection",
     document: "doc-1",
     paragraph: "p-1",
     start: "5",
     end: "4",
    }),
   ),
  ).toBeNull();
 });
});
